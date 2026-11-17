import fs from 'node:fs';import assert from 'node:assert/strict';
const api=fs.readFileSync('functions/api/state.js','utf8');const migration=fs.readFileSync('migrations/0021_state_revision_cas_fix221.sql','utf8');const client=fs.readFileSync('WEB_PUBLISH/assets/cloud-academy.js','utf8');
for(const [label,condition] of [
 ['migration creates per-key revision table',migration.includes('academy_user_state_versions')&&migration.includes('PRIMARY KEY (user_id, state_key)')],
 ['legacy records receive initial revision',migration.includes('FROM academy_user_state')&&migration.includes('FROM academy_user_state_chunks')],
 ['API receives expected revision',api.includes('body.expectedRevision')],
 ['API uses atomic D1 batch guarded by token',api.includes('write_token')&&api.includes('env.DB.batch(statements)')],
 ['stale writes return 409',api.includes("'STATE_REVISION_CONFLICT'")],
 ['client sends and stores revision',client.includes('expectedRevision')&&client.includes('SYNC_VERSION_KEY')],
 ['client preserves conflict and blocks blind retry',client.includes('queue[key]?.conflict')&&client.includes('STATE_REVISION_CONFLICT')]
]){console.log(`${condition?'[PASS]':'[FAIL]'} ${label}`);assert.ok(condition,label)}
console.log('FIX221 STATE REVISION CONTRACT: 7/7 PASS');
