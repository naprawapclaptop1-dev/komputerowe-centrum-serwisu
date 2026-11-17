import { dbRequired, getSession, json, nowIso, readJson, rateLimit, sameOrigin, text } from '../../_lib.js';
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  const publicRows=await env.DB.prepare(`SELECT display_name,message,updated_at FROM academy_support_thanks WHERE show_public=1 ORDER BY updated_at DESC LIMIT 80`).all();
  const user=await getSession(request,env).catch(()=>null);
  let mine=null;if(user)mine=await env.DB.prepare(`SELECT display_name,message,show_public,consent_at,updated_at FROM academy_support_thanks WHERE user_id=?`).bind(user.id).first();
  return json({items:publicRows.results||[],mine:mine?{displayName:mine.display_name,message:mine.message,showPublic:!!mine.show_public}:null,authenticated:!!user});
}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!user)return json({error:'ACCOUNT_REQUIRED',message:'Zaloguj się profilem autora, aby zarządzać tablicą podziękowań.'},401);
  if(!await rateLimit(env,`support-thanks:${user.id}`,6,3600))return json({error:'RATE_LIMIT'},429);
  let b;try{b=await readJson(request,1500)}catch(e){return json({error:e.message},400)}
  if(b.showPublic!==true){await env.DB.prepare('DELETE FROM academy_support_thanks WHERE user_id=?').bind(user.id).run();return json({ok:true,showPublic:false,message:'Twoja nazwa została usunięta z publicznej tablicy.'});}
  if(b.consent!==true)return json({error:'PUBLIC_CONSENT_REQUIRED',message:'Zaznacz wyraźną zgodę na publiczne wyświetlenie.'},400);
  const name=text(b.displayName,60)||text(user.nickname,60)||'Uczestnik społeczności';
  const message=text(b.message,240),at=nowIso();
  await env.DB.prepare(`INSERT INTO academy_support_thanks(user_id,display_name,message,show_public,consent_at,updated_at) VALUES(?,?,?,1,?,?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,message=excluded.message,show_public=1,consent_at=excluded.consent_at,updated_at=excluded.updated_at`).bind(user.id,name,message,at,at).run();
  return json({ok:true,showPublic:true,message:'Zapisano publiczne podziękowanie. Możesz je wycofać w dowolnym momencie.'});
}
