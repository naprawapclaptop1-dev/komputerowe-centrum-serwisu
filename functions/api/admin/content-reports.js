import { checkAdmin,dbRequired,json,nowIso,readJson,sameOrigin,text } from '../../_lib.js';
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED'},401);
  const rows=await env.DB.prepare(`SELECT r.report_id,r.resource_id,r.category,r.description,r.status,r.created_at,r.reviewed_at,r.review_note,u.nickname
    FROM academy_content_reports r JOIN academy_users u ON u.id=r.user_id ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,r.created_at DESC LIMIT 200`).all();
  return json({ok:true,reports:rows.results||[]});
}
export async function onRequestPatch({request,env}){
  const missing=dbRequired(env);if(missing)return missing;if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED'},401);
  let body;try{body=await readJson(request,3000)}catch(e){return json({error:'INVALID_JSON'},400)}
  const id=text(body.reportId,80),status=text(body.status,20),note=text(body.note,600);if(!id||!['reviewing','fixed','rejected'].includes(status))return json({error:'REPORT_UPDATE_INVALID'},400);
  const result=await env.DB.prepare('UPDATE academy_content_reports SET status=?,reviewed_at=?,review_note=? WHERE report_id=?').bind(status,nowIso(),note,id).run();
  const changed=Number(result?.meta?.changes??result?.changes??0);return changed?json({ok:true,status}):json({error:'REPORT_NOT_FOUND'},404);
}
