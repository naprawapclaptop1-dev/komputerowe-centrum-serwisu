import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const html=read('WEB_PUBLISH/index.html');
const runtime=read('WEB_PUBLISH/assets/knowledge-suite-fix43.js');
const css=read('WEB_PUBLISH/assets/knowledge-suite-fix43.css');
const sw=read('WEB_PUBLISH/service-worker.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
let passed=0;
async function check(name,fn){await fn();passed++;console.log(`[PASS] ${name}`);}

await check('FIX43 release ID synchronized across HTML and release.json',()=>{
  assert.equal(release.release,'6.8.0');
  assert.equal(release.build,'6.8.0-fix51-visual-academy-pro-20261105');
  assert.ok(html.includes(`name="academy-build" content="${release.build}"`));
  assert.ok(html.includes('id="view-fix43"') && html.includes('data-view="fix43"'), 'FIX43 knowledge view remains separately accessible under the FIX44 shell');
  assert.ok(release.fix43_knowledge_suite_feedback);
});
await check('Two independent routes and navigation controls exist',()=>{
  for(const view of ['fix43','feedback']){
    assert.ok(html.includes(`id="view-${view}"`));
    assert.ok(html.includes(`data-view="${view}"`));
  }
  assert.ok(html.includes("'fix43','feedback'"));
  assert.ok(html.includes('id="f43FeedbackForm"'));
  assert.ok(html.includes('id="f43AdminFeedbackList"'));
});
await check('All ten FIX43 knowledge workspaces have navigation and live renderers',()=>{
  for(const [tab,template] of [['overview','overviewTemplate'],['doctor','doctorTemplate'],['sequence','sequenceTemplate'],['hardware','hardwareTemplate'],['documents','docsTemplate'],['components','componentsTemplate'],['evidence','evidenceTemplate'],['compatibility','compatibilityTemplate'],['graph','graphTemplate'],['offline','offlineTemplate']]){
    assert.ok(html.includes(`data-f43-tab="${tab}"`));
    assert.ok(runtime.includes(`function ${template}`));
  }
  for(const token of ['diagnoseBoard','evaluateSequence','parseSerialLine','checkBuild','buildEncryptedBackup','restoreEncryptedBackup','NP_NAUKA_FIX43'])assert.ok(runtime.includes(token));
});
await check('Read-only hardware bridge has no serial write, USB or HID control path',()=>{
  assert.ok(runtime.includes('navigator.serial.requestPort'));
  assert.ok(runtime.includes('readable.getReader'));
  assert.doesNotMatch(runtime,/getWriter\s*\(|serialPort\.writable|navigator\.(?:usb|hid)\b/);
  assert.ok(runtime.includes('READ ONLY'));
});
await check('Offline encrypted backup uses PBKDF2 and AES-GCM with a document-size ceiling',()=>{
  assert.ok(runtime.includes("name:'PBKDF2'"));
  assert.ok(runtime.includes("name:'AES-GCM'"));
  assert.ok(runtime.includes('310000'));
  assert.ok(runtime.includes('MAX_BACKUP_DOCS'));
});
await check('Feedback form separately captures rating, add/change/broken and explicit consent',()=>{
  for(const token of ['name="rating"','name="whatAdd"','name="whatChange"','name="whatBroken"','name="details"','name="consent"'])assert.ok(html.includes(token));
  assert.ok(runtime.includes("fetch('/api/site-feedback'"));
  assert.ok(runtime.includes('localStorage.setItem(FEEDBACK_STORE'));
});
await check('Feedback admin tools use the protected admin endpoint and no persisted token',()=>{
  assert.ok(runtime.includes("fetch('/api/admin/site-feedback'"));
  assert.ok(runtime.includes('authorization:`Bearer ${token}`'));
  assert.ok(html.includes('token nie jest zapisywany'));
});
await check('FIX43 CSS is linked, PWA-cached and publication-guarded',()=>{
  assert.ok(html.includes('knowledge-suite-fix43.js?v=6.8.0-fix43'));
  assert.ok(html.includes('knowledge-suite-fix43.css?v=6.8.0-fix43'));
  assert.ok(sw.includes('knowledge-suite-fix43.js'));
  assert.ok(sw.includes('knowledge-suite-fix43.css'));
  assert.ok(sw.includes('fix43-knowledge-feedback-20261104'));
  for(const selector of ['.f43-page-head','.f43-tabs','.f43-overview-grid','.f43-feedback-grid','.f43-stars'])assert.ok(css.includes(selector));
  assert.ok(publisher.includes('knowledge-suite-fix43.js'));
  assert.ok(watcher.includes('knowledge-suite-fix43.js'));
});
await check('Feedback migration is additive and creates indexed queue only',()=>{
  const sql=read('migrations/0017_site_feedback_fix43.sql');
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS academy_site_feedback'));
  assert.ok(sql.includes('CHECK (rating BETWEEN 1 AND 5)'));
  assert.ok(sql.includes('status TEXT NOT NULL DEFAULT'));
  assert.doesNotMatch(sql,/DROP\s+TABLE|DELETE\s+FROM|ALTER\s+TABLE\s+academy_users/i);
  assert.ok(fs.existsSync(path.join(ROOT,'functions/api/site-feedback.js')));
  assert.ok(fs.existsSync(path.join(ROOT,'functions/api/admin/site-feedback.js')));
});

// Run the actual browser runtime in a small inert DOM harness.
const rootNode={innerHTML:'',dataset:{},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};
const pageNode={dataset:{},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};
const feedbackNode={dataset:{},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};
const statusNode={textContent:'',classList:{toggle(){}}};
const store=new Map();
const documentMock={
  getElementById:id=>({f43Stage:rootNode,'view-fix43':pageNode,'view-feedback':feedbackNode,f43Status:statusNode}[id]||null),
  querySelectorAll:()=>[],querySelector:()=>null
};
const windowMock={isSecureContext:true};
const context={window:windowMock,document:documentMock,localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  crypto:webcrypto,TextEncoder,TextDecoder,atob,btoa,Blob,File:globalThis.File,URL,Intl,Date,Math,Number,String,JSON,Object,Array,Map,Set,RegExp,Error,Promise,Uint8Array,ArrayBuffer,
  setTimeout:()=>0,console};
vm.createContext(context);
vm.runInContext(runtime,context,{filename:'knowledge-suite-fix43.js',timeout:4000});
const api=windowMock.NP_NAUKA_FIX43;
assert.ok(api,'FIX43 runtime exports its public test API');
await check('Runtime exposes all modules and normalizes malformed state safely',()=>{
  assert.equal(api.build,'6.8.0-fix43');
  const out=api.normalizeState({diagnoses:'bad',components:[{name:'Test',id:'X'},{name:'<bad>',id:'Y'}],documents:Array.from({length:250},(_,i)=>({id:`d${i}`,name:`D${i}`}))});
  assert.equal(out.diagnoses.length,0);assert.equal(out.components.length,2);assert.equal(out.documents.length,200);
});
await check('Board Doctor returns grounded repair hints and no-match rather than invented diagnosis',()=>{
  const matched=api.diagnoseBoard({symptom:'Laptop brak reakcji na przycisk Power'});
  assert.equal(matched.matched,true);assert.equal(matched.caseId,'no-power');assert.ok(matched.steps.length>=3);assert.ok(matched.hypotheses.length>=2);assert.ok(matched.disclaimer.includes('heurystyczne'));
  const unknown=api.diagnoseBoard({symptom:'zagadkowy problem XZ-000'});
  assert.equal(unknown.matched,false);assert.equal(unknown.confidence,0);
});
await check('Power sequence analyzer identifies the first missing signal and unknown measurements',()=>{
  const missing=api.evaluateSequence({VIN_PRESENT:'ok',ACOK:'ok',ALW_3V3:'missing',ALW_5V:'ok'});
  assert.equal(missing.level,'warn');assert.ok(missing.summary.includes('ALW_3V3'));
  const unknown=api.evaluateSequence({VIN_PRESENT:'ok',ACOK:'unknown'});
  assert.equal(unknown.level,'neutral');assert.ok(unknown.summary.includes('ACOK'));
  const ok=api.evaluateSequence(Object.fromEntries(api.getSignals().map(id=>[id,'ok'])));
  assert.equal(ok.level,'good');
});
await check('Serial parser accepts simple numeric telemetry and rejects arbitrary command text',()=>{
  assert.deepEqual(JSON.parse(JSON.stringify(api.parseSerialLine('VCC=19.52 V'))),{value:19.52,unit:'V',line:'VCC=19.52 V'});
  assert.equal(api.parseSerialLine('WYSYLAJ RESET'),null);
});
await check('PC compatibility checks socket, RAM, GPU clearance and PSU headroom',()=>{
  const good=api.checkBuild({cpuSocket:'AM5',boardSocket:'am5',cpuRam:'DDR5',boardRam:'ddr5',gpuLength:280,caseLength:320,psu:850,draw:500});
  assert.equal(good.compatible,true);assert.equal(good.warnings.length,0);
  const bad=api.checkBuild({cpuSocket:'AM4',boardSocket:'AM5',cpuRam:'DDR4',boardRam:'DDR5',gpuLength:340,caseLength:300,psu:500,draw:480});
  assert.equal(bad.compatible,false);assert.ok(bad.issues.length>=3);assert.ok(bad.warnings.length>=1);
});
await check('Diagnosis history persists in local state and is represented in the knowledge graph',()=>{
  api.evaluateAndSaveDiagnosis({device:'Laptop',model:'EDU-Book',boardId:'EDU-1',symptom:'brak reakcji na power'});
  assert.equal(api.getState().diagnoses.length,1);
  assert.ok(api.renderGraph().includes('EDU-Book'));
});
await check('Restoring an encrypted backup clears stale IndexedDB documents before restoring its document set',()=>{
  assert.ok(runtime.includes('async function clearDocStore()'),'IndexedDB store must support replacement');
  assert.ok(runtime.includes('await clearDocStore();for(const d of (Array.isArray(data.documents)'),'restore must clear old documents before importing the backup set');
});

const encrypted=await api.encryptBackup('test-haslo-FIX43-123');
await check('Offline backup is encrypted and round-trips state with authenticated encryption',async()=>{
  assert.ok(encrypted.startsWith('NP43ENC:'));assert.ok(!encrypted.includes('EDU-Book'));
  await api.restoreBackup(encrypted,'test-haslo-FIX43-123');
  assert.equal(api.getState().diagnoses.length,1);
  await assert.rejects(()=>api.restoreBackup(encrypted,'bledne-haslo'),/Nieprawidłowe hasło/);
});

console.log(`\nFIX43 KNOWLEDGE SUITE: ${passed}/${passed} PASS`);
