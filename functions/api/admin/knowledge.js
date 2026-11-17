import { checkAdmin, dbRequired, json, nowIso, readJson, sameOrigin, text } from '../../_lib.js';
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED'},401);
  const [pending,metrics]=await Promise.all([
    env.DB.prepare(`SELECT id,user_id,title,category,symptoms,diagnosis,procedure,result,source_urls_json,created_at,rights_confirmed_at,license_code,attribution FROM academy_knowledge_submissions WHERE status='pending' ORDER BY created_at ASC LIMIT 100`).all(),
    env.DB.prepare(`SELECT (SELECT COUNT(*) FROM academy_users) AS users,(SELECT COUNT(*) FROM academy_events) AS events,(SELECT COUNT(*) FROM academy_messages) AS messages,(SELECT COUNT(*) FROM academy_knowledge_approved) AS approved`).first()
  ]);
  return json({pending:pending.results||[],metrics:metrics||{}});
}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED'},401);
  let b;try{b=await readJson(request,2000)}catch(e){return json({error:e.message},400)}
  const id=text(b.id,80),status=b.status==='approved'?'approved':b.status==='rejected'?'rejected':'';
  if(!id||!status)return json({error:'INVALID_REVIEW'},400);
  const item=await env.DB.prepare(`SELECT * FROM academy_knowledge_submissions WHERE id=? AND status='pending'`).bind(id).first();
  if(!item)return json({error:'SUBMISSION_NOT_PENDING'},404);
  const now=nowIso(),note=text(b.note,500);
  if(status==='approved'){
    await env.DB.prepare(`INSERT OR IGNORE INTO academy_knowledge_approved(id,submission_id,title,category,symptoms,diagnosis,procedure,result,source_urls_json,approved_at,license_code,attribution)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),item.id,item.title,item.category,item.symptoms,item.diagnosis,item.procedure,item.result,item.source_urls_json,now,item.license_code,item.attribution).run();
  }
  await env.DB.prepare(`UPDATE academy_knowledge_submissions SET status=?,moderation_note=?,reviewed_at=? WHERE id=?`)
    .bind(status,note,now,id).run();
  await env.DB.prepare(`INSERT INTO academy_audit_log(id,actor_id,action,target_id,details_json,created_at) VALUES(?,NULL,?,?,?,?)`)
    .bind(crypto.randomUUID(),`knowledge_${status}`,id,JSON.stringify({note}),now).run();
  return json({ok:true,status,id});
}
