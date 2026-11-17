'use strict';

// Validate the shared PBKDF2 implementation without assuming that its internals
// are inlined into functions/api/session.js. The route imports the helper module.
function assertSharedPasswordKdfContract({ accountApi, kdfSource, resetApi }, caller = 'release') {
  const accountRequired = [
    "from '../_password-kdf.js'",
    'createPasswordSalt',
    'derivePassword',
    'isSupportedPasswordSalt',
    'registerEmailAccount',
    'loginEmailAccount',
    "purpose === 'register'",
    "purpose === 'login'",
    'accountSchemaStatus'
  ];
  const kdfRequired = [
    'PBKDF2_ITERATIONS = 100000',
    'export function createPasswordSalt()',
    'export async function derivePassword',
    "name: 'PBKDF2'",
    "hash: 'SHA-256'",
    'pbkdf2-sha256$'
  ];
  const resetRequired = ["from '../../../_password-kdf.js'", 'createPasswordSalt', 'derivePassword'];
  const missing = [
    ...accountRequired.filter(token => !String(accountApi || '').includes(token)).map(token => `session.js:${token}`),
    ...kdfRequired.filter(token => !String(kdfSource || '').includes(token)).map(token => `_password-kdf.js:${token}`),
    ...resetRequired.filter(token => !String(resetApi || '').includes(token)).map(token => `password/reset.js:${token}`)
  ];
  if (/210000/.test(`${accountApi || ''}\n${kdfSource || ''}\n${resetApi || ''}`)) {
    missing.push('stary limit 210000');
  }
  if (missing.length) {
    throw new Error(`${caller}: niekompletny wspólny KDF rejestracji/logowania/resetu: ${missing.join(', ')}`);
  }
  return true;
}

module.exports = { assertSharedPasswordKdfContract };
