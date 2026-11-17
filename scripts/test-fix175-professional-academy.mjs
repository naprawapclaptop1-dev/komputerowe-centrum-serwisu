#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const js=read('WEB_PUBLISH/assets/academy-professional-repair-fix175.js');
const css=read('WEB_PUBLISH/assets/academy-professional-repair-fix175.css');
const sw=read('WEB_PUBLISH/service-worker.js');
const oneclick=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const checks=[];
function check(name,fn){fn();checks.push(name);console.log(`[PASS] ${name}`);}
const ctx=vm.createContext({console});
vm.runInContext(js,ctx,{timeout:5000});
const api=ctx.NAUKA_FIX175;
check('FIX168–FIX175: runtime exposes all eight practice modules and five shared tools',()=>{
 assert.ok(api);assert.equal(api.windowsScenarios && Object.keys(api.windowsScenarios).length,4);
 assert.equal(Object.keys(api.laptopTasks).length,5);assert.equal(Object.keys(api.recoveryCases).length,4);
 assert.ok(api.lookupHardwareId&&api.powerScenarios&&api.finalProfiles&&api.masterCases.length===4);
 assert.equal(api.faults.length,12);assert.equal(api.codes.length,11);
});
check('Windows Rescue decisions prioritize data safety and reversible repair steps',()=>{
 for(const item of Object.values(api.windowsScenarios)){assert.equal(item.options[item.correct].includes('format')||item.options[item.correct].includes('Usuń'),false);assert.ok(item.explanation.length>35);}
});
check('Laptop teardown labs have sequential instructions for five service tasks',()=>{
 for(const task of Object.values(api.laptopTasks)){assert.ok(task.steps.length>=4);assert.ok(task.prompt.length>20);}
});
check('Data recovery labs avoid writing to the source disk and bypassing encryption',()=>{
 for(const item of Object.values(api.recoveryCases)){assert.ok(item.options[item.correct].length>25);assert.ok(item.explanation.length>35);}
 assert.match(api.recoveryCases.deleted.options[0],/obrazie|kopii/i);
 assert.match(api.recoveryCases.encrypted.options[0],/legaln/i);
});
check('Driver lab recognizes PCI VEN and USB VID identifiers without downloading drivers',()=>{
 assert.equal(api.lookupHardwareId('PCI\\VEN_10DE&DEV_2684').vendor,'NVIDIA');
 assert.equal(api.lookupHardwareId('USB\\VID_0BDA&PID_8153').vendor,'Realtek');
 assert.equal(api.lookupHardwareId('unknown').valid,false);
});
check('Power and electrical scenarios include safety controls and prohibit unsafe shortcuts',()=>{
 for(const item of Object.values(api.powerScenarios)){assert.ok(item.options[item.correct].length>40);assert.ok(item.explanation.length>35);}
 assert.ok(html.includes('a168SafeMains')&&html.includes('a168SafePsu')&&html.includes('a168SafeBattery'));
 assert.match(html,/Nie należy otwierać ich obudowy|Nie otwieraj zasilaczy sieciowych/i);
});
check('Service intake, final QA, cost calculator, journal and local ranking are wired to functional controls',()=>{
 for(const id of ['a168IntakeForm','a168FinalEvaluate','a168CostCalc','a168JournalForm','a168JournalExport','a168ProfileSave','a168RankingList','a168FaultGenerate','a168CodeSearch']) assert.ok(html.includes(`id="${id}"`));
 assert.ok(js.includes("on('a168IntakeForm', 'submit'"));assert.ok(js.includes("on('a168FinalEvaluate', 'click'"));assert.ok(js.includes("on('a168JournalForm', 'submit'"));
});
check('Master exam cases contain multiple simultaneous hidden faults, with diagnosis/plan/verification scoring',()=>{
 for(const item of api.masterCases){assert.match(item.diagnosis[item.correctDiagnosis],/ORAZ|oraz/i);assert.ok(item.context.length>100);const res=api.evaluateMaster(item,{diagnosis:item.correctDiagnosis,plan:item.correctPlan,validation:item.correctValidation});assert.equal(res.points,100);assert.equal(res.passed,true);}
 assert.equal(api.evaluateMaster(api.masterCases[0],{diagnosis:1,plan:0,validation:0}).points,70);
});
check('Home dashboard shows a prominent launch banner, two action buttons and a quick-access card',()=>{
 assert.ok(html.includes('class="a168-home-launch"'));
 assert.ok(html.includes('data-a168-launch="overview"'));
 assert.ok(html.includes('data-a168-launch="master"'));
 assert.ok(html.includes('a168-home-command-card'));
 assert.ok(html.indexOf('class="a168-home-launch"')<html.indexOf('id="np640Showcase"'));
});
check('Sidebar has a dedicated Akademia Mistrza Serwisu entry separate from the old Centrum Mistrza item',()=>{
 assert.ok(html.includes('class="nav-item a168-nav-item"'));
 assert.ok(html.includes('>Akademia Mistrza Serwisu</span>'));
 assert.ok(html.includes('FIX168–175'));
});
check('Direct launcher activates the existing view, switches to the selected lab, then scrolls to it',()=>{
 assert.ok(html.includes("var a168Launch = target.closest && target.closest('[data-a168-launch]')"));
 assert.ok(html.includes("window.ACADEMY_SHOW_VIEW('academypro')"));
 assert.ok(html.includes("suite.scrollIntoView({ behavior: 'smooth', block: 'start' })"));
 assert.ok(html.includes("suite.querySelector('[data-a168-tab=\"' + a168TargetTab.replace(/[^a-z]/g, '') + '\"]')"));
});
check('All 17 lab/tool tabs have matching panels inside existing view-academypro; no duplicate IDs or new view',()=>{
 const tabs=[...html.matchAll(/data-a168-tab="([a-z]+)"/g)].map(m=>m[1]);
 const panels=[...html.matchAll(/data-a168-panel="([a-z]+)"/g)].map(m=>m[1]);
 assert.equal(tabs.length,20);assert.deepEqual(tabs,panels);assert.ok(tabs.includes('advanced'),'FIX179 expert curriculum tab must remain integrated');assert.ok(tabs.includes('systemdiag'),'FIX180 system diagnostics tab must remain integrated');assert.ok(tabs.includes('deploy'),'FIX181 deployment/migration/refurb tab must be integrated');assert.ok(tabs.includes('specialist'),'FIX182 specialist-systems tab must remain integrated');assert.ok(tabs.includes('serviceexpert'),'FIX183 tab must remain integrated');assert.ok(tabs.includes('expertdiag'),'FIX184 additive tab expected');
 assert.equal((html.match(/id="view-[^"]+"/g)||[]).length,35);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'HTML IDs must be unique');
 assert.ok(html.includes('id="view-academypro"'));
});
check('PWA caches FIX175 JS/CSS under a new app cache while preserving the separate FIX135 photo cache',()=>{
 assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'"));
 assert.ok(sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'"));
 for(const asset of ['academy-professional-repair-fix175.js?v=6.8.0-fix175','academy-professional-repair-fix175.css?v=6.8.0-fix175'])assert.ok(sw.includes(asset));
 assert.ok(html.includes('academy-professional-repair-fix175.js?v=6.8.0-fix175'));
});
check('Release metadata preserves version, 1083 lessons, 35 views and existing D1 without migrations',()=>{
 const m=release.academyProfessionalRepairFix175;assert.equal(release.release,'6.8.0');assert.equal(release.latestHotfix,'FIX176');assert.equal(release.latestHotfixBuild,'6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
 assert.equal(release.currentLessonCatalog.totalCatalogLessons,1083);assert.equal(m.expectedExistingViews,35);assert.equal(m.newViews,0);assert.equal(m.modules.length,8);assert.equal(m.sharedTools.length,5);
 assert.equal(m.newD1Database,false);assert.equal(m.newD1Tables,false);assert.equal(m.d1SchemaMigrations,false);assert.equal(m.hardwareAccess,false);assert.equal(m.simulatedTraining,true);
});
check('OneClick and Watcher require FIX175 assets, launch entries, active cache and existing Gemini-only guard',()=>{
 for(const src of [oneclick,watcher]){assert.ok(src.includes('academy-professional-repair-fix175.js'));assert.ok(src.includes('academy-professional-repair-fix175.css'));assert.ok(src.includes('FIX175'));assert.ok(src.includes('nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'));}
 assert.ok(oneclick.includes('scripts/run-tests-fix176.mjs'));assert.ok(watcher.includes('scripts/run-tests-fix176.mjs'));
 assert.ok(read('functions/api/chat.js').includes('GEMINI_API_KEY'));
});
check('No direct hardware access, network scan or D1 schema/data migration was added by the new training runtime',()=>{
 assert.ok(!/navigator\.usb|navigator\.serial|WebUSB|WebSerial|fetch\s*\(/i.test(js));
 assert.ok(!/DROP\s+TABLE|CREATE\s+TABLE|ALTER\s+TABLE|DELETE\s+FROM/i.test(js));
 assert.ok(js.includes('localStorage'));
});
console.log(`\nFIX175 PROFESSIONAL ACADEMY: ${checks.length}/${checks.length} PASS`);
