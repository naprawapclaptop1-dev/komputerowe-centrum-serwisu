import pathlib, sqlite3
ROOT=pathlib.Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('CREATE TABLE academy_users(id TEXT PRIMARY KEY); INSERT INTO academy_users VALUES (\'student-1\'),(\'guardian-1\');')
db.executescript((ROOT/'migrations/0023_platform_experience_fix231_239.sql').read_text(encoding='utf-8'))
# Preferences and inbox are account-bound and cascade on deletion.
db.execute("INSERT INTO academy_notification_preferences(user_id,preferences_json,updated_at) VALUES('student-1','{\"grade\":false}','2026-11-17T00:00:00Z')")
db.execute("INSERT INTO academy_notifications(notification_id,user_id,notification_type,title,created_at) VALUES('n1','student-1','grade','Ocena','2026-11-17T00:00:00Z')")
assert db.execute("SELECT preferences_json FROM academy_notification_preferences WHERE user_id='student-1'").fetchone()[0]=='{"grade":false}'
# Web push host/key data tied to account; duplicate endpoint hashes are rejected.
db.execute("INSERT INTO academy_push_subscriptions(subscription_id,user_id,endpoint,endpoint_hash,p256dh,auth_secret,created_at) VALUES('p1','student-1','https://fcm.googleapis.com/x','hash1','abc','def','2026-11-17T00:00:00Z')")
try:
    db.execute("INSERT INTO academy_push_subscriptions(subscription_id,user_id,endpoint,endpoint_hash,p256dh,auth_secret,created_at) VALUES('p2','guardian-1','https://fcm.googleapis.com/y','hash1','abc','def','2026-11-17T00:00:00Z')")
    raise AssertionError('Duplicate Push endpoint hash accepted')
except sqlite3.IntegrityError:
    pass
# Guardian must have two distinct accounts and one link per pair.
db.execute("INSERT INTO academy_guardian_links(link_id,student_user_id,guardian_user_id,status,created_at) VALUES('g1','student-1','guardian-1','pending','2026-11-17T00:00:00Z')")
try:
    db.execute("INSERT INTO academy_guardian_links(link_id,student_user_id,guardian_user_id,status,created_at) VALUES('g2','student-1','guardian-1','pending','2026-11-17T00:00:00Z')")
    raise AssertionError('Duplicate guardian link accepted')
except sqlite3.IntegrityError:
    pass
try:
    db.execute("INSERT INTO academy_guardian_links(link_id,student_user_id,guardian_user_id,status,created_at) VALUES('g3','student-1','student-1','pending','2026-11-17T00:00:00Z')")
    raise AssertionError('Self guardian link accepted')
except sqlite3.IntegrityError:
    pass
# Reports are moderated states, not auto-published.
db.execute("INSERT INTO academy_content_reports(report_id,user_id,resource_id,category,description,status,created_at) VALUES('r1','student-1','#lesson1','factual_error','Opis testowy błędu treści w lekcji.','pending','2026-11-17T00:00:00Z')")
assert db.execute("SELECT status FROM academy_content_reports WHERE report_id='r1'").fetchone()[0]=='pending'
# Deleting account erases related records.
db.execute("DELETE FROM academy_users WHERE id='student-1'")
for table in ['academy_notification_preferences','academy_notifications','academy_push_subscriptions','academy_guardian_invites','academy_guardian_links','academy_content_reports']:
    assert db.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]==0, table
assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
print('FIX231–FIX239 SQLite migration, constraints and cascade deletion: PASS')
