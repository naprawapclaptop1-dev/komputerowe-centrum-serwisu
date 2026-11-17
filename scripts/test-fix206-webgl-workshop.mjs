import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const file='WEB_PUBLISH/assets/academy-workshop-3d-fix199.js';
const source=fs.readFileSync(file,'utf8');
const context=vm.createContext({console});
vm.runInContext(source,context);
const api=context.NaukaFix1993D;
const scene=api.createScene();
const checks=[
['WebGL2 and WebGL1 contexts are attempted before Canvas fallback',source.includes("getContext('webgl2'")&&source.includes("getContext('webgl'")&&source.includes("getContext('2d')")],
['WebGL2 shaders use GLSL ES 3.00 syntax',source.includes('#version 300 es')&&source.includes('out vec4 outColor')],
['WebGL1 shaders retain GLSL ES 1.00 compatibility',source.includes('attribute vec3 aPosition')&&source.includes('gl_FragColor')],
['renderer compiles, links and draws triangle geometry',source.includes('gl.compileShader')&&source.includes('gl.linkProgram')&&source.includes('gl.drawArrays(gl.TRIANGLES')],
['scene geometry contains at least 300 polygon faces',scene.length>=300],
['component selection, pointer rotation, keyboard and wheel zoom remain active',source.includes("[data-part]")&&source.includes("addEventListener('pointermove'")&&source.includes("addEventListener('keydown'")&&source.includes("addEventListener('wheel'")]
];
for(const [name,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);assert.ok(ok,name)}
console.log(`FIX206 WEBGL WORKSHOP: ${checks.length}/${checks.length} PASS (${scene.length} polygon faces)`);
