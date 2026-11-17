import { json, nowIso, sha256Hex, recordSecurityEvent } from '../../../_lib.js';

export async function onRequestGet({ request, env }) {
  if (!env?.DB) return json({ error: 'DATABASE_NOT_CONFIGURED' }, 503);
  const token = String(new URL(request.url).searchParams.get('token') || '');
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return Response.redirect(new URL('/?auth_result=email_verification_invalid#view=account', request.url), 303);
  const hash = await sha256Hex(token);
  const row = await env.DB.prepare("SELECT user_id,email_normalized FROM academy_email_tokens WHERE token_hash=? AND purpose='verify_email' AND used_at IS NULL AND expires_at>? LIMIT 1")
    .bind(hash, nowIso()).first();
  if (!row) return Response.redirect(new URL('/?auth_result=email_verification_expired#view=account', request.url), 303);
  const claimed = await env.DB.prepare("UPDATE academy_email_tokens SET used_at=? WHERE token_hash=? AND purpose='verify_email' AND used_at IS NULL AND expires_at>?")
    .bind(nowIso(), hash, nowIso()).run();
  if (Number(claimed?.meta?.changes ?? claimed?.changes ?? 0) !== 1) return Response.redirect(new URL('/?auth_result=email_verification_expired#view=account', request.url), 303);
  const updated = await env.DB.prepare('UPDATE academy_users SET email_verified_at=? WHERE id=? AND email_normalized=?')
    .bind(nowIso(), row.user_id, row.email_normalized).run();
  if (Number(updated?.meta?.changes ?? updated?.changes ?? 0) !== 1) return Response.redirect(new URL('/?auth_result=email_verification_expired#view=account', request.url), 303);
  await env.DB.prepare("DELETE FROM academy_email_tokens WHERE user_id=? AND purpose='verify_email' AND token_hash<>?").bind(row.user_id, hash).run();
  await recordSecurityEvent(env, row.user_id, 'email_verified');
  return Response.redirect(new URL('/?auth_result=email_verified#view=account', request.url), 303);
}
