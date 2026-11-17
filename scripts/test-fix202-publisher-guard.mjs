import fs from 'node:fs';
import assert from 'node:assert/strict';
const publisher=fs.readFileSync('ONECLICK_AKADEMIA.js','utf8');
const watcher=fs.readFileSync('AUTO_PUBLISH_WATCHER.js','utf8');
const sw=fs.readFileSync('WEB_PUBLISH/service-worker.js','utf8');
const docs=['CHANGELOG_6.8.0_FIX198.txt','CHANGELOG_6.8.0_FIX199.txt','CHANGELOG_6.8.0_FIX200.txt','CHANGELOG_6.8.0_FIX201.txt','CHANGELOG_6.8.0_FIX202.txt','FIX198_202_IMPLEMENTATION_AUDIT.txt','README_FIX198_HARDWARE.md','README_FIX199_TRUE_3D.md','README_FIX200_HYPERV_ISOLATION.md','README_FIX201_TEACHER_DASHBOARD.md','README_FIX202_STATE_SYNC.md'];
const required=['FIX198_WINDOWS_HARDWARE_COLLECTOR.ps1','FIX200_CREATE_ISOLATED_HYPERV_VM.ps1','FIX200_START_ISOLATED_HYPERV_VM.ps1','FIX200_REMOVE_ISOLATED_HYPERV_VM.ps1','academy-hardware-import-fix198.js','academy-workshop-3d-fix199.js','academy-teacher-dashboard-fix201.css','test-fix198-windows-hardware.mjs','test-fix199-real-3d-workshop.mjs','test-fix200-hyperv-sandbox.mjs','test-fix201-teacher-dashboard.mjs','test-fix202-full-state-sync.mjs'];
const checks=[
['OneClick publication guard validates FIX198–FIX202 resources and metadata',publisher.includes('FIX198–FIX202')&&required.every(x=>publisher.includes(x))&&publisher.includes('academyFullStateSyncFix202')],
['Auto-watcher validates FIX198–FIX202 resources and metadata',watcher.includes('FIX198–FIX202')&&required.every(x=>watcher.includes(x))&&watcher.includes('academyFullStateSyncFix202')],
['PWA core precaches new local importer and 3D renderer',sw.includes('academy-hardware-import-fix198.js')&&sw.includes('academy-workshop-3d-fix199.js')&&sw.includes('academy-teacher-dashboard-fix201.css')],
['All five changelogs, README files and implementation audit are present',docs.every(x=>fs.existsSync(x))],
['Windows one-click test launcher invokes the full FIX202 runner',fs.readFileSync('TESTY_FIX198_FIX202.cmd','utf8').includes('scripts\\run-tests-fix202.mjs')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX202 RELEASE GUARD CONTRACT: ${checks.length}/${checks.length} PASS`);
