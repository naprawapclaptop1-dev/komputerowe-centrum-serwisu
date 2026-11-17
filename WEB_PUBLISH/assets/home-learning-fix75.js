/* FIX75 — dostępna przeglądarka zdjęć warsztatowych, bez zewnętrznych zależności. */
(() => {
  'use strict';
  const gallerySelector = '#fix51VisualAcademy .fix51-photo-grid';
  let items = [];
  let index = 0;
  let returnFocus = null;
  let dialog = null;
  const $ = (selector, root=document) => root.querySelector(selector);

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('section');
    dialog.id = 'npaFix75PhotoLightbox';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Powiększona plansza techniczna');
    dialog.hidden = true;
    dialog.innerHTML = `
      <div class="np75-lightbox-bar"><strong>NAUKA OD A DO Z / GALERIA ILUSTRACJI TECHNICZNYCH</strong><button type="button" data-np75-close aria-label="Zamknij galerię">✕</button></div>
      <div class="np75-lightbox-stage"><img alt=""></div>
      <div class="np75-lightbox-footer"><div class="np75-lightbox-caption"><b data-np75-title></b><small data-np75-category></small></div><div class="np75-lightbox-actions"><button type="button" data-np75-prev aria-label="Poprzednia ilustracja">←</button><span data-np75-count></span><button type="button" data-np75-next aria-label="Następna ilustracja">→</button></div></div>`;
    dialog.addEventListener('click', event => {
      if (event.target === dialog || event.target.closest('[data-np75-close]')) close();
      else if (event.target.closest('[data-np75-prev]')) show(index - 1);
      else if (event.target.closest('[data-np75-next]')) show(index + 1);
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  function currentItems() {
    const grid = $(gallerySelector);
    if (!grid) return [];
    return [...grid.querySelectorAll('figure')].map(figure => {
      const img = $('img', figure);
      if (!img || !img.getAttribute('src')) return null;
      const title = $('figcaption b', figure)?.textContent?.trim() || img.alt || 'Ilustracja techniczna';
      const category = $('figcaption small', figure)?.textContent?.trim() || 'Lokalny materiał edukacyjny';
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Powiększ obraz: ${title}`);
      return { src: img.getAttribute('src'), title, category, alt: img.alt || title, trigger: img };
    }).filter(Boolean);
  }

  function show(nextIndex) {
    if (!items.length) return;
    index = (nextIndex + items.length) % items.length;
    const item = items[index];
    const root = ensureDialog();
    const image = $('.np75-lightbox-stage img', root);
    image.src = item.src;
    image.alt = item.alt;
    $('[data-np75-title]', root).textContent = item.title;
    $('[data-np75-category]', root).textContent = item.category;
    $('[data-np75-count]', root).textContent = `${index + 1} / ${items.length}`;
    if (root.hidden) {
      root.hidden = false;
      document.body.style.overflow = 'hidden';
      $('[data-np75-close]', root).focus();
    }
  }

  function close() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    document.body.style.overflow = '';
    $('.np75-lightbox-stage img', dialog).removeAttribute('src');
    returnFocus?.focus?.();
    returnFocus = null;
  }

  document.addEventListener('click', event => {
    const img = event.target.closest(`${gallerySelector} img`);
    if (!img) return;
    const gallery = img.closest(gallerySelector);
    items = currentItems();
    const found = items.findIndex(item => item.trigger === img);
    if (found < 0) return;
    event.preventDefault();
    returnFocus = img;
    show(found);
  });

  document.addEventListener('keydown', event => {
    if (!dialog || dialog.hidden) {
      const trigger = event.target?.closest?.(`${gallerySelector} img`);
      if (trigger && (event.key === 'Enter' || event.key === ' ')) {
        const current = currentItems();
        const found = current.findIndex(item => item.trigger === trigger);
        if (found >= 0) { event.preventDefault(); items = current; returnFocus = trigger; show(found); }
      }
      return;
    }
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    else if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not([disabled])')];
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  window.NPA_HOME_LEARNING_FIX75 = Object.freeze({ build: '6.8.0-fix75', gallerySelector, get photoCount(){ return currentItems().length; } });
})();
