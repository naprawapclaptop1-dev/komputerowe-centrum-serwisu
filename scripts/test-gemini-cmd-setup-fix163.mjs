#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const setup=require('./configure-gemini-secret.js');
const checks=[];
async function check(label,fn){await fn();checks.push(label);console.log(`[PASS] ${label}`);}

await check('Walidator przyjmuje klucz Gemini i odrzuca pusty, krótki lub zawierający białe znaki',()=>{
  assert.equal(setup.isValidGeminiKey('AIzaSyB-0123456789abcdefghijklmno'),true);
  assert.equal(setup.isValidGeminiKey('short'),false);
  assert.equal(setup.isValidGeminiKey('AIzaSyB-0123456789 abcdefghijklmno'),false);
  assert.equal(setup.isValidGeminiKey(''),false);
});
await check('Test klucza używa oficjalnego metadanych modelu API, nagłówka x-goog-api-key i nie ujawnia wartości',async()=>{
  const key='AIzaSyB-0123456789abcdefghijklmno';let seen;
  await setup.verifyGeminiKey(key,async(url,options)=>{
    seen={url,options};
    return new Response(JSON.stringify({name:'models/gemini-3.8-flash',displayName:'Gemini 3.8 Flash'}),{status:200,headers:{'content-type':'application/json'}});
  });
  assert.equal(seen.url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash');
  assert.equal(seen.options.method,'GET');
  assert.equal(seen.options.headers['x-goog-api-key'],key);
  assert.equal(seen.options.headers.accept,'application/json');
  assert.equal(seen.options.body,undefined);
  assert.ok(!JSON.stringify(seen).includes('OPENAI_API_KEY'));
  await assert.rejects(()=>setup.verifyGeminiKey('bad',async()=>{throw new Error('must not fetch')}),/GEMINI_KEY_FORMAT_INVALID/);
});
await check('Sekret jest rozpoznawany wyłącznie po nazwie GEMINI_API_KEY',()=>{
  assert.equal(setup.hasGeminiSecret('[{"name":"GEMINI_API_KEY"}]'),true);
  assert.equal(setup.hasGeminiSecret('[{"name":"OPENAI_API_KEY"}]'),false);
  assert.equal(setup.hasGeminiSecret(''),false);
});
await check('Konfigurator nie zawiera formularza przeglądarkowego i ukrywa znakowanie klucza w CMD',()=>{
  const source=fs.readFileSync(path.join(ROOT,'scripts/configure-gemini-secret.js'),'utf8');
  assert.ok(!source.includes('setRawMode(true)'), 'Nie wolno używać trybu raw, który blokował wklejanie Ctrl+V.');
  const secureWrapper=fs.readFileSync(path.join(ROOT,'scripts/configure-gemini-secret.ps1'),'utf8');
  assert.ok(secureWrapper.includes('Read-Host -Prompt'));
  assert.ok(secureWrapper.includes('-AsSecureString'));
  assert.ok(secureWrapper.includes('RedirectStandardInput = $true'));
  assert.ok(secureWrapper.includes('--stdin-secret'));
  const launcher=fs.readFileSync(path.join(ROOT,'URUCHOM_AKADEMIE.cmd'),'utf8');
  assert.ok(launcher.includes('configure-gemini-secret.ps1'));
  assert.ok(launcher.includes('powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass'));
  const setKey=fs.readFileSync(path.join(ROOT,'USTAW_KLUCZ_GEMINI.cmd'),'utf8');
  assert.ok(setKey.includes('configure-gemini-secret.ps1'));
  assert.ok(secureWrapper.includes('Wklej klucz Gemini'));
  assert.ok(secureWrapper.includes('https://aistudio.google.com/api-keys'));
  assert.ok(source.includes("['pages', 'secret', 'bulk'"));
  assert.ok(!source.includes("require('node:http')"));
  assert.ok(!source.includes('createServer('));
  assert.ok(!source.includes('OPENAI_API_KEY'));
});
await check('Pierwsza konfiguracja przyjmuje klucz tylko z CMD i zapisuje go jako sekret bez pliku tymczasowego',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'akademia-gemini-cli-'));
  try{
    const scripts=path.join(temp,'scripts');const wranglerDir=path.join(temp,'TOOLS_CLOUDFLARE','node_modules','wrangler','bin');
    fs.mkdirSync(scripts,{recursive:true});fs.mkdirSync(wranglerDir,{recursive:true});
    fs.copyFileSync(path.join(ROOT,'scripts/configure-gemini-secret.js'),path.join(scripts,'configure-gemini-secret.js'));
    const state=path.join(temp,'fake-secrets-state.json');
    const fake=`'use strict';const fs=require('node:fs');const args=process.argv.slice(2);const state=process.env.FAKE_WRANGLER_STATE;if(args[0]==='whoami'){process.stdout.write('Account ID: 4ddfc3803a4f0c4457ccae083f18b975\\n');process.exit(0);}if(args[0]==='pages'&&args[1]==='secret'&&args[2]==='list'){process.stdout.write(fs.existsSync(state)?fs.readFileSync(state,'utf8'):'[]');process.exit(0);}if(args[0]==='pages'&&args[1]==='secret'&&args[2]==='bulk'){const raw=fs.readFileSync(0,'utf8');const parsed=JSON.parse(raw);if(!parsed.GEMINI_API_KEY)process.exit(9);fs.writeFileSync(state,JSON.stringify([{name:'GEMINI_API_KEY'}]));process.stdout.write('Success: 1 secret uploaded\\n');process.exit(0);}process.stderr.write('unsupported fake command');process.exit(2);`;
    fs.writeFileSync(path.join(wranglerDir,'wrangler.js'),fake);
    const key='AIzaSyB-0123456789abcdefghijklmno';
    const env={...process.env,FAKE_WRANGLER_STATE:state,AKADEMIA_GEMINI_SETUP_SKIP_VERIFY:'1',AKADEMIA_GEMINI_SETUP_NO_BROWSER:'1'};
    const first=spawnSync(process.execPath,[path.join(scripts,'configure-gemini-secret.js'),'--stdin-secret'],{cwd:temp,input:key+'\n',encoding:'utf8',timeout:30000,env});
    assert.equal(first.status,0,first.stderr||first.stdout);
    assert.ok(!first.stdout.includes(key));
    assert.ok(first.stdout.includes('GEMINI_API_KEY zapisany'));
    assert.ok(!first.stdout.includes(key));assert.ok(!first.stderr.includes(key));
    assert.equal(fs.readFileSync(state,'utf8'),'[{"name":"GEMINI_API_KEY"}]');
    assert.deepEqual(fs.readdirSync(temp).filter(x=>/key|secret|\.env/i.test(x)),['fake-secrets-state.json']);
    const second=spawnSync(process.execPath,[path.join(scripts,'configure-gemini-secret.js')],{cwd:temp,input:'',encoding:'utf8',timeout:30000,env});
    assert.equal(second.status,0,second.stderr||second.stdout);
    assert.ok(second.stdout.includes('Nie pytam ponownie'));
    assert.ok(!second.stdout.includes('Wklej klucz Gemini (wprowadzanie ukryte):'));
    const replacement='AIzaSyB-9876543210zyxwvutsrqponml';
    const rotate=spawnSync(process.execPath,[path.join(scripts,'configure-gemini-secret.js'),'--stdin-secret','--force'],{cwd:temp,input:replacement+'\n',encoding:'utf8',timeout:30000,env});
    assert.equal(rotate.status,0,rotate.stderr||rotate.stdout);
    assert.ok(!rotate.stdout.includes(replacement));
    assert.ok(rotate.stdout.includes('BEZPIECZNA KONFIGURACJA GEMINI'), rotate.stdout);
    assert.ok(!rotate.stdout.includes(replacement));assert.ok(!rotate.stderr.includes(replacement));
    assert.ok(rotate.stdout.includes('GEMINI_API_KEY zapisany'));
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
console.log(`\nGEMINI CMD KEY SETUP FIX165: ${checks.length}/${checks.length} PASS`);
