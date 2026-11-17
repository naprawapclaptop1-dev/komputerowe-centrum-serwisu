'use strict';

function uncommentTomlLine(line) {
  let quote = '', escaped = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\' && quote === '"') escaped = true;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '#') return line.slice(0, i);
  }
  return line;
}

function parseTomlScalar(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (value.startsWith('"')) {
    try { return JSON.parse(value); } catch { throw new Error(`Niepoprawny ciąg TOML: ${value}`); }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw new Error(`Niepoprawny ciąg TOML: ${value}`);
    return value.slice(1, -1);
  }
  return value;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getTomlArrayTableRecords(text, tableName) {
  const lines = String(text || '').split(/\r?\n/);
  const header = new RegExp(`^\\s*\\[\\[\\s*${escapeRegExp(tableName)}\\s*\\]\\]\\s*(?:#.*)?$`);
  const records = [];
  for (let i = 0; i < lines.length; i++) {
    if (!header.test(uncommentTomlLine(lines[i]).trim())) continue;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*\[\[?[^\]]+\]\]?\s*(?:#.*)?$/.test(uncommentTomlLine(lines[j]).trim())) {
        end = j;
        break;
      }
    }
    const fields = {};
    for (let j = i + 1; j < end; j++) {
      const line = uncommentTomlLine(lines[j]).trim();
      const m = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.*?)\s*$/);
      if (m) fields[m[1]] = parseTomlScalar(m[2]);
    }
    records.push({ start: i, end, fields });
  }
  return records;
}

function upsertTomlArrayTable(text, tableName, binding) {
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const records = getTomlArrayTableRecords(lines.join('\n'), tableName);
  const matches = records.filter(record => String(record.fields.binding || '') === binding.binding);
  if (matches.length > 1) {
    throw new Error(`Konfiguracja TOML zawiera kilka wpisów ${tableName} dla bindingu ${binding.binding}. Nie zmieniam konfiguracji automatycznie.`);
  }

  if (matches.length === 1) {
    const record = matches[0];
    const currentId = String(record.fields.database_id || '').trim();
    if (currentId && currentId.toLowerCase() !== String(binding.database_id).toLowerCase()) {
      throw new Error(`Konflikt produkcyjnego D1 ${tableName}: binding ${binding.binding} wskazuje ${currentId}, a potwierdzona baza ma ID ${binding.database_id}.`);
    }
    const section = lines.slice(record.start, record.end);
    const set = (key, value) => {
      const found = [];
      for (let i = 1; i < section.length; i++) {
        if (new RegExp(`^${escapeRegExp(key)}\\s*=`).test(uncommentTomlLine(section[i]).trim())) found.push(i);
      }
      if (found.length > 1) throw new Error(`Powielone pole ${key} w ${tableName}/${binding.binding}.`);
      const row = `${key} = ${JSON.stringify(value)}`;
      if (found.length === 1) section[found[0]] = row;
      else section.push(row);
    };
    set('binding', binding.binding);
    set('database_name', binding.database_name);
    set('database_id', binding.database_id);
    lines.splice(record.start, record.end - record.start, ...section);
  } else {
    if (lines.some(line => /^\s*\[\[?env\.production\.d1_databases\]\]?/.test(uncommentTomlLine(line).trim())) && tableName === 'env.production.d1_databases') {
      // Existing production D1 entries for other bindings are retained; append DB as a separate array-table record.
    }
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.push('', `[[${tableName}]]`, `binding = ${JSON.stringify(binding.binding)}`, `database_name = ${JSON.stringify(binding.database_name)}`, `database_id = ${JSON.stringify(binding.database_id)}`);
  }
  return lines.join('\r\n');
}

function writeTomlProductionD1Bindings(original, binding) {
  if (!binding || !binding.binding || !binding.database_name || !binding.database_id) {
    throw new Error('Niepełne dane bindingu D1 do zapisania w Wrangler TOML.');
  }
  let text = String(original || '').replace(/^\uFEFF/, '');
  text = upsertTomlArrayTable(text, 'd1_databases', binding);
  text = upsertTomlArrayTable(text, 'env.production.d1_databases', binding);
  return text.replace(/\r?\n/g, '\r\n').replace(/\r\n*$/, '\r\n');
}

