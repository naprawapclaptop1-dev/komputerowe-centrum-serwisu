import pathlib
import sqlite3

ROOT = pathlib.Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE academy_users(id TEXT PRIMARY KEY);
CREATE TABLE academy_user_state(user_id TEXT,state_key TEXT,state_json TEXT,updated_at TEXT,PRIMARY KEY(user_id,state_key));
CREATE TABLE academy_user_state_chunks(user_id TEXT,state_key TEXT,chunk_index INTEGER,chunk_total INTEGER,chunk_json TEXT,updated_at TEXT,PRIMARY KEY(user_id,state_key,chunk_index));
INSERT INTO academy_users VALUES('u1');
INSERT INTO academy_user_state VALUES('u1','academyCompletedLessons','{}','2026-11-17T00:00:00Z');
INSERT INTO academy_user_state_chunks VALUES('u1','academyGuideSteps',0,2,'{\"a\":','2026-11-17T00:00:00Z');
INSERT INTO academy_user_state_chunks VALUES('u1','academyGuideSteps',1,2,'1}','2026-11-17T00:00:00Z');
""")
db.executescript((ROOT / "migrations/0021_state_revision_cas_fix221.sql").read_text(encoding="utf-8"))
db.executescript((ROOT / "migrations/0022_admin_exam_bank_fix222.sql").read_text(encoding="utf-8"))
rows = dict(db.execute("SELECT state_key,revision FROM academy_user_state_versions WHERE user_id='u1'"))
assert rows == {"academyCompletedLessons": 1, "academyGuideSteps": 1}, rows

# Successful compare-and-swap and the same guarded upsert used by the D1 endpoint.
user, key, token, stamp = "u1", "academyCompletedLessons", "token-current", "2026-11-17T01:00:00Z"
db.execute("BEGIN")
changed = db.execute("UPDATE academy_user_state_versions SET revision=revision+1,write_token=?,updated_at=? WHERE user_id=? AND state_key=? AND revision=?", (token, stamp, user, key, 1)).rowcount
assert changed == 1
guarded_upsert = """INSERT INTO academy_user_state(user_id,state_key,state_json,updated_at)
SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM academy_user_state_versions WHERE user_id=? AND state_key=? AND write_token=?)
ON CONFLICT(user_id,state_key) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at
WHERE EXISTS (SELECT 1 FROM academy_user_state_versions WHERE user_id=? AND state_key=? AND write_token=?)"""
db.execute(guarded_upsert, (user,key,'{\"ok\":true}',stamp,user,key,token,user,key,token))
db.commit()
assert db.execute("SELECT revision FROM academy_user_state_versions WHERE user_id=? AND state_key=?", (user,key)).fetchone() == (2,)
assert db.execute("SELECT state_json FROM academy_user_state WHERE user_id=? AND state_key=?", (user,key)).fetchone() == ('{\"ok\":true}',)

# A stale writer using revision 1 cannot acquire the row after the revision advanced to 2.
stale = db.execute("UPDATE academy_user_state_versions SET revision=revision+1,write_token='token-stale' WHERE user_id=? AND state_key=? AND revision=1", (user,key)).rowcount
assert stale == 0

# The admin-managed exam bank rejects invalid difficulty, accepts a valid question.
try:
    db.execute("INSERT INTO academy_exam_question_bank VALUES('bad','serwis','expert','Pytanie testowe jest wystarczająco długie','[\"A\",\"B\"]',0,'active',?,?)", (stamp,stamp))
    raise AssertionError("Invalid difficulty was accepted")
except sqlite3.IntegrityError:
    pass
db.execute("INSERT INTO academy_exam_question_bank VALUES('custom-test','serwis','podstawowy','Pytanie testowe jest wystarczająco długie','[\"A\",\"B\"]',1,'active',?,?)", (stamp,stamp))
assert db.execute("SELECT COUNT(*) FROM academy_exam_question_bank WHERE status='active'").fetchone() == (1,)
print("FIX221/FIX222 SQLite migration and CAS integration: PASS")
