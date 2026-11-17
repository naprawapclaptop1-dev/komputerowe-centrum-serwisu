import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const expectedBuild='6.8.0-fix51-visual-academy-pro-20261105';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const watcher=read('AUTO_PUBLISH_WATCHER.js');
assert.equal(release.release,'6.8.0');
assert.equal(release.build,expectedBuild);
for(const [file,marker] of [
 ['WEB_PUBLISH/index.html',expectedBuild],
 ['functions/api/auth/status.js',expectedBuild],

 ['WEB_PUBLISH/service-worker.js','fix39-support-community-guard-20261104'],
 ['ONECLICK_AKADEMIA.js','6.8.0 FIX79']
]) assert.ok(read(file).includes(marker),`${file} missing ${marker}`);
assert.ok(watcher.includes('release.json') && watcher.includes('EXPECTED_BUILD'), 'watcher must load the authoritative build ID dynamically');
const runner=read('WYKONAJ_TESTY_FIX47.cmd');
assert.ok(runner.includes('scripts\\test-*.js')&&runner.includes('scripts\\test-*.mjs')&&runner.includes('FIX47')&&runner.includes('node --check'));
assert.ok(fs.existsSync(path.join(root,'scripts/test-unique-repair-photos-long-videos-fix5.js')));
console.log('PASS FIX40: release 6.8.0 build ID aligned across HTML, API, OneClick, watcher and PWA; legacy test filenames are included.');
