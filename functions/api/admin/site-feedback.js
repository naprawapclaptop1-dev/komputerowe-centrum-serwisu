import { checkAdmin, dbRequired, json, nowIso, readJson, sameOrigin, text } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env);
  if (missing) return missing;
  if (!await checkAdmin(request, env)) return json({ error: 'ADMIN_AUTH_REQUIRED' }, 401);
  const result = await env.DB.prepare(`SELECT id,user_id,rating,what_add,what_change,what_broken,details,route,status,admin_note,created_at,reviewed_at
    FROM academy_site_feedback ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'in_review' THEN 1 ELSE 2 END, created_at DESC LIMIT 200`).all();
  const count = await env.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS pending FROM academy_site_feedback`).first();
  return json({ items: result.results || [], metrics: count || { total: 0, pending: 0 } });
}

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env);
  if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  if (!await checkAdmin(request, env)) return json({ error: 'ADMIN_AUTH_REQUIRED' }, 401);
  let body;
  try { body = await readJson(request, 1200); } catch (error) { return json({ error: 'INVALID_JSON', message: error.message }, 400); }
  const id = text(body.id, 80);
  const status = ['new', 'in_review', 'fixed', 'wont_fix'].includes(body.status) ? body.status : '';
  if (!id || !status) return json({ error: 'INVALID_REVIEW' }, 400);
  const item = await env.DB.prepare('SELECT id FROM academy_site_feedback WHERE id=?').bind(id).first();
  if (!item) return json({ error: 'FEEDBACK_NOT_FOUND' }, 404);
  const note = text(body.note, 500);
  await env.DB.prepare('UPDATE academy_site_feedback SET status=?,admin_note=?,reviewed_at=? WHERE id=?')
    .bind(status, note, nowIso(), id).run();
  return json({ ok: true, id, status });
}
