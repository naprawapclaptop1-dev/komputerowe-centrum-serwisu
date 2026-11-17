#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WEB=path.join(ROOT,'WEB_PUBLISH');
const read=(p)=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const sw=read('WEB_PUBLISH/service-worker.js');
const publisher=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const dataManifest=read('WEB_PUBLISH/media/photo-sources-online.json');
const homeLibrary=read('WEB_PUBLISH/media/home-photo-library-fix118.json');
const expectedCache='nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
const required=[
 'assets/academy-expanded-practice-fix136.js',
 'assets/practice-quiz-fix136.css',
 'assets/learning-engine.js',
 'assets/photo-catalog-fix115.js',
 'assets/homepage-photo-prime-fix118.js'
];
const assertions=[];
function check(name,ok,detail=''){assertions.push({name,ok,detail}); if(!ok) console.error(`[FAIL] ${name}${detail?`: ${detail}`:''}`); else console.log(`[PASS] ${name}`);}
check('Wersja produktu pozostaje 6.8.0; aktywny FIX176 zachowuje runtime zdjęć FIX136', release.release==='6.8.0' && release.latestHotfix==='FIX176' && release.latestHotfixBuild==='6.8.0-fix176-global-academy-rescue-and-master-launch-20261115' && release.photoCatalogRuntimeBuildTag==='6.8.0-fix136-top-photo-priority-practice-lessons-20261114');
check('Id bazowego builda FIX51 zachowany', release.build==='6.8.0-fix51-visual-academy-pro-20261105' && html.includes('content="6.8.0-fix51-visual-academy-pro-20261105"'));
check('Nowy cache aplikacji i istniejący cache zdjęć FIX135', sw.includes(`const CACHE_NAME = '${expectedCache}'`) && sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'"));
for(const asset of required){
 const file=path.join(WEB,asset);
 const versioned=`${asset}?v=6.8.0-fix136`;
 check(`Zasób istnieje i jest ładowany/cachowany: ${asset}`,fs.existsSync(file) && html.includes(versioned) && sw.includes(`/${versioned}`));
}
for(const asset of required){
 const escaped=asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const count=(sw.match(new RegExp(`'/${escaped}\\?v=6\\.8\\.0-fix136'`,'g'))||[]).length;
 check(`Jedna deklaracja CORE dla ${asset}`,count===1,`CORE count=${count}`);
}
check('OneClick uruchamia pełny preflight FIX176 z historyczną regresją FIX136',publisher.includes("scripts/run-tests-fix176.mjs") && !publisher.includes("scripts/run-tests-fix135.mjs"));
check('OneClick wymaga zasobów nowej akademii',publisher.includes("'academy-expanded-practice-fix136.js'") && publisher.includes("'practice-quiz-fix136.css'"));
check('Watcher uruchamia preflight FIX176 i pełny audyt FIX181 z historyczną regresją FIX136',watcher.includes("scripts/run-tests-fix176.mjs") && watcher.includes("scripts/run-tests-fix181.mjs") && watcher.includes("scripts/test-fix182-specialist-systems.mjs") && !watcher.includes("scripts/run-tests-fix135.mjs"));
check('Watcher pobiera aktywne runtime FIX136',watcher.includes('photo-catalog-fix115.js?v=6.8.0-fix136') && watcher.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136'));
check('Stare dane mapowania zdjęć i biblioteka nadal FIX135',JSON.parse(dataManifest).hotfix==='FIX129' && JSON.parse(dataManifest).version==='6.8.0-fix135-home-module-photo-coverage-20261113' && JSON.parse(homeLibrary).hotfix==='FIX135' && sw.includes('academy-photo-library-fix135'));
check('Brak migracji D1 i produkcyjna publikacja nie została wykonana',release.fix136_top_photo_priority_practice_lessons?.d1Migrations===false && release.fix136_top_photo_priority_practice_lessons?.dataMigrations===false && release.fix136_top_photo_priority_practice_lessons?.productionPublished===false);
check('Nie dodano modułu radia do akademii',!html.toLowerCase().includes('radio online') && !html.toLowerCase().includes('radio internetowe'));
const failed=assertions.filter(x=>!x.ok);
console.log(`\nFIX136 RELEASE INTEGRATION: ${assertions.length-failed.length}/${assertions.length} PASS`);
if(failed.length) process.exitCode=1;
