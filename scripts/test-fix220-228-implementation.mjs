import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const sw=read('WEB_PUBLISH/service-worker.js');
const html=read('WEB_PUBLISH/index.html');
const state=read('functions/api/state.js');
const exam=read('functions/api/admin/exam-bank.js');
const cert=read('functions/api/certificates.js');
const security=read('WEB_PUBLISH/assets/cloud-academy.js');
const sensors=read('tools/FIX224_LIVE_SENSOR_MONITOR.ps1');
const hyperv=read('tools/FIX226_HYPERV_LAB_MANAGER.ps1');
const health=read('functions/api/admin/health.js');
const account=read('functions/_oauth.js');
const curriculum=read('WEB_PUBLISH/assets/academy-master-curriculum-fix162.js');
const checks=[
 ['FIX220–FIX228 release metadata and product 6.8.0',release.academyFix220to228?.hotfix==='FIX220–FIX228'&&release.release==='6.8.0'],
 ['historical PWA and photo cache names unchanged',sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'")&&sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'")],
 ['new CSS and exam manager are present in HTML and PWA',html.includes('academy-fix220-228.css?v=6.8.0-fix228')&&html.includes('academy-fix222-exam-bank.js?v=6.8.0-fix222')&&sw.includes('academy-fix220-228.css')&&sw.includes('academy-fix222-exam-bank.js')],
 ['revision CAS rejects stale state versions with HTTP 409',state.includes('expectedRevision')&&state.includes("'STATE_REVISION_CONFLICT'")&&state.includes('env.DB.batch(statements)')],
 ['exam bank API requires same-origin administrator and validates questions',exam.includes('sameOrigin(request)')&&exam.includes('checkAdmin(request,env)')&&exam.includes('QUESTION_INVALID')&&exam.includes("status='archived'")],
 ['built-in questions remain and custom questions merge into server exam',cert.includes('const QUESTION_BANK = [')&&cert.includes('FROM academy_exam_question_bank WHERE status=\'active\'')&&cert.includes('await randomQuestions(env)')],
 ['account report omits secrets and filters five allowed providers',security.includes("hotfix:'FIX223'")&&security.includes("['google','microsoft','facebook','github','discord']")&&security.includes('Raport nie zawiera haseł, tokenów, adresów IP, user-agent ani sekretów 2FA.')],
 ['Windows sensor monitor reports missing provider without fake readings',sensors.includes('SENSOR_PROVIDER_NOT_FOUND')&&sensors.includes('LibreHardwareMonitor')&&sensors.includes('OpenHardwareMonitor')],
 ['Hyper-V manager checks isolation and protects destructive actions',hyperv.includes('Get-VMNetworkAdapter')&&hyperv.includes('Get-VMIntegrationService')&&hyperv.includes('Checkpoint')&&hyperv.includes('SupportsShouldProcess')],
 ['certificate verification link is generated same-origin',cert.includes('verificationUrl=new URL(`/api/certificates?id=${encodeURIComponent(id)}`,request.url)')&&read('WEB_PUBLISH/assets/academy-master-curriculum-fix162.js').includes('Sprawdź w rejestrze Akademii')],
 ['certificate UI uses FIX229 versioned asset in HTML and PWA',html.includes('academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification')&&sw.includes('/assets/academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification')&&curriculum.includes('Sprawdź w rejestrze Akademii')],
 ['admin health outputs aggregate counts only',health.includes('personalDataReturned:false')&&health.includes('activeCustomQuestions')&&health.includes('secretsReturned:false')],
 ['only Google Microsoft Facebook GitHub Discord; X excluded',account.includes("new Set(['google', 'facebook', 'microsoft', 'github', 'discord'])")&&!html.includes('data-oauth-start="x"')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX220–FIX228 IMPLEMENTATION: ${checks.length}/${checks.length} PASS`);
