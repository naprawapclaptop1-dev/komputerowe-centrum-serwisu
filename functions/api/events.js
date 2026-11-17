import { dbRequired, getSession, json, nowIso, readJson, requireConsent, sameOrigin, text, rateLimit } from '../_lib.js';
const TYPES = new Set(['page_view','section_view','lesson_open','lesson_complete','repair_open','tool_open','component_open','video_open','document_open','manual_search','site_search','checklist_tick','quiz_submit','chat_question','chat_answer','chat_feedback','bookmark','knowledge_submit','login','profile_update']);
export async function onRequestPost({ request, env }) {
  const missing=dbRequired(env); if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env); if(!requireConsent(user))return json({error:'CONSENT_REQUIRED'},401);
  if(!await rateLimit(env,`events:${user.id}`,180,60))return json({error:'RATE_LIMIT'},429);
  let body;try{body=await readJson(request,3500)}catch(e){return json({error:e.message},400)}
  const type=text(body.type,40);if(!TYPES.has(type))return json({error:'EVENT_TYPE_NOT_ALLOWED'},400);
  const resourceId=text(body.resourceId,120),title=text(body.title,180);
  const details=body.details && typeof body.details==='object' ? JSON.stringify(body.details).slice(0,1200) : '{}';
  const id=crypto.randomUUID(),at=nowIso();
  await env.DB.prepare('INSERT INTO academy_events (id,user_id,event_type,resource_id,title,details_json,created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(id,user.id,type,resourceId,title,details,at).run();
  if(type==='lesson_open' && resourceId){
    await env.DB.prepare(`INSERT INTO academy_lesson_progress (user_id,lesson_id,status,progress_percent,last_seen_at)
      VALUES (?,?,'started',0,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET status=CASE WHEN academy_lesson_progress.status='completed' THEN 'completed' ELSE 'started' END,last_seen_at=excluded.last_seen_at`).bind(user.id,resourceId,at).run();
  }
  if(type==='lesson_complete' && resourceId){
    await env.DB.prepare(`INSERT INTO academy_lesson_progress (user_id,lesson_id,status,progress_percent,last_seen_at,completed_at)
      VALUES (?,?,'completed',100,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET status='completed',progress_percent=100,last_seen_at=excluded.last_seen_at,completed_at=excluded.completed_at`).bind(user.id,resourceId,at,at).run();
  }
  return json({ok:true,id,createdAt:at});
}
