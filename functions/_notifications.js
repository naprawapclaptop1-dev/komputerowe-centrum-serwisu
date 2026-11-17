import { nowIso, text } from './_lib.js';
import { sendWebPush, webPushConfigured } from './_webpush.js';
import { sendTransactionalEmail } from './_mail.js';
const htmlEscape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const defaults={announcement:true,assignment:true,submission:true,grade:true,exam:true,security:true,platform:true,email:false,push:false};
function parsePrefs(value){try{return {...defaults,...JSON.parse(value||'{}')}}catch{return {...defaults}}}
export async function createPlatformNotification(env,userId,{type='platform',title,body='',url='/'}={}){
  if(!userId||!title)return;
  const safeUrl=typeof url==='string'&&url.startsWith('/')&&!url.startsWith('//')?url:'/';
  const [prefRow,user]=await Promise.all([
    env.DB.prepare('SELECT preferences_json FROM academy_notification_preferences WHERE user_id=?').bind(userId).first(),
    env.DB.prepare('SELECT email_normalized,email_verified_at,nickname FROM academy_users WHERE id=?').bind(userId).first()
  ]);
  const prefs=parsePrefs(prefRow?.preferences_json);
  if (prefs[type] === false) return null;
  const id=crypto.randomUUID(),at=nowIso();
  await env.DB.prepare('INSERT INTO academy_notifications(notification_id,user_id,notification_type,title,body,resource_url,created_at,read_at) VALUES(?,?,?,?,?,?,?,NULL)')
    .bind(id,userId,type,text(title,140),text(body,700),safeUrl,at).run();
  if(prefs.push&&webPushConfigured(env)){
    const rows=await env.DB.prepare('SELECT subscription_id,endpoint,p256dh,auth_secret FROM academy_push_subscriptions WHERE user_id=?').bind(userId).all();
    for(const subscription of rows.results||[]){try{await sendWebPush(subscription,{title:text(title,100),body:text(body,180),url:safeUrl,tag:`nauka-${type}-${id}`},env);await env.DB.prepare('UPDATE academy_push_subscriptions SET last_used_at=? WHERE subscription_id=?').bind(at,subscription.subscription_id).run();}catch(error){if([404,410].includes(error.status))await env.DB.prepare('DELETE FROM academy_push_subscriptions WHERE subscription_id=?').bind(subscription.subscription_id).run();}}
  }
  if(prefs.email&&user?.email_normalized&&user?.email_verified_at&&env.RESEND_API_KEY&&env.AUTH_EMAIL_FROM){
    try{await sendTransactionalEmail(env,{to:user.email_normalized,subject:`Nauka od A do Z: ${text(title,100)}`,text:`Witaj ${text(user.nickname,50)}.\n\n${text(body,700)}\n\nOtwórz platformę: ${safeUrl}\n\nZarządzaj powiadomieniami w ustawieniach konta.`,html:`<p>Witaj ${htmlEscape(user.nickname)}</p><h2>${htmlEscape(title)}</h2><p>${htmlEscape(body)}</p><p><a href="${htmlEscape(new URL(safeUrl,env.AUTH_PUBLIC_URL||'https://example.invalid').toString())}">Otwórz platformę</a></p><p>Zarządzaj powiadomieniami w ustawieniach konta.</p>`,idempotencyKey:`notification/${id}`});}catch{/* Inbox remains authoritative; email is best effort. */}
  }
  return id;
}
export async function notifyClassMembers(env,data,actorId,notification){
  const recipients=(data.members||[]).filter(member=>member.role==='student'&&member.userId!==actorId).map(member=>member.userId);
  await Promise.all(recipients.map(userId=>createPlatformNotification(env,userId,notification).catch(()=>null)));
}
