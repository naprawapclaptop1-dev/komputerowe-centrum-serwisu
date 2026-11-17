'use strict';
const path = require('node:path');
const SOURCE_EXTENSIONS = new Set(['.js','.mjs','.cjs','.html','.toml','.json','.jsonc','.yml','.yaml','.env','.txt']);
const SECRET_PATTERNS = [
  { id: 'PRIVATE_KEY', severity: 'critical', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { id: 'OPENAI_SECRET_VALUE', severity: 'critical', regex: /\b(?:OPENAI_API_KEY|OPENAI_KEY)\s*[:=]\s*["'](sk-[A-Za-z0-9_-]{24,})["']/gi },
  { id: 'CLOUDFLARE_TOKEN_VALUE', severity: 'critical', regex: /\b(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN)\s*[:=]\s*["']([A-Za-z0-9._-]{32,})["']/gi },
  { id: 'GENERIC_BEARER_LITERAL', severity: 'high', regex: /\bAuthorization\s*[:=]\s*["']Bearer\s+([A-Za-z0-9._-]{32,})["']/gi }
];
function isExcluded(relativePath) {
  const p = relativePath.replace(/\\/g, '/');
  return /(^|\/)(?:node_modules|\.git|BACKUPS_D1|dist|build|coverage)(\/|$)/i.test(p) || /(?:^|\/)(?:TEST_LOG|README|CHANGELOG|TEST_REPORT).*\.txt$/i.test(p);
}
function scanText(relativePath, content) {
  const ext = path.extname(relativePath).toLowerCase();
  if (!SOURCE_EXTENSIONS.has(ext) && !/(^|\/)\.env(?:\.|$)/i.test(relativePath)) return [];
  const findings = [];
  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(content))) {
      const line = content.slice(0, match.index).split('\n').length;
      const captured = String(match[1] || '');
      if (/^(?:YOUR_|CHANGEME|REPLACE_|EXAMPLE|DUMMY|TEST_|<|\$\{)/i.test(captured)) continue;
      findings.push({ rule: pattern.id, severity: pattern.severity, file: relativePath, line });
      if (pattern.regex.lastIndex === match.index) pattern.regex.lastIndex++;
    }
  }
  return findings;
}
module.exports = { SOURCE_EXTENSIONS, isExcluded, scanText };
