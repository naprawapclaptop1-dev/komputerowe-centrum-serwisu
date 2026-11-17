import assert from 'node:assert/strict';
import { CORE_MIGRATION_NAMES, OPTIONAL_HISTORICAL_MIGRATION_NAMES, validateMigrationInventory } from './migration-inventory-compat-fix62.mjs';

const tests = [];
const test = (name, fn) => { fn(); tests.push(name); };
const baseline = [...CORE_MIGRATION_NAMES];
const withHistoricalPair = [...baseline, ...OPTIONAL_HISTORICAL_MIGRATION_NAMES];

test('17-file base inventory is accepted', () => {
  const result = validateMigrationInventory(baseline);
  assert.equal(result.ok, true);
  assert.equal(result.actualCount, 17);
  assert.equal(result.optionalHistoricalCount, 0);
});

test('19-file existing workspace inventory is accepted only with both approved historical files', () => {
  const result = validateMigrationInventory(withHistoricalPair);
  assert.equal(result.ok, true);
  assert.equal(result.actualCount, 19);
  assert.equal(result.optionalHistoricalCount, 2);
});

test('missing core migration is rejected', () => {
  const result = validateMigrationInventory(baseline.slice(1));
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'missing-required-migrations');
});

test('unrecognized migration file is rejected', () => {
  const result = validateMigrationInventory([...baseline, '0018_unreviewed_change.sql']);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unrecognized-migration-files');
});

test('partial optional historical pair is rejected', () => {
  const result = validateMigrationInventory([...baseline, OPTIONAL_HISTORICAL_MIGRATION_NAMES[0]]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'incomplete-historical-pair');
});

test('duplicate migration filename is rejected', () => {
  const result = validateMigrationInventory([...baseline, baseline[0]]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'duplicate-migration-names');
});

console.log(tests.map(name => `[PASS] ${name}`).join('\n'));
console.log(`FIX62 MIGRATION INVENTORY COMPATIBILITY: ${tests.length}/${tests.length} PASS`);
