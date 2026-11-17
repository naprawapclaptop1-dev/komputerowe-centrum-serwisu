import fs from 'node:fs';
import assert from 'node:assert/strict';
const api=fs.readFileSync('functions/api/admin/health.js','utf8');
const ui=fs.readFileSync('WEB_PUBLISH/assets/academy-admin-center-fix209.js','utf8');
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const providers=['google','microsoft','facebook','github','discord'];
const checks=[
['endpoint uses same-origin and existing admin token authorization',api.includes('sameOrigin(request)')&&api.includes('checkAdmin(request,env)')],
['endpoint checks D1 connectivity and required tables',api.includes('SELECT 1 AS ok')&&api.includes('sqlite_master')&&api.includes('academy_user_state_chunks')&&api.includes('academy_exam_attempts')],
['all five enabled providers are checked without enabling X',providers.every(p=>api.includes(p+':'))&&!api.includes("x:['")],
['secrets and account data are explicitly never returned',api.includes('secretsReturned:false')&&api.includes('accountDataReturned:false')],
['UI reuses current adminToken and fetches the protected endpoint',ui.includes("getElementById('adminToken')")&&ui.includes("fetch('/api/admin/health'")&&ui.includes('authorization:`Bearer ${token}`')],
['admin health panel is mounted in existing page and PWA',html.includes('id="a209RunHealth"')&&html.includes('id="a209HealthOutput"')&&html.includes('academy-admin-center-fix209.js?v=6.8.0-fix209')&&html.includes('academy-admin-center-fix209.css?v=6.8.0-fix209')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX209 ADMIN HEALTH: ${checks.length}/${checks.length} PASS`);
