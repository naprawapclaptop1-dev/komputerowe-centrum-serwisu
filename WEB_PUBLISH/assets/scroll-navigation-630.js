/* FIX3: synchronizacja wysokości przyklejonej nawigacji i przycisk powrotu na górę. */
(() => {
  'use strict';
  const init = () => {
    const header = document.querySelector('.topbar');
    if (!header) return;
    const updateHeight = () => {
      const height = Math.max(64, Math.ceil(header.getBoundingClientRect().height || 70));
      document.documentElement.style.setProperty('--np630-header-height', `${height}px`);
    };
    updateHeight();
    if ('ResizeObserver' in window) new ResizeObserver(updateHeight).observe(header);
    window.addEventListener('resize', updateHeight, {passive:true});
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'np630BackTop';
    button.className = 'np630-back-top';
    button.setAttribute('aria-label', 'Wróć na górę strony');
    button.title = 'Wróć na górę strony';
    button.innerHTML = '<span class="np630-arrow" aria-hidden="true">↑</span><span>NA GÓRĘ</span>';
    document.body.appendChild(button);
    const updateVisibility = () => button.classList.toggle('is-visible', window.scrollY > 360);
    window.addEventListener('scroll', updateVisibility, {passive:true});
    button.addEventListener('click', () => {
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top:0, behavior:reduce?'auto':'smooth'});
    });
    updateVisibility();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
