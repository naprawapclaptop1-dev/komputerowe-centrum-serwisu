import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKeyPairSync } from 'node:crypto';

// Generates VAPID keys locally. The private key is written only to an ignored local file.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'config');
const outFile = path.join(outDir, 'VAPID_KEYS_LOCAL_ONLY.txt');
if (fs.existsSync(outFile)) {
  console.error(`Plik już istnieje: ${outFile}`);
  console.error('Nie nadpisuję go, aby nie unieważnić wcześniej zapisanych subskrypcji.');
  process.exit(2);
}
const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const privateDer = privateKey.export({ format: 'der', type: 'pkcs8' });
const spki = publicKey.export({ format: 'der', type: 'spki' });
const rawPublic = spki.subarray(spki.length - 65);
if (rawPublic.length !== 65 || rawPublic[0] !== 4) throw new Error('Nieoczekiwany format klucza publicznego P-256.');
const b64url = value => Buffer.from(value).toString('base64url');
const contents = [
  '# FIX232 — SEKRETY LOKALNE. NIE WGRYWAJ TEGO PLIKU DO GIT/ZIP.',
  `VAPID_PUBLIC_KEY=${b64url(rawPublic)}`,
  `VAPID_PRIVATE_KEY_PKCS8=${Buffer.from(privateDer).toString('base64')}`,
  'VAPID_SUBJECT=mailto:admin@example.invalid',
  '',
  '# Zmień VAPID_SUBJECT na prawdziwy adres administratora.',
  '# Skopiuj wartości do Cloudflare Pages Secrets (Production i Preview osobno).',
  '# Nie umieszczaj prywatnego klucza w HTML, JS, release.json ani logach.',
].join('\n');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, contents, { flag: 'wx', mode: 0o600 });
console.log(`Utworzono lokalny plik sekretów: ${path.relative(root, outFile)}`);
console.log('Klucze nie zostały wypisane w konsoli. Przechowuj plik bezpiecznie i nie dołączaj go do publikowanego ZIP.');
