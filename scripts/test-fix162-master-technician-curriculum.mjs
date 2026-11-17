#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('WEB_PUBLISH/index.html'), coreSource=read('WEB_PUBLISH/assets/academy-master-curriculum-core-fix162.js'), suite=read('WEB_PUBLISH/assets/academy-master-curriculum-fix162.js'), css=read('WEB_PUBLISH/assets/academy-master-curriculum-fix162.css'), sw=read('WEB_PUBLISH/service-worker.js'), publisher=read('ONECLICK_AKADEMIA.js'), watcher=read('AUTO_PUBLISH_WATCHER.js'), classroom=read('functions/api/classroom.js'), certificates=read('functions/api/certificates.js'), release=JSON.parse(read('WEB_PUBLISH/release.json'));
const checks=[];const check=(label,fn)=>{fn();checks.push(label);console.log(`[PASS] ${label}`);};
const run=file=>{const source=read(file);const args=file.startsWith('functions/')?['--input-type=module','--check']:['--check'];const r=spawnSync(process.execPath,args,{input:source,encoding:'utf8'});assert.equal(r.status,0,`${file}: ${r.stderr||r.stdout}`);};
const context={};vm.runInNewContext(coreSource,context);const core=context.ACADEMY_FIX162_CORE;
check('FIX162 regression remains intact while FIX175 is the active 6.8.0 hotfix',()=>{
 assert.equal(release.release,'6.8.0');assert.equal(release.latestHotfix,'FIX176');assert.equal(release.latestHotfixBuild,'6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');assert.equal(release.serviceWorkerCacheName,'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
 const m=release.academyMasterCurriculumFix162;assert.equal(m.hotfix,'FIX162');assert.deepEqual(m.includedHotfixes,['FIX156','FIX157','FIX158','FIX159','FIX160','FIX161','FIX162']);assert.equal(m.modules.length,11);assert.equal(m.view,'view-academypro');assert.equal(m.newViews,0);assert.equal(m.d1SchemaMigrations,false);assert.equal(m.newD1Tables,false);assert.equal(m.newD1Database,false);assert.equal(m.productionPublished,false);
});
check('All ten new interactive panels live in the existing Academy view; route count remains 35',()=>{
 assert.equal((html.match(/id="view-[a-z0-9-]+"/g)||[]).length,35);assert.ok(html.includes('id="view-academypro"'));assert.ok(html.includes('id="a162Extension"'));
 const tabs=[...html.matchAll(/data-a162-tab="([^"]+)"/g)].map(x=>x[1]);const panels=[...html.matchAll(/data-a162-panel="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(tabs,['board','meter','builder','solder','ai','classes','cert','atlas','media','challenge']);assert.deepEqual(panels,tabs);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'duplicate HTML IDs detected');
});
check('BoardView map contains eight documented component blocks and safe diagnostic guidance',()=>{
 for(const id of ['cpu','vrm','ram','bios','ec','usbc','ssd','pch'])assert.ok(html.includes(`data-a162-part="${id}"`));assert.ok(suite.includes('core.diagnoseBoard')&&suite.includes('symptom.onchange=updateDiagnosis'));assert.ok(html.includes('nie pinout konkretnego laptopa'));
 const item=core.diagnoseBoard('usbc','Brak ładowania');assert.equal(item.part,'USB-C / Power Delivery');assert.ok(item.steps.length>=3);
});
check('Virtual meter returns synthetic readings only and rejects unknown points',()=>{
 const v=core.measure('usb','vdc','cc'),ohm=core.measure('short','ohm','rail');assert.equal(v.value,0.4);assert.equal(v.synthetic,true);assert.equal(v.unit,'V');assert.equal(ohm.value,0.3);assert.equal(ohm.unit,'Ω');assert.throws(()=>core.measure('usb','vdc','not-a-point'));
 assert.ok(html.includes('nie są połączone z prawdziwą sondą'));
});
check('PC configurator detects socket, memory and power supply conflicts',()=>{
 const good=core.checkConfig({cpu:'am5',board:'b650',ram:'ddr5',gpu:'high',psu:'p750',extras:100});assert.equal(good.ok,true);assert.equal(good.recommended,750);
 const bad=core.checkConfig({cpu:'am4',board:'b650',ram:'ddr4',gpu:'high',psu:'p450',extras:180});assert.equal(bad.ok,false);assert.ok(bad.issues.some(x=>x.includes('socket')));assert.ok(bad.issues.some(x=>x.includes('RAM')));assert.ok(bad.issues.some(x=>x.includes('Zasilacz')));
});
check('SMD/connector/BGA simulator validates the complete safe sequence',()=>{
 for(const item of core.listSolder())assert.equal(core.checkSolderOrder(item.id,item.steps.map((_,i)=>i)).valid,true);
 assert.equal(core.checkSolderOrder('bga',[1,0,2,3,4,5]).valid,false);assert.ok(coreSource.includes('wyłącznie na płytce treningowej'));
});
check('AI tutor calls the existing server-side /api/chat endpoint and keeps API secrets out of browser code',()=>{
 assert.ok(suite.includes("fetch('/api/chat'"));assert.ok(suite.includes('conversationId:aiConversationId'));assert.ok(suite.includes('data.conversationId)aiConversationId=data.conversationId'));assert.ok(classroom.includes("OPENAI_API_KEY")===false);assert.ok(!suite.includes('Bearer '));assert.ok(!/sk-[A-Za-z0-9]{12}/.test(suite));assert.ok(read('functions/api/chat.js').includes('GEMINI_API_KEY'));assert.ok(read('functions/api/chat.js').includes('generativelanguage.googleapis.com/v1/interactions'));assert.ok(!read('functions/api/chat.js').includes('api.openai.com/v1/responses'));assert.ok(!read('scripts/configure-gemini-secret.js').includes('setRawMode(true)'));assert.ok(read('scripts/configure-gemini-secret.ps1').includes('Read-Host -Prompt'));assert.ok(read('scripts/configure-gemini-secret.ps1').includes('-AsSecureString'));assert.ok(!read('scripts/configure-gemini-secret.js').includes('createServer'));
 assert.ok(html.includes('Klucz Gemini nie trafia do przeglądarki'));assert.ok(html.includes('wyłącznie w oknie CMD'));assert.ok(suite.includes('credentials:\'same-origin\''));
});
check('Online classes use only existing academy_events rows and enforce same-origin, session and consent',()=>{
 for(const token of ['academy_classroom_created','academy_classroom_assignment','academy_classroom_submission','academy_classroom_grade','sha256Hex','sameOrigin','getSession','requireConsent','rateLimit'])assert.ok(classroom.includes(token),`missing classroom guard ${token}`);
 assert.ok(classroom.includes('INSERT INTO academy_events'));assert.ok(!fs.existsSync(path.join(ROOT,'migrations','0018_academy_classes.sql')));assert.ok(release.academyMasterCurriculumFix162.newD1Tables===false);
});
check('Certificate registry now uses server-side exam grading and clearly labels historical client-scored records',()=>{
 assert.ok(certificates.includes("event_type='academy_certificate_issued'"));assert.ok(certificates.includes('requireConsent'));assert.ok(certificates.includes("action==='start'"));assert.ok(certificates.includes("action==='submit'"));assert.ok(certificates.includes('score>=70'));assert.ok(certificates.includes('EXAM_ACTION_INVALID'));assert.ok(certificates.includes('LEGACY_RECORD_FOUND'));assert.ok(certificates.includes('isServerGraded:false'));assert.ok(certificates.includes('akredytacja')&&certificates.includes('kwalifikacja zawodowa'));
 assert.ok(html.includes('publicznie sprawdzić wpis'));assert.ok(/akredytacj\w*|państwow\w* kwalifikacj\w*/i.test(html));
});
check('Searchable component atlas, local poster catalog, weekly challenge and exportable progress are wired',()=>{
 for(const token of ['a162Search','a162SearchResults','a162PartAtlas','a162MediaLinks','a162ChallengeAnswers','a162Badges','a162ExportProgress'])assert.ok(html.includes(token)||token==='a162MediaLinks'&&html.includes('a162-media-grid'));
 assert.ok(core.search('USB-C').length>=1);assert.ok(core.search('VRM').length>=1);const ch=core.weeklyChallenge('2026-W46');assert.equal(ch.correct,1);assert.ok(suite.includes('NaukaOdAdoZ_Postepy_FIX162.json'));
});
check('Three FIX162 assets are connected in HTML and PWA; photo cache FIX135 remains unchanged',()=>{
 for(const name of ['academy-master-curriculum-core-fix162.js?v=6.8.0-fix162','academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification','academy-master-curriculum-fix162.css?v=6.8.0-fix162']){assert.ok(html.includes(name));assert.ok(sw.includes('/assets/'+name));assert.equal((sw.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1);}
 assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'"));assert.ok(sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'"));
});
check('OneClick and Watcher preflight all FIX162 assets, functions and existing-D1 scope',()=>{
 for(const t of ['academyMasterCurriculumFix162','a162PartComplete','a162Measure','a162BuildCheck','a162SolderCheck','a162AiForm','a162ClassCreate','a162CertIssue','a162CertVerify','a162Search','a162ChallengeAnswers','classroom.js','certificates.js'])assert.ok(publisher.includes(t),`OneClick missing ${t}`);
 for(const t of ['academyMasterCurriculumFix162','a162PartComplete','a162Measure','a162BuildCheck','a162SolderCheck','a162AiForm','a162ClassCreate','a162CertIssue','a162CertVerify','a162Search','a162ChallengeAnswers','classroom.js','certificates.js'])assert.ok(watcher.includes(t),`Watcher missing ${t}`);
 assert.ok(publisher.includes("releaseJson.latestHotfix !== 'FIX176'"));assert.ok(watcher.includes("localRelease.latestHotfix !== 'FIX176'"));assert.ok(publisher.includes('scripts/run-tests-fix176.mjs'));assert.ok(watcher.includes('scripts/run-tests-fix176.mjs'));
});
check('Previous lessons, photos, account routes, historical FIX148–FIX155 suites and D1 schema are preserved',()=>{
 assert.equal(release.currentLessonCatalog.totalCatalogLessons,1083);assert.equal(release.serviceWorkerCacheName,'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');assert.equal(release.academyPracticalSuiteFix155.hotfix,'FIX155');
 assert.equal((html.match(/id="view-[a-z0-9-]+"/g)||[]).length,35);assert.equal(JSON.parse(read('WEB_PUBLISH/media/home-photo-library-fix118.json')).entries.length,19);
 assert.ok(html.includes('content="FIX149"'));assert.ok(html.includes('content="FIX155"'));assert.ok(html.includes('content="FIX162"'));
});
check('New JavaScript and Cloudflare Functions pass syntax checks',()=>{
 for(const file of ['WEB_PUBLISH/assets/academy-master-curriculum-core-fix162.js','WEB_PUBLISH/assets/academy-master-curriculum-fix162.js','functions/api/classroom.js','functions/api/certificates.js','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','WEB_PUBLISH/service-worker.js'])run(file);
});
console.log(`\nFIX162 MASTER TECHNICIAN CURRICULUM: ${checks.length}/${checks.length} PASS`);
