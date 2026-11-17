import { json } from '../_lib.js';
const REQUIRED_TABLES=['academy_users','academy_sessions','academy_events','academy_user_state','academy_user_state_chunks','academy_user_state_versions','academy_exam_attempts','academy_certificates','academy_exam_question_bank','academy_security_events','academy_notification_preferences','academy_notifications','academy_push_subscriptions','academy_guardian_invites','academy_guardian_links','academy_content_reports'];
export async function onRequestGet({env}){
  if(!env?.DB)return json({ok:false,productVersion:'6.8.0',database:false,schemaReady:false},503);
  try{
    await env.DB.prepare('SELECT 1 AS ok').first();
    const result=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const names=new Set((result.results||[]).map(row=>row.name));
    const missing=REQUIRED_TABLES.filter(name=>!names.has(name));
    return json({ok:missing.length===0,productVersion:'6.8.0',database:true,schemaReady:missing.length===0,missingMigrationCount:missing.length,globalVisits:await env.DB.prepare('SELECT 1 FROM academy_site_daily_visits LIMIT 1').first().then(()=>true).catch(()=>false),at:new Date().toISOString()},missing.length?503:200);
  }catch{
    return json({ok:false,productVersion:'6.8.0',database:true,schemaReady:false,message:'Nie udało się sprawdzić schematu D1. Sprawdź migracje i binding DB.'},503);
  }
}
