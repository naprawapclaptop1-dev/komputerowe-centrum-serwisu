import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const js=fs.readFileSync('WEB_PUBLISH/assets/academy-master-curriculum-fix162.js','utf8');
const api=fs.readFileSync('functions/api/classroom.js','utf8');
const css=fs.readFileSync('WEB_PUBLISH/assets/academy-teacher-dashboard-fix201.css','utf8');
const sw=fs.readFileSync('WEB_PUBLISH/service-worker.js','utf8');
const checks=[
['extends existing classroom workspace without a new view',html.includes('id="a162TeacherDashboard"')&&html.includes('id="a162TeacherMetrics"')&&!html.includes('id="view-classroom"')],
['teacher-only analytics are hidden for students',js.includes("dashboard.hidden=!classData.isTeacher")],
['computes submitted work, pending grades, average score and active students',js.includes('pending=submissions.length-graded.length')&&js.includes('const average=scores.length')&&js.includes('roster.size')],
['student roster includes joined members as well as learners with submissions',js.includes('roster.set(member.userId')&&js.includes('sub.studentUserId||sub.studentNickname')&&api.includes('academy_classroom_member')&&api.includes('academy_classroom_submission')],
['CSV report export is implemented and formula injection is neutralized',js.includes('NAUKA_OD_A_DO_Z_RAPORT_KLASY_FIX201.csv')&&js.includes('const safe=/^[\\s\\u0000-\\u001f]*[=+\\-@]/.test(raw)')],
['backend continues to enforce session consent and teacher-only grading',api.includes('requireConsent(user)')&&api.includes('data.ownerId !== auth.user.id')],
['dashboard uses existing classroom API and D1 event store',api.includes('academy_events')&&js.includes("'/api/classroom'")],
['teacher dashboard stylesheet is linked and precached offline',html.includes('academy-teacher-dashboard-fix201.css?v=6.8.0-fix203')&&sw.includes('academy-teacher-dashboard-fix201.css?v=6.8.0-fix203')&&css.includes('.a162-teacher-metrics')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX201 TEACHER DASHBOARD CONTRACT: ${checks.length}/${checks.length} PASS`);
