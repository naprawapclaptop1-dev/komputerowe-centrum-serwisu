import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contract from './global-academy-expansion-contract-fix82.cjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = fs.readFileSync(path.join(ROOT, 'WEB_PUBLISH/assets/global-academy-expansion-fix73.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'WEB_PUBLISH/assets/global-academy-expansion-manifest-fix73.json'), 'utf8'));
const watcher = fs.readFileSync(path.join(ROOT, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');

const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }

check('kontrakt FIX82 używa rzeczywistego identyfikatora certyfikatów FIX70', () => {
  assert.ok(contract.REQUIRED_GLOBAL_ACADEMY_EXPANSION_MARKERS.includes('npaFix70CertificatesV1'));
  assert.ok(!contract.REQUIRED_GLOBAL_ACADEMY_EXPANSION_MARKERS.includes('FIX70'));
  assert.ok(manifest.fixSeries.includes('FIX70'));
});
check('rzeczywisty runtime ma wszystkie wymagane znaczniki FIX64–FIX73', () => {
  assert.deepEqual(contract.getMissingGlobalAcademyExpansionMarkers(runtime), []);
  assert.equal(contract.hasRequiredGlobalAcademyExpansionMarkers(runtime), true);
});
check('brak identyfikatora egzaminów FIX70 blokuje zdalną walidację', () => {
  const damaged = runtime.replace('npaFix70CertificatesV1', 'missing-cert-store-marker');
  assert.ok(contract.getMissingGlobalAcademyExpansionMarkers(damaged).includes('npaFix70CertificatesV1'));
  assert.equal(contract.hasRequiredGlobalAcademyExpansionMarkers(damaged), false);
});
check('brak bindCert lub innego modułu nadal blokuje walidację', () => {
  const damaged = runtime.replaceAll('bindCert', 'certHandler');
  assert.ok(contract.getMissingGlobalAcademyExpansionMarkers(damaged).includes('bindCert'));
  assert.equal(contract.hasRequiredGlobalAcademyExpansionMarkers(damaged), false);
});
check('watcher korzysta ze wspólnego kontraktu FIX82 i raportuje brakujące znaczniki', () => {
  assert.ok(watcher.includes("require('./scripts/global-academy-expansion-contract-fix82.cjs')"));
  assert.ok(watcher.includes('getMissingGlobalAcademyExpansionMarkers(remoteGlobalExpansionJs)'));
  assert.ok(watcher.includes('globalExpansionMissingMarkers='));
  assert.ok(watcher.includes('remoteGlobalAcademyExpansionMissingMarkers.length === 0'));
});
check('dane i granice prywatności modułu FIX73 pozostają bez zmian', () => {
  assert.equal(manifest.integration.addedTopLevelViews, 0);
  assert.equal(manifest.storage.newD1Migrations, false);
  assert.equal(manifest.storage.automaticCustomerDataUpload, false);
  assert.equal(manifest.storage.openAiSecretInClient, false);
});

console.log(`FIX82 GLOBAL ACADEMY PUBLICATION MARKER: ${checks.length}/${checks.length} PASS`);
