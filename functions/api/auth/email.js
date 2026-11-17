import { dbRequired, getSession, hashedClientRateKey, json, rateLimit, readJson, sameOrigin } from '../../_lib.js';
import { emailDeliveryStatus, sendVerificationEmail } from '../../_mail.js';

export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const user = await getSession(request, env);
  if (!user) return json({ error: 'SESSION_REQUIRED' }, 401);
  const account = await env.DB.prepare('SELECT email_normalized,email_verified_at FROM academy_users WHERE id=? LIMIT 1').bind(user.id).first();
  const delivery = emailDeliveryStatus(env);
  return json({ ok: true, email: account?.email_normalized || null, verified: !!account?.email_verified_at, verifiedAt: account?.email_verified_at || null, deliveryReady: delivery.ready, deliveryMissing: delivery.missing });
}

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  let body; try { body = await readJson(request, 512); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (body.action !== 'send-verification') return json({ error: 'INVALID_ACTION' }, 400);
  const user = await getSession(request, env);
  if (!user) return json({ error: 'SESSION_REQUIRED' }, 401);
  const delivery = emailDeliveryStatus(env);
  if (!delivery.ready) return json({ error: 'EMAIL_DELIVERY_NOT_CONFIGURED', missing: delivery.missing, message: 'Potwierdzanie e-mail wymaga skonfigurowania RESEND_API_KEY oraz AUTH_EMAIL_FROM.' }, 503);
  const account = await env.DB.prepare('SELECT id,email_normalized,email_verified_at FROM academy_users WHERE id=? LIMIT 1').bind(user.id).first();
  if (!account?.email_normalized) return json({ error: 'EMAIL_NOT_SET', message: 'Najpierw dodaj adres e-mail do konta.' }, 409);
  if (account.email_verified_at) return json({ ok: true, verified: true, message: 'Adres e-mail jest już potwierdzony.' });
  const ipKey = await hashedClientRateKey(request, 'email-verify-send');
  if (!await rateLimit(env, ipKey, 3, 900)) return json({ error: 'EMAIL_RATE_LIMIT', message: 'Za dużo próśb o potwierdzenie. Spróbuj ponownie później.' }, 429);
  try {
    await sendVerificationEmail(env, request, account.id, account.email_normalized);
    return json({ ok: true, sent: true, message: 'Wysłaliśmy link potwierdzający. Sprawdź skrzynkę i folder spam.' });
  } catch (error) {
    const code = String(error?.message || '');
    return json({ error: 'EMAIL_SEND_FAILED', message: code.startsWith('EMAIL_PROVIDER_REJECTED_') ? 'Dostawca poczty odrzucił wiadomość. Sprawdź zweryfikowaną domenę nadawcy i klucz API.' : 'Nie udało się wysłać wiadomości. Sprawdź konfigurację dostawcy poczty.' }, 502);
  }
}
