import { checkAdmin, dbRequired, json, nowIso, readJson, sameOrigin, text } from '../../_lib.js';
const DIFFICULTIES=new Set(['podstawowy','średni','zaawansowany']);
function validateQuestion(body){
  const category=text(body.category,80),difficulty=DIFFICULTIES.has(body.difficulty)?body.difficulty:'',prompt=text(body.prompt,500);
  const options=Array.isArray(body.options)?body.options.slice(0,6).map(value=>text(value,240)):[];
  const correctIndex=Number(body.correctIndex);
  if(category.length<2||!difficulty||prompt.length<12||options.length<2||options.some(value=>value.length<1)||new Set(options.map(x=>x.toLocaleLowerCase('pl-PL'))).size!==options.length||!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=options.length)return null;
  return {category,difficulty,prompt,options,correctIndex};
}
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED'},401);
  try{
    const [rows,totals]=await Promise.all([
      env.DB.prepare('SELECT question_id,category,difficulty,prompt,options_json,correct_index,status,created_at,updated_at FROM academy_exam_question_bank ORDER BY updated_at DESC LIMIT 300').all(),
      env.DB.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) AS archived FROM academy_exam_question_bank").first()
    ]);
    return json({ok:true,questions:(rows.results||[]).map(row=>{let options=[];try{options=JSON.parse(row.options_json)}catch{}return{id:row.question_id,category:row.category,difficulty:row.difficulty,prompt:row.prompt,options,correctIndex:row.correct_index,status:row.status,createdAt:row.created_at,updatedAt:row.updated_at}}),totals:totals||{total:0,active:0,archived:0},builtInQuestionCount:50});
  }catch(error){if(/no such table/i.test(String(error?.message||error)))return json({error:'EXAM_BANK_MIGRATION_REQUIRED',message:'Zastosuj migrację 0022_admin_exam_bank_fix222.sql.'},503);throw error;}
}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  if(!await checkAdmin(request,env))return json({error:'ADMIN_AUTH_REQUIRED'},401);
  let body;try{body=await readJson(request,5000)}catch(error){return json({error:'INVALID_JSON',message:error.message},400)}
  const action=text(body.action,16),at=nowIso();
  if(action==='archive'){
    const id=text(body.id,80);if(!/^custom-[a-f0-9-]{20,40}$/i.test(id))return json({error:'QUESTION_ID_INVALID'},400);
    const result=await env.DB.prepare("UPDATE academy_exam_question_bank SET status='archived',updated_at=? WHERE question_id=? AND status='active'").bind(at,id).run();
    if(!result.meta?.changes)return json({error:'QUESTION_NOT_ACTIVE'},404);
    return json({ok:true,id,status:'archived'});
  }
  if(action!=='create'&&action!=='update')return json({error:'ACTION_INVALID'},400);
  const q=validateQuestion(body);if(!q)return json({error:'QUESTION_INVALID',message:'Sprawdź kategorię, trudność, treść, 2–6 unikalnych odpowiedzi i indeks prawidłowej odpowiedzi.'},400);
  if(action==='create'){
    const id=`custom-${crypto.randomUUID()}`;
    await env.DB.prepare("INSERT INTO academy_exam_question_bank(question_id,category,difficulty,prompt,options_json,correct_index,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'active',?,?)")
      .bind(id,q.category,q.difficulty,q.prompt,JSON.stringify(q.options),q.correctIndex,at,at).run();
    return json({ok:true,id,status:'active'},201);
  }
  const id=text(body.id,80);if(!/^custom-[a-f0-9-]{20,40}$/i.test(id))return json({error:'QUESTION_ID_INVALID'},400);
  const result=await env.DB.prepare("UPDATE academy_exam_question_bank SET category=?,difficulty=?,prompt=?,options_json=?,correct_index=?,updated_at=? WHERE question_id=? AND status='active'")
    .bind(q.category,q.difficulty,q.prompt,JSON.stringify(q.options),q.correctIndex,at,id).run();
  if(!result.meta?.changes)return json({error:'QUESTION_NOT_ACTIVE'},404);
  return json({ok:true,id,status:'active'});
}
