#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(ROOT,relative),'utf8');
const checks=[];
function check(name,fn){fn();checks.push(name);console.log(`[PASS] ${name}`);}

check('FIX164: ukryte wprowadzanie korzysta z Read-Host -AsSecureString w tym samym terminalu',()=>{
  const ps=read('scripts/configure-gemini-secret.ps1');
  assert.match(ps,/Read-Host\s+-Prompt[\s\S]*-AsSecureString/);
  assert.ok(ps.includes('Wklej klucz Gemini'));
  assert.ok(ps.includes('https://aistudio.google.com/api-keys'));
  assert.ok(ps.includes('Start-Process $KeyUrl'));
});
check('FIX164: wklejony sekret jest przekazywany do Node tylko przez przekierowane stdin',()=>{
  const ps=read('scripts/configure-gemini-secret.ps1');
  assert.ok(ps.includes('RedirectStandardInput = $true'));
  assert.ok(ps.includes('$Child.StandardInput.WriteLine($PlainValue)'));
  assert.ok(ps.includes('$Child.StandardInput.Close()'));
  assert.ok(ps.includes('--stdin-secret'));
  assert.ok(!/Arguments\s*=.*PlainValue/.test(ps));
  assert.ok(!/Set-Content|Out-File|WriteAllText|WriteAllBytes/.test(ps));
});
check('FIX164: nie ma trybu raw, który przechwytuje i psuje wklejanie Ctrl+V',()=>{
  assert.ok(!read('scripts/configure-gemini-secret.js').includes('setRawMode'));
  assert.ok(!read('scripts/configure-gemini-secret.js').includes('input.on(\'data\''));
});
check('FIX164: START_FIX105 wywołuje bezpieczny wrapper PowerShell w tym samym oknie CMD',()=>{
  const launcher=read('URUCHOM_AKADEMIE.cmd');
  assert.ok(launcher.includes('configure-gemini-secret.ps1'));
  assert.ok(launcher.includes('powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass'));
  assert.ok(launcher.indexOf('RESOLVE_NODE_FIX105.cmd')<launcher.indexOf('configure-gemini-secret.ps1'));
  assert.ok(launcher.indexOf('configure-gemini-secret.ps1')<launcher.indexOf('\"%NODE_EXE%\" \"%ROOT%\\ONECLICK_AKADEMIA.js\"'));
});
check('FIX164: ręczna zmiana klucza używa tego samego ukrytego pola CMD',()=>{
  const cmd=read('USTAW_KLUCZ_GEMINI.cmd');
  assert.ok(cmd.includes('configure-gemini-secret.ps1'));
  assert.ok(cmd.includes('-Force'));
  assert.ok(!cmd.includes('configure-gemini-secret.js" --force'));
});
check('FIX164: sekret nie trafia do argumentów procesu, zmiennych środowiskowych ani logów',()=>{
  const ps=read('scripts/configure-gemini-secret.ps1');
  const js=read('scripts/configure-gemini-secret.js');
  assert.ok(!ps.includes('$env:GEMINI_API_KEY'));
  assert.ok(!ps.includes('Write-Host $PlainValue'));
  assert.ok(!ps.includes('Set-Clipboard'));
  assert.ok(js.includes("['pages', 'secret', 'bulk'"));
  assert.ok(js.includes('payload.fill(0)'));
  assert.ok(js.includes('redact(output, secretToRedact)'));
});
check('FIX164: Cloudflare secret presence is checked before prompting and existing key is not requested again',()=>{
  const ps=read('scripts/configure-gemini-secret.ps1');
  const js=read('scripts/configure-gemini-secret.js');
  assert.ok(ps.indexOf('--check-only')<ps.indexOf('Read-Host -Prompt'));
  assert.ok(js.includes("if (checkOnly)"));
  assert.ok(js.includes('Sekret GEMINI_API_KEY istnieje'));
});
check('FIX164: OneClick i Watcher blokują paczkę bez nowego konfiguratora CMD',()=>{
  assert.ok(read('ONECLICK_AKADEMIA.js').includes("'scripts','configure-gemini-secret.ps1'"));
  assert.ok(read('AUTO_PUBLISH_WATCHER.js').includes("'scripts','configure-gemini-secret.ps1'"));
});
console.log(`\nGEMINI CMD PASTE FIX164: ${checks.length}/${checks.length} PASS`);
