/* NAUKA OD A DO Z — dziennik pomiarów serwisowych FIX11.
   Dane wpisuje użytkownik; moduł nie odczytuje miernika ani nie dobiera napięć.
   Wpisy pozostają w localStorage tej przeglądarki i mogą być dołączone do kopii postępu. */
(() => {
  'use strict';
  const KEY = 'academyMeasurementLog';
  const MAX_ENTRIES = 500;
  const MODES = new Set(['voltage', 'resistance', 'continuity', 'diode']);
  const UNITS = new Set(['V', 'mV', 'Ω', 'kΩ']);
  const POWER = new Set(['isolated', 'powered', 'off']);
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const clean = (value, max = 180) => String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  function validateEntry(input) {
    if (!isObject(input)) throw new Error('Nieprawidłowy wpis pomiaru.');
    const mode = clean(input.mode, 24);
    const unit = clean(input.unit, 8);
    const powerState = clean(input.powerState, 20);
    if (!MODES.has(mode) || !UNITS.has(unit) || !POWER.has(powerState)) throw new Error('Wybierz prawidłowy rodzaj pomiaru, jednostkę i stan zasilania.');
    if ((mode === 'resistance' || mode === 'continuity' || mode === 'diode') && powerState !== 'isolated') {
      throw new Error('Pomiar rezystancji, ciągłości lub test diody wymaga odłączonych i odizolowanych źródeł zasilania.');
    }
    if (mode === 'voltage' && !['V', 'mV'].includes(unit)) throw new Error('Dla napięcia wybierz V lub mV.');
    if (mode === 'resistance' && !['Ω', 'kΩ'].includes(unit)) throw new Error('Dla rezystancji wybierz Ω lub kΩ.');
    if (mode === 'continuity' && !['Ω', 'kΩ'].includes(unit)) throw new Error('Ciągłość zapisuj jako rezystancję w Ω lub kΩ.');
    if (mode === 'diode' && unit !== 'V') throw new Error('Dla testu diody wybierz V.');
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < 0 || value > 1e12) throw new Error('Wpisz prawidłowy, nieujemny odczyt.');
    const minRaw = clean(input.refMin, 40), maxRaw = clean(input.refMax, 40);
    const hasMin = minRaw !== '', hasMax = maxRaw !== '';
    if (hasMin !== hasMax) throw new Error('Podaj obie granice odniesienia albo pozostaw obie puste.');
    let refMin = null, refMax = null;
    if (hasMin) {
      refMin = Number(minRaw); refMax = Number(maxRaw);
      if (!Number.isFinite(refMin) || !Number.isFinite(refMax) || refMin < 0 || refMax < refMin) throw new Error('Zakres referencyjny musi mieć prawidłową dolną i górną granicę.');
    }
    const entry = {
      id: clean(input.id, 80) || `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: clean(input.createdAt, 40) || new Date().toISOString(),
      deviceType: clean(input.deviceType, 50), brand: clean(input.brand, 70), model: clean(input.model, 120),
      boardId: clean(input.boardId, 80), revision: clean(input.revision, 40), point: clean(input.point, 120),
      mode, unit, powerState, value, refMin, refMax, reference: clean(input.reference, 220), notes: clean(input.notes, 700)
    };
    for (const [key, label] of [['deviceType','typ urządzenia'],['model','model'],['point','punkt pomiarowy'],['reference','źródło wartości odniesienia']]) {
      if (!entry[key]) throw new Error(`Uzupełnij pole: ${label}.`);
    }
    if (entry.reference.length < 4) throw new Error('Wpisz konkretną dokumentację, stronę schematu lub oznaczenie źródła.');
    return entry;
  }
  function classify(entry) {
    if (entry.refMin === null || entry.refMax === null) return 'no-reference';
    return entry.value >= entry.refMin && entry.value <= entry.refMax ? 'within-range' : 'outside-range';
  }
  function load(storage) {
    let raw;
    try { raw = storage.getItem(KEY); } catch { return []; }
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(-MAX_ENTRIES).filter(item => {
        try { validateEntry(item); return true; } catch { return false; }
      });
    } catch { return []; }
  }
  function save(storage, entries) {
    if (!Array.isArray(entries) || entries.length > MAX_ENTRIES) throw new Error(`Limit dziennika wynosi ${MAX_ENTRIES} wpisów.`);
    storage.setItem(KEY, JSON.stringify(entries));
  }
  function add(storage, input) {
    const entry = validateEntry(input);
    const entries = load(storage);
    if (entries.length >= MAX_ENTRIES) throw new Error(`Dziennik osiągnął limit ${MAX_ENTRIES} wpisów. Wyeksportuj kopię i usuń stare rekordy.`);
    entries.push(entry); save(storage, entries); return entry;
  }
  function remove(storage, id) { const next = load(storage).filter(item => item.id !== id); save(storage, next); return next; }
  function clear(storage) { storage.removeItem(KEY); return []; }
  function csv(entries) {
    const columns = ['data','typ','producent','model','Board ID','rewizja','punkt','tryb','jednostka','stan_zasilania','odczyt','zakres_min','zakres_max','wynik_porownania','zrodlo_odniesienia','notatki'];
    const rows = entries.map(e => [e.createdAt,e.deviceType,e.brand,e.model,e.boardId,e.revision,e.point,e.mode,e.unit,e.powerState,e.value,e.refMin ?? '',e.refMax ?? '',classify(e),e.reference,e.notes]);
    const cell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return '\uFEFF' + [columns, ...rows].map(row => row.map(cell).join(';')).join('\r\n');
  }
  const api = Object.freeze({ key: KEY, maxEntries: MAX_ENTRIES, validateEntry, classify, load, add, remove, clear, csv });
  if (typeof window !== 'undefined') window.NP_MEASUREMENT_LOG = api;

  function init() {
    const root = document.getElementById('npmlMeasurementLog');
    if (!root || root.dataset.ready === '1') return;
    root.dataset.ready = '1';
    const form = root.querySelector('#npmlForm'), rows = root.querySelector('#npmlRows'), status = root.querySelector('#npmlStatus');
    const count = root.querySelector('#npmlCount'), search = root.querySelector('#npmlSearch');
    const say = (message, bad = false) => { status.textContent = message; status.classList.toggle('is-error', bad); status.classList.toggle('is-success', !bad); };
    const labelMode = value => ({ voltage:'Napięcie DC', resistance:'Rezystancja', continuity:'Ciągłość', diode:'Test diody' }[value] || value);
    const labelPower = value => ({ isolated:'odłączone i odizolowane', powered:'zasilanie włączone', off:'wyłączone — źródło może być nadal podłączone' }[value] || value);
    const render = () => {
      let entries = load(localStorage).slice().reverse();
      const query = clean(search.value, 100).toLowerCase();
      if (query) entries = entries.filter(e => [e.deviceType,e.brand,e.model,e.boardId,e.point,e.reference,e.notes].join(' ').toLowerCase().includes(query));
      count.textContent = `${load(localStorage).length}/${MAX_ENTRIES} wpisów · ${entries.length} widocznych`;
      rows.innerHTML = entries.length ? entries.map(e => {
        const state = classify(e);
        const badge = state === 'within-range' ? '<span class="npml-state good">W zakresie</span>' : state === 'outside-range' ? '<span class="npml-state bad">Poza zakresem</span>' : '<span class="npml-state neutral">Bez zakresu</span>';
        const range = e.refMin === null ? 'Nie podano' : `${e.refMin}–${e.refMax} ${esc(e.unit)}`;
        const device = [e.brand,e.model,e.boardId ? `(${e.boardId}${e.revision ? ` · ${e.revision}` : ''})` : ''].filter(Boolean).join(' ');
        return `<tr><td><b>${esc(new Date(e.createdAt).toLocaleString('pl-PL'))}</b><small>${esc(e.deviceType)}</small></td><td><b>${esc(device || e.model)}</b><small>${esc(labelPower(e.powerState))}</small></td><td><b>${esc(e.point)}</b><small>${esc(labelMode(e.mode))}</small></td><td><strong>${esc(e.value)} ${esc(e.unit)}</strong><small>Ref.: ${esc(range)}</small>${badge}</td><td><small>${esc(e.reference)}</small>${e.notes ? `<small>${esc(e.notes)}</small>` : ''}</td><td><button type="button" class="npml-delete" data-npml-delete="${esc(e.id)}" aria-label="Usuń wpis">Usuń</button></td></tr>`;
      }).join('') : '<tr><td colspan="6" class="npml-empty">Brak wpisów. Dodaj pierwszy pomiar albo zmień wyszukiwanie.</td></tr>';
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try { const entry = add(localStorage, data); render(); form.reset(); say(`Zapisano pomiar ${entry.point}. Dane pozostają lokalnie w tej przeglądarce.`); }
      catch (error) { say(error.message || 'Nie udało się zapisać pomiaru.', true); }
    });
    search.addEventListener('input', render);
    rows.addEventListener('click', event => {
      const button = event.target.closest('[data-npml-delete]'); if (!button) return;
      try { remove(localStorage, button.dataset.npmlDelete); render(); say('Usunięto wybrany wpis.'); }
      catch (error) { say(error.message || 'Nie udało się usunąć wpisu.', true); }
    });
    root.querySelector('#npmlExportCsv').addEventListener('click', () => {
      try {
        const entries = load(localStorage); if (!entries.length) throw new Error('Dziennik jest pusty — nie ma czego eksportować.');
        const blob = new Blob([csv(entries)], { type:'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `nauka-od-a-do-z-pomiary-${new Date().toISOString().slice(0,10)}.csv`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); say(`Wyeksportowano ${entries.length} wpisów do CSV.`);
      } catch (error) { say(error.message || 'Eksport nie powiódł się.', true); }
    });
    root.querySelector('#npmlClear').addEventListener('click', () => {
      if (!load(localStorage).length) { say('Dziennik jest już pusty.'); return; }
      if (!window.confirm('Usunąć wszystkie wpisy dziennika pomiarów z tej przeglądarki? Najpierw wykonaj eksport, jeśli chcesz zachować kopię.')) return;
      try { clear(localStorage); render(); say('Dziennik został wyczyszczony.'); } catch (error) { say(error.message || 'Nie udało się wyczyścić dziennika.', true); }
    });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
