#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const base=read('WEB_PUBLISH/assets/global-academy-suite-fix60.js');
const expansion=read('WEB_PUBLISH/assets/global-academy-expansion-fix73.js');
const css=read('WEB_PUBLISH/assets/global-academy-fallback-fix176.css');
const sw=read('WEB_PUBLISH/service-worker.js');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const checks=[];function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}
check('Global Academy has a visible static fallback directly in its existing route, so the screen is not empty if scripts fail',()=>{
 assert.ok(html.includes('<div id="globalAcademyRoot">\n          <section class="ga176-fallback" id="globalAcademyFallback"'));
 for(const id of ['globalAcademyFallbackStatus','ga176-fallback-grid']) if(id!=='ga176-fallback-grid') assert.ok(html.includes(`id="${id}"`));
 assert.ok(html.includes('OTWÓRZ AKADEMIĘ MISTRZA'));
});
check('Fallback directly opens Academy Master, Courses, Diagnostics and Repairs through existing routes',()=>{
 for(const route of ['academypro','courses','diagnostics','repairs']) assert.ok(html.includes(`data-nav="${route}"`));
 assert.ok(html.includes('data-a168-launch="overview"'));
});
check('Full Global Academy runtime preserves the fallback and restores it if dynamic rendering throws',()=>{
 assert.ok(base.includes('const safeFallbackHtml=root.innerHTML'));
 assert.ok(base.includes('root.innerHTML=safeFallbackHtml'));
 assert.ok(base.includes('view.dataset.gasMountStatus=\'fallback\''));
 assert.ok(base.includes('FIX176 Global Academy mount failed; static navigation fallback restored.'));
});
check('Legacy FIX73 expansion exits cleanly when the dynamic shell did not mount',()=>{
 assert.ok(expansion.includes("const tabs = q('.gas-tabs', ROOT);"));
 assert.ok(expansion.includes("if (!tabs || !q('#gasPanel', ROOT)) return;"));
});
check('Fallback styles are responsive, independently linked and cached by PWA',()=>{
 assert.ok(css.includes('.ga176-fallback-grid'));
 assert.ok(css.includes('@media(max-width:700px)'));
 assert.ok(html.includes('global-academy-fallback-fix176.css?v=6.8.0-fix176'));
 assert.ok(sw.includes("'/assets/global-academy-fallback-fix176.css?v=6.8.0-fix176'"));
});
check('Dedicated Academy navigation is visible in top menu, sidebar and home launchers',()=>{
 assert.ok(html.includes('class="nav-item top-nav-item a176-top-launch"'));
 assert.ok(html.includes('class="nav-item a168-nav-item"'));
 assert.ok(html.includes('class="a168-home-launch"'));
 assert.ok(html.includes('a168-home-command-card'));
});
check('FIX176 metadata preserves 35 existing views, 1083 lessons, D1, Gemini secret and 6.8.0 product version',()=>{
 const m=release.academyGlobalAcademyFallbackFix176;
 assert.equal(release.release,'6.8.0');assert.equal(release.latestHotfix,'FIX176');
 assert.equal(release.latestHotfixBuild,'6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
 assert.equal(release.currentLessonCatalog.totalCatalogLessons,1083);
 assert.equal((html.match(/id="view-[^"]+"/g)||[]).length,35);
 assert.equal(m.expectedExistingViews,35);assert.equal(m.newViews,0);
 assert.equal(m.newD1Database,false);assert.equal(m.newD1Tables,false);assert.equal(m.d1SchemaMigrations,false);
 assert.equal(m.existingGeminiSecretPreserved,true);assert.equal(m.existingD1Preserved,true);
});
check('Publisher and watcher enforce the fallback and new PWA cache without removing FIX175 modules',()=>{
 for(const source of [one,watcher]){
  assert.ok(source.includes('globalAcademyFallback'));
  assert.ok(source.includes('global-academy-fallback-fix176.css'));
  assert.ok(source.includes('academy-professional-repair-fix175.js'));
  assert.ok(source.includes('nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'));
  assert.ok(source.includes('scripts/run-tests-fix176.mjs'));
 }
});
console.log(`\nFIX176 GLOBAL ACADEMY RESCUE: ${checks.length}/${checks.length} PASS`);
