#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(ROOT,'scripts/test-sitewide-tech-visuals-fix123.mjs'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/assets/sitewide-tech-visuals-fix123.json'),'utf8'));
const checks=[];
function check(name,fn){fn();checks.push(name);console.log(`[PASS] ${name}`);}
check('globalny test grafik korzysta z node:crypto, a nie z sha256sum',()=>{
  assert.ok(source.includes("import { createHash } from 'node:crypto'"));
  assert.ok(source.includes("createHash('sha256')"));
  assert.ok(!source.includes("spawnSync('sha256sum'"));
});
check('manifest ma dokładnie 30 zasobów lokalnych do kontroli',()=>assert.equal(manifest.visualAssets.length,30));
check('wszystkie sumy SHA-256 30 zasobów są zgodne na każdym systemie z Node.js',()=>{
  for(const item of manifest.visualAssets){
    const file=path.join(ROOT,'WEB_PUBLISH',item.path);
    assert.ok(fs.existsSync(file),`Brak pliku: ${item.path}`);
    const digest=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    assert.equal(digest,item.sha256,`Niezgodny SHA-256: ${item.path}`);
  }
});
check('publikator i Watcher uruchamiają wspólny preflight FIX165 zawierający testy regresyjne runtime',()=>{
  const suite175=fs.readFileSync(path.join(ROOT,'scripts/run-tests-fix175.mjs'),'utf8');
  const suite176=fs.readFileSync(path.join(ROOT,'scripts/run-tests-fix176.mjs'),'utf8');
  const suite167=fs.readFileSync(path.join(ROOT,'scripts/run-tests-fix167.mjs'),'utf8');
  const suite165=fs.readFileSync(path.join(ROOT,'scripts/run-tests-fix165.mjs'),'utf8');
  const suite164=fs.readFileSync(path.join(ROOT,'scripts/run-tests-fix164.mjs'),'utf8');
  const suite163=fs.readFileSync(path.join(ROOT,'scripts/run-tests-fix163.mjs'),'utf8');
  const legacySuite=fs.readFileSync(path.join(ROOT,'scripts/run-tests-fix162.mjs'),'utf8');
  assert.ok(suite176.includes('scripts/run-tests-fix167.mjs'),'FIX176 nie uruchamia regresji Gemini CMD-only FIX167');
  assert.ok(suite176.includes('scripts/test-fix175-professional-academy.mjs'),'FIX176 nie uruchamia testów ośmiu laboratoriów FIX168–FIX175');
  assert.ok(suite176.includes('scripts/test-fix176-global-academy-fallback.mjs'),'FIX176 nie uruchamia testów naprawy pustego widoku Centrum Wiedzy');
  assert.ok(suite175.includes('scripts/test-fix175-professional-academy.mjs'),'FIX175 nie uruchamia testów nowej Akademii Mistrza');
  assert.ok(suite167.includes('scripts/run-tests-fix165.mjs'),'FIX167 nie uruchamia wcześniejszej regresji FIX165');
  assert.ok(suite165.includes('scripts/run-tests-fix164.mjs'),'FIX165 nie uruchamia testów CMD FIX164');
  assert.ok(suite164.includes('scripts/run-tests-fix163.mjs'),'FIX164 nie uruchamia bazowej regresji FIX163');
  assert.ok(suite163.includes('scripts/run-tests-fix162.mjs'),'FIX163 nie uruchamia regresji FIX162');
  assert.ok(legacySuite.includes('scripts/run-tests-fix136.mjs'),'regresja FIX162 nie uruchamia pełnego pakietu runtime FIX136');
  for(const file of ['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js']){
    const text=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.ok(text.includes('scripts/run-tests-fix176.mjs'),`${file} nie uruchamia wspólnego preflight FIX176`);
  }
});
console.log(`FIX127 PORTABLE SHA-256 / FIX176 PREFLIGHT: ${checks.length}/${checks.length} PASS`);
