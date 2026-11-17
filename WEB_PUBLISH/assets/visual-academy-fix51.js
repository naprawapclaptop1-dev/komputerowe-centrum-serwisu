/* FIX51 — Visual Academy PRO: atlas ilustracji, symulatory edukacyjne i kontrola realnych plików. */
(() => {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const assets = window.ACADEMY_VISUAL_ASSETS || [];
  const categoryNames={board:'Płyta główna',power:'Zasilanie',laptop:'Laptop',ram:'Pamięć RAM',storage:'Dyski',meter:'Pomiary',cooling:'Chłodzenie',display:'Matryca',port:'Porty',safety:'Bezpieczeństwo',gpu:'Grafika',network:'Sieci',diagnostics:'Diagnostyka',audio:'Audio'};
  const categoryName=category=>categoryNames[category]||category;
  const photos = [
    ['assets/artwork-fix77/gax-visual-index-01.svg','Mapa płyty głównej','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-02.svg','Sekcja zasilania','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-03.svg','Widok warstwowy laptopa','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-04.svg','Pamięć RAM','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-05.svg','Interfejsy SSD','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-06.svg','Multimetr','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-07.svg','Oscyloskop','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-08.svg','Chłodzenie','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-09.svg','Tor obrazu','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-10.svg','BIOS i UEFI','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-11.svg','USB-C Power Delivery','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-12.svg','Bezpieczeństwo ESD','Autorska ilustracja techniczna FIX77'],
    ['assets/artwork-fix77/gax-visual-index-13.svg','GPU i VRAM','Autorska ilustracja techniczna FIX77'],
  ];
  const photoPaths = photos.map(item => item[0]);
  const posterPaths=['assets/artwork-fix77/video-index-01.svg','assets/artwork-fix77/video-index-02.svg','assets/artwork-fix77/video-index-03.svg'];

  function mount() {
    const home = $('#view-home');
    if (!home || $('#fix51VisualAcademy')) return;
    const section = document.createElement('section');
    section.id = 'fix51VisualAcademy';
    section.className = 'fix51-visual-academy';
    section.innerHTML = `
      <div class="fix51-head">
        <div><span class="fix51-kicker">NAUKA OD A DO Z — DLA WSZYSTKICH / FIX51</span><h2>Ilustracje techniczne <em>PRO</em></h2><p>Unikalne ilustracje techniczne, schematy i laboratoria ćwiczeniowe. Wszystkie widoki korzystają z lokalnych ilustracji technicznych; zewnętrzne fotografie są wyłączone.</p></div>
        <div class="fix51-health" id="fix51AssetHealth"><span class="fix51-dot"></span><b>Sprawdzam bibliotekę wizualną…</b></div>
      </div>
      <div class="fix51-metrics">
        <div><strong>13</strong><span>unikalnych plansz ilustracyjnych</span></div>
        <div><strong>3</strong><span>autorskie plakaty SVG</span></div>
        <div><strong>${assets.length}</strong><span>autorskich ilustracji SVG</span></div>
        <div><strong>3</strong><span>symulatory edukacyjne</span></div>
        <div><strong>offline</strong><span>bez zależności od CORS</span></div>
      </div>
      <div class="fix51-atlas">
        <div class="fix51-atlas-main">
          <div class="fix51-section-title"><div><span>01 / ATLAS</span><h3>Ilustracje techniczne</h3></div><small id="fix51AtlasCount">${assets.length} plansz</small></div>
          <div class="fix51-filters"><input id="fix51AtlasSearch" type="search" placeholder="Szukaj: VRM, BIOS, RAM, USB-C…" aria-label="Szukaj ilustracji"><select id="fix51AtlasCategory" aria-label="Kategoria ilustracji"><option value="all">Wszystkie kategorie</option>${[...new Set(assets.map(a=>a.category))].sort().map(c=>`<option value="${c}">${categoryName(c)}</option>`).join('')}</select></div>
          <div class="fix51-asset-grid" id="fix51AssetGrid"></div>
        </div>
        <aside class="fix51-atlas-preview" id="fix51AtlasPreview">
          <div class="fix51-preview-image-wrap"><img id="fix51PreviewImage" src="${assets[0]?.src||''}" alt="${assets[0]?.title||'Ilustracja techniczna'}"><div class="fix51-hotspots" id="fix51Hotspots" aria-label="Interaktywne punkty ilustracji"></div></div>
          <div class="fix51-preview-copy"><span id="fix51PreviewCategory">${categoryName(assets[0]?.category||'Atlas')}</span><h3 id="fix51PreviewTitle">${assets[0]?.title||'Atlas techniczny'}</h3><p id="fix51PreviewDesc">${assets[0]?.description||''}</p><p class="fix51-hotspot-info" id="fix51HotspotInfo">Wybierz wyróżniony punkt na ilustracji, aby zobaczyć opis komponentu.</p><small>Ilustracja edukacyjna — przed pomiarem sprawdź dokumentację konkretnego modelu i rewizji.</small></div>
          <a class="fix51-open-asset" id="fix51PreviewOpen" href="${assets[0]?.src||'#'}" target="_blank" rel="noopener">Otwórz pełną planszę ↗</a>
        </aside>
      </div>
      <div class="fix51-labs">
        <section class="fix51-lab-card">
          <div class="fix51-section-title"><div><span>02 / LABORATORIUM</span><h3>Wirtualny multimetr</h3></div><b class="fix51-sim-tag">SYMULACJA</b></div>
          <p class="fix51-lab-note">Przećwicz dobór trybu i interpretację odczytu. Symulator nie komunikuje się z rzeczywistym miernikiem.</p>
          <div class="fix51-controls"><label>Scenariusz<select id="fix51MeterScenario"><option value="rail19">Wejście zasilania — przykład</option><option value="rail33">Szyna standby — przykład</option><option value="resistance">Rezystancja do masy — przykład</option><option value="fuse">Ciągłość bezpiecznika — przykład</option><option value="short">Niska rezystancja — przykład</option></select></label><label>Tryb<select id="fix51MeterMode"><option value="dc">V⎓ — napięcie DC</option><option value="ac">V~ — napięcie AC</option><option value="ohm">Ω — rezystancja</option><option value="continuity">🔔 — ciągłość</option></select></label></div>
          <div class="fix51-meter-body"><div class="fix51-meter-screen"><small>ODCZYT SYMULOWANY</small><strong id="fix51MeterReading">19.12 <i>V</i></strong><span id="fix51MeterStatus">Scenariusz edukacyjny</span></div><div class="fix51-meter-dial"><div class="fix51-dial-knob"></div><span>V⎓</span><span>V~</span><span>Ω</span><span>🔔</span></div></div>
          <div class="fix51-meter-explain" id="fix51MeterExplain">W przykładzie wejście zasilania ma 19,12 V DC. Rzeczywisty zakres zależy od konstrukcji i dokumentacji urządzenia.</div>
          <button class="fix51-primary" id="fix51MeasureButton" type="button">Wykonaj pomiar symulowany</button>
        </section>
        <section class="fix51-lab-card">
          <div class="fix51-section-title"><div><span>03 / LABORATORIUM</span><h3>Oscyloskop</h3></div><b class="fix51-sim-tag">SYMULACJA</b></div>
          <p class="fix51-lab-note">Zmieniaj rodzaj sygnału, amplitudę i częstotliwość. Wykres jest generowany lokalnie w przeglądarce.</p>
          <canvas id="fix51ScopeCanvas" width="900" height="360" aria-label="Symulowany przebieg oscyloskopu"></canvas>
          <div class="fix51-controls fix51-scope-controls"><label>Przebieg<select id="fix51WaveType"><option value="sine">Sinusoidalny</option><option value="square">Prostokątny</option><option value="triangle">Trójkątny</option><option value="saw">Piłokształtny</option></select></label><label>Częstotliwość <output id="fix51FreqValue">1 kHz</output><input id="fix51Freq" type="range" min="100" max="10000" step="100" value="1000"></label><label>Amplituda <output id="fix51AmpValue">2.0 V</output><input id="fix51Amp" type="range" min="0.5" max="5" step="0.1" value="2"></label></div>
          <div class="fix51-lab-note" id="fix51ScopeSummary">1 kHz · 2.0 V · przebieg sinusoidalny</div>
        </section>
        <section class="fix51-lab-card fix51-diagnostic-card">
          <div class="fix51-section-title"><div><span>04 / ĆWICZENIA</span><h3>Diagnostyka krok po kroku</h3></div><b class="fix51-sim-tag">TRENING</b></div>
          <p class="fix51-lab-note">Wybierz objaw i przejdź przez bezpieczną ścieżkę hipotez oraz testów.</p>
          <label class="fix51-full-label">Przypadek<select id="fix51DiagnosticCase"><option value="noPower">Laptop nie uruchamia się</option><option value="noDisplay">Laptop działa, ale nie ma obrazu</option><option value="overheat">Wysoka temperatura / hałas</option><option value="noCharge">Brak ładowania USB-C</option></select></label>
          <div class="fix51-diagnostic-step"><span id="fix51DiagProgress">KROK 1 / 5</span><h4 id="fix51DiagTitle">Zabezpiecz stanowisko i dane</h4><p id="fix51DiagText">Odłącz urządzenie od zasilania przed inspekcją obudowy. Zanotuj model, rewizję płyty i objaw.</p></div>
          <div class="fix51-diagnostic-actions"><button class="fix51-secondary" id="fix51DiagReset" type="button">Od początku</button><button class="fix51-primary" id="fix51DiagNext" type="button">Następny krok →</button></div>
          <small class="fix51-warning">Procedura szkoleniowa. Nie wykonuj pomiarów pod napięciem bez kwalifikacji, właściwego sprzętu i instrukcji producenta.</small>
        </section>
      </div>
      <div class="fix51-gallery">
        <div class="fix51-section-title"><div><span>05 / FOTOGRAFIE</span><h3>Biblioteka ilustracji technicznych</h3></div><small>Lokalne SVG — dostępne bez Internetu</small></div>
        <div class="fix51-photo-grid" id="fix51PhotoGrid">${photos.map(p=>`<figure><img src="${p[0]}" alt="${p[1]}" loading="lazy"><figcaption><b>${p[1]}</b><small>${p[2]}</small></figcaption></figure>`).join('')}</div>
      </div>
      <div class="fix51-advanced-grid">
        <section class="fix51-lab-card fix51-layer-explorer">
          <div class="fix51-section-title"><div><span>06 / ATLAS WARSTWOWY</span><h3>Rozpoznawanie części laptopa</h3></div><b class="fix51-sim-tag">INTERAKTYWNE</b></div>
          <p class="fix51-lab-note">Wybierz część na schemacie rozłożonego laptopa. To schemat warstwowy 2D, nie model CAD ani rzeczywisty skan urządzenia.</p>
          <img id="fix51LayerImage" src="assets/artwork-fix51/03-laptop-exploded.svg" alt="Warstwowy schemat laptopa">
          <div class="fix51-layer-buttons" id="fix51LayerButtons"></div>
          <div class="fix51-layer-info" id="fix51LayerInfo">Wybierz element, aby zobaczyć rolę i punkty kontroli.</div>
        </section>
        <section class="fix51-lab-card fix51-image-quiz">
          <div class="fix51-section-title"><div><span>07 / EGZAMIN OBRAZKOWY</span><h3>Rozpoznaj komponent</h3></div><b class="fix51-sim-tag">QUIZ</b></div>
          <p class="fix51-lab-note">Odpowiedz na pytania na podstawie lokalnych ilustracji. Wynik jest liczony wyłącznie w tej sesji.</p>
          <img id="fix51QuizImage" src="assets/artwork-fix51/04-ram-ddr4-ddr5.svg" alt="Ilustracja do pytania egzaminacyjnego">
          <div class="fix51-quiz-progress" id="fix51QuizProgress">Pytanie 1 / 5 · wynik 0</div>
          <h4 id="fix51QuizQuestion">Który moduł na planszy opisano jako DDR5?</h4>
          <div class="fix51-quiz-options" id="fix51QuizOptions"></div>
          <div class="fix51-quiz-feedback" id="fix51QuizFeedback" aria-live="polite">Wybierz odpowiedź.</div>
          <button class="fix51-secondary" id="fix51QuizNext" type="button" disabled>Następne pytanie →</button>
        </section>
      </div>
      <section class="fix51-lab-card fix51-compare">
        <div class="fix51-section-title"><div><span>08 / DOKUMENTACJA NAPRAWY</span><h3>Porównanie zdjęć przed i po</h3></div><b class="fix51-sim-tag">LOKALNIE</b></div>
        <p class="fix51-lab-note">Wczytaj dwa własne zdjęcia serwisowe, aby porównać efekt naprawy. Obrazy są podglądane lokalnie w przeglądarce — ten moduł ich nie wysyła ani nie zapisuje do konta.</p>
        <div class="fix51-compare-controls"><label>Zdjęcie PRZED<input id="fix51BeforeInput" type="file" accept="image/*"></label><label>Zdjęcie PO<input id="fix51AfterInput" type="file" accept="image/*"></label></div>
        <div class="fix51-compare-frame" id="fix51CompareFrame">
          <div class="fix51-compare-placeholder" id="fix51ComparePlaceholder">Wybierz zdjęcie „przed” i „po”, aby uruchomić porównanie.</div>
          <img class="fix51-compare-before" id="fix51CompareBefore" alt="Zdjęcie przed naprawą" hidden>
          <div class="fix51-compare-after-clip" id="fix51CompareAfterClip"><img id="fix51CompareAfter" alt="Zdjęcie po naprawie" hidden></div>
          <div class="fix51-compare-line" id="fix51CompareLine" hidden></div>
          <span class="fix51-compare-label before">PRZED</span><span class="fix51-compare-label after">PO</span>
        </div>
        <div class="fix51-compare-actions"><label>Przesuń podział <input id="fix51CompareRange" type="range" min="0" max="100" value="50"></label><button class="fix51-secondary" id="fix51CompareReset" type="button">Wyczyść zdjęcia</button></div>
        <small class="fix51-warning">Uwaga: zdjęcia pozostają tylko w pamięci bieżącej strony. Zapis dokumentacji do historii napraw wymaga osobnego, zatwierdzonego modułu przechowywania.</small>
      </section>
      <div class="fix51-disclaimer">Wszystkie schematy SVG w tej sekcji są autorskimi ilustracjami edukacyjnymi, nie boardview ani dokumentacją producenta. Symulatory pokazują syntetyczne dane i nie sterują sprzętem.</div>
    `;
    const parts = $('.parts-feature', home);
    const lower = $('.lab-lower-grid', home);
    if (parts) parts.insertAdjacentElement('afterend', section);
    else if (lower) lower.insertAdjacentElement('beforebegin', section);
    else home.append(section);
    bindAtlas(); bindMeter(); bindScope(); bindDiagnostics(); bindLayerExplorer(); bindImageQuiz(); bindBeforeAfter(); verifyAssets();
  }

  function bindAtlas() {
    const grid=$('#fix51AssetGrid'),search=$('#fix51AtlasSearch'),category=$('#fix51AtlasCategory');
    if(!grid)return;
    const render=()=>{
      const q=(search?.value||'').trim().toLocaleLowerCase('pl-PL'),cat=category?.value||'all';
      const list=assets.filter(a=>(cat==='all'||a.category===cat)&&[a.title,a.category,a.description,(a.keywords||[]).join(' ')].join(' ').toLocaleLowerCase('pl-PL').includes(q));
      grid.innerHTML=list.map(a=>`<button class="fix51-asset-tile" type="button" data-fix51-asset="${a.id}"><img src="${a.src}" alt="" loading="lazy"><span>${categoryName(a.category)}</span><b>${a.title}</b><small>${a.description}</small></button>`).join('')||'<p class="fix51-empty">Brak ilustracji pasujących do wyszukiwania.</p>';
      $('#fix51AtlasCount').textContent=`${list.length} / ${assets.length} plansz`;
    };
    render(); search?.addEventListener('input',render);category?.addEventListener('change',render);
    const hotSpotData={
      '01-motherboard-map':[
        {x:30,y:52,title:'Socket CPU',text:'Gniazdo procesora. Weryfikuj zgodność generacji i stan pinów według dokumentacji płyty.'},
        {x:54,y:50,title:'Sloty RAM',text:'Gniazda pamięci. Sprawdź generację DDR, obsługę modułów i zalecaną kolejność obsadzania.'},
        {x:69,y:46,title:'Sekcja VRM',text:'Przetwornice i elementy zasilania procesora. Nie wykonuj pomiarów pod napięciem bez procedury.'},
        {x:32,y:76,title:'Gniazdo M.2',text:'Miejsce montażu nośnika. M.2 może obsługiwać SATA lub PCIe/NVMe zależnie od płyty.'}
      ],
      '02-power-vrm':[
        {x:14,y:48,title:'DC-IN',text:'Wejście zasilania — sprawdź parametry zasilacza i dokumentację konkretnego modelu.'},
        {x:32,y:48,title:'Ochrona',text:'Bezpiecznik i elementy zabezpieczające chronią dalszą część układu.'},
        {x:50,y:48,title:'MOSFET',text:'Klucz zasilania. Usterka może powodować brak startu lub nieprawidłową sekwencję zasilania.'},
        {x:68,y:48,title:'Kontroler',text:'Steruje pracą przetwornicy lub ładowaniem; identyfikuj układ po oznaczeniu i schemacie.'},
        {x:86,y:48,title:'Cewka',text:'Element przetwornicy, po której stronie wyjściowej mierzy się daną szynę zgodnie z procedurą.'}
      ],
      '03-laptop-exploded':[
        {x:16,y:44,title:'Matryca',text:'Panel LCD i jego taśmy. Brak obrazu wymaga sprawdzenia całego toru sygnałowego.'},
        {x:34,y:44,title:'Zawiasy',text:'Elementy mechaniczne prowadzące pokrywę. Uszkodzenia mogą naruszyć przewód ekranu.'},
        {x:51,y:44,title:'Płyta główna',text:'Główna platforma logiczna. Numer rewizji jest ważny przy doborze dokumentacji.'},
        {x:69,y:44,title:'Chłodzenie',text:'Wentylator, heatpipe i radiator. Oceniaj drożność i docisk według serwisówki.'},
        {x:85,y:44,title:'Dysk M.2',text:'Nośnik systemu i danych. Przed testami destrukcyjnymi wykonaj kopię danych.'},
        {x:25,y:69,title:'Bateria',text:'Pakiet akumulatora. Przed demontażem odłącz zgodnie z instrukcją serwisową.'}
      ]
    };
    const drawHotspots=item=>{
      const layer=$('#fix51Hotspots'),info=$('#fix51HotspotInfo');if(!layer)return;
      const points=hotSpotData[item.id]||[];
      layer.innerHTML=points.map((point,i)=>`<button type="button" class="fix51-hotspot" data-hotspot="${i}" style="left:${point.x}%;top:${point.y}%" aria-label="${point.title}" title="${point.title}">${i+1}</button>`).join('');
      if(info)info.textContent=points.length?'Kliknij numerowany punkt, aby zobaczyć opis elementu.':'Ta plansza nie ma oznaczonych punktów — skorzystaj z legendy i opisu.';
      layer.onclick=event=>{const button=event.target.closest('[data-hotspot]');if(!button)return;const point=points[Number(button.dataset.hotspot)];if(!point)return;layer.querySelectorAll('.fix51-hotspot').forEach(x=>x.classList.toggle('is-active',x===button));if(info)info.textContent=`${point.title}: ${point.text}`;};
    };
    if(assets[0])drawHotspots(assets[0]);
    grid.addEventListener('click',event=>{
      const button=event.target.closest('[data-fix51-asset]');if(!button)return;
      const item=assets.find(a=>a.id===button.dataset.fix51Asset);if(!item)return;
      $('#fix51PreviewImage').src=item.src;$('#fix51PreviewImage').alt=item.title;
      $('#fix51PreviewCategory').textContent=categoryName(item.category);$('#fix51PreviewTitle').textContent=item.title;$('#fix51PreviewDesc').textContent=item.description;
      $('#fix51PreviewOpen').href=item.src;drawHotspots(item);
      $$('.fix51-asset-tile',grid).forEach(x=>x.classList.toggle('is-selected',x===button));
    });
  }

  const meterCases={
    rail19:{mode:'dc',value:'19.12',unit:'V',status:'Przykładowe napięcie wejściowe',explain:'W przykładzie wejście zasilania ma 19,12 V DC. Rzeczywisty zakres zależy od modelu i dokumentacji producenta.'},
    rail33:{mode:'dc',value:'3.29',unit:'V',status:'Przykładowa szyna standby',explain:'Wartość 3,29 V jest syntetycznym przykładem. Obecność szyny standby i jej wartość sprawdź w schemacie konkretnej płyty.'},
    resistance:{mode:'ohm',value:'1.84',unit:'Ω',status:'Przykładowa rezystancja',explain:'Rezystancja zależy od układu, polaryzacji, kondensatorów i punktu pomiarowego. Nie interpretuj samej liczby jako pewnego zwarcia.'},
    fuse:{mode:'continuity',value:'BEEP',unit:'',status:'Przykład: ciągłość potwierdzona',explain:'Sygnał ciągłości w symulatorze oznacza zamknięty obwód. Bezpiecznik w rzeczywistym urządzeniu sprawdź po odłączeniu zasilania.'},
    short:{mode:'ohm',value:'0.08',unit:'Ω',status:'Przykładowa niska rezystancja',explain:'Niska rezystancja może wynikać z normalnej charakterystyki danej szyny lub zwarcia. Potrzebne są odniesienie do schematu i dodatkowe testy.'}
  };
  function bindMeter(){
    const scenario=$('#fix51MeterScenario'),mode=$('#fix51MeterMode');
    const measure=()=>{
      const data=meterCases[scenario.value],chosen=mode.value;
      const compatible=chosen===data.mode;
      $('#fix51MeterReading').innerHTML=compatible?`${data.value} <i>${data.unit}</i>`:'— <i>ustaw tryb</i>';
      $('#fix51MeterStatus').textContent=compatible?data.status:'Tryb niezgodny ze scenariuszem';
      $('#fix51MeterExplain').textContent=compatible?data.explain:`Dla tego przykładu wybierz ${data.mode==='dc'?'V⎓':data.mode==='ohm'?'Ω':'ciągłość'}. Pamiętaj, że symulator nie wykonuje fizycznego pomiaru.`;
    };
    scenario?.addEventListener('change',()=>{mode.value=meterCases[scenario.value].mode;measure();});
    mode?.addEventListener('change',measure);$('#fix51MeasureButton')?.addEventListener('click',measure);measure();
  }

  function bindScope(){
    const canvas=$('#fix51ScopeCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const wave=$('#fix51WaveType'),freq=$('#fix51Freq'),amp=$('#fix51Amp');
    const draw=()=>{
      const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#061321';ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='rgba(82,149,190,.28)';ctx.lineWidth=1;
      for(let x=0;x<=w;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
      for(let y=0;y<=h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      ctx.strokeStyle='rgba(63,207,192,.5)';ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();ctx.setLineDash([]);
      const amplitude=Number(amp.value)*h/12,kind=wave.value,cycles=3.2;ctx.strokeStyle='#54efd0';ctx.lineWidth=5;ctx.shadowColor='#54efd0';ctx.shadowBlur=10;ctx.beginPath();
      for(let x=0;x<=w;x++){
        const phase=x/w*cycles*Math.PI*2,unit=phase/(Math.PI*2),frac=unit-Math.floor(unit);let yv=0;
        if(kind==='sine')yv=Math.sin(phase);
        else if(kind==='square')yv=Math.sin(phase)>=0?1:-1;
        else if(kind==='triangle')yv=1-4*Math.abs(frac-.5);
        else yv=2*frac-1;
        const y=h/2-yv*amplitude;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.stroke();ctx.shadowBlur=0;
      const f=Number(freq.value),a=Number(amp.value);$('#fix51FreqValue').textContent=f>=1000?`${(f/1000).toFixed(f%1000?1:0)} kHz`:`${f} Hz`;
      $('#fix51AmpValue').textContent=`${a.toFixed(1)} V`;
      const names={sine:'sinusoidalny',square:'prostokątny',triangle:'trójkątny',saw:'piłokształtny'};
      $('#fix51ScopeSummary').textContent=`${$('#fix51FreqValue').textContent} · ${a.toFixed(1)} V amplitudy · przebieg ${names[kind]}`;
    };
    [wave,freq,amp].forEach(el=>el?.addEventListener('input',draw));draw();
  }

  const diagnosticCases={
    noPower:[['Zabezpiecz stanowisko','Odłącz zasilacz, sprawdź stan obudowy i zanotuj model oraz rewizję urządzenia.'],['Sprawdź zasilacz','Oceń przewód, wtyk i zgodność zasilacza. Testuj tylko sprawnym, zgodnym zasilaczem.'],['Sprawdź oznaki standby','Obserwuj diody, pobór prądu jeśli masz odpowiedni sprzęt i udokumentowaną procedurę.'],['Zweryfikuj linię wejściową','Po odłączeniu zasilania obejrzyj gniazdo, bezpiecznik i widoczne uszkodzenia. Pomiary płyty wykonuj według schematu.'],['Zapisz hipotezę i wynik','Nie wymieniaj układów na próbę. Zapisz wartości, warunki i test potwierdzający.']],
    noDisplay:[['Wyklucz jasność i wyjście obrazu','Sprawdź jasność, skrót przełączania ekranu i zachowanie z monitorem zewnętrznym.'],['Zapisz zachowanie startu','Czy słychać dźwięk logowania, działa klawiatura i reagują diody?'],['Sprawdź tor matrycy','Po odłączeniu zasilania obejrzyj zawiasy i taśmę. Nie odłączaj eDP przy zasilonym urządzeniu.'],['Zbadaj podświetlenie','Użyj bezpiecznej, właściwej metody diagnostycznej; nie zwieraj pinów ani nie podawaj napięcia na panel.'],['Porównaj z dokumentacją','Zweryfikuj panel, taśmę, złącza i sygnały dla dokładnego modelu i rewizji.']],
    overheat:[['Ustal warunki','Zanotuj temperaturę otoczenia, obciążenie, profile zasilania i moment wzrostu temperatur.'],['Sprawdź przepływ powietrza','Oceń wloty i wyloty, stan wentylatora i drożność radiatora.'],['Porównaj czujniki','Oddziel temperaturę CPU, GPU, hotspot i dysku. Nie zakładaj, że jeden czujnik opisuje cały układ.'],['Oceń kontakt termiczny','Po odłączeniu zasilania sprawdź docisk radiatora, pastę i właściwy typ/grubość padów według serwisówki.'],['Wykonaj test po naprawie','Powtórz ten sam scenariusz obciążenia i zapisz wynik przed/po.']],
    noCharge:[['Sprawdź zasilacz i kabel','Użyj zgodnego źródła i przewodu o odpowiedniej mocy. Obejrzyj port pod kątem uszkodzeń.'],['Zweryfikuj negocjację PD','Sprawdź, czy urządzenie i ładowarka uzgadniają zgodny profil. Nie wymuszaj napięcia.'],['Oceń gniazdo USB-C','Szukaj luzu, zabrudzeń i uszkodzonych pinów. Przed czyszczeniem odłącz zasilanie.'],['Przejdź do schematu','Zweryfikuj kontroler ładowania, linie CC, zabezpieczenia i tor wejściowy dla konkretnej rewizji.'],['Udokumentuj test końcowy','Zapisz moc, profil PD, temperaturę i zachowanie ładowania z drugim sprawnym zestawem.']]
  };
  let diagnosticIndex=0;
  function renderDiagnostic(){
    const list=diagnosticCases[$('#fix51DiagnosticCase')?.value||'noPower'];if(!list)return;
    const [title,text]=list[diagnosticIndex];$('#fix51DiagProgress').textContent=`KROK ${diagnosticIndex+1} / ${list.length}`;$('#fix51DiagTitle').textContent=title;$('#fix51DiagText').textContent=text;
    $('#fix51DiagNext').textContent=diagnosticIndex===list.length-1?'Zakończ przypadek ✓':'Następny krok →';
  }
  function bindDiagnostics(){
    $('#fix51DiagnosticCase')?.addEventListener('change',()=>{diagnosticIndex=0;renderDiagnostic();});
    $('#fix51DiagReset')?.addEventListener('click',()=>{diagnosticIndex=0;renderDiagnostic();});
    $('#fix51DiagNext')?.addEventListener('click',()=>{const list=diagnosticCases[$('#fix51DiagnosticCase').value];if(diagnosticIndex<list.length-1)diagnosticIndex++;else diagnosticIndex=0;renderDiagnostic();});
    renderDiagnostic();
  }

  function bindLayerExplorer(){
    const parts=[
      ['matryca','Matryca','Wyświetla obraz. Przy braku obrazu sprawdź tor GPU → eDP/LVDS → panel i podświetlenie.'],
      ['zawiasy','Zawiasy','Przenoszą obciążenia mechaniczne. Sprawdź mocowania, pęknięcia obudowy i prowadzenie taśmy.'],
      ['plyta','Płyta główna','Zawiera układy logiczne, zasilanie i interfejsy. Weryfikuj oznaczenie i rewizję PCB.'],
      ['chlodzenie','Układ chłodzenia','Odprowadza ciepło z CPU/GPU. Sprawdź wentylator, radiator, heatpipe i kontakt termiczny.'],
      ['dysk','Dysk SSD','Przechowuje dane. Zabezpiecz pliki przed testami, które mogą obciążać lub modyfikować nośnik.'],
      ['bateria','Bateria','Zasila urządzenie mobilnie. Oceniaj stan pakietu i odłączaj go zgodnie z serwisówką.']
    ];
    const host=$('#fix51LayerButtons');if(!host)return;
    host.innerHTML=parts.map((part,i)=>`<button class="fix51-layer-button${i===0?' is-selected':''}" type="button" data-layer="${i}">${part[1]}</button>`).join('');
    host.addEventListener('click',event=>{const btn=event.target.closest('[data-layer]');if(!btn)return;const item=parts[Number(btn.dataset.layer)];if(!item)return;host.querySelectorAll('.fix51-layer-button').forEach(x=>x.classList.toggle('is-selected',x===btn));$('#fix51LayerInfo').textContent=`${item[1]}: ${item[2]}`;});
    $('#fix51LayerInfo').textContent=`${parts[0][1]}: ${parts[0][2]}`;
  }

  function bindImageQuiz(){
    const questions=[
      {asset:'04-ram-ddr4-ddr5',q:'Który moduł na planszy opisano jako DDR5?',options:['Po lewej stronie','Po prawej stronie','Oba moduły'],correct:1,explain:'DDR5 jest oznaczone po prawej stronie planszy.'},
      {asset:'05-ssd-sata-nvme',q:'Czy każde gniazdo M.2 oznacza nośnik NVMe?',options:['Tak, zawsze','Nie, M.2 jest formatem; interfejs może być SATA lub PCIe'],correct:1,explain:'M.2 określa format/złącze. Obsługiwany interfejs zależy od platformy.'},
      {asset:'01-motherboard-map',q:'Który obszar na mapie płyty odpowiada za pamięć operacyjną?',options:['Sloty RAM','Gniazdo M.2','Chipset'],correct:0,explain:'Pamięć operacyjna jest montowana w slotach DIMM/SO-DIMM.'},
      {asset:'06-multimeter-guide',q:'Do którego gniazda podłącza się czarny przewód miernika?',options:['V/Ω','COM','A'],correct:1,explain:'Czarny przewód jest zwykle podłączany do COM. Zawsze sprawdź instrukcję miernika.'},
      {asset:'08-cooling-flow',q:'Który element transportuje ciepło do radiatora?',options:['Taśma eDP','Heatpipe','Slot RAM'],correct:1,explain:'Heatpipe przenosi energię cieplną między podstawą a radiatorem.'}
    ];
    let index=0,score=0,answered=false;
    const render=()=>{const item=questions[index];const asset=assets.find(x=>x.id===item.asset);if(asset)$('#fix51QuizImage').src=asset.src;$('#fix51QuizImage').alt=asset?.title||'Ilustracja pytania';$('#fix51QuizProgress').textContent=`Pytanie ${index+1} / ${questions.length} · wynik ${score}`;$('#fix51QuizQuestion').textContent=item.q;$('#fix51QuizFeedback').textContent='Wybierz odpowiedź.';$('#fix51QuizNext').disabled=true;$('#fix51QuizNext').textContent=index===questions.length-1?'Zakończ quiz':'Następne pytanie →';answered=false;$('#fix51QuizOptions').innerHTML=item.options.map((option,i)=>`<button type="button" data-quiz-answer="${i}" class="fix51-quiz-option">${option}</button>`).join('');};
    $('#fix51QuizOptions')?.addEventListener('click',event=>{const button=event.target.closest('[data-quiz-answer]');if(!button||answered)return;answered=true;const item=questions[index],choice=Number(button.dataset.quizAnswer),correct=choice===item.correct;if(correct)score++;$('#fix51QuizOptions').querySelectorAll('button').forEach((b,i)=>{b.disabled=true;if(i===item.correct)b.classList.add('is-correct');if(i===choice&&!correct)b.classList.add('is-wrong');});$('#fix51QuizFeedback').textContent=`${correct?'Poprawnie.':'Nie tym razem.'} ${item.explain}`;$('#fix51QuizProgress').textContent=`Pytanie ${index+1} / ${questions.length} · wynik ${score}`;$('#fix51QuizNext').disabled=false;});
    $('#fix51QuizNext')?.addEventListener('click',()=>{if(!answered)return;if(index<questions.length-1){index++;render();}else{const final=score;index=0;score=0;render();$('#fix51QuizFeedback').textContent=`Quiz zakończony: ${final}/${questions.length}. Możesz rozpocząć kolejną próbę.`;}});
    render();
  }

  function bindBeforeAfter(){
    const before=$('#fix51BeforeInput'),after=$('#fix51AfterInput');if(!before||!after)return;
    let beforeUrl=null,afterUrl=null;
    const update=()=>{const a=$('#fix51CompareBefore'),b=$('#fix51CompareAfter'),line=$('#fix51CompareLine'),clip=$('#fix51CompareAfterClip'),placeholder=$('#fix51ComparePlaceholder'),frame=$('#fix51CompareFrame');const ready=!!beforeUrl&&!!afterUrl;const width=frame.getBoundingClientRect().width;a.hidden=!beforeUrl;b.hidden=!afterUrl;if(beforeUrl)a.src=beforeUrl;if(afterUrl)b.src=afterUrl;b.style.width=`${width}px`;placeholder.hidden=ready;line.hidden=!ready;clip.style.width=`${$('#fix51CompareRange').value}%`;line.style.left=`${$('#fix51CompareRange').value}%`;};
    const accept=(input,key)=>{const file=input.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){input.value='';return;}if(key==='before'&&beforeUrl)URL.revokeObjectURL(beforeUrl);if(key==='after'&&afterUrl)URL.revokeObjectURL(afterUrl);const url=URL.createObjectURL(file);if(key==='before')beforeUrl=url;else afterUrl=url;update();};
    before.addEventListener('change',()=>accept(before,'before'));after.addEventListener('change',()=>accept(after,'after'));$('#fix51CompareRange')?.addEventListener('input',()=>update());window.addEventListener('resize',update);
    $('#fix51CompareReset')?.addEventListener('click',()=>{if(beforeUrl)URL.revokeObjectURL(beforeUrl);if(afterUrl)URL.revokeObjectURL(afterUrl);beforeUrl=afterUrl=null;before.value='';after.value='';update();});
    window.addEventListener('beforeunload',()=>{if(beforeUrl)URL.revokeObjectURL(beforeUrl);if(afterUrl)URL.revokeObjectURL(afterUrl);},{once:true});update();
  }

  function verifyAssets(){
    const all=[...photoPaths,...posterPaths,...assets.map(a=>a.src)];let done=0,failed=[];
    const status=$('#fix51AssetHealth');
    const finish=()=>{
      done++;if(done!==all.length)return;
      const okay=all.length-failed.length;
      status.classList.toggle('is-ready',failed.length===0);status.classList.toggle('has-errors',failed.length>0);
      status.innerHTML=`<span class="fix51-dot"></span><b>${okay}/${all.length} plików wizualnych załadowanych${failed.length?` · ${failed.length} błędów`:''}</b>`;
      status.title=failed.length?`Nie udało się załadować: ${failed.join(', ')}`:'Wszystkie lokalne fotografie i ilustracje zweryfikowano przez ładowanie obrazu w przeglądarce.';
    };
    all.forEach(src=>{const img=new Image();img.onload=finish;img.onerror=()=>{failed.push(src);finish();};img.src=src;});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
