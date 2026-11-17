import { dbRequired, hashedClientRateKey, json, rateLimit, readJson, sameOrigin, sha256Hex } from '../../../_lib.js';
import { emailDeliveryStatus, sendPasswordResetEmail } from '../../../_mail.js';

const normalizeEmail = value => String(value || '').trim().toLowerCase().slice(0, 254);
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  const delivery = emailDeliveryStatus(env);
  if (!delivery.ready) return json({ error: 'EMAIL_DELIVERY_NOT_CONFIGURED', missing: delivery.missing, message: 'Reset hasła wymaga skonfigurowania RESEND_API_KEY i AUTH_EMAIL_FROM.' }, 503);
  let body; try { body = await readJson(request, 1024); } catch (error) { return json({ error: 'INVALID_JSON', message: error.message }, 400); }
  const email = normalizeEmail(body.email);
  if (!EMAIL_RE.test(email)) return json({ error: 'INVALID_EMAIL', message: 'Wpisz prawidłowy adres e-mail.' }, 400);
  const ipKey = await hashedClientRateKey(request, 'password-reset-ip');
  const emailKey = `password-reset:${await sha256Hex(email)}`;
  if (!await rateLimit(env, ipKey, 5, 900) || !await rateLimit(env, emailKey, 3, 3600)) return json({ error: 'RESET_RATE_LIMIT', message: 'Za dużo próśb o reset hasła. Spróbuj później.' }, 429);
  // Same response for known and unknown addresses prevents account enumeration.
  const account = await env.DB.prepare('SELECT id,email_normalized,password_hash FROM academy_users WHERE email_normalized=? LIMIT 1').bind(email).first();
  if (account?.password_hash) {
    try { await sendPasswordResetEmail(env, request, account.id, account.email_normalized); }
    catch { return json({ error: 'EMAIL_SEND_FAILED', message: 'Usługa poczty tymczasowo nie wysłała wiadomości. Spróbuj później.' }, 502); }
  }
  return json({ ok: true, message: 'Jeśli konto z tym adresem istnieje, wysłaliśmy instrukcję resetu hasła.' });
}
