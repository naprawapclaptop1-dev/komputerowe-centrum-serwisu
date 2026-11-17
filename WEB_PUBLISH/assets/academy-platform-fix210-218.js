/* FIX210–FIX218 — informacje diagnostyczne i pomocnicze interfejsu. */
(() => {
  'use strict';
  const report = Object.freeze({ productVersion: '6.8.0', hotfixRange: 'FIX210–FIX228', runtimeChecks: ['navigator.onLine', 'serviceWorker', 'WebGL', 'stateRevisionCAS', 'localGLBImport', 'certificateVerificationLink'], serverChecks: 'Wyłącznie po uwierzytelnieniu w istniejącym panelu administratora.' });
  Object.defineProperty(window, 'NAUKA_PLATFORM_DIAGNOSTICS', { value: report, configurable: false, writable: false });
  window.addEventListener('online', () => document.documentElement.dataset.platformConnection = 'online');
  window.addEventListener('offline', () => document.documentElement.dataset.platformConnection = 'offline');
  document.documentElement.dataset.platformConnection = navigator.onLine ? 'online' : 'offline';
})();
