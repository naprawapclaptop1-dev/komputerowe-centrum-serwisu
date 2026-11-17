(() => {
'use strict';
const DATA=window.ACADEMY_COMPONENTS||{components:[],glossary:[],powerRails:[],refdes:[]};
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let tab='components';
const setTab=t=>{tab=t;document.querySelectorAll('[data-component-tab]').forEach(b=>b.classList.toggle('active',b.dataset.componentTab===t));$('#componentSearch').value='';$('#componentCategory').disabled=t!=='components';render();};
const optionCats=()=>{const s=$('#componentCategory');if(!s)return;const cats=[...new Set(DATA.components.map(x=>x.category))];s.innerHTML='<option value="all">Wszystkie kategorie</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');};
const show=(title,kicker,body)=>{const modal=$('#contentModal');if(!modal)return;$('#modalTitle').textContent=title;$('#modalKicker').textContent=kicker;$('#modalBody').innerHTML=body;$('#contentModal .modal').classList.add('modal-wide');modal.classList.remove('hidden');};
const openComponent=id=>{const x=DATA.components.find(p=>p.id===id);if(!x)return;show(x.name,'ENKLOPEDIA ELEMENTÓW / '+x.category,`<div class="component-detail"><div class="component-facts"><span><b>Oznaczenie</b>${esc(x.ref)}</span><span><b>Angielska nazwa</b>${esc(x.english)}</span><span><b>Poziom</b>${esc(x.level)}</span></div><h3>Rola i działanie</h3><p>${esc(x.role)}</p><h3>Typowe objawy uszkodzenia</h3><p>${esc(x.symptoms)}</p><h3>Diagnostyka</h3><p>${esc(x.diagnosis)}</p><h3>Możliwe działania serwisowe</h3><p>${esc(x.repair)}</p><div class="safety-inline"><b>Ograniczenia i bezpieczeństwo</b><p>${esc(x.risk)}</p></div><p class="muted">Przed wymianą potwierdź kod części i rewizję w BOM/datasheet/boardview. Podany prefiks nie jest uniwersalny.</p></div>`);};
const render=()=>{
 const q=($('#componentSearch')?.value||'').trim().toLowerCase(),cat=$('#componentCategory')?.value||'all';let items=[];
 if(tab==='components'){
  items=DATA.components.filter(x=>(cat==='all'||x.category===cat)&&[x.name,x.ref,x.english,x.category,x.role,x.symptoms,x.diagnosis].join(' ').toLowerCase().includes(q));
  $('#componentCount').textContent=`${items.length} z ${DATA.components.length} elementów`;
  $('#componentContent').innerHTML=items.map(x=>`<button class="component-card" data-component-id="${x.id}"><img class="catalog-card-art" src="${esc(window.ACADEMY_ART?.dataUrl?window.ACADEMY_ART.dataUrl(x,`component:${x.id}`):'')}" alt="Zdjęcie warsztatowe elementu ${esc(x.name)}" loading="lazy"><span class="component-ref">${esc(x.ref)}</span><small>${esc(x.category)} · ${esc(x.level)}</small><b>${esc(x.name)}</b><p>${esc(x.english)}</p><span class="component-more">Opis, objawy, test i naprawa →</span></button>`).join('')||'<p class="muted">Brak wyników.</p>';
 } else if(tab==='glossary'){
  items=DATA.glossary.filter(x=>[x.term,x.name,x.description,x.context].join(' ').toLowerCase().includes(q));
  $('#componentCount').textContent=`${items.length} z ${DATA.glossary.length} skrótów`;
  $('#componentContent').innerHTML=items.map(x=>`<article class="glossary-card"><b>${esc(x.term)}</b><strong>${esc(x.name)}</strong><p>${esc(x.description)}</p><small>${esc(x.context)}</small></article>`).join('')||'<p class="muted">Brak wyników.</p>';
 } else if(tab==='rails'){
  items=DATA.powerRails.filter(x=>[x[0],x[1]].join(' ').toLowerCase().includes(q));
  $('#componentCount').textContent=`${items.length} z ${DATA.powerRails.length} nazw linii`;
  $('#componentContent').innerHTML=items.map(x=>`<article class="glossary-card rail-card"><b>${esc(x[0])}</b><p>${esc(x[1])}</p></article>`).join('')||'<p class="muted">Brak wyników.</p>';
 } else {
  items=DATA.refdes.filter(x=>x.join(' ').toLowerCase().includes(q));
  $('#componentCount').textContent=`${items.length} z ${DATA.refdes.length} oznaczeń`;
  $('#componentContent').innerHTML=items.map(x=>`<article class="glossary-card"><b>${esc(x[0])}</b><strong>${esc(x[1])}</strong><p>${esc(x[2])}</p></article>`).join('')||'<p class="muted">Brak wyników.</p>';
 }
};
const previousOpen=window.ACADEMY_OPEN_SOURCE;window.ACADEMY_OPEN_SOURCE=(group,id)=>{if(group==='components'){openComponent(id);return true;}return previousOpen?previousOpen(group,id):false;};
const init=()=>{if(!$('#componentContent'))return;optionCats();render();$('#componentTabs').addEventListener('click',e=>{const b=e.target.closest('[data-component-tab]');if(b)setTab(b.dataset.componentTab);});$('#componentSearch').addEventListener('input',render);$('#componentCategory').addEventListener('change',render);$('#componentContent').addEventListener('click',e=>{const b=e.target.closest('[data-component-id]');if(b)openComponent(b.dataset.componentId);});};
document.addEventListener('click',e=>{const b=e.target.closest('[data-part-query]');if(!b)return;e.preventDefault();window.ACADEMY_BOOTSTRAP_NAV?.('components');const input=$('#componentSearch');if(input){input.value=b.dataset.partQuery;input.dispatchEvent(new Event('input',{bubbles:true}));input.scrollIntoView({behavior:'smooth',block:'center'});}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
