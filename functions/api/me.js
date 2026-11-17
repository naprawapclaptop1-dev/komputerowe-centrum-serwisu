import { clearSessionCookie, CONSENT_VERSION, dbRequired, getSession, json, nowIso, readJson, sameOrigin } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const user = await getSession(request, env); if (!user) return json({ error: 'SESSION_REQUIRED' }, 401);
  const stats = await env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM academy_events WHERE user_id=?) AS events,
    (SELECT COUNT(*) FROM academy_events WHERE user_id=? AND event_type='lesson_open') AS lessons_opened,
    (SELECT COUNT(*) FROM academy_events WHERE user_id=? AND event_type='lesson_complete') AS lessons_completed,
    (SELECT COUNT(*) FROM academy_messages WHERE user_id=? AND role='user') AS questions,
    (SELECT COUNT(*) FROM academy_knowledge_submissions WHERE user_id=?) AS contributions,
    (SELECT COUNT(*) FROM academy_conversations WHERE user_id=?) AS conversations
  `).bind(user.id,user.id,user.id,user.id,user.id,user.id).first();
  const history = await env.DB.prepare('SELECT event_type,resource_id,title,created_at FROM academy_events WHERE user_id=? ORDER BY created_at DESC LIMIT 40').bind(user.id).all();
  return json({ user: { id:user.id,nickname:user.nickname,createdAt:user.created_at,lastSeenAt:user.last_seen_at,consented:!!(user.consent_at && user.consent_version === CONSENT_VERSION) }, stats, history: history.results || [] });
}
export async function onRequestPatch({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error:'ORIGIN_REJECTED' },403);
  const user = await getSession(request, env); if (!user) return json({ error:'SESSION_REQUIRED' },401);
  let body; try { body=await readJson(request,3000); } catch(e) { return json({error:e.message},400); }
  const nickname = body.nickname == null ? user.nickname : String(body.nickname).replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,32);
  // A PATCH that only edits the nickname must never silently opt a user in.
  const consentProvided = body.consent === true || body.consent === false;
  const currentlyConsented = !!(user.consent_at && user.consent_version === CONSENT_VERSION);
  const enabled = consentProvided ? body.consent : currentlyConsented;
  const at = consentProvided ? (enabled ? nowIso() : null) : user.consent_at;
  const version = consentProvided ? (enabled ? CONSENT_VERSION : null) : user.consent_version;
  await env.DB.prepare('UPDATE academy_users SET nickname=?,consent_at=?,consent_version=?,last_seen_at=? WHERE id=?')
    .bind(nickname || user.nickname, at, version, nowIso(), user.id).run();
  return json({ ok:true, consented:enabled, nickname:nickname || user.nickname });
}
export async function onRequestDelete({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error:'ORIGIN_REJECTED' },403);
  const user = await getSession(request, env); if (!user) return json({ ok:true },200,{'set-cookie':clearSessionCookie()});
  // Explicit deletion of all linked records, even if a database was created with FK enforcement disabled.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM academy_knowledge_approved WHERE submission_id IN (SELECT id FROM academy_knowledge_submissions WHERE user_id=?)').bind(user.id),
    env.DB.prepare('DELETE FROM academy_notifications WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_notification_preferences WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_push_subscriptions WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_guardian_invites WHERE student_user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_guardian_links WHERE student_user_id=? OR guardian_user_id=?').bind(user.id,user.id),
    env.DB.prepare('DELETE FROM academy_content_reports WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_message_feedback WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_messages WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_conversations WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_events WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_user_state WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_user_state_chunks WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_user_state_versions WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_lesson_progress WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_knowledge_submissions WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_sessions WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM academy_users WHERE id=?').bind(user.id)
  ]);
  return json({ ok:true, deleted:true },200,{'set-cookie':clearSessionCookie()});
}
