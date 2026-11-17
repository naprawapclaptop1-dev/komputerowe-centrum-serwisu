#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),web=path.join(root,'WEB_PUBLISH');
const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
const pwa=JSON.parse(fs.readFileSync(path.join(web,'manifest.webmanifest'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(web,'release.json'),'utf8'));
const publisher=fs.readFileSync(path.join(root,'ONECLICK_AKADEMIA.js'),'utf8');
const watcher=fs.readFileSync(path.join(root,'AUTO_PUBLISH_WATCHER.js'),'utf8');
const sw=fs.readFileSync(path.join(web,'service-worker.js'),'utf8');
if(!html.includes('<title>NAUKA OD A DO Z — DLA WSZYSTKICH')) throw Error('Brak nowego tytułu strony');
if(!html.includes('az-pathways')||!html.includes('Wybierz swoją')) throw Error('Brak sekcji ścieżek nauki');
for(const v of ['courses','components','knowledge','tools','repairs','media']) if(!html.includes(`data-nav="${v}"`)) throw Error(`Brak ścieżki ${v}`);
if(pwa.name!=='NAUKA OD A DO Z — DLA WSZYSTKICH'||pwa.short_name!=='Nauka od A do Z') throw Error('Manifest PWA ma starą nazwę');
if(release.release!=='6.8.0'||!release.build.startsWith('6.8.0-')) throw Error('Naruszono kontrakt publikacji 6.4.0 FIX15');
if(!publisher.includes('NAUKA OD A DO Z — DLA WSZYSTKICH')||!watcher.includes('newPlatformBrand')) throw Error('Publikator/watcher nie sprawdza nowej marki');
if(!fs.existsSync(path.join(web,'assets','nauka-od-a-do-z.css'))||!sw.includes('nauka-od-a-do-z.css')) throw Error('Brak nowego stylu lub cache PWA');
console.log('PASS: nazwa, 6 ścieżek nauki, PWA, release guard, watcher i cache');
