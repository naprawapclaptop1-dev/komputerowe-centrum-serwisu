from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
conn = sqlite3.connect(':memory:')
conn.execute('PRAGMA foreign_keys = ON')
for migration in [
    root / 'migrations' / '0001_academy_cloud.sql',
    root / 'migrations' / '0019_server_graded_exams_fix208.sql',
    root / 'migrations' / '0023_platform_experience_fix231_239.sql',
]:
    conn.executescript(migration.read_text(encoding='utf-8'))

conn.execute("INSERT INTO academy_users(id,nickname,created_at,last_seen_at) VALUES('student-1','Uczen','2026-01-01','2026-01-01')")
conn.execute("INSERT INTO academy_users(id,nickname,created_at,last_seen_at) VALUES('guardian-1','Opiekun','2026-01-01','2026-01-01')")
conn.execute("INSERT INTO academy_lesson_progress(user_id,lesson_id,status,progress_percent,last_seen_at,completed_at) VALUES('student-1','lesson-1','completed',100,'2026-01-02','2026-01-02')")
conn.execute("INSERT INTO academy_lesson_progress(user_id,lesson_id,status,progress_percent,last_seen_at) VALUES('student-1','lesson-2','started',25,'2026-01-02')")
conn.execute("INSERT INTO academy_exam_attempts(attempt_id,user_id,course_title,student_name,question_payload,status,started_at,expires_at,submitted_at,score,passed) VALUES('attempt-1','student-1','Kurs','Uczen','[]','submitted','2026-01-01','2026-01-02','2026-01-01',90,1)")
conn.execute("INSERT INTO academy_certificates(certificate_id,attempt_id,user_id,student_name,course_title,score,created_at) VALUES('cert-1','attempt-1','student-1','Uczen','Kurs',90,'2026-01-01')")

lessons = conn.execute("SELECT COUNT(*) AS total,SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed FROM academy_lesson_progress WHERE user_id=?", ('student-1',)).fetchone()
attempts = conn.execute("SELECT COUNT(*) AS total,SUM(CASE WHEN passed=1 THEN 1 ELSE 0 END) AS passed FROM academy_exam_attempts WHERE user_id=?", ('student-1',)).fetchone()
certs = conn.execute("SELECT COUNT(*) AS total FROM academy_certificates WHERE user_id=?", ('student-1',)).fetchone()
assert lessons == (2, 1), lessons
assert attempts == (1, 1), attempts
assert certs == (1,), certs

conn.execute("INSERT INTO academy_guardian_links(link_id,student_user_id,guardian_user_id,status,created_at,approved_at) VALUES(?,?,?,'pending',?,NULL)", ('link-1','student-1','guardian-1','2026-01-02'))
conn.execute("UPDATE academy_guardian_links SET status=?,approved_at=? WHERE link_id=? AND student_user_id=? AND status='pending'", ('approved','2026-01-03','link-1','student-1'))
assert conn.execute("SELECT status FROM academy_guardian_links WHERE link_id='link-1'").fetchone() == ('approved',)
conn.execute("UPDATE academy_guardian_links SET status='revoked' WHERE link_id=? AND status IN ('pending','approved')", ('link-1',))
assert conn.execute("SELECT status FROM academy_guardian_links WHERE link_id='link-1'").fetchone() == ('revoked',)
print('[PASS] migracje 0001/0019/0023 tworzą wymagany schemat dla panelu opiekuna')
print('[PASS] zapytania agregujące lekcje, egzaminy i certyfikaty zwracają oczekiwane wyniki')
print('[PASS] tworzenie, zatwierdzanie i cofanie linku opiekuna działa w SQLite')
print('FIX241 GUARDIAN SQL INTEGRATION: 3/3 PASS')
