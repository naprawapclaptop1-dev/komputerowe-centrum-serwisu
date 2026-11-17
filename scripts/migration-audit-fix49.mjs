import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import core from './migration-audit-core-fix49.cjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'migrations');
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(name => name.endsWith('.sql')).sort() : [];
const results = [];
for (const name of files) {
  const analysis = core.analyzeMigrationSql(fs.readFileSync(path.join(DIR, name), 'utf8'));
  results.push({ file: name, ...analysis });
  console.log(`${analysis.reviewRequired ? 'REVIEW' : 'PASS'} ${name}: ${analysis.statementCount} statements, ${analysis.findings.length} markers`);
  for (const item of analysis.findings.filter(x => x.severity !== 'info')) console.log(`  [${item.severity}] ${item.rule}: ${item.detail}`);
}
const report = { createdAt: new Date().toISOString(), applied: false, statementExecution: false, migrationsScanned: results.length, reviewRequired: results.filter(x => x.reviewRequired).map(x => x.file), results };
fs.writeFileSync(path.join(ROOT, 'MIGRATION_AUDIT_FIX49.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`FIX49 migration simulation: ${results.length} files; ${report.reviewRequired.length} require manual review. No SQL was executed.`);
// Existing historical migrations may intentionally rebuild legacy tables.
// Report these for human review, but do not confuse review markers with pending migrations.
process.exitCode = 0;
