import { dbRequired, hashedClientRateKey, json, nowIso, rateLimit, readJson, sameOrigin, sha256Hex, recordSecurityEvent } from '../../../_lib.js';
import { createPasswordSalt, derivePassword } from '../../../_password-kdf.js';

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  let body; try { body = await readJson(request, 2048); } catch (error) { return json({ error: 'INVALID_JSON', message: error.message }, 400); }
  const token = String(body.token || '').trim();
  const password = String(body.password || '');
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return json({ error: 'RESET_TOKEN_INVALID', message: 'Link resetujący jest nieprawidłowy lub wygasł.' }, 400);
  if (password.length < 12 || password.length > 128) return json({ error: 'PASSWORD_INVALID', message: 'Nowe hasło musi mieć od 12 do 128 znaków.' }, 400);
  const ipKey = await hashedClientRateKey(request, 'password-reset-complete');
  if (!await rateLimit(env, ipKey, 8, 900)) return json({ error: 'RESET_RATE_LIMIT', message: 'Za dużo prób. Spróbuj później.' }, 429);
  const hash = await sha256Hex(token);
  const row = await env.DB.prepare("SELECT user_id,email_normalized FROM academy_email_tokens WHERE token_hash=? AND purpose='reset_password' AND used_at IS NULL AND expires_at>? LIMIT 1")
    .bind(hash, nowIso()).first();
  if (!row) return json({ error: 'RESET_TOKEN_INVALID', message: 'Link resetujący jest nieprawidłowy, wygasł lub został już wykorzystany.' }, 400);
  const claimed = await env.DB.prepare("UPDATE academy_email_tokens SET used_at=? WHERE token_hash=? AND purpose='reset_password' AND used_at IS NULL AND expires_at>?")
    .bind(nowIso(), hash, nowIso()).run();
  if (Number(claimed?.meta?.changes ?? claimed?.changes ?? 0) !== 1) return json({ error: 'RESET_TOKEN_USED', message: 'Ten link został już wykorzystany. Poproś o nowy.' }, 409);
  const salt = createPasswordSalt();
  const passwordHash = await derivePassword(password, salt);
  const updated = await env.DB.prepare('UPDATE academy_users SET password_salt=?,password_hash=? WHERE id=? AND email_normalized=?')
    .bind(salt, passwordHash, row.user_id, row.email_normalized).run();
  if (Number(updated?.meta?.changes ?? updated?.changes ?? 0) !== 1) return json({ error: 'ACCOUNT_NOT_FOUND', message: 'Konto nie jest już dostępne. Poproś o nowy link resetujący.' }, 404);
  await env.DB.prepare('DELETE FROM academy_sessions WHERE user_id=?').bind(row.user_id).run();
  await env.DB.prepare("DELETE FROM academy_email_tokens WHERE user_id=? AND purpose='reset_password'").bind(row.user_id).run();
  await recordSecurityEvent(env, row.user_id, 'password_reset', { method: 'email' });
  return json({ ok: true, message: 'Hasło zmienione. Wszystkie wcześniejsze sesje zostały wylogowane. Zaloguj się ponownie.' });
}
