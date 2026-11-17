import fs from 'node:fs';
import path from 'node:path';
const web=path.resolve('WEB_PUBLISH');
const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
const report={hotfix:'FIX236',productVersion:'6.8.0',checkedAt:new Date().toISOString(),errors:[],warnings:[],metrics:{htmlBytes:Buffer.byteLength(html),viewCount:(html.match(/id="view-[^"]+"/g)||[]).length,images:0,imagesWithoutAlt:0,newFeatureIds:0,localAssets:0}};
const scopedIds=[...html.matchAll(/\bid=["'](fix(?:231|232|233|234|236|237|238)[A-Za-z0-9_-]*)["']/g)].map(x=>x[1]);
report.metrics.newFeatureIds=scopedIds.length;
const counts=new Map();for(const id of scopedIds)counts.set(id,(counts.get(id)||0)+1);
for(const [id,count]of counts)if(count>1)report.errors.push(`Powielony identyfikator nowego panelu: ${id} (${count} razy)`);
const required=['fix231239Preferences','fix232Inbox','fix233Language','fix234Font','fix236ReportForm','fix237CreateInvite','fix238SaveCurrent','fix236AdminReports'];
for(const id of required)if(!counts.has(id))report.errors.push(`Brak wymaganego elementu UI: ${id}`);
for(const match of html.matchAll(/<(?:script|link)[^>]+(?:src|href)=["']([^"']+)["'][^>]*>/g)){
  const raw=match[1];if(!raw.includes('assets/'))continue;
  const rel=raw.split('?')[0].replace(/^\//,'');report.metrics.localAssets++;
  if(!fs.existsSync(path.join(web,rel)))report.errors.push(`Brak lokalnego zasobu: ${raw}`);
}
for(const m of html.matchAll(/<img\b([^>]*)>/gi)){report.metrics.images++;if(!/\balt\s*=\s*["'][^"']*["']/i.test(m[1]))report.metrics.imagesWithoutAlt++;}
if(report.metrics.imagesWithoutAlt)report.warnings.push(`${report.metrics.imagesWithoutAlt} starszych obrazów nie ma atrybutu alt; raportowane jako ostrzeżenie, nie zmienia automatycznie istniejącego projektu.`);
if(report.metrics.viewCount!==35)report.errors.push(`Zmieniono liczbę widoków: ${report.metrics.viewCount}, oczekiwano 35.`);
for(const file of ['functions/api/notifications.js','functions/api/guardians.js','functions/api/content-reports.js','functions/api/admin/content-reports.js','functions/_notifications.js','functions/_webpush.js'])if(!fs.existsSync(file))report.errors.push(`Brak backendu ${file}`);
fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/FIX236_CONTENT_QUALITY_REPORT.json',JSON.stringify(report,null,2));
console.log(`[${report.errors.length?'FAIL':'PASS'}] Kontrola ID nowego panelu: ${scopedIds.length}`);
console.log(`[${report.errors.length?'FAIL':'PASS'}] Liczba widoków: ${report.metrics.viewCount}/35`);
console.log(`[${report.errors.length?'FAIL':'PASS'}] Lokalne zasoby: ${report.metrics.localAssets}`);
console.log(`[INFO] Obrazy bez alt (starsza zawartość): ${report.metrics.imagesWithoutAlt}/${report.metrics.images}`);
for(const error of report.errors)console.error(`[FAIL] ${error}`);
if(report.errors.length)process.exit(1);
console.log('FIX236 CONTENT QUALITY AUDIT: PASS');
