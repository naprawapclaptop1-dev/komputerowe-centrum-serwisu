import fs from 'node:fs';
import assert from 'node:assert/strict';
const cloud=fs.readFileSync('WEB_PUBLISH/assets/cloud-academy.js','utf8');
const api=fs.readFileSync('functions/api/state.js','utf8');
const migration=fs.readFileSync('migrations/0018_academy_user_state_chunks_fix204.sql','utf8');
const allowed=['academyCompletedLessons','academyGuideSteps','academyChecklist','academyBookmarks','academyLanguage','academyLab45ESD','academyLab45Stock','academyLab45Inspector','academyLab45Assignments','academyLab45PowerDone','academyLab45Recovery','academyLabTraining','academyLabModels','academyLabExamLast','academyLabLastTriage','nauka.academy.fix162.v1'];
const syncLine=cloud.match(/const SYNC_KEYS=\[([^\]]+)\]/)?.[1]||'';
const checks=[
['frontend and D1 API authorize the same 16 active state keys',allowed.every(k=>syncLine.includes(`'${k}'`)&&api.includes(`'${k}'`))],
['same-tab writes trigger debounced synchronization',cloud.includes('Storage.prototype')&&cloud.includes('proto.setItem')&&cloud.includes('academy:state-dirty')&&cloud.includes('setTimeout(()=>{syncTimers.delete(key);syncState(key);},650)')],
['cross-tab storage changes are also synchronized',/window\.addEventListener\('storage',event=>\{if\(event\.key\)queueStateSync\(event\.key\);\}\)/.test(cloud)],
['pull phase prevents immediate echo writes',cloud.includes('pullingCloudState=true')&&cloud.includes('finally{pullingCloudState=false;}')],
['large states are divided into 30 KB chunks up to 360 KB',cloud.includes('raw.length>30000')&&cloud.includes('raw.length>360000')&&cloud.includes('chunks.push(raw.slice(i,i+30000))')&&api.includes('CHUNK_SIZE = 30000')&&api.includes('MAX_STATE_CHARS = CHUNK_SIZE * MAX_CHUNKS')],
['D1 migration uses an additive chunk table with bounds and cascade',migration.includes('CREATE TABLE IF NOT EXISTS academy_user_state_chunks')&&migration.includes('CHECK (chunk_index >= 0 AND chunk_index < 12)')&&migration.includes('CHECK (chunk_total BETWEEN 2 AND 12)')&&migration.includes('ON DELETE CASCADE')],
['API validates complete JSON before atomically replacing old/chunked state',(/JSON\.parse\((joined|raw)\)/.test(api))&&api.includes('env.DB.batch(statements)')&&api.includes('STATE_CHUNKS_INVALID')],
['API keeps same-origin, authenticated and consent requirements',api.includes('sameOrigin(request)')&&api.includes('getSession(request,env)')&&api.includes('requireConsent(user)')],
['state deletion and export include chunk rows',fs.readFileSync('functions/api/me.js','utf8').includes('DELETE FROM academy_user_state_chunks')&&fs.readFileSync('functions/api/export.js','utf8').includes('FROM academy_user_state_chunks')],
['remote state is merged before local upload to prevent overwriting newer cloud progress',(cloud.match(/await pullCloudState\(\);await syncLocalToCloud\(\);/g)||[]).length===3],
['chat history remains on its dedicated conversations endpoint',cloud.includes('importLocalConversations')&&cloud.includes("api('/conversations'")]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX202/FIX204 FULL STATE SYNC CONTRACT: ${checks.length}/${checks.length} PASS`);
