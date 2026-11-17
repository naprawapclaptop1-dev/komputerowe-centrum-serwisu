import { checkAdmin, dbRequired, json, nowIso, readJson, sameOrigin, text } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!await checkAdmin(request, env)) return json({ error: 'ADMIN_AUTH_REQUIRED' }, 401);
  const [pending, metrics] = await Promise.all([
    env.DB.prepare(`SELECT id,user_id,brand,model,series,device_type,board_id,pcb_revision,cpu_platform,gpu,ram_type,storage,display_info,known_issues,repair_notes,source_urls_json,attribution,rights_confirmed_at,license_code,created_at
      FROM academy_device_model_submissions WHERE status='pending' ORDER BY created_at ASC LIMIT 100`).all(),
    env.DB.prepare(`SELECT (SELECT COUNT(*) FROM academy_device_models) AS approved_models,(SELECT COUNT(*) FROM academy_device_model_submissions WHERE status='pending') AS pending_models`).first()
  ]);
  return json({ pending: pending.results || [], metrics: metrics || {} });
}

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  if (!await checkAdmin(request, env)) return json({ error: 'ADMIN_AUTH_REQUIRED' }, 401);
  let b; try { b = await readJson(request, 2000); } catch (e) { return json({ error: e.message }, 400); }
  const id = text(b.id, 80), status = b.status === 'approved' ? 'approved' : b.status === 'rejected' ? 'rejected' : '';
  if (!id || !status) return json({ error: 'INVALID_REVIEW' }, 400);
  const item = await env.DB.prepare(`SELECT * FROM academy_device_model_submissions WHERE id=? AND status='pending'`).bind(id).first();
  if (!item) return json({ error: 'SUBMISSION_NOT_PENDING' }, 404);
  const now = nowIso(), note = text(b.note, 500);
  if (status === 'approved') {
    await env.DB.prepare(`INSERT OR IGNORE INTO academy_device_models
      (id,submission_id,brand,model,series,device_type,board_id,pcb_revision,cpu_platform,gpu,ram_type,storage,display_info,known_issues,repair_notes,source_urls_json,attribution,license_code,approved_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),item.id,item.brand,item.model,item.series,item.device_type,item.board_id,item.pcb_revision,item.cpu_platform,item.gpu,item.ram_type,item.storage,item.display_info,item.known_issues,item.repair_notes,item.source_urls_json,item.attribution,item.license_code,now).run();
  }
  await env.DB.prepare(`UPDATE academy_device_model_submissions SET status=?,moderation_note=?,reviewed_at=? WHERE id=?`).bind(status,note,now,id).run();
  await env.DB.prepare(`INSERT INTO academy_audit_log(id,actor_id,action,target_id,details_json,created_at) VALUES(?,NULL,?,?,?,?)`)
    .bind(crypto.randomUUID(),`device_model_${status}`,id,JSON.stringify({note}),now).run();
  return json({ ok: true, status, id });
}
