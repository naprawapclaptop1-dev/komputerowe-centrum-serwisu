import { dbRequired,getSession,json,nowIso,readJson,requireConsent,sameOrigin,text,rateLimit } from '../_lib.js';
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!requireConsent(user))return json({error:'SESSION_AND_CONSENT_REQUIRED'},401);
  if(!await rateLimit(env,`content-report:${user.id}`,5,3600))return json({error:'RATE_LIMIT'},429);
  let body;try{body=await readJson(request,5000)}catch(e){return json({error:'INVALID_JSON',message:e.message},400)}
  const resourceId=text(body.resourceId,180),category=text(body.category,24),description=text(body.description,1200);
  if(!resourceId||!['factual_error','outdated','broken_link','accessibility','copyright','other'].includes(category)||description.length<20)return json({error:'REPORT_FIELDS_INVALID'},400);
  if(/(?:password|hasło|api[_ -]?key|token)\s*[:=]/i.test(description))return json({error:'SENSITIVE_DATA_REJECTED',message:'Nie wklejaj haseł, tokenów, kluczy API ani danych klientów.'},400);
  const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO academy_content_reports(report_id,user_id,resource_id,category,description,status,created_at) VALUES(?,?,?,?,?,"pending",?)').bind(id,user.id,resourceId,category,description,nowIso()).run();
  return json({ok:true,reportId:id,message:'Zgłoszenie zapisane do ręcznego przeglądu. Nie publikuje ani nie zmienia materiału automatycznie.'});
}
