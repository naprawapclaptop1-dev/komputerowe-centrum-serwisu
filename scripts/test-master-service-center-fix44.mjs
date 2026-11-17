import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const runtime=read('WEB_PUBLISH/assets/master-service-center-fix44.js');
const css=read('WEB_PUBLISH/assets/master-service-center-fix44.css');
const manifest=JSON.parse(read('WEB_PUBLISH/assets/knowledge-updates-fix44.json'));
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const build='6.8.0-fix51-visual-academy-pro-20261105';

let passed=0;
async function check(name,fn){await fn();passed++;console.log(`PASS ${name}`);}

const tabNames=['overview','identify','bios','thermal','architecture','battery','recovery','network','explorer','cases','service','coach','qa','simulator','library','updates'];
const fakeTabs=tabNames.map(name=>({dataset:{f44Tab:name},classList:{toggle(){}},setAttribute(){},addEventListener(){}}));
const rootNode={innerHTML:'',addEventListener(){}};
const pageNode={dataset:{},ownerDocument:null,querySelectorAll:()=>fakeTabs,addEventListener(){}};
const statusNode={textContent:'',classList:{toggle(){}}};
const store=new Map();
const documentMock={
  getElementById:id=>({'view-fix44':pageNode,f44Stage:rootNode,f44Status:statusNode,'view-fix43':{},'view-feedback':{}}[id]||null),
  querySelectorAll:()=>[],
  querySelector:selector=>selector.includes('script[src*="master-service-center-fix44.js"]')?{}:selector.includes('[data-view=')?{}:null,
  createElement:()=>({click(){},remove(){},set href(v){},set download(v){}}),
  body:{appendChild(){}}
};
pageNode.ownerDocument=documentMock;
const context={window:{},document:documentMock,localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},sessionStorage:{getItem:()=>null,setItem(){}},crypto:webcrypto,TextEncoder,TextDecoder,Blob,URL,Intl,Date,Math,Number,String,JSON,Object,Array,Map,Set,RegExp,Error,Promise,Uint8Array,ArrayBuffer,DataView,console,fetch:async()=>({ok:true,json:async()=>manifest}),FormData:class{},HTMLFormElement:class{}};
vm.createContext(context);
vm.runInContext(runtime,context,{filename:'master-service-center-fix44.js',timeout:5000});
const api=context.window.NP_NAUKA_FIX44;

