import { checkAdmin, dbRequired, json, nowIso, readJson, sameOrigin, text } from '../../_lib.js';
const KINDS=new Set(['release','lesson','maintenance','community']);
const COST_CATEGORIES=new Set(['Hosting i infrastruktura','Domena i DNS','Kopie bezpieczeństwa','Usługi i licencje','Materiały edukacyjne','Inne']);
const httpsUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}};
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED'},401);
  const [proposals,costs,announcements]=await Promise.all([
    env.DB.prepare(`SELECT id,title,category,details,status,created_at FROM academy_support_proposals WHERE status='pending' ORDER BY created_at ASC LIMIT 100`).all(),
    env.DB.prepare(`SELECT id,period,category,amount_minor,currency,note,evidence_url,status,created_at FROM academy_support_costs ORDER BY created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT id,title,summary,kind,status,created_at,published_at FROM academy_support_announcements ORDER BY created_at DESC LIMIT 50`).all()
  ]);
  return json({proposals:proposals.results||[],costs:costs.results||[],announcements:announcements.results||[]});
}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED'},401);
  let b;try{b=await readJson(request,5000)}catch(e){return json({error:e.message},400)}
  const action=text(b.action,32),at=nowIso();
  if(action==='review-proposal'){
    const id=text(b.id,80),status=b.status==='approved'?'approved':b.status==='rejected'?'rejected':'';
    if(!id||!status)return json({error:'INVALID_REVIEW'},400);
    const result=await env.DB.prepare(`UPDATE academy_support_proposals SET status=?,moderation_note=?,reviewed_at=? WHERE id=? AND status='pending'`).bind(status,text(b.note,500),at,id).run();
    if(!result.meta?.changes)return json({error:'PROPOSAL_NOT_PENDING'},404);
    await env.DB.prepare(`INSERT INTO academy_audit_log(id,actor_id,action,target_id,details_json,created_at) VALUES(?,NULL,?,?,?,?)`).bind(crypto.randomUUID(),`support_proposal_${status}`,id,'{}',at).run();
    return json({ok:true,id,status});
  }
  if(action==='create-cost'){
    const period=text(b.period,7),category=COST_CATEGORIES.has(b.category)?b.category:'Inne';
    const raw=String(b.amount??'').trim().replace(',','.');
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)||!/^\d{1,8}(?:\.\d{1,2})?$/.test(raw))return json({error:'INVALID_COST',message:'Podaj poprawny okres RRRR-MM i dodatnią kwotę w PLN.'},400);
    const amountMinor=Math.round(Number(raw)*100);if(!Number.isSafeInteger(amountMinor)||amountMinor<=0||amountMinor>100000000000)return json({error:'INVALID_COST_AMOUNT'},400);
    const evidence=httpsUrl(text(b.evidenceUrl,500)),publish=b.publishNow===true;
    if(publish&&!evidence)return json({error:'EVIDENCE_REQUIRED',message:'Do publikacji kosztu wymagany jest publiczny link HTTPS do dowodu.'},400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO academy_support_costs(id,period,category,amount_minor,currency,note,evidence_url,status,created_at,published_at) VALUES(?,?,?,?,'PLN',?,?,?, ?,?)`).bind(id,period,category,amountMinor,text(b.note,500),evidence,publish?'published':'draft',at,publish?at:null).run();
    return json({ok:true,id,status:publish?'published':'draft'} ,201);
  }
  if(action==='publish-cost'){
    const id=text(b.id,80),evidence=httpsUrl(text(b.evidenceUrl,500));
    if(!id||!evidence)return json({error:'EVIDENCE_REQUIRED',message:'Wymagany jest poprawny publiczny link HTTPS do dowodu kosztu.'},400);
    const r=await env.DB.prepare(`UPDATE academy_support_costs SET evidence_url=?,status='published',published_at=? WHERE id=? AND status='draft'`).bind(evidence,at,id).run();
    if(!r.meta?.changes)return json({error:'COST_NOT_DRAFT'},404);
    return json({ok:true,id,status:'published'});
  }
  if(action==='publish-announcement'){
    const id=text(b.id,80);if(!id)return json({error:'ANNOUNCEMENT_ID_REQUIRED'},400);
    const r=await env.DB.prepare(`UPDATE academy_support_announcements SET status='published',published_at=? WHERE id=? AND status='draft'`).bind(at,id).run();
    if(!r.meta?.changes)return json({error:'ANNOUNCEMENT_NOT_DRAFT'},404);
    return json({ok:true,id,status:'published'});
  }
  if(action==='create-announcement'){
    const title=text(b.title,100),summary=text(b.summary,700),kind=KINDS.has(b.kind)?b.kind:'release',publish=b.publishNow===true;
    if(title.length<5||summary.length<20)return json({error:'ANNOUNCEMENT_INCOMPLETE',message:'Tytuł musi mieć 5, a treść 20 znaków.'},400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO academy_support_announcements(id,title,summary,kind,status,created_at,published_at) VALUES(?,?,?,?,?,?,?)`).bind(id,title,summary,kind,publish?'published':'draft',at,publish?at:null).run();
    return json({ok:true,id,status:publish?'published':'draft'},201);
  }
  return json({error:'INVALID_ACTION'},400);
}
