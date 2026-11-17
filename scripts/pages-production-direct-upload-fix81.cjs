'use strict';
const path = require('node:path');

/**
 * Cloudflare Pages Direct Upload production deployment.
 * For Direct Upload projects, `wrangler pages deploy <dir>` targets production.
 * Supplying `--branch` creates a branch/preview deployment instead.
 */
function buildProductionDirectUploadArgs({ directory, projectName, commitMessage }) {
  if (typeof directory !== 'string' || !directory.trim()) {
    throw new TypeError('Brak katalogu wyjściowego Pages.');
  }
  if (!path.isAbsolute(directory)) {
    throw new TypeError('Katalog wyjściowy Pages musi być ścieżką absolutną.');
  }
  if (typeof projectName !== 'string' || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(projectName)) {
    throw new TypeError('Nieprawidłowa nazwa istniejącego projektu Pages.');
  }
  if (typeof commitMessage !== 'string' || !commitMessage.trim() || commitMessage.length > 240) {
    throw new TypeError('Nieprawidłowy komunikat deploymentu.');
  }

  const args = [
    'pages', 'deploy', directory,
    '--project-name', projectName,
    '--commit-dirty',
    '--commit-message', commitMessage
  ];
  assertProductionDirectUploadArgs(args);
  return args;
}

function assertProductionDirectUploadArgs(args) {
  if (!Array.isArray(args) || args[0] !== 'pages' || args[1] !== 'deploy') {
    throw new TypeError('Nieprawidłowe polecenie Wrangler Pages deploy.');
  }
  if (args.some((arg, index) => arg === '--branch' || String(arg).startsWith('--branch='))) {
    throw new Error('BLOKADA: --branch w Pages Direct Upload kieruje deployment do preview, nie do produkcji.');
  }
  if (args.includes('--env') || args.some(arg => String(arg).startsWith('--env='))) {
    throw new Error('BLOKADA: produkcyjny Direct Upload nie może używać środowiska preview.');
  }
  const projectIndex = args.indexOf('--project-name');
  if (projectIndex < 0 || !args[projectIndex + 1]) {
    throw new Error('Brak jawnej nazwy istniejącego projektu Pages.');
  }
  return true;
}

module.exports = { buildProductionDirectUploadArgs, assertProductionDirectUploadArgs };
