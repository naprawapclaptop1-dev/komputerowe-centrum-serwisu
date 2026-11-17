import fs from 'node:fs';import assert from 'node:assert/strict';
const cert=fs.readFileSync('functions/api/certificates.js','utf8'),ui=fs.readFileSync('WEB_PUBLISH/assets/academy-master-curriculum-fix162.js','utf8'),admin=fs.readFileSync('functions/api/admin/health.js','utf8');
for(const [label,ok] of [
 ['certificate API creates public verification URL',cert.includes('verificationUrl=new URL(`/api/certificates?id=${encodeURIComponent(id)}`,request.url)')],
 ['certificate UI prints verification link',ui.includes('Sprawdź w rejestrze Akademii')],
 ['certificate UI links lookup result',ui.includes('Otwórz publiczny wpis weryfikacyjny')],
 ['legacy record remains explicitly unverified',cert.includes('LEGACY_RECORD_FOUND')&&cert.includes('isServerGraded:false')],
 ['admin health aggregates metrics',admin.includes('customQuestions')&&admin.includes('announcements')&&admin.includes('attendance')],
 ['admin health avoids personal-data return',admin.includes('personalDataReturned:false')&&admin.includes('secretsReturned:false')]
]){console.log(`${ok?'[PASS]':'[FAIL]'} ${label}`);assert.ok(ok,label)}
console.log('FIX227/FIX228 CERTIFICATE + ADMIN CONTRACT: 6/6 PASS');
