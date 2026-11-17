/* NAUKA OD A DO Z — strona główna: pokaz slajdów, ścieżki modułów i plan nauki FIX8. */
(() => {
  'use strict';
  const root = document.getElementById('np640Showcase');
  if (!root) return;
  const slides = [...root.querySelectorAll('.np640-slide')];
  const dots = [...root.querySelectorAll('[data-slide-to]')];
  const counter = root.querySelector('.np640-counter');
  const progress = root.querySelector('.np640-progress i');
  const pauseButton = root.querySelector('.np640-pause');
  const intervalMs = 6500;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  let current = 0;
  let timer = null;
  let startedAt = 0;
  let remaining = intervalMs;
  let paused = reduced;
  let hoverPaused = false;
  let progressFrame = 0;
  const setImageFallbacks = () => {
    root.querySelectorAll('.np640-slide > img').forEach((img,index) => {
      img.addEventListener('error', () => {
        if (img.dataset.fallbackUsed) return;
        img.dataset.fallbackUsed = '1';
        const seed = index + 1;
        const hue = (seed * 53 + 176) % 360;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue} 58% 20%)"/><stop offset="1" stop-color="#071426"/></linearGradient></defs><rect width="900" height="520" fill="url(#g)"/><g fill="none" stroke="hsl(${hue} 90% 72% / .42)" stroke-width="4"><path d="M80 130h210v90h180v-70h250M110 360h170v-65h250v100h250M400 65v80h-65v85m285 30v90h120"/><circle cx="500" cy="250" r="80"/><circle cx="500" cy="250" r="48"/></g><text x="65" y="455" fill="#e9fbff" font-family="Arial,sans-serif" font-size="34" font-weight="700">${String(img.alt||'LABORATORIUM').replace(/[&<>]/g,' ').slice(0,50)}</text></svg>`;
        img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        img.alt = `Unikalna ilustracja zastępcza: ${img.alt || 'temat szkoleniowy'}`;
      }, { once: true });
    });
  };
  const updateProgress = () => {
    cancelAnimationFrame(progressFrame);
    const tick = now => {
      if (paused || document.hidden) return;
      const elapsed = Math.max(0, now - startedAt);
      const pct = Math.min(100, elapsed / intervalMs * 100);
      if (progress) progress.style.width = `${pct}%`;
      if (pct < 100) progressFrame = requestAnimationFrame(tick);
    };
    progressFrame = requestAnimationFrame(tick);
  };
  const clearTimer = () => { if (timer) clearTimeout(timer); timer = null; cancelAnimationFrame(progressFrame); };
  const schedule = () => {
    clearTimer();
    if (paused || hoverPaused || document.hidden || slides.length < 2) return;
    startedAt = performance.now() - (intervalMs - remaining);
    updateProgress();
    timer = setTimeout(() => { remaining = intervalMs; show(current + 1, true); }, remaining);
  };
  const show = (index, auto = false) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      if ('inert' in slide) slide.inert = !active;
    });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
    });
    if (counter) counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (progress) progress.style.width = '0%';
    if (!auto) remaining = intervalMs;
    schedule();
  };
  const pause = user => {
    if (user) paused = true; else hoverPaused = true;
    if (timer) {
      remaining = Math.max(800, intervalMs - (performance.now() - startedAt));
      clearTimer();
    }
    if (pauseButton) { pauseButton.textContent = '▶'; pauseButton.setAttribute('aria-label', 'Wznów pokaz'); }
  };
  const resume = user => {
    if (user) paused = false; else hoverPaused = false;
    if (paused || hoverPaused || document.hidden) return;
    if (pauseButton) { pauseButton.textContent = 'Ⅱ'; pauseButton.setAttribute('aria-label', 'Wstrzymaj pokaz'); }
    schedule();
  };
  root.querySelector('.np640-prev')?.addEventListener('click', () => show(current - 1));
  root.querySelector('.np640-next')?.addEventListener('click', () => show(current + 1));
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.slideTo))));
  pauseButton?.addEventListener('click', () => paused ? resume(true) : pause(true));
  root.addEventListener('mouseenter', () => pause(false));
  root.addEventListener('mouseleave', () => resume(false));
  root.addEventListener('focusin', () => pause(false));
  root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) resume(false); });
  document.addEventListener('visibilitychange', () => document.hidden ? pause(false) : resume(false));
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });
  setImageFallbacks();
  show(0);
  if (paused && pauseButton) { pauseButton.textContent = '▶'; pauseButton.setAttribute('aria-label', 'Wznów pokaz'); }

  // Lokalny, dzienny plan nauki — bez wysyłania danych na serwer.
  const plan = document.querySelector('.np640-study-plan');
  if (plan) {
    const today = new Date().toLocaleDateString('sv-SE');
    const key = `naukaOdAdoZ.dailyPlan.${today}`;
    let state = {};
    try { state = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { state = {}; }
    const checks = [...plan.querySelectorAll('[data-study-task]')];
    const output = plan.querySelector('.np640-plan-progress b');
    const bar = plan.querySelector('.np640-plan-progress i');
    const render = () => {
      const done = checks.filter(c => c.checked).length;
      if (output) output.textContent = `${done} / ${checks.length} etapów`;
      if (bar) bar.style.width = `${checks.length ? done / checks.length * 100 : 0}%`;
      try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(checks.map(c => [c.dataset.studyTask, c.checked])))); } catch { /* tryb prywatny / pełny magazyn */ }
    };
    checks.forEach(c => { c.checked = Boolean(state[c.dataset.studyTask]); c.addEventListener('change', render); });
    plan.querySelector('#np640ResetPlan')?.addEventListener('click', () => { checks.forEach(c => { c.checked = false; }); render(); });
    render();
  }
  window.NAUKA_HOME_SHOWCASE = { version: '6.2.0-fix8-home-showcase', goTo: show, pause: () => pause(true), resume: () => resume(true) };
})();
