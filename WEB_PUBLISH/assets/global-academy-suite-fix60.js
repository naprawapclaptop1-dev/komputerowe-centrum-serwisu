/* NAUKA OD A DO Z — GLOBAL ACADEMY SUITE FIX54–FIX60
 * Local-first integration layer for quality, learning media, AI diagnosis,
 * device families, workshop cases, exams, analytics and offline packs.
 * No D1 schema changes, no automatic customer-data upload, no hardware writes.
 */
(() => {
  'use strict';
  const BUILD = '6.8.0-fix60-global-academy-suite-20261105';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n || 0).toLocaleString('pl-PL');
  const STORAGE = {
    cases: 'npaFix60WorkshopCasesV1',
    analytics: 'npaFix60LearningAnalyticsV1',
    exam: 'npaFix60ExamHistoryV1',
    prefs: 'npaFix60PrefsV1'
  };
  const photos = [
    ['assets/artwork-fix77/gax-media-01.svg','Podstawy elektroniki','Ilustracja techniczna'],
    ['assets/artwork-fix77/gax-media-02.svg','Pomiary','Ilustracja techniczna'],
    ['assets/artwork-fix77/gax-media-03.svg','Zasilanie','Ilustracja techniczna'],
    ['assets/artwork-fix77/gax-media-04.svg','Płyty główne','Ilustracja techniczna'],
    ['assets/artwork-fix77/gax-media-05.svg','Procesory','Ilustracja techniczna'],
    ['assets/artwork-fix77/gax-media-06.svg','Serwis laptopa','Ilustracja techniczna'],
    ['assets/artwork-fix77/gax-media-07.svg','Procedury','Ilustracja techniczna'],
    ['assets/artwork-fix77/gax-media-08.svg','Egzaminy','Ilustracja techniczna'],
  ];
  const posters = [['assets/artwork-fix77/video-index-01.svg','Windows — serwis i diagnostyka'],['assets/artwork-fix77/video-index-02.svg','Secure Boot i BitLocker'],['assets/artwork-fix77/video-index-03.svg','NPU i AI PC']];
  const diagrams = [
    ['assets/artwork-fix51/01-motherboard-map.svg','Mapa płyty głównej','Płyty'],
    ['assets/artwork-fix51/02-power-vrm.svg','Sekcja zasilania VRM','Elektronika'],
    ['assets/artwork-fix51/03-laptop-exploded.svg','Laptop — widok warstwowy','Mechanika'],
    ['assets/artwork-fix51/04-ram-ddr4-ddr5.svg','RAM DDR4 / DDR5','Pamięć'],
    ['assets/artwork-fix51/05-ssd-sata-nvme.svg','SATA, M.2 i NVMe','Dyski'],
    ['assets/artwork-fix51/06-multimeter-guide.svg','Multimetr — porty i tryby','Pomiary'],
    ['assets/artwork-fix51/07-oscilloscope-guide.svg','Oscyloskop — skale','Pomiary'],
    ['assets/artwork-fix51/08-cooling-flow.svg','Układ chłodzenia','Chłodzenie'],
    ['assets/artwork-fix51/09-display-chain.svg','Tor obrazu eDP','Matryce'],
    ['assets/artwork-fix51/10-bios-boot.svg','BIOS / UEFI — rozruch','BIOS'],
    ['assets/artwork-fix51/11-usbc-pd.svg','USB-C Power Delivery','Zasilanie'],
    ['assets/artwork-fix51/12-esd-safety.svg','Bezpieczeństwo ESD','BHP'],
    ['assets/artwork-fix51/13-gpu-layout.svg','GPU, VRAM i VRM','Grafika'],
    ['assets/artwork-fix51/14-smart-drive.svg','SMART i diagnostyka dysku','Dyski'],
    ['assets/artwork-fix51/15-wifi-network.svg','Diagnostyka Wi-Fi','Sieci'],
    ['assets/artwork-fix51/16-diagnostic-flow.svg','Diagnostyka krok po kroku','Diagnostyka'],
    ['assets/artwork-fix51/17-audio-circuit.svg','Tor audio','Audio'],
    ['assets/artwork-fix51/18-connector-pinout.svg','Złącza i grupy sygnałów','Złącza'],
    ['assets/artwork-fix54/19-power-path.svg','Tor zasilania DC-IN','Zasilanie'],
    ['assets/artwork-fix54/20-bios-firmware-flow.svg','BIOS, EC i sekwencja POST','BIOS'],
    ['assets/artwork-fix54/21-storage-interface.svg','Interfejsy SATA i NVMe','Dyski'],
    ['assets/artwork-fix54/22-memory-diagnostics.svg','Diagnostyka pamięci RAM','Pamięć'],
    ['assets/artwork-fix54/23-display-edp-path.svg','Tor obrazu eDP i matryca','Matryce'],
    ['assets/artwork-fix54/24-fan-control-flow.svg','Sterowanie wentylatorem','Chłodzenie'],
    ['assets/artwork-fix54/25-audio-signal-path.svg','Tor audio laptopa','Audio'],
    ['assets/artwork-fix54/26-wifi-network-path.svg','Tor Wi-Fi i anteny','Sieci'],
    ['assets/artwork-fix54/27-esd-workbench.svg','Stanowisko ESD i bezpieczeństwo','BHP'],
    ['assets/artwork-fix54/28-data-recovery-workflow.svg','Bezpieczna ścieżka odzyskiwania danych','Dyski'],
    ['assets/artwork-fix54/29-gpu-thermal-path.svg','GPU — chłodzenie i termika','Grafika'],
    ['assets/artwork-fix54/30-keyboard-touchpad.svg','Klawiatura, touchpad i EC','Urządzenia wejściowe']
  ];
  const allVisual = [...photos.map(x=>x[0]), ...posters.map(x=>x[0]), ...diagrams.map(x=>x[0])];
  const questions = [
    {q:'Jaka czynność powinna poprzedzać otwarcie laptopa?',a:['Odłączenie zasilacza i przygotowanie stanowiska ESD','Wgranie BIOS','Formatowanie dysku'],c:0,e:'Najpierw odłącz zasilanie, sprawdź procedurę producenta i przygotuj bezpieczne stanowisko.'},
    {q:'Czy M.2 oznacza zawsze NVMe?',a:['Tak, zawsze','Nie — M.2 jest formatem, a nośnik może używać SATA lub NVMe','Tylko w laptopach'],c:1,e:'M.2 opisuje format złącza/modułu. Interfejs i protokół trzeba potwierdzić.'},
    {q:'Co należy zrobić przed testem nośnika z objawami awarii?',a:['Uruchomić zapisowy benchmark','Zabezpieczyć ważne dane i ocenić SMART','Od razu wykonać secure erase'],c:1,e:'Najpierw zabezpiecz dane. Unikaj testów obciążających i operacji zapisujących przy ryzyku utraty danych.'},
    {q:'Do czego służy linia CC w USB-C Power Delivery?',a:['Negocjacji i konfiguracji połączenia','Wyłącznie do obrazu HDMI','Do chłodzenia portu'],c:0,e:'Linie CC uczestniczą w wykrywaniu połączenia i negocjacji USB-C/PD.'},
    {q:'Czy ogólny schemat edukacyjny VRM zastępuje boardview konkretnej płyty?',a:['Tak','Nie — potrzebna jest dokumentacja konkretnego modelu i rewizji','Tylko przy pomiarze rezystancji'],c:1,e:'Ilustracje edukacyjne są poglądowe. Zawsze weryfikuj punkty i wartości dla konkretnej rewizji.'},
    {q:'Jaki tryb multimetru jest używany do pomiaru napięcia stałego?',a:['V~','V⎓','Ω'],c:1,e:'V⎓ oznacza napięcie stałe. Symulator FIX51 pokazuje przykładowe odczyty, nie realny pomiar.'},
    {q:'Co może powodować wysoką temperaturę laptopa?',a:['Zatkana droga powietrza lub problem kontaktu termicznego','Wyłącznie uszkodzony SSD','Zawsze błędny BIOS'],c:0,e:'Sprawdź wentylator, radiator, kanały, kontakt termiczny i obciążenie.'},
    {q:'Co oznacza POST?',a:['Power-On Self-Test','Program do overclockingu','Protokół sieciowy'],c:0,e:'POST to etap testów sprzętowych wykonywany podczas uruchamiania.'},
    {q:'Czy wolno mierzyć rezystancję na zasilonej płycie?',a:['Tak, zawsze','Nie — układ musi być odłączony od zasilania i rozładowany zgodnie z procedurą','Tylko przy USB-C'],c:1,e:'Pomiar rezystancji wykonuj wyłącznie na odłączonym i bezpiecznie rozładowanym układzie.'},
    {q:'Co jest potrzebne do wiarygodnego doboru BIOS?',a:['Sam kolor obudowy','Dokładny model, identyfikacja płyty i rewizji oraz oficjalne źródło','Dowolny plik o podobnej nazwie'],c:1,e:'Firmware musi odpowiadać dokładnemu modelowi i rewizji; nie flashuj pliku na podstawie podobieństwa.'},
    {q:'Co należy zrobić przed aktualizacją firmware?',a:['Sprawdzić dokładną zgodność i stabilne zasilanie oraz wykonać kopię ważnych danych','Użyć pierwszego pliku z wyszukiwarki','Odłączyć zasilanie w trakcie aktualizacji'],c:0,e:'Aktualizacja firmware ma ryzyko unieruchomienia urządzenia. Stosuj wyłącznie oficjalną procedurę dla modelu i rewizji.'},
    {q:'Jaki jest bezpieczny pierwszy krok przy podejrzeniu awarii dysku z ważnymi danymi?',a:['Wielokrotnie restartować i uruchamiać benchmark','Ograniczyć dalszą pracę i ustalić plan kopii danych','Wykonać secure erase'],c:1,e:'Minimalizuj zapisy i obciążenie. Przy awarii mechanicznej rozważ specjalistyczne laboratorium.'},
    {q:'Czy wymiana pasty termicznej rozwiązuje każdą wysoką temperaturę?',a:['Tak','Nie — trzeba sprawdzić przepływ powietrza, wentylator, docisk i obciążenie','Tylko w komputerach stacjonarnych'],c:1,e:'Temperatura zależy od całego układu chłodzenia i warunków pracy.'},
    {q:'Co oznacza SMART?',a:['System monitorowania i raportowania stanu nośnika','Typ pamięci RAM','Protokół ładowania USB-C'],c:0,e:'SMART dostarcza atrybutów i logów, ale nie daje gwarancji odzyskania danych ani pełnej diagnozy.'},
    {q:'Co sprawdzić, gdy obraz jest czarny tylko na matrycy laptopa?',a:['Od razu wymienić GPU','Porównać zachowanie z zewnętrznym ekranem i sprawdzić tor matrycy','Sformatować dysk'],c:1,e:'Test rozdzielający pomaga odróżnić problem toru obrazu od problemu całej platformy.'},
    {q:'Dlaczego warto zapisać warunki pomiaru?',a:['Aby drugi technik mógł odtworzyć test i porównać wynik','Nie ma to znaczenia','Tylko do rozliczenia czasu'],c:0,e:'Punkt, zakres, tryb, warunki i wynik pozwalają na powtarzalność diagnozy.'},
    {q:'Czy ogólny opis modelu potwierdza zgodność części?',a:['Tak','Nie — trzeba potwierdzić pełny numer części, model i rewizję','Wystarczy podobna przekątna ekranu'],c:1,e:'Nazwy rodzin są orientacyjne. Weryfikuj FRU/part number i dokumentację producenta.'},
    {q:'Jak postąpić przy spuchniętej baterii?',a:['Kontynuować test obciążeniowy','Przerwać pracę i zastosować procedurę bezpieczeństwa dla baterii','Przebić obudowę, aby zmniejszyć ciśnienie'],c:1,e:'Nie naciskaj, nie przebijaj i nie podgrzewaj uszkodzonej baterii. Zabezpiecz stanowisko zgodnie z procedurą.'}
  ];
  const casesSeed = [
    {id:'CASE-DEMO-01',title:'Laptop nie uruchamia się',category:'Zasilanie',symptom:'Brak reakcji po naciśnięciu przycisku.',checks:['Sprawdź zasilacz i zgodność parametrów z etykietą urządzenia.','Odłącz akcesoria; zanotuj diody i reakcję urządzenia.','Oceń stan gniazda i widoczne uszkodzenia bez podawania zasilania na otwartym urządzeniu.'],stop:'Jeśli widzisz ślady zalania, zwęglenia lub uszkodzenie baterii — przerwij i zastosuj procedurę bezpieczeństwa.'},
    {id:'CASE-DEMO-02',title:'Laptop przegrzewa się',category:'Chłodzenie',symptom:'Wysoka temperatura i głośny wentylator.',checks:['Zapisz temperaturę, obciążenie i objawy w spoczynku.','Sprawdź drożność wlotów i wylotów powietrza.','Po odłączeniu zasilania oceń wentylator, radiator i mocowanie.'],stop:'Nie uruchamiaj urządzenia z odłączonym lub zablokowanym wentylatorem.'},
    {id:'CASE-DEMO-03',title:'Brak obrazu na matrycy',category:'Ekran',symptom:'Urządzenie uruchamia się, ale ekran pozostaje czarny.',checks:['Sprawdź diody, dźwięki POST i zachowanie z monitorem zewnętrznym.','Zweryfikuj ustawienia jasności i trybu wyświetlania.','Po odłączeniu zasilania sprawdź połączenia zgodnie z instrukcją serwisową.'],stop:'Nie rozłączaj taśmy matrycy przy podłączonej baterii lub zasilaczu.'}
  ];
  const packs = [
    {id:'basics',name:'Podstawy serwisu',files:['index.html','assets/global-academy-suite-fix60.js','assets/global-academy-suite-fix60.css',...photos.slice(0,4).map(x=>x[0]),diagrams[0][0],diagrams[11][0]]},
    {id:'board',name:'Płyty główne i VRM',files:[photos[0][0],photos[3][0],photos[6][0],photos[7][0],diagrams[0][0],diagrams[1][0],diagrams[5][0],diagrams[9][0]]},
    {id:'storage',name:'Dyski i odzyskiwanie danych',files:[photos[2][0],photos[8][0],diagrams[4][0],diagrams[13][0]]},
    {id:'power',name:'Zasilanie i USB-C',files:[photos[9][0],photos[3][0],diagrams[1][0],diagrams[10][0]]},
    {id:'full',name:'Pełna biblioteka wizualna',files:allVisual}
  ];
  let root, activeTab='overview', examState=null, visualQuery='', modelRemote=[], lastAudit=[];
  const read = (key, fallback) => { try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const casesGet = () => read(STORAGE.cases, []);
  const analyticsGet = () => read(STORAGE.analytics, []);
  function track(event, detail='') {
    const list=analyticsGet(); list.push({event,detail:String(detail).slice(0,100),at:new Date().toISOString()});
    if(list.length>500) list.splice(0,list.length-500);
    write(STORAGE.analytics,list);
  }
  function navTo(view){ if(window.ACADEMY_SHOW_VIEW) window.ACADEMY_SHOW_VIEW(view); else { const s=$('#view-'+view); if(s){$$('.view-section').forEach(x=>{x.hidden=x!==s;x.classList.toggle('active',x===s);});} } }
  function setTab(tab){ activeTab=tab; track('module',tab); renderPanel(); $$('.gas-tab',root).forEach(b=>{const on=b.dataset.gasTab===tab;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on));}); }
  function shell(){
    if(!root)return;
    root.innerHTML=`
      <header class="gas-hero"><div><span class="gas-kicker">FIX54–FIX60 · CENTRUM ROZWOJU PLATFORMY</span><h1>GLOBAL ACADEMY <em>PRO</em></h1><p>Jedno centrum kontroli jakości, diagnostyki, wiedzy sprzętowej, warsztatu, egzaminów i nauki offline.</p><div class="gas-hero-meta"><span>Build bazowy: 6.8.0 FIX51 + pakiet funkcji FIX54–FIX60</span><span id="gasLocalState">Sprawdzam pamięć lokalną…</span></div></div><div class="gas-hero-mark"><b>54—60</b><small>GLOBAL SUITE</small></div></header>
      <div class="gas-metrics"><article><b id="gasMetricModels">—</b><span>przykładowe modele</span></article><article><b id="gasMetricPhotos">12</b><span>lokalne fotografie</span></article><article><b id="gasMetricDiagrams">30</b><span>diagramów technicznych</span></article><article><b id="gasMetricCases">0</b><span>lokalne sprawy</span></article><article><b id="gasMetricProgress">0</b><span>zdarzeń nauki lokalnej</span></article></div>
      <nav class="gas-tabs" role="tablist" aria-label="Moduły Centrum wiedzy Nauka od A do Z">${[['overview','Przegląd'],['search','Szukaj globalnie'],['knowledge','Mapa wiedzy'],['quality','Kontrola jakości'],['visual','Ilustracje techniczne'],['diagnostics','Diagnostyka AI'],['models','Baza urządzeń'],['workshop','Warsztat'],['exams','Egzaminy'],['offline','Offline i kopie'],['security','Bezpieczeństwo'],['analytics','Postępy i prywatność']].map(([id,label])=>`<button type="button" class="gas-tab ${id===activeTab?'is-active':''}" data-gas-tab="${id}" role="tab" aria-selected="${id===activeTab}">${label}</button>`).join('')}</nav>
      <main id="gasPanel" class="gas-panel" aria-live="polite"></main>
      <footer class="gas-foot"><span>NAUKA OD A DO Z — DLA WSZYSTKICH · FIX54–FIX60</span><span>Local-first · bez migracji D1 · bez automatycznych zapisów danych klienta</span></footer>`;
    updateMetrics(); renderPanel();
  }
  function updateMetrics(){
    const models=(window.ACADEMY_DEVICE_CATALOG?.brands||[]).reduce((n,b)=>n+(b.models?.length||0),0);
    const values={gasMetricModels:models,gasMetricPhotos:photos.length,gasMetricDiagrams:diagrams.length,gasMetricCases:casesGet().length,gasMetricProgress:analyticsGet().length};
    for(const [id,v] of Object.entries(values)){const e=$('#'+id,root);if(e)e.textContent=fmt(v);}
    const s=$('#gasLocalState',root); if(s){try{localStorage.setItem('__gas_probe','1');localStorage.removeItem('__gas_probe');s.textContent='Pamięć lokalna: dostępna';}catch{s.textContent='Pamięć lokalna: niedostępna — eksportuj dane po każdej sesji';}}
  }
  function renderPanel(){
    const panel=$('#gasPanel',root);if(!panel)return;
    const renderers={overview:overview,search:search,knowledge:knowledge,quality:quality,visual:visual,diagnostics:diagnostics,models:models,workshop:workshop,exams:exams,offline:offline,security:security,analytics:analytics};
    panel.innerHTML=(renderers[activeTab]||overview)();
    if(activeTab==='visual') bindVisual();
    if(activeTab==='diagnostics') bindDiagnostics();
    if(activeTab==='models') bindModels();
    if(activeTab==='workshop') bindWorkshop();
    if(activeTab==='exams') bindExams();
    if(activeTab==='offline') bindOffline();
    if(activeTab==='analytics') bindAnalytics();
    if(activeTab==='security') bindSecurity();
    if(activeTab==='quality') bindQuality();
    if(activeTab==='search') bindSearch();
    if(activeTab==='knowledge') bindKnowledge();
  }
  function overview(){
    const recent=analyticsGet().slice(-6).reverse();
    return `<div class="gas-section-head"><div><span class="gas-kicker">PANEL GŁÓWNY</span><h2>Wszystkie obszary w jednym miejscu</h2><p>Rozszerzenie wykorzystuje istniejące API i katalog. Dane warsztatowe i wyniki poniższych ćwiczeń pozostają w tej przeglądarce.</p></div><div class="gas-form-actions"><button class="gas-btn gas-btn-primary" data-gas-goto="quality">Uruchom kontrolę platformy</button><button class="gas-btn" data-gas-community>Otwórz społeczność</button></div></div>
      <div class="gas-feature-grid">
        ${[['search','⌕','PRO','Global Search','Jedno wyszukiwanie kursów, usterek, modeli, zdjęć i schematów.'],['knowledge','⌘','PRO','Knowledge Graph','Mapa powiązań pojęć i procedur — relacje edukacyjne, nie kompatybilność OEM.'],['quality','◈','FIX54','Kontrola jakości','Sprawdź zasoby, API, widoki i Service Workera.'],['visual','▧','FIX55','Biblioteka wizualna','Przeglądaj fotografie, plakaty, 30 diagramów i katalog szkoleń wideo.'],['diagnostics','⌕','FIX56','Diagnostyka AI','Wyślij opis objawu do istniejącego, chronionego API czatu.'],['models','▦','FIX57','Baza urządzeń','Wyszukaj rodziny i modele z katalogu oraz zatwierdzone wpisy.'],['workshop','⚒','FIX58','Dziennik warsztatu','Prowadź lokalne sprawy napraw i eksportuj kopię.'],['exams','✓','FIX59','Egzaminy i certyfikaty','Rozwiązuj testy wiedzy i zapisuj wyniki lokalnie.'],['offline','⇩','FIX60','Akademia offline','Pobierz wybrane pakiety do cache przeglądarki.'],['security','◉','FIX54','Security Center','Stan sesji, bezpieczny kontekst, API i dane lokalne.'],['analytics','⌁','PRO','Postępy i prywatność','Sprawdź aktywność lokalną i eksportuj/usuń dane modułu.']].map(([tab,icon,tag,title,desc])=>`<button type="button" class="gas-feature" data-gas-goto="${tab}"><span class="gas-feature-icon">${icon}</span><span class="gas-feature-tag">${tag}</span><b>${title}</b><small>${desc}</small><i>Otwórz moduł →</i></button>`).join('')}
      </div>
      <div class="gas-two-col"><section class="gas-card"><div class="gas-card-head"><h3>Ostatnia aktywność</h3><span>lokalnie</span></div>${recent.length?`<ul class="gas-event-list">${recent.map(x=>`<li><b>${esc(x.event)}</b><span>${esc(x.detail)}</span><time>${new Date(x.at).toLocaleString('pl-PL')}</time></li>`).join('')}</ul>`:'<p class="gas-muted">Brak zapisanych zdarzeń. Otwórz moduł, aby rozpocząć naukę.</p>'}</section><section class="gas-card"><div class="gas-card-head"><h3>Zakres i ograniczenia</h3><span>ważne</span></div><ul class="gas-safe-list"><li>AI korzysta z istniejącego endpointu `/api/chat`; klucz pozostaje po stronie serwera.</li><li>Katalog modeli zawiera rodziny/przykłady — wymaga potwierdzenia dokładnego SKU i rewizji PCB.</li><li>Nowy dziennik warsztatu zapisuje się tylko lokalnie; nie wpisuj nazwisk, telefonów ani haseł klientów.</li><li>Certyfikaty z tego modułu są lokalnymi potwierdzeniami ćwiczeń, nie akredytacją zawodową.</li><li>Pakiety offline trafiają do Cache Storage tej przeglądarki i nie synchronizują się automatycznie między urządzeniami.</li></ul></section></div>`;
  }
  function collectGlobalSearch(query){
    const q=String(query||'').trim().toLocaleLowerCase('pl-PL');if(q.length<2)return [];
    const rows=[];const add=(type,title,desc,view,action='')=>{const hay=`${title} ${desc}`.toLocaleLowerCase('pl-PL');if(hay.includes(q))rows.push({type,title,desc,view,action});};
    const data=window.ACADEMY_DATA||{};
    for(const [key,type] of [['faults','Usterka'],['courseLessons','Lekcja'],['courseTopics','Temat kursu'],['beginnerLessons','Podstawy'],['library','Biblioteka'],['htmlArticles','Artykuł'],['components','Komponent']]){
      for(const item of (data[key]||[])){const title=item.title||item.name||item.label||item.id||type;const desc=[item.description,item.symptom,item.symptoms,item.category,item.body,item.tags].filter(Boolean).join(' · ');add(type,title,desc,key==='faults'?'repairs':key==='library'?'library':key==='components'?'components':'courses',item.id||'');}
    }
    for(const b of (window.ACADEMY_DEVICE_CATALOG?.brands||[])){for(const m of (b.models||[]))add('Model',`${b.brand} ${m[1]||m[0]}`,`${m[0]} · ${b.region||''}`,'globalacademy','models');for(const f of (b.families||[]))add('Rodzina',`${b.brand} ${f[0]}`,f[1]||b.region||'','globalacademy','models');}
    for(const x of diagrams)add('Schemat',x[1],x[2],'globalacademy','visual');for(const x of photos)add('Fotografia',x[1],x[2],'globalacademy','visual');for(const v of (window.ACADEMY_LONG_VIDEOS||[]))add('Kurs wideo',v.title,`${v.category||''} · ${v.description||''}`,'globalacademy','visual');
    return rows.slice(0,80);
  }
  function search(){return `<div class="gas-section-head"><div><span class="gas-kicker">UNIVERSAL SEARCH · CROSS-MODULE</span><h2>Wyszukiwanie globalne</h2><p>Jedno pole przeszukuje lokalny katalog lekcji, usterek, elementów, biblioteki, modeli oraz materiałów wizualnych załadowanych w aplikacji.</p></div><span class="gas-count-pill">PL / lokalny indeks</span></div><div class="gas-toolbar"><input id="gasGlobalSearch" type="search" placeholder="Wpisz np. VRM, ThinkPad T480, brak obrazu, NVMe…"><button class="gas-btn" id="gasGlobalClear">Wyczyść</button></div><div id="gasGlobalSearchResults" class="gas-search-results"><p class="gas-muted">Wpisz przynajmniej 2 znaki.</p></div><div class="gas-warning">Wyszukiwanie obejmuje treści obecne w bieżącym katalogu przeglądarki. Nie jest to pełnotekstowe wyszukiwanie wszystkich plików PDF ani zewnętrznego Internetu.</div>`;}
  function bindSearch(){
    const input=$('#gasGlobalSearch',root), box=$('#gasGlobalSearchResults',root);if(!input||!box)return;
    const render=()=>{const rows=collectGlobalSearch(input.value);box.innerHTML=rows.length?rows.map((x,i)=>`<button type="button" class="gas-search-result" data-search-index="${i}"><span>${esc(x.type)}</span><b>${esc(x.title)}</b><small>${esc(x.desc||'Brak dodatkowego opisu.')}</small><i>Otwórz moduł →</i></button>`).join(''):`<p class="gas-muted">${input.value.trim().length<2?'Wpisz przynajmniej 2 znaki.':'Brak dopasowań w lokalnym indeksie.'}</p>`;box._gasRows=rows;};
    input.addEventListener('input',render);$('#gasGlobalClear',root)?.addEventListener('click',()=>{input.value='';render();input.focus();});
    box.addEventListener('click',e=>{const b=e.target.closest('[data-search-index]');if(!b)return;const item=box._gasRows?.[Number(b.dataset.searchIndex)];if(!item)return;if(item.view==='globalacademy'){setTab(item.action||'overview');if(item.action==='models'){$('#gasModelSearch',root).value=item.title;renderModels();}}else{navTo(item.view);if(item.view==='repairs'&&item.action){const search=$('#repairSearch');if(search){search.value=item.title;search.dispatchEvent(new Event('input',{bubbles:true}));}}if(item.view==='courses'){const search=$('#courseSearch');if(search){search.value=item.title;search.dispatchEvent(new Event('input',{bubbles:true}));}}}track('global-search',item.type);});
  }
  const knowledgeNodes=[
    {id:'power',name:'Zasilanie i szyny',desc:'Wejście DC, zabezpieczenia, przetwornice i VRM',children:['usbpd','vrm','bios']},
    {id:'vrm',name:'Sekcja VRM',desc:'Kontroler PWM, MOSFET, cewki i kondensatory',children:['measure','board']},
    {id:'usbpd',name:'USB-C Power Delivery',desc:'Port, linie CC, profile PDO/PPS i zabezpieczenia',children:['power','measure']},
    {id:'bios',name:'BIOS / UEFI',desc:'SPI firmware, EC, POST, konfiguracja i rozruch',children:['board','storage']},
    {id:'board',name:'Płyta główna',desc:'Identyfikacja modelu, rewizja PCB i dokumentacja',children:['vrm','bios','ram']},
    {id:'ram',name:'RAM i POST',desc:'Generacja modułu, slot, trening pamięci i testy',children:['board','diagnostics']},
    {id:'storage',name:'SSD / HDD',desc:'SMART, kopia danych i diagnostyka nośnika',children:['bios','diagnostics']},
    {id:'display',name:'Matryca i eDP',desc:'Panel LCD, taśma, zasilanie LED i zawias',children:['board','diagnostics']},
    {id:'cooling',name:'Chłodzenie',desc:'Wentylator, radiator, heatpipe i przepływ powietrza',children:['gpu','diagnostics']},
    {id:'gpu',name:'GPU / VRAM',desc:'Układ graficzny, pamięć, zasilanie i termika',children:['cooling','vrm']},
    {id:'network',name:'Sieci i Wi-Fi',desc:'Router, pasmo, sterownik i połączenie klienta',children:['diagnostics']},
    {id:'measure',name:'Pomiary',desc:'Multimetr, oscyloskop, tryb pomiaru i bezpieczeństwo',children:['vrm','usbpd']},
    {id:'diagnostics',name:'Metodyka diagnozy',desc:'Wywiad, hipotezy, pomiary, test potwierdzający',children:['power','storage','display','network']}
  ];
  function knowledge(){return `<div class="gas-section-head"><div><span class="gas-kicker">KNOWLEDGE GRAPH · EDU MAP</span><h2>Mapa powiązań wiedzy</h2><p>Tematyczna mapa nauki łączy pojęcia z istniejącymi działami. Krawędzie pokazują relacje edukacyjne, nie zgodność części ani rzeczywiste połączenia elektryczne.</p></div><span class="gas-count-pill">${knowledgeNodes.length} obszarów</span></div><div class="gas-knowledge-layout"><div class="gas-knowledge-grid">${knowledgeNodes.map(n=>`<button type="button" class="gas-knowledge-node" data-knowledge-node="${n.id}"><span>${n.children.length} powiąz.</span><b>${esc(n.name)}</b><small>${esc(n.desc)}</small></button>`).join('')}</div><aside class="gas-card" id="gasKnowledgeDetail"><h3>Wybierz obszar</h3><p class="gas-muted">Zobacz powiązane dziedziny, ilustracje i działania.</p></aside></div>`;}
  function bindKnowledge(){
    const box=$('#gasKnowledgeDetail',root);$('.gas-knowledge-grid',root)?.addEventListener('click',e=>{const b=e.target.closest('[data-knowledge-node]');if(!b||!box)return;const node=knowledgeNodes.find(n=>n.id===b.dataset.knowledgeNode);if(!node)return;const linked=node.children.map(id=>knowledgeNodes.find(n=>n.id===id)).filter(Boolean);box.innerHTML=`<span class="gas-kicker">OBSZAR WIEDZY</span><h3>${esc(node.name)}</h3><p>${esc(node.desc)}</p><h4>Powiązane tematy</h4><div class="gas-linked-nodes">${linked.map(x=>`<button type="button" class="gas-btn" data-knowledge-node="${x.id}">${esc(x.name)}</button>`).join('')}</div><div class="gas-form-actions"><button class="gas-btn gas-btn-primary" data-knowledge-visual="${node.id}">Otwórz ilustracje</button><button class="gas-btn" data-knowledge-course="${node.name}">Szukaj kursów</button></div>`;$('.gas-knowledge-grid',root)?.querySelectorAll('[data-knowledge-node]').forEach(x=>x.classList.toggle('is-selected',x===b));});
    box?.addEventListener('click',e=>{const n=e.target.closest('[data-knowledge-node]');if(n){$('.gas-knowledge-grid [data-knowledge-node="'+n.dataset.knowledgeNode+'"]',root)?.click();return;}const v=e.target.closest('[data-knowledge-visual]');if(v){setTab('visual');visualQuery=v.dataset.knowledgeVisual==='power'?'VRM':v.dataset.knowledgeVisual;renderPanel();return;}const c=e.target.closest('[data-knowledge-course]');if(c){setTab('search');$('#gasGlobalSearch',root).value=c.dataset.knowledgeCourse;$('#gasGlobalSearch',root).dispatchEvent(new Event('input',{bubbles:true}));}});
  }
  function quality(){
    return `<div class="gas-section-head"><div><span class="gas-kicker">FIX54 · RELEASE QUALITY CENTER</span><h2>Kontrola jakości i zdrowia platformy</h2><p>Testy wykonywane z przeglądarki, na aktualnym originie. Test nie publikuje zmian ani nie zapisuje niczego do D1.</p></div><button id="gasRunAudit" class="gas-btn gas-btn-primary">Uruchom pełny audyt</button></div><div class="gas-audit-summary" id="gasAuditSummary"><b>Nie uruchomiono audytu</b><span>Wciśnij przycisk, aby sprawdzić zasoby i endpointy.</span></div><div id="gasAuditResults" class="gas-check-list"></div><div class="gas-actions"><button id="gasDownloadAudit" class="gas-btn" disabled>Pobierz raport JSON</button><a class="gas-btn gas-btn-quiet" href="/release.json" target="_blank" rel="noopener">Otwórz manifest builda</a></div>`;
  }
  function visual(){
    const q=visualQuery;
    const photoCards=photos.filter(x=>!q||x.join(' ').toLowerCase().includes(q.toLowerCase())).map(([src,title,tag])=>`<article class="gas-media-card"><img src="/${src}" loading="lazy" alt="${esc(title)}"><div><b>${esc(title)}</b><small>${esc(tag)}</small><code>${esc(src)}</code></div></article>`).join('');
    const posterCards=posters.filter(x=>!q||x.join(' ').toLowerCase().includes(q.toLowerCase())).map(([src,title])=>`<article class="gas-media-card"><img src="/${src}" loading="lazy" alt="${esc(title)}"><div><b>${esc(title)}</b><small>Plakat filmu</small><code>${esc(src)}</code></div></article>`).join('');
    const diagramCards=diagrams.filter(x=>!q||x.join(' ').toLowerCase().includes(q.toLowerCase())).map(([src,title,tag])=>`<article class="gas-media-card gas-diagram-card"><img src="/${src}" loading="lazy" alt="${esc(title)}"><div><b>${esc(title)}</b><small>${esc(tag)}</small><code>${esc(src)}</code><a href="/${src}" target="_blank" rel="noopener">Otwórz SVG ↗</a></div></article>`).join('');
    const videoRows=(window.ACADEMY_LONG_VIDEOS||[]).filter(v=>!q||[v.title,v.category,v.description,v.language,v.level].join(' ').toLowerCase().includes(q.toLowerCase()));
    const videoCards=videoRows.map(v=>{let href='';try{const u=new URL(v.url);if(u.protocol==='https:'&&['classcentral.com','www.classcentral.com'].includes(u.hostname))href=u.href;}catch{}return `<article class="gas-video-card"><span>${esc(v.duration||'Kurs zewnętrzny')} · ${esc(v.level||'Poziom niepodany')}</span><b>${esc(v.title)}</b><small>${esc(v.category||'Temat niepodany')} · ${esc(v.language||'Język niepodany')}</small><p>${esc(v.description||'Opis niepodany.')}</p>${Array.isArray(v.chapters)?`<details><summary>Rozdziały (${v.chapters.length})</summary><ol>${v.chapters.map(ch=>`<li>${esc(ch)}</li>`).join('')}</ol></details>`:''}${href?`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">Otwórz opis kursu u dostawcy ↗</a>`:'<small>Nieprawidłowy albo niezweryfikowany adres zewnętrzny — link ukryty.</small>'}</article>`;}).join('');
    return `<div class="gas-section-head"><div><span class="gas-kicker">FIX55 · PHOTO & VIDEO ACADEMY</span><h2>Biblioteka zdjęć, ilustracji i kursów</h2><p>Pokazujemy pliki znajdujące się w paczce i istniejący katalog szkoleń. Linki do kursów prowadzą do ich stron źródłowych, nie udają lokalnych filmów.</p></div><span class="gas-count-pill">${photos.length} zdjęć · ${posters.length} plakatów · ${diagrams.length} SVG · ${videoRows.length} kursów w filtrze</span></div><div class="gas-toolbar"><input id="gasVisualSearch" type="search" placeholder="Szukaj: VRM, SSD, BIOS, chłodzenie…" value="${esc(q)}"><button id="gasVisualClear" class="gas-btn">Wyczyść</button></div><h3 class="gas-subheading">Ilustracje techniczne</h3><div class="gas-media-grid">${photoCards||'<p class="gas-muted">Brak dopasowań.</p>'}</div><h3 class="gas-subheading">Plakaty szkoleń wideo</h3><div class="gas-media-grid gas-poster-grid">${posterCards||'<p class="gas-muted">Brak dopasowań.</p>'}</div><h3 class="gas-subheading">Schematy edukacyjne SVG</h3><div class="gas-media-grid">${diagramCards||'<p class="gas-muted">Brak dopasowań.</p>'}</div><h3 class="gas-subheading">Katalog kursów wideo</h3><div class="gas-video-grid">${videoCards||'<p class="gas-muted">Brak kursów dla tego filtra. Wróć do wszystkich materiałów.</p>'}</div><div class="gas-warning"><b>Źródła i licencje:</b> 30 diagramów SVG to edukacyjne grafiki poglądowe. Biblioteka 12 fotografii i 3 plakatów pochodzi z wcześniejszej paczki; metadane licencyjne wymagają końcowego potwierdzenia właściciela materiałów. Kursy wideo są zewnętrznymi opisami katalogowymi, nie lokalnymi kopiami nagrań.</div>`;
  }
  function diagnostics(){
    return `<div class="gas-section-head"><div><span class="gas-kicker">FIX56 · MASTER DIAGNOSTICS AI</span><h2>Asystent diagnostyczny</h2><p>AI otrzymuje tylko opis, który wpiszesz. Nie wysyłaj danych osobowych, numerów seryjnych, haseł ani kluczy BitLocker.</p></div><span class="gas-count-pill">API serwerowe · Google Gemini tylko serwis PC</span></div><form id="gasAiForm" class="gas-form-grid"><label>Urządzenie<select name="device"><option>Laptop</option><option>Komputer stacjonarny</option><option>Mini PC</option><option>Stacja robocza</option></select></label><label>Marka i model (opcjonalnie)<input name="model" maxlength="140" placeholder="np. Lenovo ThinkPad T480"></label><label>Główna kategoria<select name="category"><option>Zasilanie / brak startu</option><option>Brak obrazu / matryca</option><option>Temperatura / chłodzenie</option><option>Dysk / dane</option><option>RAM / POST</option><option>BIOS / UEFI</option><option>Sieć / Wi-Fi</option><option>Inne</option></select></label><label>Objawy i dotychczasowe obserwacje<textarea name="symptoms" required minlength="12" maxlength="3000" rows="5" placeholder="Opisz, co się dzieje, kiedy występuje problem i jakie bezpieczne kontrole już wykonano…"></textarea></label><label class="gas-consent"><input name="privacy" type="checkbox" required> Potwierdzam, że nie wpisuję danych osobowych ani tajemnic klienta.</label><div class="gas-form-actions"><button class="gas-btn gas-btn-primary" id="gasAiSend" type="submit">Przeanalizuj objawy</button><button class="gas-btn" type="reset">Wyczyść</button></div></form><div id="gasAiStatus" class="gas-status-line" role="status">Wynik pojawi się poniżej. Diagnoza AI jest hipotezą do weryfikacji.</div><section id="gasAiAnswer" class="gas-ai-answer" aria-live="polite"><p class="gas-muted">Nie wysłano jeszcze zapytania.</p></section><div class="gas-warning">AI nie wykonuje napraw, pomiarów ani operacji na dyskach. Przy pracy na płycie pod napięciem wymagane są kwalifikacje, dokumentacja konkretnej rewizji i właściwe procedury BHP.</div>`;
  }
  function models(){
    const cat=window.ACADEMY_DEVICE_CATALOG||{brands:[],note:'Katalog nie został załadowany.'};
    const brandRows=(cat.brands||[]).map(b=>({brand:b.brand,region:b.region||'',families:b.families||[],models:b.models||[]}));
    const total=brandRows.reduce((n,b)=>n+b.models.length,0);
    return `<div class="gas-section-head"><div><span class="gas-kicker">FIX57 · UNIVERSAL DEVICE DATABASE</span><h2>Baza modeli i platform sprzętowych</h2><p>Rodziny i modele z katalogu lokalnego; katalog społeczności z API wyświetla wyłącznie wpisy zatwierdzone. To nie jest kompletna baza SKU ani schematów OEM.</p></div><span class="gas-count-pill">${brandRows.length} marek · ${total} przykładów lokalnych</span></div><div class="gas-toolbar"><input id="gasModelSearch" type="search" placeholder="Szukaj producenta, modelu, rodziny, płyty…"><select id="gasModelBrand"><option value="all">Wszyscy producenci</option>${brandRows.map(b=>`<option value="${esc(b.brand)}">${esc(b.brand)}</option>`).join('')}</select><button class="gas-btn" id="gasModelRemote">Sprawdź katalog zatwierdzony</button></div><div id="gasModelsResults" class="gas-model-grid"></div><div id="gasModelApiStatus" class="gas-status-line">Katalog lokalny: ${esc(cat.note||'Rodziny orientacyjne.')}</div><div class="gas-warning">Zawsze odczytaj pełny model z etykiety, board ID z PCB i rewizję płyty. Podobna nazwa handlowa nie potwierdza zgodności BIOS, schematu ani części.</div>`;
  }
  function workshop(){
    const rows=casesGet();
    return `<div class="gas-section-head"><div><span class="gas-kicker">FIX58 · SERVICE WORKSHOP MANAGER</span><h2>Dziennik przypadków warsztatowych</h2><p>Lokalny rejestr edukacyjny i serwisowy w tej przeglądarce. Nie zastępuje systemu CRM ani dokumentacji wymaganej prawem.</p></div><span class="gas-count-pill">${rows.length} zapisanych spraw lokalnych</span></div><form id="gasCaseForm" class="gas-form-grid gas-case-form"><label>Urządzenie<input name="device" required maxlength="100" placeholder="Laptop / PC / Mini PC"></label><label>Marka i model<input name="model" maxlength="140" placeholder="Model bez danych właściciela"></label><label>Board ID / rewizja (jeśli znane)<input name="board" maxlength="100" placeholder="Odczyt z PCB — nie zgaduj"></label><label>Objaw<textarea name="symptom" required maxlength="1200" rows="3"></textarea></label><label>Diagnoza / hipoteza<textarea name="diagnosis" maxlength="1200" rows="3"></textarea></label><label>Wykonane czynności<textarea name="procedure" maxlength="1800" rows="3"></textarea></label><label>Części i materiały<input name="parts" maxlength="500"></label><label>Koszt części (PLN)<input name="cost" type="number" min="0" max="100000" step="0.01" value="0"></label><label>Status<select name="status"><option>Przyjęta do analizy</option><option>W trakcie diagnostyki</option><option>Oczekuje na część</option><option>Naprawa wykonana</option><option>Test końcowy</option><option>Zamknięta</option></select></label><label class="gas-consent"><input name="privacy" type="checkbox" required> Potwierdzam: bez nazwisk, telefonów, adresów, haseł i kluczy odzyskiwania.</label><div class="gas-form-actions"><button class="gas-btn gas-btn-primary" type="submit">Zapisz lokalną sprawę</button><button type="button" class="gas-btn" id="gasCaseExport">Eksport spraw JSON</button><button type="button" class="gas-btn" id="gasCaseImport">Import kopii JSON</button><input id="gasCaseFile" type="file" accept="application/json,.json" hidden></div></form><div id="gasCaseStatus" class="gas-status-line" role="status"></div><div class="gas-case-list">${rows.length?rows.slice().reverse().map(x=>`<article class="gas-case-card"><div><span class="gas-case-id">${esc(x.id)}</span><b>${esc(x.device)} · ${esc(x.model||'model niepodany')}</b><p>${esc(x.symptom)}</p><small>${esc(x.status)} · ${new Date(x.createdAt).toLocaleString('pl-PL')}</small></div><div><strong>${fmt(x.cost)} zł</strong><button type="button" class="gas-btn gas-btn-small" data-case-delete="${esc(x.id)}">Usuń</button></div></article>`).join(''):'<p class="gas-muted">Nie ma jeszcze zapisanych spraw.</p>'}</div><div class="gas-warning">Dane są przechowywane lokalnie bez synchronizacji do D1. Przy korzystaniu z publicznego lub współdzielonego komputera nie zapisuj tu informacji pozwalających zidentyfikować klienta lub jego sprzęt.</div>`;
  }
  function exams(){
    if(!examState){const shuffled=questions.map((_,i)=>i);for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}examState={ids:shuffled.slice(0,8),index:0,answers:{},finished:false};}
    const idx=examState.ids[examState.index];const q=questions[idx];
    if(examState.finished){const score=examState.ids.reduce((n,id,i)=>n+(examState.answers[i]===questions[id].c?1:0),0);return `<div class="gas-section-head"><div><span class="gas-kicker">FIX59 · EXAMINATION CENTER</span><h2>Wynik egzaminu</h2><p>Test edukacyjny zapisany lokalnie.</p></div><span class="gas-count-pill">${score}/${examState.ids.length} poprawnych</span></div><div class="gas-exam-result"><b>${Math.round(score/examState.ids.length*100)}%</b><p>${score>=7?'Bardzo dobry wynik. Utrwal dokumentację i procedury.':score>=5?'Dobry początek. Wróć do tematów, w których były błędy.':'Warto powtórzyć podstawy bezpieczeństwa i identyfikacji komponentów.'}</p><button type="button" class="gas-btn gas-btn-primary" id="gasExamAgain">Nowy egzamin</button><button type="button" class="gas-btn" id="gasExamCertificate">Pobierz lokalne potwierdzenie</button></div><div class="gas-exam-review">${examState.ids.map((id,i)=>{const item=questions[id],ok=examState.answers[i]===item.c;return `<article><b>${ok?'✓':'✕'} ${esc(item.q)}</b><p>Poprawna odpowiedź: ${esc(item.a[item.c])}</p><small>${esc(item.e)}</small></article>`}).join('')}</div>`;}
    return `<div class="gas-section-head"><div><span class="gas-kicker">FIX59 · EXAMINATION CENTER</span><h2>Egzamin serwisanta</h2><p>Osiem pytań losowanych z puli. Wynik i postęp zapisują się lokalnie.</p></div><span class="gas-count-pill">Pytanie ${examState.index+1}/${examState.ids.length}</span></div><div class="gas-exam-progress"><span style="width:${(examState.index/examState.ids.length)*100}%"></span></div><section class="gas-exam-question"><b>${esc(q.q)}</b><div class="gas-options">${q.a.map((a,i)=>`<label><input type="radio" name="gasExamAnswer" value="${i}" ${examState.answers[examState.index]===i?'checked':''}><span>${esc(a)}</span></label>`).join('')}</div><div class="gas-form-actions"><button type="button" class="gas-btn" id="gasExamBack" ${examState.index===0?'disabled':''}>Wstecz</button><button type="button" class="gas-btn gas-btn-primary" id="gasExamNext">${examState.index===examState.ids.length-1?'Zakończ egzamin':'Następne pytanie'}</button></div></section><p class="gas-muted">To nie jest egzamin państwowy ani certyfikacja akredytowana. Dokument jest lokalnym potwierdzeniem wykonania ćwiczenia.</p>`;
  }
  function offline(){
    return `<div class="gas-section-head"><div><span class="gas-kicker">FIX60 · GLOBAL OFFLINE ACADEMY</span><h2>Pakiety nauki offline</h2><p>Pobieraj materiały do Cache Storage tej przeglądarki. Nie jest to synchronizacja między urządzeniami.</p></div><span class="gas-count-pill">${packs.length} pakietów</span></div><div class="gas-offline-note" id="gasStorageInfo">Sprawdzam dostępne miejsce…</div><div class="gas-pack-grid">${packs.map(p=>`<article class="gas-pack-card"><span>PAKIET EDUKACYJNY</span><b>${esc(p.name)}</b><small>${p.files.length} plików</small><div class="gas-pack-actions"><button class="gas-btn gas-btn-primary" data-pack-download="${p.id}">Pobierz pakiet</button><button class="gas-btn" data-pack-remove="${p.id}">Usuń cache</button></div><small id="gasPackState-${p.id}">Nie sprawdzono</small></article>`).join('')}</div><div class="gas-actions"><button id="gasOfflineAudit" class="gas-btn">Sprawdź cache pakietów</button><button id="gasOfflineExport" class="gas-btn">Eksport postępów i ustawień</button></div><div class="gas-warning">Duże filmy nie są pobierane automatycznie do pakietów. Do instalacji PWA i pracy offline potrzebny jest poprawny Service Worker; po aktualizacji aplikacji może być konieczne odświeżenie cache.</div>`;
  }
  function security(){
    return `<div class="gas-section-head"><div><span class="gas-kicker">FIX54 · SECURITY & PRIVACY CENTER</span><h2>Bezpieczeństwo konta i danych</h2><p>Ten panel pokazuje stan przeglądarki i publiczne statusy API. Nie odczytuje ciasteczek, haseł, sekretów ani tokenów i nie zmienia ustawień konta.</p></div><span class="gas-count-pill">Bez odczytu sekretów</span></div><div class="gas-security-grid"><article><b>Połączenie bezpieczne</b><strong id="gasSecContext">—</strong><small>isSecureContext</small></article><article><b>Połączenie sieciowe</b><strong id="gasSecOnline">—</strong><small>navigator.onLine</small></article><article><b>Service Worker</b><strong id="gasSecSw">—</strong><small>obsługa PWA</small></article><article><b>Pamięć lokalna</b><strong id="gasSecStorage">—</strong><small>test dostępu bez danych</small></article></div><div class="gas-actions"><button id="gasSecurityCheck" class="gas-btn gas-btn-primary">Sprawdź statusy</button><button id="gasSecurityExport" class="gas-btn">Eksport lokalnych danych</button><button id="gasSecurityAccount" class="gas-btn">Zarządzanie kontem</button></div><div id="gasSecurityResults" class="gas-check-list"><p class="gas-muted">Nie uruchomiono jeszcze kontroli.</p></div><div class="gas-warning"><b>Granice kontroli:</b> to lokalny przegląd bezpieczeństwa interfejsu, nie audyt penetracyjny ani potwierdzenie bezpieczeństwa konta Cloudflare. Zarządzanie sesjami odbywa się w istniejącym panelu konta. Nie wklejaj do tej aplikacji haseł, tokenów ani kluczy odzyskiwania.</div>`;
  }
  async function runSecurityCheck(){
    const out=$('#gasSecurityResults',root);if(out)out.innerHTML='<p class="gas-muted">Sprawdzam…</p>';
    const rows=[];const context=!!window.isSecureContext,online=!!navigator.onLine,sw=!!navigator.serviceWorker;
    let storage=false;try{const k='__gas_security_probe';localStorage.setItem(k,'1');storage=localStorage.getItem(k)==='1';localStorage.removeItem(k);}catch{}
    const values={gasSecContext:context?'TAK':'NIE',gasSecOnline:online?'ONLINE':'OFFLINE',gasSecSw:sw?'OBSŁUGIWANY':'BRAK',gasSecStorage:storage?'DOSTĘPNA':'BRAK'};for(const [id,val] of Object.entries(values)){const e=$('#'+id,root);if(e)e.textContent=val;}
    rows.push(auditRow('Bezpieczny kontekst',context?'PASS':'FAIL',context?'HTTPS / secure context':'Przeglądarka nie zgłasza bezpiecznego kontekstu'));
    rows.push(auditRow('Stan sieci',online?'PASS':'INFO',online?'Online':'Offline'));
    rows.push(auditRow('Service Worker',sw?'PASS':'INFO',sw?'API dostępne':'Brak API Service Worker'));
    rows.push(auditRow('Pamięć lokalna',storage?'PASS':'FAIL',storage?'Test zapisu i odczytu zakończony':'LocalStorage niedostępny'));
    rows.push(await probe('/api/auth/status','Publiczny status API kont'));
    rows.push(await probe('/api/health','Publiczny status API zdrowia'));
    rows.push(auditRow('Brak odczytu sekretów','PASS','Moduł nie odczytuje danych sesji, haseł ani kluczy API'));
    if(out)out.innerHTML=rows.map(x=>`<div class="gas-check-row"><span class="gas-status gas-${x.status.toLowerCase()}">${x.status}</span><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></div>`).join('');
    track('security-check',rows.filter(x=>x.status==='FAIL').length+' FAIL');
  }
  function bindSecurity(){ $('#gasSecurityCheck',root)?.addEventListener('click',runSecurityCheck);$('#gasSecurityExport',root)?.addEventListener('click',exportSuiteData);$('#gasSecurityAccount',root)?.addEventListener('click',()=>navTo('account')); }
  function analytics(){
    const events=analyticsGet();const exam=read(STORAGE.exam,[]);const rows=casesGet();const counts={};for(const e of events)counts[e.event]=(counts[e.event]||0)+1;
    return `<div class="gas-section-head"><div><span class="gas-kicker">LEARNING ANALYTICS · SECURITY & PRIVACY</span><h2>Postępy, dane i prywatność</h2><p>Ten panel widzi tylko lokalne dane utworzone przez Global Academy Suite.</p></div><span class="gas-count-pill">Local-first</span></div><div class="gas-metric-grid"><article><b>${fmt(events.length)}</b><small>zdarzeń aktywności</small></article><article><b>${fmt(rows.length)}</b><small>spraw warsztatowych</small></article><article><b>${fmt(exam.length)}</b><small>zapisanych egzaminów</small></article><article><b>${fmt(exam.length?Math.round(exam.reduce((n,x)=>n+x.percent,0)/exam.length):0)}%</b><small>średni wynik testów</small></article></div><section class="gas-card"><div class="gas-card-head"><h3>Aktywność według modułów</h3><span>lokalnie</span></div>${Object.keys(counts).length?Object.entries(counts).map(([k,v])=>`<div class="gas-bar-row"><span>${esc(k)}</span><b>${v}</b><i style="width:${Math.min(100,v/Math.max(...Object.values(counts))*100)}%"></i></div>`).join(''):'<p class="gas-muted">Brak zebranych zdarzeń.</p>'}</section><div class="gas-actions"><button id="gasPrivacyExport" class="gas-btn gas-btn-primary">Eksportuj dane modułu JSON</button><button id="gasPrivacyClear" class="gas-btn gas-btn-danger">Usuń lokalne dane FIX54–FIX60</button></div><div class="gas-warning">Eksport obejmuje wyłącznie klucze Global Academy Suite. Nie eksportuje kont, ciasteczek sesji, sekretu Gemini, danych logowania ani danych z D1. Po usunięciu danych nie ma możliwości automatycznego odzyskania ich z chmury.</div>`;
  }
  function download(name, data){const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function auditRow(label, status, detail){return {label,status,detail,at:new Date().toISOString()};}
  async function probe(url, label){try{const res=await fetch(url,{method:'GET',cache:'no-store',headers:{'cache-control':'no-cache'}});return auditRow(label,res.ok?'PASS':res.status===401||res.status===403?'INFO':'FAIL',`HTTP ${res.status}`);}catch(e){return auditRow(label,'FAIL',e.message||'Błąd sieci');}}
  async function imageProbe(path){return new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve(auditRow(path,'FAIL','Przekroczono 12 s')),12000);img.onload=()=>{clearTimeout(timer);resolve(auditRow(path,'PASS',`${img.naturalWidth}×${img.naturalHeight}`));};img.onerror=()=>{clearTimeout(timer);resolve(auditRow(path,'FAIL','Obraz nie został zdekodowany'));};img.src='/'+path;});}
  async function runAudit(){
    const summary=$('#gasAuditSummary',root), list=$('#gasAuditResults',root), btn=$('#gasRunAudit',root), dl=$('#gasDownloadAudit',root);if(btn)btn.disabled=true;if(summary)summary.innerHTML='<b>Audyt w toku…</b><span>Kontroluję pliki wizualne, moduły i API samej platformy.</span>';
    const rows=[];
    const runtime=['/','/index.html','/assets/global-academy-suite-fix60.js','/assets/global-academy-suite-fix60.css','/assets/global-academy-suite-manifest-fix60.json','/assets/artwork-fix54/30-keyboard-touchpad.svg','/service-worker.js','/release.json'];
    const assetResults=await Promise.all(allVisual.map(imageProbe));rows.push(...assetResults);
    const staticResults=await Promise.all(runtime.map(p=>probe(p,`Plik ${p}`)));rows.push(...staticResults);
    rows.push(await probe('/api/health','API health / D1 status'));
    rows.push(auditRow('API diagnostyki AI','INFO','Endpoint czatu jest sprawdzany dopiero po wysłaniu świadomego zapytania POST. Audyt nie wysyła pustego żądania ani treści użytkownika.'));
    rows.push(await probe('/api/auth/status','API kont — stan schematu'));
    const navCount=$$('.view-section').length;rows.push(auditRow('Nawigacja widoków','PASS',`${navCount} widoków znalezionych w HTML`));
    const sw=!!navigator.serviceWorker;rows.push(auditRow('Service Worker API',sw?'PASS':'INFO',sw?'Przeglądarka obsługuje Service Worker':'Brak obsługi w tej przeglądarce'));
    const missingAlt=$$('img',root).filter(img=>!String(img.getAttribute('alt')||'').trim()).length;rows.push(auditRow('Dostępność obrazów',missingAlt?'FAIL':'PASS',`${missingAlt} obrazów bez opisu alt w Global Academy`));
    const duplicateLocalIds=(()=>{const ids=$$('[id]',root).map(x=>x.id);return ids.length-new Set(ids).size;})();rows.push(auditRow('Unikalność identyfikatorów',duplicateLocalIds?'FAIL':'PASS',`${duplicateLocalIds} duplikatów ID w widoku Global Academy`));
    rows.push(auditRow('Katalog kursów wideo',Array.isArray(window.ACADEMY_LONG_VIDEOS)&&window.ACADEMY_LONG_VIDEOS.length?'PASS':'INFO',`${window.ACADEMY_LONG_VIDEOS?.length||0} rekordów źródłowych`));
    rows.push(auditRow('Tryb online',navigator.onLine?'PASS':'INFO',navigator.onLine?'Przeglądarka zgłasza połączenie sieciowe':'Przeglądarka działa offline'));
    const failed=rows.filter(x=>x.status==='FAIL').length, passed=rows.filter(x=>x.status==='PASS').length;
    lastAudit=rows;
    if(summary)summary.innerHTML=`<b>${failed?'Wykryto problemy':'Kontrola zakończona'}</b><span>${passed} PASS · ${failed} FAIL · ${rows.filter(x=>x.status==='INFO').length} INFO · ${rows.length} kontroli. Test nie wykonuje publikacji.</span>`;
    if(list)list.innerHTML=rows.map(x=>`<div class="gas-check-row"><span class="gas-status gas-${x.status.toLowerCase()}">${x.status}</span><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></div>`).join('');
    if(dl)dl.disabled=false;if(btn)btn.disabled=false;track('audit',`${passed}/${rows.length} PASS; ${failed} FAIL`);updateMetrics();
  }
  function bindQuality(){ $('#gasRunAudit',root)?.addEventListener('click',runAudit);$('#gasDownloadAudit',root)?.addEventListener('click',()=>download('global-academy-audit-fix60.json',{build:BUILD,origin:location.origin,generatedAt:new Date().toISOString(),results:lastAudit})); }
  function bindVisual(){ $('#gasVisualSearch',root)?.addEventListener('input',()=>{visualQuery=$('#gasVisualSearch',root).value;renderPanel();const i=$('#gasVisualSearch',root);i?.focus();if(i)i.setSelectionRange(visualQuery.length,visualQuery.length);});$('#gasVisualClear',root)?.addEventListener('click',()=>{visualQuery='';renderPanel();}); }
  function bindDiagnostics(){
    const form=$('#gasAiForm',root);form?.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(form);const symptoms=String(fd.get('symptoms')||'').trim();if(symptoms.length<12)return;const model=String(fd.get('model')||'').trim();const device=String(fd.get('device')||'Laptop');const category=String(fd.get('category')||'Inne');const prompt=`Przeprowadź bezpieczną diagnostykę edukacyjną.\nUrządzenie: ${device}\nModel podany przez użytkownika: ${model||'nie podano'}\nKategoria: ${category}\nObjawy i obserwacje: ${symptoms}\n\nPodaj hipotezy z poziomem pewności, kolejność bezpiecznych kontroli, czego nie robić, jakie informacje/dokumentację trzeba potwierdzić. Nie zgaduj pomiarów ani numerów części. Wskaż, kiedy przerwać i skierować do wykwalifikowanego serwisu.`;
      const status=$('#gasAiStatus',root),answer=$('#gasAiAnswer',root),send=$('#gasAiSend',root);send.disabled=true;status.textContent='Łączę z istniejącym API Akademii…';answer.textContent='';
      try{const response=await fetch('/api/chat',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','accept':'text/event-stream'},body:JSON.stringify({messages:[{role:'user',content:prompt}]})});
        const type=response.headers.get('content-type')||'';if(!response.ok){let message=`API zwróciło HTTP ${response.status}`;if(type.includes('application/json')){const j=await response.json().catch(()=>({}));message=j.message||j.error||message;}throw new Error(message);}
        if(!type.includes('text/event-stream')){const j=await response.json().catch(()=>({}));throw new Error(j.message||j.error||'Nieoczekiwany format odpowiedzi API.');}
        const raw=await response.text();let textOut='',meta='',err='';for(const block of raw.split(/\r?\n\r?\n/)){const ev=(block.match(/^event:\s*(.+)$/m)||[])[1]||'';const line=(block.match(/^data:\s*(.+)$/m)||[])[1];if(!line)continue;let data;try{data=JSON.parse(line);}catch{continue;}if(ev==='delta')textOut+=data.text||'';else if(ev==='meta')meta=data.provider||'';else if(ev==='reset')textOut='';else if(ev==='error')err=data.message||'AI niedostępne.';}
        if(err)throw new Error(err);if(!textOut.trim())throw new Error('API nie zwróciło treści odpowiedzi.');
        answer.innerHTML=`<div class="gas-ai-meta">${esc(meta||'AI Akademii')} · odpowiedź do weryfikacji</div><div class="gas-ai-text">${esc(textOut).replace(/\n/g,'<br>')}</div>`;status.textContent='Odpowiedź otrzymana. Traktuj wnioski jako hipotezy i potwierdź je dokumentacją.';track('ai-diagnosis',category);
      }catch(error){answer.innerHTML=`<p class="gas-error">${esc(error.message||'Nie udało się połączyć z API.')}</p><p>Możesz skorzystać z lokalnych procedur w module Diagnostyka i pomiary.</p>`;status.textContent='Diagnostyka AI niedostępna — lokalne materiały pozostają dostępne.';}
      finally{send.disabled=false;updateMetrics();}
    });
  }
  function localModels(q='',brand='all'){
    const catalog=window.ACADEMY_DEVICE_CATALOG?.brands||[];const query=q.toLowerCase();const rows=[];
    catalog.forEach(b=>{if(brand!=='all'&&b.brand!==brand)return;(b.models||[]).forEach(m=>{const row={brand:b.brand,series:m[0]||'',model:m[1]||'',type:m[2]||'laptop',region:b.region||''};if(!query||Object.values(row).join(' ').toLowerCase().includes(query))rows.push(row);});(b.families||[]).forEach(f=>{const row={brand:b.brand,series:f[0]||'',model:f[1]||'',type:'rodzina',region:b.region||''};if(!query||Object.values(row).join(' ').toLowerCase().includes(query))rows.push(row);});});
    return rows.slice(0,160);
  }
  function renderModels(){const box=$('#gasModelsResults',root);if(!box)return;const rows=localModels($('#gasModelSearch',root)?.value||'', $('#gasModelBrand',root)?.value||'all');box.innerHTML=rows.map(x=>`<article class="gas-model-card"><span>${esc(x.brand)} · ${esc(x.type)}</span><b>${esc(x.model)}</b><small>${esc(x.series)} · ${esc(x.region)}</small><p>Dokładny SKU i rewizja płyty do potwierdzenia na urządzeniu.</p></article>`).join('')||'<p class="gas-muted">Brak wyników.</p>';}
  function bindModels(){ $('#gasModelSearch',root)?.addEventListener('input',renderModels);$('#gasModelBrand',root)?.addEventListener('change',renderModels);renderModels();$('#gasModelRemote',root)?.addEventListener('click',async()=>{const status=$('#gasModelApiStatus',root);status.textContent='Pobieram zatwierdzone wpisy społeczności…';try{const q=encodeURIComponent($('#gasModelSearch',root)?.value||'');const res=await fetch(`/api/models?q=${q}`,{credentials:'same-origin',cache:'no-store'});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||data.error||`HTTP ${res.status}`);modelRemote=data.items||[];status.textContent=`Zatwierdzone wpisy społeczności: ${modelRemote.length}. ${data.curatedNote||''}`;const box=$('#gasModelsResults',root);if(modelRemote.length)box.insertAdjacentHTML('afterbegin',modelRemote.map(x=>`<article class="gas-model-card gas-model-community"><span>ZATWIERDZONY WPIS · ${esc(x.brand)}</span><b>${esc(x.model)}</b><small>${esc(x.board_id||'Board ID niepodany')} · rewizja ${esc(x.pcb_revision||'nieznana')}</small><p>${esc(x.known_issues||'Brak opisu typowych usterek.')}</p></article>`).join(''));}catch(err){status.textContent=`Katalog społeczności niedostępny: ${err.message}. Nadal działa katalog lokalny.`;}}); }
  function bindWorkshop(){
    $('#gasCaseForm',root)?.addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget,fd=new FormData(form);const rows=casesGet();if(rows.length>=200){$('#gasCaseStatus',root).textContent='Limit 200 lokalnych spraw. Zrób eksport kopii i usuń zamknięte rekordy.';return;}const rec={id:`NPA-${Date.now().toString(36).toUpperCase()}`,createdAt:new Date().toISOString(),device:String(fd.get('device')||'').trim(),model:String(fd.get('model')||'').trim(),board:String(fd.get('board')||'').trim(),symptom:String(fd.get('symptom')||'').trim(),diagnosis:String(fd.get('diagnosis')||'').trim(),procedure:String(fd.get('procedure')||'').trim(),parts:String(fd.get('parts')||'').trim(),cost:Number(fd.get('cost')||0),status:String(fd.get('status')||'Przyjęta do analizy')};if(!rec.device||!rec.symptom||!Number.isFinite(rec.cost)||rec.cost<0){$('#gasCaseStatus',root).textContent='Uzupełnij urządzenie, objaw i prawidłowy koszt.';return;}if(!write(STORAGE.cases,[...rows,rec])){$('#gasCaseStatus',root).textContent='Nie udało się zapisać. Pamięć przeglądarki może być pełna lub zablokowana.';return;}track('case-created',rec.status);renderPanel();$('#gasCaseStatus',root).textContent='Zapisano w lokalnej pamięci tej przeglądarki.';updateMetrics();});
    $('#gasCaseExport',root)?.addEventListener('click',()=>download('npa-workshop-cases-fix60.json',{schema:'npa-fix60-cases-v1',exportedAt:new Date().toISOString(),items:casesGet()}));
    $('#gasCaseImport',root)?.addEventListener('click',()=>$('#gasCaseFile',root)?.click());
    $('#gasCaseFile',root)?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>1024*1024){$('#gasCaseStatus',root).textContent='Plik przekracza limit 1 MiB.';return;}try{const data=JSON.parse(await file.text());if(data.schema!=='npa-fix60-cases-v1'||!Array.isArray(data.items)||data.items.length>200)throw new Error('Niepoprawny format kopii FIX60.');const clean=data.items.map(x=>({id:String(x.id||'').slice(0,40),createdAt:String(x.createdAt||new Date().toISOString()),device:String(x.device||'').slice(0,100),model:String(x.model||'').slice(0,140),board:String(x.board||'').slice(0,100),symptom:String(x.symptom||'').slice(0,1200),diagnosis:String(x.diagnosis||'').slice(0,1200),procedure:String(x.procedure||'').slice(0,1800),parts:String(x.parts||'').slice(0,500),cost:Math.max(0,Math.min(100000,Number(x.cost)||0)),status:String(x.status||'Zaimportowana').slice(0,40)}));if(!write(STORAGE.cases,clean))throw new Error('Brak miejsca w pamięci lokalnej.');track('case-import',clean.length);renderPanel();}catch(err){$('#gasCaseStatus',root).textContent=err.message;}finally{e.target.value='';}});
    $('.gas-case-list',root)?.addEventListener('click',e=>{const b=e.target.closest('[data-case-delete]');if(!b)return;if(!confirm('Usunąć lokalną sprawę?'))return;write(STORAGE.cases,casesGet().filter(x=>x.id!==b.dataset.caseDelete));renderPanel();updateMetrics();});
  }
  function bindExams(){
    $('#gasExamBack',root)?.addEventListener('click',()=>{const a=$('input[name="gasExamAnswer"]:checked',root);if(a)examState.answers[examState.index]=Number(a.value);examState.index=Math.max(0,examState.index-1);renderPanel();});
    $('#gasExamNext',root)?.addEventListener('click',()=>{const a=$('input[name="gasExamAnswer"]:checked',root);if(a)examState.answers[examState.index]=Number(a.value);if(examState.answers[examState.index]===undefined){alert('Wybierz jedną odpowiedź.');return;}if(examState.index<examState.ids.length-1)examState.index++;else{examState.finished=true;const score=examState.ids.reduce((n,id,i)=>n+(examState.answers[i]===questions[id].c?1:0),0);const h=read(STORAGE.exam,[]);h.push({at:new Date().toISOString(),percent:Math.round(score/examState.ids.length*100),score,total:examState.ids.length});write(STORAGE.exam,h.slice(-100));track('exam-completed',`${score}/${examState.ids.length}`);}renderPanel();updateMetrics();});
    $('#gasExamAgain',root)?.addEventListener('click',()=>{examState=null;renderPanel();});
    $('#gasExamCertificate',root)?.addEventListener('click',()=>{const score=examState.ids.reduce((n,id,i)=>n+(examState.answers[i]===questions[id].c?1:0),0);const html=`<!doctype html><meta charset="utf-8"><title>Potwierdzenie ćwiczenia</title><style>body{font:18px Arial;margin:50px;color:#15243a}h1{color:#075f92}section{border:4px solid #1684b9;padding:42px;text-align:center}</style><section><h1>NAUKA OD A DO Z</h1><h2>Potwierdzenie ukończenia ćwiczenia edukacyjnego</h2><p>Egzamin serwisanta · wynik ${score}/${examState.ids.length} (${Math.round(score/examState.ids.length*100)}%)</p><p>Data: ${new Date().toLocaleString('pl-PL')}</p><small>Dokument lokalny. Nie jest certyfikatem akredytowanym ani państwowym.</small></section>`;const w=window.open('','_blank');if(w){w.document.write(html);w.document.close();w.print();}});
  }
  function bindOffline(){
    const info=$('#gasStorageInfo',root);if(navigator.storage?.estimate)navigator.storage.estimate().then(x=>{if(info)info.textContent=`Szacowane wykorzystanie: ${((x.usage||0)/1048576).toFixed(1)} MiB · dostępny limit: ${((x.quota||0)/1048576).toFixed(0)} MiB (wartości zależą od przeglądarki).`;}).catch(()=>{});
    const cacheName='npa-global-academy-fix60-packs';
    $$('[data-pack-download]',root).forEach(b=>b.addEventListener('click',async()=>{const p=packs.find(x=>x.id===b.dataset.packDownload);if(!p)return;b.disabled=true;const state=$('#gasPackState-'+p.id,root);if(state)state.textContent='Pobieranie…';let ok=0,fail=[];try{const cache=await caches.open(cacheName);for(const file of p.files){try{const url='/'+file;const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);await cache.put(url,response.clone());ok++;if(state)state.textContent=`Pobrano ${ok}/${p.files.length}`;}catch(e){fail.push(`${file}: ${e.message}`);}}}catch(e){fail.push(e.message);}if(state)state.textContent=`${ok}/${p.files.length} zapisano${fail.length?` · błędy: ${fail.length}`:''}`;track('offline-pack',`${p.name} ${ok}/${p.files.length}`);b.disabled=false;}));
    $$('[data-pack-remove]',root).forEach(b=>b.addEventListener('click',async()=>{const p=packs.find(x=>x.id===b.dataset.packRemove);const cache=await caches.open(cacheName);let n=0;for(const file of p.files)if(await cache.delete('/'+file))n++;const state=$('#gasPackState-'+p.id,root);if(state)state.textContent=`Usunięto ${n} plików z cache pakietu.`;}));
    $('#gasOfflineAudit',root)?.addEventListener('click',async()=>{const cache=await caches.open(cacheName);for(const p of packs){let n=0;for(const f of p.files)if(await cache.match('/'+f))n++;const e=$('#gasPackState-'+p.id,root);if(e)e.textContent=`W cache: ${n}/${p.files.length}`;}});
    $('#gasOfflineExport',root)?.addEventListener('click',()=>exportSuiteData());
  }
  function exportSuiteData(){download('nauka-od-a-do-z-global-academy-backup-fix60.json',{schema:'npa-global-academy-fix60-v1',exportedAt:new Date().toISOString(),cases:casesGet(),analytics:analyticsGet(),examHistory:read(STORAGE.exam,[]),preferences:read(STORAGE.prefs,{})});}
  function bindAnalytics(){
    $('#gasPrivacyExport',root)?.addEventListener('click',exportSuiteData);
    $('#gasPrivacyClear',root)?.addEventListener('click',async()=>{if(!confirm('Usunąć lokalne sprawy, historię aktywności i wyniki egzaminów FIX54–FIX60? Te dane nie będą możliwe do odzyskania.'))return;Object.values(STORAGE).forEach(k=>{try{localStorage.removeItem(k);}catch{}});track('privacy-clear','Dane modułu zostały wyczyszczone');renderPanel();updateMetrics();});
  }
  function bindGlobalEvents(){
    root.addEventListener('click',e=>{
      const tab=e.target.closest('[data-gas-tab]');if(tab){setTab(tab.dataset.gasTab);return;}
      const go=e.target.closest('[data-gas-goto]');if(go){setTab(go.dataset.gasGoto);return;}
      const community=e.target.closest('[data-gas-community]');if(community){navTo('community');return;}
    });
  }
  function mount(){
    const view=$('#view-globalacademy');if(!view||view.dataset.gasMounted==='1')return;
    root=$('#globalAcademyRoot',view);if(!root)return;
    const safeFallbackHtml=root.innerHTML;
    try{
      shell();
      bindGlobalEvents();
      view.dataset.gasMounted='1';
      view.dataset.gasMountStatus='ready';
    }catch(error){
      root.innerHTML=safeFallbackHtml;
      view.dataset.gasMountStatus='fallback';
      const status=$('#globalAcademyFallbackStatus',root);
      if(status)status.textContent='Pełny panel Centrum Wiedzy nie załadował się. Dostępne skróty działają — wybierz moduł poniżej lub otwórz Akademię Mistrza Serwisu.';
      console.error('FIX176 Global Academy mount failed; static navigation fallback restored.',error);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.NPA_GLOBAL_ACADEMY_FIX60={build:BUILD,runAudit,runSecurityCheck,exportSuiteData,assets:{photos:photos.length,posters:posters.length,diagrams:diagrams.length,videoCourses:(window.ACADEMY_LONG_VIDEOS||[]).length,totalVisual:allVisual.length},packs:packs.map(p=>({id:p.id,count:p.files.length}))};
})();
