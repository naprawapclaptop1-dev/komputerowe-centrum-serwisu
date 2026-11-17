const COOKIE = 'academy_sid';
export const CONSENT_VERSION = '2026-10-31-v2';
export const ACCOUNT_TERMS_VERSION = '2026-11-02-v1';
export const nowIso = () => new Date().toISOString();
export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extra }
});
export const text = (value, max = 2000) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
export async function readJson(request, maxBytes = 20000) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) throw new Error('Treść żądania jest za duża.');
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error('Treść żądania jest za duża.');
  try { return JSON.parse(raw || '{}'); } catch { throw new Error('Nieprawidłowy JSON.'); }
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
function cookieValue(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return '';
}
export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
export function sessionCookie(token) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=15552000`;
}
export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
export async function hashedClientRateKey(request, prefix) {
  // Never store the source IP. Only a one-way digest is used for short-window abuse throttling.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown-client';
  const digest = await sha256Hex(`${prefix}:${ip}`);
  return `${prefix}:${digest}`;
}

export async function getSession(request, env) {
  if (!env?.DB) return null;
  const token = cookieValue(request, COOKIE);
  if (!token || token.length < 40 || token.length > 100) return null;
  const tokenHash = await sha256Hex(token);
  let row = null;
  try {
    row = await env.DB.prepare(`
      SELECT u.id, u.nickname, u.email_normalized, u.consent_at, u.consent_version, u.locale, u.created_at,
             s.expires_at
      FROM academy_sessions s JOIN academy_users u ON u.id=s.user_id
      WHERE s.token_hash=? AND s.expires_at > ? LIMIT 1
    `).bind(tokenHash, nowIso()).first();
  } catch (error) {
    // Backward compatibility: pseudonym profiles must still work if email migration 0006 is pending.
    const message = String(error?.message || error || '');
    if (!/email_normalized|no such column/i.test(message)) throw error;
    row = await env.DB.prepare(`
      SELECT u.id, u.nickname, NULL AS email_normalized, u.consent_at, u.consent_version, u.locale, u.created_at,
             s.expires_at
      FROM academy_sessions s JOIN academy_users u ON u.id=s.user_id
      WHERE s.token_hash=? AND s.expires_at > ? LIMIT 1
    `).bind(tokenHash, nowIso()).first();
  }
  if (row) await env.DB.prepare('UPDATE academy_users SET last_seen_at=? WHERE id=?').bind(nowIso(), row.id).run();
  return row || null;
}
export async function requireSession(request, env) {
  const user = await getSession(request, env);
  if (!user) return { error: json({ error: 'SESSION_REQUIRED', message: 'Włącz dobrowolną synchronizację, aby zapisywać historię w chmurze.' }, 401), user: null };
  return { error: null, user };
}
export function requireConsent(user) {
  return !!(user && user.consent_at && user.consent_version === CONSENT_VERSION);
}
export async function rateLimit(env, key, limit = 12, windowSeconds = 60) {
  if (!env?.DB) return true;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const row = await env.DB.prepare('SELECT request_count FROM academy_account_rate_limits_v3 WHERE bucket_key=? AND window_start=?')
    .bind(key, windowStart).first();
  if (Number(row?.request_count || 0) >= limit) return false;
  // v3 is created by migration 0015 with a single-column PRIMARY KEY(bucket_key).
  await env.DB.prepare(`INSERT INTO academy_account_rate_limits_v3 (bucket_key,window_start,request_count)
    VALUES (?,?,1) ON CONFLICT(bucket_key) DO UPDATE SET
    window_start=excluded.window_start,
    request_count=CASE WHEN academy_account_rate_limits_v3.window_start=excluded.window_start THEN academy_account_rate_limits_v3.request_count+1 ELSE 1 END`)
    .bind(key, windowStart).run();
  return true;
}
export function safeUrls(input) {
  const arr = Array.isArray(input) ? input.slice(0, 8) : [];
  return arr.map(x => text(x, 500)).filter(x => {
    try { const u = new URL(x); return u.protocol === 'https:'; } catch { return false; }
  });
}
export async function checkAdmin(request, env) {
  const expected = env?.ADMIN_REVIEW_TOKEN;
  const header = request.headers.get('authorization') || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!expected || !supplied || supplied.length > 256) return false;
  const a = new TextEncoder().encode(expected), b = new TextEncoder().encode(supplied);
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
export function dbRequired(env) {
  return env?.DB ? null : json({ error: 'DATABASE_NOT_CONFIGURED', message: 'Brak połączenia z istniejącą bazą D1. Sprawdź istniejący plik wrangler.toml, wrangler.json lub wrangler.jsonc i binding DB. Nie twórz nowej bazy.' }, 503);
}

// FIX211: zapis zdarzeń konta bez surowych adresów IP, agentów, tokenów ani haseł.
export async function recordSecurityEvent(env, userId, eventType, details = {}) {
  if (!env?.DB || !userId) return false;
  const allowed = new Set(['oauth_login','account_linked','sessions_revoked','totp_enabled','totp_disabled','recovery_codes_regenerated','email_verified','password_reset']);
  if (!allowed.has(String(eventType))) return false;
  const provider = ['google','microsoft','facebook','github','discord'].includes(String(details.provider || '').toLowerCase()) ? String(details.provider).toLowerCase() : null;
  const safeDetails = {};
  if (Number.isInteger(Number(details.revoked)) && Number(details.revoked) >= 0) safeDetails.revoked = Number(details.revoked);
  if (typeof details.method === 'string' && ['email','oauth','totp','recovery'].includes(details.method)) safeDetails.method = details.method;
  try {
    await env.DB.prepare('INSERT INTO academy_security_events(event_id,user_id,event_type,provider,details_json,created_at) VALUES(?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), String(userId), String(eventType), provider, JSON.stringify(safeDetails), nowIso()).run();
    return true;
  } catch {
    // Audyt jest best-effort: błąd zapisu dziennika nie może blokować logowania ani odzyskiwania konta.
    return false;
  }
}
