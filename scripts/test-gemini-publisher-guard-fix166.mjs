#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file)=>fs.readFileSync(path.join(ROOT,file),'utf8');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const chat=read('functions/api/chat.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const meta=release.academyGeminiPublisherGuardFix166;
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}
const keyAccess=/\benv\s*(?:\?\.|\.)\s*GEMINI_API_KEY\b/;
check('Rzeczywisty backend env?.GEMINI_API_KEY jest rozpoznawany przez kontrakt FIX166',()=>assert.match(chat,keyAccess));
check('OneClick akceptuje optional chaining przy odczycie GEMINI_API_KEY',()=>{assert.match(one,/const chatApiReadsGeminiKey\s*=\s*\/.*GEMINI_API_KEY/);assert.match(one,keyAccess);assert.ok(one.includes('FIX166: czat musi używać Gemini Interactions API v1'));});
check('Watcher stosuje identyczny test dostępu do sekretu Gemini',()=>{assert.match(watcher,/const chatApiReadsGeminiKey\s*=\s*\/.*GEMINI_API_KEY/);assert.match(watcher,keyAccess);assert.ok(watcher.includes("publisherGuardMeta?.hotfix!=='FIX166'"));});
check('Kontrole Gemini bez fallbacku i ograniczenie tematyczne nadal są wymagane',()=>{for(const source of [one,watcher]){assert.ok(source.includes('generativelanguage.googleapis.com/v1/interactions'));assert.ok(source.includes('topicRestricted'));assert.ok(source.includes('api.openai.com/v1/responses'));assert.ok(source.includes('env.AI.run'));}});
check('FIX166 jest historyczną poprawką publikatora; aktywny runtime FIX176 zachowuje historyczne metadane FIX165 i istniejącą D1',()=>{assert.equal(release.latestHotfix,'FIX176');assert.equal(release.release,'6.8.0');assert.equal(meta.hotfix,'FIX166');assert.equal(meta.publisherOnly,true);assert.equal(meta.websiteRuntimeHotfix,'FIX165');assert.equal(meta.serviceWorkerCacheChanged,false);assert.equal(meta.newD1Database,false);assert.equal(meta.newD1Tables,false);assert.equal(meta.d1SchemaMigrations,false);});
console.log(`\nGEMINI OPTIONAL-CHAIN PUBLISHER GUARD FIX166: ${checks.length}/${checks.length} PASS`);
