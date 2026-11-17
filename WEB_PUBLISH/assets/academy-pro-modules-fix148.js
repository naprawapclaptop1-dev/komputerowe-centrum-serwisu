/* NAUKA OD A DO Z 6.8.0 — FIX148 / ROZSZERZONE MODUŁY SERWISANTA PRO
 * Edukacyjne narzędzia lokalne. Nie wykonują pomiarów, nie sterują sprzętem i nie zastępują dokumentacji producenta.
 */
(() => {
  'use strict';
  const root = document.getElementById('a148AdvancedHub');
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';
  const STORE = 'academy-fix148-master-technician-suite';
  const $ = id => root.querySelector(`#${id}`);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; } };
  const state = { ...{ serviceDone: [], solder: {}, reports: [], teacherDrafts: [], customFaults: [], boardSelection: 'U1' }, ...read() };
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); return true; } catch { return false; } };
  const download = (name, data, type='application/json') => {
    const blob = new Blob([data], {type}); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 800);
  };
  const status = (id, text) => { const node = $(id); if (node) node.textContent = text; };

  // --- Nawigacja lokalna modułów ---
  root.querySelectorAll('[data-a148-tab]').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.a148Tab;
    root.querySelectorAll('[data-a148-tab]').forEach(b => { const active = b === btn; b.classList.toggle('active', active); b.setAttribute('aria-selected', active ? 'true' : 'false'); });
    root.querySelectorAll('[data-a148-panel]').forEach(panel => { const active = panel.dataset.a148Panel === key; panel.hidden = !active; panel.setAttribute('aria-hidden', active ? 'false' : 'true'); });
  }));
  document.querySelector('[data-a148-jump]')?.addEventListener('click', () => $('a148AdvancedHub')?.scrollIntoView({behavior:'smooth', block:'start'}));

  // --- BOARDVIEW PRO: schemat demonstracyjny, bez danych konkretnego modelu ---
  const boardParts = [
    {id:'U1',type:'Układ sterujący',area:'CENTRUM / LOGIKA',desc:'Przykładowy kontroler na planszy edukacyjnej. Rzeczywisty układ, pinout, zasilania i funkcje zależą od modelu oraz rewizji PCB.',checks:['Zapisz pełne oznaczenie układu i producenta.','Odszukaj właściwy datasheet i boardview dla dokładnej rewizji.','Przed pomiarami potwierdź punkty i warunki w dokumentacji.'],safety:'Nie podawaj napięcia na nieznane piny i nie korzystaj z mapy demonstracyjnej jako pinoutu.'},
    {id:'J1',type:'Złącze wejściowe',area:'WEJŚCIE / ZASILANIE',desc:'Symboliczne złącze wejściowe. Nie przedstawia rzeczywistego układu pinów ani napięć.',checks:['Zidentyfikuj typ złącza i wariant płyty.','Sprawdź uszkodzenia mechaniczne po odłączeniu zasilania.','Porównaj orientację i pinout z dokumentacją.'],safety:'Nie zwieraj styków złącza i nie testuj nieznanego zasilacza na płycie.'},
    {id:'F1',type:'Bezpiecznik',area:'OCHRONA / WEJŚCIE',desc:'Przykładowy symbol bezpiecznika. Oznaczenie F nie gwarantuje konkretnej wartości ani charakterystyki.',checks:['Odczytaj oznaczenie i parametry z dokumentacji.','Pomiar ciągłości wykonuj na odłączonym, rozładowanym obwodzie.','Przed wymianą ustal przyczynę zadziałania.'],safety:'Nie mostkuj bezpiecznika i nie montuj zamiennika o przypadkowych parametrach.'},
    {id:'Q1',type:'Tranzystor / MOSFET',area:'TOR MOCY',desc:'Symboliczny element przełączający. Rzeczywista topologia i wyprowadzenia zależą od obudowy oraz modelu.',checks:['Odczytaj pełne oznaczenie elementu.','Porównaj obudowę, pinout i parametry katalogowe.','Analizę wykonaj w warunkach pomiarowych wskazanych przez dokumentację.'],safety:'Nie zakładaj uniwersalnego pinoutu G/D/S; sprawdź datasheet konkretnej części.'},
    {id:'L1',type:'Cewka / dławik',area:'PRZETWORNICA',desc:'Przykładowy element magnetyczny używany w wielu topologiach przetwornic.',checks:['Zanotuj oznaczenie i położenie.','Sprawdź widoczne uszkodzenia i pęknięcia.','Interpretuj pomiary w kontekście schematu.'],safety:'Sama rezystancja cewki nie potwierdza sprawności całej przetwornicy.'},
    {id:'C1',type:'Kondensator',area:'FILTRACJA',desc:'Symboliczny kondensator filtrujący. Pojemność, napięcie i dielektryk należy potwierdzić w dokumentacji.',checks:['Zidentyfikuj typ i oznaczenie.','Sprawdź polaryzację, jeśli występuje.','Weryfikuj pojemność/ESR odpowiednim przyrządem i procedurą.'],safety:'Rozładuj kondensatory zgodnie z bezpieczną procedurą; nie zwieraj ich śrubokrętem.'},
    {id:'U2',type:'Kontroler ładowania',area:'ŁADOWANIE',desc:'Poglądowy kontroler funkcji ładowania. Nie oznacza konkretnego układu USB-C PD.',checks:['Zapisz symbol układu.','Sprawdź topologię i dane producenta.','Zweryfikuj zgodność adaptera i przewodu, zanim przejdziesz do elektroniki.'],safety:'Nie wymuszaj negocjacji USB-C i nie podawaj napięcia na nieznane linie.'},
    {id:'JUSB',type:'Port USB-C',area:'ZEWNĘTRZNE / I/O',desc:'Złącze w demonstracyjnym układzie. Rzeczywiste połączenia CC, VBUS i linii danych różnią się zależnie od projektu.',checks:['Sprawdź mechanikę portu i zabrudzenia.','Ustal dokładny model i schemat.','Weryfikuj profile PD wyłącznie zgodnym analizatorem i procedurą.'],safety:'Nigdy nie zwieraj styków portu USB-C ani nie eksperymentuj z pinami.'},
    {id:'TP1',type:'Punkt pomiarowy',area:'TEST / POMIAR',desc:'Oznaczenie TP jest jedynie przykładem. Nie wskazuje rzeczywistej wartości ani funkcji.',checks:['Odszukaj TP w schemacie właściwej rewizji.','Sprawdź, czy pomiar odbywa się przy zasilaniu czy bez niego.','Zapisz przyrząd, zakres i warunki pomiaru.'],safety:'Nie mierz w punkcie, którego funkcji i warunków nie potwierdziłeś.'},
    {id:'RAM1',type:'Gniazdo pamięci',area:'PAMIĘĆ',desc:'Symboliczne gniazdo pamięci. Typ, kanały i obsługiwane moduły są zależne od urządzenia.',checks:['Ustal generację i format pamięci.','Potwierdź listę obsługiwanych konfiguracji.','Testuj według procedury producenta.'],safety:'Odłącz zasilanie przed wyjmowaniem modułów i stosuj ESD.'}
  ];
  function renderBoardList(filter='') {
    const q = filter.toLowerCase();
    const items = boardParts.filter(p => `${p.id} ${p.type} ${p.area} ${p.desc}`.toLowerCase().includes(q));
    $('a148BoardList').innerHTML = items.map(p => `<button type="button" class="a148-board-part ${state.boardSelection===p.id?'active':''}" data-a148-part="${p.id}"><b>${p.id}</b><span>${esc(p.type)}</span><small>${esc(p.area)}</small></button>`).join('') || '<p class="a148-muted">Brak elementów dla podanego filtra.</p>';
    root.querySelectorAll('.a148-pad[data-a148-part]').forEach(btn => btn.classList.toggle('active', btn.dataset.a148Part === state.boardSelection));
    const selected = boardParts.find(p => p.id === state.boardSelection) || boardParts[0];
    if (selected) {
      $('a148BoardDetail').innerHTML = `<span class="a148-eyebrow">${esc(selected.area)} / ${esc(selected.id)}</span><h3>${esc(selected.type)}</h3><p>${esc(selected.desc)}</p><h4>Bezpieczna kolejność nauki</h4><ol>${selected.checks.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="a148-safety"><b>Ostrzeżenie:</b> ${esc(selected.safety)}</p>`;
    }
  }
  $('a148BoardSearch')?.addEventListener('input', e=>renderBoardList(e.target.value));
  $('a148BoardList')?.addEventListener('click', e=>{const b=e.target.closest('[data-a148-part]');if(!b)return;state.boardSelection=b.dataset.a148Part;save();renderBoardList($('a148BoardSearch').value);});
  renderBoardList();

  // --- Symulator przyjęcia i obsługi przypadku ---
  const serviceCases = {
    intake:{title:'Przyjęcie laptopa / komputera',steps:['Zapisz model, konfigurację i widoczne uszkodzenia.','Zapisz objaw dokładnie słowami zgłaszającego; nie dopisuj przypuszczeń jako faktów.','Ustal ważność danych i potwierdź, czy istnieje kopia zapasowa.','Uzgodnij zakres diagnozy, zgodę na czynności i sposób kontaktu.','Wykonaj dokumentację stanu zewnętrznego bez fotografowania danych prywatnych.']},
    diagnosis:{title:'Diagnostyka bez obrazu',steps:['Wyklucz monitor, kabel, wejście i zewnętrzne urządzenie wyświetlające.','Zapisz kody POST/Q-LED i dokładny model płyty.','Sprawdź konfigurację minimalną zgodnie z instrukcją urządzenia.','Testuj jeden element na raz i zapisuj warunki każdej próby.','Wniosek opieraj na powtarzalnych wynikach, nie na pojedynczym objawie.']},
    charging:{title:'Brak ładowania USB-C',steps:['Potwierdź zgodny zasilacz, przewód i ich profile mocy.','Obejrzyj port i sprawdź, czy objaw zależy od położenia wtyku.','Zapisz komunikaty systemu i zachowanie baterii.','Znajdź dokumentację modelu oraz rewizji płyty.','Nie wykonuj pomiarów na nieznanych pinach; użyj wyłącznie potwierdzonej procedury.']},
    data:{title:'Ryzyko uszkodzenia nośnika',steps:['Ustal, czy dane są krytyczne i czy istnieje kopia.','Zapisz objawy SMART i zachowanie nośnika bez zbędnego obciążenia.','Przy klikaniu, zanikaniu lub błędach mechanicznych przerwij testy.','Nie zapisuj na źródłowym nośniku i nie uruchamiaj napraw systemu plików na siłę.','Dobierz kontrolowane obrazowanie lub specjalistyczne odzyskiwanie.']},
    overheating:{title:'Przegrzewanie urządzenia',steps:['Zapisz temperatury, obciążenie, taktowanie i profil zasilania.','Sprawdź przepływ powietrza i pracę wentylatorów.','Oceń zabrudzenia oraz stan mechaniczny chłodzenia.','Dobieraj materiały termiczne na podstawie dokumentacji danego modelu.','Powtórz ten sam test i porównaj wyniki.']}
  };
  let activeService = null, serviceStep = 0;
  function renderService() {
    const c = activeService && serviceCases[activeService];
    if (!c) { $('a148ServiceStage').innerHTML = '<p>Wybierz scenariusz i kliknij „Rozpocznij”.</p>'; $('a148ServiceProgress').textContent='0/0'; return; }
    const done = serviceStep >= c.steps.length;
    $('a148ServiceProgress').textContent = `${Math.min(serviceStep+1,c.steps.length)}/${c.steps.length}`;
    $('a148ServiceStage').innerHTML = done ? `<h3>${esc(c.title)} — ukończono</h3><p>Scenariusz zakończony. Zapisz przebieg lokalnie, aby zachować go w historii ćwiczeń.</p><button type="button" class="a148-btn primary" data-a148-service-save>Zapisz wynik ćwiczenia</button>` : `<span class="a148-eyebrow">KROK ${serviceStep+1} / ${c.steps.length}</span><h3>${esc(c.title)}</h3><p>${esc(c.steps[serviceStep])}</p><div class="a148-service-controls"><button type="button" class="a148-btn" data-a148-service-prev ${serviceStep===0?'disabled':''}>Wstecz</button><button type="button" class="a148-btn primary" data-a148-service-next>Potwierdź krok</button></div>`;
  }
  $('a148ServiceStart')?.addEventListener('click',()=>{activeService=$('a148ServiceCase').value;serviceStep=0;renderService();});
  $('a148ServiceStage')?.addEventListener('click',e=>{
    if(e.target.closest('[data-a148-service-next]')){serviceStep++;renderService();}
    if(e.target.closest('[data-a148-service-prev]')){serviceStep=Math.max(0,serviceStep-1);renderService();}
    if(e.target.closest('[data-a148-service-save]')){state.serviceDone=Array.isArray(state.serviceDone)?state.serviceDone:[];state.serviceDone.push({id:`SVC-${Date.now().toString(36)}`,case:activeService,title:serviceCases[activeService].title,date:new Date().toLocaleString('pl-PL')});state.serviceDone=state.serviceDone.slice(-50);save();renderServiceHistory();status('a148ServiceStatus','Zapisano wynik lokalnie.');activeService=null;serviceStep=0;renderService();}
  });
  function renderServiceHistory(){ $('a148ServiceHistory').innerHTML=(state.serviceDone||[]).slice().reverse().map(x=>`<li><b>${esc(x.title)}</b><small>${esc(x.date)}</small></li>`).join('')||'<li>Brak ukończonych scenariuszy.</li>'; }
  renderService();renderServiceHistory();

  // --- Zaawansowana kontrola zgodności PC ---
  $('a148CompatForm')?.addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(e.currentTarget), n=name=>Number(f.get(name)||0), issues=[];
    if(f.get('cpuSocket')!==f.get('boardSocket'))issues.push(['fail','Gniazdo procesora i płyty nie pasują.']);
    if(f.get('ramType')!==f.get('boardRam'))issues.push(['fail','Generacja pamięci RAM jest niezgodna.']);
    if(n('gpuLength')>n('caseGpu'))issues.push(['fail',`GPU ${n('gpuLength')} mm przekracza deklarowany limit obudowy ${n('caseGpu')} mm.`]);
    if(n('coolerHeight')>n('caseCooler'))issues.push(['fail',`Chłodzenie ${n('coolerHeight')} mm przekracza limit obudowy ${n('caseCooler')} mm.`]);
    if(n('psu')<n('cpu')+n('gpu')+150)issues.push(['warn',`Moc PSU jest poniżej uproszczonego progu CPU + GPU + 150 W (${n('cpu')+n('gpu')+150} W).`]);
    if(f.get('gpuPowerConnector')==='no')issues.push(['fail','Brak potwierdzonego zgodnego przewodu/złącza zasilania GPU.']);
    if(f.get('m2Support')==='sata-only' && f.get('drive')==='nvme')issues.push(['fail','Wybrano SSD NVMe, a slot oznaczono jako SATA-only.']);
    if(f.get('m2Support')==='nvme-only' && f.get('drive')==='sata')issues.push(['fail','Wybrano SSD M.2 SATA, a slot oznaczono jako NVMe-only.']);
    if(!issues.length)issues.push(['pass','Nie wykryto konfliktu w podanych polach. Nadal potwierdź dokładne modele, BIOS, QVL, wymiary, złącza i specyfikacje producentów.']);
    const fails=issues.some(x=>x[0]==='fail'),warn=issues.some(x=>x[0]==='warn');
    $('a148CompatResult').innerHTML=`<h3>${fails?'WYKRYTO NIEZGODNOŚĆ':warn?'WYMAGA DALSZEJ WERYFIKACJI':'BRAK KONFLIKTU W PODSTAWOWYCH POLACH'}</h3><ul>${issues.map(x=>`<li class="${x[0]}">${esc(x[1])}</li>`).join('')}</ul><p class="a148-safety">To kontrola orientacyjna. Nie jest bazą QVL, gwarancją kompatybilności ani rekomendacją zakupową. Sprawdź dokumentację dokładnego modelu i rewizji.</p>`;
  });

  // --- Dokumentacja i raport serwisowy ---
  $('a148ReportForm')?.addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);const record={id:`RPT-${Date.now().toString(36).toUpperCase()}`,createdAt:new Date().toISOString(),title:String(f.get('title')||'').trim(),device:String(f.get('device')||'').trim(),reference:String(f.get('reference')||'').trim(),issue:String(f.get('issue')||'').trim(),findings:String(f.get('findings')||'').trim(),work:String(f.get('work')||'').trim(),parts:String(f.get('parts')||'').trim(),finalTest:String(f.get('finalTest')||'').trim(),status:String(f.get('status')||'')};
    if(!record.title||!record.device||!record.issue)return;
    state.reports=Array.isArray(state.reports)?state.reports:[];state.reports.push(record);state.reports=state.reports.slice(-30);save();renderReport(record);status('a148ReportStatus','Raport zapisany lokalnie. Przycisk „Drukuj / PDF” otworzy systemowe okno drukowania.');
  });
  function renderReport(r){$('a148ReportPreview').hidden=false;$('a148ReportPreview').innerHTML=`<div class="a148-report-head"><b>NAUKA OD A DO Z / RAPORT EDUKACYJNY</b><span>${esc(r.id)}</span></div><h2>${esc(r.title)}</h2><p><b>Urządzenie:</b> ${esc(r.device)} · <b>Ref.:</b> ${esc(r.reference||'nie podano')}</p><p><b>Data:</b> ${esc(new Date(r.createdAt).toLocaleString('pl-PL'))} · <b>Status:</b> ${esc(r.status)}</p><h3>Zgłoszenie / objawy</h3><p>${esc(r.issue)}</p><h3>Ustalenia / dowody</h3><p>${esc(r.findings||'Nie wpisano')}</p><h3>Wykonane czynności</h3><p>${esc(r.work||'Nie wpisano')}</p><h3>Części / materiały</h3><p>${esc(r.parts||'Nie wpisano')}</p><h3>Test końcowy</h3><p>${esc(r.finalTest||'Nie wpisano')}</p><small>Dokument wygenerowany lokalnie przez Akademię. Zweryfikuj treść i usuń dane osobowe przed udostępnieniem.</small>`;}
  $('a148ReportPrint')?.addEventListener('click',()=>{if($('a148ReportPreview').hidden)return;document.body.classList.add('a148-print-report');window.print();setTimeout(()=>document.body.classList.remove('a148-print-report'),700);});
  $('a148ReportExport')?.addEventListener('click',()=>download(`raporty-serwisowe-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({product:'NAUKA OD A DO Z',hotfix:'FIX148',reports:state.reports||[]},null,2)));

  // --- Akademia nauczyciela: szkice lekcji, niepublikowane automatycznie ---
  $('a148TeacherForm')?.addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);const lesson={id:`DRAFT-${Date.now().toString(36).toUpperCase()}`,createdAt:new Date().toISOString(),title:String(f.get('title')||'').trim(),category:String(f.get('category')||''),objective:String(f.get('objective')||'').trim(),materials:String(f.get('materials')||'').trim(),steps:String(f.get('steps')||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,20),question:String(f.get('question')||'').trim(),answers:[String(f.get('answerA')||'').trim(),String(f.get('answerB')||'').trim(),String(f.get('answerC')||'').trim()],correct:Number(f.get('correct')||0)};
    if(!lesson.title||!lesson.objective||lesson.steps.length<2){status('a148TeacherStatus','Uzupełnij tytuł, cel i co najmniej dwa kroki.');return;}
    state.teacherDrafts=Array.isArray(state.teacherDrafts)?state.teacherDrafts:[];state.teacherDrafts.push(lesson);state.teacherDrafts=state.teacherDrafts.slice(-40);save();e.currentTarget.reset();renderTeacher();status('a148TeacherStatus','Zapisano szkic lokalnie. Nie został opublikowany do katalogu kursów.');
  });
  function renderTeacher(){const drafts=state.teacherDrafts||[];$('a148TeacherDrafts').innerHTML=drafts.slice().reverse().map(d=>`<article class="a148-mini-card"><b>${esc(d.title)}</b><small>${esc(d.category)} · ${d.steps.length} kroków</small><p>${esc(d.objective)}</p><button type="button" class="a148-btn" data-a148-draft="${esc(d.id)}">Podgląd szkicu</button></article>`).join('')||'<p>Nie ma jeszcze własnych szkiców lekcji.</p>';}
  $('a148TeacherDrafts')?.addEventListener('click',e=>{const b=e.target.closest('[data-a148-draft]');if(!b)return;const d=(state.teacherDrafts||[]).find(x=>x.id===b.dataset.a148Draft);if(!d)return;$('a148TeacherPreview').hidden=false;$('a148TeacherPreview').innerHTML=`<h3>${esc(d.title)}</h3><p><b>Cel:</b> ${esc(d.objective)}</p><p><b>Materiały:</b> ${esc(d.materials||'Nie podano')}</p><ol>${d.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p><b>Pytanie:</b> ${esc(d.question)}</p><ul>${d.answers.map((x,i)=>`<li>${String.fromCharCode(65+i)}. ${esc(x)} ${i===d.correct?'(odpowiedź oznaczona jako prawidłowa)':''}</li>`).join('')}</ul><small>Szkic lokalny · ${esc(d.id)} · nieopublikowany</small>`;});
  $('a148TeacherExport')?.addEventListener('click',()=>download(`szkice-lekcji-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({product:'NAUKA OD A DO Z',hotfix:'FIX148',drafts:state.teacherDrafts||[]},null,2)));
  renderTeacher();

  // --- Baza usterek: wiedza referencyjna edukacyjna ---
  const faults = [
    ['PC nie włącza się','Zasilanie','Zapisz model PSU/płyty, sprawdź gniazdo i przewód; następnie kody LED zgodnie z instrukcją.','Nie otwieraj PSU. Odłącz zasilanie przed oględzinami wnętrza.'],
    ['Laptop nie ładuje przez USB-C','Zasilanie / USB-C','Potwierdź profil zasilacza i przewód, obejrzyj port, odczytaj stan ładowania i dokumentację PD modelu.','Nie zwieraj pinów USB-C i nie podawaj napięcia na nieznane punkty.'],
    ['Brak obrazu po uruchomieniu','POST / obraz','Wyklucz monitor/kabel/port; odczytaj Q-LED/POST; testuj minimalną konfigurację według instrukcji.','Odłącz zasilanie przed przekładaniem RAM/GPU.'],
    ['Artefakty obrazu GPU','GPU / VRAM','Przywróć ustawienia fabryczne, wyklucz ekran i przewód, zapisz temperatury, sterownik i logi.','Przerwij test przy zapachu, dymie lub niekontrolowanej temperaturze.'],
    ['Losowe restarty / Kernel-Power 41','Windows / zasilanie','Kernel-Power 41 opisuje nieoczekiwane wyłączenie; skoreluj czas z WHEA, minidump, temperaturą i obciążeniem.','Sam wpis 41 nie wskazuje uszkodzonego PSU ani konkretnej części.'],
    ['Wysokie temperatury CPU','Chłodzenie','Porównaj temperatury w znanym obciążeniu, przepływ powietrza, wentylatory i montaż chłodzenia.','Nie dobieraj grubości termopadów na oko.'],
    ['Dysk znika z systemu','Dane / nośnik','Zapisz SMART i objawy, sprawdź połączenie i zdarzenia; przy oznakach mechanicznych przerwij obciążanie.','Ważne dane najpierw zabezpiecz; nie zapisuj na źródłowym nośniku.'],
    ['Błędy pamięci RAM','RAM / POST','Sprawdź obsługę modułu, sloty i ustawienia bazowe; testuj pojedyncze moduły według procedury płyty.','Odłącz zasilanie przed demontażem pamięci i zachowaj ESD.'],
    ['BSOD po aktualizacji sterownika','Windows / sterowniki','Zapisz kod, minidump i ostatnią zmianę; sprawdź tryb awaryjny, wersję sterownika i historię niezawodności.','Nie usuwaj logów przed zabezpieczeniem dowodów.'],
    ['Wi-Fi rozłącza się','Sieć / sterownik','Zapisz model karty, wersję sterownika, pasmo, logi routera i porównaj z inną siecią.','Nie resetuj routera klienta bez zgody i kopii konfiguracji.'],
    ['Wentylator hałasuje','Mechanika / chłodzenie','Sprawdź źródło hałasu, mocowanie, przewód i łożysko; porównaj zachowanie z profilem producenta.','Nie zatrzymuj wirnika palcem i nie pracuj przy odsłoniętym elemencie zasilanym.'],
    ['Bateria puchnie','Bateria / bezpieczeństwo','Wycofaj urządzenie z użycia, nie naciskaj i nie przebijaj; postępuj według lokalnych procedur utylizacji.','Nie ładuj, nie wyginaj i nie przebijaj spuchniętej baterii.'],
    ['Port USB nie wykrywa urządzeń','I/O / USB','Sprawdź inne urządzenie, port, ustawienia systemowe i dokumentację kontrolera.','Nie zwieraj styków portu i nie wkładaj metalowych narzędzi.'],
    ['Brak dźwięku','Audio / sterowniki','Sprawdź wyjście, mikser, urządzenie domyślne, sterownik i logi systemowe.','Najpierw wyklucz ustawienia i przewód, nie wymieniaj kodeka bez dowodu.'],
    ['Laptop wyłącza się przy ruchu klapy','Zasilanie / zawiasy','Zapisz warunki, sprawdź historię i wizualnie zawiasy/przewody bez wymuszania ruchu.','Nie wyginaj obudowy; możliwe uszkodzenie przewodu lub baterii.'],
    ['Nie wykrywa SSD NVMe','Storage / M.2','Potwierdź typ slotu, tryb SATA/NVMe, współdzielenie linii, BIOS i poprawne osadzenie.','Odłącz zasilanie przed demontażem SSD.'],
    ['Brak obrazu po aktualizacji BIOS','BIOS / firmware','Zweryfikuj dokładny model, rewizję, wersję i oficjalną procedurę odzyskiwania producenta.','Nie wgrywaj firmware z podobnego modelu ani innej rewizji.'],
    ['Przegrzewanie GPU','GPU / termika','Zapisz core/hotspot, obroty i obciążenie; porównaj z dokumentacją modelu oraz stanem chłodzenia.','Przerwij przy nieprawidłowym zasilaniu lub gwałtownym wzroście temperatur.']
  ].map((x,i)=>({id:`FDB-${String(i+1).padStart(3,'0')}`,title:x[0],category:x[1],checks:x[2],safety:x[3]}));
  function renderFaults(){const q=($('a148FaultSearch')?.value||'').toLowerCase();const cat=$('a148FaultCategory')?.value||'all';const all=[...faults,...(state.customFaults||[])];const visible=all.filter(x=>(cat==='all'||x.category===cat)&&`${x.title} ${x.category} ${x.checks} ${x.safety}`.toLowerCase().includes(q));$('a148FaultList').innerHTML=visible.map(f=>`<button type="button" class="a148-fault-item" data-a148-fault="${esc(f.id)}"><b>${esc(f.title)}</b><small>${esc(f.category)}</small></button>`).join('')||'<p>Nie znaleziono przypadku.</p>';status('a148FaultCount',`${visible.length} / ${all.length} przypadków`);}
  $('a148FaultSearch')?.addEventListener('input',renderFaults);$('a148FaultCategory')?.addEventListener('change',renderFaults);
  $('a148FaultList')?.addEventListener('click',e=>{const b=e.target.closest('[data-a148-fault]');if(!b)return;const f=[...faults,...(state.customFaults||[])].find(x=>x.id===b.dataset.a148Fault);if(!f)return;$('a148FaultDetail').innerHTML=`<span class="a148-eyebrow">${esc(f.id)} / ${esc(f.category)}</span><h3>${esc(f.title)}</h3><h4>Proponowana kolejność weryfikacji</h4><p>${esc(f.checks)}</p><p class="a148-safety"><b>Bezpieczeństwo:</b> ${esc(f.safety)}</p><p>To materiał edukacyjny. Potwierdź procedurę dla dokładnego modelu i rewizji.</p>`;});
  $('a148FaultForm')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const title=String(f.get('title')||'').trim(),checks=String(f.get('checks')||'').trim();if(!title||!checks)return;state.customFaults=Array.isArray(state.customFaults)?state.customFaults:[];state.customFaults.push({id:`USR-${Date.now().toString(36)}`,title,category:String(f.get('category')||'Własne'),checks,safety:String(f.get('safety')||'Potwierdź procedurę w dokumentacji producenta.')});state.customFaults=state.customFaults.slice(-50);save();e.currentTarget.reset();renderFaults();status('a148FaultStatus','Dodano własny wpis lokalnie.');});
  $('a148FaultExport')?.addEventListener('click',()=>download(`baza-usterek-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({product:'NAUKA OD A DO Z',hotfix:'FIX148',seed:faults,custom:state.customFaults||[]},null,2)));
  renderFaults();

  // --- Laboratorium lutowania: checklist i mikrosprawdzian ---
  const solderSteps = [
    ['Bezpieczeństwo i ESD','Przygotuj wentylację/odciąg, okulary, matę i opaskę ESD używaną zgodnie z instrukcją stanowiska.'],
    ['Inspekcja płytki treningowej','Użyj nieaktywnej płytki ćwiczeniowej. Zidentyfikuj pola lutownicze i elementy, nie ćwicz na urządzeniu klienta.'],
    ['Dobór materiałów','Dobierz grot, stop, topnik i temperaturę według producenta materiałów oraz charakteru zadania. Nie stosuj jednej wartości dla wszystkich prac.'],
    ['Przygotowanie grotu','Oczyść i pobiel grot zgodnie z instrukcją stacji. Kontroluj stan powłoki i przewodu.'],
    ['Ćwiczenie połączeń','Ćwicz na polach testowych. Obserwuj zwilżanie, ilość spoiwa i stabilność elementu; nie przegrzewaj pól.'],
    ['Kontrola optyczna','Oceń kształt, mostki, brak zwilżenia i resztki topnika pod powiększeniem. Porównaj z kryteriami szkolenia.'],
    ['Zakończenie pracy','Wyłącz stację zgodnie z instrukcją, odłóż grot na podstawkę, oczyść stanowisko i segreguj odpady.']
  ];
  function renderSolder(){const done=state.solder||{};const count=solderSteps.filter((_,i)=>done[i]).length;$('a148SolderProgress').textContent=`${count}/${solderSteps.length}`;$('a148SolderBar').style.width=`${count/solderSteps.length*100}%`;$('a148SolderSteps').innerHTML=solderSteps.map((s,i)=>`<label class="a148-solder-step ${done[i]?'done':''}"><input type="checkbox" data-a148-solder="${i}" ${done[i]?'checked':''}><span><b>${String(i+1).padStart(2,'0')} · ${esc(s[0])}</b><small>${esc(s[1])}</small></span></label>`).join('');}
  $('a148SolderSteps')?.addEventListener('change',e=>{const input=e.target.closest('[data-a148-solder]');if(!input)return;state.solder=state.solder||{};state.solder[input.dataset.a148Solder]=input.checked;save();renderSolder();});
  $('a148SolderReset')?.addEventListener('click',()=>{state.solder={};save();renderSolder();status('a148SolderStatus','Checklistę wyzerowano.');});
  $('a148SolderQuiz')?.addEventListener('click',()=>{const answer=$('a148SolderAnswer').value;status('a148SolderStatus',answer==='safe'?'Poprawnie: dobór parametrów musi wynikać z dokumentacji materiałów i zadania.':'Niepoprawnie. Wybierz odpowiedź opartą na danych producenta materiałów i procedurze.');});
  renderSolder();

  $('a148ExportAll')?.addEventListener('click',()=>download(`akademia-fix148-kopia-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({product:'NAUKA OD A DO Z',hotfix:'FIX148',exportedAt:new Date().toISOString(),state},null,2)));
  status('a148StorageStatus','Postępy, szkice i raporty są przechowywane lokalnie w tej przeglądarce. Eksportuj kopię, jeśli chcesz je przenieść.');
  window.ACADEMY_FIX148_API = Object.freeze({hotfix:'FIX148',boardParts:boardParts.map(x=>({...x})),serviceCases:Object.keys(serviceCases),faultCount:faults.length,solderSteps:solderSteps.length,exportLocal:()=>({...state})});
})();
