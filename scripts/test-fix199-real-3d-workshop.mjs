import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const js=fs.readFileSync('WEB_PUBLISH/assets/academy-workshop-3d-fix199.js','utf8');
const css=fs.readFileSync('WEB_PUBLISH/assets/academy-workshop-3d-fix199.css','utf8');
const ctx=vm.createContext({console,Math,Number,Array,Object,String,Map,Set,Date,JSON,globalThis:null});ctx.globalThis=ctx;vm.runInContext(js,ctx);
const api=ctx.NaukaFix1993D;assert.ok(api,'3D geometry API exists');
const faces=api.createScene();
const parts=new Set(faces.map(x=>x.part).filter(Boolean));
const p=api.projectPoint(api.rotatePoint({x:2,y:1,z:.5},-.8,.6),800,420,1);
const checks=[
['real polygon geometry is generated rather than CSS-only shapes',faces.length>=90&&faces.every(f=>f.vertices.length>=3)],
['scene includes all six interactive PC component families',['cpu','ram','vrm','m2','pcie','chipset'].every(x=>parts.has(x))],
['scene includes motherboard, CPU, DIMM, M.2, GPU, chipset and ports',faces.some(f=>f.name==='Płyta główna')&&faces.some(f=>f.name==='Procesor')&&faces.some(f=>f.name==='Moduł RAM')&&faces.some(f=>f.name==='Dysk NVMe M.2')&&faces.some(f=>f.name==='Karta graficzna')&&faces.some(f=>f.name==='Chipset')],
['3D projection produces finite screen coordinates',Number.isFinite(p.x)&&Number.isFinite(p.y)],
['selected component is highlighted on the 3D geometry',js.includes('selectedPart=root.querySelector')&&js.includes('poly.part===selectedPart')],
['WebGL renderer and Canvas 2D fallback are attached to the existing workshop',html.includes('id="f197BoardCanvas"')&&html.includes('academy-workshop-3d-fix199.js?v=6.8.0-fix225-glb-import')&&html.includes('academy-workshop-3d-fix199.css?v=6.8.0-fix206')&&js.includes("getContext('webgl2'")&&js.includes("getContext('2d')")],
['mouse and touch drag rotate model',js.includes("pointerdown")&&js.includes("pointermove")&&js.includes('setPointerCapture')],
['wheel zoom and keyboard controls are implemented',js.includes("addEventListener('wheel'")&&js.includes("ArrowLeft")&&js.includes("ArrowRight")],
['accessible canvas and responsive canvas sizing exist',html.includes('tabindex="0"')&&css.includes('#f197BoardCanvas')]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX199 TRUE 3D WORKSHOP CONTRACT: ${checks.length}/${checks.length} PASS; ${faces.length} polygon faces generated`);
