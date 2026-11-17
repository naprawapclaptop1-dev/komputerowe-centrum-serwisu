/* FIX199 — geometryczny model 3D płyty głównej, renderer canvas 3D bez zewnętrznej biblioteki. */
(() => {
  'use strict';
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rotatePoint = (p, rx, ry) => {
    const cy=Math.cos(ry), sy=Math.sin(ry), cx=Math.cos(rx), sx=Math.sin(rx);
    const x=p.x*cy+p.z*sy, z1=-p.x*sy+p.z*cy;
    return {x, y:p.y*cx-z1*sx, z:p.y*sx+z1*cx};
  };
  const projectPoint = (p, width, height, zoom=1) => {
    const camera=22, focal=Math.min(width,height)*1.16*zoom;
    const factor=focal/(camera-p.z);
    return {x:width/2+p.x*factor, y:height/2+p.y*factor, depth:p.z};
  };
  function boxMesh(name, center, size, color, part='') {
    const [w,h,d]=size.map(v=>v/2), c=center;
    const v=[[-w,-h,-d],[w,-h,-d],[w,h,-d],[-w,h,-d],[-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d]].map(([x,y,z])=>({x:x+c.x,y:y+c.y,z:z+c.z}));
    const f=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[4,0,3,7]];
    return f.map((face,i)=>({name,part,color,vertices:face.map(idx=>v[idx]),shade:[.52,.95,.62,.78,.56,.7][i]}));
  }
  function cylinderMesh(name, center, radius, depth, color, part='') {
    const faces=[], sides=10, z0=center.z-depth/2, z1=center.z+depth/2;
    const ring=(z)=>Array.from({length:sides},(_,i)=>({x:center.x+Math.cos(i*2*Math.PI/sides)*radius,y:center.y+Math.sin(i*2*Math.PI/sides)*radius,z}));
    const a=ring(z0), b=ring(z1);
    for(let i=0;i<sides;i++){const n=(i+1)%sides;faces.push({name,part,color,vertices:[a[i],a[n],b[n],b[i]],shade:.62});}
    faces.push({name,part,color,vertices:b,shade:1});
    return faces;
  }
  function createScene() {
    const out=[];
    const add=(name,c,s,color,part='')=>out.push(...boxMesh(name,c,s,color,part));
    add('Płyta główna',{x:0,y:0,z:0},[12,8,.36],'#145d51');
    // Socket and processor.
    add('Ramka socketu CPU',{x:-1.8,y:-.2,z:.28},[2.55,2.55,.24],'#8795a4','cpu');
    add('Gniazdo CPU',{x:-1.8,y:-.2,z:.45},[2.15,2.15,.22],'#37495a','cpu');
    add('Procesor',{x:-1.8,y:-.2,z:.68},[1.6,1.6,.22],'#c4d0d8','cpu');
    add('Rozpraszacz CPU',{x:-1.8,y:-.2,z:.81},[1.35,1.35,.08],'#6f8593','cpu');
    // Four RAM slots and modules.
    for(let i=0;i<4;i++){const x=3.25+i*.62;add('Slot DIMM',{x,y:.1,z:.3},[.34,3.25,.22],'#c9a84d','ram');if(i===0||i===2){add('Moduł RAM',{x,y:.05,z:.72},[.26,2.8,.64],i===0?'#1a5b9d':'#245f88','ram');add('Kości pamięci',{x,y:.12,z:1.08},[.2,1.9,.08],'#b9d0df','ram');}}
    // VRM heatsink, chokes and capacitors.
    add('Radiator VRM',{x:-4.65,y:-1.75,z:.6},[1.5,3,.72],'#637789','vrm');
    for(let i=0;i<5;i++)add('Dławik VRM',{x:-3.6,y:-2.6+i*.72,z:.47},[.65,.48,.42],'#a5b2bd','vrm');
    for(let i=0;i<8;i++)out.push(...cylinderMesh('Kondensator VRM',{x:-4.45+(i%2)*.52,y:-2.6+Math.floor(i/2)*.85,z:.74},.17,.55,'#c3cbd2','vrm'));
    // M.2 and PCIe expansion slot / discrete GPU.
    add('Osłona M.2',{x:.8,y:-2.75,z:.38},[4.2,.82,.18],'#647989','m2');
    add('Dysk NVMe M.2',{x:.8,y:-2.75,z:.59},[3.25,.55,.16],'#1e6d91','m2');
    add('Gniazdo PCIe x16',{x:.1,y:2.7,z:.38},[8.4,.42,.2],'#d2b55d','pcie');
    add('Karta graficzna',{x:.2,y:2.05,z:.83},[8.8,1.25,.9],'#273d54','pcie');
    add('Osłona GPU',{x:.2,y:2.05,z:1.3},[8.1,1.05,.09],'#4b627b','pcie');
    for(let i=0;i<3;i++)out.push(...cylinderMesh('Wentylator GPU',{x:-2.5+i*2.7,y:2.05,z:1.39},.4,.1,'#9aafc0','pcie'));
    // Chipset and heatsink.
    add('Chipset',{x:4.65,y:-2.05,z:.58},[1.35,1.35,.36],'#2b3a49','chipset');
    add('Radiator chipsetu',{x:4.65,y:-2.05,z:.83},[1.75,1.75,.35],'#738795','chipset');
    // I/O panel and connectors.
    add('Panel I/O',{x:-5.55,y:.3,z:.45},[.65,4.65,.9],'#526575');
    for(let i=0;i<5;i++)add('Złącze portu',{x:-5.55,y:-1.3+i*.75,z:1.02},[.48,.38,.3],'#b4c3ce');
    // Board mounting holes and traces (short raised copper paths).
    for(const [x,y] of [[-5.35,-3.35],[5.35,-3.35],[-5.35,3.35],[5.35,3.35]])out.push(...cylinderMesh('Otwór montażowy',{x,y,z:.23},.17,.08,'#c7ad68'));
    for(let i=0;i<9;i++)add('Ścieżka PCB',{x:-.4+i*.58,y:-1.1+(i%3)*.18,z:.22},[2.4,.045,.035],'#c49a4c');
    return out;
  }
  function loadGlbArrayBuffer(buffer){
    if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>32*1024*1024)throw new Error('Plik GLB musi mieć od 20 bajtów do 32 MB.');
    const view=new DataView(buffer);if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)throw new Error('Nieprawidłowy nagłówek GLB 2.0.');
    let offset=12,json=null,binary=null;
    while(offset+8<=buffer.byteLength){const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true);offset+=8;if(length>buffer.byteLength-offset)throw new Error('Uszkodzona długość fragmentu GLB.');const part=buffer.slice(offset,offset+length);if(type===0x4e4f534a){json=JSON.parse(new TextDecoder().decode(part).replace(/[\u0000\s]+$/g,''));}else if(type===0x004e4942)binary=part;offset+=length;}
    if(!json||!binary||json.asset?.version!=='2.0')throw new Error('Wymagany jest GLB 2.0 z buforem BIN osadzonym w pliku.');
    if((json.buffers||[]).length!==1||json.buffers[0].uri)throw new Error('Dozwolony jest tylko jeden bufor osadzony. GLB nie może pobierać zewnętrznych plików ani adresów sieciowych.');if(!Number.isInteger(json.buffers[0].byteLength)||json.buffers[0].byteLength<1||json.buffers[0].byteLength>binary.byteLength)throw new Error('Nieprawidłowa długość osadzonego bufora GLB.');
    const bufferViews=json.bufferViews||[],accessors=json.accessors||[],meshes=json.meshes||[],nodes=json.nodes||[],sceneIndex=Number.isInteger(json.scene)?json.scene:0;
    if(!Array.isArray(nodes)||nodes.length>100000||!Array.isArray(meshes)||meshes.length>50000||!json.scenes?.[sceneIndex])throw new Error('Model nie zawiera poprawnej sceny glTF.');
    function accessor(index,expected){const a=accessors[index];if(!a||a.sparse||a.bufferView===undefined)throw new Error('Nieobsługiwany accessor glTF.');const bv=bufferViews[a.bufferView];if(!bv||bv.buffer!==0)throw new Error('Nieprawidłowy bufferView.');const comps=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4})[a.type];if(!comps||expected&&a.type!==expected)throw new Error('Nieobsługiwany typ atrybutu glTF.');const c=a.componentType,bytes=({5121:1,5123:2,5125:4,5126:4})[c];if(!Number.isInteger(a.count)||a.count<1||!bytes||(expected==='VEC3'&&c!==5126)||(expected==='SCALAR'&&![5121,5123,5125].includes(c)))throw new Error('Nieobsługiwany format danych geometrii.');const stride=bv.byteStride||bytes*comps,start=(bv.byteOffset||0)+(a.byteOffset||0),out=[];if(start+(a.count-1)*stride+bytes*comps>binary.byteLength||a.count>1000000)throw new Error('Atrybut wykracza poza bufor lub przekracza limit wierzchołków.');for(let i=0;i<a.count;i++){const row=[];for(let j=0;j<comps;j++){const p=start+i*stride+j*bytes;row.push(c===5126?new DataView(binary).getFloat32(p,true):c===5125?new DataView(binary).getUint32(p,true):c===5123?new DataView(binary).getUint16(p,true):new DataView(binary).getUint8(p));}out.push(row);}return out;}
    function transformLocal(point,node){if(Array.isArray(node.matrix)&&node.matrix.length===16){const m=node.matrix;return{x:point.x*m[0]+point.y*m[4]+point.z*m[8]+m[12],y:point.x*m[1]+point.y*m[5]+point.z*m[9]+m[13],z:point.x*m[2]+point.y*m[6]+point.z*m[10]+m[14]};}const t=node.translation||[0,0,0],q=node.rotation||[0,0,0,1],scale=node.scale||[1,1,1];let x=point.x*scale[0],y=point.y*scale[1],z=point.z*scale[2];const [qx,qy,qz,qw]=q;const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;return{x:ix*qw+iw*-qx+iy*-qz-iz*-qy+t[0],y:iy*qw+iw*-qy+iz*-qx-ix*-qz+t[1],z:iz*qw+iw*-qz+ix*-qy-iy*-qx+t[2]};}
    const parent=new Map();nodes.forEach((node,i)=>(node.children||[]).forEach(child=>{if(!Number.isInteger(child)||child<0||child>=nodes.length||parent.has(child))throw new Error('Nieprawidłowa lub wielokrotnie przypisana hierarchia węzłów GLB.');parent.set(child,i);}));
    const faces=[];let vertexCount=0;const visited=new Set();
    function visit(nodeIndex,depth=0){if(!Number.isInteger(nodeIndex)||nodeIndex<0||nodeIndex>=nodes.length)throw new Error('Węzeł sceny GLB ma nieprawidłowy indeks.');if(depth>64||visited.has(nodeIndex))throw new Error('Wykryto cykl lub zbyt głęboką hierarchię GLB.');visited.add(nodeIndex);const node=nodes[nodeIndex];const chain=[];let cursor=nodeIndex;const chainSeen=new Set();while(cursor!==undefined){if(chainSeen.has(cursor)||chain.length>=64)throw new Error('Wykryto cykl lub zbyt głęboką hierarchię GLB.');chainSeen.add(cursor);chain.push(nodes[cursor]);cursor=parent.get(cursor);}if(node.mesh!==undefined){const mesh=meshes[node.mesh];for(const primitive of mesh?.primitives||[]){if((primitive.mode??4)!==4||primitive.attributes?.POSITION===undefined)continue;const positions=accessor(primitive.attributes.POSITION,'VEC3');const indices=primitive.indices===undefined?positions.map((_,i)=>i):accessor(primitive.indices,'SCALAR').map(x=>x[0]);if(indices.some(index=>!Number.isInteger(index)||index<0||index>=positions.length))throw new Error('Indeks wierzchołka wykracza poza bufor.');if(indices.length%3!==0)throw new Error('Indeksy trójkątów nie są poprawne.');vertexCount+=positions.length;if(vertexCount>1000000||faces.length+indices.length/3>150000)throw new Error('Model przekracza bezpieczny limit geometrii.');const factor=json.materials?.[primitive.material]?.pbrMetallicRoughness?.baseColorFactor||[.35,.55,.75,1],color='#'+factor.slice(0,3).map(x=>Math.max(0,Math.min(255,Math.round(x*255))).toString(16).padStart(2,'0')).join('');const transformed=positions.map(row=>{let point={x:row[0],y:row[1],z:row[2]};for(const item of chain)point=transformLocal(point,item);return point;});for(let i=0;i<indices.length;i+=3){const a=transformed[indices[i]],b=transformed[indices[i+1]],c=transformed[indices[i+2]];if(!a||!b||!c)throw new Error('Indeks wierzchołka wykracza poza bufor.');faces.push({name:mesh.name||node.name||'Model GLB',part:'external',color,shade:.9,vertices:[a,b,c]});}}}for(const child of node.children||[])visit(child,depth+1);}
    const roots=json.scenes[sceneIndex].nodes||[];if(!Array.isArray(roots)||roots.length>20000)throw new Error('Nieprawidłowa lista węzłów sceny GLB.');for(const index of roots)visit(index);if(!faces.length)throw new Error('Nie znaleziono obsługiwanych trójkątów w modelu GLB.');
    const points=faces.flatMap(face=>face.vertices),bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};for(const p of points){bounds.min[0]=Math.min(bounds.min[0],p.x);bounds.min[1]=Math.min(bounds.min[1],p.y);bounds.min[2]=Math.min(bounds.min[2],p.z);bounds.max[0]=Math.max(bounds.max[0],p.x);bounds.max[1]=Math.max(bounds.max[1],p.y);bounds.max[2]=Math.max(bounds.max[2],p.z);}const center={x:(bounds.min[0]+bounds.max[0])/2,y:(bounds.min[1]+bounds.max[1])/2,z:(bounds.min[2]+bounds.max[2])/2},extent=Math.max(bounds.max[0]-bounds.min[0],bounds.max[1]-bounds.min[1],bounds.max[2]-bounds.min[2]);if(!Number.isFinite(extent)||extent<=0)throw new Error('Model ma zerowy lub nieprawidłowy rozmiar.');const scale=12/extent;for(const face of faces)face.vertices=face.vertices.map(p=>({x:(p.x-center.x)*scale,y:(p.y-center.y)*scale,z:(p.z-center.z)*scale}));return{faces,vertices:vertexCount,triangles:faces.length,source:'GLB 2.0 · plik lokalny',externalNetworkAccess:false};
  }
  const api={rotatePoint,projectPoint,boxMesh,cylinderMesh,createScene,loadGlbArrayBuffer};
  globalThis.NaukaFix1993D=api;
  if(typeof document==='undefined')return;
  const root=document.getElementById('fix195Labs');
  const canvas=document.getElementById('f197BoardCanvas');
  if(!root||!canvas||!canvas.getContext)return;
  const status=document.getElementById('f196ViewStatus');
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true})||canvas.getContext('webgl',{alpha:true,antialias:true,depth:true});
  const ctx=gl?null:canvas.getContext('2d'); if(!gl&&!ctx)return;
  let scene=createScene(); let rx=-.82,ry=.62,zoom=1,drag=null,drawQueued=false;
  let glProgram=null,glBuffer=null,glPosition=null,glColor=null;
  if(gl){
    const isWebGL2=String(gl.getParameter(gl.VERSION)||'').includes('WebGL 2');
    const vertexSource=isWebGL2?'#version 300 es\nin vec3 aPosition; in vec3 aColor; out vec3 vColor; void main(){gl_Position=vec4(aPosition,1.0);vColor=aColor;}':'attribute vec3 aPosition; attribute vec3 aColor; varying vec3 vColor; void main(){gl_Position=vec4(aPosition,1.0);vColor=aColor;}';
    const fragmentSource=isWebGL2?'#version 300 es\nprecision mediump float; in vec3 vColor; out vec4 outColor; void main(){outColor=vec4(vColor,1.0);}':'precision mediump float; varying vec3 vColor; void main(){gl_FragColor=vec4(vColor,1.0);}';
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader)||'shader compile error';gl.deleteShader(shader);throw new Error(message);}return shader;};
    try{const vertex=compile(gl.VERTEX_SHADER,vertexSource);const fragment=compile(gl.FRAGMENT_SHADER,fragmentSource);glProgram=gl.createProgram();gl.attachShader(glProgram,vertex);gl.attachShader(glProgram,fragment);gl.linkProgram(glProgram);if(!gl.getProgramParameter(glProgram,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(glProgram)||'program link error');glPosition=gl.getAttribLocation(glProgram,'aPosition');glColor=gl.getAttribLocation(glProgram,'aColor');glBuffer=gl.createBuffer();gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);if(status)status.textContent=isWebGL2?'Renderer WebGL 2 aktywny — model wielokątowy':'Renderer WebGL 1 aktywny — model wielokątowy';}catch(error){if(status)status.textContent='Błąd inicjalizacji WebGL: '+error.message+'; odśwież przeglądarkę lub użyj urządzenia z obsługą WebGL.';return;}
  }else if(status){status.textContent='WebGL niedostępny — używany jest zapasowy renderer Canvas 2D.';}
  const stage=document.getElementById('f196Stage');
  function schedule(){if(drawQueued)return;drawQueued=true;requestAnimationFrame(()=>{drawQueued=false;draw();});}
  function drawWebGL(width,height){
    if(!gl||!glProgram||!glBuffer)return;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(.018,.035,.058,.96);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(glProgram);
    const selectedPart=root.querySelector('[data-part][aria-pressed="true"]')?.dataset.part||'';
    const positions=[],colors=[];
    for(const face of scene){
      const transformed=face.vertices.map(p=>rotatePoint(p,rx,ry));
      const projected=transformed.map(p=>projectPoint(p,width,height,zoom));
      const depth=clamp(.86-transformed.reduce((sum,p)=>sum+p.z,0)/transformed.length*.045,-.92,.92);
      const highlighted=!!selectedPart&&face.part===selectedPart;
      const color=hexRgb(face.color,highlighted?1.28:face.shade);
      for(let i=1;i<projected.length-1;i++){
        for(const point of [projected[0],projected[i],projected[i+1]]){
          positions.push(clamp(point.x/width*2-1,-1.4,1.4),clamp(1-point.y/height*2,-1.4,1.4),depth);
          colors.push(color[0],color[1],color[2]);
        }
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,glBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(glPosition);gl.vertexAttribPointer(glPosition,3,gl.FLOAT,false,0,0);
    const colorBuffer=drawWebGL.colorBuffer||(drawWebGL.colorBuffer=gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(glColor);gl.vertexAttribPointer(glColor,3,gl.FLOAT,false,0,0);
    gl.drawArrays(gl.TRIANGLES,0,positions.length/3);
  }
  function draw(){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=clamp(window.devicePixelRatio||1,1,2);const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    if(gl){drawWebGL(rect.width,rect.height);return;}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
    const selectedPart=root.querySelector('[data-part][aria-pressed="true"]')?.dataset.part||'';
    const polys=scene.map(face=>{const transformed=face.vertices.map(p=>rotatePoint(p,rx,ry));const projected=transformed.map(p=>projectPoint(p,rect.width,rect.height,zoom));const depth=transformed.reduce((s,p)=>s+p.z,0)/transformed.length;return {...face,points:projected,depth};}).sort((a,b)=>a.depth-b.depth);
    for(const poly of polys){const pts=poly.points,highlight=!!selectedPart&&poly.part===selectedPart;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fillStyle=shade(poly.color,highlight?1.25:poly.shade);ctx.fill();ctx.strokeStyle=highlight?'#fff0a8':'rgba(3,18,27,.58)';ctx.lineWidth=highlight?1.8:.75;ctx.stroke();}
  }
  function hexRgb(hex,factor=1){const n=parseInt(hex.slice(1),16);return [clamp((((n>>16)&255)*factor)/255,0,1),clamp((((n>>8)&255)*factor)/255,0,1),clamp(((n&255)*factor)/255,0,1)];}
  function shade(hex,factor){const n=parseInt(hex.slice(1),16);const r=clamp(Math.round(((n>>16)&255)*factor),0,255),g=clamp(Math.round(((n>>8)&255)*factor),0,255),b=clamp(Math.round((n&255)*factor),0,255);return `rgb(${r},${g},${b})`;}
  const modelInput=document.getElementById('f225ModelFile');
  modelInput?.addEventListener('change',async()=>{const file=modelInput.files?.[0];if(!file)return;try{if(file.size>32*1024*1024)throw new Error('Maksymalny rozmiar pliku to 32 MB.');const loaded=loadGlbArrayBuffer(await file.arrayBuffer());scene=loaded.faces;rx=-.82;ry=.62;zoom=1;if(status)status.textContent=`Wczytano lokalny model GLB: ${loaded.triangles.toLocaleString('pl-PL')} trójkątów. Plik nie został wysłany.`;schedule();}catch(error){if(status)status.textContent=`Nie wczytano modelu: ${error.message}`;}finally{modelInput.value='';}});
  const rotateButton=document.getElementById('f196Rotate'),resetButton=document.getElementById('f196Reset');
  root.querySelectorAll('[data-part]').forEach(button=>button.addEventListener('click',schedule));
  rotateButton?.addEventListener('click',()=>{ry+=Math.PI/3;rx=-.7;status.textContent=gl?'WebGL 3D — widok obrócony':'Model przestrzenny — widok obrócony';schedule();});
  resetButton?.addEventListener('click',()=>{rx=-.82;ry=.62;zoom=1;status.textContent=gl?'WebGL 3D — widok początkowy':'Model przestrzenny — widok początkowy';schedule();});
  canvas.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,rx,ry};canvas.setPointerCapture?.(event.pointerId);canvas.classList.add('dragging');});
  canvas.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;ry=drag.ry+dx*.009;rx=clamp(drag.rx+dy*.009,-1.45,1.45);status.textContent='Przeciągnij, aby obracać model';schedule();});
  const stop=()=>{drag=null;canvas.classList.remove('dragging');};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
  canvas.addEventListener('wheel',event=>{event.preventDefault();zoom=clamp(zoom*(event.deltaY<0?1.08:.92),.7,1.55);schedule();},{passive:false});
  canvas.addEventListener('keydown',event=>{const step=.09;if(event.key==='ArrowLeft')ry-=step;else if(event.key==='ArrowRight')ry+=step;else if(event.key==='ArrowUp')rx=clamp(rx-step,-1.45,1.45);else if(event.key==='ArrowDown')rx=clamp(rx+step,-1.45,1.45);else if(event.key==='+'||event.key==='=')zoom=clamp(zoom+.08,.7,1.55);else if(event.key==='-')zoom=clamp(zoom-.08,.7,1.55);else return;event.preventDefault();schedule();});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(schedule).observe(canvas);else window.addEventListener('resize',schedule);
  if(status)status.textContent=gl?'Renderer sprzętowy WebGL aktywny':'WebGL niedostępny — użyto renderera Canvas 2D';
  schedule();
})();