function ensureJsonProductionD1Bindings(config, binding) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Niepoprawny obiekt konfiguracji Wrangler JSON.');
  const ensure = (container, field, label) => {
    if (!Array.isArray(container[field])) {
      if (container[field] !== undefined) throw new Error(`Pole ${label} nie jest tablicą.`);
      container[field] = [];
    }
    const records = container[field].filter(item => item && item.binding === binding.binding);
    if (records.length > 1) throw new Error(`Powielony binding ${binding.binding} w ${label}.`);
    if (records.length === 1) {
      const currentId = String(records[0].database_id || '').trim();
      if (currentId && currentId.toLowerCase() !== String(binding.database_id).toLowerCase()) {
        throw new Error(`Konflikt bindingu ${binding.binding} w ${label}: ${currentId} != ${binding.database_id}.`);
      }
      const before = JSON.stringify(records[0]);
      Object.assign(records[0], binding);
      return before !== JSON.stringify(records[0]);
    }
    container[field].push({ ...binding });
    return true;
  };

  let changed = ensure(config, 'd1_databases', 'd1_databases');
  config.env ||= {};
  if (!config.env || typeof config.env !== 'object' || Array.isArray(config.env)) throw new Error('Niepoprawne pole env w konfiguracji Wrangler.');
  config.env.production ||= {};
  if (!config.env.production || typeof config.env.production !== 'object' || Array.isArray(config.env.production)) throw new Error('Niepoprawne pole env.production w konfiguracji Wrangler.');
  changed = ensure(config.env.production, 'd1_databases', 'env.production.d1_databases') || changed;
  return changed;
}


function hasTomlProductionD1Binding(text, bindingName = 'DB', expectedId = '') {
  const rows = getTomlArrayTableRecords(text, 'env.production.d1_databases');
  const matches = rows.filter(record => String(record.fields.binding || '') === bindingName);
  if (matches.length !== 1) return false;
  const id = String(matches[0].fields.database_id || '').trim().toLowerCase();
  return !!id && (!expectedId || id === String(expectedId).trim().toLowerCase());
}

function stripJsonComments(text) {
  let out = '', inString = false, escaped = false;
  const source = String(text || '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (inString) {
      out += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && next === '/') { while (i < source.length && source[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && next === '*') { i += 2; while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++; i++; out += ' '; continue; }
    out += c;
  }
  return out.replace(/,\s*([}\]])/g, '$1');
}

function hasJsonProductionD1Binding(text, bindingName = 'DB', expectedId = '') {
  try {
    const config = JSON.parse(stripJsonComments(text));
    const rows = config?.env?.production?.d1_databases;
    if (!Array.isArray(rows)) return false;
    const matches = rows.filter(item => item && item.binding === bindingName);
    if (matches.length !== 1) return false;
    const id = String(matches[0].database_id || '').trim().toLowerCase();
    return !!id && (!expectedId || id === String(expectedId).trim().toLowerCase());
  } catch { return false; }
}

function hasProductionD1Binding(config, bindingName = 'DB', expectedId = '') {
  const rows = config?.env?.production?.d1_databases;
  if (!Array.isArray(rows)) return false;
  const matches = rows.filter(item => item && item.binding === bindingName);
  if (matches.length !== 1) return false;
  const id = String(matches[0].database_id || '').trim().toLowerCase();
  return !!id && (!expectedId || id === String(expectedId).trim().toLowerCase());
}

module.exports = {
  getTomlArrayTableRecords,
  writeTomlProductionD1Bindings,
  ensureJsonProductionD1Bindings,
  hasProductionD1Binding,
  hasTomlProductionD1Binding,
  hasJsonProductionD1Binding
};
