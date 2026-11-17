import { dbRequired, getSession, json, nowIso, readJson, rateLimit, sameOrigin } from '../../_lib.js';
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  const rows=await env.DB.prepare(`SELECT id,title,summary,kind,published_at FROM academy_support_announcements WHERE status='published' ORDER BY published_at DESC LIMIT 30`).all();
  const user=await getSession(request,env).catch(()=>null);
  let enabled=false,lastSeenAt=null,unreadCount=0;if(user){const row=await env.DB.prepare('SELECT enabled,last_seen_at FROM academy_support_subscriptions WHERE user_id=?').bind(user.id).first();enabled=!!row?.enabled;lastSeenAt=row?.last_seen_at||null;if(enabled){const unread=await env.DB.prepare(`SELECT COUNT(*) AS total FROM academy_support_announcements WHERE status='published' AND published_at>?`).bind(lastSeenAt||'').first();unreadCount=Number(unread?.total||0);}}
  return json({items:rows.results||[],authenticated:!!user,enabled,lastSeenAt,unreadCount});
}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!user)return json({error:'ACCOUNT_REQUIRED',message:'Zaloguj się profilem autora, aby zapisać obserwowanie aktualności.'},401);
  if(!await rateLimit(env,`support-updates:${user.id}`,12,3600))return json({error:'RATE_LIMIT'},429);
  let b;try{b=await readJson(request,800)}catch(e){return json({error:e.message},400)}
  const at=nowIso();
  if(b.action==='mark-read'){await env.DB.prepare(`INSERT INTO academy_support_subscriptions(user_id,enabled,last_seen_at,created_at,updated_at) VALUES(?,0,?,?,?) ON CONFLICT(user_id) DO UPDATE SET last_seen_at=excluded.last_seen_at,updated_at=excluded.updated_at`).bind(user.id,at,at,at).run();return json({ok:true,lastSeenAt:at,message:'Oznaczono aktualności jako przeczytane.'});}
  if(typeof b.enabled!=='boolean')return json({error:'INVALID_PREFERENCE'},400);
  await env.DB.prepare(`INSERT INTO academy_support_subscriptions(user_id,enabled,last_seen_at,created_at,updated_at) VALUES(?,?,NULL,?,?) ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at`).bind(user.id,b.enabled?1:0,at,at).run();
  return json({ok:true,enabled:b.enabled,message:b.enabled?'Włączono obserwowanie aktualności w centrum wsparcia.':'Wyłączono obserwowanie aktualności.'});
}
