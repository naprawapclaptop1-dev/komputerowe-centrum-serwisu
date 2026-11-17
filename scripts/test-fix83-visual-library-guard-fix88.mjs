import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const require=createRequire(import.meta.url);
const {verifyFix83VisualLibrary}=require('./fix83-visual-library-guard-fix88.cjs');
const html=read('WEB_PUBLISH/index.html');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fix88-visual-guard-'));
const tempWeb=path.join(temp,'WEB_PUBLISH');
fs.mkdirSync(path.join(tempWeb,'assets'),{recursive:true});
fs.copyFileSync(path.join(ROOT,'WEB_PUBLISH/assets/visual-uniqueness-fix83.js'),path.join(tempWeb,'assets/visual-uniqueness-fix83.js'));
fs.copyFileSync(path.join(ROOT,'WEB_PUBLISH/assets/visual-uniqueness-manifest-fix83.json'),path.join(tempWeb,'assets/visual-uniqueness-manifest-fix83.json'));
const checks=[];
function check(name,fn){fn();checks.push(name);console.log(`[PASS] ${name}`);}
try {
  check('FIX88 — OneClick akceptuje podłączony FIX83 runtime z cache-tag FIX87 zadeklarowanym w release.json',()=>{
    const result=verifyFix83VisualLibrary({webDir:path.join(ROOT,'WEB_PUBLISH'),indexHtml:html,releaseJson:release});
    assert.equal(result.runtimeBuildTag,'6.8.0-fix87');
    assert.equal(result.galleryIllustrationCount,54);
  });
  check('FIX88 — walidator sprawdza kolejność runtime → lesson-art → app',()=>{
    assert.throws(()=>verifyFix83VisualLibrary({webDir:path.join(ROOT,'WEB_PUBLISH'),indexHtml:html.replace('assets/visual-uniqueness-fix83.js?v=6.8.0-fix87','assets/visual-uniqueness-fix83.js?v=6.8.0-fix87-disabled'),releaseJson:release}),/biblioteka nie jest podłączona/);
    const reversed=html.replace(/(<script src="assets\/visual-uniqueness-fix83\.js[^>]*><\/script>)/,'').replace('</body>','<script src="assets/visual-uniqueness-fix83.js?v=6.8.0-fix87"></script>\n</body>');
    assert.throws(()=>verifyFix83VisualLibrary({webDir:path.join(ROOT,'WEB_PUBLISH'),indexHtml:reversed,releaseJson:release}),/biblioteka nie jest podłączona/);
  });
  check('FIX88 — brak biblioteki lub manifestu zatrzymuje walidację',()=>{
    const missing=path.join(temp,'missing');fs.mkdirSync(missing,{recursive:true});
    assert.throws(()=>verifyFix83VisualLibrary({webDir:missing,indexHtml:html,releaseJson:release}),/brakuje pliku runtime lub manifestu/);
  });
  check('FIX88 — odrzucony jest błędny visualRuntimeBuildTag',()=>{
    assert.throws(()=>verifyFix83VisualLibrary({webDir:path.join(ROOT,'WEB_PUBLISH'),indexHtml:html,releaseJson:{...release,visualRuntimeBuildTag:'6.8.0-fix83;main'}}),/niepoprawny visualRuntimeBuildTag/);
  });
  check('FIX88 — manifest rozdziela kategorie VRAM/RAM i zakazuje obrazów DIMM dla VRAM',()=>{
    const manifestPath=path.join(tempWeb,'assets/visual-uniqueness-manifest-fix83.json');
    const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    manifest.vramRule='VRAM is a DIMM module';
    fs.writeFileSync(manifestPath,JSON.stringify(manifest));
    assert.throws(()=>verifyFix83VisualLibrary({webDir:tempWeb,indexHtml:html,releaseJson:release}),/runtime=false|manifest=false/);
  });
  check('FIX88 — runtime bez grafiki GDDR/BGA nie przechodzi kontroli',()=>{
    const runtimePath=path.join(tempWeb,'assets/visual-uniqueness-fix83.js');
    fs.copyFileSync(path.join(ROOT,'WEB_PUBLISH/assets/visual-uniqueness-fix83.js'),runtimePath);
    fs.writeFileSync(runtimePath,fs.readFileSync(runtimePath,'utf8').replaceAll('GDDR / BGA MEMORY','GRAPHICS MEMORY'));
    const manifestPath=path.join(tempWeb,'assets/visual-uniqueness-manifest-fix83.json');
    fs.copyFileSync(path.join(ROOT,'WEB_PUBLISH/assets/visual-uniqueness-manifest-fix83.json'),manifestPath);
    assert.throws(()=>verifyFix83VisualLibrary({webDir:tempWeb,indexHtml:html,releaseJson:release}),/runtime=false/);
  });
  check('FIX88 — OneClick i Auto-Watcher używają wspólnego walidatora',()=>{
    assert.ok(one.includes("require('./scripts/fix83-visual-library-guard-fix88.cjs')"));
    assert.ok(watcher.includes("require('./scripts/fix83-visual-library-guard-fix88.cjs')"));
    assert.ok(one.includes('verifyFix83VisualLibrary({ webDir: WEB, indexHtml, releaseJson })'));
    assert.ok(watcher.includes('verifyFix83VisualLibrary({ webDir: WEB, indexHtml: html, releaseJson: localRelease })'));
    assert.doesNotMatch(one,/visual-uniqueness-fix83\.js\?v=6\.8\.0-fix83/);
    assert.doesNotMatch(watcher,/visual-uniqueness-fix83\.js\?v=6\.8\.0-fix83/);
  });
  check('FIX88 — release.json i HTML deklarują bieżący FIX88 bez zmiany wersji produktu',()=>{
    assert.equal(release.release,'6.8.0');
    assert.match(release.latestHotfix,/^FIX\d+$/);
    assert.ok(release.latestHotfixBuild.startsWith('6.8.0-fix128-'));
    assert.ok(release.photoCatalogRuntimeBuildTag.startsWith('6.8.0-fix118-'));
    assert.equal(release.visualRuntimeBuildTag,'6.8.0-fix87');
    assert.ok(html.includes(`<meta name="academy-hotfix" content="${release.latestHotfix}">`));
  });
  console.log(`FIX83 VISUAL LIBRARY GUARD FIX88: ${checks.length}/${checks.length} PASS`);
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
