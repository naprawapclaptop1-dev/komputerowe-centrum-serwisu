import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { onRequestGet, onRequestPost } from '../functions/api/session.js';
import { accountSchemaStatus } from '../functions/_account-schema.js';
import { rateLimit, sha256Hex } from '../functions/_lib.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const migrationNames = fs.readdirSync(path.join(root, 'migrations')).filter(x => /^\d{4}_.*\.sql$/.test(x)).sort();
const db = new DatabaseSync(':memory:');
for (const name of migrationNames.filter(n => Number(n.slice(0,4)) <= 12)) db.exec(read(`migrations/${name}`));
class Statement {
  constructor(sql) { this.sql = sql; this.args = []; }
  bind(...args) { this.args = args; return this; }
  all() { return { results: db.prepare(this.sql).all(...this.args) }; }
  first() { return db.prepare(this.sql).get(...this.args) || null; }
  run() { const result = db.prepare(this.sql).run(...this.args); return { meta: { changes: Number(result.changes) }, changes: Number(result.changes) }; }
}
const env = { DB: { prepare: sql => new Statement(sql) } };
const base = 'https://academy.test';
const request = (purpose, body) => new Request(`${base}/api/session`, {
  method: 'POST', headers: { origin: base, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.77' },
  body: JSON.stringify({ purpose, ...body })
});

// Before FIX25 migration, account routes fail closed with a precise schema status.
const before = await accountSchemaStatus(env);
assert.equal(before.ready, false);
assert.ok(before.missing.includes('academy_account_rate_limits_v3'));
const blocked = await onRequestPost({ request: request('login', { email: 'qa-login-check@example.invalid', password: 'TestInvalidOnly-2026!' }), env });
assert.equal(blocked.status, 503);
const blockedJson = await blocked.json();
assert.equal(blockedJson.error, 'ACCOUNT_SCHEMA_NOT_READY');
assert.ok(blockedJson.accountSchemaMissing.includes('academy_account_rate_limits_v3'));

// A previous 0013 table may exist but be malformed (columns exist, bucket_key is not UNIQUE).
const migration13 = read('migrations/0013_account_runtime_guard.sql');
db.exec(migration13);
db.exec(migration13);
db.exec('DROP TABLE academy_account_rate_limits');
db.exec('CREATE TABLE academy_account_rate_limits(bucket_key TEXT, window_start INTEGER, request_count INTEGER)');
// Migration 0014 creates an independent table with a verified PRIMARY KEY and is idempotent.
const migration14 = read('migrations/0014_account_limiter_key_repair.sql');
db.exec(migration14);
db.exec(migration14);
// Simulate a pre-existing malformed v2 table with a composite primary key.
db.exec('DROP TABLE academy_account_rate_limits_v2');
db.exec('CREATE TABLE academy_account_rate_limits_v2(bucket_key TEXT NOT NULL, window_start INTEGER NOT NULL, request_count INTEGER NOT NULL, PRIMARY KEY(bucket_key, window_start))');
const migration15 = read('migrations/0015_account_limiter_v3.sql');
db.exec(migration15);
db.exec(migration15);
const after = await accountSchemaStatus(env);
assert.equal(after.ready, true, after.missing.join(', '));
assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='academy_rate_limits'").get(), 'legacy limiter table is preserved');
assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='academy_account_rate_limits'").get(), 'malformed legacy 0013 table is preserved');
const pkColumns = db.prepare('PRAGMA table_info(academy_account_rate_limits_v3)').all().filter(x=>Number(x.pk)>0);
assert.equal(pkColumns.length, 1, 'v3 must have exactly one primary-key column');
assert.equal(pkColumns[0].name, 'bucket_key');
assert.equal(db.prepare('PRAGMA table_info(academy_account_rate_limits_v3)').all().find(x=>x.name==='bucket_key').notnull, 1);
assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='academy_account_rate_limits_v2'").get(), 'malformed v2 is preserved, not dropped');
assert.equal(db.prepare('PRAGMA table_info(academy_account_rate_limits_v2)').all().filter(x=>Number(x.pk)>0).length, 2, 'legacy malformed composite PK remains untouched');

// All shared throttling writes to the new table, not the legacy table.
assert.equal(await rateLimit(env, 'fix25-rate-limit-test', 2, 60), true);
assert.equal(await rateLimit(env, 'fix25-rate-limit-test', 2, 60), true);
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM academy_account_rate_limits_v3 WHERE bucket_key=?').get('fix25-rate-limit-test').n, 1);
assert.equal(db.prepare('SELECT request_count FROM academy_account_rate_limits_v3 WHERE bucket_key=?').get('fix25-rate-limit-test').request_count, 2);
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM academy_rate_limits WHERE bucket_key=?').get('fix25-rate-limit-test').n, 0);

// Create an account using the supported FIX25 KDF and a short historical-style password.
const password = 'Short7!';
const saltBytes = webcrypto.getRandomValues(new Uint8Array(16));
const salt = `pbkdf2-sha256$100000$${Buffer.from(saltBytes).toString('base64url')}`;
const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' }, key, 256);
const hash = Buffer.from(bits).toString('base64url');
const now = new Date().toISOString();
db.prepare(`INSERT INTO academy_users(id,nickname,created_at,last_seen_at,consent_at,consent_version,locale,email_normalized,password_salt,password_hash,terms_accepted_at,terms_version,email_verified_at)
  VALUES(?,?,?,?,NULL,NULL,'pl',?,?,?,?,?,?)`).run('fix20-legacy-user','Legacy Tester',now,now,'legacy@example.test',salt,hash,now,'terms-v1',now);

const good = await onRequestPost({ request: request('login', { email: 'legacy@example.test', password }), env });
assert.equal(good.status, 200, 'existing account with a password shorter than 12 chars must log in');
assert.ok((good.headers.get('set-cookie') || '').includes('academy_sid='));
const session = await onRequestGet({ request: new Request(`${base}/api/session`, { headers: { cookie: (good.headers.get('set-cookie') || '').split(';')[0] } }), env });
const sessionJson = await session.json();
assert.equal(sessionJson.active, true);
assert.equal(sessionJson.user.email, 'legacy@example.test');

const bad = await onRequestPost({ request: request('login', { email: 'nobody@example.invalid', password: 'FakePassword_2026!' }), env });
assert.equal(bad.status, 401);
assert.equal((await bad.json()).error, 'LOGIN_FAILED');

const weakRegister = await onRequestPost({ request: request('register', { email: 'new@example.test', password: 'Short7!', termsAccepted: true }), env });
assert.equal(weakRegister.status, 400, 'new registrations must still require at least 12 characters');

// Release/deployment contracts: migration and guards must be present before production is touched.
const publisher = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
assert.equal(release.build, '6.8.0-fix51-visual-academy-pro-20261105');
assert.equal(release.fix28_quality_audit.production_published, false);
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
assert.equal(release.build, '6.8.0-fix51-visual-academy-pro-20261105');
assert.equal(release.production_published, false);
assert.ok(html.includes(`content=\"${release.build}\"`));
assert.ok(sw.includes('fix28-practice-academy-pwa') && sw.includes('support-video-clean-fix9'));
assert.ok(publisher.includes('0013_account_runtime_guard.sql') && publisher.includes('0014_account_limiter_key_repair.sql') && publisher.includes('0015_account_limiter_v3.sql') && publisher.includes('academy_account_rate_limits_v3'));
assert.ok(publisher.includes('accountSchemaStatus') && publisher.includes("validateEmailAndPassword(body, 'login')"));
assert.ok(publisher.includes("const accountLoginApi = path.join(FUNCTIONS,'api','session.js')"), 'publisher must inspect /api/session for account login/registration');
assert.ok(publisher.includes('fs.readFileSync(accountLoginApi'), 'publisher runtime validation must read the account login API');
assert.ok(publisher.includes("path.join(FUNCTIONS,'api','auth','sessions.js')"), 'publisher must separately retain active-session management checks');
assert.ok(publisher.indexOf("['d1', 'export'") < publisher.indexOf("['d1', 'migrations', 'apply'"), 'D1 backup must precede production migrations');
assert.ok(watcher.includes('accountSchemaStatus') && watcher.includes('0013_account_runtime_guard.sql') && watcher.includes('0014_account_limiter_key_repair.sql') && watcher.includes('0015_account_limiter_v3.sql'));
assert.ok(watcher.includes('accountNegativeProbePassedForBuild') && watcher.includes('qa-login-check@example.invalid'));
assert.ok(!watcher.includes("'emailAccountSchema'"));

console.log('PASS: brak migracji 0015 jest jawnie wykrywany przed logowaniem (ACCOUNT_SCHEMA_NOT_READY).');
console.log('PASS: migracja 0015 jest idempotentna; wadliwe tabele historyczne pozostają nietknięte, a limiter v3 ma pojedynczy PRIMARY KEY(bucket_key).');
console.log('PASS: limiter zapisuje do academy_account_rate_limits_v3 i atomowo zwiększa licznik.');
assert.ok(!html.includes('ncbCloudBackupPanel') && !html.includes('Google Drive') && !html.includes('Microsoft OneDrive') && !html.includes('Dropbox'));
assert.ok(!publisher.includes('cloud-backup-700.js') && !watcher.includes('cloud-backup-700.js'));
console.log('PASS: integracje Google Drive/OneDrive/Dropbox usunięte z Akademii.');
console.log('PASS: istniejące konto z hasłem krótszym niż 12 znaków loguje się i otrzymuje sesję.');
console.log('PASS: błędne dane zwracają HTTP 401; nowa rejestracja nadal odrzuca krótkie hasło.');
console.log('PASS: release FIX28 jest nieopublikowany; publikator wymaga migracji 0015 i kopiuje D1 przed migracją; integracje dysków chmurowych są nieobecne.');
db.close();
