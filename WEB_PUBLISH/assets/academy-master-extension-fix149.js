/* NAUKA OD A DO Z 6.8.0 — FIX149 / ROZSZERZENIE AKADEMII MASTER
 * Konkurs lokalny, oscyloskop syntetyczny, bezpieczeństwo danych, biblioteka źródeł i pakiety HTML offline.
 * Moduły edukacyjne: nie sterują sprzętem, nie wykonują kopii ani odzyskiwania danych.
 */
(() => {
  'use strict';
  const root = document.getElementById('a149Extension');
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';
  const STORE = 'academy-fix149-advanced-training-suite';
  const $ = id => root.querySelector(`#${id}`);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; } };
  const state = { contestResults: [], dataChecklist: {}, docs: [], ...read() };
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); return true; } catch { return false; } };
  const download = (name, data, type='application/json;charset=utf-8') => {
    const blob = new Blob([data], {type}); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1200);
  };
  const text = (id, value) => { const node=$(id); if(node) node.textContent=value; };

  // Zakładki FIX149 nie dodają nowej trasy ani widoku strony.
  root.querySelectorAll('[data-a149-tab]').forEach(btn => btn.addEventListener('click', () => {
    const key=btn.dataset.a149Tab;
    root.querySelectorAll('[data-a149-tab]').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
    root.querySelectorAll('[data-a149-panel]').forEach(p=>{const active=p.dataset.a149Panel===key;p.hidden=!active;p.setAttribute('aria-hidden',active?'false':'true');});
    if(key==='scope') drawScope();
  }));

  // ------------------------------------------------------------------
  // 1. KONKURS SERWISOWY — lokalny test na czas, bez rankingu globalnego.
  // ------------------------------------------------------------------
  const contestPool = [
    {q:'Laptop nie wyświetla obrazu. Co sprawdzasz jako pierwsze?',a:['Wymieniasz płytę główną.','Weryfikujesz monitor, przewód, źródło obrazu i objaw.','Od razu aktualizujesz BIOS.'],c:1,e:'Najpierw potwierdź tor wyświetlania i precyzyjnie opisz objaw. Nie wymieniaj części na podstawie zgadywania.'},
    {q:'Nośnik HDD klika i znika z systemu. Najbezpieczniejsza reakcja?',a:['Wielokrotnie uruchamiasz CHKDSK.','Ograniczasz dalsze uruchamianie i oceniasz potrzebę odzysku.','Formatujesz partycję.'],c:1,e:'Objawy mechaniczne wymagają ograniczenia zbędnych prób; naprawy logiczne mogą zwiększyć ryzyko utraty danych.'},
    {q:'Przed pomiarem na płycie nie znasz funkcji punktu TP. Co robisz?',a:['Mierzysz dowolnym zakresem.','Podajesz napięcie testowe.','Odszukujesz punkt w dokumentacji właściwej rewizji.'],c:2,e:'Oznaczenie TP samo nie definiuje wartości ani warunków. Potwierdź funkcję w dokumentacji.'},
    {q:'Co potwierdza kompatybilność modułu RAM?',a:['Tylko podobny wygląd.','Generacja, format, obsługa platformy i dokumentacja/QVL.','Kolor radiatora.'],c:1,e:'Sprawdź generację, format, obsługę kontrolera i listę producenta płyty/systemu.'},
    {q:'Klient przekazuje urządzenie z ważnymi danymi. Co uzgadniasz przed diagnozą?',a:['Zgodę, zakres czynności i status kopii zapasowej.','Hasło do wszystkich kont.','Zgodę na formatowanie bez pytania.'],c:0,e:'Zakres diagnozy, ryzyko danych i zgoda klienta muszą być ustalone. Nie zbieraj zbędnych sekretów.'},
    {q:'Zasilacz i karta GPU mają niepotwierdzony typ przewodu. Co robisz?',a:['Używasz adaptera z szuflady.','Potwierdzasz zgodność przewodu i pinoutu z dokumentacją obu urządzeń.','Łączysz przewody według kolorów.'],c:1,e:'Złącza i przewody nie są uniwersalne. Potwierdź zgodność konkretnego modelu PSU/GPU.'},
    {q:'Po czyszczeniu chłodzenia temperatura nadal rośnie. Co zapisujesz?',a:['Tylko nazwę pasty.','Temperatury, obciążenie, taktowanie, profil i warunki testu.','Przypadkową wartość z jednego odczytu.'],c:1,e:'Porównanie wymaga powtarzalnych warunków oraz kilku parametrów, a nie pojedynczej liczby.'},
    {q:'Podejrzenie ransomware na komputerze klienta. Co jest niewłaściwe?',a:['Odizolowanie urządzenia od sieci zgodnie z procedurą.','Zachowanie informacji o objawach.','Podłączanie nośnika źródłowego do zwykłego komputera i otwieranie plików.'],c:2,e:'Nie uruchamiaj podejrzanych plików i nie łącz infekowanego środowiska z siecią. Działaj według procedury bezpieczeństwa.'},
    {q:'Czy symulator oscyloskopu w tej Akademii jest pomiarem rzeczywistej płyty?',a:['Tak, odczytuje napięcia przez przeglądarkę.','Nie, generuje sygnały matematyczne do nauki interpretacji.','Tak, bez podłączenia przyrządu.'],c:1,e:'To wykres syntetyczny. Nie odbiera danych z urządzenia ani przyrządu pomiarowego.'}
  ];
  let contest=null, contestTimer=null;
  const shuffle = list => { const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; };
  function renderRanking(){
    const list=$('a149ContestRanking'); if(!list)return;
    const rows=[...(state.contestResults||[])].sort((a,b)=>b.points-a.points||a.seconds-b.seconds).slice(0,10);
    list.innerHTML=rows.length?rows.map((x,i)=>`<li><b>${i+1}. ${x.points}/5 pkt</b><small>${x.seconds}s · ${esc(new Date(x.at).toLocaleString())}</small></li>`).join(''):'<li>Brak zakończonych rund.</li>';
  }
  function stopContestTimer(){if(contestTimer){clearInterval(contestTimer);contestTimer=null;}}
  function finishContest(expired=false){
    if(!contest||contest.finished)return;
    contest.finished=true; stopContestTimer();
    const seconds=120-contest.remaining;
    state.contestResults=state.contestResults||[];
    state.contestResults.unshift({points:contest.score,seconds,at:new Date().toISOString()}); state.contestResults=state.contestResults.slice(0,30); save();
    $('a149ContestQuestion').innerHTML=`<h4>Runda zakończona: ${contest.score}/5 punktów</h4><p>${expired?'Upłynął limit czasu.':'Dziękujemy za udział.'} Czas: ${seconds} s.</p><p>To wynik treningowy zapisany lokalnie.</p>`;
    $('a149ContestAnswers').innerHTML=''; text('a149ContestFeedback','Uruchom nową rundę, aby wylosować kolejny zestaw.'); text('a149ContestStatus',`Wynik: ${contest.score}/5 · ${seconds} s`); renderRanking();
  }
  function renderContest(){
    if(!contest)return;
    text('a149ContestTimer',`${String(Math.floor(contest.remaining/60)).padStart(2,'0')}:${String(contest.remaining%60).padStart(2,'0')}`);
    $('a149ContestProgress').style.width=`${contest.index/5*100}%`;
    if(contest.index>=5){finishContest(false);return;}
    const item=contest.questions[contest.index];
    $('a149ContestQuestion').innerHTML=`<span class="a149-eyebrow">PYTANIE ${contest.index+1}/5</span><h4>${esc(item.q)}</h4>`;
    $('a149ContestAnswers').innerHTML=item.a.map((a,i)=>`<button type="button" class="a149-answer" data-a149-answer="${i}">${String.fromCharCode(65+i)}. ${esc(a)}</button>`).join('');
    text('a149ContestFeedback','Wybierz jedną odpowiedź.');
  }
  $('a149ContestStart')?.addEventListener('click',()=>{
    stopContestTimer(); contest={questions:shuffle(contestPool).slice(0,5),index:0,score:0,remaining:120,started:Date.now(),finished:false};
    text('a149ContestStatus','Runda rozpoczęta — powodzenia!'); renderContest();
    contestTimer=setInterval(()=>{if(!contest||contest.finished){stopContestTimer();return;}contest.remaining=Math.max(0,contest.remaining-1);text('a149ContestTimer',`${String(Math.floor(contest.remaining/60)).padStart(2,'0')}:${String(contest.remaining%60).padStart(2,'0')}`);if(contest.remaining<=0)finishContest(true);},1000);
  });
  $('a149ContestAnswers')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-a149-answer]'); if(!b||!contest||contest.finished)return;
    const item=contest.questions[contest.index], picked=Number(b.dataset.a149Answer), correct=picked===item.c;
    if(correct)contest.score++;
    [...$('a149ContestAnswers').querySelectorAll('button')].forEach((btn,i)=>{btn.disabled=true;if(i===item.c)btn.classList.add('correct');if(i===picked&&!correct)btn.classList.add('wrong');});
    text('a149ContestFeedback',`${correct?'Dobrze.':'Niepoprawnie.'} ${item.e}`);
    setTimeout(()=>{if(!contest||contest.finished)return;contest.index++;renderContest();},1100);
  });
  $('a149ContestReset')?.addEventListener('click',()=>{stopContestTimer();contest=null;text('a149ContestTimer','02:00');$('a149ContestProgress').style.width='0%';$('a149ContestQuestion').innerHTML='<h4>Wybierz „Rozpocznij konkurs”.</h4><p>Każda runda obejmuje pięć losowanych pytań.</p>';$('a149ContestAnswers').innerHTML='';text('a149ContestFeedback','');text('a149ContestStatus','Bieżąca runda wyczyszczona.');});
  renderRanking();

  // ------------------------------------------------------------------
  // 2. WIRTUALNY OSCYLOSKOP — rysuje wyłącznie sygnały syntetyczne.
  // ------------------------------------------------------------------
  function readScope(){return{wave:$('a149ScopeWave').value,f:Number($('a149ScopeFreq').value),amp:Number($('a149ScopeAmp').value),offset:Number($('a149ScopeOffset').value)};}
  function drawScope(){
    const canvas=$('a149ScopeCanvas'); if(!canvas)return;
    const ctx=canvas.getContext?.('2d'); if(!ctx)return;
    const w=Math.max(320,canvas.clientWidth||760),h=260,dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.height=`${h}px`;ctx.setTransform(dpr,0,0,dpr,0,0);
    const {wave,f,amp,offset}=readScope();
    ctx.fillStyle='#041323';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(96,154,187,.22)';ctx.lineWidth=1;
    for(let i=0;i<=10;i++){const y=16+i*(h-32)/10;ctx.beginPath();ctx.moveTo(36,y);ctx.lineTo(w-12,y);ctx.stroke();}
    for(let i=0;i<=16;i++){const x=36+i*(w-48)/16;ctx.beginPath();ctx.moveTo(x,12);ctx.lineTo(x,h-16);ctx.stroke();}
    const y0=h/2-offset*((h-38)/12);
    ctx.strokeStyle='rgba(112,235,215,.55)';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(36,y0);ctx.lineTo(w-12,y0);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#55e4df';ctx.lineWidth=2.4;ctx.beginPath();
    const cycles=2,scale=(h-38)/12;
    for(let px=0;px<=w-48;px++){
      const t=px/(w-48)*cycles/f, phase=2*Math.PI*f*t;let y=0;
      if(wave==='square')y=Math.sin(phase)>=0?amp:-amp;
      else if(wave==='triangle')y=(2/Math.PI)*Math.asin(Math.sin(phase))*amp;
      else if(wave==='ripple')y=amp*0.5+amp*0.5*Math.sin(phase);
      else y=amp*Math.sin(phase);
      const py=h/2-(offset+y)*scale,x=36+px;
      if(px===0)ctx.moveTo(x,py);else ctx.lineTo(x,py);
    }
    ctx.stroke();
    ctx.fillStyle='#86a8c1';ctx.font='11px system-ui';ctx.fillText('V',8,18);ctx.fillText('t →',w-38,h-4);
    const period=1000/f, vpp=wave==='ripple'?amp:2*amp;
    const signalRms=wave==='square'?amp:wave==='triangle'?amp/Math.sqrt(3):wave==='ripple'?Math.sqrt((amp*.5)**2+(amp*.5/Math.sqrt(2))**2):amp/Math.sqrt(2);
    text('a149ScopeFreqLabel',`${f} Hz`);text('a149ScopeAmpLabel',`${amp.toFixed(1).replace('.',',')} V`);text('a149ScopeOffsetLabel',`${offset.toFixed(1).replace('.',',')} V`);
    text('a149ScopePeriod',`${period.toFixed(2).replace('.',',')} ms`);text('a149ScopeVpp',`${vpp.toFixed(2).replace('.',',')} V`);text('a149ScopeRms',`${signalRms.toFixed(2).replace('.',',')} V`);
    text('a149ScopeRange',`${(offset-(wave==='ripple'?0:amp)).toFixed(1).replace('.',',')} do ${(offset+(wave==='ripple'?amp:amp)).toFixed(1).replace('.',',')} V`);
  }
  ['a149ScopeWave','a149ScopeFreq','a149ScopeAmp','a149ScopeOffset'].forEach(id=>$(id)?.addEventListener('input',drawScope));
  window.addEventListener('resize',()=>{const scopePanel=root.querySelector('[data-a149-panel="scope"]');if(scopePanel&&!scopePanel.hidden)drawScope();});
  $('a149ScopeQuizCheck')?.addEventListener('click',()=>text('a149ScopeQuizResult',$('a149ScopeQuiz').value==='half'?'Poprawnie. T = 1/f, więc podwojenie częstotliwości skraca okres o połowę.':'Niepoprawnie. Skorzystaj z zależności T = 1/f.'));
  drawScope();

  // ------------------------------------------------------------------
  // 3. CENTRUM BEZPIECZEŃSTWA DANYCH — procedury i lokalna checklista.
  // ------------------------------------------------------------------
  const dataSteps=[
    ['Ustal zgodę i zakres prac','Zakres diagnozy, priorytet danych, odpowiedzialność i sposób kontaktu.'],
    ['Zapisz objawy źródła','Model, pojemność, komunikaty i stan SMART — bez zbędnych powtarzanych prób.'],
    ['Oceń stan nośnika','Przy hałasie, zanikaniu lub błędach fizycznych przerwij zbędne testowanie.'],
    ['Zabezpiecz źródło','Nie zapisuj na źródłowym nośniku; rozważ kontrolowane obrazowanie i blokadę zapisu.'],
    ['Zaplanuj kopię 3-2-1','Trzy kopie, dwa rodzaje nośników, jedna kopia poza lokalizacją — gdy jest to właściwe dla przypadku.'],
    ['Zweryfikuj odtwarzanie','Sama obecność plików kopii nie wystarcza; wykonaj test odtworzenia na kopii/testowym celu.'],
    ['Udokumentuj przekazanie','Zapisz wykonane czynności, ograniczenia, wynik i sposób bezpiecznego przekazania danych.']
  ];
  const dataPlans={
    failing:{title:'Nośnik zgłasza błędy lub zanika',steps:['Ogranicz liczbę uruchomień i obciążenie źródła.','Nie inicjalizuj, nie formatuj i nie uruchamiaj napraw systemu plików na źródle.','Zapisz objawy oraz dostępne informacje diagnostyczne.','Oceń, czy potrzebne jest obrazowanie sektorowe lub specjalistyczny odzysk.'],warn:'Jeśli nośnik wydaje nietypowe dźwięki lub jest niestabilny, przerwij próby. Samodzielne wielokrotne testy mogą pogorszyć stan.'},
    deleted:{title:'Przypadkowo usunięte pliki',steps:['Przerwij zapisy na źródłowym woluminie.','Nie instaluj narzędzi odzysku na źródłowym nośniku.','Ustal typ nośnika, TRIM, szyfrowanie i czas od usunięcia.','Pracuj na obrazie/kopii, a odzysk kieruj na inny nośnik.'],warn:'Na SSD z aktywnym TRIM odzyskanie usuniętych danych może być niemożliwe. Nie gwarantuj powodzenia.'},
    malware:{title:'Podejrzenie malware lub ransomware',steps:['Odizoluj urządzenie od sieci zgodnie z procedurą organizacji.','Nie uruchamiaj podejrzanych plików i nie podłączaj niezabezpieczonych nośników.','Zabezpiecz logi/obserwacje i skontaktuj się z osobą odpowiedzialną za bezpieczeństwo.','Ustal procedurę kopii dowodowej oraz odtworzenia ze sprawdzonej kopii.'],warn:'Nie podłączaj nośnika źródłowego do zwykłego komputera i nie próbuj ręcznie uruchamiać plików w celu testu.'},
    migration:{title:'Migracja danych na nowy nośnik',steps:['Uzgodnij listę danych i zakres migracji.','Sprawdź stan źródła i pojemność celu.','Wykonaj kopię bezpieczeństwa przed migracją.','Porównaj sumy kontrolne/strukturę i sprawdź uprawnienia.','Potwierdź otwieranie kluczowych plików z nośnika docelowego.'],warn:'Nie usuwaj ani nie formatuj źródła przed potwierdzonym testem odtworzenia i akceptacją.'}
  };
  function renderDataPlan(){const p=dataPlans[$('a149DataScenario').value]||dataPlans.failing;$('a149DataPlan').innerHTML=`<h4>${esc(p.title)}</h4><ol>${p.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="a149-safety">${esc(p.warn)}</p>`;}
  function renderDataChecklist(){const box=$('a149DataChecklist');box.innerHTML=dataSteps.map((s,i)=>`<label class="a149-check"><input type="checkbox" data-a149-data-step="${i}" ${state.dataChecklist?.[i]?'checked':''}><span><b>${i+1}. ${esc(s[0])}</b><small>${esc(s[1])}</small></span></label>`).join('');const n=dataSteps.filter((_,i)=>state.dataChecklist?.[i]).length;text('a149DataStatus',`Postęp checklisty: ${n}/${dataSteps.length}`);$('a149DataProgress').style.width=`${n/dataSteps.length*100}%`;}
  $('a149DataScenario')?.addEventListener('change',renderDataPlan);
  $('a149DataChecklist')?.addEventListener('change',e=>{const input=e.target.closest('[data-a149-data-step]');if(!input)return;state.dataChecklist=state.dataChecklist||{};state.dataChecklist[input.dataset.a149DataStep]=input.checked;save();renderDataChecklist();});
  $('a149DataReset')?.addEventListener('click',()=>{state.dataChecklist={};save();renderDataChecklist();});
  $('a149DataExport')?.addEventListener('click',()=>download(`protokol-bezpieczenstwa-danych-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({createdAt:new Date().toISOString(),scenario:$('a149DataScenario').value,steps:dataSteps.map((s,i)=>({title:s[0],done:!!state.dataChecklist?.[i]}))},null,2)));
  renderDataPlan();renderDataChecklist();

  // ------------------------------------------------------------------
  // 4. BIBLIOTEKA DOKUMENTACJI — oficjalne odnośniki i lokalne zakładki.
  // ------------------------------------------------------------------
  const officialDocs=[
    {source:'HP',topic:'Wsparcie, sterowniki i instrukcje',url:'https://support.hp.com/pl-pl/',kind:'Producent'},
    {source:'Dell',topic:'Dokumentacja urządzeń, diagnostyka i sterowniki',url:'https://www.dell.com/support/home/pl-pl',kind:'Producent'},
    {source:'Lenovo',topic:'PC Support, instrukcje i aktualizacje',url:'https://pcsupport.lenovo.com/pl/pl/',kind:'Producent'},
    {source:'ASUS',topic:'Wsparcie produktów, BIOS i sterowniki',url:'https://www.asus.com/pl/support/',kind:'Producent'},
    {source:'Acer',topic:'Wsparcie, instrukcje i sterowniki',url:'https://www.acer.com/pl-pl/support',kind:'Producent'},
    {source:'MSI',topic:'Wsparcie płyt, laptopów i kart graficznych',url:'https://www.msi.com/support',kind:'Producent'},
    {source:'Intel',topic:'Centrum pobierania i dokumentacja platform',url:'https://www.intel.com/content/www/us/en/download-center/home.html',kind:'Układy / platformy'},
    {source:'AMD',topic:'Sterowniki i wsparcie procesorów / GPU',url:'https://www.amd.com/en/support',kind:'Układy / platformy'},
    {source:'NVIDIA',topic:'Sterowniki i dokumentacja GPU',url:'https://www.nvidia.com/en-us/drivers/',kind:'Układy / platformy'},
    {source:'Microsoft Learn',topic:'Dokumentacja Windows i narzędzi systemowych',url:'https://learn.microsoft.com/pl-pl/windows/',kind:'System'},
    {source:'USB-IF',topic:'Specyfikacje i dokumenty USB',url:'https://www.usb.org/documents',kind:'Standard'},
    {source:'JEDEC',topic:'Standardy pamięci i interfejsów',url:'https://www.jedec.org/standards-documents',kind:'Standard'}
  ];
  function renderDocs(filter=''){
    const q=filter.trim().toLowerCase();const items=officialDocs.filter(x=>`${x.source} ${x.topic} ${x.kind}`.toLowerCase().includes(q));
    $('a149DocsCatalog').innerHTML=items.map(x=>`<article class="a149-doc-card"><span class="a149-doc-kind">${esc(x.kind)}</span><h4>${esc(x.source)}</h4><p>${esc(x.topic)}</p><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Otwórz oficjalny portal ↗</a></article>`).join('')||'<p>Brak wyników.</p>';
  }
  function renderSavedDocs(){const box=$('a149DocsSaved');const list=state.docs||[];box.innerHTML=list.length?list.map((d,i)=>`<div class="a149-saved-doc"><div><b>${esc(d.title)}</b><small>${esc(d.source)} · ${esc(d.model||'bez modelu')} · ${esc(d.rights?'prawa potwierdzone przez użytkownika':'status praw niepotwierdzony')}</small><p>${esc(d.notes||'')}</p></div><div><a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Otwórz ↗</a> <button type="button" data-a149-doc-delete="${i}" aria-label="Usuń zakładkę">Usuń</button></div></div>`).join(''):'<p class="a149-note">Nie zapisano jeszcze własnych zakładek.</p>';}
  $('a149DocsSearch')?.addEventListener('input',e=>renderDocs(e.target.value));
  $('a149DocsForm')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);let url;try{url=new URL(String(f.get('url')||''));}catch{text('a149DocsStatus','Podaj poprawny adres HTTPS.');return;}if(url.protocol!=='https:'){text('a149DocsStatus','Dozwolone są wyłącznie adresy HTTPS.');return;}const entry={source:String(f.get('source')||'').trim(),model:String(f.get('model')||'').trim(),title:String(f.get('title')||'').trim(),url:url.href,notes:String(f.get('notes')||'').trim(),rights:f.get('rights')==='on',savedAt:new Date().toISOString()};state.docs=state.docs||[];state.docs.unshift(entry);state.docs=state.docs.slice(0,100);save();e.currentTarget.reset();renderSavedDocs();text('a149DocsStatus','Zakładka zapisana lokalnie.');});
  $('a149DocsSaved')?.addEventListener('click',e=>{const b=e.target.closest('[data-a149-doc-delete]');if(!b)return;state.docs.splice(Number(b.dataset.a149DocDelete),1);save();renderSavedDocs();});
  $('a149DocsExport')?.addEventListener('click',()=>download(`biblioteka-dokumentacji-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({exportedAt:new Date().toISOString(),officialSources:officialDocs,savedBookmarks:state.docs||[]},null,2)));
  renderDocs();renderSavedDocs();

  // ------------------------------------------------------------------
  // 5. OFFLINE PRO — samodzielny plik HTML z oryginalnymi materiałami.
  // ------------------------------------------------------------------
  const offlineModules=[
    {id:'diagnosis',title:'Diagnostyka komputera',goal:'Ustal objaw, warunki i kolejność testów bez wymiany części na ślepo.',steps:['Zapisz dokładny objaw i okoliczności wystąpienia.','Sprawdź połączenia zewnętrzne i zasilanie.','Odczytaj komunikaty, POST/Q-LED i logi.','Zmieniaj jeden czynnik na raz.','Powtórz test w tych samych warunkach i zapisz wynik.'],quiz:'Dlaczego zmieniamy jeden czynnik na raz?',answer:'Aby ustalić, która zmiana wpłynęła na wynik i uniknąć fałszywego wniosku.'},
    {id:'board',title:'Płyta główna i PCB',goal:'Naucz się identyfikować elementy i weryfikować je na podstawie dokumentacji.',steps:['Zapisz pełny model płyty i Board ID.','Odczytaj rewizję PCB.','Znajdź schemat i datasheet odpowiadające modelowi.','Potwierdź funkcję oraz parametry elementu.','Nie podawaj napięcia na nieznane punkty.'],quiz:'Czy plansza demonstracyjna może zastąpić boardview konkretnej rewizji?',answer:'Nie. Wymagana jest dokumentacja właściwego modelu i rewizji.'},
    {id:'data',title:'Bezpieczeństwo danych',goal:'Ogranicz ryzyko utraty danych podczas diagnozy i migracji.',steps:['Uzgodnij zakres prac i priorytet danych.','Oceń stan źródłowego nośnika.','Przy objawach fizycznych ogranicz zbędne uruchamianie.','Pracuj na kopii/obrazie, a nie na źródle.','Zweryfikuj możliwość odtworzenia na innym celu.'],quiz:'Czy formatowanie źródła jest właściwym pierwszym krokiem?',answer:'Nie. Najpierw należy ocenić stan, zabezpieczyć dane i uzgodnić procedurę.'},
    {id:'scope',title:'Interpretacja przebiegów',goal:'Poznaj zależność częstotliwości, okresu, amplitudy i wartości RMS.',steps:['Odczytaj skalę czasu i napięcia.','Policz okres T między powtarzalnymi punktami.','Wyznacz częstotliwość f = 1/T.','Oceń amplitudę i napięcie międzyszczytowe Vpp.','Uwzględnij składową stałą i typ przebiegu.'],quiz:'Jaki jest okres sygnału 100 Hz?',answer:'10 ms, ponieważ T = 1/100 s = 0,01 s.'},
    {id:'compat',title:'Zgodność zestawu PC',goal:'Wstępnie sprawdź fizyczną i elektryczną zgodność komponentów.',steps:['Potwierdź socket i obsługę CPU przez BIOS.','Sprawdź generację, format i QVL pamięci.','Porównaj długość GPU i wysokość chłodzenia z obudową.','Oceń budżet mocy i wymagane złącza PSU.','Potwierdź interfejs dysku M.2 oraz dokumentację płyty.'],quiz:'Czy samo dopasowanie socketu gwarantuje zgodność CPU?',answer:'Nie. Liczą się też chipset, BIOS, lista obsługiwanych CPU i wymagania producenta.'}
  ];
  function renderOfflineOptions(){
    $('a149OfflineOptions').innerHTML=offlineModules.map(m=>`<label class="a149-offline-option"><input type="checkbox" data-a149-offline="${m.id}" checked><span><b>${esc(m.title)}</b><small>${esc(m.goal)}</small></span></label>`).join('');
    updateOfflineStatus();
  }
  function updateOfflineStatus(){const n=$('a149OfflineOptions')?.querySelectorAll('input:checked').length||0;text('a149OfflineStatus',`Wybrane pakiety: ${n}/${offlineModules.length}`);}
  $('a149OfflineOptions')?.addEventListener('change',updateOfflineStatus);
  $('a149OfflineAll')?.addEventListener('click',()=>{$('a149OfflineOptions').querySelectorAll('input').forEach(x=>x.checked=true);updateOfflineStatus();});
  $('a149OfflineDownload')?.addEventListener('click',()=>{
    const ids=[...$('a149OfflineOptions').querySelectorAll('input:checked')].map(x=>x.dataset.a149Offline);const selected=offlineModules.filter(m=>ids.includes(m.id));
    if(!selected.length){text('a149OfflineStatus','Zaznacz przynajmniej jeden pakiet.');return;}
    const content=selected.map((m,idx)=>`<section><h2>${idx+1}. ${esc(m.title)}</h2><p>${esc(m.goal)}</p><h3>Procedura</h3><ol>${m.steps.map(s=>`<li><label><input type="checkbox"> ${esc(s)}</label></li>`).join('')}</ol><h3>Pytanie kontrolne</h3><p>${esc(m.quiz)}</p><details><summary>Pokaż odpowiedź</summary><p>${esc(m.answer)}</p></details><label>Moje notatki<textarea rows="4" placeholder="Notatki zapisuj w tym pliku lub wydrukuj…"></textarea></label></section>`).join('');
    const standalone=`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NAUKA OD A DO Z — Pakiet Offline PRO</title><style>*{box-sizing:border-box}body{margin:0;background:#07182a;color:#e7f3ff;font:16px/1.6 system-ui,sans-serif}main{max-width:980px;margin:auto;padding:24px}header{padding:24px;border:1px solid #28748c;border-radius:18px;background:#0c2942}h1,h2,h3{color:#6ce8df}section{margin:18px 0;padding:22px;border:1px solid #28506d;border-radius:14px;background:#0a2036}li{margin:10px 0}textarea{width:100%;padding:10px;background:#061629;color:#fff;border:1px solid #42667d;border-radius:8px}button{padding:10px 14px;border:0;border-radius:8px;background:#36d8cb;color:#052237;font-weight:800;cursor:pointer}.tip{color:#a8c6d9;font-size:13px}@media print{body{background:white;color:#111}header,section{background:white;color:#111;border:1px solid #aaa}h1,h2,h3{color:#075a68}button{display:none}}</style></head><body><main><header><small>NAUKA OD A DO Z · 6.8.0 · FIX149</small><h1>Pakiet nauki OFFLINE PRO</h1><p>Samodzielny materiał edukacyjny wygenerowany lokalnie. Nie wymaga połączenia z serwerem. Zawiera tylko wybrane moduły.</p><p class="tip">Materiał treningowy nie zastępuje dokumentacji producenta ani procedur bezpieczeństwa konkretnego sprzętu.</p><button onclick="window.print()">Drukuj / Zapisz jako PDF</button></header>${content}<footer class="tip">Wygenerowano: ${new Date().toLocaleString()} · Nie zawiera kont, sekretów ani danych klientów.</footer></main></body></html>`;
    download(`NAUKA_OD_A_DO_Z_OFFLINE_PRO_${new Date().toISOString().slice(0,10)}.html`,standalone,'text/html;charset=utf-8');
    text('a149OfflineStatus',`Utworzono jeden samodzielny plik HTML z ${selected.length} pakietami.`);
    text('a149OfflineResult','Pobrany plik można otworzyć lokalnie bez Internetu. Ukończone checkboxy i notatki w takim pliku nie synchronizują się z kontem Akademii.');
  });
  renderOfflineOptions();

  $('a149Export')?.addEventListener('click',()=>download(`academy-fix149-kopia-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({product:'NAUKA OD A DO Z',hotfix:'FIX149',exportedAt:new Date().toISOString(),state},null,2)));
  window.ACADEMY_FIX149_API=Object.freeze({hotfix:'FIX149',contestQuestionCount:contestPool.length,dataChecklistCount:dataSteps.length,officialDocumentationSources:officialDocs.length,offlinePackCount:offlineModules.length,exportLocal:()=>({...state}),scopeModel:'synthetic-only'});
})();
