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
assert.ok(runner.includes('scripts\\test-*.js')&&runner.includes('scripts\\test-*.mjs'));
assert.ok(runner.includes('FIX47') && runner.includes('node --check'), 'current runner must check syntax and every historical test');
assert.ok(fs.existsSync(path.join(root,'scripts/test-unique-repair-photos-long-videos-fix5.js')));
assert.ok(read('WYKONAJ_TESTY_FIX91.cmd').includes('scripts\\run-tests-fix91.mjs'), 'FIX91 must launch its complete independent photo-paginated regression runner.');
assert.ok(read('WYKONAJ_TESTY_FIX92.cmd').includes('scripts\\run-tests-fix92.mjs'), 'FIX92 must launch its complete independent photo-persistence regression runner.');
assert.ok(read('WYKONAJ_TESTY_FIX93.cmd','WYKONAJ_TESTY_FIX94.cmd').includes('scripts\\run-tests-fix93.mjs'), 'FIX93 must launch its complete independent photo-rendering regression runner.');
console.log('PASS FIX40: release 6.8.0 build ID aligned across HTML, API, OneClick, watcher and PWA; historical test names remain compatible.');

assert.ok(fs.existsSync(path.join(root,'scripts/test-support-community-guard-fix39.mjs')));
const fix51Runner=read('WYKONAJ_TESTY_FIX51.cmd');
assert.ok(fix51Runner.includes('scripts\\test-*.js') && fix51Runner.includes('scripts\\test-*.mjs') && fix51Runner.includes('test-visual-academy-fix51.mjs'), 'FIX51 runner must test the active Visual Academy release instead of forwarding to an older runner.');
assert.ok(fs.existsSync(path.join(root,'scripts/support-community-guard-fix39.js')));
const independentFullRunners = new Set(['WYKONAJ_TESTY_FIX73.cmd','WYKONAJ_TESTY_FIX74.cmd','WYKONAJ_TESTY_FIX75.cmd','WYKONAJ_TESTY_FIX76.cmd','WYKONAJ_TESTY_FIX77.cmd','WYKONAJ_TESTY_FIX78.cmd','WYKONAJ_TESTY_FIX79.cmd','WYKONAJ_TESTY_FIX80.cmd','WYKONAJ_TESTY_FIX81.cmd','WYKONAJ_TESTY_FIX82.cmd','WYKONAJ_TESTY_FIX83.cmd','WYKONAJ_TESTY_FIX84.cmd','WYKONAJ_TESTY_FIX85.cmd','WYKONAJ_TESTY_FIX86.cmd','WYKONAJ_TESTY_FIX87.cmd','WYKONAJ_TESTY_FIX88.cmd','WYKONAJ_TESTY_FIX89.cmd','WYKONAJ_TESTY_FIX90.cmd','WYKONAJ_TESTY_FIX91.cmd','WYKONAJ_TESTY_FIX92.cmd','WYKONAJ_TESTY_FIX93.cmd','WYKONAJ_TESTY_FIX94.cmd']);
for (const name of fs.readdirSync(root).filter(name => /^WYKONAJ_TESTY.*\.cmd$/i.test(name) && name !== 'WYKONAJ_TESTY_FIX47.cmd' && name !== 'WYKONAJ_TESTY_FIX51.cmd' && name !== 'WYKONAJ_TESTY_FIX52.cmd' && !independentFullRunners.has(name))) assert.ok(read(name).includes('WYKONAJ_TESTY_FIX47.cmd'), `${name} must forward to FIX46`);
const fix52Runner=read('WYKONAJ_TESTY_FIX52.cmd');
assert.ok(fix52Runner.includes('WYKONAJ_TESTY_FIX51.cmd'), 'FIX52 hotfix runner must call the current FIX51 regression runner');
for (const name of fs.readdirSync(root).filter(name => /^CHECK_KONTA_FIX\d+\.cmd$/i.test(name) && name !== 'CHECK_KONTA_FIX47.cmd')) assert.ok(read(name).includes('CHECK_KONTA_FIX47.cmd'), `${name} must forward to FIX46`);
