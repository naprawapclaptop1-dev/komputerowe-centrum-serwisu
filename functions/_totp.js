import { nowIso, randomToken, sha256Hex } from './_lib.js';

const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = value => Uint8Array.from(atob(String(value || '')), c => c.charCodeAt(0));
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const byte of new Uint8Array(bytes)) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += base32Alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits) out += base32Alphabet[(value << (5 - bits)) & 31];
  return out;
}
export function decodeBase32(input) {
  const text = String(input || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0, value = 0; const out = [];
  for (const char of text) {
    const index = base32Alphabet.indexOf(char); if (index < 0) throw new Error('Nieprawidłowy sekret TOTP.');
    value = (value << 5) | index; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Uint8Array.from(out);
}
function encryptionKey(env) {
  const raw = String(env?.AUTH_TOTP_ENCRYPTION_KEY || '').trim();
  if (!raw) throw new Error('Brak sekretu AUTH_TOTP_ENCRYPTION_KEY w Cloudflare Pages.');
  const bytes = unb64(raw);
  if (bytes.length !== 32) throw new Error('AUTH_TOTP_ENCRYPTION_KEY musi zawierać 32 bajty w Base64.');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function encryptTotpSecret(secret, env) {
  const key = await encryptionKey(env); const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(secret));
  return { cipher: b64(cipher), iv: b64(iv) };
}
export async function decryptTotpSecret(cipher, iv, env) {
  const key = await encryptionKey(env);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(cipher));
  return new TextDecoder().decode(plain);
}
export function generateTotpSecret() { return encodeBase32(crypto.getRandomValues(new Uint8Array(20))); }
export async function totpCode(secret, timeMs = Date.now()) {
  const keyBytes = decodeBase32(secret);
  const counter = BigInt(Math.floor(timeMs / 30000));
  const msg = new Uint8Array(8); let value = counter;
  for (let i = 7; i >= 0; i--) { msg[i] = Number(value & 255n); value >>= 8n; }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const offset = mac[mac.length - 1] & 15;
  const binary = ((mac[offset] & 127) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(binary % 1000000).padStart(6, '0');
}
export async function verifyTotp(secret, supplied, now = Date.now()) {
  const code = String(supplied || '').replace(/\s/g, ''); if (!/^\d{6}$/.test(code)) return false;
  for (const offset of [-30000, 0, 30000]) {
    const expected = await totpCode(secret, now + offset);
    let diff = 0; for (let i = 0; i < 6; i++) diff |= expected.charCodeAt(i) ^ code.charCodeAt(i);
    if (diff === 0) return true;
  }
  return false;
}
export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    return [...bytes].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  });
}
export async function hashRecoveryCode(code) { return sha256Hex(String(code || '').replace(/[^a-f0-9]/gi, '').toUpperCase()); }
export async function createTotpChallenge(env, userId) {
  const token = randomToken(), now = nowIso(), expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await env.DB.prepare('DELETE FROM academy_totp_login_challenges WHERE user_id=? OR expires_at<?').bind(userId, now).run();
  await env.DB.prepare('INSERT INTO academy_totp_login_challenges(token_hash,user_id,created_at,expires_at,attempts) VALUES(?,?,?,?,0)')
    .bind(await sha256Hex(token), userId, now, expires).run();
  return { token, expiresAt: expires };
}
export function totpChallengeCookie(token, clear = false) {
  return `academy_2fa=${clear ? '' : encodeURIComponent(token)}; Path=/api/auth/totp/verify; HttpOnly; Secure; SameSite=Lax; Max-Age=${clear ? 0 : 300}`;
}
export function readTotpChallengeCookie(request) {
  for (const part of String(request.headers.get('cookie') || '').split(';')) {
    const index = part.indexOf('='); if (index < 0 || part.slice(0, index).trim() !== 'academy_2fa') continue;
    try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return ''; }
  }
  return '';
}
