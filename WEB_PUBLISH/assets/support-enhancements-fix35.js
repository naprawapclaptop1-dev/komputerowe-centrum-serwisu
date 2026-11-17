/* FIX35 — platform sharing with native share and clipboard fallback. */
(() => {
  'use strict';
  const button = document.getElementById('supportShareButton');
  const status = document.getElementById('supportShareStatus');
  if (!button || !status || button.dataset.fix35Bound === '1') return;
  button.dataset.fix35Bound = '1';
  const shareUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'home');
    url.hash = '';
    return url.toString();
  };
  button.addEventListener('click', async () => {
    const url = shareUrl();
    const payload = {
      title: 'NAUKA OD A DO Z — DLA WSZYSTKICH',
      text: 'Bezpłatna platforma nauki napraw komputerów, laptopów i elektroniki.',
      url
    };
    button.disabled = true;
    status.textContent = 'Przygotowuję link…';
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(payload);
        status.textContent = 'Otworzono udostępnianie platformy.';
      } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(url);
        status.textContent = 'Link do strony głównej skopiowany.';
      } else {
        status.textContent = `Skopiuj adres: ${url}`;
      }
    } catch (error) {
      if (error && error.name === 'AbortError') status.textContent = 'Udostępnianie anulowane.';
      else {
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(url);
            status.textContent = 'Link do strony głównej skopiowany.';
          } else status.textContent = `Skopiuj adres: ${url}`;
        } catch {
          status.textContent = `Skopiuj adres: ${url}`;
        }
      }
    } finally {
      button.disabled = false;
    }
  });
})();
