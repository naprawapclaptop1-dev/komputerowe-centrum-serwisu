import fs from 'node:fs';
import assert from 'node:assert/strict';
for (const file of ['README_FIX229_PWA_CERT_CACHE.md','CHANGELOG_6.8.0_FIX229.txt','scripts/test-fix229-certificate-cache.mjs','scripts/run-tests-fix220-229.mjs','TESTY_FIX220_FIX229.cmd']) assert.ok(fs.existsSync(file), `missing ${file}`);
for (const file of ['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js']) { const s=fs.readFileSync(file,'utf8'); assert.ok(s.includes('academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification')); assert.ok(s.includes('README_FIX229_PWA_CERT_CACHE.md')); assert.ok(s.includes('academyFix229')); }
console.log('FIX229 PUBLISHER GUARD: 8/8 PASS');
