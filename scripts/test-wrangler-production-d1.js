'use strict';
const assert = require('assert');
const {
  getTomlArrayTableRecords,
  writeTomlProductionD1Bindings,
  ensureJsonProductionD1Bindings,
  hasProductionD1Binding,
  hasTomlProductionD1Binding,
  hasJsonProductionD1Binding
} = require('./wrangler-production-d1');

const ID = '6ac0a922-639c-43ee-ba33-5da14c25a533';
const ENTRY = { binding: 'DB', database_name: 'naprawapc-orders', database_id: ID };

// Regression fixture matching the 3.8.6 log: root D1 exists, env.production does not.
const initialToml = [
  'name = "naprawa-pc-akademia-serwisu-pro"',
  'pages_build_output_dir = "./WEB_PUBLISH"',
  '',
  '[[d1_databases]]',
  'binding = "DB"',
  'database_name = "naprawapc-orders"',
  `database_id = "${ID}"`,
  '',
  '[env.production]',
  'compatibility_flags = ["nodejs_compat"]',
  '',
  '[vars]',
  'PRESERVE_ME = "yes"',
  ''
].join('\n');

const updatedToml = writeTomlProductionD1Bindings(initialToml, ENTRY);
assert.strictEqual(hasTomlProductionD1Binding(updatedToml, 'DB', ID), true, 'production TOML binding is created');
assert.strictEqual(getTomlArrayTableRecords(updatedToml, 'd1_databases').length, 1, 'root binding is not duplicated');
assert.strictEqual(getTomlArrayTableRecords(updatedToml, 'env.production.d1_databases').length, 1, 'production binding exists once');
assert(updatedToml.includes('PRESERVE_ME = "yes"'), 'unrelated TOML vars are preserved');
assert.strictEqual(hasTomlProductionD1Binding(writeTomlProductionD1Bindings(updatedToml, ENTRY), 'DB', ID), true, 'TOML update is idempotent');

// Preserve other production D1 bindings while adding DB.
const withOtherBinding = updatedToml + '\n[[env.production.d1_databases]]\nbinding = "ANALYTICS"\ndatabase_name = "analytics"\ndatabase_id = "analytics-uuid"\n';
const afterOther = writeTomlProductionD1Bindings(withOtherBinding, ENTRY);
assert.strictEqual(getTomlArrayTableRecords(afterOther, 'env.production.d1_databases').length, 2, 'other production bindings are preserved');

// Never silently replace a production binding that points at another database.
const conflictingToml = initialToml + '\n[[env.production.d1_databases]]\nbinding = "DB"\ndatabase_name = "another"\ndatabase_id = "different-uuid"\n';
assert.throws(() => writeTomlProductionD1Bindings(conflictingToml, ENTRY), /Konflikt produkcyjnego D1/);

// JSON / JSONC object path: add DB at root and under env.production without dropping vars.
const jsonConfig = {
  name: 'naprawa-pc-akademia-serwisu-pro',
  d1_databases: [{ ...ENTRY }],
  env: { production: { vars: { PRESERVE_ME: 'yes' } } }
};
assert.strictEqual(ensureJsonProductionD1Bindings(jsonConfig, ENTRY), true, 'JSON production binding added');
assert.strictEqual(hasProductionD1Binding(jsonConfig, 'DB', ID), true, 'JSON production binding is valid');
assert.strictEqual(jsonConfig.env.production.vars.PRESERVE_ME, 'yes', 'unrelated JSON vars are preserved');
assert.strictEqual(ensureJsonProductionD1Bindings(jsonConfig, ENTRY), false, 'JSON operation is idempotent');
assert.strictEqual(hasJsonProductionD1Binding(JSON.stringify(jsonConfig), 'DB', ID), true, 'JSON file verification succeeds');

const jsonConflict = { env: { production: { d1_databases: [{ ...ENTRY, database_id: 'different-uuid' }] } } };
assert.throws(() => ensureJsonProductionD1Bindings(jsonConflict, ENTRY), /Konflikt bindingu DB/);

console.log('PASS: brakujacy env.production D1 zostaje dodany');
console.log('PASS: root i production maja zgodne ID');
console.log('PASS: inne ustawienia i bindingi zostaja zachowane');
console.log('PASS: operacja jest idempotentna');
console.log('PASS: konflikt innego ID blokuje wdrozenie');
console.log('PASS: JSON/JSONC i TOML sa obslugiwane');
