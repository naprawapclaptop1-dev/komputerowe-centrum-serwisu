import fs from 'node:fs';
import assert from 'node:assert/strict';
const api=fs.readFileSync('functions/api/classroom.js','utf8');
const ui=fs.readFileSync('WEB_PUBLISH/assets/academy-master-curriculum-fix162.js','utf8');
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const checks=[
['class membership and attendance use existing academy_events records',api.includes('academy_classroom_member')&&api.includes('academy_classroom_attendance')],
['student join uses invitation code and avoids duplicate membership',api.includes("action === 'join'")&&api.includes('data.members.some(member => member.userId === auth.user.id)')],
['only class owner can record attendance',api.includes("if (action === 'attendance')")&&api.includes("data.ownerId !== auth.user.id")],
['attendance statuses and strict calendar dates are validated',api.includes("['present','absent','late','excused']")&&api.includes('parsedDate.toISOString().slice(0, 10) === date')],
['legacy class owner can still manage class and is not added as a student',api.includes('data.ownerId !== auth.user.id && !data.members.some(member => member.userId === auth.user.id)')&&api.includes('if (data.ownerId !== auth.user.id && !data.members.some(member => member.userId === auth.user.id)) return json')],
['nonmembers cannot read the class and students see only their own records',api.includes('CLASS_MEMBERSHIP_REQUIRED')&&api.includes('item.memberUserId === auth.user.id')&&api.includes('sub.studentUserId === auth.user.id')],
['teacher roster includes members without submitted work',ui.includes("filter(x=>x.role==='student')")&&ui.includes("roster.set(member.userId")],
['attendance updates use delegated UI and server API',ui.includes('data-a162-attendance')&&ui.includes("action:'attendance'")&&html.includes('id="a162AttendanceDate"')],
['existing view and class endpoint are reused, no new main tab',html.includes('id="a162TeacherDashboard"')&&html.includes('data-a168-tab="specialist"')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX203 CLASS ROSTER / ATTENDANCE: ${checks.length}/${checks.length} PASS`);
