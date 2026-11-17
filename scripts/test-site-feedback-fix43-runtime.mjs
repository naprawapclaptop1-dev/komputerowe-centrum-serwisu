import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';
import { onRequestPost as postFeedback } from '../functions/api/site-feedback.js';
import { onRequestGet as getAdminFeedback, onRequestPost as postAdminFeedback } from '../functions/api/admin/site-feedback.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const name of fs.readdirSync(path.join(ROOT,'migrations')).filter(n=>/^\d{4}_.*\.sql$/.test(n)).sort())db.exec(fs.readFileSync(path.join(ROOT,'migrations',name),'utf8'));
class Statement{constructor(sql){this.sql=sql;this.args=[];}bind(...args){this.args=args;return this;}all(){return{results:db.prepare(this.sql).all(...this.args)};}first(){return db.prepare(this.sql).get(...this.args)||null;}run(){const r=db.prepare(this.sql).run(...this.args);return{meta:{changes:Number(r.changes)},changes:Number(r.changes)};}}
const env={DB:{prepare:sql=>new Statement(sql)},ADMIN_REVIEW_TOKEN:'fix43-test-admin-token-long'};
const base='https://academy.test';
const req=(url,{method='GET',body,admin=false,origin=base,ip='192.0.2.43'}={})=>new Request(`${base}${url}`,{method,headers:{...(origin?{origin}:{}),...(body?{'content-type':'application/json'}:{}),...(admin?{authorization:`Bearer ${env.ADMIN_REVIEW_TOKEN}`}:{ } ),'cf-connecting-ip':ip},...(body?{body:JSON.stringify(body)}:{})});
const call=(fn,request)=>fn({request,env});
const payload={rating:5,whatAdd:'Dodaj więcej schematów płyt.',whatChange:'Popraw wyszukiwarkę dokumentów.',whatBroken:'Przycisk podglądu PDF nie zawsze działa.',details:'Problem wystąpił podczas testów FIX43.',route:'/index.html?view=feedback',consent:true};
const read=async response=>({status:response.status,body:await response.json()});

let r=await read(await call(postFeedback,req('/api/site-feedback',{method:'POST',body:payload})));
assert.equal(r.status,201);assert.equal(r.body.status,'new');const id=r.body.id;
let row=db.prepare('SELECT * FROM academy_site_feedback WHERE id=?').get(id);
assert.equal(row.rating,5);assert.equal(row.what_add,payload.whatAdd);assert.equal(row.user_id,null);assert.equal(row.status,'new');

r=await read(await call(postFeedback,req('/api/site-feedback',{method:'POST',body:{...payload,consent:false}})));
assert.equal(r.status,400);assert.equal(r.body.error,'CONSENT_REQUIRED');
r=await read(await call(postFeedback,req('/api/site-feedback',{method:'POST',body:{...payload,rating:6}})));
assert.equal(r.status,400);assert.equal(r.body.error,'INVALID_RATING');
r=await read(await call(postFeedback,req('/api/site-feedback',{method:'POST',body:{rating:4,consent:true}})));
assert.equal(r.status,400);assert.equal(r.body.error,'EMPTY_FEEDBACK');
r=await read(await call(postFeedback,req('/api/site-feedback',{method:'POST',origin:'https://evil.example',body:payload})));
assert.equal(r.status,403);assert.equal(r.body.error,'ORIGIN_REJECTED');

// Anonymous submissions are throttled using a one-way client digest, never stored as raw IP.
let accepted=1;
for(let i=0;i<7;i++){const x=await read(await call(postFeedback,req('/api/site-feedback',{method:'POST',body:{...payload,details:`Dodatkowa opinia ${i}`}})));if(x.status===201)accepted++;}
assert.equal(accepted,8);
r=await read(await call(postFeedback,req('/api/site-feedback',{method:'POST',body:{...payload,details:'Nadmiarowa opinia'}})));
assert.equal(r.status,429);assert.equal(r.body.error,'RATE_LIMIT');

r=await read(await call(getAdminFeedback,req('/api/admin/site-feedback')));
assert.equal(r.status,401);assert.equal(r.body.error,'ADMIN_AUTH_REQUIRED');
r=await read(await call(getAdminFeedback,req('/api/admin/site-feedback',{admin:true})));
assert.equal(r.status,200);assert.ok(r.body.items.length>=8);assert.ok(r.body.metrics.total>=8);
assert.ok(!Object.keys(r.body.items[0]).some(k=>/ip|email/i.test(k)));
r=await read(await call(postAdminFeedback,req('/api/admin/site-feedback',{method:'POST',admin:true,body:{id,status:'in_review'}})));
assert.equal(r.status,200);assert.equal(r.body.status,'in_review');
row=db.prepare('SELECT status FROM academy_site_feedback WHERE id=?').get(id);assert.equal(row.status,'in_review');
r=await read(await call(postAdminFeedback,req('/api/admin/site-feedback',{method:'POST',admin:true,origin:'https://evil.example',body:{id,status:'fixed'}})));
assert.equal(r.status,403);
r=await read(await call(postAdminFeedback,req('/api/admin/site-feedback',{method:'POST',admin:true,body:{id:'missing',status:'fixed'}})));
assert.equal(r.status,404);assert.equal(r.body.error,'FEEDBACK_NOT_FOUND');

console.log('PASS FIX43 Site Feedback runtime: anonymous consented submission; rating and content validation; same-origin protection; per-IP hash throttling without storing IP; admin-token-only inbox; status transitions; unknown record protection.');
