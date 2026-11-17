import { dbRequired, getSession, json, nowIso, readJson, requireConsent, sameOrigin, text, rateLimit } from '../_lib.js';
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!requireConsent(user))return json({error:'CONSENT_REQUIRED'},401);
  if(!await rateLimit(env,`chat-feedback:${user.id}`,40,3600))return json({error:'RATE_LIMIT'},429);
  let b;try{b=await readJson(request,1500)}catch(e){return json({error:e.message},400)}
  const messageId=text(b.messageId,80),rating=b.rating==='helpful'?'helpful':b.rating==='not_helpful'?'not_helpful':'';
  if(!messageId||!rating)return json({error:'INVALID_FEEDBACK'},400);
  const row=await env.DB.prepare(`SELECT m.id,m.conversation_id FROM academy_messages m JOIN academy_conversations c ON c.id=m.conversation_id WHERE m.id=? AND m.user_id=? AND m.role='assistant' AND c.user_id=?`).bind(messageId,user.id,user.id).first();
  if(!row)return json({error:'MESSAGE_NOT_FOUND'},404);
  const at=nowIso();
  await env.DB.prepare(`INSERT INTO academy_message_feedback(id,user_id,message_id,conversation_id,rating,note,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,message_id) DO UPDATE SET rating=excluded.rating,note=excluded.note,created_at=excluded.created_at`).bind(crypto.randomUUID(),user.id,messageId,row.conversation_id,rating,text(b.note,500),at).run();
  return json({ok:true,rating});
}
