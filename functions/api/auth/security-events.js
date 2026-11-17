import { dbRequired, getSession, json, nowIso, rateLimit, sameOrigin } from '../../_lib.js';
export async function onRequestGet({ request, env }) {
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!user)return json({error:'SESSION_REQUIRED'},401);
  if(!await rateLimit(env,`security-events:${user.id}`,20,900))return json({error:'RATE_LIMIT'},429);
  try{
    const rows=await env.DB.prepare(`SELECT event_type,provider,details_json,created_at
      FROM academy_security_events WHERE user_id=? ORDER BY created_at DESC LIMIT 40`).bind(user.id).all();
    return json({ok:true,events:(rows.results||[]).map(row=>{let details={};try{details=JSON.parse(row.details_json||'{}')}catch{}return{type:row.event_type,provider:row.provider||null,details,createdAt:row.created_at};}),generatedAt:nowIso(),privacy:'Nie zapisujemy ani nie zwracamy surowych adresów IP, agentów, haseł ani tokenów.'});
  }catch(error){if(/no such table/i.test(String(error?.message||error)))return json({error:'SECURITY_MIGRATION_REQUIRED',message:'Zastosuj migrację 0020_account_security_events_fix211.sql.'},503);throw error;}
}
