import { dbRequired, getSession, hashedClientRateKey, json, nowIso, readJson, rateLimit, sameOrigin, text } from '../../_lib.js';
const CATEGORIES = new Set(['Diagnostyka','Elektronika i PCB','Laptopy i komputery','Laboratoria','Katalog modeli','Dostępność i platforma']);
export async function onRequestGet({request,env}) {
  const missing=dbRequired(env); if(missing)return missing;
  const user=await getSession(request,env).catch(()=>null);
  const rows=await env.DB.prepare(`SELECT p.id,p.title,p.category,p.details,p.status,p.created_at,
    (SELECT COUNT(*) FROM academy_support_proposal_votes v WHERE v.proposal_id=p.id) AS votes,
    CASE WHEN ?<>'' AND EXISTS(SELECT 1 FROM academy_support_proposal_votes v WHERE v.proposal_id=p.id AND v.user_id=?) THEN 1 ELSE 0 END AS voted
    FROM academy_support_proposals p WHERE p.status='approved' ORDER BY votes DESC,p.created_at DESC LIMIT 60`).bind(user?.id||'',user?.id||'').all();
  let mine=[];
  if(user) { const own=await env.DB.prepare(`SELECT id,title,category,details,status,created_at,reviewed_at,moderation_note FROM academy_support_proposals WHERE user_id=? AND status='pending' ORDER BY created_at DESC LIMIT 30`).bind(user.id).all(); mine=own.results||[]; }
  return json({items:rows.results||[],mine,authenticated:!!user});
}
export async function onRequestPost({request,env}) {
  const missing=dbRequired(env); if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);
  if(!user)return json({error:'ACCOUNT_REQUIRED',message:'Utwórz bezpłatny profil autora lub zaloguj się, aby wysłać propozycję i głosować.'},401);
  if(!await rateLimit(env,`support-proposal:${user.id}`,8,3600))return json({error:'RATE_LIMIT',message:'Osiągnięto godzinny limit propozycji i głosów.'},429);
  if(!await rateLimit(env,await hashedClientRateKey(request,'support-proposal-submit'),24,3600))return json({error:'NETWORK_RATE_LIMIT',message:'Zbyt wiele operacji z tej sieci. Spróbuj później.'},429);
  let b;try{b=await readJson(request,5000)}catch(e){return json({error:e.message},400)}
  const action=text(b.action,24);
  if(action==='submit'){
    const title=text(b.title,100),details=text(b.details,1200),category=CATEGORIES.has(b.category)?b.category:'Inne';
    if(title.length<8||details.length<25)return json({error:'PROPOSAL_INCOMPLETE',message:'Temat musi mieć co najmniej 8 znaków, a uzasadnienie 25 znaków.'},400);
    if(b.shareConsent!==true)return json({error:'SHARE_CONSENT_REQUIRED',message:'Zaznacz zgodę na przekazanie propozycji do moderacji.'},400);
    const id=crypto.randomUUID(),at=nowIso();
    await env.DB.prepare(`INSERT INTO academy_support_proposals(id,user_id,title,category,details,status,created_at) VALUES(?,?,?,?,?,'pending',?)`).bind(id,user.id,title,category,details,at).run();
    return json({ok:true,id,status:'pending',message:'Propozycja została przekazana do moderacji. Nie oznacza to obietnicy terminu realizacji.'},201);
  }
  if(action==='vote'||action==='unvote'){
    const id=text(b.id,80);if(!id)return json({error:'PROPOSAL_ID_REQUIRED'},400);
    const proposal=await env.DB.prepare(`SELECT id,status FROM academy_support_proposals WHERE id=?`).bind(id).first();
    if(!proposal||proposal.status!=='approved')return json({error:'PROPOSAL_NOT_VOTABLE',message:'Ta propozycja nie jest obecnie dostępna do głosowania.'},404);
    if(action==='vote')await env.DB.prepare(`INSERT OR IGNORE INTO academy_support_proposal_votes(id,proposal_id,user_id,created_at) VALUES(?,?,?,?)`).bind(crypto.randomUUID(),id,user.id,nowIso()).run();
    else await env.DB.prepare(`DELETE FROM academy_support_proposal_votes WHERE proposal_id=? AND user_id=?`).bind(id,user.id).run();
    const count=await env.DB.prepare(`SELECT COUNT(*) AS votes FROM academy_support_proposal_votes WHERE proposal_id=?`).bind(id).first();
    return json({ok:true,voted:action==='vote',votes:Number(count?.votes||0)});
  }
  return json({error:'INVALID_ACTION'},400);
}
