'use strict';
function stripSqlComments(sql) {
  return String(sql || '')
    .replace(/--[^\r\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}
function analyzeMigrationSql(sql) {
  const cleaned = stripSqlComments(sql);
  const statements = cleaned.split(';').map(s => s.trim()).filter(Boolean);
  const findings = [];
  for (let index = 0; index < statements.length; index++) {
    const statement = statements[index].replace(/\s+/g, ' ');
    const upper = statement.toUpperCase();
    const add = (rule, severity, detail) => findings.push({ statement: index + 1, rule, severity, detail: detail || statement.slice(0, 180) });
    if (/\bDROP\s+TABLE\b/i.test(statement)) add('DROP_TABLE', 'critical', 'Usunięcie tabeli może bezpowrotnie usunąć dane.');
    if (/\bTRUNCATE\s+TABLE\b/i.test(statement)) add('TRUNCATE_TABLE', 'critical', 'TRUNCATE usuwa zawartość tabeli.');
    if (/\bDELETE\s+FROM\b/i.test(statement) && !/\bWHERE\b/i.test(statement)) add('DELETE_WITHOUT_WHERE', 'critical', 'DELETE bez WHERE może usunąć wszystkie rekordy.');
    if (/^\s*UPDATE\b/i.test(statement) && !/\bWHERE\b/i.test(statement)) add('UPDATE_WITHOUT_WHERE', 'high', 'UPDATE bez WHERE może zmienić wszystkie rekordy.');
    if (/\bALTER\s+TABLE\b[\s\S]*\bDROP\s+COLUMN\b/i.test(statement)) add('DROP_COLUMN', 'critical', 'DROP COLUMN może usunąć dane kolumny.');
    if (/\bALTER\s+TABLE\b[\s\S]*\bRENAME\s+TO\b/i.test(statement)) add('RENAME_TABLE', 'high', 'Zmiana nazwy tabeli może przerwać istniejące integracje.');
    if (/\bPRAGMA\s+WRITABLE_SCHEMA\s*=\s*ON\b/i.test(statement)) add('WRITABLE_SCHEMA', 'critical', 'Modyfikacja sqlite_schema wymaga wyjątkowej ostrożności.');
    if (/\bCREATE\s+TABLE\b/i.test(statement)) add('CREATE_TABLE', 'info', 'Dodanie tabeli — sprawdź indeksy i klucze obce.');
    if (/\bALTER\s+TABLE\b[\s\S]*\bADD\s+COLUMN\b/i.test(statement)) add('ADD_COLUMN', 'info', 'Addytywna zmiana schematu — sprawdź wartość domyślną i kompatybilność.');
    if (!upper) continue;
  }
  const highRisk = findings.some(x => ['critical','high'].includes(x.severity));
  return { statementCount: statements.length, findings, safeForAutomaticApply: !highRisk, reviewRequired: highRisk };
}
module.exports = { stripSqlComments, analyzeMigrationSql };
