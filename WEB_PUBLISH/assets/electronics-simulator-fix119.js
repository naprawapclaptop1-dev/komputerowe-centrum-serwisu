/* NAUKA OD A DO Z — FIX119: shared educational electronics simulation core.
 * Pure calculations only. No physical instrument access, network calls or cloud writes.
 */
(() => {
  'use strict';
  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  };
  const WAVEFORMS = new Set(['sine', 'square', 'triangle']);
  const SCOPE_TIME_WINDOW_MS = 2;

  function scopeMetrics(frequencyHz, amplitudeV) {
    const frequency = clamp(frequencyHz, 100, 20000, 1000);
    const amplitude = clamp(amplitudeV, 0.1, 5, 2);
    return Object.freeze({
      frequencyHz: frequency,
      amplitudeV: amplitude,
      periodMs: 1000 / frequency,
      vppV: amplitude * 2,
      timeWindowMs: SCOPE_TIME_WINDOW_MS,
      cyclesVisible: frequency * SCOPE_TIME_WINDOW_MS / 1000
    });
  }

  function buildScopePath(frequencyHz, amplitudeV, waveform = 'sine', samples = 720) {
    const metrics = scopeMetrics(frequencyHz, amplitudeV);
    const shape = WAVEFORMS.has(waveform) ? waveform : 'sine';
    const count = Math.max(120, Math.min(1440, Math.trunc(Number(samples) || 720)));
    const timeWindowSeconds = metrics.timeWindowMs / 1000;
    const points = [];
    for (let i = 0; i <= count; i += 1) {
      const phase = (i / count) * Math.PI * 2 * metrics.frequencyHz * timeWindowSeconds;
      const sine = Math.sin(phase);
      let value;
      if (shape === 'square') value = sine >= 0 ? 1 : -1;
      else if (shape === 'triangle') value = (2 / Math.PI) * Math.asin(sine);
      else value = sine;
      const x = (i / count) * 720;
      const y = 105 - value * metrics.amplitudeV * 17;
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(' ');
  }

  function negotiatePd(options = {}) {
    const voltage = Number(options.voltage);
    const requestedCurrent = Number(options.current);
    const sourceLimit = clamp(options.sourceCurrentLimit, 1, 5, 3);
    const cableLimit = clamp(options.cableCurrentLimit, 1, 5, 3);
    const orientation = options.orientation === 'reversed' ? 'reversed' : 'normal';
    const fault = ['cc1', 'cc2', 'both'].includes(options.ccFault) ? options.ccFault : 'none';
    const activeCc = orientation === 'normal' ? 'CC1' : 'CC2';
    const supportedVoltages = Array.isArray(options.sourceVoltages)
      ? options.sourceVoltages.map(Number)
      : [5, 9, 15, 20];

    if (![5, 9, 15, 20].includes(voltage)) {
      return Object.freeze({ ok: false, code: 'UNSUPPORTED_VOLTAGE', activeCc, message: 'Wybrany poziom napięcia nie jest obsługiwanym profilem PDO w tym ćwiczeniu.' });
    }
    if (!Number.isFinite(requestedCurrent) || requestedCurrent < 0.1 || requestedCurrent > 5) {
      return Object.freeze({ ok: false, code: 'INVALID_CURRENT', activeCc, message: 'Prąd żądany musi mieścić się w zakresie 0,1–5,0 A.' });
    }
    if (!supportedVoltages.includes(voltage)) {
      return Object.freeze({ ok: false, code: 'PDO_NOT_OFFERED', activeCc, message: `Źródło nie oferuje profilu ${voltage} V. Nie uzgodniono kontraktu PD.` });
    }
    if (fault === 'both' || fault === activeCc.toLowerCase()) {
      return Object.freeze({
        ok: false, code: 'CC_NEGOTIATION_FAILED', activeCc,
        message: `Brak komunikacji na aktywnej linii ${activeCc}. Nie uzgodniono kontraktu USB-C PD; wynik napięcia VBUS nie jest symulowany.`
      });
    }

    // 5 A wymaga źródła deklarującego 5 A oraz przewodu 5 A z E-Markerem.
    // Każdy z przykładowych profili stałego napięcia 5/9/15/20 V może być
    // ograniczony do 5 A; 100 W odpowiada przykładowi 20 V × 5 A.
    const fiveAmpProfile = sourceLimit >= 5 && cableLimit >= 5;
    const supportedCurrent = fiveAmpProfile ? 5 : Math.min(3, sourceLimit, cableLimit);
    const contractCurrent = Math.min(requestedCurrent, supportedCurrent);
    const limited = contractCurrent + 1e-9 < requestedCurrent;
    const inactiveCcFault = fault !== 'none' && fault !== activeCc.toLowerCase();
    const powerW = voltage * contractCurrent;
    const warnings = [];
    if (limited) warnings.push(`Żądanie ${requestedCurrent.toFixed(1)} A ograniczono do ${contractCurrent.toFixed(1)} A przez możliwości źródła/przewodu.`);
    if (inactiveCcFault) warnings.push(`Uszkodzenie nieaktywnej linii ${fault.toUpperCase()} nie blokuje tej orientacji, ale może blokować po odwróceniu wtyku.`);
    if (cableLimit >= 5 && sourceLimit < 5) warnings.push('Przewód E-Marker 5 A jest wykryty, ale źródło ogranicza prąd do 3 A.');
    return Object.freeze({
      ok: true, code: limited ? 'CONTRACT_LIMITED' : 'CONTRACT_ACCEPTED', activeCc,
      voltageV: voltage, requestedCurrentA: requestedCurrent, currentA: contractCurrent,
      powerW, limited, maxCurrentA: supportedCurrent,
      message: `Kontrakt PD uzgodniony: ${voltage} V / ${contractCurrent.toFixed(1)} A = ${powerW.toFixed(1)} W. Aktywna linia: ${activeCc}.`,
      warning: warnings.join(' ')
    });
  }

  const api = Object.freeze({ build: '6.8.0-fix119-electronics-simulators', scopeMetrics, buildScopePath, negotiatePd });
  Object.defineProperty(window, 'NPA_ELECTRONICS_FIX119', { value: api, configurable: true, enumerable: false, writable: false });
})();
