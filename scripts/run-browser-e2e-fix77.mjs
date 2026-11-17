import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WEB=path.join(ROOT,'WEB_PUBLISH');
let chromium;
try { ({chromium}=await import('playwright')); }
catch { console.error('SKIP: Playwright is not installed; browser E2E was not run.');process.exit(2); }
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const rel=pathname==='/'?'index.html':pathname.replace(/^\//,'');
 const full=path.resolve(WEB,rel);
 if(!full.startsWith(path.resolve(WEB)+path.sep)&&full!==path.resolve(WEB)){res.writeHead(403);return res.end('forbidden');}
 if(!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404);return res.end('not found');}
 res.writeHead(200,{'content-type':types[path.extname(full).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
 if(req.method==='HEAD')return res.end();fs.createReadStream(full).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
 const launch={headless:true,args:['--no-sandbox','--disable-dev-shm-usage']};
 if(process.env.CHROMIUM_BIN)launch.executablePath=process.env.CHROMIUM_BIN;
 else if(process.platform==='linux'&&fs.existsSync('/usr/bin/chromium'))launch.executablePath='/usr/bin/chromium';
 browser=await chromium.launch(launch);
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(e.message));
 const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>window.NPA_PHOTO_UNIQUENESS_FIX77?.passed===true,{timeout:30000});
 const initial=await page.evaluate(()=>({cards:document.querySelectorAll('#view-home .np640-module-grid > button').length,photoSlots:document.querySelectorAll('#view-home img[data-photo-unique]').length,audit:window.NPA_PHOTO_UNIQUENESS_FIX77,status:document.querySelector('#np77PhotoAudit')?.textContent,build:window.NPA_GLOBAL_ACADEMY_FIX77?.build}));
 assert.equal(initial.cards,19,'homepage must show 19 modules');
 assert.equal(initial.photoSlots,13,'13 photo slots must be present');
 assert.equal(initial.audit.passed,true,'browser SHA and pHash audit must pass');
 assert.equal(initial.audit.photoCount,13);
 assert.ok(initial.audit.minimumPerceptualDistance>=10);
 assert.match(initial.status,/13\/13 unikalne/);
 const expected=[['faultlab','#gaxFaultCase'],['electronics','#gaxOhmForm'],['boardview','#gaxBoardMap'],['compatibility','#gaxCompatForm'],['servicesim','#gaxServiceScenario'],['cert','#gaxExamLevel']];
 for(const [tab,selector] of expected){
  await page.evaluate(id=>window.NPA_GLOBAL_ACADEMY_FIX77.openTab(id),tab);
  await page.locator(selector).waitFor({state:'attached',timeout:10000});
 }
 // Functional check of Ohm's law: 0.5 A x 24 Ω = 12 V.
 await page.evaluate(()=>{const f=document.querySelector('#gaxOhmForm');f.elements.solve.value='V';f.elements.current.value='0.5';f.elements.resistance.value='24';});
 await page.locator('#gaxOhmForm button[type="submit"]').click();
 await page.waitForFunction(()=>document.querySelector('#gaxOhmResult')?.textContent.includes('12'));
 // Boardview selection and checklist.
 await page.locator('[data-gax-board="VRM"]').click();
 assert.match(await page.locator('#gaxBoardTitle').textContent(),/VRM/);
 await page.locator('#gaxBoardChecklist').click();
 // Compatibility rule: matching DDR4/NVMe/eDP 30-pin produces at least three positive checks.
 await page.evaluate(()=>{const f=document.querySelector('#gaxCompatForm');f.elements.boardRam.value='ddr4';f.elements.ram.value='ddr4';f.elements.boardSsd.value='nvme';f.elements.ssd.value='nvme';f.elements.boardPanel.value='30pin';f.elements.panel.value='30pin';f.elements.battery.value='EDU-FRU-001';f.elements.verified.checked=true;});
 await page.locator('#gaxCompatForm button[type="submit"]').click();
 assert.equal(await page.locator('#gaxCompatResults [data-result="ok"]').count(),3);
 // Service workflow case is interactive and local.
 await page.evaluate(()=>window.NPA_GLOBAL_ACADEMY_FIX77.openTab('servicesim'));
 await page.locator('[data-gax-service-choice]').first().click();
 assert.equal(await page.locator('#gaxServiceNext').isDisabled(),false);
 // Fault lab checkbox saves to local storage.
 await page.evaluate(()=>window.NPA_GLOBAL_ACADEMY_FIX77.openTab('faultlab'));
 await page.locator('[data-gax-fault-step="0"]').check();
 await page.locator('#gaxFaultSave').click();
 const faultSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('npaFix77FaultLabV1')||'[]').length);
 assert.equal(faultSaved,1);
 // Certification has three levels and displays an exam question after start.
 await page.evaluate(()=>window.NPA_GLOBAL_ACADEMY_FIX77.openTab('cert'));
 await page.locator('#gaxExamLevel').selectOption('expert');
 await page.locator('#gaxStartExam').click();
 await page.locator('.gax-exam').waitFor({state:'visible'});
 assert.equal(await page.locator('.gax-exam label').count(),3);
 assert.equal(pageErrors.length,0,`JavaScript page errors: ${pageErrors.join(' | ')}`);
 console.log(`PASS Browser E2E FIX77: ${base}; 19 modules; 13 photos audited (SHA-256 + pHash); 6 new academy paths; Ohm, BoardView, compatibility, service simulator, fault lab and certification render; 0 page errors.`);
} finally {
 if(browser)await browser.close();
 await new Promise(r=>server.close(r));
}
