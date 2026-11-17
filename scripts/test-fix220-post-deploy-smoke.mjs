import fs from 'node:fs';import assert from 'node:assert/strict';
const smoke=fs.readFileSync('scripts/post-deploy-smoke-fix220.mjs','utf8');const health=fs.readFileSync('functions/api/health.js','utf8');
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');const sw=fs.readFileSync('WEB_PUBLISH/service-worker.js','utf8');
assert.ok(html.includes('academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification'));
assert.ok(sw.includes('/assets/academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification'));
for(const needle of ['NAUKA_SMOKE_URL','/api/health','/api/auth/status','NAUKA_SMOKE_COOKIE','NAUKA_SMOKE_ADMIN_TOKEN','/api/admin/health','/api/admin/exam-bank','FIX220_POST_DEPLOY_SMOKE.json'])assert.ok(smoke.includes(needle),`missing ${needle}`);
assert.ok(!smoke.includes('console.log(cookie)')&&!smoke.includes('console.log(adminToken)'),'credentials must never be logged');
assert.ok(health.includes("productVersion:'6.8.0'")&&health.includes('academy_user_state_versions')&&health.includes('academy_exam_question_bank'));
console.log('[PASS] FIX220 public and optional authenticated smoke test contract');console.log('[PASS] public health reports required FIX221/FIX222 migrations');
