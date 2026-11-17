import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { onRequestPost } from '../functions/api/session.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const db = new DatabaseSync(':memory:');
for (const name of fs.readdirSync(path.join(root, 'migrations')).filter(n => /^\d{4}_.*\.sql$/.test(n)).sort()) {
  if (Number(name.slice(0,4)) <= 14) db.exec(read(`migrations/${name}`));
}
db.exec(read('migrations/0015_account_limiter_v3.sql'));
class Statement {
  constructor(sql, fail=false) { this.sql=sql; this.args=[]; this.fail=fail; }
  bind(...args) { this.args=args; return this; }
  all() { return {results:db.prepare(this.sql).all(...this.args)}; }
  first() { return db.prepare(this.sql).get(...this.args)||null; }
  run() { return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}; }
}
const baseDb = {prepare: sql => new Statement(sql)};
const env = {DB:{prepare: sql => {
  if (sql.includes('SELECT request_count FROM academy_account_rate_limits_v3')) {
    return {bind(){return {first(){throw new Error('synthetic D1 read failure')}}}};
  }
  return baseDb.prepare(sql);
}}};
const origin='https://academy.test';
const request=new Request(`${origin}/api/session`,{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.24'},body:JSON.stringify({purpose:'login',email:'qa-login-check@example.invalid',password:'TestInvalidOnly-2026!'})});
const response=await onRequestPost({request,env});
const data=await response.json();
assert.equal(response.status,503);
assert.equal(data.error,'ACCOUNT_OPERATION_FAILED');
assert.equal(data.stage,'login-rate-limit-ip');
assert.ok(data.reference);
assert.ok(!JSON.stringify(data).includes('qa-login-check@example.invalid'));
assert.ok(!JSON.stringify(data).includes('TestInvalidOnly-2026!'));
db.close();
console.log('PASS: D1 limiter fault is tagged with login-rate-limit-ip and returns a short reference without email/password.');
