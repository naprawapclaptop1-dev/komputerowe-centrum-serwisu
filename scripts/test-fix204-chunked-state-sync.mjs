import fs from 'node:fs';
import assert from 'node:assert/strict';
const api=fs.readFileSync('functions/api/state.js','utf8');
const client=fs.readFileSync('WEB_PUBLISH/assets/cloud-academy.js','utf8');
const migration=fs.readFileSync('migrations/0018_academy_user_state_chunks_fix204.sql','utf8');
const checks=[
['API accepts up to 12 fragments of 30k characters',api.includes('CHUNK_SIZE = 30000')&&api.includes('MAX_CHUNKS = 12')&&api.includes('MAX_STATE_CHARS = CHUNK_SIZE * MAX_CHUNKS')],
['client rejects state larger than 360KB and chunks larger snapshots',client.includes('raw.length>360000')&&client.includes('raw.length>30000')&&client.includes('chunks.push(raw.slice(i,i+30000))')],
['fragment contents are validated as a complete JSON value before D1 batch',(/JSON\.parse\((joined|raw)\)/.test(api))&&api.includes('env.DB.batch(statements)')],
['additive D1 schema protects user ownership and fragment bounds',migration.includes('CREATE TABLE IF NOT EXISTS academy_user_state_chunks')&&migration.includes('FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE')&&migration.includes('CHECK (chunk_total BETWEEN 2 AND 12)')],
['account export and deletion include the new table',fs.readFileSync('functions/api/export.js','utf8').includes('FROM academy_user_state_chunks')&&fs.readFileSync('functions/api/me.js','utf8').includes('DELETE FROM academy_user_state_chunks')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX204 CHUNKED STATE SYNC: ${checks.length}/${checks.length} PASS`);
