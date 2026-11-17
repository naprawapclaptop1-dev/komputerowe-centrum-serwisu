import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tests=
[
  {
    "label": "FIX76 - bramka unikalnosci zdjec publikacji",
    "file": "scripts/test-home-photo-guard-fix76.mjs"
  },
  {
    "label": "FIX75 - fotografie i specjalizacje akademii",
    "file": "scripts/test-home-learning-fix75.mjs"
  },
  {
    "label": "FIX74 - natywne sciezki file URL",
    "file": "scripts/test-syntax-root-fix74.mjs"
  },
  {
    "label": "FIX38 - spójnosc historycznych kontraktów",
    "file": "scripts/test-release-contract-consistency-fix38.mjs"
  },
  {
    "label": "FIX39 - spójnosc runnerów i kontraktów",
    "file": "scripts/test-release-contract-consistency-fix39.mjs"
  },
  {
    "label": "FIX49 - kontrakt wydania",
    "file": "scripts/test-release-contract-fix49.mjs"
  },
  {
    "label": "FIX50 - kontrakt wydania",
    "file": "scripts/test-release-contract-fix50.mjs"
  },
  {
    "label": "FIX50 - niezawodnosc fotografii",
    "file": "scripts/test-photo-reliability-fix50.mjs"
  },
  {
    "label": "FIX51 - biblioteka wizualna",
    "file": "scripts/test-visual-academy-fix51.mjs"
  },
  {
    "label": "FIX51 - lokalny serwer podgladu",
    "file": "scripts/test-preview-server-fix51.mjs"
  },
  {
    "label": "FIX51 - kontrakt wydania",
    "file": "scripts/test-release-contract-fix51.mjs"
  },
  {
    "label": "FIX53 - liczba zasobow watchera",
    "file": "scripts/test-watcher-fix51-asset-count-fix53.mjs"
  },
  {
    "label": "FIX60 - Global Academy Suite",
    "file": "scripts/test-global-academy-suite-fix60.mjs"
  },
  {
    "label": "FIX73 - rozszerzenie akademii",
    "file": "scripts/test-global-academy-expansion-fix73.mjs"
  },
  {
    "label": "FIX73 - HTTP i bezpieczenstwo sciezek",
    "file": "scripts/test-global-academy-http-fix73.mjs"
  },
  {
    "label": "FIX62 - inwentarz migracji",
    "file": "scripts/test-migration-inventory-compat-fix62.mjs"
  },
  {
    "label": "FIX54 - zasoby wizualne HTTP",
    "file": "scripts/test-visual-assets-http-fix54.mjs"
  },
  {
    "label": "FIX54 - bramka galezi produkcyjnej",
    "file": "scripts/test-production-branch-guard-fix54.mjs"
  },
  {
    "label": "FIX63 - wykrywanie galezi Pages",
    "file": "scripts/test-pages-branch-discovery-fix63.mjs"
  },
  {
    "label": "FIX61 - liczba widokow",
    "file": "scripts/test-view-count-fix61.mjs"
  },
  {
    "label": "FIX49 - centrum jakosci",
    "file": "scripts/test-ultimate-quality-fix49.mjs"
  },
  {
    "label": "FIX49 - blokada migracji oczekujacych",
    "file": "scripts/test-pending-migration-guard-fix49.mjs"
  },
  {
    "label": "FIX51 - audyt bezpieczenstwa",
    "file": "scripts/security-audit-fix51.mjs"
  },
  {
    "label": "FIX51 - audyt migracji",
    "file": "scripts/migration-audit-fix51.mjs"
  },
  {
    "label": "FIX49 - audyt bezpieczenstwa historyczny",
    "file": "scripts/security-audit-fix49.mjs"
  },
  {
    "label": "FIX49 - audyt migracji historyczny",
    "file": "scripts/migration-audit-fix49.mjs"
  },
  {
    "label": "FIX77 - widok edukacyjny i kafelki",
    "file": "scripts/test-home-learning-fix77.mjs"
  },
  {
    "label": "FIX77 - globalna unikalnosc fotografii",
    "file": "scripts/test-photo-uniqueness-fix77.mjs"
  },
  {
    "label": "FIX77 - nowe moduly i style",
    "file": "scripts/test-global-academy-fix77.mjs"
  },
  {
    "label": "FIX77 - nowe zasoby HTTP",
    "file": "scripts/test-global-academy-http-fix77.mjs"
  },
  {
    "label": "FIX77 - bramki OneClick i Watcher",
    "file": "scripts/test-oneclick-fix77.mjs"
  },
  {
    "label": "FIX78 - kontrola pobierania manifestu zdjęć",
    "file": "scripts/test-fix78-photo-manifest-guard.mjs"
  },
  {
    "label": "FIX64-FIX73 - kontrola skladni",
    "file": "scripts/test-syntax-fix64-fix73.mjs"
  },
  {
    "label": "FIX79 - poprawka cache PWA i filmu wsparcia",
    "file": "scripts/test-service-worker-fix79.mjs"
  },
  {
    "label": "FIX80 - zgodność sześciu ilustracji pokazu",
    "file": "scripts/test-homepage-showcase-fix80.mjs"
  },
  {
    "label": "FIX80 - test regresyjny starego kontraktu watchera FIX32",
    "file": "scripts/test-watcher-homepage-showcase-fix32.mjs"
  },
  {
    "label": "FIX80 - zgodność historycznego testu pokazu FIX8",
    "file": "scripts/test-homepage-showcase-fix8.js"
  }
];
let passed=0,failed=0;
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX80 · Node ${process.version}`);
for(const test of tests){
 const target=path.join(ROOT,test.file);
 if(!fs.existsSync(target)){failed++;console.error(`[FAIL] BRAK ${test.file}`);continue;}
 const result=spawnSync(process.execPath,[target],{cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024});
 if(result.status===0){passed++;console.log(`[PASS] ${test.label}`);}
 else {failed++;console.error(`[FAIL] ${test.label}\n${result.stdout||''}\n${result.stderr||''}`);}
}
console.log(`FIX80 TEST SUMMARY: ${passed}/${tests.length} PASS · ${failed} FAIL`);
process.exitCode=failed?1:0;
