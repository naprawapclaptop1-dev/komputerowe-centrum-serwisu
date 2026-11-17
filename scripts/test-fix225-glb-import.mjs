import assert from 'node:assert/strict';
import '../WEB_PUBLISH/assets/academy-workshop-3d-fix199.js';
const api=globalThis.NaukaFix1993D;
assert.ok(api&&typeof api.loadGlbArrayBuffer==='function','GLB parser exposed');
function makeGlb({external=false,badIndex=false,cycle=false}={}){
  const binary=new ArrayBuffer(42),view=new DataView(binary);
  const coords=[0,0,0, 1,0,0, 0,1,0];coords.forEach((v,i)=>view.setFloat32(i*4,v,true));
  (badIndex?[0,1,9]:[0,1,2]).forEach((v,i)=>view.setUint16(36+i*2,v,true));
  const doc={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,...(cycle?{children:[0]}:{})}],meshes:[{name:'TestTriangle',primitives:[{attributes:{POSITION:0},indices:1}]}],buffers:[{byteLength:42,...(external?{uri:'https://example.invalid/mesh.bin'}:{})}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:6}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3'},{bufferView:1,componentType:5123,count:3,type:'SCALAR'}]};
  const enc=new TextEncoder();const json=enc.encode(JSON.stringify(doc));const jsonLength=(json.length+3)&~3;const binLength=(binary.byteLength+3)&~3;const total=12+8+jsonLength+8+binLength;const out=new ArrayBuffer(total),v=new DataView(out);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,total,true);v.setUint32(12,jsonLength,true);v.setUint32(16,0x4e4f534a,true);new Uint8Array(out,20,json.length).set(json);new Uint8Array(out,20+json.length,jsonLength-json.length).fill(0x20);const binStart=20+jsonLength;v.setUint32(binStart,binary.byteLength,true);v.setUint32(binStart+4,0x004e4942,true);new Uint8Array(out,binStart+8,binary.byteLength).set(new Uint8Array(binary));return out;
}
const loaded=api.loadGlbArrayBuffer(makeGlb());
assert.equal(loaded.triangles,1);assert.equal(loaded.vertices,3);assert.equal(loaded.externalNetworkAccess,false);assert.equal(loaded.faces[0].vertices.length,3);
assert.throws(()=>api.loadGlbArrayBuffer(makeGlb({external:true})),/zewnętrznych plików/);
assert.throws(()=>api.loadGlbArrayBuffer(makeGlb({badIndex:true})),/Indeks wierzchołka/);
assert.throws(()=>api.loadGlbArrayBuffer(makeGlb({cycle:true})),/cykl lub zbyt głęboką hierarchię/);
assert.throws(()=>api.loadGlbArrayBuffer(new ArrayBuffer(10)),/20 bajtów/);
assert.throws(()=>api.loadGlbArrayBuffer(new Uint8Array(24).buffer),/nagłówek GLB/);
console.log('FIX225 GLB IMPORT: 8/8 PASS');
