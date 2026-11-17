/* NAUKA OD A DO Z 6.8.0 — FIX145 / CENTRUM MISTRZA PRO */
(() => {
  'use strict';
  const QUIZ = [
    {q:'Przed pomiarem rezystancji na płycie laptopa należy:',o:['Pozostawić podłączony zasilacz','Odłączyć źródła zasilania i postępować według instrukcji modelu','Włączyć laptop i wybrać najwyższy zakres'],a:1,e:'Pomiar rezystancji i ciągłości wykonuje się na obwodzie bez zasilania.'},
    {q:'Brak ładowania USB-C — najlepszy pierwszy krok to:',o:['Wymienić kontroler PD','Potwierdzić zgodny zasilacz, przewód i stan portu','Wgrać BIOS z podobnego laptopa'],a:1,e:'Najpierw wyklucz elementy zewnętrzne i potwierdź wymagania danego modelu.'},
    {q:'Artefakty obrazu GPU mogą wynikać z:',o:['Wyłącznie uszkodzenia VRAM','Toru obrazu, sterownika, OC, temperatury lub sprzętu','Zawsze uszkodzenia monitora'],a:1,e:'Potrzebne są niezależne próby: inny monitor/przewód, ustawienia bazowe, logi i testy.'},
    {q:'Zdarzenie Kernel-Power 41 oznacza:',o:['Pewne uszkodzenie zasilacza','Nieoczekiwane zamknięcie bez samodzielnego wskazania przyczyny','Uszkodzony system plików'],a:1,e:'To informacja o nieoczekiwanym restarcie/wyłączeniu, nie diagnoza konkretnej części.'},
    {q:'Dysk klika i zawiera ważne dane. Należy:',o:['Uruchomić wiele pełnych skanów','Ograniczyć dalszą pracę i skierować do bezpiecznej procedury odzyskiwania','Zapisać odzyskane pliki na źródle'],a:1,e:'Dalsze próby mogą pogorszyć stan nośnika. Nie zapisuj na źródłowym dysku.'}
  ];
  const BUILD_STEPS = [
    {id:'prepare',title:'Przygotuj stanowisko i części',desc:'Sprawdź modele i rewizje, rozłóż elementy na czystej powierzchni, przygotuj instrukcje i pojemnik na śruby.',safety:'Odłącz zasilanie, stosuj procedurę ESD i sprawdź, czy bateria nie jest uszkodzona.'},
    {id:'case',title:'Przygotuj obudowę',desc:'Zdejmij panele, sprawdź dystanse pod format płyty, osłonę I/O i miejsca na przewody.',safety:'Dystans nie może znaleźć się pod nieprzewidzianym punktem PCB. Nie pozostawiaj luźnych śrub w obudowie.'},
    {id:'cpu',title:'Zamontuj procesor',desc:'Potwierdź socket i orientację znacznika. Otwórz zatrzask i umieść CPU bez dociskania.',safety:'Nie dotykaj styków/pinów. Jeśli element nie leży swobodnie, przerwij i ponownie sprawdź orientację.'},
    {id:'ram',title:'Zainstaluj pamięć RAM',desc:'Sprawdź generację DDR, listę obsługiwaną przez płytę i zalecane sloty dla dwóch modułów.',safety:'Nie mieszaj generacji DDR. Moduł musi pasować do wycięcia; nie wciskaj go odwrotnie.'},
    {id:'m2',title:'Zamontuj SSD M.2',desc:'Potwierdź długość modułu, obsługę SATA/NVMe przez dany slot oraz ewentualne współdzielenie linii.',safety:'Użyj właściwego dystansu i nie dokręcaj śruby z nadmierną siłą. Zdejmij folię z termopada tylko zgodnie z instrukcją.'},
    {id:'board',title:'Umieść płytę i zasilacz',desc:'Wyrównaj płytę z dystansami, zamocuj ją, a następnie zamontuj PSU w prawidłowym kierunku przepływu powietrza.',safety:'Nie używaj brakujących ani dodatkowych dystansów. Nie otwieraj zasilacza.'},
    {id:'power-gpu',title:'Podłącz przewody i kartę GPU',desc:'Podłącz ATX, EPS CPU, SATA/Molex jeśli wymagane, przewody panelu i właściwe złącza GPU. Sprawdź długość karty.',safety:'Złącza zasilania muszą być zgodne z PSU i GPU. Nie mieszaj modularnych przewodów z różnych zasilaczy.'},
    {id:'post',title:'Pierwszy start i kontrola POST',desc:'Przed startem sprawdź przewody i brak luźnych śrub. Po uruchomieniu zweryfikuj POST, RAM, dysk, temperatury i wentylatory w UEFI.',safety:'Przy dymie, zapachu, iskrzeniu lub nietypowym dźwięku natychmiast wyłącz zasilanie i ustal przyczynę.'}
  ];
  const PLANS = {
    'no-power': {title:'Brak reakcji na zasilanie',steps:['Zapisz dokładny model, rewizję i historię zdarzenia.','Sprawdź zgodny zasilacz, przewód, gniazdo i wskaźniki zasilania.','Oceń stan mechaniczny, ślady zalania i zapach; w razie uszkodzeń przerwij.','Odłącz źródła zasilania zgodnie z instrukcją modelu przed kontrolą pasywną.','Pomiary wykonuj wyłącznie w punktach potwierdzonych dokumentacją płyty.','Zapisz każdą próbę i nie wymieniaj EC/VRM bez dowodu.'],safety:'Nie pracuj przy podłączonym zasilaniu i nie otwieraj zasilacza sieciowego.'},
    'usb-c': {title:'USB-C / brak ładowania',steps:['Potwierdź profile zgodnego zasilacza i przewodu.','Sprawdź port pod kątem luzu, zabrudzeń i uszkodzeń.','Ustal, czy laptop rozpoznaje zasilacz lub baterię.','Odszukaj dokumentację dokładnego modelu i rewizji PCB.','Odłącz zasilanie i baterię przed pomiarami pasywnymi.','Zapisz wynik negocjacji PD i pomiary zgodne z dokumentacją.'],safety:'Nie zwieraj pinów USB-C i nie podawaj napięcia na nieznane punkty.'},
    'no-image': {title:'Brak obrazu / brak POST',steps:['Zapisz model płyty, CPU, RAM, GPU i wersję BIOS.','Sprawdź monitor, wejście, przewód i inne wyjście obrazu.','Odczytaj kody POST/Q-LED dla dokładnego modelu płyty.','Przy odłączonym zasilaniu sprawdź minimalną konfigurację zgodną z instrukcją.','Testuj pojedynczo RAM/GPU/sloty; zapisuj każdą zmianę.','Nie aktualizuj BIOS, dopóki nie potwierdzisz dokładnego modelu i procedury.'],safety:'Odłącz zasilanie przed przekładaniem podzespołów; nie używaj losowego firmware.'},
    'gpu-artifacts': {title:'Artefakty GPU',steps:['Zapisz sterownik, zegary, OC i warunki wystąpienia objawu.','Wyklucz kabel, monitor i port wyjściowy.','Przywróć ustawienia fabryczne GPU.','Zapisz temperaturę rdzenia, hotspot i pracę wentylatorów.','Sprawdź logi TDR/WHEA i wykonaj kontrolowany test VRAM.','Porównaj wyniki na znanym sterowniku i w powtarzalnym scenariuszu.'],safety:'Przerwij przy nietypowym zapachu, dymie, niestabilnym zasilaniu lub niekontrolowanej temperaturze.'},
    'overheat': {title:'Przegrzewanie',steps:['Zapisz model, obciążenie, temperatury i taktowanie.','Sprawdź przepływ powietrza, wentylatory i wloty/wyloty.','Oceń kurz i stan mechaniczny chłodzenia.','Sprawdź dokumentację właściwego materiału termicznego i kolejności montażu.','Nie dobieraj grubości termopadów na oko.','Po czyszczeniu wykonaj ten sam test porównawczy.'],safety:'Nie otwieraj układu chłodzenia przy zasilaniu; przy uszkodzonej baterii przerwij.'},
    'bsod': {title:'BSOD / losowe restarty',steps:['Zapisz kod BSOD, czas, ostatnią zmianę i konfigurację.','Zabezpiecz minidump i logi Podglądu zdarzeń.','Sprawdź WHEA, sterowniki i Monitor niezawodności.','Przywróć bazowe ustawienia CPU/GPU/RAM, zapisując wcześniejsze.','Wykonaj odpowiedni test pamięci i odczyt SMART.','Zmieniaj jeden czynnik na próbę i porównuj wyniki.'],safety:'Nie wykonuj długiego testu obciążeniowego, jeśli chłodzenie/zasilanie jest niepewne.'},
    'storage': {title:'Błędy dysku / ryzyko danych',steps:['Ustal ważność danych i czy istnieje sprawna kopia.','Zapisz model, objawy i komunikaty SMART bez nadmiernego obciążania.','Jeśli dysk klika lub znika, ogranicz dalsze zasilanie i testy.','Nie uruchamiaj napraw systemu plików na nośniku z objawami mechanicznymi.','Jeśli stan pozwala, wykonaj kontrolowane obrazowanie na oddzielny nośnik.','Weryfikuj pliki i zapisuj wynik odzysku.'],safety:'Nie zapisuj danych na źródłowym dysku i nie otwieraj HDD w zwykłym warsztacie.'}
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function checkCompatibility(input={}) {
    const issues=[];
    if (input.cpuSocket !== input.boardSocket) issues.push({level:'fail',text:`Gniazdo CPU (${input.cpuSocket}) nie zgadza się z gniazdem płyty (${input.boardSocket}).`});
    if (input.ramType !== input.boardRam) issues.push({level:'fail',text:`Typ RAM (${input.ramType}) nie zgadza się z pamięcią obsługiwaną przez płytę (${input.boardRam}).`});
    const boardRank={'Mini-ITX':1,'micro-ATX':2,'ATX':3,'E-ATX':4};
    if ((boardRank[input.caseForm]||0) < (boardRank[input.boardForm]||0)) issues.push({level:'fail',text:`Obudowa ${input.caseForm} może nie pomieścić płyty ${input.boardForm}.`});
    const required = Number(input.cpuW||0)+Number(input.gpuW||0)+150;
    if (Number(input.psuW||0) < required) issues.push({level:'warn',text:`Orientacyjny zapas mocy jest zbyt mały: zalecane co najmniej ${required} W według uproszczonej reguły CPU + GPU + 150 W.`});
    if (!issues.length) issues.push({level:'pass',text:'Podstawowe pola są zgodne według wybranych parametrów. Nadal sprawdź dokładne modele, BIOS, QVL, wymiary, złącza zasilania, chłodzenie i listę producenta.'});
    return {issues,requiredW:required,compatible:!issues.some(x=>x.level==='fail'),status:issues.some(x=>x.level==='fail')?'NIEZGODNOŚĆ':issues.some(x=>x.level==='warn')?'WYMAGA UWAGI':'PODSTAWOWA ZGODNOŚĆ'};
  }
  function buildDiagnosticPlan(symptom) { return PLANS[symptom] || null; }
  window.ACADEMY_FIX145_API = Object.freeze({hotfix:'FIX145',quiz:QUIZ.map(q=>({...q,o:[...q.o]})),buildSteps:BUILD_STEPS.map(x=>({...x})),checkCompatibility,buildDiagnosticPlan});
  const root=document.getElementById('view-academypro');
  if (!root) return;
  const STORE='academy-master-hub-fix145';
  const safeRead=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{return {};}};
  const safeWrite=value=>{try{localStorage.setItem(STORE,JSON.stringify(value));return true;}catch{return false;}};
  const state={...{path:{},portfolio:[],bestScore:0,attempts:0},...safeRead()};
  let quizIndex=0,quizScore=0,quizLocked=false;
  const $=id=>document.getElementById(id);
  function renderPath(){
    const checked=root.querySelectorAll('[data-a145-path]:checked').length,total=root.querySelectorAll('[data-a145-path]').length;
    $('a145PathDone').textContent=`${checked}/${total}`;
    $('a145PathBar').style.width=`${total?checked/total*100:0}%`;
    $('a145PathLabel').textContent=`Ukończono ${checked} z ${total} etapów ścieżki.`;
    root.querySelectorAll('[data-a145-path]').forEach(input=>input.checked=Boolean(state.path?.[input.dataset.a145Path]));
    const count=root.querySelectorAll('[data-a145-path]:checked').length;
    $('a145PathDone').textContent=`${count}/${total}`;$('a145PathBar').style.width=`${total?count/total*100:0}%`;$('a145PathLabel').textContent=`Ukończono ${count} z ${total} etapów ścieżki.`;
  }
  function renderBuild(){
    const done = state.build && typeof state.build === 'object' ? state.build : {};
    const count = BUILD_STEPS.filter(step=>Boolean(done[step.id])).length;
    $('a145BuildDone').textContent=`${count}/${BUILD_STEPS.length}`;
    $('a145BuildBar').style.width=`${count/BUILD_STEPS.length*100}%`;
    $('a145BuildSteps').innerHTML=BUILD_STEPS.map((step,index)=>`<article class="a145-build-step ${done[step.id]?'is-done':''}"><label><input type="checkbox" data-a145-build="${esc(step.id)}" ${done[step.id]?'checked':''}><span class="a145-build-index">${String(index+1).padStart(2,'0')}</span><b>${esc(step.title)}</b></label><p>${esc(step.desc)}</p><small><strong>Bezpieczeństwo:</strong> ${esc(step.safety)}</small></article>`).join('');
  }
  function renderPortfolio(){
    const entries=Array.isArray(state.portfolio)?state.portfolio:[];
    $('a145PortfolioCount').textContent=String(entries.length);
    $('a145PortfolioList').innerHTML=entries.length?entries.slice().reverse().map(item=>`<article class="a145-portfolio-item"><b>${esc(item.title)}</b><small>${esc(item.date)} · ${esc(item.model||'Model niepodany')}</small><p><strong>Objaw:</strong> ${esc(item.symptom)}</p><p><strong>Testy:</strong> ${esc(item.tests||'Nie wpisano')}</p><p><strong>Wniosek:</strong> ${esc(item.result||'Nie wpisano')}</p></article>`).join(''):'<div class="a145-result">Portfolio jest puste. Dodaj pierwszy przypadek z ćwiczenia lub symulacji.</div>';
  }
  function renderQuiz(){
    const node=$('a145QuizRoot');
    if (quizIndex>=QUIZ.length) {
      const passed=quizScore>=4;
      state.attempts=Number(state.attempts||0)+1;state.bestScore=Math.max(Number(state.bestScore||0),quizScore);state.lastScore=quizScore;state.lastDate=new Date().toISOString();safeWrite(state);
      node.innerHTML=`<div class="a145-quiz-top"><span>WYNIK TESTU</span><span>${quizScore}/5</span></div><h3>${passed?'Gratulacje — zaliczono test.':'Test niezaliczony — spróbuj ponownie.'}</h3><p>${passed?'Uzyskano co najmniej 4 poprawne odpowiedzi. Możesz wydrukować edukacyjne potwierdzenie ukończenia testu.':'Do zaliczenia potrzebne są 4 poprawne odpowiedzi. Przejrzyj wyjaśnienia i wykonaj kolejną próbę.'}</p><div class="a145-quiz-actions"><button type="button" class="a145-btn primary" data-a145-action="restart-quiz">Powtórz test</button>${passed?'<button type="button" class="a145-btn" data-a145-action="show-certificate">Przygotuj certyfikat edukacyjny</button>':''}</div><small class="a145-muted">Liczba podejść: ${state.attempts} · Najlepszy wynik: ${state.bestScore}/5</small>`;
      if (passed) { $('a145Certificate').hidden=false; $('a145CertificateScore').textContent=`Wynik: ${quizScore}/5`; $('a145CertificateDate').textContent=`Data: ${new Date().toLocaleDateString('pl-PL')} · ID: NPA145-${Date.now().toString(36).toUpperCase()}`; }
      return;
    }
    const item=QUIZ[quizIndex];
    node.innerHTML=`<div class="a145-quiz-top"><span>PYTANIE ${quizIndex+1} / ${QUIZ.length}</span><span>WYNIK BIEŻĄCY: ${quizScore}</span></div><h3>${esc(item.q)}</h3><div class="a145-quiz-options">${item.o.map((option,i)=>`<button type="button" data-a145-answer="${i}" ${quizLocked?'disabled':''}>${String.fromCharCode(65+i)}. ${esc(option)}</button>`).join('')}</div><div class="a145-quiz-feedback" id="a145QuizFeedback">Wybierz jedną odpowiedź.</div><div class="a145-quiz-actions"><button type="button" class="a145-btn primary" id="a145NextQuestion" disabled>${quizIndex===QUIZ.length-1?'Zakończ test':'Następne pytanie'}</button></div>`;
  }
  function renderBuilderResult(input){
    const result=checkCompatibility(input);
    const body=result.issues.map(issue=>`<li class="${issue.level}">${esc(issue.text)}</li>`).join('');
    $('a145BuilderResult').innerHTML=`<h3>${esc(result.status)}</h3><p>Orientacyjny próg mocy zasilacza: <b>${result.requiredW} W</b>.</p><ul>${body}</ul><p>Wynik nie uwzględnia dokładnego modelu CPU/GPU, BIOS-u, QVL, wymiarów chłodzenia, złączy, limitów obudowy ani jakości zasilacza. Przed zakupem sprawdź specyfikacje producenta.</p>`;
  }
  function renderTriage(plan,device){
    if(!plan){$('a145TriageResult').textContent='Nie znaleziono planu dla tego objawu.';return;}
    $('a145TriageResult').innerHTML=`<h3>${esc(device)} · ${esc(plan.title)}</h3><ol>${plan.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="warn"><b>Bezpieczeństwo:</b> ${esc(plan.safety)}</p><p>Wynik to lista edukacyjnych kroków, nie rozpoznanie uszkodzonego elementu.</p>`;
  }
  renderPath();renderBuild();renderPortfolio();
  $('a145LessonTotal').textContent=String(window.ACADEMY_DATA?.courseLessons?.length||1083);
  root.addEventListener('change',event=>{
    const pathInput=event.target.closest('[data-a145-path]');
    if(pathInput){state.path=state.path||{};state.path[pathInput.dataset.a145Path]=pathInput.checked;safeWrite(state);renderPath();return;}
    const buildInput=event.target.closest('[data-a145-build]');
    if(buildInput){state.build=state.build||{};state.build[buildInput.dataset.a145Build]=buildInput.checked;safeWrite(state);renderBuild();}
  });
  $('a145ResetBuild')?.addEventListener('click',()=>{state.build={};safeWrite(state);renderBuild();});
  $('a145BuilderForm')?.addEventListener('submit',event=>{event.preventDefault();renderBuilderResult(Object.fromEntries(new FormData(event.currentTarget).entries()));});
  $('a145TriageForm')?.addEventListener('submit',event=>{event.preventDefault();const form=new FormData(event.currentTarget);renderTriage(buildDiagnosticPlan(form.get('symptom')),form.get('device'));});
  $('a145PortfolioForm')?.addEventListener('submit',event=>{
    event.preventDefault();const form=new FormData(event.currentTarget);const item={id:`NPA145-${Date.now().toString(36)}`,date:new Date().toLocaleString('pl-PL'),title:String(form.get('title')||'').trim(),model:String(form.get('model')||'').trim(),symptom:String(form.get('symptom')||'').trim(),tests:String(form.get('tests')||'').trim(),result:String(form.get('result')||'').trim()};
    if(!item.title||!item.symptom)return;state.portfolio=Array.isArray(state.portfolio)?state.portfolio:[];state.portfolio.push(item);state.portfolio=state.portfolio.slice(-100);safeWrite(state);event.currentTarget.reset();renderPortfolio();$('a145PortfolioStatus').textContent='Zapisano lokalnie.';
  });
  $('a145ExportPortfolio')?.addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({product:'NAUKA OD A DO Z',hotfix:'FIX145',exportedAt:new Date().toISOString(),entries:state.portfolio||[]},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`portfolio-nauka-od-a-do-z-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);$('a145PortfolioStatus').textContent='Rozpoczęto eksport JSON.';
  });
  $('a145CertificateInput')?.addEventListener('input',event=>{$('a145CertificateName').textContent=event.target.value.trim()||'Uczestnik Akademii';});
  $('a145PrintCertificate')?.addEventListener('click',()=>{document.body.classList.add('a145-printing');window.print();setTimeout(()=>document.body.classList.remove('a145-printing'),500);});
  root.addEventListener('click',event=>{
    const answer=event.target.closest('[data-a145-answer]');
    if(answer&&!quizLocked){
      const item=QUIZ[quizIndex],chosen=Number(answer.dataset.a145Answer),correct=chosen===item.a;quizLocked=true;if(correct)quizScore++;
      root.querySelectorAll('[data-a145-answer]').forEach(button=>{button.disabled=true;const ix=Number(button.dataset.a145Answer);if(ix===item.a)button.classList.add('correct');else if(ix===chosen)button.classList.add('wrong');});
      $('a145QuizFeedback').textContent=`${correct?'Poprawnie.':'Niepoprawnie.'} ${item.e}`;$('a145NextQuestion').disabled=false;
    }
    if(event.target.closest('#a145NextQuestion')){quizIndex++;quizLocked=false;renderQuiz();}
    const action=event.target.closest('[data-a145-action]')?.dataset.a145Action;
    if(action==='restart-quiz'){quizIndex=0;quizScore=0;quizLocked=false;$('a145Certificate').hidden=true;renderQuiz();}
    if(action==='show-certificate'){$('a145Certificate').hidden=false;$('a145Certificate').scrollIntoView({behavior:'smooth',block:'center'});}
  });
  renderQuiz();
})();
