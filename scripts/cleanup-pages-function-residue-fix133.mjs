#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Safely quarantine the obsolete FIX131 .mjs helper left behind when a newer
 * ZIP is extracted over an existing project directory. Never delete it.
 * The cleanup is allowed only when the supported .js helper exists and the
 * active Pages route imports that exact helper.
 */
export function cleanupLegacyPhotoProxy(root, options = {}) {
  const projectRoot = path.resolve(root);
  const functionsDir = path.join(projectRoot, 'functions');
  const obsolete = path.join(functionsDir, '_photo-proxy-fix131.mjs');
  const supported = path.join(functionsDir, '_photo-proxy-fix131.js');
  const route = path.join(functionsDir, 'media', 'photos', '[id].js');

  if (!fs.existsSync(obsolete)) return { status: 'clean', moved: false };
  const staleStat = fs.lstatSync(obsolete);
  if (!staleStat.isFile() || staleStat.isSymbolicLink()) {
    throw new Error('FIX133: legacy photo helper is not a regular file; left untouched.');
  }
  if (!fs.existsSync(supported) || !fs.statSync(supported).isFile()) {
    throw new Error('FIX133: supported .js photo helper is missing; legacy .mjs file left untouched.');
  }
  if (!fs.existsSync(route)) {
    throw new Error('FIX133: active photo route is missing; legacy .mjs file left untouched.');
  }
  const routeText = fs.readFileSync(route, 'utf8');
  if (!routeText.includes('../../_photo-proxy-fix131.js')) {
    throw new Error('FIX133: photo route does not import the supported .js helper; legacy file left untouched.');
  }

  const backupDir = path.join(projectRoot, 'BACKUPS_FIX133', 'LEGACY_PAGES_FUNCTIONS');
  fs.mkdirSync(backupDir, { recursive: true });
  const realRoot = fs.realpathSync(projectRoot);
  const realBackupDir = fs.realpathSync(backupDir);
  const realFunctionsDir = fs.realpathSync(functionsDir);
  const backupRelative = path.relative(realRoot, realBackupDir);
  const fromFunctions = path.relative(realFunctionsDir, realBackupDir);
  const backupInsideFunctions = fromFunctions === '' || (!fromFunctions.startsWith('..') && !path.isAbsolute(fromFunctions));
  if (backupRelative.startsWith('..') || path.isAbsolute(backupRelative) || backupInsideFunctions) {
    throw new Error('FIX133: backup directory resolves outside the project or into functions/; legacy file left untouched.');
  }
  const baseName = '_photo-proxy-fix131.mjs';
  let backup = path.join(backupDir, baseName);
  let suffix = 1;
  while (fs.existsSync(backup)) {
    backup = path.join(backupDir, `_photo-proxy-fix131_${String(suffix).padStart(3, '0')}.mjs`);
    suffix += 1;
  }
  if (options.dryRun) return { status: 'would-quarantine', moved: false, backup };

  // Same-volume rename preserves the original bytes and avoids destructive deletion.
  fs.renameSync(obsolete, backup);
  if (fs.existsSync(obsolete) || !fs.existsSync(backup)) {
    throw new Error('FIX133: could not safely quarantine the obsolete helper.');
  }
  return { status: 'quarantined', moved: true, backup: path.relative(projectRoot, backup).replace(/\\/g, '/') };
}
