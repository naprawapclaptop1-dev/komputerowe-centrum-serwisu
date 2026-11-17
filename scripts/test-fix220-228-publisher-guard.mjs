import fs from 'node:fs';import assert from 'node:assert/strict';
const main=fs.readFileSync('ONECLICK_AKADEMIA.js','utf8'),watch=fs.readFileSync('AUTO_PUBLISH_WATCHER.js','utf8');
const release=JSON.parse(fs.readFileSync('WEB_PUBLISH/release.json','utf8'));
for(const [name,source] of [['publisher',main],['watcher',watch]]){
 assert.ok(source.includes('FIX220–FIX228'),`${name} includes release gate`);
 assert.ok(source.includes('0021_state_revision_cas_fix221.sql'),`${name} checks migration 0021`);
 assert.ok(source.includes('0022_admin_exam_bank_fix222.sql'),`${name} checks migration 0022`);
 assert.ok(source.includes('test-fix225-glb-import.mjs'),`${name} checks GLB parser test`);
 assert.ok(source.includes('academy-fix222-exam-bank.js'),`${name} checks UI asset`);
}
assert.equal(release.academyFix220to228?.hotfix,'FIX220–FIX228');
assert.ok(fs.existsSync('scripts/run-tests-fix220-228.mjs'));
console.log('FIX220–FIX228 PUBLISHER/WATCHER GUARDS: 11/11 PASS');
