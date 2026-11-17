import { dbRequired, getSession, json, requireConsent, text } from '../_lib.js';
function parse(s){try{const a=JSON.parse(s||'[]');return Array.isArray(a)?a:[]}catch{return []}}
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  const user=await getSession(request,env);if(!requireConsent(user))return json({error:'CONSENT_REQUIRED'},401);
  const id=text(new URL(request.url).searchParams.get('id'),80);if(!id)return json({error:'CONVERSATION_ID_REQUIRED'},400);
  const conv=await env.DB.prepare('SELECT id,title,created_at,updated_at FROM academy_conversations WHERE id=? AND user_id=?').bind(id,user.id).first();
  if(!conv)return json({error:'CONVERSATION_NOT_FOUND'},404);
  const r=await env.DB.prepare('SELECT id,role,content,sources_json,created_at FROM academy_messages WHERE conversation_id=? AND user_id=? AND role IN (\'user\',\'assistant\') ORDER BY created_at ASC LIMIT 100').bind(id,user.id).all();
  return json({ok:true,conversation:conv,messages:(r.results||[]).map(m=>({...m,sources:parse(m.sources_json)}))});
}
