// Shared password KDF for registration, login and password reset.
// Cloudflare Workers WebCrypto rejects PBKDF2 iteration counts above 100,000.
// Salt values are versioned so a future KDF upgrade can be performed explicitly.
export const PBKDF2_ITERATIONS = 100000;
const PREFIX = `pbkdf2-sha256$${PBKDF2_ITERATIONS}$`;
const DUMMY_ENCODED_SALT = 'YWNhZGVteS1kdW1teS0xNg';
export const DUMMY_PASSWORD_SALT = `${PREFIX}${DUMMY_ENCODED_SALT}`;

const toBase64Url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

function decodeEncodedSalt(encoded) {
  if (!/^[A-Za-z0-9_-]{22}$/.test(encoded)) throw new Error('PASSWORD_SALT_INVALID');
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - encoded.length % 4) % 4);
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  if (bytes.length !== 16) throw new Error('PASSWORD_SALT_INVALID');
  return bytes;
}

export function isSupportedPasswordSalt(value) {
  const salt = String(value || '');
  if (!salt.startsWith(PREFIX)) return false;
  try { decodeEncodedSalt(salt.slice(PREFIX.length)); return true; }
  catch { return false; }
}

export function createPasswordSalt() {
  return `${PREFIX}${toBase64Url(crypto.getRandomValues(new Uint8Array(16)))}`;
}

export async function derivePassword(password, salt) {
  const value = String(salt || '');
  if (!isSupportedPasswordSalt(value)) throw new Error('PASSWORD_KDF_VERSION_UNSUPPORTED');
  const saltBytes = decodeEncodedSalt(value.slice(PREFIX.length));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: saltBytes,
    iterations: PBKDF2_ITERATIONS,
    hash: 'SHA-256'
  }, key, 256);
  return toBase64Url(bits);
}
