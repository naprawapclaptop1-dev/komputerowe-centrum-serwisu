import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';
import { sha256Hex } from '../functions/_lib.js';
import { onRequestGet as getProposals, onRequestPost as postProposals } from '../functions/api/support/proposals.js';
import { onRequestGet as getThanks, onRequestPost as postThanks } from '../functions/api/support/thanks.js';
import { onRequestGet as getUpdates, onRequestPost as postUpdates } from '../functions/api/support/updates.js';
import { onRequestGet as getTransparency } from '../functions/api/support/transparency.js';
import { onRequestGet as getAdmin, onRequestPost as postAdmin } from '../functions/api/admin/support.js';
import { onRequestGet as getKnowledge, onRequestPost as postKnowledge } from '../functions/api/knowledge.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
for (const name of fs.readdirSync(path.join(root, 'migrations')).filter(n => /^\d{4}_.*\.sql$/.test(n)).sort()) {
  db.exec(fs.readFileSync(path.join(root, 'migrations', name), 'utf8'));
}
class Statement {
  constructor(sql) { this.sql=sql; this.args=[]; }
  bind(...args) { this.args=args; return this; }
  all() { return { results: db.prepare(this.sql).all(...this.args) }; }
  first() { return db.prepare(this.sql).get(...this.args) || null; }
  run() { const r=db.prepare(this.sql).run(...this.args); return { meta:{changes:Number(r.changes)}, changes:Number(r.changes) }; }
}
const env={ DB:{prepare:sql=>new Statement(sql)}, ADMIN_REVIEW_TOKEN:'test-admin-token-fix36-long-enough' };
const base='https://academy.test';
const token='fix36-community-runtime-session-token-1234567890';
const now=new Date().toISOString();
db.prepare(`INSERT INTO academy_users(id,nickname,created_at,last_seen_at,locale) VALUES(?,?,?,?,?)`).run('fix36-user','Tester',now,now,'pl');
db.prepare(`INSERT INTO academy_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)`).run(await sha256Hex(token),'fix36-user',now,new Date(Date.now()+3600000).toISOString());
const req=(url, {method='GET', body, auth=false, admin=false, origin=base}={})=>new Request(`${base}${url}`,{method,headers:{...(origin?{origin}:{}),...(body?{'content-type':'application/json'}:{}),...(auth?{cookie:`academy_sid=${token}`}:{ } ),...(admin?{authorization:`Bearer ${env.ADMIN_REVIEW_TOKEN}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
const call=async(fn,request)=>fn({request,env});
const json=async response=>({status:response.status,body:await response.json()});

// Anonymous users can read approved data, but cannot submit or vote.
let r=await json(await call(getProposals,req('/api/support/proposals')));
assert.equal(r.status,200); assert.equal(r.body.items.length,0); assert.equal(r.body.authenticated,false);
r=await json(await call(postProposals,req('/api/support/proposals',{method:'POST',body:{action:'submit',title:'Nowa lekcja USB-C PD',category:'Diagnostyka',details:'Opis wystarczająco długi dla testu propozycji.',shareConsent:true}})));
assert.equal(r.status,401); assert.equal(r.body.error,'ACCOUNT_REQUIRED');
// Authenticated submission stays pending and is not exposed publicly.
r=await json(await call(postProposals,req('/api/support/proposals',{method:'POST',auth:true,body:{action:'submit',title:'Nowa lekcja USB-C PD',category:'Diagnostyka',details:'Opis wystarczająco długi dla testu propozycji.',shareConsent:true}})));
assert.equal(r.status,201); const proposalId=r.body.id; assert.equal(r.body.status,'pending');
let publicProposals=await json(await call(getProposals,req('/api/support/proposals')));
assert.equal(publicProposals.body.items.length,0);
let ownProposals=await json(await call(getProposals,req('/api/support/proposals',{auth:true})));
assert.equal(ownProposals.body.mine.length,1); assert.equal(ownProposals.body.mine[0].id,proposalId);
// Service-case submission reuses the existing rights-confirmed knowledge queue and stays private while pending.
r=await json(await call(postKnowledge,req('/api/knowledge',{method:'POST',auth:true,body:{title:'Brak startu po naprawie USB-C',category:'Płyta główna / PCB',symptoms:'Laptop nie reaguje na przycisk zasilania po podłączeniu zasilacza.',diagnosis:'Sprawdzono wejście zasilania i potwierdzono zwarcie na wskazanym obszarze.',procedure:'Odłącz zasilacz i baterię, wykonaj oględziny oraz pomiary zgodnie z dokumentacją rewizji.',result:'Przypadek testowy dla bazy edukacyjnej.',sourceUrls:['https://example.test/manual'],attribution:'Tester',shareConsent:true,rightsConfirmed:true,licenseAgreement:true,licenseCode:'ACADEMY_NONEXCLUSIVE_2026'}})));
assert.equal(r.status,201); const caseId=r.body.id; assert.equal(r.body.status,'pending');
r=await json(await call(getKnowledge,req('/api/knowledge?mine=1',{auth:true}))); assert.equal(r.status,200); assert.ok(r.body.items.some(x=>x.id===caseId));
r=await json(await call(getKnowledge,req('/api/knowledge?mine=1'))); assert.equal(r.status,401);
// Admin queue, moderation, public visibility, voting, and vote withdrawal.
const adminReq=(body)=>req('/api/admin/support',{method:'POST',body,admin:true,origin:base});
r=await json(await call(getAdmin,req('/api/admin/support',{admin:true})));
assert.equal(r.status,200); assert.equal(r.body.proposals.length,1);
r=await json(await call(postAdmin,adminReq({action:'review-proposal',id:proposalId,status:'approved',note:'Poprawny pomysł.'})));
assert.equal(r.status,200); assert.equal(r.body.status,'approved');
r=await json(await call(postProposals,req('/api/support/proposals',{method:'POST',auth:true,body:{action:'vote',id:proposalId}})));
assert.equal(r.status,200); assert.equal(r.body.votes,1);
r=await json(await call(postProposals,req('/api/support/proposals',{method:'POST',auth:true,body:{action:'unvote',id:proposalId}})));
assert.equal(r.status,200); assert.equal(r.body.votes,0);
// Thanks board is opt-in and immediately revocable.
r=await json(await call(postThanks,req('/api/support/thanks',{method:'POST',auth:true,body:{displayName:'Tester',message:'Pomagam dokumentacją.',showPublic:true,consent:false}})));
assert.equal(r.status,400); assert.equal(r.body.error,'PUBLIC_CONSENT_REQUIRED');
r=await json(await call(postThanks,req('/api/support/thanks',{method:'POST',auth:true,body:{displayName:'Tester',message:'Pomagam dokumentacją.',showPublic:true,consent:true}})));
assert.equal(r.status,200);
r=await json(await call(getThanks,req('/api/support/thanks'))); assert.equal(r.body.items.length,1); assert.equal(r.body.items[0].display_name,'Tester');
r=await json(await call(postThanks,req('/api/support/thanks',{method:'POST',auth:true,body:{showPublic:false,consent:false}})));
assert.equal(r.status,200); assert.equal(r.body.showPublic,false);
r=await json(await call(getThanks,req('/api/support/thanks'))); assert.equal(r.body.items.length,0);
// Costs are draft-only until an admin provides an HTTPS evidence URL.
r=await json(await call(getTransparency,req('/api/support/transparency'))); assert.equal(r.status,200); assert.equal(r.body.count,0); assert.equal(r.body.verifiedOnly,true);
r=await json(await call(postAdmin,adminReq({action:'create-cost',period:'2026-11',category:'Hosting i infrastruktura',amount:'25.50',note:'Przykładowy wpis testowy',publishNow:false})));
assert.equal(r.status,201); const costId=r.body.id; assert.equal(r.body.status,'draft');
r=await json(await call(getTransparency,req('/api/support/transparency'))); assert.equal(r.body.count,0);
r=await json(await call(postAdmin,adminReq({action:'publish-cost',id:costId,evidenceUrl:'http://example.test/receipt'})));
assert.equal(r.status,400); assert.equal(r.body.error,'EVIDENCE_REQUIRED');
r=await json(await call(postAdmin,adminReq({action:'publish-cost',id:costId,evidenceUrl:'https://example.test/receipt'})));
assert.equal(r.status,200); assert.equal(r.body.status,'published');
r=await json(await call(getTransparency,req('/api/support/transparency'))); assert.equal(r.body.count,1); assert.equal(r.body.totalMinor,2550);
// Announcements are public only after publication; the API DTO exposes camelCase lastSeenAt.
r=await json(await call(getUpdates,req('/api/support/updates'))); assert.equal(r.status,200); assert.equal(r.body.authenticated,false); assert.equal(r.body.enabled,false); assert.equal(r.body.lastSeenAt,null); assert.ok(Array.isArray(r.body.items)); assert.equal(r.body.unreadCount,0);
r=await json(await call(getUpdates,req('/api/support/updates',{auth:true}))); assert.equal(r.status,200); assert.equal(r.body.enabled,false); assert.ok(Object.prototype.hasOwnProperty.call(r.body,'lastSeenAt')); assert.equal(typeof r.body.unreadCount,'number');
r=await json(await call(postUpdates,req('/api/support/updates',{method:'POST',auth:true,body:{enabled:true}}))); assert.equal(r.status,200); assert.equal(r.body.enabled,true);
r=await json(await call(postAdmin,adminReq({action:'create-announcement',title:'Testowe ogłoszenie',kind:'community',summary:'Ogłoszenie testowe z treścią przekraczającą minimum.',publishNow:false})));
assert.equal(r.status,201); const announcementId=r.body.id;
r=await json(await call(getUpdates,req('/api/support/updates',{auth:true}))); assert.equal(r.body.items.length,0);
r=await json(await call(postAdmin,adminReq({action:'publish-announcement',id:announcementId}))); assert.equal(r.status,200);
r=await json(await call(getUpdates,req('/api/support/updates',{auth:true}))); assert.equal(r.body.items.length,1); assert.equal(r.body.unreadCount,1);
r=await json(await call(postUpdates,req('/api/support/updates',{method:'POST',auth:true,body:{action:'mark-read'}}))); assert.equal(r.status,200);
r=await json(await call(getUpdates,req('/api/support/updates',{auth:true}))); assert.equal(r.body.unreadCount,0);
// Writes are protected by same-origin checks and the admin token.
r=await json(await call(postThanks,req('/api/support/thanks',{method:'POST',auth:true,origin:'https://evil.example',body:{showPublic:false}})));
assert.equal(r.status,403); assert.equal(r.body.error,'ORIGIN_REJECTED');
r=await json(await call(postAdmin,req('/api/admin/support',{method:'POST',body:{action:'create-announcement',title:'Nieuprawnione',summary:'Ta treść nie może zostać zapisana.'}})));
assert.equal(r.status,401); assert.equal(r.body.error,'ADMIN_AUTH_REQUIRED');
console.log('PASS FIX36 runtime: proposals and case submissions remain private until moderation; proposal voting/unvote; thanks opt-in/revocation; evidence-backed costs; announcement draft/publish/read; same-origin and admin-token protections.');
