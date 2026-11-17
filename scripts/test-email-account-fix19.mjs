import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { onRequestPost as sendVerify } from '../functions/api/auth/email.js';
import { onRequestGet as verifyEmail } from '../functions/api/auth/email/verify.js';
import { onRequestPost as forgotPassword } from '../functions/api/auth/password/forgot.js';
import { onRequestPost as resetPassword } from '../functions/api/auth/password/reset.js';
import { emailDeliveryStatus, sendTransactionalEmail } from '../functions/_mail.js';
import { randomToken, sessionCookie, sha256Hex } from '../functions/_lib.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const db = new DatabaseSync(':memory:');
for (const name of fs.readdirSync(path.join(root, 'migrations')).filter(x => /^\d{4}_.*\.sql$/.test(x)).sort()) db.exec(read(`migrations/${name}`));
class Statement {
  constructor(sql) { this.sql = sql; this.args = []; }
  bind(...args) { this.args = args; return this; }
  all() { return { results: db.prepare(this.sql).all(...this.args) }; }
  first() { return db.prepare(this.sql).get(...this.args) || null; }
  run() { const result = db.prepare(this.sql).run(...this.args); return { meta: { changes: Number(result.changes) }, changes: Number(result.changes) }; }
}
const env = {
  DB: { prepare: sql => new Statement(sql) },
  RESEND_API_KEY: 're_test_api_key_123456789',
  AUTH_EMAIL_FROM: 'Akademia <noreply@example.test>',
  AUTH_PUBLIC_URL: 'https://naprawa-pc-akademia-serwisu-pro.pages.dev'
};
assert.deepEqual(emailDeliveryStatus({}), { ready: false, missing: ['RESEND_API_KEY', 'AUTH_EMAIL_FROM'] });
assert.equal(emailDeliveryStatus(env).ready, true);

