/* NAUKA OD A DO Z — lokalna kopia postępu nauki i notatek — FIX10 */
(() => {
  'use strict';
  const SCHEMA = 'NAUKA_OD_A_DO_Z_LOCAL_PROGRESS';
  const VERSION = 1;
  const MAX_BYTES = 5 * 1024 * 1024;
  const ALLOWED = Object.freeze({
    academyCompletedLessons: 'array',
    academyGuideSteps: 'object',
    academyChecklist: 'object',
    academyLongVideoDone: 'array',
    academyAlsCaseDone: 'object',
    academyAlsExamLast: 'object',
    academyAlsSolderProgress: 'object',
    academyLab45Assignments: 'object',
    academyLab45PowerDone: 'object',
    academyLab45Recovery: 'object',
    academyLabTraining: 'object',
    academyLabModels: 'object',
    academyLabExamLast: 'object',
    academyLabLastTriage: 'object',
    academyU6BoardNotes: 'array',
    academyU6RepairCases: 'array',
    academyLanguage: 'string',
    academyMeasurementLog: 'array'
  });
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const clone = value => JSON.parse(JSON.stringify(value));
  const validType = (value, type) => type === 'array' ? Array.isArray(value) : type === 'object' ? isObject(value) : typeof value === type;
  const serialKey = value => { try { return JSON.stringify(value); } catch { return String(value); } };
  function mergeValue(current, incoming) {
    if (Array.isArray(current) && Array.isArray(incoming)) {
      const result = current.slice(); const seen = new Set(result.map(serialKey));
      for (const item of incoming) { const key = serialKey(item); if (!seen.has(key)) { seen.add(key); result.push(item); } }
      return result;
    }
    if (isObject(current) && isObject(incoming)) {
      const result = clone(current);
      for (const [key, value] of Object.entries(incoming)) result[key] = key in result ? mergeValue(result[key], value) : clone(value);
      return result;
    }
    return clone(incoming);
  }
  function collect(storage) {
    const progress = {};
    for (const [key, type] of Object.entries(ALLOWED)) {
      const raw = storage.getItem(key);
      if (raw === null) continue;
      try { const value = JSON.parse(raw); if (validType(value, type)) progress[key] = value; } catch { /* pomiń uszkodzony wpis */ }
    }
    return progress;
  }
  function makeBackup(storage, date = new Date().toISOString()) {
    return { schema: SCHEMA, schemaVersion: VERSION, app: 'NAUKA OD A DO Z', exportedAt: date, progress: collect(storage) };
  }
  function parseBackup(input) {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    if (new TextEncoder().encode(raw).length > MAX_BYTES) throw new Error('Plik kopii przekracza limit 5 MB.');
    let data; try { data = JSON.parse(raw); } catch { throw new Error('Plik nie jest prawidłowym JSON.'); }
    if (!isObject(data) || data.schema !== SCHEMA || data.schemaVersion !== VERSION || !isObject(data.progress)) throw new Error('Nieobsługiwany format kopii postępu.');
    const progress = {};
    for (const [key, value] of Object.entries(data.progress)) {
      if (!(key in ALLOWED)) continue;
      if (!validType(value, ALLOWED[key])) throw new Error(`Nieprawidłowy typ danych: ${key}.`);
      progress[key] = value;
    }
    if (!Object.keys(progress).length) throw new Error('Kopia nie zawiera rozpoznanych danych nauki.');
    return { progress, exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '' };
  }
  function importBackup(storage, input) {
    const parsed = parseBackup(input); const before = new Map();
    try {
      for (const [key, incoming] of Object.entries(parsed.progress)) {
        before.set(key, storage.getItem(key));
        let current = null;
        try { const raw = storage.getItem(key); current = raw === null ? null : JSON.parse(raw); } catch { current = null; }
        const merged = current === null || !validType(current, ALLOWED[key]) ? clone(incoming) : mergeValue(current, incoming);
        storage.setItem(key, JSON.stringify(merged));
      }
    } catch (error) {
      for (const [key, oldValue] of before) { try { if (oldValue === null) storage.removeItem(key); else storage.setItem(key, oldValue); } catch { /* rollback best effort */ } }
      throw new Error(`Nie udało się zapisać kopii. Przywrócono poprzednie dane. ${error.message || ''}`.trim());
    }
    return Object.keys(parsed.progress);
  }
  const api = Object.freeze({ schema: SCHEMA, version: VERSION, allowedKeys: Object.keys(ALLOWED), collect, makeBackup, parseBackup, importBackup, mergeValue });
  if (typeof window !== 'undefined') window.NP_PROGRESS_BACKUP = api;
  function init() {
    const root = document.getElementById('npbProgressBackup');
    if (!root || root.dataset.ready === '1') return;
    root.dataset.ready = '1';
    const status = root.querySelector('#npbBackupStatus');
    const summary = root.querySelector('#npbBackupSummary');
    const exportButton = root.querySelector('#npbExportBackup');
    const importInput = root.querySelector('#npbImportBackup');
    const say = (message, bad = false) => { if (status) { status.textContent = message; status.classList.toggle('error', bad); status.classList.toggle('success', !bad); } };
    const refresh = () => {
      try { const data = collect(localStorage); const lessons = data.academyCompletedLessons?.length || 0; const groups = Object.keys(data).length; if (summary) summary.textContent = `${groups} grup danych · ${lessons} ukończonych lekcji · dane pozostają na tym urządzeniu do czasu eksportu`; }
      catch { if (summary) summary.textContent = 'Przeglądarka ogranicza dostęp do lokalnego zapisu.'; }
    };
    exportButton?.addEventListener('click', () => {
      try {
        const backup = makeBackup(localStorage); const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `nauka-od-a-do-z-postep-${new Date().toISOString().slice(0,10)}.json`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); say(`Utworzono kopię: ${Object.keys(backup.progress).length} grup danych.`); refresh();
      } catch (error) { say(`Eksport nie powiódł się: ${error.message || 'błąd zapisu'}`, true); }
    });
    importInput?.addEventListener('change', async () => {
      const file = importInput.files?.[0]; if (!file) return;
      try { if (file.size > MAX_BYTES) throw new Error('Plik kopii przekracza limit 5 MB.'); const text = await file.text(); const keys = importBackup(localStorage, text); say(`Zaimportowano i połączono ${keys.length} grup danych. Istniejący postęp został zachowany.`); refresh(); window.dispatchEvent(new StorageEvent('storage', { key: 'academyCompletedLessons' })); }
      catch (error) { say(error.message || 'Nie udało się zaimportować kopii.', true); }
      finally { importInput.value = ''; }
    });
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
