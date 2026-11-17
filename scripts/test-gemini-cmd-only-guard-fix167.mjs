#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const html=read('WEB_PUBLISH/index.html');
const cmd=read('USTAW_KLUCZ_GEMINI.cmd');
const ps=read('scripts/configure-gemini-secret.ps1');
const js=read('scripts/configure-gemini-secret.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const meta=release.academyGeminiCmdOnlyGuardFix167;
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}
check('FIX167: CMD uruchamia konfigurator PowerShell, nie formularz WWW',()=>{
  assert.ok(cmd.includes('configure-gemini-secret.ps1'));
  assert.ok(cmd.includes('powershell.exe'));
  assert.ok(!/name=["']GEMINI_API_KEY["']/i.test(html));
  assert.ok(!/id=["']geminiApiKey["']/i.test(html));
});
check('FIX167: klucz jest wprowadzany przez ukryte Read-Host -AsSecureString',()=>{
  assert.ok(ps.includes('Read-Host -Prompt'));
  assert.ok(ps.includes('-AsSecureString'));
});
check('FIX167: sekret idzie z PowerShell do Node wyłącznie przez stdin',()=>{
  assert.ok(ps.includes('--stdin-secret'));
  assert.ok(ps.includes('RedirectStandardInput = $true'));
  assert.ok(ps.includes('StandardInput.WriteLine($PlainValue)'));
  assert.ok(js.includes('readSecretFromStdin'));
  assert.ok(js.includes("'pages', 'secret', 'bulk'"));
});
check('FIX167: OneClick waliduje rzeczywiste pliki CMD/PowerShell, a nie treść index.html',()=>{
  assert.ok(one.includes('geminiSetupCmd.includes'));
  assert.ok(one.includes('geminiSetupPs.includes'));
  assert.ok(one.includes("geminiCmdOnlyMeta.hotfix !== 'FIX167'"));
  assert.ok(!one.includes("indexHtml.includes('Wklej klucz')"));
  assert.ok(!one.includes("indexHtml.includes('wyłącznie w oknie CMD')"));
});
check('FIX167: Watcher ma identyczną kontrolę konfiguratora CMD-only',()=>{
  for(const token of ['geminiSetupCmd.includes','geminiSetupPs.includes','cmdOnlyGuard?.hotfix!==\'FIX167\'','cmdOnlyGuard?.websiteKeyInput!==false']) assert.ok(watcher.includes(token),`Watcher missing ${token}`);
});
check('FIX167: publiczna strona nie potrzebuje klucza Gemini ani formularza klucza',()=>{
  assert.equal(meta.websiteKeyInput,false);
  assert.equal(meta.keyFileStorage,false);
  assert.ok(!/name=["']GEMINI_API_KEY["']/i.test(html));
  assert.ok(!/id=["']geminiApiKey["']/i.test(html));
});
check('FIX167: zachowuje Gemini/sekret, cache PWA, istniejący D1 i wersję produktu',()=>{
  assert.equal(release.release,'6.8.0');
  assert.equal(release.latestHotfix,'FIX176');
  assert.equal(meta.hotfix,'FIX167');
  assert.equal(meta.publisherOnly,true);
  assert.equal(meta.existingSecretPreserved,true);
  assert.equal(meta.serviceWorkerCacheChanged,false);
  assert.equal(meta.newD1Database,false);
  assert.equal(meta.newD1Tables,false);
  assert.equal(meta.d1SchemaMigrations,false);
});
console.log(`\nGEMINI CMD-ONLY PUBLISHER GUARD FIX167: ${checks.length}/${checks.length} PASS`);
