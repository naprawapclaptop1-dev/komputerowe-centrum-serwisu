import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { onRequestPost as accountPost } from '../functions/api/session.js';
import { onRequestPost as resetPost } from '../functions/api/auth/password/reset.js';
import { sha256Hex } from '../functions/_lib.js';
import { DUMMY_PASSWORD_SALT, isSupportedPasswordSalt } from '../functions/_password-kdf.js';

const originalSubtle = webcrypto.subtle;
const kdfCalls = [];
const cappedSubtle = new Proxy(originalSubtle, {
  get(target, property) {
    if (property === 'deriveBits') return async (algorithm, key, length) => {
      if (String(algorithm?.name || '').toUpperCase() === 'PBKDF2') {
        kdfCalls.push(Number(algorithm.iterations));
        if (Number(algorithm.iterations) > 100000) {
          const error = new Error(`iteration counts above 100000 are not supported (requested ${algorithm.iterations})`);
          error.name = 'NotSupportedError';
          throw error;
        }
      }
      return target.deriveBits(algorithm, key, length);
    };
    const value = Reflect.get(target, property, target);
    return typeof value === 'function' ? value.bind(target) : value;
  }
});
Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: {
    subtle: cappedSubtle,
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    randomUUID: webcrypto.randomUUID.bind(webcrypto)
  }
});

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const sessionSource = read('functions/api/session.js');
const resetSource = read('functions/api/auth/password/reset.js');
const kdfSource = read('functions/_password-kdf.js');
const publisherSource = read('ONECLICK_AKADEMIA.js');
const watcherSource = read('AUTO_PUBLISH_WATCHER.js');
const kdfContractSource = read('scripts/password-kdf-contract-fix26.js');
assert.ok(kdfSource.includes('PBKDF2_ITERATIONS = 100000'));
assert.ok(isSupportedPasswordSalt(DUMMY_PASSWORD_SALT), 'dummy salt must use a valid 16-byte encoded salt');
assert.ok(sessionSource.includes('createPasswordSalt') && sessionSource.includes('DUMMY_PASSWORD_SALT'));
assert.ok(resetSource.includes('createPasswordSalt') && resetSource.includes('derivePassword'));
assert.ok(sessionSource.includes('isSupportedPasswordSalt') && sessionSource.includes('DUMMY_PASSWORD_SALT'));
assert.ok(publisherSource.includes('assertSharedPasswordKdfContract') && publisherSource.includes('password-kdf-contract-fix26'));
assert.ok(watcherSource.includes('assertSharedPasswordKdfContract') && watcherSource.includes('password-kdf-contract-fix26'));
assert.ok(kdfContractSource.includes('PBKDF2_ITERATIONS = 100000') && kdfContractSource.includes("name: 'PBKDF2'"));
assert.doesNotMatch(sessionSource + resetSource + kdfSource, /210000/);

const db = new DatabaseSync(':memory:');
for (const name of fs.readdirSync(path.join(root, 'migrations')).filter(n => /^\d{4}_.*\.sql$/.test(n)).sort()) {
  db.exec(read(`migrations/${name}`));
}
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
  method: 'POST',
  headers: { origin: base, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.55' },
  body: JSON.stringify({ purpose, ...body })
});

// The worker-capped WebCrypto must support a negative login test and return 401, never 503.
const negative = await accountPost({
  request: request('login', { email: 'qa-login-check@example.invalid', password: 'TestInvalidOnly-2026!' }),
  env
});
assert.equal(negative.status, 401);
assert.equal((await negative.json()).error, 'LOGIN_FAILED');

// Registration + login use the same versioned KDF and never exceed the Workers cap.
const registration = await accountPost({
  request: request('register', { email: 'fix25-user@example.test', password: 'CloudflareSafePass-2026!', termsAccepted: true, nickname: 'FIX25 tester' }),
  env
});
assert.equal(registration.status, 201);
const account = db.prepare('SELECT id,password_salt,password_hash,email_normalized FROM academy_users WHERE email_normalized=?').get('fix25-user@example.test');
assert.ok(account.password_salt.startsWith('pbkdf2-sha256$100000$'));
assert.ok(account.password_hash);
const goodLogin = await accountPost({ request: request('login', { email: account.email_normalized, password: 'CloudflareSafePass-2026!' }), env });
assert.equal(goodLogin.status, 200);

// Complete a password reset and verify it writes the same versioned format.
const token = 'Fix25ResetToken_' + 'A'.repeat(40);
const tokenHash = await sha256Hex(token);
const now = new Date().toISOString();
db.prepare(`INSERT INTO academy_email_tokens(token_hash,user_id,email_normalized,purpose,created_at,expires_at,used_at)
  VALUES(?,?,?,?,?,?,NULL)`).run(tokenHash, account.id, account.email_normalized, 'reset_password', now, new Date(Date.now()+3600_000).toISOString());
const resetRequest = new Request(`${base}/api/auth/password/reset`, {
  method: 'POST',
  headers: { origin: base, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.56' },
  body: JSON.stringify({ token, password: 'NewCloudflarePass-2026!' })
});
const resetResponse = await resetPost({ request: resetRequest, env });
assert.equal(resetResponse.status, 200);
const afterReset = db.prepare('SELECT password_salt,password_hash FROM academy_users WHERE id=?').get(account.id);
assert.ok(afterReset.password_salt.startsWith('pbkdf2-sha256$100000$'));
assert.ok(afterReset.password_hash);
const loginAfterReset = await accountPost({ request: request('login', { email: account.email_normalized, password: 'NewCloudflarePass-2026!' }), env });
assert.equal(loginAfterReset.status, 200);

// Old unversioned salts are not sent to unsupported PBKDF2. They use the dummy current KDF
// and return the same generic 401, so the endpoint does not expose whether an account exists.
db.prepare(`INSERT INTO academy_users(id,nickname,created_at,last_seen_at,locale,email_normalized,password_salt,password_hash,email_verified_at)
  VALUES(?,?,?,?,?,?,?,?,?)`).run('fix25-old-kdf','Old KDF','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z','pl','old-kdf@example.test','YWNhZGVteS1sZWdhY3ktc2FsdA','legacy-hash',now);
const oldLogin = await accountPost({ request: request('login', { email: 'old-kdf@example.test', password: 'Whatever-2026!' }), env });
assert.equal(oldLogin.status, 401);
assert.equal((await oldLogin.json()).error, 'LOGIN_FAILED');
assert.ok(kdfCalls.length >= 5);
assert.ok(kdfCalls.every(iterations => iterations > 0 && iterations <= 100000), `unsupported KDF iterations observed: ${kdfCalls.join(', ')}`);

db.close();
console.log(`PASS: Cloudflare WebCrypto cap simulated; ${kdfCalls.length} PBKDF2 operations, max ${Math.max(...kdfCalls)} iterations.`);
console.log('PASS: negative login is HTTP 401 (not 503), registration/login/reset share the versioned 100k KDF.');
console.log('PASS: legacy unversioned hashes fail closed with generic 401; no account enumeration or credential logging.');
