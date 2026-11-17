import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pending from './pending-migration-guard-fix49.cjs';
const none = pending.parsePendingMigrationList('No unapplied migrations found.', []);
assert.deepEqual(none.pending, []);
assert.equal(none.recognized, true);
const noneWrangler = pending.parsePendingMigrationList('No migrations to apply.', []);
assert.deepEqual(noneWrangler.pending, [], 'Wrangler no migrations to apply musi być rozpoznane jako pusta lista.');
assert.throws(() => pending.parsePendingMigrationList('D1 result not understood', []), /Nie udało się bezpiecznie odczytać/);
assert.throws(() => pending.parsePendingMigrationList('Pending: 0018_unknown_operation.sql', []), /nieznane lokalnie migracje/);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fix49-migration-'));
try {
  fs.writeFileSync(path.join(root, '0018_add_note.sql'), 'ALTER TABLE users ADD COLUMN note TEXT;');
  fs.writeFileSync(path.join(root, '0019_drop_users.sql'), 'DROP TABLE users;');
  const safeList = pending.parsePendingMigrationList('Unapplied migrations:\n0018_add_note.sql', ['0018_add_note.sql','0019_drop_users.sql']);
  const safeAudit = pending.auditPendingMigrationFiles(safeList.pending, root);
  assert.equal(safeAudit.safeCount, 1);
  const unsafeList = pending.parsePendingMigrationList('Unapplied migrations:\n0019_drop_users.sql', ['0018_add_note.sql','0019_drop_users.sql']);
  assert.throws(() => pending.auditPendingMigrationFiles(unsafeList.pending, root), /wysokiego ryzyka/);
} finally { fs.rmSync(root, { recursive: true, force: true }); }
console.log('PASS FIX49 pending migration gate: exact remote list parsing, safe additive migration accepted, destructive pending migration blocked, unknown output fails closed.');
