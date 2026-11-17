import fs from 'node:fs';
import assert from 'node:assert/strict';
const oneClick=fs.readFileSync('ONECLICK_AKADEMIA.js','utf8');
const watcher=fs.readFileSync('AUTO_PUBLISH_WATCHER.js','utf8');
const sw=fs.readFileSync('WEB_PUBLISH/service-worker.js','utf8');
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const release=JSON.parse(fs.readFileSync('WEB_PUBLISH/release.json','utf8'));
const markers=['FIX203–FIX209','academyClassMembershipAttendanceFix203','academyChunkedStateSyncFix204','academyHardwareAssessmentFix205','academyWebglWorkshopFix206','academyHyperVStaticTriageFix207','academyServerGradedExamFix208','academyAdminHealthFix209','test-fix203-class-roster-attendance.mjs','test-fix209-admin-health.mjs'];
const assets=['academy-teacher-dashboard-fix201.css?v=6.8.0-fix203','academy-hardware-import-fix198.js?v=6.8.0-fix205','academy-hardware-import-fix198.css?v=6.8.0-fix205','academy-workshop-3d-fix199.js?v=6.8.0-fix225-glb-import','academy-workshop-3d-fix199.css?v=6.8.0-fix206','academy-admin-center-fix209.js?v=6.8.0-fix209','academy-admin-center-fix209.css?v=6.8.0-fix209','cloud-academy.js?v=6.8.0-fix221-revision-sync'];
const docs=['CHANGELOG_6.8.0_FIX203_209.txt','FIX203_209_IMPLEMENTATION_AUDIT.txt','README_FIX203_CLASSROOM.md','README_FIX204_CHUNK_SYNC.md','README_FIX205_HARDWARE_ASSESSMENT.md','README_FIX206_WEBGL.md','README_FIX207_SAFE_TRIAGE.md','README_FIX208_EXAMS.md','README_FIX209_ADMIN_HEALTH.md'];
const checks=[
['OneClick blocks release when FIX203–FIX209 runtime contracts or files are incomplete',markers.every(x=>oneClick.includes(x))],
['Auto-publisher watcher checks the new resources and release metadata',watcher.includes('FIX203–FIX209')&&watcher.includes('fix203Files')&&watcher.includes('academyAdminHealthFix209')&&watcher.includes('fix203PwaValid')&&watcher.includes('verifyHtmlAssetsInServiceWorker')&&watcher.includes('fix203AssetAudit')],
['All updated HTML assets are precached by PWA with matching query strings',assets.every(x=>html.includes(x)&&sw.includes(x))],
['Seven fix metadata objects describe the staged implementation',Object.keys(release).filter(k=>/academy(ClassMembershipAttendance|ChunkedStateSync|HardwareAssessment|WebglWorkshop|HyperVStaticTriage|ServerGradedExam|AdminHealth)Fix20[3-9]/.test(k)).length===7],
['Changelog, implementation audit and per-fix README files are present',docs.every(x=>fs.existsSync(x))],
['D1 migrations remain additive and the original product version is unchanged',fs.readFileSync('migrations/0018_academy_user_state_chunks_fix204.sql','utf8').includes('CREATE TABLE IF NOT EXISTS')&&fs.readFileSync('migrations/0019_server_graded_exams_fix208.sql','utf8').includes('CREATE TABLE IF NOT EXISTS')&&release.release==='6.8.0'],
['historical PWA cache name remains unchanged',sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'")]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX203–FIX209 RELEASE GUARD: ${checks.length}/${checks.length} PASS`);
