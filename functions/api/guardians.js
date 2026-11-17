import { dbRequired,getSession,json,nowIso,randomToken,readJson,requireConsent,sameOrigin,sha256Hex,text,rateLimit } from '../_lib.js';
import { createPlatformNotification } from '../_notifications.js';
const makeId=()=>crypto.randomUUID();
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;const user=await getSession(request,env);if(!requireConsent(user))return json({error:'SESSION_AND_CONSENT_REQUIRED'},401);
  const [asStudent,asGuardian]=await Promise.all([
    env.DB.prepare('SELECT l.link_id,l.guardian_user_id,l.status,l.created_at,l.approved_at,u.nickname FROM academy_guardian_links l JOIN academy_users u ON u.id=l.guardian_user_id WHERE l.student_user_id=? ORDER BY l.created_at DESC').bind(user.id).all(),
    env.DB.prepare('SELECT l.link_id,l.student_user_id,l.status,l.created_at,l.approved_at,u.nickname FROM academy_guardian_links l JOIN academy_users u ON u.id=l.student_user_id WHERE l.guardian_user_id=? ORDER BY l.created_at DESC').bind(user.id).all()
  ]);
  const children=[];
  for(const link of (asGuardian.results||[]).filter(x=>x.status==='approved')){
    const [lessons,attempts,certificates]=await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed FROM academy_lesson_progress WHERE user_id=?").bind(link.student_user_id).first(),
      env.DB.prepare('SELECT COUNT(*) AS total,SUM(CASE WHEN passed=1 THEN 1 ELSE 0 END) AS passed FROM academy_exam_attempts WHERE user_id=?').bind(link.student_user_id).first(),
      env.DB.prepare('SELECT COUNT(*) AS total FROM academy_certificates WHERE user_id=?').bind(link.student_user_id).first()
    ]);
    children.push({linkId:link.link_id,nickname:text(link.nickname,60),lessons:{total:Number(lessons?.total||0),completed:Number(lessons?.completed||0)},exams:{total:Number(attempts?.total||0),passed:Number(attempts?.passed||0)},certificates:Number(certificates?.total||0)});
  }
  return json({ok:true,asStudent:asStudent.results||[],asGuardian:asGuardian.results||[],children,privacy:'Opiekun widzi wyłącznie zagregowany postęp nauki, egzaminy i liczbę certyfikatów. Bez rozmów, notatek, haseł i prywatnej historii.'});
}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!requireConsent(user))return json({error:'SESSION_AND_CONSENT_REQUIRED'},401);
  if(!await rateLimit(env,`guardian:${user.id}`,8,3600))return json({error:'RATE_LIMIT'},429);
  let body;try{body=await readJson(request,4000)}catch(e){return json({error:'INVALID_JSON',message:e.message},400)}
  const action=text(body.action,24),at=nowIso();
  if(action==='create-invite'){
    const token=randomToken(),hash=await sha256Hex(`academy-guardian:${token}`),inviteId=makeId(),expires=new Date(Date.now()+48*3600000).toISOString();
    await env.DB.prepare('INSERT INTO academy_guardian_invites(invite_id,student_user_id,token_hash,expires_at,created_at,claimed_at,revoked_at) VALUES(?,?,?,?,?,NULL,NULL)').bind(inviteId,user.id,hash,expires,at).run();
    return json({ok:true,code:token,expiresAt:expires,message:'Kod jest widoczny tylko teraz. Przekaż go wybranej osobie dorosłej.'});
  }
  if(action==='request-link'){
    const token=String(body.code||'').trim();if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))return json({error:'INVITE_INVALID'},400);
    const hash=await sha256Hex(`academy-guardian:${token}`),invite=await env.DB.prepare('SELECT invite_id,student_user_id,expires_at,claimed_at,revoked_at FROM academy_guardian_invites WHERE token_hash=? LIMIT 1').bind(hash).first();
    if(!invite||invite.revoked_at||invite.claimed_at||Date.parse(invite.expires_at)<Date.now()||invite.student_user_id===user.id)return json({error:'INVITE_INVALID_OR_EXPIRED'},404);
    const existing=await env.DB.prepare('SELECT link_id FROM academy_guardian_links WHERE student_user_id=? AND guardian_user_id=? LIMIT 1').bind(invite.student_user_id,user.id).first();
    if(existing)return json({error:'LINK_ALREADY_EXISTS'},409);
    // Claim is conditional and must win exactly once. This prevents two simultaneous
    // requests from consuming the same invitation and creating multiple links.
    const claimed=await env.DB.prepare('UPDATE academy_guardian_invites SET claimed_at=? WHERE invite_id=? AND claimed_at IS NULL AND revoked_at IS NULL AND expires_at>?').bind(at,invite.invite_id,at).run();
    if(Number(claimed.meta?.changes||0)!==1)return json({error:'INVITE_INVALID_OR_ALREADY_CLAIMED'},409);
    const linkId=makeId();
    try{await env.DB.prepare("INSERT INTO academy_guardian_links(link_id,student_user_id,guardian_user_id,status,created_at,approved_at) VALUES(?,?,?,'pending',?,NULL)").bind(linkId,invite.student_user_id,user.id,at).run();}
    catch(error){if(/unique/i.test(String(error?.message||error)))return json({error:'LINK_ALREADY_EXISTS'},409);throw error;}
    await createPlatformNotification(env,invite.student_user_id,{type:'security',title:'Prośba o dostęp opiekuna',body:'Ktoś poprosił o dostęp do ograniczonego raportu postępów. Zatwierdź lub odrzuć prośbę w ustawieniach konta.',url:'/?view=account'}).catch(()=>null);
    return json({ok:true,linkId,message:'Prośba wysłana. Uczeń musi ją zatwierdzić.'});
  }
  const linkId=text(body.linkId,80);if(!linkId)return json({error:'LINK_REQUIRED'},400);
  const link=await env.DB.prepare('SELECT link_id,student_user_id,guardian_user_id,status FROM academy_guardian_links WHERE link_id=? LIMIT 1').bind(linkId).first();if(!link)return json({error:'LINK_NOT_FOUND'},404);
  if(action==='approve'||action==='reject'||action==='revoke'){
    if(action==='approve'||action==='reject'){
      if(link.student_user_id!==user.id)return json({error:'STUDENT_APPROVAL_REQUIRED'},403);
      const status=action==='approve'?'approved':'rejected';await env.DB.prepare("UPDATE academy_guardian_links SET status=?,approved_at=? WHERE link_id=? AND student_user_id=? AND status='pending'").bind(status,action==='approve'?at:null,linkId,user.id).run();
      if(action==='approve')await createPlatformNotification(env,link.guardian_user_id,{type:'security',title:'Opiekun został zatwierdzony',body:'Uczeń zatwierdził dostęp do ograniczonego raportu postępów.',url:'/?view=account'}).catch(()=>null);
    }else{
      if(link.student_user_id!==user.id&&link.guardian_user_id!==user.id)return json({error:'LINK_ACCESS_DENIED'},403);
      await env.DB.prepare("UPDATE academy_guardian_links SET status='revoked' WHERE link_id=? AND status IN ('pending','approved')").bind(linkId).run();
    }
    return json({ok:true,status:action==='approve'?'approved':action==='reject'?'rejected':'revoked'});
  }
  return json({error:'ACTION_INVALID'},400);
}
