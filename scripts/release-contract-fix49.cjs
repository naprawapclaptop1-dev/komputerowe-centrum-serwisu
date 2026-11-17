'use strict';
const fs = require('node:fs');
const path = require('node:path');
const securityCore = require('./security-audit-core-fix49.cjs');
const migrationCore = require('./migration-audit-core-fix49.cjs');

function readServiceWorkerContract(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const matches = [...source.matchAll(/\bconst\s+CACHE_NAME\s*=\s*(['"])([^'"\r\n]+)\1\s*;/g)];
  if (matches.length !== 1) {
    throw new Error(`Service Worker musi zawierać dokładnie jedną deklarację CACHE_NAME; znaleziono ${matches.length}.`);
  }
  return Object.freeze({ source, cacheName: matches[0][2] });
}

function loadFix49Manifest(root) {
  const filePath = path.join(root, 'FIX49_RELEASE_MANIFEST.json');
  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (manifest.fix !== 'FIX49' || manifest.release !== '6.8.0' || !manifest.build || !manifest.cacheMarker) {
    throw new Error('Manifest FIX49 ma nieprawidłową wersję lub brakuje build/cache marker.');
  }
  return manifest;
}


function runFix49StaticAudits(root) {
  const findings = [];
  const visited = [];
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relative = path.relative(root, full).replace(/\\/g, '/');
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!securityCore.isExcluded(relative)) walk(full);
        continue;
      }
      if (!entry.isFile() || securityCore.isExcluded(relative)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!securityCore.SOURCE_EXTENSIONS.has(ext) && !/^\.env(?:\.|$)/i.test(path.basename(relative))) continue;
      if (fs.statSync(full).size > 5 * 1024 * 1024) continue;
      const content = fs.readFileSync(full, 'utf8');
      visited.push(relative);
      findings.push(...securityCore.scanText(relative, content));
    }
  };
  for (const folder of ['WEB_PUBLISH', 'functions', 'scripts']) walk(path.join(root, folder));
  for (const file of ['wrangler.toml','wrangler.json','wrangler.jsonc','.env','.dev.vars']) {
    const full = path.join(root, file);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf8');
      visited.push(file);
      findings.push(...securityCore.scanText(file, content));
    }
  }
  const critical = findings.filter(x => x.severity === 'critical').length;
  const high = findings.filter(x => x.severity === 'high').length;
  if (critical || high) {
    throw new Error(`FIX49 security gate blocked release: ${critical} critical, ${high} high findings. Values were not logged; run scripts/security-audit-fix49.mjs for file/line report.`);
  }
  const migrationsDir = path.join(root, 'migrations');
  const migrationReviews = [];
  if (fs.existsSync(migrationsDir)) {
    for (const name of fs.readdirSync(migrationsDir).filter(x => x.endsWith('.sql')).sort()) {
      const analysis = migrationCore.analyzeMigrationSql(fs.readFileSync(path.join(migrationsDir, name), 'utf8'));
      if (analysis.reviewRequired) migrationReviews.push(name);
    }
  }
  return Object.freeze({ sourceFilesScanned: visited.length, secretFindings: findings.length, critical, high, migrationReviews });
}

function verifyFix49Release(root) {
  const manifest = loadFix49Manifest(root);
  const audit = runFix49StaticAudits(root);
  const web = path.join(root, 'WEB_PUBLISH');
  const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
  const release = JSON.parse(fs.readFileSync(path.join(web, 'release.json'), 'utf8'));
  const sw = readServiceWorkerContract(path.join(web, 'service-worker.js'));
  const publicManifestPath = path.join(web, 'release-contract-fix49.json');
  const authStatusPath = path.join(root, 'functions', 'api', 'auth', 'status.js');
  const authStatusSource = fs.readFileSync(authStatusPath, 'utf8');
  const publicManifest = JSON.parse(fs.readFileSync(publicManifestPath, 'utf8'));
  const runtimePath = path.join(web, 'assets', manifest.assets.runtime);
  const cssPath = path.join(web, 'assets', manifest.assets.styles);
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const styles = fs.readFileSync(cssPath, 'utf8');
  const failures = [];

  if (release.release !== manifest.release || release.build !== manifest.build) failures.push('release.json nie zgadza się z manifestem FIX49');
  if (!authStatusSource.includes(manifest.build)) failures.push('API /api/auth/status nie raportuje bieżącego build ID FIX49');
  if (publicManifest.fix !== manifest.fix || publicManifest.build !== manifest.build || publicManifest.cacheMarker !== manifest.cacheMarker) failures.push('publiczny kontrakt FIX49 nie zgadza się z manifestem źródłowym');
  const buildMeta = html.match(/<meta\s+name=["']academy-build["']\s+content=["']([^"']+)/i)?.[1] || '';
  if (buildMeta !== manifest.build) failures.push('academy-build w HTML nie zgadza się z manifestem FIX49');
  if (!html.includes(`id="${manifest.viewId}"`) || !html.includes(`data-view="${manifest.viewId.replace(/^view-/, '')}"`)) failures.push('brak osobnego widoku FIX49 lub pozycji nawigacji');
  if (!html.includes(`${manifest.assets.runtime}?v=${manifest.assetVersion}`) || !html.includes(`${manifest.assets.styles}?v=${manifest.assetVersion}`)) failures.push('HTML nie ładuje dokładnych wersji assetów FIX49');
  if (!sw.source.includes(manifest.assets.runtime) || !sw.source.includes(manifest.assets.styles)) failures.push('Service Worker nie buforuje assetów FIX49');
  if (!sw.cacheName.includes(manifest.cacheMarker)) failures.push('CACHE_NAME nie zawiera znacznika FIX49');
  for (const token of manifest.requiredRuntimeTokens || []) if (!runtime.includes(token)) failures.push(`brak funkcji runtime: ${token}`);
  for (const selector of manifest.requiredStyleTokens || []) if (!styles.includes(selector)) failures.push(`brak stylu: ${selector}`);
  for (const required of manifest.requiredFiles || []) if (!fs.existsSync(path.join(root, required))) failures.push(`brak pliku: ${required}`);
  if (failures.length) throw new Error(`Kontrakt FIX49 niekompletny:\n- ${failures.join('\n- ')}`);
  return Object.freeze({ manifest, build: manifest.build, cacheName: sw.cacheName, runtimePath, cssPath, audit });
}

module.exports = { readServiceWorkerContract, loadFix49Manifest, runFix49StaticAudits, verifyFix49Release };
