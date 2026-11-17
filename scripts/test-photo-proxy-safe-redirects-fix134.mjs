#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const helperText=fs.readFileSync(path.join(ROOT,'functions/_photo-proxy-fix131.js'),'utf8');
const helper=await import(`data:text/javascript;base64,${Buffer.from(helperText).toString('base64')}`);
const release=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/release.json'),'utf8'));
const photoLibrary=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/media/home-photo-library-fix118.json'),'utf8'));
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
let passed=0;
const check=async(name,fn)=>{await fn();passed++;console.log(`[PASS] ${name}`);};
const photoBytes=new Uint8Array([0xff,0xd8,0xff,0xd9,0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x60,0x61,0x62,0x63]);
await check('FIX134 follows an upstream 302 only after validating the HTTPS destination against the allowlist',async()=>{
 let calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  if(calls.length===1) return new Response(null,{status:302,headers:{location:'https://upload.wikimedia.org/wikipedia/commons/ram-image.jpg'}});
  return new Response(photoBytes,{status:200,headers:{'content-type':'image/jpeg','content-length':String(photoBytes.length)}});
 };
 const response=await helper.serveCuratedPhotoFix131({request:new Request('https://example.test/media/photos/ram-modules.jpg'),id:'ram-modules.jpg',fetchImpl,cacheApi:null});
 assert.equal(response.status,200);
 assert.equal(response.headers.get('x-photo-delivery'),'FIX131-SAME-ORIGIN');
 assert.equal(response.headers.get('x-photo-proxy-fix'),'FIX134-SAFE-REDIRECTS');
 assert.equal(response.headers.get('x-photo-source-host'),'thumb.wikimedia.org');
 assert.equal(response.headers.get('x-photo-final-host'),'upload.wikimedia.org');
 assert.equal(response.headers.get('x-photo-redirect-count'),'1');
 assert.equal(calls.length,2);
 assert.equal(calls[0].options.redirect,'manual');
 assert.equal(helperText.includes("redirect: 'error'"),false);
 assert.ok(helperText.includes('MAX_SAFE_REDIRECTS = 4'));
 assert.equal((await response.arrayBuffer()).byteLength,photoBytes.length);
});
await check('FIX134 refuses redirects to non-allowlisted hosts before making a second network request',async()=>{
 let calls=0;
 const response=await helper.serveCuratedPhotoFix131({request:new Request('https://example.test/media/photos/ram-modules.jpg'),id:'ram-modules',cacheApi:null,fetchImpl:async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://evil.example/payload.jpg'}});}});
 assert.equal(response.status,502);
 assert.equal(response.headers.get('x-photo-delivery'),'FIX134-REDIRECT-BLOCKED');
 assert.equal(response.headers.get('x-photo-proxy-fix'),'FIX134-SAFE-REDIRECTS');
 assert.match(response.headers.get('x-photo-error'),/non-allowlisted/);
 assert.equal(calls,1);
});
await check('FIX134 refuses non-HTTPS redirects and redirect targets containing credentials',async()=>{
 for(const location of ['http://upload.wikimedia.org/file.jpg','https://user:pass@upload.wikimedia.org/file.jpg']){
  const response=await helper.serveCuratedPhotoFix131({request:new Request('https://example.test/media/photos/ram-modules.jpg'),id:'ram-modules',cacheApi:null,fetchImpl:async()=>new Response(null,{status:302,headers:{location}})});
  assert.equal(response.status,502);
  assert.equal(response.headers.get('x-photo-delivery'),'FIX134-REDIRECT-BLOCKED');
 }
});
await check('FIX134 stops redirect loops and caps redirect chains at four hops',async()=>{
 let loopCalls=0;
 const loop=await helper.serveCuratedPhotoFix131({request:new Request('https://example.test/media/photos/ram-modules.jpg'),id:'ram-modules',cacheApi:null,fetchImpl:async(url)=>{loopCalls++;return new Response(null,{status:302,headers:{location:'https://thumb.wikimedia.org/repeat.jpg'}});}});
 assert.equal(loop.status,502);
 assert.equal(loop.headers.get('x-photo-delivery'),'FIX134-REDIRECT-LOOP');
 assert.equal(loopCalls,2);
 let chainCalls=0;
 const chain=await helper.serveCuratedPhotoFix131({request:new Request('https://example.test/media/photos/ram-modules.jpg'),id:'ram-modules',cacheApi:null,fetchImpl:async(url)=>{chainCalls++;return new Response(null,{status:302,headers:{location:`https://thumb.wikimedia.org/step-${chainCalls}.jpg`}});}});
 assert.equal(chain.status,502);
 assert.equal(chain.headers.get('x-photo-delivery'),'FIX134-REDIRECT-LIMIT');
 assert.equal(chainCalls,5);
});
await check('FIX134 exposes actionable upstream HTTP/type diagnostics without caching an error',async()=>{
 const denied=await helper.serveCuratedPhotoFix131({request:new Request('https://example.test/media/photos/multimeter-bench.jpg'),id:'multimeter-bench',cacheApi:null,fetchImpl:async()=>new Response('blocked',{status:403,headers:{'content-type':'text/plain'}})});
 assert.equal(denied.status,502);
 assert.equal(denied.headers.get('x-photo-delivery'),'FIX134-UPSTREAM-ERROR');
 assert.equal(denied.headers.get('x-photo-upstream-status'),'403');
 assert.equal(denied.headers.get('x-photo-proxy-fix'),'FIX134-SAFE-REDIRECTS');
 const html=await helper.serveCuratedPhotoFix131({request:new Request('https://example.test/media/photos/multimeter-bench.jpg'),id:'multimeter-bench',cacheApi:null,fetchImpl:async()=>new Response('<html>blocked</html>',{status:200,headers:{'content-type':'text/html'}})});
 assert.equal(html.status,502);
 assert.equal(html.headers.get('x-photo-delivery'),'FIX134-NON-IMAGE');
 assert.equal(html.headers.get('x-photo-upstream-type'),'text/html');
});
await check('FIX134 release metadata, PWA cache and publisher all require the safe redirect implementation',()=>{
 assert.equal(release.latestHotfix,'FIX135');
 assert.equal(release.fix134_photo_proxy_safe_redirects.hotfix,'FIX134');
 assert.equal(release.fix134_photo_proxy_safe_redirects.build,'6.8.0-fix134-photo-proxy-safe-redirects-20261113');
 assert.equal(release.fix134_photo_proxy_safe_redirects.maxRedirects,4);
 const cacheName=read('WEB_PUBLISH/service-worker.js').match(/const CACHE_NAME = '([^']+)'/)?.[1];
 assert.ok(cacheName);
 assert.equal(photoLibrary.serviceWorkerCacheName,cacheName);
 assert.equal(photoLibrary.hotfix,'FIX135');
 assert.ok(read('ONECLICK_AKADEMIA.js').includes("redirect: 'manual'"));
 assert.ok(read('ONECLICK_AKADEMIA.js').includes('MAX_SAFE_REDIRECTS = 4'));
 assert.ok(read('AUTO_PUBLISH_WATCHER.js').includes("redirect: 'manual'"));
 assert.ok(read('AUTO_PUBLISH_WATCHER.js').includes('sitewidePolicyValid=${remoteSitewidePolicyValid}'));
 assert.ok(read('AUTO_PUBLISH_WATCHER.js').includes("remoteHomepageManifest?.hotfix === 'FIX135'"));
 assert.ok(!read('AUTO_PUBLISH_WATCHER.js').includes("remoteHomepageManifest?.hotfix === 'FIX129'"));
 assert.ok(read('AUTO_PUBLISH_WATCHER.js').includes('photoProxyDiagnostics='));
 assert.ok(read('WEB_PUBLISH/service-worker.js').includes('nauka-6.8.0-fix135-home-module-photo-coverage-20261113'));
});
console.log(`FIX134 SAFE PHOTO PROXY REDIRECTS: ${passed}/${passed} PASS`);
