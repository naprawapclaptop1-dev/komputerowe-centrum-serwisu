import { dbRequired, getSession, hashedClientRateKey, json, nowIso, readJson, safeUrls, sameOrigin, text, rateLimit } from '../_lib.js';
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  const url=new URL(request.url);
  if(url.searchParams.get('mine')==='1'){
    const user=await getSession(request,env);
    if(!user)return json({error:'SESSION_REQUIRED',message:'Zaloguj się profilem autora, aby sprawdzić status swoich zgłoszeń.'},401);
    const own=await env.DB.prepare(`SELECT id,title,category,status,created_at,reviewed_at,moderation_note FROM academy_knowledge_submissions WHERE user_id=? ORDER BY created_at DESC LIMIT 50`).bind(user.id).all();
    return json({items:own.results||[],scope:'own-submissions'});
  }
  const r=await env.DB.prepare('SELECT id,title,category,symptoms,diagnosis,procedure,result,source_urls_json,approved_at,license_code,attribution FROM academy_knowledge_approved ORDER BY approved_at DESC LIMIT 100').all();
  return json({items:(r.results||[]).map(x=>({...x,sourceUrls:parse(x.source_urls_json)}))});
}
function parse(s){try{return JSON.parse(s||'[]')}catch{return []}}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!user)return json({error:'CONTRIBUTOR_PROFILE_REQUIRED',message:'Utwórz profil pseudonimowy lub zaloguj się, aby wysłać przypadek.'},401);
  if(!await rateLimit(env,`knowledge:${user.id}`,5,3600))return json({error:'RATE_LIMIT',message:'Limit zgłoszeń z tego profilu został osiągnięty. Spróbuj później.'},429);
  if(!await rateLimit(env,await hashedClientRateKey(request,'knowledge-submit'),10,3600))return json({error:'NETWORK_RATE_LIMIT',message:'Zbyt wiele zgłoszeń z tej sieci. Spróbuj później.'},429);
  let b;try{b=await readJson(request,12000)}catch(e){return json({error:e.message},400)}
  if(b.shareConsent!==true)return json({error:'SHARE_CONSENT_REQUIRED',message:'Zaznacz zgodę na przekazanie przypadku do moderacji.'},400);
  if(b.rightsConfirmed!==true||b.licenseAgreement!==true||b.licenseCode!=='ACADEMY_NONEXCLUSIVE_2026')return json({error:'RIGHTS_CONFIRMATION_REQUIRED',message:'Potwierdź prawa do materiału i zaakceptuj licencję publikacji.'},400);
  const title=text(b.title,140),category=text(b.category,70),symptoms=text(b.symptoms,1800),diagnosis=text(b.diagnosis,2500),procedure=text(b.procedure,3500),result=text(b.result,1500),attribution=text(b.attribution,80),urls=safeUrls(b.sourceUrls);
  if(title.length<5||symptoms.length<20||diagnosis.length<20||procedure.length<20)return json({error:'INCOMPLETE_CASE',message:'Uzupełnij tytuł, objawy, diagnozę i procedurę (minimum 20 znaków w opisach).'},400);
  const id=crypto.randomUUID(),at=nowIso();
  const author=attribution||text(user.nickname,80)||'Użytkownik Akademii';
  await env.DB.prepare(`INSERT INTO academy_knowledge_submissions(id,user_id,title,category,symptoms,diagnosis,procedure,result,source_urls_json,share_consent,status,created_at,rights_confirmed_at,license_code,attribution)
    VALUES(?,?,?,?,?,?,?,?,?,1,'pending',?,?,?,?)`).bind(id,user.id,title,category,symptoms,diagnosis,procedure,result,JSON.stringify(urls),at,at,'ACADEMY_NONEXCLUSIVE_2026',author).run();
  await env.DB.prepare(`INSERT INTO academy_events(id,user_id,event_type,resource_id,title,details_json,created_at) VALUES(?,?, 'knowledge_submit',?,?, '{}',?)`)
    .bind(crypto.randomUUID(),user.id,id,title,at).run();
  return json({ok:true,id,status:'pending',author,message:'Przypadek zapisany. Zostanie sprawdzony pod kątem merytorycznym, praw i anonimizacji przed dodaniem do wspólnej wiedzy.'},201);
}
