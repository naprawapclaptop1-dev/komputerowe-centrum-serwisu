#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const pass = label => console.log(`[PASS] ${label}`);
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const runtimePath = 'WEB_PUBLISH/assets/academy-practical-lab-fix186.js';
const runtime = read(runtimePath);
const css = read('WEB_PUBLISH/assets/academy-practical-lab-fix186.css');
const collector = read('tools/FIX186_COLLECTOR.ps1');
const launcher = read('WYKONAJ_LABORATORIUM_FIX186.cmd');
const chatApi = read('functions/api/chat.js');
const pcbApi = read('functions/api/academy/fix186/pcb-analysis.js');
const oneClick = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');

// Executable logic tests: evaluate the same runtime file shipped to the browser.
const browserWindow = {};
const context = vm.createContext({ window: browserWindow, console, Date, JSON, Math, String, Number, Object, Array, RegExp, Error, Uint8Array });
vm.runInContext(runtime, context, { filename: runtimePath, timeout: 5000 });
const api = browserWindow.ACADEMY_FIX186_TOOLS;
assert.ok(api, 'runtime exports public testable helpers');

const csv = api.parseCsv('Provider Name,Event ID,Level,Event Message\r\n"Microsoft-Windows-WHEA-Logger",17,Warning,"Corrected PCIe error, slot 2"\r\n"Microsoft-Windows-StorPort",129,Error,"Reset to device, path 0"');
assert.equal(csv.length,2);
assert.equal(csv[0]['Event Message'],'Corrected PCIe error, slot 2');
pass('CSV parser zachowuje pola cytowane i przecinki');

const xml = api.parseXml('<?xml version="1.0"?><Events><Event><System><Provider Name="Microsoft-Windows-WHEA-Logger"/><EventID>17</EventID><Level>3</Level><TimeCreated SystemTime="2026-11-16T12:00:00Z"/></System><EventData><Data Name="ErrorSource">PCI Express</Data></EventData></Event></Events>');
assert.equal(xml.length,1);
assert.equal(xml[0].provider,'Microsoft-Windows-WHEA-Logger');
assert.equal(xml[0].id,'17');
pass('Parser XML tracerpt odczytuje dostawcę, Event ID i dane zdarzenia');

const jsonRows = api.parseJsonRows([{Provider:'stornvme',EventID:11,Level:'Error',Message:'Reset to device'}]);
const textRows = api.parseTextRows('2026-11-16 12:01:00 Provider: Disk | Event ID: 7 | Błąd odczytu');
assert.equal(jsonRows.length,1);
assert.equal(textRows[0].id,'7');
pass('Parsery JSON oraz TXT rozpoznają rekordy i identyfikatory zdarzeń');

const importedCsv = api.normalizeImportedFile('system.csv','Provider,EventID,Level,Message\nstornvme,11,Error,Reset to device');
const report = api.analyzeEvents(importedCsv);
assert.equal(report.total,1);
assert.equal(report.categories.Storage,1);
assert.equal(report.severities['Błąd/krytyczny'],1);
const whea = api.classifyEvent({provider:'Microsoft-Windows-WHEA-Logger',id:'17',level:'Warning',message:'PCI Express Root Port corrected hardware error'});
assert.equal(whea.category,'PCIe/WHEA');
assert.equal(whea.severity,'Ostrzeżenie');
pass('Analiza klasyfikuje przykładowe zdarzenia WHEA/PCIe i Storage');

assert.throws(()=>api.normalizeImportedFile('trace.etl','binary'),/binarnym śladem/);
assert.throws(()=>api.normalizeImportedFile('system.evtx','binary'),/bezpośredni parser EVTX/i);
pass('Surowe ETL/EVTX są jawnie kierowane do konwertera Windows — nie udają importu przeglądarkowego');

