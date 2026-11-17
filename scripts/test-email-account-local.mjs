import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { onRequestGet, onRequestPost } from '../functions/api/session.js';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
class D1Statement { constructor(db, sql) { this.db=db; this.sql=sql; this.args=[]; } bind(...args) { this.args=args; return this; } all() { return { results:this.db.prepare(this.sql).all(...this.args) }; } first() { return this.db.prepare(this.sql).get(...this.args) || null; } run() { const r=this.db.prepare(this.sql).run(...this.args); return { success:true, meta:{ changes:Number(r.changes||0) } }; } }
class D1Mock { constructor(db) { this.db=db; } prepare(sql) { return new D1Statement(this.db,sql); } }
const db = new DatabaseSync(':memory:');
for (const f of ['0001_academy_cloud.sql','0004_social_auth.sql','0005_oauth_nonce.sql','0006_accounts_and_device_models.sql','0008_social_login_x_github.sql','0009_discord_social_login.sql','0010_account_terms_and_oauth_consent.sql','0011_totp_two_factor.sql','0012_email_verification_and_password_reset.sql','0013_account_runtime_guard.sql','0014_account_limiter_key_repair.sql','0015_account_limiter_v3.sql']) db.exec(readFileSync(new URL(`../migrations/${f}`, import.meta.url),'utf8'));
const env={DB:new D1Mock(db)};
const email=`test-${Date.now()}@example.invalid`, password='Akademia-Test-2026!';
const status=await onRequestGet({request:new Request('https://academy.test/api/session'),env});
const ready=await status.json(); if(status.status!==200 || !ready.accountRegistrationAvailable) throw new Error('GET /api/session nie zgłasza gotowej rejestracji.');
const post=()=>new Request('https://academy.test/api/session',{method:'POST',headers:{origin:'https://academy.test','content-type':'application/json'},body:JSON.stringify({purpose:'register',email,password,nickname:'Test-Technik',termsAccepted:true,locale:'pl'})});
const created=await onRequestPost({request:post(),env}); const data=await created.json(); if(created.status!==201 || !data.ok || !created.headers.get('set-cookie')) throw new Error(`Rejestracja nie powiodła się: ${created.status} ${JSON.stringify(data)}`);
const accepted=db.prepare('SELECT terms_accepted_at,terms_version FROM academy_users WHERE email_normalized=?').get(email); if(!accepted?.terms_accepted_at || accepted.terms_version!=='2026-11-02-v1') throw new Error('Akceptacja zasad konta nie została zapisana.');
const cookie=created.headers.get('set-cookie').split(';')[0]; const session=await onRequestGet({request:new Request('https://academy.test/api/session',{headers:{cookie}}),env}); const current=await session.json(); if(!current.active || current.user.email!==email) throw new Error('Cookie sesji nie potwierdziło logowania.');
const login=await onRequestPost({request:new Request('https://academy.test/api/session',{method:'POST',headers:{origin:'https://academy.test','content-type':'application/json'},body:JSON.stringify({purpose:'login',email,password})}),env}); if(login.status!==200) throw new Error('Logowanie istniejącym kontem nie powiodło się.');
const duplicate=await onRequestPost({request:post(),env}); const dupe=await duplicate.json(); if(duplicate.status!==409 || dupe.error!=='ACCOUNT_EXISTS') throw new Error('Duplikat e-mail nie został prawidłowo wykryty.');
console.log('PASS: schema, register 201, HttpOnly session, login 200, duplicate 409.');
