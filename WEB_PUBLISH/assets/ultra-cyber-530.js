/* NAPRAWA PC — ULTRA CYBER LAB 5.3.0
   Interaktywne centrum pracy, mapa PCB w perspektywie CSS, personalizacja pulpitu i skróty społeczności. */
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const STORE='naprawaPcUltraDashboard530_v1';
  const partInfo={
    'CPU':['Procesor / CPU','Sprawdź zasilanie VCORE, sygnały startowe, zegary i warunki termiczne. Lokalizacja oraz wartości zależą od platformy i rewizji PCB.'],
    'VRM':['Sekcja zasilania VRM','Oceniaj kontroler PWM, MOSFET-y, cewki, kondensatory i sygnały EN/PGOOD. Nie mierz rezystancji na zasilonej płycie.'],
    'GPU':['Układ graficzny / GPU','Rozdziel problem obrazu, zasilania, pamięci VRAM i sterownika. Wymagaj testu porównawczego i dokumentuj temperatury.'],
    'BIOS':['Pamięć BIOS / SPI','Przed zapisem zabezpiecz oryginalny wsad, sprawdź oznaczenie układu, napięcie, pojemność i zgodność platformy.'],
    'EC':['Embedded Controller','Kontroler klawiatury, sekwencji startowej i wielu sygnałów platformy. Diagnozuj według schematu i sygnałów właściwych dla modelu.'],
    'RAM':['Pamięć RAM','Sprawdź zgodność DDR, obsługę platformy, slot, styki, SPD i test stabilności. Nie zakładaj, że brak POST oznacza uszkodzony moduł.'],
    'PCH':['Chipset / PCH','Analizuj magistrale, sygnały resetu, zegary i komunikację z dokumentacją konkretnej platformy.'],
    'USB-C':['USB-C / Power Delivery','Sprawdź kabel, zasilacz, linie CC, kontroler PD i negocjację profilu. Wartości są specyficzne dla urządzenia.']
  };
  function safeNum(id){const t=$('#'+id)?.textContent?.trim();return t&&t!=='—'?t:'—';}
  function makeWorkspace(){
    const home=$('#view-home'); const hero=$('.workshop-hero',home); const mount=$('#u530CommandCenter'); if(!home||!hero||mount?.dataset.u530Ready==='1')return;
    const section=document.createElement('section'); section.id='u530CommandCenter';section.className='u530-command-center';section.setAttribute('aria-label','Ultra Cyber Lab — centrum pracy');
    section.innerHTML=`
      <div class="u530-head"><div><span class="u530-kicker">ULTRA CYBER LAB / SERVICE WORKSPACE 5.3</span><h2>Centrum sterowania <span style="color:var(--u530-a)">Akademią.</span></h2><p>Twoje stanowisko nauki, diagnostyki, dokumentacji i modeli — zapis układu jest lokalny w tej przeglądarce.</p></div><div class="u530-clock"><i></i><span id="u530Clock">AKADEMIA ONLINE</span><button id="u530Arrange" class="u530-arrange" type="button" aria-pressed="false">✥ Dostosuj pulpit</button></div></div>
      <div class="u530-grid" id="u530Grid">
        <article class="u530-widget" data-u530-widget="pcb">
          <div class="u530-widget-head"><div class="u530-widget-title"><span class="u530-widget-icon">▦</span><div><b>Interaktywna płyta główna</b><small>WYBIERZ ELEMENT, ABY ODCZYTAĆ FUNKCJĘ</small></div></div><div class="u530-widget-actions"><span class="u530-widget-tag">PCB / 3D VIEW</span><button class="u530-move" type="button" data-u530-move="up" aria-label="Przenieś panel wyżej">↑</button><button class="u530-move" type="button" data-u530-move="down" aria-label="Przenieś panel niżej">↓</button></div></div>
          <div class="u530-board-stage"><div class="u530-pcb" role="group" aria-label="Schemat poglądowy płyty w perspektywie"><span class="u530-board-trace" style="left:10%;top:25%;width:80%;transform:rotate(18deg)"></span><span class="u530-board-trace" style="left:20%;top:68%;width:58%;transform:rotate(-22deg)"></span>${['CPU','VRM','GPU','BIOS','EC','RAM','PCH','USB-C'].map(k=>`<button type="button" class="u530-part" data-u530-part="${k}" aria-pressed="${k==='CPU'?'true':'false'}">${k}</button>`).join('')}</div></div>
          <div class="u530-board-caption"><span>Widok edukacyjny — nie jest mapą konkretnej rewizji PCB</span><span>8 punktów</span></div>
          <div class="u530-part-detail" id="u530PartDetail"><b>Procesor / CPU</b><p>Sprawdź zasilanie VCORE, sygnały startowe, zegary i warunki termiczne.</p></div>
        </article>
        <article class="u530-widget" data-u530-widget="metrics">
          <div class="u530-widget-head"><div class="u530-widget-title"><span class="u530-widget-icon">⌁</span><div><b>Akademia w liczbach</b><small>WSPÓLNE STATYSTYKI / ZAWARTOŚĆ</small></div></div><span class="u530-widget-tag">GLOBAL</span></div>
          <div class="u530-metric-list">
            <div class="u530-metric"><small>WIZYTY</small><strong id="u530Visits">—</strong><span>anonimowe sesje</span></div>
            <div class="u530-metric"><small>ODSŁONY</small><strong id="u530Views">—</strong><span>otwarcia widoków</span></div>
            <div class="u530-metric"><small>LEKCJE</small><strong id="u530Lessons">1000</strong><span>katalog szkoleniowy</span></div>
            <div class="u530-metric"><small>MODELE</small><strong id="u530Models">150</strong><span>referencyjne przykłady</span></div>
          </div>
          <div class="u530-quick-actions"><button type="button" data-nav="courses"><span>Kontynuuj naukę / wszystkie lekcje</span><span>↗</span></button><button type="button" data-nav="community"><span>Marki i modele urządzeń</span><span>↗</span></button><button type="button" data-nav="diagnostics"><span>Diagnostyka i pomiary</span><span>↗</span></button></div>
        </article>
        <article class="u530-widget" data-u530-widget="quick">
          <div class="u530-widget-head"><div class="u530-widget-title"><span class="u530-widget-icon">⚒</span><div><b>Ścieżka naprawy</b><small>CHECKLISTA TWOJEGO STANOWISKA</small></div></div><span class="u530-widget-tag">LOCAL SAVE</span></div>
          <div class="u530-procedure-steps" id="u530Steps">
            <label class="u530-step"><input type="checkbox" data-u530-step="identity"><span><b>Identyfikacja modelu</b><small>Model, MTM/Service Tag i rewizja płyty</small></span><em>01</em></label>
            <label class="u530-step"><input type="checkbox" data-u530-step="backup"><span><b>Zabezpieczenie danych</b><small>Ocena ryzyka i kopia przed naprawą</small></span><em>02</em></label>
            <label class="u530-step"><input type="checkbox" data-u530-step="safety"><span><b>Bezpieczne stanowisko</b><small>Odłączenie zasilania i ESD</small></span><em>03</em></label>
            <label class="u530-step"><input type="checkbox" data-u530-step="measure"><span><b>Pomiary i diagnoza</b><small>Wyniki zapisane przed wymianą części</small></span><em>04</em></label>
          </div>
          <div class="u530-center-footer"><span id="u530StepProgress">0/4 kroków</span><button type="button" class="u530-arrange" data-nav="checklists">Otwórz checklisty →</button></div>
        </article>
      </div>
      <div class="u530-center-footer"><span>✦ Pulpit można układać przyciskiem „Dostosuj pulpit”. Zmiany zapisywane lokalnie.</span><span>Symulacje i mapa PCB są materiałami edukacyjnymi, nie pomiarem fizycznego sprzętu.</span></div>`;
    if(mount) mount.replaceWith(section); else hero.insertAdjacentElement('afterend',section);
  }
  function restoreLayout(){
    const grid=$('#u530Grid');if(!grid)return;
    let saved=[];try{saved=JSON.parse(localStorage.getItem(STORE)||'{}').order||[]}catch{}
    saved.forEach(key=>{const el=$(`[data-u530-widget="${key}"]`,grid);if(el)grid.appendChild(el);});
    let steps={};try{steps=JSON.parse(localStorage.getItem(STORE)||'{}').steps||{}}catch{}
    $$('[data-u530-step]',grid).forEach(c=>{c.checked=!!steps[c.dataset.u530Step];c.closest('.u530-step')?.classList.toggle('done',c.checked);});
    updateSteps();
  }
  function saveState(patch){let state={};try{state=JSON.parse(localStorage.getItem(STORE)||'{}')}catch{};state={...state,...patch};try{localStorage.setItem(STORE,JSON.stringify(state))}catch{announce('Pamięć przeglądarki jest niedostępna — układ nie został zapisany.');}}
  function updateSteps(){const done=$$('[data-u530-step]').filter(x=>x.checked).length;const out=$('#u530StepProgress');if(out)out.textContent=`${done}/4 kroków · ${Math.round(done/4*100)}%`;$$('[data-u530-step]').forEach(x=>x.closest('.u530-step')?.classList.toggle('done',x.checked));saveState({steps:Object.fromEntries($$('[data-u530-step]').map(x=>[x.dataset.u530Step,x.checked]))});}
  let toast;
  function announce(msg){if(!toast){toast=document.createElement('div');toast.className='u530-toast';toast.setAttribute('role','status');document.body.appendChild(toast)}toast.textContent=msg;toast.classList.add('show');clearTimeout(announce.timer);announce.timer=setTimeout(()=>toast.classList.remove('show'),2200);}
  function updateMetrics(){const pairs=[['u530Visits','metricGlobalVisits'],['u530Views','metricGlobalViews'],['u530Lessons','metricLessonTotal'],['u530Models','metricModelTotal']];pairs.forEach(([target,source])=>{const a=$('#'+target),b=$('#'+source);if(a&&b&&b.textContent.trim()!=='—')a.textContent=b.textContent.trim();});}
  function clock(){const el=$('#u530Clock');if(!el)return;const now=new Date();el.textContent=now.toLocaleDateString('pl-PL',{weekday:'short',day:'2-digit',month:'short'})+' · '+now.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});}
  function setupBoard(){const detail=$('#u530PartDetail');if(!detail)return;const set=k=>{const v=partInfo[k]||['Element płyty','Sprawdź oznaczenie i dokumentację właściwą dla konkretnego modelu.'];detail.innerHTML=`<b>${v[0]}</b><p>${v[1]}</p>`;$$('[data-u530-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.u530Part===k)));};$$('[data-u530-part]').forEach(b=>b.addEventListener('click',()=>set(b.dataset.u530Part)));set('CPU');}
  function setupArrange(){const root=$('#u530CommandCenter'),grid=$('#u530Grid'),btn=$('#u530Arrange');if(!root||!grid||!btn)return;btn.addEventListener('click',()=>{const active=root.classList.toggle('is-arranging');btn.setAttribute('aria-pressed',String(active));btn.textContent=active?'✓ Zapisz układ':'✥ Dostosuj pulpit';announce(active?'Wybierz strzałki, aby ułożyć panele.':'Zapisano układ pulpitu.');});grid.addEventListener('click',e=>{const b=e.target.closest('[data-u530-move]');if(!b)return;const card=b.closest('[data-u530-widget]');if(!card)return;const cards=[...grid.children];const i=cards.indexOf(card);if(b.dataset.u530Move==='up'&&i>0)grid.insertBefore(card,cards[i-1]);if(b.dataset.u530Move==='down'&&i<cards.length-1)grid.insertBefore(cards[i+1],card);saveState({order:[...grid.children].map(x=>x.dataset.u530Widget)});});}
  function setupSteps(){const grid=$('#u530Grid');grid?.addEventListener('change',e=>{if(e.target.matches('[data-u530-step]'))updateSteps();});}
  function addCommunityHub(){const view=$('#view-community');const title=$('.page-title-row',view);const mount=$('#u530CommunityHub');if(!view||!title||mount?.dataset.u530Ready==='1')return;const cat=window.ACADEMY_DEVICE_CATALOG||{brands:[]};const models=cat.brands.flatMap(b=>(b.models||[]).map(m=>({brand:b.brand,series:m[0],model:m[1]})));const hub=document.createElement('section');hub.id='u530CommunityHub';hub.className='u530-community-hero';hub.innerHTML=`<div><span class="u530-kicker">HARDWARE COMMUNITY / MODEL REGISTER</span><h2>Znajdź urządzenie. Wymień doświadczenia. <span style="color:var(--u530-a)">Rozwijaj bazę.</span></h2><p>Wybierz producenta, serię lub model. Przykłady katalogowe są punktem startowym — zgodność płyty, rewizji i dokumentacji trzeba potwierdzić na urządzeniu.</p><div class="u530-brand-strip">${cat.brands.map(b=>`<button type="button" class="u530-brand-chip" data-u530-brand="${String(b.brand).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${b.brand}</button>`).join('')}</div></div><div class="u530-community-number"><b>${cat.brands.length}</b><span>producenci w katalogu</span><b style="font-size:19px;margin-top:7px">${models.length}</b><span>przykładowe modele</span></div>`;
    if(mount) mount.replaceWith(hub); else title.insertAdjacentElement('afterend',hub);
    const shortcuts=document.createElement('div');shortcuts.className='u530-community-shortcuts';shortcuts.innerHTML=`<div class="u530-community-shortcut"><b>${cat.brands.length}</b><small>producenci i marki</small></div><div class="u530-community-shortcut"><b>${models.length}</b><small>konkretne przykłady modeli</small></div><div class="u530-community-shortcut"><b>PCB / REV</b><small>numer płyty i rewizja</small></div><div class="u530-community-shortcut"><b>MODERACJA</b><small>zgłoszenia weryfikowane przed publikacją</small></div>`;
    hub.insertAdjacentElement('afterend',shortcuts);
  }
  function setupCommunity(){const hub=$('#u530CommunityHub');if(!hub)return;hub.addEventListener('click',e=>{const b=e.target.closest('[data-u530-brand]');if(!b)return;const filter=$('#deviceModelBrandFilter');const search=$('#deviceModelSearch');if(filter){filter.value=b.dataset.u530Brand;filter.dispatchEvent(new Event('change',{bubbles:true}));}if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}$$('[data-u530-brand]',hub).forEach(x=>x.classList.toggle('active',x===b));$('#deviceModelDirectory')?.scrollIntoView({behavior:document.body.dataset.motion==='off'?'auto':'smooth',block:'start'});});}
  function addAccountHub(){const view=$('#view-account');const title=$('.page-title-row',view);const mount=$('#u530AccountHub');if(!view||!title||mount?.dataset.u530Ready==='1')return;const auth=$('#emailAuthPanel');const hub=document.createElement('section');hub.id='u530AccountHub';hub.className='u530-account-banner';hub.innerHTML=`<article><span class="u530-kicker">MY SERVICE ID / 6.0 WORKSPACE</span><h3>Jedno konto. Twoja historia. Twoja baza napraw.</h3><p>Utwórz konto e-mail i hasło, aby wrócić do profilu na innym urządzeniu. Synchronizacja postępów jest osobną zgodą. Google, Facebook, Microsoft, X, GitHub i Discord są pokazane w panelu. Ich dostępność jest sprawdzana przez API, a brakujące ustawienia są opisane przy każdej metodzie.</p></article><article><div class="u530-account-mini-stats"><div><b>12+</b><small>działów Akademii</small></div><div><b>1000</b><small>lekcji szkoleniowych</small></div><div><b>33</b><small>producentów</small></div></div><p style="margin-top:9px">Nie udostępniaj hasła, kluczy odzyskiwania ani danych klientów. Adres e-mail w obecnej wersji nie jest weryfikowany wiadomością.</p></article>`;if(mount)mount.replaceWith(hub);else title.insertAdjacentElement('afterend',hub);if(auth){/* OAuth status is rendered by cloud-academy.js; never hide providers here. */}}
  function polishHeader(){const title=$('.topbar-brand-copy small');if(title)title.textContent='v6.0.0 ULTIMATE CYBER LAB';const side=$('.sidebar-version');if(side)side.innerHTML='WERSJA 6.0.0 <span>•</span> ULTIMATE CYBER LAB';}
  function init(){if(!$('#view-home'))return;makeWorkspace();addCommunityHub();addAccountHub();restoreLayout();setupBoard();setupArrange();setupSteps();setupCommunity();polishHeader();updateMetrics();clock();setInterval(()=>{clock();updateMetrics();},5000);const stats=$('#academyGlobalStats');if(stats&&'MutationObserver'in window)new MutationObserver(updateMetrics).observe(stats,{subtree:true,childList:true,characterData:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
