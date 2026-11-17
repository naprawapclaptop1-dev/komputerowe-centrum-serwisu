import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const migrations=fs.readdirSync('migrations').filter(x=>/^\d{4}_.+\.sql$/i.test(x)).sort();
const numbers=migrations.map(x=>Number(x.slice(0,4)));
const expected=Array.from({length:numbers.at(-1)||0},(_,i)=>i+1);
const missing=expected.filter(n=>!numbers.includes(n));
const oauth=fs.readFileSync('functions/_oauth.js','utf8');
const html=fs.readFileSync('WEB_PUBLISH/index.html','utf8');
const release=JSON.parse(fs.readFileSync('WEB_PUBLISH/release.json','utf8'));
const checks=[
  ['migration files are monotonically numbered without gaps',missing.length===0],
  ['five OAuth providers are present and X stays disabled',oauth.includes("new Set(['google', 'facebook', 'microsoft', 'github', 'discord'])")&&!html.includes('data-oauth-start="x"')],
  ['new FIX210 backup helper exists',fs.existsSync('tools/FIX210_BACKUP_D1_BEFORE_MIGRATION.ps1')&&fs.existsSync('BACKUP_D1_FIX210.cmd')],
  ['product version remains 6.8.0',release.release==='6.8.0'],
  ['historical PWA cache is preserved',fs.readFileSync('WEB_PUBLISH/service-worker.js','utf8').includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'")]
];
for(const [label,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${label}`);assert.ok(ok,label)}
console.log(`FIX210 RELEASE PREFLIGHT: ${checks.length}/${checks.length} PASS; migrations=${migrations.length}; latest=${migrations.at(-1)||'none'}`);
