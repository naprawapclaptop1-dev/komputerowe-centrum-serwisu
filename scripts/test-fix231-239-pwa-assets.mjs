import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {verifyHtmlAssetsInServiceWorker}=require('./fix230-pwa-asset-guard.cjs');
const webRoot=path.resolve('WEB_PUBLISH');
const html=fs.readFileSync(path.join(webRoot,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(webRoot,'service-worker.js'),'utf8');
const assets=['assets/platform-enhancements-fix231-239.css','assets/platform-enhancements-fix231-239.js'];
const result=verifyHtmlAssetsInServiceWorker({html,serviceWorker:sw,webRoot,assets});
assert.equal(result.ok,true,result.errors.join('; '));
for(const asset of assets){assert.ok(result.references[asset]?.html,'HTML must reference asset');assert.ok(result.references[asset]?.serviceWorker,'Service Worker must reference asset');assert.match(result.references[asset].html,/\?v=6\.8\.0-fix239$/);assert.equal(result.references[asset].html,result.references[asset].serviceWorker.replace(/^\//,''));}
const broken=sw.replace('platform-enhancements-fix231-239.js?v=6.8.0-fix239','platform-enhancements-fix231-239.js?v=6.8.0-old');
assert.equal(verifyHtmlAssetsInServiceWorker({html,serviceWorker:broken,webRoot,assets}).ok,false);
console.log('[PASS] zasoby FIX239 są identyczne i wersjonowane w HTML/PWA');
console.log('[PASS] rozbieżna wersja Service Worker jest blokowana');
console.log('FIX231–FIX239 PWA ASSET PARITY: 2/2 PASS');
