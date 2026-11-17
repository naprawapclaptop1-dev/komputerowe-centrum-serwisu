import { dbRequired, getSession, json, nowIso, readJson, requireConsent, sameOrigin, text } from '../_lib.js';
const ALLOWED = new Set(['academyCompletedLessons','academyGuideSteps','academyChecklist','academyBookmarks','academyLanguage','academyChatHistory','academyLab45ESD','academyLab45Stock','academyLab45Inspector','academyLab45Assignments','academyLab45PowerDone','academyLab45Recovery','academyLabTraining','academyLabModels','academyLabExamLast','academyLabLastTriage','nauka.academy.fix162.v1']);
const CHUNK_SIZE = 30000, MAX_CHUNKS = 12, MAX_STATE_CHARS = CHUNK_SIZE * MAX_CHUNKS;
const revisionError = error => /no such table.*academy_user_state_versions/i.test(String(error?.message || error));
export async function onRequestGet({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  const user=await getSession(request,env);if(!requireConsent(user))return json({error:'CONSENT_REQUIRED'},401);
  try {
    const [small,chunks,versionRows]=await Promise.all([
      env.DB.prepare('SELECT state_key,state_json,updated_at FROM academy_user_state WHERE user_id=?').bind(user.id).all(),
      env.DB.prepare('SELECT state_key,chunk_index,chunk_total,chunk_json,updated_at FROM academy_user_state_chunks WHERE user_id=? ORDER BY state_key,chunk_index').bind(user.id).all(),
      env.DB.prepare('SELECT state_key,revision,updated_at FROM academy_user_state_versions WHERE user_id=?').bind(user.id).all()
    ]);
    const state={},versions={};
    for(const row of small.results||[]){if(!ALLOWED.has(row.state_key))continue;try{state[row.state_key]=JSON.parse(row.state_json)}catch{}}
    const groups=new Map();
    for(const row of chunks.results||[]){if(!ALLOWED.has(row.state_key))continue;const group=groups.get(row.state_key)||{total:row.chunk_total,parts:[]};if(group.total!==row.chunk_total)continue;group.parts[row.chunk_index]=row.chunk_json;groups.set(row.state_key,group);}
    for(const [key,group] of groups){if(group.parts.length!==group.total||group.parts.some(x=>typeof x!=='string'))continue;try{state[key]=JSON.parse(group.parts.join(''))}catch{}}
    for(const row of versionRows.results||[])if(ALLOWED.has(row.state_key))versions[row.state_key]={revision:Number(row.revision)||0,updatedAt:row.updated_at||null};
    for(const key of Object.keys(state))if(!versions[key])versions[key]={revision:0,updatedAt:null};
    return json({ok:true,state,versions,conflictPolicy:'optimistic-revision-cas',maxStateCharacters:MAX_STATE_CHARS});
  } catch(error) {
    if(revisionError(error))return json({error:'STATE_VERSION_MIGRATION_REQUIRED',message:'Wymagana jest migracja D1 0021_state_revision_cas_fix221.sql.'},503);
    if(/no such table.*academy_user_state_chunks/i.test(String(error?.message||error)))return json({error:'STATE_CHUNK_MIGRATION_REQUIRED',message:'Wymagana jest migracja D1 0018.'},503);
    throw error;
  }
}
export async function onRequestPost({request,env}){
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!requireConsent(user))return json({error:'CONSENT_REQUIRED'},401);
  let body;try{body=await readJson(request,MAX_STATE_CHARS+14000)}catch(e){return json({error:e.message},400)}
  const key=text(body.key,48);if(!ALLOWED.has(key))return json({error:'STATE_KEY_NOT_ALLOWED'},400);
  let chunks=null,raw='';
  if(Array.isArray(body.chunks)){
    chunks=body.chunks;
    if(chunks.length<2||chunks.length>MAX_CHUNKS||chunks.some((part,index)=>typeof part!=='string'||part.length===0||part.length>CHUNK_SIZE||(index<chunks.length-1&&part.length!==CHUNK_SIZE)))return json({error:'STATE_CHUNKS_INVALID',message:'Porcje synchronizacji mają nieprawidłowy rozmiar lub kolejność.'},400);
    raw=chunks.join('');if(raw.length>MAX_STATE_CHARS)return json({error:'STATE_TOO_LARGE'},413);
    try{JSON.parse(raw)}catch{return json({error:'STATE_JSON_INVALID'},400)}
  }else{
    raw=JSON.stringify(body.value);if(raw.length>42000)return json({error:'STATE_TOO_LARGE',message:'Duży stan należy wysłać w porcjach.'},413);
    try{JSON.parse(raw)}catch{return json({error:'STATE_JSON_INVALID'},400)}
  }
  const at=nowIso(),token=crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT OR IGNORE INTO academy_user_state_versions(user_id,state_key,revision,write_token,updated_at) VALUES(?,?,0,NULL,NULL)').bind(user.id,key).run();
    const current=await env.DB.prepare('SELECT revision FROM academy_user_state_versions WHERE user_id=? AND state_key=?').bind(user.id,key).first();
    const actual=Number(current?.revision)||0;
    const expected=body.expectedRevision===undefined?actual:Number(body.expectedRevision);
    if(!Number.isSafeInteger(expected)||expected<0)return json({error:'STATE_REVISION_INVALID'},400);
    const statements=[env.DB.prepare('UPDATE academy_user_state_versions SET revision=revision+1,write_token=?,updated_at=? WHERE user_id=? AND state_key=? AND revision=?').bind(token,at,user.id,key,expected)];
    const guarded='EXISTS (SELECT 1 FROM academy_user_state_versions WHERE user_id=? AND state_key=? AND write_token=?)';
    if(chunks){
      statements.push(env.DB.prepare(`DELETE FROM academy_user_state WHERE user_id=? AND state_key=? AND ${guarded}`).bind(user.id,key,user.id,key,token));
      statements.push(env.DB.prepare(`DELETE FROM academy_user_state_chunks WHERE user_id=? AND state_key=? AND ${guarded}`).bind(user.id,key,user.id,key,token));
      for(let i=0;i<chunks.length;i++)statements.push(env.DB.prepare(`INSERT INTO academy_user_state_chunks(user_id,state_key,chunk_index,chunk_total,chunk_json,updated_at) SELECT ?,?,?,?,?,? WHERE ${guarded}`).bind(user.id,key,i,chunks.length,chunks[i],at,user.id,key,token));
    }else{
      statements.push(env.DB.prepare(`DELETE FROM academy_user_state_chunks WHERE user_id=? AND state_key=? AND ${guarded}`).bind(user.id,key,user.id,key,token));
      statements.push(env.DB.prepare(`INSERT INTO academy_user_state(user_id,state_key,state_json,updated_at) SELECT ?,?,?,? WHERE ${guarded} ON CONFLICT(user_id,state_key) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at WHERE ${guarded}`)
        .bind(user.id,key,raw,at,user.id,key,token,user.id,key,token));
    }
    const results=await env.DB.batch(statements);
    const changed=Number(results?.[0]?.meta?.changes??results?.[0]?.changes??0);
    if(changed!==1){const latest=await env.DB.prepare('SELECT revision,updated_at FROM academy_user_state_versions WHERE user_id=? AND state_key=?').bind(user.id,key).first();return json({error:'STATE_REVISION_CONFLICT',message:'Dane zostały zmienione na innym urządzeniu. Lokalna kopia pozostała bez zmian; pobierz raport konfliktu przed ręcznym scaleniem.',currentRevision:Number(latest?.revision)||0,updatedAt:latest?.updated_at||null},409);}
    return json({ok:true,key,revision:expected+1,updatedAt:at,chunks:chunks?.length||1,characters:raw.length});
  }catch(error){
    if(revisionError(error))return json({error:'STATE_VERSION_MIGRATION_REQUIRED',message:'Wymagana jest migracja D1 0021_state_revision_cas_fix221.sql.'},503);
    if(/no such table.*academy_user_state_chunks/i.test(String(error?.message||error)))return json({error:'STATE_CHUNK_MIGRATION_REQUIRED',message:'Wymagana jest addytywna migracja D1 0018.'},503);
    throw error;
  }
}
