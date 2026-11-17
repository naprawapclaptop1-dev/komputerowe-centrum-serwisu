/* Katalog marek i modeli społeczności Akademii — wpisy dokładnych modeli podlegają moderacji. */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const API = '/api/models';
  const catalog = window.ACADEMY_DEVICE_CATALOG || { brands: [], note: '' };
  let approved = [];
  const staticSelect = () => {
    const values = catalog.brands.map(x => x.brand);
    const select = $('#modelBrand');
    if (select) select.innerHTML = '<option value="">Wybierz markę</option>' + values.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('') + '<option value="Inny producent">Inny producent</option>';
    const filter = $('#deviceModelBrandFilter');
    if (filter) filter.innerHTML = '<option value="">Wszyscy producenci</option>' + values.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  };
  function staticRows() {
    return catalog.brands.flatMap(b => [
      ...b.families.map(f => ({ brand:b.brand, series:f[0], model:f[1], device_type:'laptop', curated:true, note:b.region, exact:false })),
      ...(b.models || []).map(m => ({ brand:b.brand, series:m[0], model:m[1], device_type:m[2] || 'laptop', curated:true, note:'Model referencyjny — potwierdź pełny wariant/MTM i rewizję PCB', exact:true }))
    ]);
  }
  function render() {
    const root = $('#deviceModelDirectory');
    if (!root) return;
    const q = ($('#deviceModelSearch')?.value || '').trim().toLowerCase();
    const brand = $('#deviceModelBrandFilter')?.value || '';
    const type = $('#deviceModelTypeFilter')?.value || '';
    const curated = staticRows().filter(x => (!brand || x.brand === brand) && (!type || x.device_type === type) && (!q || [x.brand,x.series,x.model,x.note].join(' ').toLowerCase().includes(q)));
    const exact = approved.filter(x => (!brand || x.brand === brand) && (!type || x.device_type === type) && (!q || [x.brand,x.model,x.series,x.board_id,x.pcb_revision,x.cpu_platform,x.gpu,x.known_issues].join(' ').toLowerCase().includes(q)));
    const exactHtml = exact.map(x => `<article class="device-model-card approved"><div class="device-model-top"><span class="device-model-brand">${esc(x.brand)}</span><span class="device-model-approved">ZWERYFIKOWANY WPIS</span></div><h3>${esc(x.model)}</h3><p>${esc(x.series || x.device_type)}</p><dl>${x.board_id?`<div><dt>Płyta</dt><dd>${esc(x.board_id)} ${esc(x.pcb_revision||'')}</dd></div>`:''}${x.cpu_platform?`<div><dt>Platforma</dt><dd>${esc(x.cpu_platform)}</dd></div>`:''}${x.gpu?`<div><dt>GPU</dt><dd>${esc(x.gpu)}</dd></div>`:''}${x.ram_type?`<div><dt>RAM</dt><dd>${esc(x.ram_type)}</dd></div>`:''}</dl>${x.known_issues?`<p class="device-model-issues"><b>Znane problemy:</b> ${esc(x.known_issues)}</p>`:''}${x.repair_notes?`<details><summary>Notatki serwisowe</summary><p>${esc(x.repair_notes)}</p></details>`:''}<small>Autor: ${esc(x.attribution||'Społeczność Akademii')} · ${esc(x.approved_at||'')}</small></article>`).join('');
    const familyHtml = curated.map(x => `<article class="device-model-card family${x.exact?' reference-model':''}"><div class="device-model-top"><span class="device-model-brand">${esc(x.brand)}</span><span class="device-model-type">${x.exact?'MODEL REFERENCYJNY':'RODZINA PRODUKTOWA'}</span></div><h3>${esc(x.exact?x.model:x.series)}</h3><p>${esc(x.exact?x.series:x.model)}</p><small>${esc(x.note)}</small></article>`).join('');
    root.innerHTML = `${exactHtml}${familyHtml}` || '<div class="device-model-empty">Nie znaleziono pasujących modeli. Zmień filtr lub dodaj nowy model do moderacji.</div>';
    const stats = $('#deviceModelDirectoryStats');
    if (stats) stats.textContent = `${exact.length} zatwierdzonych wpisów społeczności · ${curated.length} pozycji katalogu referencyjnego`;
  }
  async function loadApproved() {
    const status = $('#deviceModelStatus');
    try {
      const params = new URLSearchParams();
      if ($('#deviceModelSearch')?.value) params.set('q', $('#deviceModelSearch').value);
      const response = await fetch(`${API}?${params}`, { credentials:'same-origin', cache:'no-store', headers:{accept:'application/json'} });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      approved = Array.isArray(data.items) ? data.items : [];
      render();
      if (status) status.textContent = data.curatedNote || catalog.note;
    } catch (error) {
      approved = [];
      render();
      if (status) status.textContent = `Katalog rodzin producentów jest dostępny lokalnie. Wspólne wpisy dokładnych modeli wymagają aktywnego API D1 (${error.message}).`;
    }
  }
  function say(message, good=false) {
    const node = $('#deviceModelFormStatus');
    if (node) { node.textContent = message; node.classList.toggle('success',good); node.classList.toggle('error',!good); }
  }
  async function submitModel(form) {
    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    const payload = {
      brand:values.brand, model:values.model, series:values.series, deviceType:values.deviceType,
      boardId:values.boardId, revision:values.revision, cpuPlatform:values.cpuPlatform,
      gpu:values.gpu, ramType:values.ramType, storage:values.storage, display:values.display,
      knownIssues:values.knownIssues, repairNotes:values.repairNotes,
      sourceUrls:String(values.sourceUrls||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),
      rightsConfirmed:data.get('modelRights')==='on', shareConsent:data.get('modelShare')==='on', licenseAgreement:data.get('modelLicense')==='on'
    };
    if (!payload.brand || !payload.model.trim()) { say('Wybierz markę i wpisz dokładny model urządzenia.'); return; }
    if (!payload.rightsConfirmed || !payload.shareConsent || !payload.licenseAgreement) { say('Zaznacz wszystkie wymagane potwierdzenia praw i publikacji.'); return; }
    const button = form.querySelector('button[type="submit"]'); if (button) { button.disabled = true; button.textContent = 'Wysyłam do moderacji…'; }
    try {
      const response = await fetch(API, { method:'POST', credentials:'same-origin', headers:{'content-type':'application/json','accept':'application/json'}, body:JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || `HTTP ${response.status}`);
      form.reset(); say(result.message || 'Model wysłany do moderacji.', true);
    } catch (error) { say(`Nie udało się wysłać modelu: ${error.message}`); }
    finally { if (button) { button.disabled = false; button.textContent = 'Wyślij model do moderacji →'; } }
  }
  async function loadAdminModels() {
    const token = $('#adminToken')?.value || '';
    const root = $('#adminModelQueue');
    if (!root) return;
    if (token.length < 16) { root.textContent = 'Wpisz token administratora w panelu moderacji.'; return; }
    try {
      const response = await fetch('/api/admin/models', { credentials:'same-origin', headers:{accept:'application/json',authorization:`Bearer ${token}`} });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const items = data.pending || [];
      root.innerHTML = items.length ? items.map(x => `<article class="community-card admin-review-card"><div class="eyebrow">MODEL DO MODERACJI · ${esc(x.id)}</div><h3>${esc(x.brand)} ${esc(x.model)}</h3><p>Typ: ${esc(x.device_type)} · Seria: ${esc(x.series)} · Płyta: ${esc(x.board_id)} ${esc(x.pcb_revision)}</p><p>CPU: ${esc(x.cpu_platform)} · GPU: ${esc(x.gpu)} · RAM: ${esc(x.ram_type)}</p><p>${esc(x.known_issues)}</p><div><button class="btn btn-primary btn-small" data-model-review-id="${esc(x.id)}" data-model-review-status="approved">Zatwierdź</button> <button class="btn btn-danger btn-small" data-model-review-id="${esc(x.id)}" data-model-review-status="rejected">Odrzuć</button></div></article>`).join('') : '<p>Brak modeli oczekujących na moderację.</p>';
    } catch (error) { root.textContent = `Błąd kolejki modeli: ${error.message}`; }
  }
  async function reviewModel(id, status) {
    const token = $('#adminToken')?.value || '';
    try {
      const response = await fetch('/api/admin/models', {method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','accept':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({id,status})});
      const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      await loadAdminModels(); await loadApproved();
    } catch (error) { const root=$('#adminModelQueue'); if(root)root.textContent=`Nie udało się zmienić statusu modelu: ${error.message}`; }
  }
  async function refreshSubmissionGate() {
    const gate=$('#deviceModelLoginGate'), form=$('#deviceModelForm');
    try {
      const response=await fetch('/api/session',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
      const data=await response.json();
      const signedIn=!!data.active&&!!data.user;
      if(gate)gate.classList.toggle('hidden',signedIn);
      if(form)form.classList.toggle('hidden',!signedIn);
      if(signedIn) { const status=$('#deviceModelStatus'); if(status)status.textContent=`Zalogowano jako ${data.user.nickname||'użytkownik'}${data.user.email?' · '+data.user.email:''}. Możesz wysłać model do moderacji.`; }
    } catch {
      if(gate)gate.classList.remove('hidden');
      if(form)form.classList.add('hidden');
    }
  }
  function init() {
    staticSelect();
    $('#deviceModelSearch')?.addEventListener('input', render);
    $('#deviceModelBrandFilter')?.addEventListener('change', render);
    $('#deviceModelTypeFilter')?.addEventListener('change', render);
    $('#deviceModelRefresh')?.addEventListener('click', loadApproved);
    $('#deviceModelForm')?.addEventListener('submit', e => { e.preventDefault(); submitModel(e.currentTarget); });
    $('#loadAdminModelQueue')?.addEventListener('click', loadAdminModels);
    document.addEventListener('click', e => { const b=e.target.closest('[data-model-review-id]'); if(b)reviewModel(b.dataset.modelReviewId,b.dataset.modelReviewStatus); });
    window.addEventListener('academy:session-changed',refreshSubmissionGate);
    loadApproved(); refreshSubmissionGate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
