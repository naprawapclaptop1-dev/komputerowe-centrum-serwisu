// FIX35 — kontrola granic widoku wsparcia i wszystkich samodzielnych zakładek.
'use strict';

function readAttribute(tagText, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(tagText).match(new RegExp(`\\b${escaped}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2] : '';
}

function verifySupportViewStructure(html) {
  if (typeof html !== 'string' || !html.trim()) {
    throw new TypeError('Kontrola FIX35 wymaga pełnej treści index.html.');
  }
  // All view markup is authored before feature scripts. Ignore script source text,
  // which can itself contain HTML snippets inside JavaScript template strings.
  const firstScript = html.search(/<script\b/i);
  const markup = firstScript >= 0 ? html.slice(0, firstScript) : html;
  const stack = [];
  const viewIds = [];
  const requiredSupportNodes = new Set(['supportImpact', 'supportFaq', 'supportRoadmap', 'supportUpdates', 'supportWays', 'supportPayments', 'supportContact']);
  const seenSupportNodes = new Set();
  const tokens = /<\/?(?:div|section)\b[^>]*>/gi;
  let token;

  while ((token = tokens.exec(markup))) {
    const raw = token[0];
    const line = markup.slice(0, token.index).split('\n').length;
    const closing = /^<\s*\//.test(raw);
    const tag = raw.match(/^<\s*\/?\s*(div|section)\b/i)?.[1]?.toLowerCase();
    if (!tag) continue;

    if (closing) {
      const top = stack[stack.length - 1];
      if (!top || top.tag !== tag) {
        throw new Error(`Nieprawidłowe zamknięcie </${tag}> w wierszu ${line}; ostatni otwarty kontener to ${top ? `<${top.tag}>` : 'brak'}. Możliwy wyciek treści poza zakładkę.`);
      }
      stack.pop();
      continue;
    }

    const id = readAttribute(raw, 'id');
    const className = readAttribute(raw, 'class').split(/\s+/).filter(Boolean);
    const node = { tag, id, className, line };
    const inSupport = stack.some(parent => parent.tag === 'section' && parent.id === 'view-support');

    if (id === 'view-support' && stack.some(parent => parent.id === 'view-repairmaster')) {
      throw new Error('Zakładka wsparcia została umieszczona wewnątrz Repair Master AI.');
    }
    if (id === 'view-repairmaster' && stack.some(parent => parent.id === 'view-support')) {
      throw new Error('Repair Master AI został umieszczony wewnątrz zakładki wsparcia.');
    }
    if (className.includes('view-section')) {
      viewIds.push(id);
      if (!stack.some(parent => parent.tag === 'div' && parent.className.includes('content-wrap'))) {
        throw new Error(`Widok ${id || '(bez ID)'} znajduje się poza wspólnym kontenerem content-wrap.`);
      }
      if (stack.some(parent => parent.className?.includes('view-section'))) {
        throw new Error(`Widok ${id || '(bez ID)'} jest zagnieżdżony w innej zakładce zamiast być osobnym ekranem.`);
      }
    }

    const supportNode = requiredSupportNodes.has(id) ||
      className.includes('support-grid') || className.includes('support-transparency');
    if (supportNode) {
      if (!inSupport) {
        throw new Error(`Element wsparcia ${id || className.join('.')} wypada poza #view-support (wiersz ${line}).`);
      }
      if (id) seenSupportNodes.add(id);
      else if (className.includes('support-grid')) seenSupportNodes.add('support-grid');
      else if (className.includes('support-transparency')) seenSupportNodes.add('support-transparency');
    }

    if (!/\/\s*>$/.test(raw)) stack.push(node);
  }

  if (stack.length) {
    const top = stack[stack.length - 1];
    throw new Error(`Nie zamknięto kontenera <${top.tag}>${top.id ? `#${top.id}` : ''} otwartego w wierszu ${top.line}.`);
  }
  if (!viewIds.includes('view-support') || !viewIds.includes('view-repairmaster')) {
    throw new Error('Brakuje niezależnego widoku #view-support lub #view-repairmaster.');
  }
  if (viewIds.length !== 29 || new Set(viewIds).size !== viewIds.length || !viewIds.includes('view-learnpro')) {
    throw new Error(`Oczekiwano 29 odrębnych widoków o unikalnych ID, w tym #view-learnpro; znaleziono ${viewIds.length}.`);
  }
  for (const id of requiredSupportNodes) {
    if (!seenSupportNodes.has(id)) throw new Error(`Brakuje elementu ${id} wewnątrz #view-support.`);
  }
  for (const marker of ['support-grid', 'support-transparency']) {
    if (!seenSupportNodes.has(marker)) throw new Error(`Element ${marker} wypada poza #view-support.`);
  }
  if (!/class=["'][^"']*view-section[^"']*["'][^>]*id=["']view-support["']/i.test(markup) &&
      !/id=["']view-support["'][^>]*class=["'][^"']*view-section/i.test(markup)) {
    throw new Error('#view-support nie jest samodzielnym elementem .view-section.');
  }
  if (!/class=["']nav-item["'][^>]*data-view=["']support["']|data-view=["']support["'][^>]*class=["'][^"']*nav-item/i.test(markup)) {
    throw new Error('Brak osobnej pozycji nawigacji data-view="support".');
  }
  return { viewCount: viewIds.length, supportNodes: seenSupportNodes.size };
}

module.exports = { verifySupportViewStructure };
