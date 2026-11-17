import { checkAdmin, dbRequired, json, sameOrigin } from '../../_lib.js';
const has=(env,key)=>!!String(env?.[key]||'').trim();
async function count(db,sql){try{const row=await db.prepare(sql).first();return{available:true,value:Number(row?.total||0)};}catch{return{available:false,value:null};}}
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED',message:'Wymagany jest poprawny ADMIN_REVIEW_TOKEN.'},401);
  const checks={d1:{ok:false,detail:'Nie sprawdzono'},schema:{ok:false,missing:[]},gemini:{configured:has(env,'GEMINI_API_KEY')},oauth:{}};
  try{await env.DB.prepare('SELECT 1 AS ok').first();checks.d1={ok:true,detail:'Połączenie D1 odpowiada'};}catch{checks.d1={ok:false,detail:'Zapytanie kontrolne D1 nie powiodło się'};}
  const requiredTables=['academy_users','academy_sessions','academy_events','academy_user_state','academy_user_state_chunks','academy_user_state_versions','academy_exam_question_bank','academy_exam_attempts','academy_certificates','academy_security_events','academy_notification_preferences','academy_notifications','academy_push_subscriptions','academy_guardian_invites','academy_guardian_links','academy_content_reports'];
  try{const result=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();const names=new Set((result.results||[]).map(x=>x.name));checks.schema.missing=requiredTables.filter(name=>!names.has(name));checks.schema.ok=checks.schema.missing.length===0;}catch{checks.schema.missing=['Nie udało się odczytać schematu'];}
  const providers={google:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'],microsoft:['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET'],facebook:['FACEBOOK_CLIENT_ID','FACEBOOK_CLIENT_SECRET'],github:['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET'],discord:['DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET']};
  for(const [provider,keys] of Object.entries(providers))checks.oauth[provider]={configured:keys.every(key=>has(env,key)),missingKeys:keys.filter(key=>!has(env,key))};
  const [users,activeSessions,events,attempts,certificates,classes,securityEvents,stateKeys,customQuestions,activeQuestions,announcements,attendance,notifications,pushSubscriptions,guardianLinks,contentReports]=await Promise.all([
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_users'),
    count(env.DB,`SELECT COUNT(*) AS total FROM academy_sessions WHERE expires_at > datetime('now')`),
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_events'),
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_exam_attempts'),
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_certificates'),
    count(env.DB,"SELECT COUNT(*) AS total FROM academy_events WHERE event_type='academy_classroom_created'"),
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_security_events'),
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_user_state_versions'),
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_exam_question_bank'),
    count(env.DB,"SELECT COUNT(*) AS total FROM academy_exam_question_bank WHERE status='active'"),
    count(env.DB,"SELECT COUNT(*) AS total FROM academy_events WHERE event_type='academy_classroom_announcement'"),
    count(env.DB,"SELECT COUNT(*) AS total FROM academy_events WHERE event_type='academy_classroom_attendance'"),
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_notifications'),
    count(env.DB,'SELECT COUNT(*) AS total FROM academy_push_subscriptions'),
    count(env.DB,"SELECT COUNT(*) AS total FROM academy_guardian_links WHERE status='approved'"),
    count(env.DB,"SELECT COUNT(*) AS total FROM academy_content_reports WHERE status='pending'")
  ]);
  const analytics={users,activeSessions,events,examAttempts:attempts,certificates,classes,securityEvents,stateKeys,customQuestions,activeCustomQuestions:activeQuestions,announcements,attendance,notifications,pushSubscriptions,approvedGuardianLinks:guardianLinks,pendingContentReports:contentReports,personalDataReturned:false};
  const configured=Object.values(checks.oauth).filter(value=>value.configured).length;
  return json({ok:checks.d1.ok&&checks.schema.ok,checkedAt:new Date().toISOString(),productVersion:'6.8.0',runtime:'To są zagregowane dane bieżącej instancji D1. Nie potwierdzają dostępności zewnętrznych dostawców ani statusu ostatniego deployu.',checks:{...checks,oauthSummary:{configured,total:5,allConfigured:configured===5}},analytics,security:{secretsReturned:false,accountDataReturned:false,adminTokenStored:false,rawIpStored:false}});
}