const goodCase = api.safeGeneratedCase(JSON.stringify({title:'Laptop restartuje się podczas zapisu',category:'Storage PC',symptom:'Laptop traci dostęp do NVMe',evidence:['WHEA','StorPort'],questions:['Co sprawdzić?'],solution:['Zabezpiecz dane'],caution:'Nie wykonuj destrukcyjnego testu'}));
assert.equal(goodCase.title,'Laptop restartuje się podczas zapisu');
assert.equal(goodCase.scope,'komputery stacjonarne i laptopy');
assert.throws(()=>api.safeGeneratedCase(JSON.stringify({title:'Naprawa telefonu',symptom:'Telefon nie startuje'})),/wykracza poza zakres/);
pass('Generator AI normalizuje schemat i odrzuca przypadki spoza PC/laptopów');

const brokenStorage={getItem(){return '{broken';},setItem(){}};
assert.equal(api.readState(brokenStorage).version,1);
const usable={v:null,getItem(){return this.v;},setItem(k,v){this.v=v;}};
const state=api.readState(usable); state.examHistory.push({percent:100});
assert.equal(api.saveState(usable,state),true);
assert.equal(api.readState(usable).examHistory.length,1);
pass('Odczyt uszkodzonego localStorage odzyskuje pusty stan, a osobny klucz zapisuje postęp FIX186');

