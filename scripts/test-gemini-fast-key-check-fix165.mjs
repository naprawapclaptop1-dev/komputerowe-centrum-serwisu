#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const setup=require('./configure-gemini-secret.js');
const key='AIzaSyB-0123456789abcdefghijklmno';
const checks=[];
async function check(label,fn){await fn();checks.push(label);console.log(`[PASS] ${label}`);}

await check('FIX165 weryfikuje klucz przez GET metadanych modelu, bez uruchamiania generowania',async()=>{
  let request;
  const ok=await setup.verifyGeminiKey(key,async(url,options)=>{
    request={url,options};
    return new Response(JSON.stringify({name:'models/gemini-3.8-flash',displayName:'Gemini 3.8 Flash'}),{status:200});
  });
  assert.equal(ok,true);
  assert.equal(request.url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash');
  assert.equal(request.options.method,'GET');
  assert.equal(request.options.body,undefined);
  assert.equal(request.options.headers['x-goog-api-key'],key);
  assert.equal(request.options.headers.accept,'application/json');
  assert.ok(request.options.signal);
});
await check('FIX165 odrzuca odpowiedź z inną nazwą modelu',async()=>{
  await assert.rejects(()=>setup.verifyGeminiKey(key,async()=>new Response(JSON.stringify({name:'models/inny-model'}),{status:200})),/GEMINI_VERIFY_BAD_RESPONSE/);
});
await check('FIX165 rozpoznaje odrzucenie klucza przez Google bez zapisywania sekretu',async()=>{
  await assert.rejects(()=>setup.verifyGeminiKey(key,async()=>new Response(JSON.stringify({error:{message:'invalid key'}}),{status:403})),/GEMINI_VERIFY_HTTP_403/);
});
await check('FIX165 rozpoznaje timeout połączenia i nie uznaje go za błędny format klucza',async()=>{
  await assert.rejects(()=>setup.verifyGeminiKey(key,async()=>{const error=new Error('timeout');error.name='TimeoutError';throw error;}),/GEMINI_VERIFY_TIMEOUT/);
});
await check('FIX165 rozpoznaje błąd DNS osobno od błędu autoryzacji',async()=>{
  await assert.rejects(()=>setup.verifyGeminiKey(key,async()=>{const error=new Error('dns');error.code='ENOTFOUND';throw error;}),/GEMINI_VERIFY_DNS/);
});
await check('FIX165 czat używa stabilnego Interactions API v1 bez niestandardowego Api-Revision',async()=>{
  const fs=await import('node:fs');
  const source=fs.readFileSync(path.join(ROOT,'functions/api/chat.js'),'utf8');
  assert.ok(source.includes("https://generativelanguage.googleapis.com/v1/interactions"));
  assert.ok(source.includes("'stream': true") || source.includes('stream: true'));
  assert.ok(source.includes('store: false'));
  assert.ok(!source.includes('Api-Revision'));
  assert.ok(!source.includes('api.openai.com/v1/responses'));
  assert.ok(!source.includes('env.AI.run'));
});
console.log(`\nGEMINI FAST KEY CHECK FIX165: ${checks.length}/${checks.length} PASS`);
