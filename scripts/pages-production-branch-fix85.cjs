'use strict';
const path = require('node:path');

function validateBranch(value) {
  const rawBranch = String(value ?? '');
  const branch = rawBranch.trim();
  if (rawBranch !== branch || !branch || branch.length > 200 || branch.startsWith('-') || /[\s\u0000-\u001f]/.test(branch) || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch) || branch.includes('..') || branch.includes('//') || branch.endsWith('/') || branch.endsWith('.') || branch.includes('@{') || branch.split('/').some(part => part.startsWith('.') || part.endsWith('.lock'))) {
    throw new TypeError('Brak lub nieprawidłowa nazwa Production Branch potwierdzonej przez Cloudflare.');
  }
  return branch;
}

function buildProductionBranchArgs({ directory, projectName, productionBranch, commitMessage } = {}) {
  if (typeof directory !== 'string' || !directory.trim()) throw new TypeError('Brak katalogu wyjściowego Pages.');
  if (!path.isAbsolute(directory)) throw new TypeError('Katalog wyjściowy Pages musi być ścieżką absolutną.');
  if (typeof projectName !== 'string' || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(projectName)) throw new TypeError('Nieprawidłowa nazwa istniejącego projektu Pages.');
  const branch = validateBranch(productionBranch);
  if (typeof commitMessage !== 'string' || !commitMessage.trim() || commitMessage.length > 240) throw new TypeError('Nieprawidłowy komunikat deploymentu.');

  const args = [
    'pages', 'deploy', directory,
    '--project-name', projectName,
    '--branch', branch,
    '--commit-dirty',
    '--commit-message', commitMessage
  ];
  assertProductionBranchArgs(args, branch);
  return args;
}

function assertProductionBranchArgs(args, expectedProductionBranch) {
  const expected = validateBranch(expectedProductionBranch);
  if (!Array.isArray(args) || args[0] !== 'pages' || args[1] !== 'deploy') throw new TypeError('Nieprawidłowe polecenie Wrangler Pages deploy.');
  if (args.includes('--env') || args.some(arg => String(arg).startsWith('--env='))) throw new Error('BLOKADA: produkcyjny Direct Upload nie może używać środowiska preview.');
  const occurrences = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--branch') occurrences.push(String(args[i + 1] || ''));
    else if (String(args[i]).startsWith('--branch=')) occurrences.push(String(args[i]).slice('--branch='.length));
  }
  if (occurrences.length !== 1 || occurrences[0] !== expected) {
    throw new Error(`BLOKADA FIX85: deployment musi jawnie wskazywać wyłącznie potwierdzoną Production Branch "${expected}"; otrzymano: ${occurrences.join(', ') || 'brak'}.`);
  }
  const projectIndex = args.indexOf('--project-name');
  if (projectIndex < 0 || !args[projectIndex + 1]) throw new Error('Brak jawnej nazwy istniejącego projektu Pages.');
  return true;
}

function extractDeploymentUrl(stdout, projectName) {
  if (typeof projectName !== 'string' || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(projectName)) return '';
  const escaped = projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`https:\\/\\/[a-z0-9-]+\\.${escaped}\\.pages\\.dev`, 'ig');
  const matches = String(stdout || '').match(pattern);
  return matches?.length ? matches[matches.length - 1] : '';
}

module.exports = { validateBranch, buildProductionBranchArgs, assertProductionBranchArgs, extractDeploymentUrl };