await check('FIX44 runtime initializes and exposes a stable API',()=>{assert.ok(api);assert.equal(api.build,'6.8.0-fix44');assert.equal(rootNode.innerHTML.includes('Centrum serwisanta'),true);});
await check('All 15 modules plus overview are registered',()=>{assert.equal(fakeTabs.length,16);assert.deepEqual([...tabNames],['overview','identify','bios','thermal','architecture','battery','recovery','network','explorer','cases','service','coach','qa','simulator','library','updates']);});
await check('IPv4 subnet calculator returns network, broadcast and host range',()=>{const r=api.calculateSubnet('192.168.1.42',24);assert.equal(r.network,'192.168.1.0');assert.equal(r.broadcast,'192.168.1.255');assert.equal(r.firstHost,'192.168.1.1');assert.equal(r.lastHost,'192.168.1.254');assert.equal(r.hostCount,254);});
await check('IPv4 calculator rejects malformed addresses and CIDR',()=>{assert.throws(()=>api.calculateSubnet('300.1.1.1',24));assert.throws(()=>api.calculateSubnet('10.0.0.1',33));});
await check('Battery / charging formula calculates watts',()=>{assert.equal(api.calculatePower(20,3.25),65);});
await check('BIOS binary compare counts changed bytes and ranges',()=>{const a=new Uint8Array([1,2,3,4]).buffer;const b=new Uint8Array([1,9,3,8]).buffer;const r=api.compareBios(a,b);assert.equal(r.differentBytes,2);assert.equal(r.changedRanges,2);assert.equal(r.sameLength,true);});
await check('BIOS compare handles unequal sizes without writing files',()=>{const r=api.compareBios(new Uint8Array([1,2]).buffer,new Uint8Array([1,2,3]).buffer);assert.equal(r.differentBytes,1);assert.equal(r.sameLength,false);assert.ok(!runtime.includes('navigator.serial.getWriter'));});
await check('MBR parser recognizes signature and partition metadata',()=>{const b=new Uint8Array(512);b[510]=0x55;b[511]=0xaa;b[450]=0x83;b[454]=1;b[458]=10;const r=api.parseDiskHeader(b,512);assert.equal(r.mbrSignature,true);assert.equal(r.partitions.length,1);assert.equal(r.readOnly,true);});
await check('GPT parser recognizes EFI PART header',()=>{const b=new Uint8Array(1024);b[512]=69;b[513]=70;b[514]=73;b[515]=32;b[516]=80;b[517]=65;b[518]=82;b[519]=84;const r=api.parseDiskHeader(b,1024);assert.equal(r.gptSignature,true);});
await check('State normalization drops malformed collections and bounds user data',()=>{const n=api.normalizeState({models:'broken',cases:[{title:'Test'.repeat(100),symptom:'x'}],tickets:[{device:'PC',parts:-5}],documents:Array.from({length:600},(_,i)=>({id:String(i)}))});assert.equal(n.models.length,0);assert.ok(n.cases[0].title.length<=180);assert.ok(n.documents.length<=500);});
await check('Device identification persists locally',()=>{api.addModel({manufacturer:'EDU',model:'Model-A',boardId:'EDU-BOARD-1',revision:'REV 1'});assert.equal(api.getState().models.length,1);assert.equal(api.getState().models[0].boardId,'EDU-BOARD-1');});
await check('Service Manager accepts local work orders and cost values',()=>{api.addTicket({device:'Laptop EDU',client:'Klient-001',parts:120,labor:180,status:'Diagnostyka'});const t=api.getState().tickets[0];assert.equal(t.device,'Laptop EDU');assert.equal(t.parts+t.labor,300);});
await check('Case exchange stores structured local case records',()=>{api.addCase({title:'Brak obrazu — EDU',device:'Laptop',symptom:'Czarny ekran',cause:'Do potwierdzenia',resolution:'Test końcowy',source:'Ćwiczenie'});assert.equal(api.getState().cases.length,1);assert.equal(api.getState().cases[0].status,'local');});
await check('Self-check suite runs and reports individual result rows',()=>{const r=api.runSelfChecks();assert.equal(r.length,12);assert.ok(r.every(x=>typeof x.ok==='boolean'));assert.equal(r.filter(x=>!x.ok).length,0,JSON.stringify(r.filter(x=>!x.ok)));});
await check('Knowledge update manifest SHA-256 matches canonical payload',async()=>{const payload={version:manifest.version,updatedAt:manifest.updatedAt,sources:manifest.sources};const dig=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));const hash=[...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('');assert.equal(hash,manifest.integrity);assert.ok(manifest.sources.length>=8);});
await check('HTML contains FIX44 navigation, independent view and all 16 tab controls',()=>{assert.ok(html.includes('data-view="fix44"'));assert.ok(html.includes('id="view-fix44"'));assert.ok(html.includes('data-f44-tab="updates"'));assert.equal((html.match(/data-f44-tab=/g)||[]).length,16);});
await check('PWA caches FIX44 JS, CSS and knowledge manifest without dropping FIX43',()=>{for(const token of ['master-service-center-fix44.js','master-service-center-fix44.css','knowledge-updates-fix44.json','knowledge-suite-fix43.js','knowledge-suite-fix43.css','fix44-master-service-center-20261104','fix43-knowledge-feedback-20261104'])assert.ok(sw.includes(token),`missing ${token}`);});
await check('Release id is aligned across release.json, HTML metadata and auth status API',()=>{assert.equal(release.release,'6.8.0');assert.equal(release.build,build);assert.ok(html.includes(`academy-build" content="${build}`));assert.ok(read('functions/api/auth/status.js').includes(build));});
await check('Publication watcher checks FIX44 local assets, tests and remote artifacts',()=>{const w=read('AUTO_PUBLISH_WATCHER.js');assert.ok(w.includes('master-service-center-fix44.js'));assert.ok(w.includes('remoteFix44Valid'));assert.ok(w.includes('fix44-master-service-center-20261104'));});
await check('OneClick publisher contains FIX44 contract and required asset checks',()=>{const w=read('ONECLICK_AKADEMIA.js');assert.ok(w.includes(build));assert.ok(w.includes('NP_NAUKA_FIX44'));assert.ok(w.includes('master-service-center-fix44.css'));});
await check('Previous FIX43 feedback/API and database migration remain in project',()=>{assert.ok(html.includes('id="view-feedback"'));assert.ok(fs.existsSync(path.join(ROOT,'functions/api/site-feedback.js')));assert.ok(fs.existsSync(path.join(ROOT,'migrations/0017_site_feedback_fix43.sql')));});
await check('Safety contract keeps BIOS and disk workflows read-only',()=>{assert.ok(runtime.includes('Surowe pliki nie są zapisywane'));assert.ok(runtime.includes('Analiza odczytuje nagłówki MBR/GPT'));assert.ok(runtime.includes('No firmware writes'));assert.ok(!runtime.includes('navigator.serial.getWriter'));});
await check('CSS provides responsive breakpoints and print-safe reports',()=>{assert.ok(css.includes('@media(max-width:900px)'));assert.ok(css.includes('@media(max-width:600px)'));assert.ok(css.includes('@media print'));});

console.log(`\nFIX44 MASTER SERVICE CENTER: ${passed}/${passed} PASS`);
