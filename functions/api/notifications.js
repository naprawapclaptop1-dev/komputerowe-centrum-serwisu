import { dbRequired,getSession,json,nowIso,readJson,sameOrigin,sha256Hex,text,rateLimit } from '../_lib.js';
import { isAllowedPushEndpoint, webPushConfigured } from '../_webpush.js';
const defaults={announcement:true,assignment:true,submission:true,grade:true,exam:true,security:true,platform:true,email:false,push:false};
function prefs(raw){try{return {...defaults,...JSON.parse(raw||'{}')}}catch{return {...defaults}}}
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  const user=await getSession(request,env);if(!user)return json({error:'SESSION_REQUIRED'},401);
  const [row,notifications,subscriptions,account]=await Promise.all([
    env.DB.prepare('SELECT preferences_json,updated_at FROM academy_notification_preferences WHERE user_id=?').bind(user.id).first(),
    env.DB.prepare('SELECT notification_id,notification_type,title,body,resource_url,created_at,read_at FROM academy_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(user.id).all(),
    env.DB.prepare('SELECT COUNT(*) AS total FROM academy_push_subscriptions WHERE user_id=?').bind(user.id).first(),
    env.DB.prepare('SELECT email_verified_at FROM academy_users WHERE id=?').bind(user.id).first()
  ]);
  return json({ok:true,preferences:prefs(row?.preferences_json),notifications:notifications.results||[],unread:(notifications.results||[]).filter(item=>!item.read_at).length,push:{configured:webPushConfigured(env),publicKey:webPushConfigured(env)?String(env.VAPID_PUBLIC_KEY):null,subscriptions:Number(subscriptions?.total||0)},emailReady:!!(env.RESEND_API_KEY&&env.AUTH_EMAIL_FROM&&user.email_normalized&&account?.email_verified_at),emailVerified:!!account?.email_verified_at});
}
export async function onRequestPatch({request,env}){
  const missing=dbRequired(env);if(missing)return missing;if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!user)return json({error:'SESSION_REQUIRED'},401);
  let body;try{body=await readJson(request,4000)}catch(e){return json({error:'INVALID_JSON',message:e.message},400)}
  const current=await env.DB.prepare('SELECT preferences_json FROM academy_notification_preferences WHERE user_id=?').bind(user.id).first();
  const next={...prefs(current?.preferences_json)};
  for(const key of Object.keys(defaults))if(typeof body.preferences?.[key]==='boolean')next[key]=body.preferences[key];
  if(next.push&&!webPushConfigured(env))return json({error:'PUSH_NOT_CONFIGURED',message:'Administrator musi skonfigurować VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY_PKCS8 i VAPID_SUBJECT.'},409);
  if(next.email&&!env.RESEND_API_KEY)return json({error:'EMAIL_NOT_CONFIGURED',message:'Wysyłka e-mail wymaga konfiguracji Resend.'},409);
  if(next.email){const account=await env.DB.prepare('SELECT email_verified_at FROM academy_users WHERE id=?').bind(user.id).first();if(!account?.email_verified_at)return json({error:'EMAIL_NOT_VERIFIED',message:'Najpierw potwierdź adres e-mail konta.'},409);}
  await env.DB.prepare('INSERT INTO academy_notification_preferences(user_id,preferences_json,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET preferences_json=excluded.preferences_json,updated_at=excluded.updated_at').bind(user.id,JSON.stringify(next),nowIso()).run();
  return json({ok:true,preferences:next});
}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!user)return json({error:'SESSION_REQUIRED'},401);
  let body;try{body=await readJson(request,12000)}catch(e){return json({error:'INVALID_JSON',message:e.message},400)}
  const action=text(body.action,24);
  if(action==='subscribe'){
    if(!webPushConfigured(env))return json({error:'PUSH_NOT_CONFIGURED'},409);
    const sub=body.subscription||{},endpoint=String(sub.endpoint||'');let url;try{url=new URL(endpoint)}catch{return json({error:'PUSH_ENDPOINT_INVALID'},400)}
    const p256dh=String(sub.keys?.p256dh||''),auth=String(sub.keys?.auth||'');
    const decodedLength=value=>{try{const normalized=value.replace(/-/g,'+').replace(/_/g,'/');return atob(normalized+'='.repeat((4-normalized.length%4)%4)).length;}catch{return 0;}};
    if(!isAllowedPushEndpoint(endpoint)||url.username||url.password||endpoint.length>2000||!/^[A-Za-z0-9_-]{80,200}$/.test(p256dh)||!/^[A-Za-z0-9_-]{16,100}$/.test(auth)||decodedLength(p256dh)!==65||decodedLength(auth)<16||decodedLength(auth)>32)return json({error:'PUSH_SUBSCRIPTION_INVALID'},400);
    if(!await rateLimit(env,`push-subscribe:${user.id}`,10,3600))return json({error:'RATE_LIMIT'},429);
    const endpointHash=await sha256Hex(endpoint),id=crypto.randomUUID(),at=nowIso();
    await env.DB.prepare('INSERT INTO academy_push_subscriptions(subscription_id,user_id,endpoint,endpoint_hash,p256dh,auth_secret,created_at,last_used_at) VALUES(?,?,?,?,?,?,?,NULL) ON CONFLICT(endpoint_hash) DO UPDATE SET user_id=excluded.user_id,p256dh=excluded.p256dh,auth_secret=excluded.auth_secret').bind(id,user.id,endpoint,endpointHash,p256dh,auth,at).run();
    return json({ok:true,stored:true,message:'Subskrypcja powiadomień została zapisana.'});
  }
  if(action==='read'){
    const id=text(body.id,80);if(!id)return json({error:'NOTIFICATION_ID_REQUIRED'},400);
    await env.DB.prepare('UPDATE academy_notifications SET read_at=? WHERE notification_id=? AND user_id=?').bind(nowIso(),id,user.id).run();return json({ok:true});
  }
  if(action==='read-all'){
    await env.DB.prepare('UPDATE academy_notifications SET read_at=? WHERE user_id=? AND read_at IS NULL').bind(nowIso(),user.id).run();return json({ok:true});
  }
  return json({error:'ACTION_INVALID'},400);
}
export async function onRequestDelete({request,env}){
  const missing=dbRequired(env);if(missing)return missing;if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!user)return json({error:'SESSION_REQUIRED'},401);
  let body;try{body=await readJson(request,2000)}catch(e){return json({error:'INVALID_JSON',message:e.message},400)}
  if(body.action==='unsubscribe'){
    const endpoint=String(body.endpoint||'');if(!isAllowedPushEndpoint(endpoint))return json({error:'PUSH_ENDPOINT_INVALID'},400);
    const hash=await sha256Hex(endpoint);await env.DB.prepare('DELETE FROM academy_push_subscriptions WHERE user_id=? AND endpoint_hash=?').bind(user.id,hash).run();
  }else if(body.action==='unsubscribe-all'){
    await env.DB.prepare('DELETE FROM academy_push_subscriptions WHERE user_id=?').bind(user.id).run();
  }else return json({error:'ACTION_INVALID'},400);
  return json({ok:true,removed:true});
}
