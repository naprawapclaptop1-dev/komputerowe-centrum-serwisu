
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const html=fs.readFileSync(path.join(root,'WEB_PUBLISH/index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'WEB_PUBLISH/service-worker.js'),'utf8');
const js=fs.readFileSync(path.join(root,'WEB_PUBLISH/assets/academy-labs-fix195.js'),'utf8');
const css=fs.readFileSync(path.join(root,'WEB_PUBLISH/assets/academy-labs-fix195.css'),'utf8');
const cl=fs.readFileSync(path.join(root,'CHANGELOG_6.8.0_FIX195.txt'),'utf8');
const checks=[
['panel integrated in Academy',html.includes('id="fix195Labs"')],
['workshop parts present', ['cpu','ram','vrm','m2','pcie','chipset'].every(x=>js.includes(x))],
['security scenarios present', ['macro','startup','network','ransom'].every(x=>js.includes(x))],
['no sample execution APIs', !/child_process|exec\(|spawn\(|eval\(/i.test(js)],
['no remote image upload', !/fetch\(|XMLHttpRequest|sendBeacon/i.test(js)],
['accessible live result regions', (html.match(/aria-live="polite"/g)||[]).length>=2],
['assets loaded by HTML',html.includes('academy-labs-fix195.js')&&html.includes('academy-labs-fix195.css')],
['assets cached by service worker',sw.includes('academy-labs-fix195.js')&&sw.includes('academy-labs-fix195.css')],
['styles not empty',css.length>500],
['limitations documented',cl.includes('nie sandboxem malware')&&cl.includes('nie modelem 3D')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX195 CONTRACT: ${checks.length}/${checks.length} PASS`);
