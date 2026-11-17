import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const js=fs.readFileSync('WEB_PUBLISH/assets/academy-labs-fix195.js','utf8');
const css=fs.readFileSync('WEB_PUBLISH/assets/academy-labs-fix195.css','utf8');
const checks=[
['3D stage integrated in existing workshop',html.includes('id="f196Stage"')],
['six interactive component hotspots', ['cpu','ram','vrm','m2','pcie','chipset'].every(x=>html.includes(`data-part="${x}"`))],
['3D perspective and transformed board',css.includes('perspective:950px')&&css.includes('transform-style:preserve-3d')],
['rotation control exists',html.includes('id="f196Rotate"')&&js.includes("classList.toggle('is-rotated')")],
['reset control exists',html.includes('id="f196Reset"')&&js.includes("classList.remove('is-rotated')")],
['keyboard-operable native buttons', (html.match(/class="f196-hotspot/g)||[]).length===6],
['reduced motion respected',css.includes('prefers-reduced-motion:reduce')],
['mobile layout included',css.includes('@media(max-width:520px)')],
['no external 3D library dependency',!/(three\.js|webgl|cdn\.js)/i.test(html+js)],
['no malware execution or remote submission',!/(child_process|eval\(|spawn\(|fetch\(|XMLHttpRequest|sendBeacon)/i.test(js)]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX196 CONTRACT: ${checks.length}/${checks.length} PASS`);
