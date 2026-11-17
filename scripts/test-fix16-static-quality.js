#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const web=path.join(root,'WEB_PUBLISH');
function walk(dir,ext,out=[]){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p,ext,out);else if(ext.some(x=>p.toLowerCase().endsWith(x)))out.push(p);}return out;}
function checkCss(source,file){let depth=0,state='code',quote='',escaped=false;for(let i=0;i<source.length;i++){const c=source[i],n=source[i+1];if(state==='comment'){if(c==='*'&&n==='/'){state='code';i++;}continue;}if(state==='string'){if(escaped){escaped=false;continue;}if(c==='\\'){escaped=true;continue;}if(c===quote)state='code';continue;}if(c==='/'&&n==='*'){state='comment';i++;continue;}if(c==='"'||c==="'"){state='string';quote=c;continue;}if(c==='{')depth++;else if(c==='}'){depth--;if(depth<0)throw new Error(`${file}: nadmiarowa klamra zamykająca`);}}if(state==='comment'||state==='string'||depth!==0)throw new Error(`${file}: niedomknięty komentarz, string lub blok CSS`);}
const cssFiles=walk(web,['.css']);for(const file of cssFiles)checkCss(fs.readFileSync(file,'utf8'),path.relative(root,file));
const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
const duplicates=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];if(duplicates.length)throw new Error(`Powtórzone ID HTML: ${duplicates.join(', ')}`);
const refs=[...html.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
let local=0;const missing=[];
for(const ref of refs){const raw=ref.split(/[?#]/,1)[0];if(!raw||/^(?:https?:|data:|blob:|mailto:|tel:|javascript:)/i.test(raw)||raw.startsWith('//'))continue;local++;const rel=raw.replace(/^\/+/, '');const target=path.resolve(web,rel);if(target!==web&&!target.startsWith(web+path.sep)) {missing.push(ref);continue;}if(!fs.existsSync(target))missing.push(ref);}
if(missing.length)throw new Error(`Brak lokalnych zasobów: ${missing.join(', ')}`);
// Audit visible text separately from executable script/style templates.
const visibleHtml = html.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'');
const normalizeVisible = value => value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim().toLocaleLowerCase('pl-PL');
const repeated = (values, minLength=1) => { const seen=new Set(), dup=new Set(); for(const value of values){if(value.length<minLength)continue;if(seen.has(value))dup.add(value);seen.add(value);}return [...dup]; };
const headings=[...visibleHtml.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(m=>normalizeVisible(m[1])).filter(Boolean);
const duplicateHeadings=repeated(headings);
if(duplicateHeadings.length)throw new Error(`Powtórzone widoczne nagłówki: ${duplicateHeadings.join(' | ')}`);
const paragraphs=[...visibleHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>normalizeVisible(m[1])).filter(x=>x.length>=50);
const duplicateParagraphs=repeated(paragraphs,50);
if(duplicateParagraphs.length)throw new Error(`Powtórzone długie akapity: ${duplicateParagraphs.join(' | ')}`);
const release=JSON.parse(fs.readFileSync(path.join(web,'release.json'),'utf8'));
if(release.release!=='6.8.0'||!release.build.startsWith('6.8.0-')||release.production_published!==false)throw new Error('Niespójne metadane wydania lub nieoczekiwana flaga publikacji');
const sw=fs.readFileSync(path.join(web,'service-worker.js'),'utf8');for(const asset of ['master-academy-650-ultimate.js','master-academy-650-ultimate.css','master-academy-660-center.js','master-academy-660-center.css'])if(!sw.includes(asset))throw new Error(`Brak ${asset} w cache PWA`);
console.log(`PASS: CSS strukturalnie poprawny (${cssFiles.length} plików).`);
console.log(`PASS: HTML ma ${ids.length} unikalnych ID; ${local} lokalnych odwołań, brakujących: 0.`);
if(release.build!=='6.8.0-fix51-visual-academy-pro-20261105')throw new Error('Nieoczekiwany identyfikator build FIX39');
console.log(`PASS: brak powtórzonych nagłówków i długich akapitów (nagłówki=${headings.length}, długie akapity=${paragraphs.length}).`);
console.log('PASS: release 6.8.0 FIX40 jest oznaczony jako nieopublikowany, zasoby FIX16/FIX17 są w cache PWA.');
