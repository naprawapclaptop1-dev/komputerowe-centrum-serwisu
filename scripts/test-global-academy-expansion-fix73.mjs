import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const js=read('WEB_PUBLISH/assets/global-academy-expansion-fix73.js');
const css=read('WEB_PUBLISH/assets/global-academy-expansion-fix73.css');
const sw=read('WEB_PUBLISH/service-worker.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const manifest=JSON.parse(read('WEB_PUBLISH/assets/global-academy-expansion-manifest-fix73.json'));
const release=JSON.parse(read('FIX64_FIX73_RELEASE_MANIFEST.json'));
const check=(name,fn)=>{fn();console.log(`[PASS] ${name}`);};

check('FIX64–FIX73 loads inside existing Global Academy view after FIX60 base runtime',()=>{
  assert.match(html,/global-academy-suite-fix60\.js\?v=6\.8\.0-fix60/);
  assert.match(html,/global-academy-expansion-fix73\.js\?v=6\.8\.0-fix73/);
  assert.match(html,/global-academy-expansion-fix73\.css\?v=6\.8\.0-fix73/);
  assert.ok(html.indexOf('global-academy-suite-fix60.js')<html.indexOf('global-academy-expansion-fix73.js'));
  assert.match(html,/id="view-globalacademy"/);
});
check('manifest lists ten modules and the same product baseline',()=>{
  assert.equal(manifest.productVersion,'6.8.0');
  assert.equal(manifest.build,'6.8.0-fix73-global-academy-expansion-20261106');
  assert.equal(manifest.integration.additionalTabs,10);
  assert.equal(manifest.integration.addedTopLevelViews,0);
  assert.deepEqual(manifest.fixSeries,['FIX64','FIX65','FIX66','FIX67','FIX68','FIX69','FIX70','FIX71','FIX72','FIX73']);
  assert.equal(manifest.modules.length,10);
});
check('all ten functional module renderers and event handlers exist',()=>{
  for(const token of ['controlView','explorerView','aiView','deviceView','jobsView','trainingView','certView','mediaView','communityView','offlineView','runAudit','bindExplorer','bindAi','bindDevices','bindJobs','bindTraining','bindCert','bindCommunity','bindOffline','cachePack','backupExport','backupImport']) assert.ok(js.includes(token),`missing ${token}`);
  for(const id of ['control','explorer','ai','devices','jobs','training','cert','media','community','offline']) assert.ok(js.includes(`'${id}'`),`missing tab ${id}`);
});
check('AI calls only the existing same-origin endpoint with explicit POST',()=>{
  assert.match(js,/fetch\('\/api\/chat',\{method:'POST',credentials:'same-origin'/);
  assert.ok(!/fetch\('\/api\/chat',\{(?!method:'POST')/.test(js));
  assert.ok(!js.includes('OPENAI_API_KEY'));
  assert.ok(!js.includes('document.cookie'));
  assert.match(js,/name="consent" required/);
});
check('device notes, workshop cards, training, exam and community data remain local',()=>{
  for(const key of ['npaFix67DeviceNotesV1','npaFix68ServiceJobsV1','npaFix69LearningPathV1','npaFix70CertificatesV1','npaFix72LocalCommunityV1','npaFix73SyncMetaV1']) assert.ok(js.includes(key));
  assert.ok(!manifest.storage.automaticCustomerDataUpload);
  assert.ok(!manifest.storage.crossDeviceCloudSync);
  assert.equal(manifest.storage.newD1Migrations,false);
  assert.equal(manifest.storage.openAiSecretInClient,false);
});
check('risk and limitation disclosures exist for 2.5D, local certificates, local community and offline backup',()=>{
  for(const token of ['Model 2.5D','nie stanowi kwalifikacji zawodowej','Nie jest to forum publiczne','Automatyczna synchronizacja chmurowa między urządzeniami nie jest włączona','nie jest kompletną bazą producentów']) assert.ok(js.includes(token),`missing disclosure ${token}`);
  assert.ok(manifest.limitations.length>=6);
});
check('CSS includes responsive controls, explorer, service jobs, exams and module tabs',()=>{
  for(const token of ['.gax-tab','.gax-3d-scene','.gax-layer','.gax-device-grid','.gax-job-card','.gax-exam','.gax-video-list','.gax-offline-note','@media(max-width:520px)']) assert.ok(css.includes(token),`missing style ${token}`);
});
check('Service Worker precaches new runtime, styles and manifest; cache key is versioned',()=>{
  for(const token of ['global-academy-expansion-fix73.js','global-academy-expansion-fix73.css','global-academy-expansion-manifest-fix73.json','fix64-fix73-global-academy-expansion-20261106']) assert.ok(sw.includes(token),`missing SW token ${token}`);
});
check('publication watcher requires remote FIX64–FIX73 expansion assets',()=>{
  for(const token of ['global-academy-expansion-fix73.js','global-academy-expansion-fix73.css','global-academy-expansion-manifest-fix73.json','remoteGlobalAcademyExpansionValid','remoteGlobalExpansionManifest']) assert.ok(watcher.includes(token),`missing watcher contract ${token}`);
});
check('release metadata preserves 6.8.0 and makes no claim of production deployment',()=>{
  assert.equal(release.productVersion,'6.8.0');
  assert.equal(release.productionDeploymentPerformed,false);
  assert.equal(release.newD1Migrations,false);
  assert.equal(release.modules,10);
});
const files=['WEB_PUBLISH/assets/global-academy-expansion-fix73.js','WEB_PUBLISH/assets/global-academy-expansion-fix73.css','WEB_PUBLISH/assets/global-academy-expansion-manifest-fix73.json'];
check('all FIX64–FIX73 assets exist and are non-empty',()=>{for(const f of files){const st=fs.statSync(path.join(root,f));assert.ok(st.size>500,`${f} too small`);}});
console.log('GLOBAL ACADEMY EXPANSION FIX64–FIX73: 10/10 PASS');
