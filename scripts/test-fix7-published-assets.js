'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const watcher=read('AUTO_PUBLISH_WATCHER.js'),html=read('WEB_PUBLISH/index.html'),sw=read('WEB_PUBLISH/service-worker.js'),release=JSON.parse(read('WEB_PUBLISH/release.json'));
const checks=[
 ['watcher downloads FIX50 photo engine',watcher.includes('/assets/lesson-art.js?v=6.8.0-fix51-visual-assets-reuse')],
 ['watcher accepts CORS-safe local-first policy',watcher.includes('perceptualHashBestEffort:true')&&watcher.includes('localFirst:true')&&watcher.includes('offlineFallback:true')],
 ['watcher requires public FIX50 manifest',watcher.includes('release-contract-fix50.json')&&watcher.includes('remoteFix50Valid')],
 ['HTML points to FIX50 photo engine',html.includes('lesson-art.js?v=6.8.0-fix51-visual-assets-reuse')],
 ['HTML loads FIX50 photo gallery runtime',html.includes('app.js?v=6.8.0-fix51-visual-academy')],
 ['PWA cache includes all local repair photo assets',sw.includes('/media/laptop-board-inspection.jpg')&&sw.includes('/media/motherboard-multimeter-test.jpg')],
 ['PWA cache has FIX50 namespace and support video',sw.includes('fix50-photo-reliability-20261105')&&sw.includes('/media/videos/akademia-dlaczego-warto-wspierac.mp4')]
];
for(const [name,ok] of checks){assert.ok(ok,`FAIL: ${name}`);console.log(`PASS: ${name}`)}
assert.equal(release.build,'6.8.0-fix51-visual-academy-pro-20261105');
console.log('PASS: publisher freshness guard FIX50 local-first photo engine and offline photo assets.');