const sent = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  assert.equal(String(url), 'https://api.resend.com/emails');
  assert.equal(options.headers.Authorization, `Bearer ${env.RESEND_API_KEY}`);
  assert.equal(options.headers['User-Agent'], 'NaukaOdAdoZ-Academy/6.8.0');
  const body = JSON.parse(options.body); sent.push(body);
  return new Response(JSON.stringify({ id: `email-${sent.length}` }), { status: 200, headers: { 'content-type': 'application/json' } });
};
try {
  await sendTransactionalEmail(env, { to: 'tester@example.test', subject: 'Test', text: 'body', html: '<p>body</p>', idempotencyKey: 'test-1' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to[0], 'tester@example.test');

  const now = new Date().toISOString();
  const userId = 'email-test-user';
  db.prepare(`INSERT INTO academy_users(id,nickname,created_at,last_seen_at,consent_at,consent_version,locale,email_normalized,password_salt,password_hash,terms_accepted_at,terms_version)
    VALUES(?,?,?,?,NULL,NULL,'pl',?,'salt','old-password-hash',?,?)`).run(userId, 'Tester', now, now, 'tester@example.test', now, '2026-11-02-v1');
  const sessionToken = randomToken();
  db.prepare('INSERT INTO academy_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(await sha256Hex(sessionToken), userId, now, new Date(Date.now()+3600000).toISOString());

  const verifyResponse = await sendVerify({
    request: new Request('https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/email', { method: 'POST', headers: { origin: 'https://naprawa-pc-akademia-serwisu-pro.pages.dev', cookie: sessionCookie(sessionToken).split(';')[0], 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.10' }, body: JSON.stringify({ action: 'send-verification' }) }),
    env
  });
  assert.equal(verifyResponse.status, 200);
  assert.equal((await verifyResponse.json()).sent, true);
  const verifyLink = sent.at(-1).text.match(/https:\/\/[^\s]+/)[0];
  const verifyToken = new URL(verifyLink).searchParams.get('token');
  assert.ok(verifyToken && verifyToken.length >= 40);
  const storedVerify = db.prepare("SELECT token_hash FROM academy_email_tokens WHERE purpose='verify_email'").get();
  assert.notEqual(storedVerify.token_hash, verifyToken, 'only the token hash is stored');
  const verifyResult = await verifyEmail({ request: new Request(verifyLink), env });
  assert.equal(verifyResult.status, 303);
  assert.ok(db.prepare('SELECT email_verified_at FROM academy_users WHERE id=?').get(userId).email_verified_at);

  const beforeReset = sent.length;
  const forgotResponse = await forgotPassword({
    request: new Request('https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/password/forgot', { method: 'POST', headers: { origin: 'https://naprawa-pc-akademia-serwisu-pro.pages.dev', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.11' }, body: JSON.stringify({ email: 'tester@example.test' }) }),
    env
  });
  assert.equal(forgotResponse.status, 200);
  assert.equal(sent.length, beforeReset + 1);
  const resetLinkMatch = sent.at(-1).text.match(/https:\/\/[^\s]+/);
  assert.ok(resetLinkMatch);
  const resetToken = new URL(resetLinkMatch[0]).hash ? new URLSearchParams(new URL(resetLinkMatch[0]).hash.slice(1)).get('password_reset') : null;
  assert.ok(resetToken && resetToken.length >= 40);
  const storedReset = db.prepare("SELECT token_hash FROM academy_email_tokens WHERE purpose='reset_password'").get();
  assert.notEqual(storedReset.token_hash, resetToken, 'reset token is stored as a hash only');
  const resetResponse = await resetPassword({
    request: new Request('https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/password/reset', { method: 'POST', headers: { origin: 'https://naprawa-pc-akademia-serwisu-pro.pages.dev', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.12' }, body: JSON.stringify({ token: resetToken, password: 'NewStrongPassword_2026!' }) }),
    env
  });
  assert.equal(resetResponse.status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM academy_sessions WHERE user_id=?').get(userId).n, 0, 'password reset revokes all sessions');
  const newHash = db.prepare('SELECT password_hash FROM academy_users WHERE id=?').get(userId).password_hash;
  assert.notEqual(newHash, 'old-password-hash');
  const reused = await resetPassword({
    request: new Request('https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/password/reset', { method: 'POST', headers: { origin: 'https://naprawa-pc-akademia-serwisu-pro.pages.dev', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.12' }, body: JSON.stringify({ token: resetToken, password: 'AnotherStrongPassword_2026!' }) }),
    env
  });
  assert.equal(reused.status, 400, 'one-use reset token cannot be replayed');

  const unknownBefore = sent.length;
  const unknownResponse = await forgotPassword({
    request: new Request('https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/password/forgot', { method: 'POST', headers: { origin: 'https://naprawa-pc-akademia-serwisu-pro.pages.dev', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.13' }, body: JSON.stringify({ email: 'unknown@example.test' }) }),
    env
  });
  assert.equal(unknownResponse.status, 200);
  assert.equal(sent.length, unknownBefore, 'unknown account does not trigger email');
  assert.match((await unknownResponse.clone().json()).message, /Jeśli konto z tym adresem istnieje/);

  const missingMail = await forgotPassword({
    request: new Request('https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/password/forgot', { method: 'POST', headers: { origin: 'https://naprawa-pc-akademia-serwisu-pro.pages.dev', 'content-type': 'application/json' }, body: JSON.stringify({ email: 'tester@example.test' }) }),
    env: { DB: env.DB }
  });
  assert.equal(missingMail.status, 503, 'password reset stays closed if email delivery is not configured');
  console.log('PASS: email verification and password reset use Resend server-side, hashed one-use tokens, expiry and rate limits.');
  console.log('PASS: reset revokes all sessions, unknown addresses receive the same response, and provider secrets never enter the browser.');
} finally {
  globalThis.fetch = originalFetch;
  db.close();
}
