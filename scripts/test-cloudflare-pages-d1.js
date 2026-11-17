'use strict';
const assert = require('node:assert/strict');
const {
  getProductionD1Binding,
  collectD1TableNames,
  scoreD1Tables,
  selectAutomaticD1Candidate
} = require('./cloudflare-pages-d1');

const id = '6ac0a922-639c-43ee-ba33-5da14c25a533';
assert.deepEqual(
  getProductionD1Binding({ success: true, result: { deployment_configs: { production: { d1_databases: { DB: { id } } } } } }),
  { status: 'found', binding: 'DB', id }
);
assert.equal(getProductionD1Binding({ result: { deployment_configs: { production: { d1_databases: {} } } } }).status, 'missing');
assert.equal(getProductionD1Binding({ result: { deployment_configs: { production: { d1_databases: { OTHER_DB: { id } } } } } }).status, 'other-bindings');
assert.equal(getProductionD1Binding({ result: { deployment_configs: { preview: { d1_databases: { DB: { id } } } } } }).status, 'unavailable');
assert.equal(getProductionD1Binding({ result: { deployment_configs: { production: { d1_databases: { DB: {} } } } } }).status, 'invalid');
assert.deepEqual(
  collectD1TableNames([{ results: [{ type: 'table', name: 'academy_users' }, { type: 'view', name: 'academy_overview' }, { type: 'index', name: 'idx_users' }] }]),
  ['academy_overview', 'academy_users']
);

const selectedDb = {
  name: 'naprawapc-orders', id,
  tables: [
    '_cf_KV', 'app_download_events', 'app_installations', 'chat_archives',
    'learning_accounts', 'learning_catalog', 'learning_entitlements',
    'learning_google_identities', 'learning_memberships', 'learning_purchases',
    'learning_sessions', 'orders', 'service_devices'
  ]
};
const unrelatedDb = { name: 'naprawapc-db', id: '00c16b9f-8973-418b-9142-f24566b6f288', tables: ['_cf_KV', 'bookings', 'contacts', 'sessions', 'users'] };
const unrelatedTracking = { name: 'naprawapc-tracking', id: 'b5fbe69d-5917-4492-9121-05ece984bb70', tables: ['_cf_KV', 'app_data', 'bookings', 'contacts', 'orders', 'sessions', 'users'] };

assert.equal(scoreD1Tables(selectedDb.tables).strongLearning, true);
assert.equal(scoreD1Tables(unrelatedDb.tables).strongLearning, false);
assert.equal(
  selectAutomaticD1Candidate([selectedDb, unrelatedDb, unrelatedTracking], id).candidate.name,
  'naprawapc-orders'
);
assert.equal(
  selectAutomaticD1Candidate([selectedDb, unrelatedDb, unrelatedTracking]).candidate.name,
  'naprawapc-orders'
);
assert.equal(
  selectAutomaticD1Candidate([unrelatedDb, unrelatedTracking]).status,
  'none'
);
const academyDb = { name: 'academy-db', id: 'abc', tables: ['academy_users', 'academy_sessions', 'academy_messages'] };
assert.equal(selectAutomaticD1Candidate([academyDb, unrelatedDb]).candidate.name, 'academy-db');
const anotherLearningDb = { name: 'other-learning', id: 'def', tables: ['learning_accounts', 'learning_catalog', 'learning_entitlements', 'learning_memberships'] };
assert.equal(selectAutomaticD1Candidate([selectedDb, anotherLearningDb]).status, 'ambiguous');
const stalePinned = { name: 'reused-db', id, tables: ['orders', 'users'] };
assert.equal(selectAutomaticD1Candidate([stalePinned, unrelatedDb], id).status, 'unsafe');

console.log('OK: binding Pages, odczyt tabel, automatyczny wybór unikalnej bazy Akademii/modułu nauki, blokada niejednoznaczności i starego UUID.');
