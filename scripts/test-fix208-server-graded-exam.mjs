import fs from 'node:fs';
import assert from 'node:assert/strict';
const api=fs.readFileSync('functions/api/certificates.js','utf8');
const migration=fs.readFileSync('migrations/0019_server_graded_exams_fix208.sql','utf8');
const ui=fs.readFileSync('WEB_PUBLISH/assets/academy-master-curriculum-fix162.js','utf8');
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const checks=[
['server creates randomized 10 question attempts from the curated 50-question bank',api.includes('QUESTION_BANK = [')&&api.includes('.slice(0,10)')&&api.includes('crypto.getRandomValues')],
['answer key is stored in D1 but omitted from start response',api.includes('question_payload')&&api.includes('questions:questions.map(({id,prompt,options})=>({id,prompt,options}))')],
['server calculates score and applies 70 percent threshold',api.includes('const score=Math.round(correct/questions.length*100),passed=score>=70')],
['arbitrary client score issuance is rejected',api.includes('EXAM_ACTION_INVALID')&&!api.includes('body.score')],
['attempt ownership, consent, rate limit and 20 minute expiry are enforced',api.includes('getSession(request, env)')&&api.includes('requireConsent(user)')&&api.includes('rateLimit(env, rateKey, 10, 3600)')&&api.includes('20*60*1000')],
['certificate records are linked to unique server-graded attempts',migration.includes('attempt_id TEXT NOT NULL UNIQUE')&&migration.includes('score INTEGER NOT NULL CHECK (score BETWEEN 70 AND 100)')],
['browser UI starts, answers and submits a server exam',ui.includes("action:'start'")&&ui.includes("action:'submit'")&&html.includes('id="a162ExamSession"')&&html.includes('id="a162ExamSubmit"')],
['legacy platform entries are clearly identified as unverified',api.includes('LEGACY_RECORD_FOUND')&&api.includes('isServerGraded:false')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX208 SERVER-GRADED EXAM: ${checks.length}/${checks.length} PASS`);
