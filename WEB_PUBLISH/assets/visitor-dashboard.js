/* Akademia Serwisu PRO 3.8.1 — global website visits.
 * Uses only the site's own Pages Function and D1 aggregate tables.
 * No IP address, browser fingerprint, paid analytics API or local visit counters.
 */
(() => {
  'use strict';
  const API = '/api/visits';
  const SESSION_KEY = 'academyGlobalVisitSessionV380';
  const $ = id => document.getElementById(id);
  let sessionId = '';
  let requestSequence = 0;
  let latestRenderedSequence = 0;
  let statusTimer = null;
  const format = n => new Intl.NumberFormat('pl-PL').format(Math.max(0, Number(n || 0)));
  const uuid = () => {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };
  function getSessionId() {
    try {
      let value = sessionStorage.getItem(SESSION_KEY) || '';
      if (!/^[0-9a-f-]{36}$/i.test(value)) {
        value = uuid();
        sessionStorage.setItem(SESSION_KEY, value);
      }
      return value;
    } catch {
      // If browser storage is blocked, each document load still receives a valid visit ID.
      return uuid();
    }
  }
  function setStatus(message, ok = false) {
    const el = $('globalVisitStatus');
    if (!el) return;
    el.innerHTML = '<i></i> ' + message;
    el.classList.toggle('is-error', !ok);
    el.classList.toggle('is-online', ok);
  }
  function daysForChart(rows) {
    const map = new Map((Array.isArray(rows) ? rows : []).map(x => [x.day, Number(x.visits || 0)]));
    const days = [];
    const today = new Date();
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
      const key = d.toISOString().slice(0, 10);
      days.push({ key, value: map.get(key) || 0 });
    }
    return days;
  }
  function renderChart(rows) {
    const chart = $('visitorChart');
    if (!chart) return;
    const days = daysForChart(rows);
    const max = Math.max(1, ...days.map(x => x.value));
    chart.innerHTML = days.map(item => {
      const height = Math.max(4, Math.round((item.value / max) * 100));
      const label = item.key.slice(5).replace('-', '.');
      return `<div class="activity-day" title="${item.key}: ${format(item.value)} wizyt"><span class="activity-value">${format(item.value)}</span><div class="activity-track"><i style="height:${height}%"></i></div><small>${label}</small></div>`;
    }).join('');
  }
  function renderContentCounts() {
    const lessons = Number(window.ACADEMY_DATA?.courseLessons?.length || 0);
    const catalog = window.ACADEMY_DEVICE_CATALOG || {brands:[]};
    const brands = Array.isArray(catalog.brands) ? catalog.brands.length : 0;
    const models = Array.isArray(catalog.brands) ? catalog.brands.reduce((sum, b) => sum + (Array.isArray(b.models) ? b.models.length : 0), 0) : 0;
    const videos = 10; // Liczba lokalnych filmów instruktażowych; film promocyjny wsparcia jest liczony osobno.
    const learningPaths = new Set((window.ACADEMY_DATA?.courseLessons || []).map(item => String(item.category || '').trim()).filter(Boolean)).size;
    const local = { metricLessonTotal: lessons, metricLearningPaths: learningPaths, metricBrandTotal: brands, metricModelTotal: models, metricVideoTotal: videos };
    for (const [id, value] of Object.entries(local)) { const el=$(id); if(el) el.textContent=format(value); }
  }
  function render(data, seq) {
    if (!data || !data.ok || seq < latestRenderedSequence) return;
    latestRenderedSequence = seq;
    const m = data.metrics || {};
    const values = {
      metricGlobalVisits: m.total_visits,
      metricUniqueVisitors: m.unique_visitors,
      metricGlobalViews: m.total_page_views,
      metricTodayVisits: m.today_visits,
      metricWeekVisits: m.week_visits,
      metricActiveProfiles: m.active_profiles_30d,
      metricRegisteredProfiles: m.registered_profiles,
      metricEmailAccounts: m.email_accounts,
      metricCompletedLessons: m.completed_lesson_records,
      metricApprovedCases: m.approved_repair_cases,
      metricApprovedModels: m.approved_device_models,
      metricPendingModels: m.pending_device_models,
      metricMonthVisits: m.month_visits,
      metricTodayViews: m.today_page_views,
      metricWeekViews: m.week_page_views,
      metricLearnersWithProgress: m.learners_with_progress,
      metricTrackedLessonOpens: m.tracked_lesson_opens,
      metricTrackedVideoOpens: m.tracked_video_opens,
      metricTrackedLessonCompletions: m.tracked_lesson_completions
    };
    for (const [id, value] of Object.entries(values)) {
      const el = $(id);
      if (el) el.textContent = format(value);
    }
    renderChart(data.days || []);
    renderContentCounts();
    setStatus('LICZNIK GLOBALNY AKTYWNY', true);
    const notice = $('globalVisitsNotice');
    if (notice) notice.textContent = 'Statystyki globalne z istniejącej bazy D1. Licznik pokazuje anonimowe sesje przeglądarki i ich różne identyfikatory, a nie zweryfikowaną liczbę ludzi. Nie zapisujemy adresów IP ani fingerprintów.';
  }
  async function requestView(section = 'Pulpit') {
    const seq = ++requestSequence;
    const payload = { sessionId, pageViewId: uuid() };
    try {
      const response = await fetch(API, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      render(data, seq);
    } catch (error) {
      setStatus('LICZNIK NIEDOSTĘPNY');
      const notice = $('globalVisitsNotice');
      if (notice) notice.textContent = `Nie można pobrać wspólnych statystyk z serwera: ${String(error.message || error)}. Dane lokalne nie są pokazywane jako globalne.`;
      // Read-only retry does not create another visit if the initial event was accepted.
      try {
        const response = await fetch(API, { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
        const data = await response.json();
        if (response.ok) render(data, seq);
      } catch { /* Status already explains the issue. */ }
    }
  }
  async function initialLoad() {
    sessionId = getSessionId();
    renderContentCounts();
    await requestView('Pulpit');
  }
  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-nav], [data-view]');
    if (!nav) return;
    const label = nav.getAttribute('data-section-label') || nav.textContent || nav.getAttribute('data-nav') || 'Akademia';
    // Let the SPA update the active section before recording its view.
    queueMicrotask(() => requestView(label));
  }, true);
  window.addEventListener('popstate', () => requestView(document.querySelector('.view-section.active')?.dataset.sectionLabel || 'Akademia'));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialLoad, { once: true });
  else initialLoad();
  window.ACADEMY_GLOBAL_VISITS = { refresh: () => requestView('Odświeżenie licznika') };
})();
