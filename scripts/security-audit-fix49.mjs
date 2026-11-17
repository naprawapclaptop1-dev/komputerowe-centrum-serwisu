import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import core from './security-audit-core-fix49.cjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];
const visited = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full);
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) { if (!core.isExcluded(rel)) walk(full); continue; }
    if (!ent.isFile() || core.isExcluded(rel)) continue;
    const ext = path.extname(ent.name).toLowerCase();
    if (!core.SOURCE_EXTENSIONS.has(ext) && !/^\.env(?:\.|$)/i.test(ent.name)) continue;
    const stat = fs.statSync(full);
    if (stat.size > 5 * 1024 * 1024) continue;
    const source = fs.readFileSync(full, 'utf8');
    visited.push(rel);
    findings.push(...core.scanText(rel, source));
  }
}
for (const folder of ['WEB_PUBLISH','functions','scripts']) if (fs.existsSync(path.join(ROOT, folder))) walk(path.join(ROOT, folder));
for (const file of ['wrangler.toml','wrangler.json','wrangler.jsonc','.env','.dev.vars']) if (fs.existsSync(path.join(ROOT, file))) {
  const rel = file, source = fs.readFileSync(path.join(ROOT, file), 'utf8'); visited.push(rel); findings.push(...core.scanText(rel, source));
}
const report = { createdAt: new Date().toISOString(), scope: 'source/config scan; no secret values printed', filesScanned: visited.length, findings, critical: findings.filter(x => x.severity === 'critical').length, high: findings.filter(x => x.severity === 'high').length };
const out = path.join(ROOT, 'SECURITY_AUDIT_FIX49.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(`Security audit FIX49: ${visited.length} plików, ${report.critical} critical, ${report.high} high.`);
for (const item of findings) console.log(`[${item.severity.toUpperCase()}] ${item.rule} ${item.file}:${item.line} (wartość pominięta)`);
if (report.critical || report.high) process.exitCode = 2;
