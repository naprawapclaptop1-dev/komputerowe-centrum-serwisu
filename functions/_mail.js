import { nowIso, randomToken, sha256Hex } from './_lib.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function emailDeliveryStatus(env) {
  const missing = [];
  if (!String(env?.RESEND_API_KEY || '').trim()) missing.push('RESEND_API_KEY');
  if (!String(env?.AUTH_EMAIL_FROM || '').trim()) missing.push('AUTH_EMAIL_FROM');
  return { ready: missing.length === 0, missing };
}

function normalizedSender(value) {
  const from = String(value || '').trim();
  const match = from.match(/^(?:[^<>\r\n]{1,80}\s*)?<([^<>\s]+)>$/);
  const address = match ? match[1] : from;
  if (!EMAIL_RE.test(address) || /[\r\n]/.test(from) || from.length > 160) {
    throw new Error('AUTH_EMAIL_FROM musi być prawidłowym adresem e-mail lub nazwą z adresem w nawiasach.');
  }
  return from;
}

export function publicOrigin(request, env) {
  const configured = String(env?.AUTH_PUBLIC_URL || '').trim();
  const origin = configured || new URL(request.url).origin;
  let url;
  try { url = new URL(origin); } catch { throw new Error('AUTH_PUBLIC_URL jest nieprawidłowy.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error('AUTH_PUBLIC_URL musi być bezpiecznym adresem HTTPS bez ścieżki, parametrów i danych logowania.');
  }
  return url.origin;
}

export async function sendTransactionalEmail(env, { to, subject, text, html, idempotencyKey }) {
  const status = emailDeliveryStatus(env);
  if (!status.ready) throw new Error(`EMAIL_DELIVERY_NOT_CONFIGURED: ${status.missing.join(', ')}`);
  const recipient = String(to || '').trim().toLowerCase();
  if (!EMAIL_RE.test(recipient)) throw new Error('Nieprawidłowy adres odbiorcy wiadomości.');
  const apiKey = String(env.RESEND_API_KEY).trim();
  const from = normalizedSender(env.AUTH_EMAIL_FROM);
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'NaukaOdAdoZ-Academy/6.8.0'
  };
  if (idempotencyKey) headers['Idempotency-Key'] = String(idempotencyKey).slice(0, 240);
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST', headers,
    body: JSON.stringify({ from, to: [recipient], subject: String(subject).slice(0, 160), text: String(text).slice(0, 12000), html: String(html).slice(0, 20000) })
  });
  if (!response.ok) {
    // Never include the provider body or API key in application responses/logs.
    throw new Error(`EMAIL_PROVIDER_REJECTED_${response.status}`);
  }
  const result = await response.json().catch(() => ({}));
  return { id: String(result.id || ''), accepted: true };
}

export async function createEmailActionToken(env, { userId, email, purpose, minutes }) {
  const allowed = new Set(['verify_email', 'reset_password']);
  if (!allowed.has(purpose)) throw new Error('Nieprawidłowy cel tokenu e-mail.');
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = nowIso();
  const expires = new Date(Date.now() + Math.max(5, Math.min(60, Number(minutes) || 30)) * 60_000).toISOString();
  await env.DB.prepare('DELETE FROM academy_email_tokens WHERE user_id=? AND purpose=? AND used_at IS NULL').bind(userId, purpose).run();
  await env.DB.prepare('INSERT INTO academy_email_tokens(token_hash,user_id,email_normalized,purpose,created_at,expires_at,used_at) VALUES(?,?,?,?,?,?,NULL)')
    .bind(tokenHash, userId, String(email).trim().toLowerCase(), purpose, now, expires).run();
  return { token, tokenHash, expiresAt: expires };
}

export function verificationEmailContent(link) {
  return {
    subject: 'Potwierdź adres e-mail — Nauka od A do Z',
    text: `Aby potwierdzić adres e-mail w Akademii Nauka od A do Z, otwórz link: ${link}\n\nLink wygaśnie za 30 minut. Jeśli to nie Ty, zignoruj tę wiadomość.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#10243a"><h2>Potwierdź adres e-mail</h2><p>Aby dokończyć konfigurację konta Nauka od A do Z, kliknij poniższy przycisk.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#087fae;color:white;text-decoration:none;font-weight:bold">Potwierdź adres e-mail</a></p><p>Link wygaśnie za 30 minut. Jeśli nie zakładałeś konta, zignoruj wiadomość.</p></div>`
  };
}

export function passwordResetEmailContent(link) {
  return {
    subject: 'Reset hasła — Nauka od A do Z',
    text: `Otrzymaliśmy prośbę o zmianę hasła. Ustaw nowe hasło, otwierając link: ${link}\n\nLink wygaśnie za 30 minut. Jeśli to nie Ty, zignoruj tę wiadomość.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#10243a"><h2>Ustaw nowe hasło</h2><p>Otrzymaliśmy prośbę o zmianę hasła do konta Nauka od A do Z.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#087fae;color:white;text-decoration:none;font-weight:bold">Ustaw nowe hasło</a></p><p>Link wygaśnie za 30 minut. Jeśli nie prosiłeś o zmianę, zignoruj tę wiadomość.</p></div>`
  };
}

export async function sendVerificationEmail(env, request, userId, email) {
  const action = await createEmailActionToken(env, { userId, email, purpose: 'verify_email', minutes: 30 });
  const link = `${publicOrigin(request, env)}/api/auth/email/verify?token=${encodeURIComponent(action.token)}`;
  try {
    await sendTransactionalEmail(env, { to: email, ...verificationEmailContent(link), idempotencyKey: `verify/${action.tokenHash}` });
  } catch (error) {
    await env.DB.prepare('DELETE FROM academy_email_tokens WHERE token_hash=? AND used_at IS NULL').bind(action.tokenHash).run();
    throw error;
  }
  return { expiresAt: action.expiresAt };
}

export async function sendPasswordResetEmail(env, request, userId, email) {
  const action = await createEmailActionToken(env, { userId, email, purpose: 'reset_password', minutes: 30 });
  const url = new URL('/', publicOrigin(request, env));
  url.hash = new URLSearchParams({ view: 'account', password_reset: action.token }).toString();
  try {
    await sendTransactionalEmail(env, { to: email, ...passwordResetEmailContent(url.toString()), idempotencyKey: `reset/${action.tokenHash}` });
  } catch (error) {
    await env.DB.prepare('DELETE FROM academy_email_tokens WHERE token_hash=? AND used_at IS NULL').bind(action.tokenHash).run();
    throw error;
  }
  return { expiresAt: action.expiresAt };
}
