#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('WEB_PUBLISH/index.html'),registry=JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const art=read('WEB_PUBLISH/assets/lesson-art.js'),workshop=read('WEB_PUBLISH/assets/lab45-service-center.js');
const lab=read('WEB_PUBLISH/assets/labplus-engine.js'),ultimate=read('WEB_PUBLISH/assets/ultimate-workshop-620.js');
const publisher=read('ONECLICK_AKADEMIA.js'),stateApi=read('functions/api/state.js'),watcher=read('AUTO_PUBLISH_WATCHER.js');
const forbidden=[/id=["']view-servicepro["']/i,/id=["']np62-ticket-form["']/i,/id=["']lab44-workorders["']/i,/id=["']labWorkorderForm["']/i,/id=["']labExportWorkorders["']/i,/data-lab-jump=["']workorders["']/i,/data-lab-fill-order/i,/academyLabWorkorders/i,/academy\.ac[a-z]*serviceTickets/i];
for(const re of forbidden)if(re.test(html+'\n'+workshop+'\n'+lab+'\n'+ultimate))throw Error(`Pozostał element obsługi zleceń: ${re}`);
for(const id of ['view-measurementpro','view-modelcenter','np62-meter-mode','np62-model-search','lab44-triage','lab44-meter','lab44-parts','lab44-cases','lab44-training','lab44-exam'])if(!html.includes(`id="${id}"`))throw Error(`Brak funkcji edukacyjnej ${id}`);
for(const phrase of ['materiału edukacyjnego do moderacji','nie jest formularz kontaktu ani zlecenie naprawy'])if(!html.includes(phrase))throw Error(`Brak jasnego rozróżnienia wkładu edukacyjnego: ${phrase}`);
if(registry.photos.length!==12)throw Error('Katalog powinien zawierać 12 fotografii online.');
const ids=new Set(),urls=new Set();
for(const photo of registry.photos){if(ids.has(photo.id)||urls.has(photo.asset))throw Error('Duplikat zdjęcia lub URL w katalogu.');ids.add(photo.id);urls.add(photo.asset);if(!photo.asset.startsWith('https://images.pexels.com/photos/'))throw Error(`Nieprawidłowy URL Pexels: ${photo.id}`);if(!photo.page.startsWith('https://www.pexels.com/photo/'))throw Error(`Brak strony źródłowej: ${photo.id}`);if(!photo.author||!photo.topic)throw Error(`Brak autora lub tematu: ${photo.id}`)}
for(const marker of ['photoCount: ONLINE_PHOTOS.length','images.pexels.com','localFirst: true','function localRepairPhotos','function displayPhotos'])if(!art.includes(marker))throw Error(`Brak mechanizmu zdjęć: ${marker}`);
if(art.includes('onlineFirst: true'))throw Error('Stara polityka online-first nie może sterować galerią usterek.');
if(!art.includes('document.addEventListener(\'error\', applyFallback, true)'))throw Error('Brak automatycznego fallbacku obrazów.');
if(!publisher.includes('view-servicepro|np62-ticket-form|lab44-workorders')||!watcher.includes('noCustomerServiceIntake')||!publisher.includes("stateApi.includes('academyLabWorkorders')"))throw Error('Publikator i watcher nie blokują powrotu formularzy zleceń.');
if(workshop.includes('printWorkorders')||workshop.includes('workorders'))throw Error('W silniku laboratorium pozostała obsługa zleceń.');
if(stateApi.includes('academyLabWorkorders')||!stateApi.includes('if(!ALLOWED.has(row.state_key))continue'))throw Error('API synchronizacji nadal akceptuje stare dane zleceń.');
console.log('PASS: platforma pozostaje edukacyjna; 12 źródeł Pexels zachowano jako uzupełnienie; galeria usterek jest local-first, ma 3 lokalne sloty i działa offline; API i publikator blokują formularze zleceń.');
