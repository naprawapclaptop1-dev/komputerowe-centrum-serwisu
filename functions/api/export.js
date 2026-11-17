import { dbRequired, getSession, json } from '../_lib.js';
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  const user=await getSession(request,env);if(!user)return json({error:'SESSION_REQUIRED'},401);
  const [events,messages,submissions,state,stateChunks,stateVersions,progress,feedback,conversations,securityEvents,identities,examAttempts,certificates,notifications,guardianAsStudent,guardianAsGuardian,contentReports,notificationPreferences,account]=await Promise.all([
    env.DB.prepare('SELECT event_type,resource_id,title,details_json,created_at FROM academy_events WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT role,content,sources_json,created_at FROM academy_messages WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT title,category,symptoms,diagnosis,procedure,result,status,created_at,reviewed_at,rights_confirmed_at,license_code,attribution FROM academy_knowledge_submissions WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT state_key,state_json,updated_at FROM academy_user_state WHERE user_id=?').bind(user.id).all(),
    env.DB.prepare('SELECT state_key,chunk_index,chunk_total,chunk_json,updated_at FROM academy_user_state_chunks WHERE user_id=? ORDER BY state_key,chunk_index').bind(user.id).all(),
    env.DB.prepare('SELECT state_key,revision,updated_at FROM academy_user_state_versions WHERE user_id=? ORDER BY state_key').bind(user.id).all(),
    env.DB.prepare('SELECT lesson_id,status,progress_percent,last_seen_at,completed_at FROM academy_lesson_progress WHERE user_id=?').bind(user.id).all(),
    env.DB.prepare('SELECT message_id,conversation_id,rating,note,created_at FROM academy_message_feedback WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT id,title,created_at,updated_at FROM academy_conversations WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT event_type,provider,details_json,created_at FROM academy_security_events WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT provider,created_at FROM academy_auth_identities WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT attempt_id,course_title,student_name,status,started_at,expires_at,submitted_at,score,passed,certificate_id FROM academy_exam_attempts WHERE user_id=? ORDER BY started_at').bind(user.id).all(),
    env.DB.prepare('SELECT certificate_id,student_name,course_title,score,created_at,product_version FROM academy_certificates WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT notification_id,notification_type,title,body,resource_url,created_at,read_at FROM academy_notifications WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT l.status,l.created_at,l.approved_at,u.nickname AS guardian_nickname FROM academy_guardian_links l JOIN academy_users u ON u.id=l.guardian_user_id WHERE l.student_user_id=? ORDER BY l.created_at').bind(user.id).all(),
    env.DB.prepare('SELECT l.status,l.created_at,l.approved_at,u.nickname AS student_nickname FROM academy_guardian_links l JOIN academy_users u ON u.id=l.student_user_id WHERE l.guardian_user_id=? ORDER BY l.created_at').bind(user.id).all(),
    env.DB.prepare('SELECT resource_id,category,description,status,created_at,reviewed_at,review_note FROM academy_content_reports WHERE user_id=? ORDER BY created_at').bind(user.id).all(),
    env.DB.prepare('SELECT preferences_json,updated_at FROM academy_notification_preferences WHERE user_id=?').bind(user.id).first(),
    env.DB.prepare('SELECT email_normalized,email_verified_at,locale,terms_accepted_at,terms_version FROM academy_users WHERE id=?').bind(user.id).first()
  ]);
  return json({exportSchema:'6.8.0-fix231',exportedAt:new Date().toISOString(),profile:{id:user.id,nickname:user.nickname,email:account?.email_normalized||null,emailVerifiedAt:account?.email_verified_at||null,locale:account?.locale||'pl',termsAcceptedAt:account?.terms_accepted_at||null,termsVersion:account?.terms_version||null,createdAt:user.created_at},events:events.results||[],messages:messages.results||[],contributions:submissions.results||[],state:state.results||[],stateChunks:stateChunks.results||[],stateVersions:stateVersions.results||[],lessonProgress:progress.results||[],chatFeedback:feedback.results||[],conversations:conversations.results||[],securityEvents:securityEvents.results||[],linkedLoginProviders:(identities.results||[]).map(row=>({provider:row.provider,createdAt:row.created_at})),examAttempts:examAttempts.results||[],certificates:certificates.results||[],notifications:notifications.results||[],guardianLinks:{asStudent:guardianAsStudent.results||[],asGuardian:guardianAsGuardian.results||[]},contentReports:contentReports.results||[],notificationPreferences:notificationPreferences?.preferences_json?(()=>{try{return JSON.parse(notificationPreferences.preferences_json)}catch{return null}})():null,excludedSensitiveData:['password hashes','session tokens','OAuth access/refresh tokens','2FA secrets','recovery-code hashes','Web Push endpoint and encryption keys','API secrets']});
}
