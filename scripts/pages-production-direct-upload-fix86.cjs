'use strict';
const path = require('node:path');

function validateProductionUploadInput({ directory, projectName, commitMessage } = {}) {
  if (typeof directory !== 'string' || !directory.trim() || !path.isAbsolute(directory)) {
    throw new TypeError('Katalog wyjściowy Pages musi być niepustą ścieżką absolutną.');
  }
  if (typeof projectName !== 'string' || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(projectName)) {
    throw new TypeError('Nieprawidłowa nazwa istniejącego projektu Pages.');
  }
  if (typeof commitMessage !== 'string' || !commitMessage.trim() || commitMessage.length > 240) {
    throw new TypeError('Nieprawidłowy komunikat deploymentu.');
  }
}

function buildDirectUploadProductionArgs({ directory, projectName, commitMessage } = {}) {
  validateProductionUploadInput({ directory, projectName, commitMessage });
  const args = [
    'pages', 'deploy', directory,
    '--project-name', projectName,
    '--commit-dirty',
    '--commit-message', commitMessage
  ];
  assertDirectUploadProductionArgs(args, { directory, projectName });
  return args;
}

function assertDirectUploadProductionArgs(args, expected = {}) {
  if (!Array.isArray(args) || args[0] !== 'pages' || args[1] !== 'deploy') {
    throw new TypeError('Nieprawidłowe polecenie Wrangler Pages deploy.');
  }
  if (args.includes('--branch') || args.some(arg => String(arg).startsWith('--branch='))) {
    throw new Error('BLOKADA FIX86: --branch kieruje Direct Upload do środowiska Preview. Produkcja wymaga pominięcia --branch.');
  }
  if (args.includes('--env') || args.some(arg => String(arg).startsWith('--env='))) {
    throw new Error('BLOKADA FIX86: Direct Upload production nie może używać --env.');
  }
  if (args.includes('--production-branch') || args.some(arg => String(arg).startsWith('--production-branch='))) {
    throw new Error('BLOKADA FIX86: --production-branch służy do konfiguracji projektu, nie do deploymentu.');
  }
  const directory = args[2];
  if (typeof directory !== 'string' || !path.isAbsolute(directory)) {
    throw new Error('BLOKADA FIX86: katalog Pages musi być absolutną ścieżką.');
  }
  const projectIndex = args.indexOf('--project-name');
  const projectName = projectIndex >= 0 ? args[projectIndex + 1] : '';
  if (!projectName || (expected.projectName && projectName !== expected.projectName)) {
    throw new Error('BLOKADA FIX86: brakuje --project-name albo deployment wskazuje niewłaściwy istniejący projekt Pages.');
  }
  if (expected.directory && path.resolve(directory) !== path.resolve(expected.directory)) {
    throw new Error('BLOKADA FIX86: deployment wskazuje inny katalog niż zatwierdzony WEB_PUBLISH.');
  }
  if (!args.includes('--commit-dirty') || !args.includes('--commit-message')) {
    throw new Error('BLOKADA FIX86: brakuje metadanych deploymentu.');
  }
  return true;
}

module.exports = { buildDirectUploadProductionArgs, assertDirectUploadProductionArgs };
