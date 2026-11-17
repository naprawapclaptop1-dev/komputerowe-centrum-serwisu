'use strict';

/**
 * Helpers for identifying an existing D1 database for Akademia Serwisu PRO.
 * These functions never create or modify Cloudflare resources.
 */
function getProductionD1Binding(payload, bindingName = 'DB') {
  const project = payload && payload.result && typeof payload.result === 'object'
    ? payload.result
    : payload;
  const configs = project && (project.deployment_configs || project.deploymentConfigs);
  const production = configs && configs.production;
  if (!production || typeof production !== 'object') {
    return { status: 'unavailable', reason: 'Brak deployment_configs.production w odpowiedzi Pages API.' };
  }

  const databases = production.d1_databases || production.d1Databases || {};
  if (!databases || typeof databases !== 'object' || Array.isArray(databases)) {
    return { status: 'invalid', reason: 'Niepoprawna mapa production.d1_databases.' };
  }

  const binding = databases[bindingName];
  if (!binding) {
    const names = Object.keys(databases);
    return names.length
      ? { status: 'other-bindings', bindings: names, reason: `Projekt ma produkcyjne bindingi D1 (${names.join(', ')}), ale nie ma wymaganego bindingu ${bindingName}.` }
      : { status: 'missing', bindings: [], reason: `Projekt Pages nie ma produkcyjnego bindingu D1 ${bindingName}.` };
  }

  const id = String(binding.id || binding.database_id || binding.databaseId || '').trim();
  if (!id) return { status: 'invalid', reason: `Binding ${bindingName} nie zawiera ID bazy D1.` };
  return { status: 'found', binding: bindingName, id };
}

function collectD1TableNames(node, output = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectD1TableNames(item, output);
  } else if (node && typeof node === 'object') {
    if (typeof node.name === 'string' && ['table', 'view'].includes(String(node.type || '').toLowerCase())) {
      output.push(node.name);
    }
    for (const child of Object.values(node)) collectD1TableNames(child, output);
  }
  return [...new Set(output)].sort((a, b) => a.localeCompare(b));
}

const ACADEMY_CORE_TABLES = [
  'academy_users', 'academy_sessions', 'academy_conversations',
  'academy_messages', 'academy_knowledge', 'academy_site_daily_visits'
];
const LEARNING_CORE_TABLES = [
  'learning_accounts', 'learning_catalog', 'learning_entitlements',
  'learning_google_identities', 'learning_memberships', 'learning_purchases',
  'learning_sessions'
];

function scoreD1Tables(tables) {
  const names = new Set((Array.isArray(tables) ? tables : []).map(x => String(x).toLowerCase()));
  const academyMatches = ACADEMY_CORE_TABLES.filter(name => names.has(name));
  const learningMatches = LEARNING_CORE_TABLES.filter(name => names.has(name));
  const strongLearning = names.has('learning_catalog') && names.has('learning_accounts') &&
    (names.has('learning_memberships') || names.has('learning_purchases') || names.has('learning_entitlements')) &&
    learningMatches.length >= 4;
  return {
    academyScore: academyMatches.length,
    academyMatches,
    learningScore: learningMatches.length,
    learningMatches,
    strongAcademy: academyMatches.length >= 3,
    strongLearning
  };
}

/**
 * Selects a database only when there is a single strong schema match.
 * preferredId is supplied from a prior explicit user selection recorded by
 * the setup flow. A preferred match still must contain the expected learning
 * schema so a stale or recycled database UUID cannot be selected blindly.
 */
function selectAutomaticD1Candidate(inspected, preferredId = '') {
  const rows = Array.isArray(inspected) ? inspected : [];
  const preferred = String(preferredId || '').trim().toLowerCase();
  if (preferred) {
    const pinned = rows.find(item => String(item.id || '').trim().toLowerCase() === preferred);
    if (pinned) {
      const score = scoreD1Tables(pinned.tables);
      if (score.strongAcademy || score.strongLearning) {
        return {
          status: 'selected',
          candidate: pinned,
          reason: score.strongAcademy
            ? `wcześniej wskazana baza ma rozpoznany schemat Akademii (${score.academyScore}/6)`
            : `wcześniej wskazana baza ma powiązany schemat nauki (${score.learningScore}/7)`
        };
      }
      return {
        status: 'unsafe', candidate: null,
        reason: `ID wcześniej wskazanej bazy ${pinned.name || preferred} istnieje, ale jej tabele nie potwierdzają schematu Akademii ani modułu nauki.`
      };
    }
  }

  const academy = rows.filter(item => scoreD1Tables(item.tables).strongAcademy);
  if (academy.length === 1) {
    return { status: 'selected', candidate: academy[0], reason: 'jedyna istniejąca baza z rozpoznanym schematem academy_*' };
  }
  if (academy.length > 1) {
    return { status: 'ambiguous', candidate: null, reason: `kilka baz ma schemat academy_*: ${academy.map(x => x.name).join(', ')}` };
  }

  const learning = rows.filter(item => scoreD1Tables(item.tables).strongLearning);
  if (learning.length === 1) {
    const score = scoreD1Tables(learning[0].tables);
    return { status: 'selected', candidate: learning[0], reason: `jedyna istniejąca baza z pełnym zestawem tabel modułu nauki (${score.learningScore}/7)` };
  }
  if (learning.length > 1) {
    return { status: 'ambiguous', candidate: null, reason: `kilka baz ma tabele modułu nauki: ${learning.map(x => x.name).join(', ')}` };
  }
  return { status: 'none', candidate: null, reason: 'żadna istniejąca baza nie ma jednoznacznego schematu Akademii ani modułu nauki' };
}

module.exports = {
  getProductionD1Binding,
  collectD1TableNames,
  scoreD1Tables,
  selectAutomaticD1Candidate
};
