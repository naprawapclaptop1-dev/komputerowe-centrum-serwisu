import { dbRequired, getSession, json, nowIso, readJson, requireConsent, sameOrigin, text, rateLimit, sha256Hex } from '../_lib.js';
import { createPlatformNotification, notifyClassMembers } from '../_notifications.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map(value => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('');
}
function cleanCode(value) { return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); }
function parseDetails(row) { try { return JSON.parse(row.details_json || '{}'); } catch { return {}; } }
async function currentUser(request, env) {
  const user = await getSession(request, env);
  if (!requireConsent(user)) return { response: json({ error: 'SESSION_AND_CONSENT_REQUIRED', message: 'Zaloguj się i zaakceptuj synchronizację danych, aby korzystać z klas online.' }, 401) };
  return { user };
}
async function getClass(env, code) {
  const hash = await sha256Hex(`nauka-academy-class:${code}`);
  const created = await env.DB.prepare("SELECT id,user_id,title,details_json,created_at FROM academy_events WHERE event_type='academy_classroom_created' AND resource_id=? ORDER BY created_at DESC LIMIT 1").bind(hash).first();
  if (!created) return null;
  const rows = await env.DB.prepare("SELECT id,user_id,event_type,resource_id,title,details_json,created_at FROM academy_events WHERE resource_id=? AND event_type IN ('academy_classroom_created','academy_classroom_assignment','academy_classroom_submission','academy_classroom_grade','academy_classroom_member','academy_classroom_attendance','academy_classroom_announcement') ORDER BY created_at ASC LIMIT 600").bind(hash).all();
  const events = rows.results || [];
  const info = parseDetails(created);
  const assignments = [], submissions = [], grades = [], members = [], attendance = [], announcements = [];
  for (const row of events) {
    const detail = parseDetails(row);
    if (row.event_type === 'academy_classroom_assignment') assignments.push({ id: detail.assignmentId || row.id, title: text(detail.title || row.title, 180), description: text(detail.description, 1200), dueAt: text(detail.dueAt, 20), createdAt: row.created_at });
    if (row.event_type === 'academy_classroom_submission') submissions.push({ id: detail.submissionId || row.id, assignmentId: text(detail.assignmentId, 80), studentNickname: text(detail.studentNickname || 'Uczeń', 60), answer: text(detail.answer, 4000), submittedAt: row.created_at, studentUserId: row.user_id });
    if (row.event_type === 'academy_classroom_grade') grades.push({ submissionId: text(detail.submissionId, 80), score: Number(detail.score), feedback: text(detail.feedback, 900), gradedAt: row.created_at });
    if (row.event_type === 'academy_classroom_member') members.push({ userId: row.user_id, nickname: text(detail.nickname || 'Uczeń', 60), role: detail.role === 'teacher' ? 'teacher' : 'student', joinedAt: row.created_at });
    if (row.event_type === 'academy_classroom_attendance') attendance.push({ memberUserId: text(detail.memberUserId, 80), date: text(detail.date, 10), status: text(detail.status, 12), note: text(detail.note, 240), markedAt: row.created_at, markedBy: row.user_id });
    if (row.event_type === 'academy_classroom_announcement') announcements.push({ id: row.id, title: text(row.title, 180), message: text(detail.message, 1200), createdAt: row.created_at });
  }
  const latestMembers = [...new Map(members.map(member => [member.userId, member])).values()];
  return { hash, ownerId: created.user_id, info, assignments, submissions, grades, members: latestMembers, attendance, announcements, createdAt: created.created_at };
}
async function insertEvent(env, user, eventType, resourceId, title, details) {
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO academy_events (id,user_id,event_type,resource_id,title,details_json,created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(id, user.id, eventType, resourceId, text(title, 180), JSON.stringify(details || {}).slice(0, 6000), nowIso()).run();
  return id;
}
function buildClassAnalytics(data) {
  const latestGrades = new Map();
  for (const grade of data.grades) latestGrades.set(grade.submissionId, grade);
  const graded = [...latestGrades.values()];
  const scores = graded.map(item => Number(item.score)).filter(value => Number.isFinite(value));
  const students = data.members.filter(member => member.role === 'student');
  const pending = data.submissions.filter(item => !latestGrades.has(item.id)).length;
  const attendance = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const row of data.attendance) if (attendance[row.status] !== undefined) attendance[row.status]++;
  return { studentCount: students.length, assignmentCount: data.assignments.length, submissionCount: data.submissions.length, gradedCount: graded.length, pendingGrades: pending, averageScore: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null, attendance };
}
export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const auth = await currentUser(request, env); if (auth.response) return auth.response;
  const code = cleanCode(new URL(request.url).searchParams.get('code'));
  if (code.length !== 10) return json({ error: 'CLASS_CODE_INVALID', message: 'Kod klasy musi mieć 10 znaków.' }, 400);
  const data = await getClass(env, code);
  if (!data) return json({ error: 'CLASS_NOT_FOUND', message: 'Nie znaleziono klasy. Sprawdź kod zaproszenia.' }, 404);
  const isTeacher = data.ownerId === auth.user.id;
  const isMember = data.members.some(member => member.userId === auth.user.id);
  if (!isTeacher && !isMember) return json({ error: 'CLASS_MEMBERSHIP_REQUIRED', message: 'Najpierw dołącz do klasy kodem zaproszenia.' }, 403);
  return json({ ok: true, class: {
    className: text(data.info.className, 100), courseTitle: text(data.info.courseTitle, 140), description: text(data.info.description, 500), teacherNickname: text(data.info.teacherNickname || 'Nauczyciel', 60),
    createdAt: data.createdAt, isTeacher,
    assignments: data.assignments,
    announcements: data.announcements.slice(-30).reverse(),
    analytics: isTeacher ? buildClassAnalytics(data) : undefined,
    members: isTeacher ? data.members : data.members.filter(member => member.userId === auth.user.id).map(({ userId, ...member }) => member),
    attendance: isTeacher ? data.attendance : data.attendance.filter(item => item.memberUserId === auth.user.id),
    submissions: isTeacher ? data.submissions : data.submissions.filter(item => item.studentUserId === auth.user.id).map(({ studentUserId, ...item }) => item),
    grades: isTeacher ? data.grades : data.grades.filter(grade => data.submissions.some(sub => sub.id === grade.submissionId && sub.studentUserId === auth.user.id))
  }});
}
export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  const auth = await currentUser(request, env); if (auth.response) return auth.response;
  if (!await rateLimit(env, `academy-classroom:${auth.user.id}`, 30, 3600)) return json({ error: 'CLASSROOM_RATE_LIMIT', message: 'Limit działań klasy został osiągnięty. Spróbuj później.' }, 429);
  let body; try { body = await readJson(request, 9000); } catch (error) { return json({ error: 'INVALID_JSON', message: error.message }, 400); }
  const action = text(body.action, 24);
  if (action === 'create') {
    const className = text(body.className, 100), courseTitle = text(body.courseTitle, 140), description = text(body.description, 500);
    if (!className || !courseTitle) return json({ error: 'CLASS_FIELDS_REQUIRED', message: 'Podaj nazwę klasy i tytuł kursu.' }, 400);
    let code = makeCode(), existing = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const hash = await sha256Hex(`nauka-academy-class:${code}`);
      existing = await env.DB.prepare("SELECT id FROM academy_events WHERE event_type='academy_classroom_created' AND resource_id=? LIMIT 1").bind(hash).first();
      if (!existing) break;
      code = makeCode();
    }
    const hash = await sha256Hex(`nauka-academy-class:${code}`);
    await insertEvent(env, auth.user, 'academy_classroom_created', hash, courseTitle, { className, courseTitle, description, teacherNickname: text(auth.user.nickname || 'Nauczyciel', 60), createdAt: nowIso(), schema: 1 });
    await insertEvent(env, auth.user, 'academy_classroom_member', hash, 'Nauczyciel klasy', { nickname: text(auth.user.nickname || 'Nauczyciel', 60), role: 'teacher' });
    return json({ ok: true, inviteCode: code, className, courseTitle, message: 'Klasa została utworzona. Kod pokaż uczniom — można go użyć do dołączenia.' });
  }
  const code = cleanCode(body.code);
  if (code.length !== 10) return json({ error: 'CLASS_CODE_INVALID', message: 'Wpisz 10-znakowy kod zaproszenia.' }, 400);
  const data = await getClass(env, code);
  if (!data) return json({ error: 'CLASS_NOT_FOUND', message: 'Nie znaleziono klasy.' }, 404);
  if (action === 'join') {
    if (data.ownerId !== auth.user.id && !data.members.some(member => member.userId === auth.user.id)) {
      await insertEvent(env, auth.user, 'academy_classroom_member', data.hash, 'Uczeń dołączył do klasy', { nickname: text(auth.user.nickname || 'Uczeń', 60), role: 'student' });
    }
    return json({ ok: true, joined: true, className: text(data.info.className, 100), message: 'Dołączono do klasy.' });
  }
  if (action === 'announcement') {
    if (data.ownerId !== auth.user.id) return json({ error: 'TEACHER_REQUIRED', message: 'Tylko nauczyciel może publikować ogłoszenia.' }, 403);
    const title=text(body.title,180), message=text(body.message,1200);
    if(!title||!message)return json({error:'ANNOUNCEMENT_FIELDS_REQUIRED',message:'Podaj tytuł i treść ogłoszenia.'},400);
    const id=await insertEvent(env,auth.user,'academy_classroom_announcement',data.hash,title,{message});
    await notifyClassMembers(env,data,auth.user.id,{type:'announcement',title:`Ogłoszenie: ${title}`,body:message,url:'/?view=account'});
    return json({ok:true,announcementId:id,message:'Ogłoszenie zostało opublikowane.'});
  }
  if (action === 'attendance') {
    if (data.ownerId !== auth.user.id) return json({ error: 'TEACHER_REQUIRED', message: 'Tylko nauczyciel może oznaczać obecność.' }, 403);
    const memberUserId = text(body.memberUserId, 80), date = text(body.date, 10), status = text(body.status, 12);
    const parsedDate = new Date(`${date}T00:00:00Z`);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsedDate.valueOf()) && parsedDate.toISOString().slice(0, 10) === date;
    if (!data.members.some(member => member.userId === memberUserId && member.role === 'student')) return json({ error: 'CLASS_MEMBER_NOT_FOUND' }, 404);
    if (!validDate || !['present','absent','late','excused'].includes(status)) return json({ error: 'ATTENDANCE_INVALID', message: 'Nieprawidłowa data lub status obecności.' }, 400);
    await insertEvent(env, auth.user, 'academy_classroom_attendance', data.hash, 'Obecność ucznia', { memberUserId, date, status, note: text(body.note, 240) });
    return json({ ok: true, message: 'Obecność została zapisana.' });
  }
  if (data.ownerId !== auth.user.id && !data.members.some(member => member.userId === auth.user.id)) return json({ error: 'CLASS_MEMBERSHIP_REQUIRED', message: 'Dołącz do klasy przed wykonaniem tej czynności.' }, 403);
  if (action === 'assignment') {
    if (data.ownerId !== auth.user.id) return json({ error: 'TEACHER_REQUIRED', message: 'Tylko autor klasy może dodawać zadania.' }, 403);
    const title = text(body.title, 180), description = text(body.description, 1200), dueAt = text(body.dueAt, 20);
    if (!title || !description) return json({ error: 'ASSIGNMENT_FIELDS_REQUIRED', message: 'Podaj temat i treść zadania.' }, 400);
    const assignmentId = crypto.randomUUID();
    await insertEvent(env, auth.user, 'academy_classroom_assignment', data.hash, title, { assignmentId, title, description, dueAt, createdBy: text(auth.user.nickname, 60) });
    await notifyClassMembers(env,data,auth.user.id,{type:'assignment',title:`Nowe zadanie: ${title}`,body:description,url:'/?view=account'});
    return json({ ok: true, assignmentId, message: 'Zadanie zostało opublikowane dla klasy.' });
  }
  if (action === 'submit') {
    const assignmentId = text(body.assignmentId, 80), answer = text(body.answer, 4000);
    if (!data.assignments.some(item => item.id === assignmentId)) return json({ error: 'ASSIGNMENT_NOT_FOUND' }, 404);
    if (!answer) return json({ error: 'ANSWER_REQUIRED', message: 'Wpisz odpowiedź lub raport z ćwiczenia.' }, 400);
    const submissionId = crypto.randomUUID();
    await insertEvent(env, auth.user, 'academy_classroom_submission', data.hash, 'Praca ucznia', { submissionId, assignmentId, studentNickname: text(auth.user.nickname || 'Uczeń', 60), answer });
    await createPlatformNotification(env,data.ownerId,{type:'submission',title:'Nowa praca ucznia',body:`Uczeń ${text(auth.user.nickname||'Uczeń',60)} przekazał odpowiedź do zadania.`,url:'/?view=account'}).catch(()=>null);
    return json({ ok: true, submissionId, message: 'Praca została przekazana nauczycielowi.' });
  }
  if (action === 'grade') {
    if (data.ownerId !== auth.user.id) return json({ error: 'TEACHER_REQUIRED', message: 'Tylko nauczyciel może oceniać prace.' }, 403);
    const submissionId = text(body.submissionId, 80), score = Number(body.score), feedback = text(body.feedback, 900);
    const submission = data.submissions.find(item => item.id === submissionId);
    if (!submission) return json({ error: 'SUBMISSION_NOT_FOUND' }, 404);
    if (!Number.isInteger(score) || score < 0 || score > 100) return json({ error: 'SCORE_INVALID', message: 'Ocena musi mieścić się w zakresie 0–100.' }, 400);
    await insertEvent(env, auth.user, 'academy_classroom_grade', data.hash, 'Ocena pracy', { submissionId, score, feedback, graderNickname: text(auth.user.nickname || 'Nauczyciel', 60) });
    await createPlatformNotification(env,submission.studentUserId,{type:'grade',title:'Oceniono Twoją pracę',body:`Otrzymana ocena: ${score}/100. ${feedback}`,url:'/?view=account'}).catch(()=>null);
    return json({ ok: true, message: 'Ocena została zapisana.' });
  }
  return json({ error: 'ACTION_INVALID' }, 400);
}
