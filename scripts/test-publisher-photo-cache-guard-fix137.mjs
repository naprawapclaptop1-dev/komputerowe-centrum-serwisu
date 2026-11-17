#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {evaluateHomepagePhotoCacheContract}=require('./photo-cache-contract-fix137.cjs');
const html=fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/index.html'),'utf8');
const serviceWorkerSource=fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/service-worker.js'),'utf8');
const release=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/release.json'),'utf8'));
const photoLibrary=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/media/home-photo-library-fix118.json'),'utf8'));
const forbiddenTokens=['sitewide-tech-visuals-fix123.js?v=6.8.0-fix123','homepage-tech-only-fix122.js?v=6.8.0-fix122'];
const base={html,serviceWorkerSource,release,photoLibrary,forbiddenTokens};
let checks=0;
function check(name,fn){fn();checks++;console.log(`[PASS] ${name}`);}
check('Aktualny cache aplikacji FIX176 jest akceptowany na podstawie latestHotfixBuild, a photo cache FIX135 pozostaje zachowany',()=>{
  const result=evaluateHomepagePhotoCacheContract(base);
  assert.equal(result.ok,true,result.errors.join(' | '));
  assert.equal(result.activeCoreCache,release.serviceWorkerCacheName);
  assert.ok(result.activeCoreCache.includes('fix176-global-academy-rescue-and-master-launch'));
  assert.equal(release.latestHotfix, 'FIX176');
  const sw = fs.readFileSync(path.join(ROOT,'WEB_PUBLISH','service-worker.js'),'utf8');
  assert.ok(sw.includes('academy-master-extension-fix149.js') && sw.includes('academy-master-extension-fix149.css'));
  assert.equal(result.activePhotoCache,photoLibrary.cacheName);
});
check('Stary cache aplikacji FIX135 jest odrzucany zamiast dawać fałszywy PASS',()=>{
  const stale=serviceWorkerSource.replace(/const CACHE_NAME = '[^']+';/, "const CACHE_NAME = 'nauka-6.8.0-fix135-home-module-photo-coverage-20261113';");
  const result=evaluateHomepagePhotoCacheContract({...base,serviceWorkerSource:stale});
  assert.equal(result.ok,false);
  assert.ok(result.errors.some(x=>x.includes('CACHE_NAME Service Workera')));
});
check('Nieprawidłowy PHOTO_CACHE_NAME jest odrzucany',()=>{
  const broken=serviceWorkerSource.replace("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135';", "const PHOTO_CACHE_NAME = 'academy-photo-library-wrong';");
  const result=evaluateHomepagePhotoCacheContract({...base,serviceWorkerSource:broken});
  assert.equal(result.ok,false);
  assert.ok(result.errors.some(x=>x.includes('PHOTO_CACHE_NAME')));
});
check('Rozbieżne metadane cache aplikacji są odrzucane',()=>{
  const brokenRelease={...release,homepagePhotoFirstRenderFix:{...release.homepagePhotoFirstRenderFix,serviceWorkerCacheName:'stary-cache'}};
  const result=evaluateHomepagePhotoCacheContract({...base,release:brokenRelease});
  assert.equal(result.ok,false);
  assert.ok(result.errors.some(x=>x.includes('homepagePhotoFirstRenderFix.serviceWorkerCacheName')));
});
check('Wyłączony skrypt blokujący zdjęcia nadal zatrzymuje publikację',()=>{
  const result=evaluateHomepagePhotoCacheContract({...base,html:html+'\n<script src="sitewide-tech-visuals-fix123.js?v=6.8.0-fix123"></script>'});
  assert.equal(result.ok,false);
  assert.ok(result.errors.some(x=>x.includes('skrypt blokujący zdjęcia')));
});
check('OneClick korzysta z tego samego helpera kontraktu i nie oczekuje cache FIX135 dla aplikacji',()=>{
  const publisher=fs.readFileSync(path.join(ROOT,'ONECLICK_AKADEMIA.js'),'utf8');
  assert.ok(publisher.includes("require('./scripts/photo-cache-contract-fix137.cjs')"));
  assert.ok(publisher.includes('evaluateHomepagePhotoCacheContract({'));
  assert.ok(!publisher.includes("!serviceWorkerVisualSource.includes('nauka-6.8.0-fix135-home-module-photo-coverage-20261113')"));
});
console.log(`FIX137 PUBLISHER PHOTO-CACHE CONTRACT: ${checks}/${checks} PASS`);