// Static deployment/integration assertions.
assert.match(html,/id="a186PracticalLab"/);
assert.match(html,/id="a186PcbAiConsent"/);
assert.match(html,/id="a186PcbAiAnalyze"/);
assert.match(runtime,/fetch\('\/api\/academy\/fix186\/pcb-analysis'/);
assert.match(runtime,/consent:true/);
assert.match(html,/data-a168-tab="perfdiag"/);
assert.match(html,/data-a168-panel="perfdiag"/);
assert.match(html,/academy-practical-lab-fix186\.js\?v=6\.8\.0-fix186/);
assert.match(html,/academy-practical-lab-fix186\.css\?v=6\.8\.0-fix186/);
assert.equal((html.match(/data-a168-tab="[a-z]+"/g)||[]).length,20);
assert.equal((html.match(/id="view-[^"]+"/g)||[]).length,35);
assert.ok(sw.includes('academy-practical-lab-fix186.js?v=6.8.0-fix186'));
assert.ok(sw.includes('academy-practical-lab-fix186.css?v=6.8.0-fix186'));
pass('Panel osadzony w istniejącej zakładce; 20 zakładek głównych i 35 widoków zachowane; CSS/JS w PWA');

const meta=release.academyPracticalLabFix186;
assert.equal(meta.hotfix,'FIX186');
assert.equal(meta.productVersion,'6.8.0');
assert.equal(meta.newMainTabs,0);
assert.equal(meta.newViews,0);
assert.equal(meta.newD1Database,false);
assert.equal(meta.newD1Tables,false);
assert.equal(meta.d1SchemaMigrations,false);
assert.equal(meta.rawLogsUploadedToServer,false);
assert.equal(meta.rawLogsStoredInLocalStorage,false);
assert.equal(meta.pcbAiEndpoint,'/api/academy/fix186/pcb-analysis');
assert.equal(meta.pcbAiRequiresExplicitConsent,true);
assert.equal(meta.pcbImagesStored,false);
assert.equal(meta.pcbAutomaticElectricalDiagnosis,false);
assert.equal(meta.firmwareWrite,false);
assert.equal(meta.diskWrite,false);
assert.equal(meta.uefiCapsulePayloadSignatureVerifiedByGenericTool,false);
assert.equal(release.latestHotfix,'FIX176');
assert.equal(release.latestHotfixBuild,'6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
assert.match(html,/<meta name="academy-hotfix" content="FIX176"/);
assert.doesNotMatch(html,/<meta name="academy-hotfix" content="FIX186"/);
pass('Metadane funkcji FIX186 są osobne; bazowe metadane FIX176 pozostają zgodne w publisherze, watcherze i PWA');

assert.ok(runtime.includes("fetch('/api/chat'"));
assert.ok(!runtime.includes('GEMINI_API_KEY'));
assert.ok(chatApi.includes('function isComputerRepairScope'));
assert.ok(chatApi.includes('sameOrigin(request)'));
assert.ok(chatApi.includes('GEMINI_API_KEY'));
pass('Generator Gemini korzysta wyłącznie z istniejącego same-origin API; sekret pozostaje po stronie serwera');

for (const token of ['wpr.exe','tracerpt.exe','stordiag.exe','Get-WinEvent','Get-FileHash','Get-AuthenticodeSignature','signtool.exe','-collectEtw']) assert.ok(collector.includes(token),`collector includes ${token}`);
assert.ok(collector.includes('ConvertTo-Json -InputObject @($records)'));
assert.ok(!/^\s*(?:checkFSConsistency|Repair-Volume|Repair-WindowsImage|flashrom|afuefi|FPTW64|Write-VolumeCache)\b/im.test(collector));
assert.ok(launcher.includes('tools\\FIX186_COLLECTOR.ps1'));
pass('Kolektor PowerShell zawiera zbieranie WPR/StorDiag/EventLog i kontrolę podpisów; nie zawiera poleceń naprawczych ani flashowania');

assert.ok(runtime.includes('automaticElectricalDiagnosis:false'));
assert.ok(runtime.includes('ai-pcb-visual-inspection'));
assert.ok(runtime.includes('manual-pcb-image-annotation') || runtime.includes('pcb-image-visual-review'));
assert.ok(pcbApi.includes('IMAGE_CONSENT_REQUIRED'));
assert.ok(pcbApi.includes('imageStored: false'));
assert.ok(pcbApi.includes('sameOrigin(request)'));
assert.ok(pcbApi.includes('Gemini'));
assert.ok(runtime.includes('a186PcbAiConsent'));
assert.ok(runtime.includes('uefiPayloadSignature'));
assert.ok(runtime.includes('nauka-od-a-do-z-fix186-practical-lab-v1'));
pass('Analiza wizualna PCB AI wymaga osobnej zgody, obraz nie jest zapisywany; ograniczenia podpisu UEFI i osobny zapis postępów są jawne');

assert.ok(fs.existsSync(path.join(root,'functions/api/academy/fix186/pcb-analysis.js')));
assert.ok(fs.existsSync(path.join(root,'scripts/test-fix186-pcb-analysis-api.mjs')));
assert.ok(fs.existsSync(path.join(root,'tools/FIX186_COLLECTOR.ps1')));
assert.ok(fs.existsSync(path.join(root,'WYKONAJ_LABORATORIUM_FIX186.cmd')));
assert.ok(fs.existsSync(path.join(root,'scripts/run-tests-fix186.mjs')));
assert.ok(fs.existsSync(path.join(root,'scripts/test-fix186-practical-lab.mjs')));
assert.ok(fs.existsSync(path.join(root,'WYKONAJ_TESTY_FIX186.cmd')));
pass('Komplet plików pomocniczych, launchera i runnera testów jest obecny');

assert.ok(oneClick.includes('FIX186: laboratorium importu WPR/EVTX'));
assert.ok(oneClick.includes('scripts/run-tests-fix186.mjs'));
assert.ok(watcher.includes('remotePracticalLabMetaValid'));
assert.ok(watcher.includes('remotePracticalLabAssetsValid'));
assert.ok(watcher.includes('/api/academy/fix186/pcb-analysis?verify='));
assert.ok(watcher.includes('remotePcbAiEndpointValid'));
assert.ok(oneClick.includes('fix186PcbApiValid'));
assert.ok(runtime.includes('a186PcbAiConsent') && runtime.includes('if(!consent)'));
assert.ok(watcher.includes('scripts/run-tests-fix186.mjs'));
assert.ok(oneClick.includes('academyPracticalLabFix186'));
assert.ok(watcher.includes('academyPracticalLabFix186'));
pass('OneClick i watcher blokują publikację, gdy brakuje panelu FIX186, metadanych funkcji, testów lub zdalnych assetów; baza FIX176 pozostaje zgodna');

console.log('\nFIX186 PRACTICAL LAB TESTS: 13/13 PASS');
