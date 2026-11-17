'use strict';
const path = require('node:path');
const core = require('./migration-audit-core-fix49.cjs');

function parsePendingMigrationList(output, migrationFiles = []) {
  const text = String(output || '').replace(/^\uFEFF/, '').trim();
  const names = [...new Set((text.match(/\b\d{4}_[A-Za-z0-9][A-Za-z0-9_-]*\.sql\b/g) || []).map(name => path.basename(name)))];
  if (names.length) {
    const known = new Set(migrationFiles.map(name => path.basename(name)));
    const unknown = names.filter(name => !known.has(name));
    if (unknown.length) throw new Error(`Wrangler zgłosił nieznane lokalnie migracje: ${unknown.join(', ')}.`);
    return { pending: names, recognized: true, message: 'Wykryto listę oczekujących migracji.' };
  }
  if (/no\s+(?:unapplied\s+|pending\s+)?migrations?(?:\s+to\s+apply)?|nothing\s+to\s+apply|brak\s+oczekuj[aą]cych\s+migracji/i.test(text)) {
    return { pending: [], recognized: true, message: 'Brak oczekujących migracji.' };
  }
  throw new Error('Nie udało się bezpiecznie odczytać listy niezaaplikowanych migracji Wrangler. Publikacja zatrzymana — wymagany ręczny przegląd wyniku polecenia d1 migrations list.');
}

function auditPendingMigrationFiles(pendingNames, migrationDir) {
  const results = [];
  for (const name of pendingNames) {
    const full = path.join(migrationDir, path.basename(name));
    const fs = require('node:fs');
    if (!fs.existsSync(full)) throw new Error(`Brak lokalnego pliku oczekującej migracji ${name}.`);
    const analysis = core.analyzeMigrationSql(fs.readFileSync(full, 'utf8'));
    results.push({ file: name, ...analysis });
  }
  const blocked = results.filter(row => row.reviewRequired);
  if (blocked.length) {
    throw new Error(`D1 migration guard: nie zastosowano migracji wysokiego ryzyka: ${blocked.map(row => row.file).join(', ')}. Najpierw ręcznie przygotuj/zweryfikuj bezpieczną migrację addytywną. Kopia ani SQL nie zostały wykonane przez tę kontrolę.`);
  }
  return { results, safeCount: results.length, blocked: [] };
}

module.exports = { parsePendingMigrationList, auditPendingMigrationFiles };
