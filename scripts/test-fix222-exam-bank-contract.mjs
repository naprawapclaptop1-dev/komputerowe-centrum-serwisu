import fs from 'node:fs';import assert from 'node:assert/strict';
const api=fs.readFileSync('functions/api/admin/exam-bank.js','utf8'),exam=fs.readFileSync('functions/api/certificates.js','utf8'),html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
for(const [label,ok] of [
 ['admin same-origin gate',api.includes('sameOrigin(request)')],['admin token gate',api.includes('checkAdmin(request,env)')],['question validation',api.includes('QUESTION_INVALID')&&api.includes('DIFFICULTIES')],['archive-only removal',api.includes("status='archived'")],['custom questions join server bank',exam.includes('academy_exam_question_bank')&&exam.includes('await randomQuestions(env)')],['answer key excluded from browser',exam.includes('questions.map(({id,prompt,options})')],['admin form connected',html.includes('a222QuestionForm')&&html.includes('academy-fix222-exam-bank.js')]
]){console.log(`${ok?'[PASS]':'[FAIL]'} ${label}`);assert.ok(ok,label)}
console.log('FIX222 EXAM BANK CONTRACT: 7/7 PASS');
