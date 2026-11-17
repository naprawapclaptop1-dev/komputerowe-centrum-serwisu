/* NAPRAWA PC — NEON MOTION compatibility bridge 6.1.0.
   The single appearance panel and circuit canvas live in theme-controller-610.js.
   This file retains only the full-screen control.
*/
(()=>{'use strict';
  const reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  // appearanceToggle is handled only by theme-controller-610.js.
  const fullscreenButton = document.getElementById('fullscreenToggle');
  function updateFullscreen(){
    if(!fullscreenButton)return;
    const active=!!document.fullscreenElement;
    fullscreenButton.setAttribute('aria-label',active?'Wyłącz pełny ekran':'Włącz pełny ekran');
    fullscreenButton.title=active?'Wyłącz pełny ekran':'Pełny ekran';
    fullscreenButton.setAttribute('aria-pressed',String(active));
  }
  fullscreenButton?.addEventListener('click',async()=>{
    try { if(!document.fullscreenElement){ await document.documentElement.requestFullscreen(); } else { await document.exitFullscreen(); } }
    catch(_){ fullscreenButton.title='Użyj klawisza F11 — przeglądarka zablokowała pełny ekran.'; }
    updateFullscreen();
  });
  document.addEventListener('fullscreenchange',updateFullscreen);
  document.documentElement.dataset.neonMotionVersion='6.1.0';
  window.ACADEMY_NEON_MOTION_COMPAT={version:'6.1.0',reducedMotion:!!reduced?.matches,canvasOwner:'theme-controller-610.js',appearanceOwner:'theme-controller-610.js'};
})();
