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
const html=read('WEB_PUBLISH/index.html');
const js=read('WEB_PUBLISH/assets/academy-practical-suite-fix155.js');
const coreSource=read('WEB_PUBLISH/assets/academy-practical-core-fix155.js');
const css=read('WEB_PUBLISH/assets/academy-practical-suite-fix155.css');
const sw=read('WEB_PUBLISH/service-worker.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const run=(file)=>{const r=spawnSync(process.execPath,['--check',path.join(ROOT,file)],{encoding:'utf8'});assert.equal(r.status,0,`${file} syntax: ${r.stderr||r.stdout}`);};
const checks=[];const check=(label,fn)=>{fn();checks.push(label);console.log(`[PASS] ${label}`);};
check('FIX155 metadata preserves product 6.8.0, identifies five hotfixes and prohibits new views/D1/data migrations',()=>{
 assert.equal(release.release,'6.8.0');assert.equal(release.latestHotfix,'FIX176');assert.equal(release.latestHotfixBuild,'6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
 assert.equal(release.serviceWorkerCacheName,'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
 const m=release.academyPracticalSuiteFix155;assert.equal(m.hotfix,'FIX155');assert.deepEqual(m.includedHotfixes,['FIX151','FIX152','FIX153','FIX154','FIX155']);assert.equal(m.productVersion,'6.8.0');assert.equal(m.view,'view-academypro');assert.equal(m.newViews,0);assert.equal(m.d1Migrations,false);assert.equal(m.dataMigrations,false);assert.equal(m.productionPublished,false);assert.equal(m.modules.length,8);assert.equal(m.externalAi,false);
});
check('Osiem nowych paneli znajduje się w istniejącym widoku Akademii; 35 tras pozostaje bez zmian',()=>{
 assert.equal((html.match(/id="view-[a-z0-9-]+"/g)||[]).length,35);assert.ok(html.includes('id="view-academypro"'));assert.ok(html.includes('id="a155Extension"'));
 const tabs=[...html.matchAll(/data-a155-tab="([^"]+)"/g)].map(x=>x[1]);const panels=[...html.matchAll(/data-a155-panel="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(tabs,['cases','bios','hardware','exam','network','portfolio','tutor','teacher']);assert.deepEqual(panels,tabs);
});
check('Wymagane formularze, wyniki, interakcje, eksporty i certyfikat są obecne',()=>{
 for(const id of ['a155CaseSelect','a155CaseStart','a155CaseStage','a155BiosMode','a155BiosCheck','a155HardwareCase','a155HardwareChoices','a155ExamStart','a155ExamNext','a155Certificate','a155Ip','a155SubnetCalc','a155PortfolioForm','a155PortfolioExport','a155TutorAsk','a155SkillMap','a155TeacherForm','a155TeacherExport','a155ExportAll'])assert.ok(html.includes(`id="${id}"`),`missing ${id}`);
 for(const marker of ['const cases = {','function showCaseStep','core.evaluateBios','hardwareCases=','const examPool=','function finishExam','core.subnet','const tutorRules=','function renderSkillMap','function renderTeacher','ACADEMY_FIX155_API','localStorage'])assert.ok(js.includes(marker),`missing JS marker ${marker}`);
});
check('Silnik matematyczny IPv4/CIDR oblicza podsieci i odrzuca nieprawidłowe dane',()=>{
 const context={};vm.runInNewContext(coreSource,context);const core=context.ACADEMY_FIX155_CORE;
 assert.deepEqual(JSON.parse(JSON.stringify(core.subnet('192.168.1.10',24))),{ip:'192.168.1.10',prefix:24,mask:'255.255.255.0',network:'192.168.1.0',broadcast:'192.168.1.255',firstHost:'192.168.1.1',lastHost:'192.168.1.254',hosts:254});
 assert.equal(core.subnet('10.0.0.1',31).hosts,2);assert.equal(core.subnet('10.0.0.1',32).hosts,1);assert.equal(core.subnet('10.2.3.4',0).mask,'0.0.0.0');
 assert.throws(()=>core.subnet('999.1.1.1',24));assert.throws(()=>core.subnet('192.168.1.1',33));assert.throws(()=>core.subnet('192.168.1',24));
});
check('Silnik BIOS/UEFI wykrywa poprawny i sprzeczny profil rozruchu',()=>{
 const context={};vm.runInNewContext(coreSource,context);const core=context.ACADEMY_FIX155_CORE;
 const good=core.evaluateBios({mode:'uefi',partition:'gpt',system:'efi',secure:'on',tpm:'on',storage:'ahci',goal:'win11',disk:'large'});assert.equal(good.ok,true);
 const bad=core.evaluateBios({mode:'uefi',partition:'mbr',system:'active',secure:'off',tpm:'off',storage:'raid',goal:'win11',disk:'large'});assert.equal(bad.ok,false);assert.ok(bad.issues.length>=4);assert.ok(bad.notes.some(x=>x.includes('sterownik')));
});
check('Service Worker przechowuje trzy nowe zasoby i zachowuje osobny cache zdjęć FIX135',()=>{
 assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'"));assert.ok(sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'"));
 for(const a of ['academy-practical-core-fix155.js?v=6.8.0-fix155','academy-practical-suite-fix155.js?v=6.8.0-fix155','academy-practical-suite-fix155.css?v=6.8.0-fix155']){assert.ok(html.includes(a));assert.ok(sw.includes(`/${a}`));assert.equal((sw.match(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1);}
 assert.ok(html.indexOf('academy-practical-core-fix155.js')<html.indexOf('academy-practical-suite-fix155.js'));
});
check('OneClick i Watcher walidują FIX155, zasoby PWA i ograniczenia bezpieczeństwa',()=>{
 for(const token of ['academyPracticalSuiteFix155','a155CaseStart','a155BiosCheck','a155HardwareChoices','a155ExamStart','a155SubnetCalc','a155PortfolioForm','a155TutorAsk','a155TeacherForm','academy-practical-core-fix155.js'])assert.ok(publisher.includes(token),`publisher ${token}`);
 for(const token of ['academyPracticalSuiteFix155','a155CaseStart','a155BiosCheck','a155HardwareChoices','a155ExamStart','a155SubnetCalc','a155PortfolioForm','a155TutorAsk','a155TeacherForm','academy-practical-suite-fix155.js'])assert.ok(watcher.includes(token),`watcher ${token}`);
 assert.ok(publisher.includes("releaseJson.latestHotfix !== 'FIX176'"));assert.ok(watcher.includes("localRelease.latestHotfix !== 'FIX176'"));assert.ok(publisher.includes('scripts/run-tests-fix176.mjs'));assert.ok(watcher.includes('scripts/run-tests-fix176.mjs'));
});
check('Dotychczasowe lekcje, zdjęcia, widoki i kontrakty FIX148/FIX149 są zachowane',()=>{
 assert.equal(release.currentLessonCatalog.totalCatalogLessons,1083);assert.equal(release.currentLessonCatalog.publisherContractHotfix,'FIX149');
 assert.equal(release.academyMasterExtensionFix149.modules.length,5);assert.equal(release.academyProModulesFix148.modules.length,7);
 const badge=html.match(/id="lessonTotalBadge">\s*(\d+)/);assert.ok(badge);assert.equal(Number(badge[1]),1083);
 assert.ok(html.includes('content="FIX149"'));assert.ok(html.includes('content="FIX155"'));
 const photo=JSON.parse(read('WEB_PUBLISH/media/home-photo-library-fix118.json'));assert.equal(photo.entries.length,19);assert.equal(photo.hotfix,'FIX135');
});
check('Wskazówki tutora i certyfikaty jasno oznaczają lokalny charakter bez zewnętrznego AI i formalnych kwalifikacji',()=>{
 assert.ok(html.includes('nie jest generatywną rozmową z modelem AI'));assert.ok(html.includes('Nie jest państwowym świadectwem'));
 assert.ok(release.academyPracticalSuiteFix155.tutor.includes('rule-based'));assert.ok(release.academyPracticalSuiteFix155.certificates.includes('not an accredited'));
 assert.ok(!js.includes('fetch('));assert.ok(!js.includes('XMLHttpRequest'));
});
check('Nowe skrypty przechodzą kontrolę składni JavaScript',()=>{run('WEB_PUBLISH/assets/academy-practical-core-fix155.js');run('WEB_PUBLISH/assets/academy-practical-suite-fix155.js');run('ONECLICK_AKADEMIA.js');run('AUTO_PUBLISH_WATCHER.js');});
console.log(`\nFIX155 PRACTICAL ACADEMY SUITE: ${checks.length}/${checks.length} PASS`);
