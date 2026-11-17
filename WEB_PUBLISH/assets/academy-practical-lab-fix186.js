/* FIX186 — PRAWDZIWE LABORATORIUM SERWISOWE PRO
 * Lokalny import i analiza eksportów Windows, AI przez istniejący /api/chat,
 * adnotacje zdjęć PCB, kontrola SHA-256, egzamin praktyczny.
 * Nie uruchamia poleceń, nie steruje sprzętem i nie zapisuje firmware.
 */
(function (global) {
  'use strict';
  const FIX = 186;
  const STORE = 'nauka-od-a-do-z-fix186-practical-lab-v1';
  const MAX_IMPORT = 25 * 1024 * 1024;
  const MAX_IMAGE = 15 * 1024 * 1024;
  const MAX_FIRMWARE = 250 * 1024 * 1024;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
  const text = (v, max = 1200) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').slice(0, max);
  const pick = (o, keys, fallback = '') => {
    for (const k of keys) if (own(o, k) && o[k] != null && String(o[k]).trim() !== '') return o[k];
    return fallback;
  };
  function parseCsv(source) {
    const rows = []; let row = [], field = '', quoted = false;
    const input = String(source || '').replace(/^\uFEFF/, '');
    const firstLine = input.split(/\r?\n/, 1)[0] || '';
    const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (quoted) {
        if (ch === '"' && input[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === delim) { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); if (row.some(x => String(x).trim())) rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') field += ch;
    }
    row.push(field); if (row.some(x => String(x).trim())) rows.push(row);
    if (!rows.length) return [];
    const headers = rows.shift().map((x, i) => String(x || `column_${i + 1}`).trim().replace(/^"|"$/g, ''));
    return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] == null ? '' : values[i]])));
  }
  function xmlEventsRegex(source) {
    const chunks = String(source || '').match(/<Event\b[\s\S]*?<\/Event>/gi) || [];
    return chunks.map(chunk => {
      const attr = (tag, name) => {
        const re = new RegExp(`<${tag}\\b[^>]*\\b${name}=["']([^"']*)["']`, 'i');
        return (chunk.match(re) || [])[1] || '';
      };
      const inner = tag => { const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'); return (chunk.match(re) || [])[1] || ''; };
      const provider = attr('Provider', 'Name');
      const id = attr('EventID', '');
      const eventId = (inner('EventID').match(/\d+/) || [])[0] || id;
      const time = attr('TimeCreated', 'SystemTime');
      const level = inner('Level').replace(/<[^>]+>/g, '').trim();
      const data = [...chunk.matchAll(/<Data\b([^>]*)>([\s\S]*?)<\/Data>/gi)].map(m => `${(m[1].match(/Name=["']([^"']+)/i) || [])[1] || 'Data'}=${m[2].replace(/<[^>]+>/g, ' ').trim()}`);
      const message = [...data, inner('Message').replace(/<[^>]+>/g, ' ').trim()].filter(Boolean).join(' | ') || chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return { provider, id: eventId, timeCreated: time, level, message, xml: chunk.slice(0, 10000) };
    });
  }
  function parseXml(source) {
    const input = String(source || '');
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(input, 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('Plik XML jest niepoprawny.');
      const events = [...doc.getElementsByTagName('*')].filter(n => n.localName === 'Event');
      if (events.length) return events.map(node => {
        const first = name => [...node.getElementsByTagName('*')].find(n => n.localName === name);
        const providerNode = first('Provider'), idNode = first('EventID'), timeNode = first('TimeCreated'), levelNode = first('Level');
        const provider = providerNode?.getAttribute('Name') || '';
        const id = idNode?.textContent || '';
        const timeCreated = timeNode?.getAttribute('SystemTime') || '';
        const level = levelNode?.textContent || '';
        const dataNodes = [...node.getElementsByTagName('*')].filter(n => n.localName === 'Data');
        const message = dataNodes.map(n => `${n.getAttribute('Name') || 'Data'}=${n.textContent || ''}`).join(' | ');
        return { provider, id, timeCreated, level, message, xml: node.outerHTML.slice(0, 10000) };
      });
    }
    return xmlEventsRegex(input);
  }
  function parseJsonRows(value) {
    const rows = Array.isArray(value) ? value : Array.isArray(value?.events) ? value.events : Array.isArray(value?.items) ? value.items : Array.isArray(value?.records) ? value.records : null;
    if (!rows) throw new Error('JSON musi zawierać tablicę events, items, records albo być tablicą zdarzeń.');
    return rows.map(r => ({
      provider: text(pick(r, ['provider', 'ProviderName', 'Provider', 'source', 'Source'], '')),
      id: text(pick(r, ['id', 'Id', 'EventID', 'EventId'], '')),
      timeCreated: text(pick(r, ['timeCreated', 'TimeCreated', 'timestamp', 'time', 'Time'], '')),
      level: text(pick(r, ['level', 'Level', 'LevelDisplayName', 'severity'], '')),
      message: text(pick(r, ['message', 'Message', 'description', 'Description', 'payload'], '')),
      xml: text(pick(r, ['xml', 'Xml', 'eventXml'], ''), 10000),
      machine: text(pick(r, ['machine', 'MachineName', 'computer'], ''))
    }));
  }
  function parseTextRows(source) {
    return String(source || '').split(/\r?\n/)
      .map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
      .filter(item => item.raw)
      .slice(0, 10000)
      .map(item => {
        const line = item.raw;
        const id = (line.match(/(?:Event\s*ID|EventID|Id)\s*[:=]\s*(\d{1,6})/i) || [])[1] || '';
        const provider = (line.match(/(?:Provider|Źródło|Source)\s*[:=]\s*([^|;,]+)/i) || [])[1] || '';
        return { provider: provider.trim(), id, timeCreated: (line.match(/\b\d{4}-\d\d-\d\d[ T][^| ]+/) || [])[0] || '', level: (line.match(/\b(Critical|Error|Warning|Informational|Krytyczny|Błąd|Ostrzeżenie)\b/i) || [])[1] || '', message: line, line: item.line };
      });
  }
  function classifyEvent(event) {
    const hay = `${event.provider || ''} ${event.message || ''} ${event.id || ''}`.toLowerCase();
    const pcie = /whea|aer|pcie|pci express|root port|corrected hardware/.test(hay);
    const storage = /storport|stornvme|storahci|disk|ntfs|storage|io timeout|i\/o timeout|reset to device/.test(hay);
    const gpu = /display|nvlddmkm|amdkmdag|igfx|graphics/.test(hay);
    const level = String(event.level || '').toLowerCase();
    const numericLevel = Number(event.level);
    const isError = ['1','2','critical','error','krytyczny','błąd'].includes(level) || [1,2].includes(numericLevel);
    const isWarning = ['3','warning','ostrzeżenie'].includes(level) || numericLevel === 3;
    return { ...event, category: pcie ? 'PCIe/WHEA' : storage ? 'Storage' : gpu ? 'GPU/Display' : 'Inne', severity: isError ? 'Błąd/krytyczny' : isWarning ? 'Ostrzeżenie' : 'Informacja' };
  }
  function analyzeEvents(events) {
    const normalized = (events || []).slice(0, 10000).map(classifyEvent);
    const byCategory = {}, byProvider = {}, bySeverity = {};
    for (const e of normalized) {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      if (e.provider) byProvider[e.provider] = (byProvider[e.provider] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    }
    const high = normalized.filter(e => e.severity !== 'Informacja' || e.category !== 'Inne');
    return { total: normalized.length, categories: byCategory, providers: byProvider, severities: bySeverity, events: normalized, highlights: high.slice(0, 100) };
  }
  function normalizeImportedFile(name, source) {
    const ext = (String(name).split('.').pop() || '').toLowerCase();
    if (ext === 'etl') throw new Error('Plik ETL jest binarnym śladem Windows. Najpierw uruchom dołączony kolektor FIX186: WPR zapisze ETL, a tracerpt wyeksportuje XML do importu.');
    if (ext === 'evtx') throw new Error('Plik EVTX należy wyeksportować przez kolektor FIX186 do JSON lub XML. Bezpośredni parser EVTX nie jest częścią przeglądarki.');
    if (ext === 'xml' || /^\s*<\?xml|^\s*<Events?/i.test(source)) return parseXml(source);
    if (ext === 'json' || /^\s*[\[{]/.test(source)) return parseJsonRows(JSON.parse(source));
    if (ext === 'csv') return parseCsv(source).map(r => ({
      provider: text(pick(r, ['Provider Name','ProviderName','Provider','Source','provider'], '')),
      id: text(pick(r, ['Event Name','EventID','Event Id','Id','id'], '')),
      timeCreated: text(pick(r, ['Time Stamp','TimeCreated','Timestamp','Time','time'], '')),
      level: text(pick(r, ['Level','LevelDisplayName','Severity','level'], '')),
      message: text(pick(r, ['Event Message','Message','Description','message','Event'], Object.values(r).join(' | ')))
    }));
    return parseTextRows(source);
  }
  function safeGeneratedCase(raw) {
    const s = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let value;
    try { value = JSON.parse(s); }
    catch { const a=s.indexOf('{'), b=s.lastIndexOf('}'); if (a < 0 || b <= a) throw new Error('Gemini nie zwrócił poprawnego JSON. Odpowiedź pokazano jako tekst.'); value=JSON.parse(s.slice(a,b+1)); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Odpowiedź AI nie jest pojedynczym obiektem przypadku.');
    const list = v => Array.isArray(v) ? v.slice(0,8).map(x=>text(typeof x==='string'?x:(x?.text||JSON.stringify(x)),700)) : [];
    const result = { title:text(value.title||value.tytul||'Nowy przypadek diagnostyczny AI',180), category:text(value.category||value.kategoria||'Diagnostyka komputerów',100), difficulty:text(value.difficulty||value.poziom||'Zaawansowany',60), symptom:text(value.symptom||value.objawy||value.description||'',1200), evidence:list(value.evidence||value.dowody), questions:list(value.questions||value.pytania), solution:list(value.solution||value.rozwiazanie||value.steps||value.kroki), caution:text(value.caution||value.ostroznosc||'Weryfikuj hipotezy pomiarami i dokumentacją właściwego modelu.',800), generatedAt:new Date().toISOString(), source:'Google Gemini — istniejący endpoint Akademii', scope:'komputery stacjonarne i laptopy' };
    const all = [result.title,result.category,result.symptom,...result.evidence,...result.questions,...result.solution,result.caution].join(' ');
    if (/\b(telefon|smartfon|smartphone|iphone|ipad|tablet|konsol\w*|playstation|xbox|nintendo)\b/i.test(all)) throw new Error('Odpowiedź AI wykracza poza zakres komputerów i laptopów. Wygeneruj przypadek ponownie.');
    return result;
  }
  const localCases = [
    {title:'Losowy restart po wybudzeniu',category:'Windows/Storage',symptom:'Laptop uruchamia się poprawnie po zimnym starcie, ale po wybudzeniu czasami znika NVMe i pojawiają się zdarzenia resetu kontrolera.',evidence:['Objaw występuje tylko po resume','W dzienniku są zdarzenia Storage i WHEA','SMART nie zgłasza oczywistych problemów'],questions:['Jak zabezpieczyć dane przed testami?','Jakie zdarzenia zestawić na jednej osi czasu?','Jak odróżnić problem sterownika od sprzętu?'],solution:['Najpierw wykonaj kopię/obraz ważnych danych i ogranicz zbędne zapisy.','Zbierz zdarzenia System: StorPort, stornvme, Disk i WHEA; zapisz wersje BIOS i sterownika.','Zmieniaj pojedynczą wspieraną zmienną, dokumentuj powtarzalność i nie wyciągaj wniosku z samego SMART.'],caution:'Nie wykonuj benchmarków zapisu na niestabilnym nośniku.'},
    {title:'WHEA PCIe pod obciążeniem',category:'PCIe/WHEA',symptom:'Pod obciążeniem GPU rośnie liczba zdarzeń WHEA dotyczących PCI Express, ale komputer nie zawsze traci obraz.',evidence:['WHEA pojawia się w podobnych przedziałach czasu','Karta działa z niższą szerokością łącza po dodaniu karty M.2','Brak jednoznacznego błędu w teście CPU'],questions:['Jak ustalić Root Port i BDF?','Jak sprawdzić współdzielenie linii?','Jak raportować zdarzenia correctable?'],solution:['Zapisz pełne XML zdarzeń WHEA i identyfikatory urządzeń.','Sprawdź instrukcję płyty, topologię slotów i obsadzenie M.2.','Porównaj Link Speed/Width i częstość zdarzeń podczas powtarzalnego obciążenia.'],caution:'Nie wyłączaj mechanizmów raportowania błędów tylko po to, by ukryć symptom.'},
    {title:'Aplikacja zawiesza się podczas zapisu',category:'Windows Storage',symptom:'Aplikacja przestaje odpowiadać przy zapisie dużych plików, a system rejestruje timeouty I/O.',evidence:['Zdarzenia StorPort/Storage','Wysokie opóźnienia w śladzie','Błąd nie występuje przy odczycie małych plików'],questions:['Co zebrać przed kolejnym testem?','Jak odróżnić problem stosu od problemu nośnika?','Kiedy przerwać test?'],solution:['Zabezpiecz ważne dane; nie uruchamiaj testów destrukcyjnych.','Zbierz StorDiag, zdarzenia System i ślad ETW.','Porównaj sterownik miniport, firmware i topologię kontrolera; przy nasilaniu błędów przerwij testy.'],caution:'Priorytetem jest ochrona danych, nie wynik benchmarku.'},
    {title:'Niepewne uszkodzenie laminatu',category:'PCB Failure Analysis',symptom:'Płyta ma okresową usterkę reagującą na zmianę temperatury; na zdjęciu makro widać ślad przy przelotce.',evidence:['Nie ma potwierdzonego zwarcia stałego','Objaw jest zależny od temperatury','Inspekcja optyczna nie pokazuje całej struktury warstw'],questions:['Jak dokumentować podejrzany obszar?','Jakie metody mogą potwierdzić hipotezę?','Kiedy potrzebna jest analiza niszcząca?'],solution:['Zapisz orientację PCB, oznaczenie, rewizję i zdjęcia przed ingerencją.','Rozważ mikroskopię, pomiary ciągłości oraz konsultację laboratorium materiałowego.','Microsection stosuj wyłącznie po zgodzie, bo niszczy próbkę.'],caution:'Nie wyginaj płyty i nie podgrzewaj jej bez kontrolowanej procedury.'},
    {title:'Pakiet UEFI odrzucony przez platformę',category:'Firmware Security',symptom:'Pakiet BIOS ma poprawny SHA-256 z pobranej strony, ale aktualizacja nie przechodzi kontroli zgodności.',evidence:['Model rodziny jest podobny, ale SKU jest inne','Pakiet zawiera katalog i kapsułę','ESRT pokazuje poprzednią próbę aktualizacji'],questions:['Co potwierdza hash?','Co potwierdza podpis pakietu Windows?','Kto weryfikuje podpis payloadu firmware?'],solution:['Porównaj hash z zaufanym manifestem OEM i zweryfikuj pochodzenie pliku.','Zweryfikuj katalog podpisu pakietu właściwą polityką Windows i zgodność CHID/SKU.','Podpis payloadu/kapsuły jest weryfikowany przez platformę firmware; użyj narzędzi OEM, nie wymuszaj update.'],caution:'Nie traktuj poprawnego SHA-256 jako dowodu autentyczności, jeżeli wartość skrótu pochodzi z niezaufanego źródła.'}
  ];
  const practicalCases = [
    {id:'etl-boot',title:'Spowolniony rozruch po aktualizacji sterownika',symptom:'Logowanie trwa dłużej po aktualizacji sterownika. Wymagany jest ślad WPR i dowód w WPA.',steps:[['Pierwszy krok',['Zapisz build, wersje sterownika i dokładny scenariusz reprodukcji','Odinstaluj kilka sterowników naraz','Wyczyść wszystkie logi'],0],['Drugi krok',['Zbierz ograniczony Boot trace WPR i przeanalizuj fazy w WPA','Uruchom benchmark GPU','Zwiększ plik stronicowania bez pomiaru'],0],['Trzeci krok',['Porównaj powtarzalne ślady przed/po i opisz czynniki zakłócające','Uznaj pierwszy długi wpis za przyczynę','Wgraj losowy sterownik'],0]],cause:'Koszt sterownika/usługi albo zmiana równoległa; wymaga korelacji śladu.'},
    {id:'whea-root',title:'WHEA PCIe – powtarzalne błędy correctable',symptom:'Zdarzenia WHEA występują pod obciążeniem, urządzenie pozostaje widoczne.',steps:[['Pierwszy krok',['Wyeksportuj XML WHEA i ustal Root Port/BDF','Wyłącz WHEA w BIOS','Wymień od razu GPU'],0],['Drugi krok',['Sprawdź topologię linii, obsadzenie slotów, Link Width i firmware','Zignoruj błędy jako kosmetyczne','Zresetuj system bez notatek'],0],['Trzeci krok',['Powtórz kontrolowany test i porównaj liczbę zdarzeń oraz objawy','Zrób losowy stress test bez monitorowania','Zmień kilka ustawień jednocześnie'],0]],cause:'Problem ścieżki PCIe, slotu, połączenia, zasilania lub platformy – wymaga dowodów.'},
    {id:'storage-reset',title:'StorPort timeout i reset urządzenia',symptom:'System zapisuje timeout i reset, aplikacja traci dostęp do pliku.',steps:[['Pierwszy krok',['Zabezpiecz dane i przerwij zbędne zapisy/benchmarki','Uruchom test zapisu losowego','Zastosuj Secure Erase'],0],['Drugi krok',['Zbierz StorDiag i zdarzenia Storage/WHEA z osią czasu','Oceniaj wyłącznie SMART','Zmień literę dysku'],0],['Trzeci krok',['Zweryfikuj kontroler, miniport, firmware, zasilanie i powtarzalność','Wgraj nieznany firmware','Wyłącz raportowanie błędów'],0]],cause:'Warstwa Storage, kontroler, sterownik, firmware, połączenie lub nośnik; do rozdzielenia dowodami.'},
    {id:'pcb-photo',title:'Zdjęcie PCB – podejrzenie uszkodzenia przelotki',symptom:'Widoczny jest ślad w okolicy przelotki; objaw pojawia się po cyklu termicznym.',steps:[['Pierwszy krok',['Zrób zdjęcie orientacyjne i makro, dodaj skalę i oznaczenie PCB','Zeskrob soldermaskę od razu','Zegnij laminat'],0],['Drugi krok',['Wykonaj inspekcję optyczną i zaplanuj pomiary bez naprężania płyty','Załóż, że to zimny lut','Podgrzej obszar bez kontroli temperatury'],0],['Trzeci krok',['Zleć/uzgodnij analizę przekroju tylko przy zgodzie na badanie niszczące','Wykonaj microsection bez zgody klienta','Zamaskuj ślad na zdjęciu'],0]],cause:'Możliwy barrel crack, delaminacja lub inna wada PCB; zdjęcie samo nie wystarcza do pewnej diagnozy.'},
    {id:'firmware-package',title:'Firmware – hash zgodny, pakiet odrzucany',symptom:'SHA-256 jest zgodny z informacją OEM, ale aktualizator odrzuca pakiet.',steps:[['Pierwszy krok',['Zweryfikuj źródło, SKU/CHID i manifest producenta','Zmień rozszerzenie pliku','Użyj BIOS dla podobnego modelu'],0],['Drugi krok',['Sprawdź podpis katalogu pakietu i jego politykę walidacji','Traktuj hash jako podpis','Usuń plik .cat'],0],['Trzeci krok',['Ustal, czy payload jest weryfikowany przez platformę i skonsultuj procedurę OEM','Wyłącz Secure Boot','Modyfikuj kapsułę'],0]],cause:'Niezgodność platformy lub podpisu pakietu/payloadu; hash sam nie potwierdza autentyczności.'}
  ];
  function initialState() { return { version:1, aiCases:[], importSummary:null, examHistory:[], firmwareHistory:[], pcbSessions:[], lastReport:null, updatedAt:new Date().toISOString() }; }
  function readState(storage) {
    try { const raw=storage?.getItem(STORE); if(!raw)return initialState(); const v=JSON.parse(raw); if(!v||typeof v!=='object'||Array.isArray(v))return initialState(); return { ...initialState(), ...v, aiCases:Array.isArray(v.aiCases)?v.aiCases.slice(0,20):[], examHistory:Array.isArray(v.examHistory)?v.examHistory.slice(0,30):[], firmwareHistory:Array.isArray(v.firmwareHistory)?v.firmwareHistory.slice(0,30):[], pcbSessions:Array.isArray(v.pcbSessions)?v.pcbSessions.slice(0,30):[] }; } catch { return initialState(); }
  }
  function saveState(storage, state) { try { state.updatedAt=new Date().toISOString(); storage?.setItem(STORE,JSON.stringify(state)); return true; } catch { return false; } }
  function download(name, content, mime='application/json') {
    const blob=new Blob([content],{type:mime}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function apiSseText(response) {
    return response.text().then(raw => {
      let answer='';
      for (const block of raw.split(/\r?\n\r?\n/)) {
        const event=(block.match(/^event:\s*(.+)$/m)||[])[1]||'';
        const data=(block.match(/^data:\s*(.+)$/m)||[])[1]||'';
        if(!data)continue;
        try { const payload=JSON.parse(data); if(event==='delta'&&typeof payload.text==='string')answer+=payload.text; else if(event==='error')throw new Error(payload.message||'Błąd AI'); } catch(e) { if(e instanceof Error && e.message!=='Unexpected end of JSON input') throw e; }
      }
      if(!answer.trim()) throw new Error('Gemini nie zwróciło tekstu. Sprawdź konfigurację lub limit usługi.');
      return answer;
    });
  }
  function el(doc, tag, props={}, content='') { const n=doc.createElement(tag); for(const [k,v] of Object.entries(props)) { if(k==='class')n.className=v; else if(k==='text')n.textContent=v; else n.setAttribute(k,v); } if(content!==undefined)n.textContent=content; return n; }
  function boot(doc=global.document, win=global) {
    const root=doc?.getElementById('a186PracticalLab'); if(!root || root.dataset.fix186Ready==='1') return false;
    root.dataset.fix186Ready='1';
    const $=id=>doc.getElementById(id); let storage=null; try { storage=win.localStorage; } catch { storage=null; }
    const state=readState(storage); const persist=()=>saveState(storage,state);
    const status=(id,msg,isError=false)=>{const n=$(id);if(n){n.textContent=msg;n.classList.toggle('a186-error',!!isError);}};
    const appendSafe=(parent,tag,cls,content)=>{const n=el(doc,tag,{class:cls},content);parent.append(n);return n;};
    // AI fault generator — reuses the protected same-origin Gemini API. No key in browser.
    $('a186AiGenerate')?.addEventListener('click', async ()=>{
      const btn=$('a186AiGenerate'), category=$('a186AiCategory')?.value||'Diagnostyka ogólna', level=$('a186AiLevel')?.value||'Ekspert', context=text($('a186AiContext')?.value||'',900);
      if(btn)btn.disabled=true; status('a186AiStatus','Łączę z istniejącym nauczycielem Gemini Akademii…');
      const prompt=`Przygotuj jeden nowy, realistyczny przypadek szkoleniowy wyłącznie dla komputera stacjonarnego lub laptopa. Specjalizacja: ${category}. Poziom: ${level}. Kontekst objawu bez danych klienta: ${context||'Wymyśl realistyczny scenariusz serwisowy.'}. Zwróć wyłącznie poprawny JSON bez Markdown i bez komentarzy w schemacie: {"title":"...","category":"...","difficulty":"...","symptom":"...","evidence":["..."],"questions":["..."],"solution":["..."],"caution":"..."}. Wymagania: 3-5 dowodów, 3 pytania diagnostyczne, 3-5 kroków bezpiecznej procedury, rozdziel fakty od hipotez, nie wymyślaj wartości pomiarów, nie zalecaj ryzykownego zapisu firmware ani pracy pod napięciem dla osoby bez kwalifikacji. Nie uwzględniaj telefonów, tabletów ani konsol. Nie umieszczaj danych osobowych ani sekretów.`;
      try {
        const response=await win.fetch('/api/chat',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'text/event-stream'},body:JSON.stringify({messages:[{role:'user',content:prompt}]})});
        if(!response.ok){let payload={};try{payload=await response.json();}catch{}throw new Error(payload.message||payload.error||`HTTP ${response.status}`);}
        const raw=await apiSseText(response); let item;
        try{item=safeGeneratedCase(raw);}catch(error){if(/\b(telefon|smartfon|smartphone|iphone|ipad|tablet|konsol\w*|playstation|xbox|nintendo)\b/i.test(raw))throw new Error('Odpowiedź AI wykracza poza zakres komputerów i laptopów.');item={title:'Odpowiedź AI — do weryfikacji',category,difficulty, symptom:raw.slice(0,4000),evidence:[],questions:[],solution:[],caution:'Odpowiedź nie została rozpoznana jako strukturalny JSON; zweryfikuj każdy punkt przed użyciem.',generatedAt:new Date().toISOString(),source:'Google Gemini — tekst do ręcznej weryfikacji',scope:'komputery stacjonarne i laptopy'};}
        state.aiCases.unshift(item);state.aiCases=state.aiCases.slice(0,20);persist();renderAiCase(item);status('a186AiStatus','Wygenerowano nowy przypadek. Materiał jest szkicem edukacyjnym — zweryfikuj procedurę i dokumentację modelu.');
      } catch(e) { status('a186AiStatus',`Generator AI niedostępny: ${text(e.message,220)}. Możesz skorzystać z lokalnych, przygotowanych scenariuszy.`,true); }
      finally { if(btn)btn.disabled=false; }
    });
    $('a186AiLocal')?.addEventListener('click',()=>{const item=localCases[Math.floor(Math.random()*localCases.length)];renderAiCase({...item,generatedAt:new Date().toISOString(),source:'Lokalny generator scenariuszy — bez AI'});status('a186AiStatus','Utworzono lokalny przypadek treningowy. To nie jest odpowiedź modelu AI.');});
    function renderAiCase(item) {
      const host=$('a186AiResult'); if(!host)return;host.replaceChildren();
      appendSafe(host,'h4','',item.title); appendSafe(host,'p','a186-muted',`${item.category||''} · ${item.difficulty||''} · ${item.source||''}`);appendSafe(host,'p','',item.symptom||'');
      for(const [label,list] of [['Dowody',item.evidence],['Pytania diagnostyczne',item.questions],['Proponowana procedura',item.solution]]) if(Array.isArray(list)&&list.length){appendSafe(host,'b','',label);const ul=el(doc,'ul');list.forEach(x=>appendSafe(ul,'li','',x));host.append(ul);}
      appendSafe(host,'p','a186-caution',item.caution||'');
      const b=el(doc,'button',{type:'button',class:'a168-btn',text:'Pobierz przypadek JSON'});b.addEventListener('click',()=>download('Przypadek_AI_FIX186.json',JSON.stringify(item,null,2)));host.append(b);
    }
    // Import and analyze local exports; raw ETL/EVTX is converted with included Windows collector.
    let lastAnalysis=null;
    $('a186ImportFile')?.addEventListener('change',async event=>{
      const file=event.target.files?.[0]; if(!file)return;
      if(file.size>MAX_IMPORT){status('a186ImportStatus','Plik przekracza limit 25 MB. Podziel eksport w narzędziu źródłowym.',true);return;}
      status('a186ImportStatus',`Odczyt lokalny: ${file.name}…`);
      try {
        const contents=await file.text(); const events=normalizeImportedFile(file.name,contents); if(!events.length)throw new Error('Nie znaleziono rozpoznawalnych rekordów. Sprawdź format eksportu.');
        lastAnalysis=analyzeEvents(events); state.importSummary={fileName:file.name,size:file.size,importedAt:new Date().toISOString(),total:lastAnalysis.total,categories:lastAnalysis.categories,severities:lastAnalysis.severities,providers:lastAnalysis.providers}; persist();renderImport(lastAnalysis,file.name);status('a186ImportStatus',`Zaimportowano ${lastAnalysis.total} rekordów lokalnie. Plik nie został wysłany do serwera.`);
      } catch(e){lastAnalysis=null;status('a186ImportStatus',text(e.message,260),true);} finally {event.target.value='';}
    });
    function renderImport(result,fileName) {
      const host=$('a186ImportResult');if(!host)return;host.replaceChildren();appendSafe(host,'h4','',`Analiza: ${fileName}`);
      const metrics=el(doc,'div',{class:'a186-metrics'});[[result.total,'rekordów'],[result.categories['PCIe/WHEA']||0,'PCIe/WHEA'],[result.categories.Storage||0,'Storage'],[(result.severities['Błąd/krytyczny']||0),'Błędy/krytyczne']].forEach(([v,l])=>{const box=el(doc,'div');appendSafe(box,'b','',String(v));appendSafe(box,'span','',l);metrics.append(box);});host.append(metrics);
      const cat=el(doc,'div',{class:'a186-chip-row'});Object.entries(result.categories).forEach(([k,v])=>appendSafe(cat,'span','a186-chip',`${k}: ${v}`));host.append(cat);
      appendSafe(host,'p','a186-muted','Wynik jest heurystycznym indeksem zdarzeń. Nie stanowi samodzielnej diagnozy awarii. Sprawdź pełny XML, dostawcę, Event ID, czas i dokumentację producenta.');
      const table=el(doc,'div',{class:'a186-event-list'});result.highlights.slice(0,30).forEach(e=>{const row=el(doc,'article',{class:'a186-event-row'});appendSafe(row,'b','',`${e.category} · ${e.provider||'Nieznany dostawca'} · ID ${e.id||'—'}`);appendSafe(row,'small','',`${e.timeCreated||''} · ${e.severity}`);appendSafe(row,'p','',e.message||'(bez komunikatu)');table.append(row);});host.append(table);
      const exp=el(doc,'button',{type:'button',class:'a168-btn',text:'Eksportuj analizę JSON'});exp.addEventListener('click',()=>download('Analiza_zdarzen_FIX186.json',JSON.stringify({fix:186,fileName,analyzedAt:new Date().toISOString(),...result},null,2)));host.append(exp);
      const csv=el(doc,'button',{type:'button',class:'a168-btn',text:'Eksportuj listę zdarzeń CSV'});csv.addEventListener('click',()=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const lines=['Time,Provider,EventId,Category,Severity,Message',...result.events.map(e=>[e.timeCreated,e.provider,e.id,e.category,e.severity,e.message].map(q).join(','))];download('Zdarzenia_FIX186.csv',lines.join('\r\n'),'text/csv;charset=utf-8');});host.append(csv);
    }
    // Firmware: browser computes SHA-256 only; Windows helper separately verifies Authenticode/catalog policy.
    $('a186FirmwareVerify')?.addEventListener('click',async()=>{
      const f=$('a186FirmwareFile')?.files?.[0],expected=String($('a186FirmwareExpected')?.value||'').replace(/\s/g,'').toLowerCase();
      if(!f){status('a186FirmwareStatus','Wybierz plik firmware lub pakiet OEM.',true);return;}if(f.size>MAX_FIRMWARE){status('a186FirmwareStatus','Plik przekracza limit 250 MB dla analizy w przeglądarce.',true);return;}if(!win.crypto?.subtle){status('a186FirmwareStatus','Przeglądarka nie udostępnia Web Crypto. Użyj dołączonego narzędzia PowerShell.',true);return;}
      try{status('a186FirmwareStatus','Obliczam SHA-256 lokalnie…');const digest=await win.crypto.subtle.digest('SHA-256',await f.arrayBuffer());const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');const matches=expected?hash===expected:null;const report={fix:186,fileName:f.name,size:f.size,sha256:hash,expectedSha256:expected||null,hashMatch:matches,authenticode:'Nie sprawdzono w przeglądarce',uefiPayloadSignature:'Weryfikacja podpisu payloadu wymaga platformy/narzędzia OEM',generatedAt:new Date().toISOString()};state.firmwareHistory.unshift(report);state.firmwareHistory=state.firmwareHistory.slice(0,30);persist();$('a186FirmwareResult').textContent=`SHA-256: ${hash}\nRozmiar: ${f.size} bajtów\n${matches===null?'Nie podano zaufanego skrótu OEM.':matches?'Skrót zgodny z podaną wartością.':'UWAGA: skrót NIE zgadza się z podaną wartością.'}\nPodpis Authenticode/katalogu: użyj narzędzia PowerShell FIX186.\nPodpis kapsuły/payloadu UEFI: nie jest weryfikowany przez ten kalkulator.`;const b=$('a186FirmwareDownload');if(b){b.disabled=false;b.onclick=()=>download('Weryfikacja_firmware_FIX186.json',JSON.stringify(report,null,2));}status('a186FirmwareStatus','Analiza SHA-256 zakończona. Poprawny hash potwierdza zgodność z podanym skrótem, nie pochodzenie pliku.');}catch(e){status('a186FirmwareStatus',`Nie udało się obliczyć skrótu: ${text(e.message,180)}`,true);}
    });
    // PCB image markup: human annotation, not automatic defect recognition.
    let pcbImage=null,pcbUrl=null,pcbMarks=[],pcbAiObservations=[],pcbAiReport=null;
    const canvas=$('a186PcbCanvas'),ctx=canvas?.getContext?.('2d');
    function drawPcb(){if(!canvas||!ctx||!pcbImage)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(pcbImage,0,0,canvas.width,canvas.height);pcbAiObservations.forEach((m,i)=>{const r=m.region||{},x=Math.max(0,Math.min(1000,Number(r.x)||0))*canvas.width/1000,y=Math.max(0,Math.min(1000,Number(r.y)||0))*canvas.height/1000,w=Math.max(0,Math.min(1000-x,Number(r.width)||0))*canvas.width/1000,h=Math.max(0,Math.min(1000-y,Number(r.height)||0))*canvas.height/1000;ctx.strokeStyle='#ff657a';ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#ff657a';ctx.font='bold 14px sans-serif';ctx.fillText(`AI ${i+1}`,x+4,Math.max(14,y-5));});pcbMarks.forEach((m,i)=>{const x=m.x*canvas.width,y=m.y*canvas.height;ctx.beginPath();ctx.arc(x,y,Math.max(7,Math.min(canvas.width,canvas.height)*.012),0,Math.PI*2);ctx.strokeStyle='#ffbc4a';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#ffbc4a';ctx.font='bold 16px sans-serif';ctx.fillText(String(i+1),x+10,y-10);});}
    function renderPcbAiReport(report){pcbAiReport=report;pcbAiObservations=Array.isArray(report.observations)?report.observations:[];drawPcb();const host=$('a186PcbAiResult');if(!host)return;host.replaceChildren();appendSafe(host,'h4','',report.summary||'Analiza widocznych cech PCB');if(!pcbAiObservations.length)appendSafe(host,'p','a186-muted','AI nie wskazało obszarów do oznaczenia. Brak obserwacji nie potwierdza sprawności płytki.');pcbAiObservations.forEach((o,i)=>{const box=el(doc,'div',{class:'a186-ai-observation'});appendSafe(box,'b','',`${i+1}. ${o.label||'Obszar do sprawdzenia'} · pewność modelu: ${o.confidence||'low'}`);appendSafe(box,'p','',o.visibleEvidence||'Brak opisu widocznej cechy.');appendSafe(box,'p','a186-muted',`Obszar: x=${o.region?.x??0}, y=${o.region?.y??0}, szer.=${o.region?.width??0}, wys.=${o.region?.height??0} (skala 0–1000). Weryfikacja: ${o.verification||'Oględziny i pomiary.'}`);host.append(box);});if(Array.isArray(report.notVisible)&&report.notVisible.length){appendSafe(host,'b','','Czego nie można ocenić ze zdjęcia');const ul=el(doc,'ul');report.notVisible.forEach(x=>appendSafe(ul,'li','',x));host.append(ul);}if(Array.isArray(report.nextSteps)&&report.nextSteps.length){appendSafe(host,'b','','Zalecane kolejne kontrole');const ul=el(doc,'ul');report.nextSteps.forEach(x=>appendSafe(ul,'li','',x));host.append(ul);}appendSafe(host,'p','a186-caution',report.safety||'Zdjęcie nie potwierdza usterki elektrycznej.');}
    $('a186PcbFile')?.addEventListener('change',event=>{const f=event.target.files?.[0];if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>MAX_IMAGE){status('a186PcbStatus','Wybierz JPG, PNG lub WebP do 15 MB.',true);return;}pcbAiObservations=[];pcbAiReport=null;const aiButton=$('a186PcbAiAnalyze');if(aiButton)aiButton.disabled=false;const aiConsent=$('a186PcbAiConsent');if(aiConsent)aiConsent.checked=false;const aiResult=$('a186PcbAiResult');if(aiResult)aiResult.textContent='Nowe zdjęcie wczytane. Analiza AI wymaga osobnej zgody i kliknięcia przycisku.';if(pcbUrl)URL.revokeObjectURL(pcbUrl);pcbUrl=URL.createObjectURL(f);pcbImage=new Image();pcbImage.onload=()=>{const scale=Math.min(1,1800/Math.max(pcbImage.width,pcbImage.height));canvas.width=Math.max(1,Math.round(pcbImage.width*scale));canvas.height=Math.max(1,Math.round(pcbImage.height*scale));pcbMarks=[];drawPcb();status('a186PcbStatus',`Wczytano obraz ${pcbImage.width}×${pcbImage.height}. Kliknij podejrzany obszar, aby dodać własne oznaczenie.`);};pcbImage.onerror=()=>status('a186PcbStatus','Nie można odczytać obrazu.',true);pcbImage.src=pcbUrl;});
    $('a186PcbAiConsent')?.addEventListener('change',event=>{const button=$('a186PcbAiAnalyze');if(button)button.disabled=!event.target.checked||!pcbImage;});
    function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('Nie udało się przygotować obrazu do wysłania.'));reader.readAsDataURL(blob);});}
    async function makePcbAiImage(){if(!pcbImage)throw new Error('Najpierw wczytaj zdjęcie PCB.');let width=pcbImage.width,height=pcbImage.height;const maxEdge=1600;if(Math.max(width,height)>maxEdge){const f=maxEdge/Math.max(width,height);width=Math.round(width*f);height=Math.round(height*f);}for(let attempt=0;attempt<5;attempt++){const c=doc.createElement('canvas');c.width=width;c.height=height;const cctx=c.getContext('2d');if(!cctx)throw new Error('Przeglądarka nie udostępnia Canvas 2D.');cctx.fillStyle='#ffffff';cctx.fillRect(0,0,width,height);cctx.drawImage(pcbImage,0,0,width,height);const quality=[.86,.78,.70,.62,.55][attempt];const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',quality));if(!blob)throw new Error('Nie udało się skompresować zdjęcia.');const dataUrl=await blobToDataUrl(blob);const base64=dataUrl.split(',',2)[1]||'';if(base64.length<=6_500_000)return {mimeType:'image/jpeg',imageData:base64,width,height,size:blob.size};width=Math.max(640,Math.round(width*.82));height=Math.max(480,Math.round(height*.82));}throw new Error('Zdjęcie pozostaje zbyt duże po kompresji. Zrób mniejsze zdjęcie lub przytnij obraz.');}
    $('a186PcbAiAnalyze')?.addEventListener('click',async()=>{const consent=$('a186PcbAiConsent')?.checked===true,button=$('a186PcbAiAnalyze');if(!consent){status('a186PcbAiStatus','Zaznacz zgodę na wysłanie zdjęcia do Google Gemini.',true);return;}if(!pcbImage){status('a186PcbAiStatus','Najpierw wczytaj zdjęcie PCB.',true);return;}if(button)button.disabled=true;try{status('a186PcbAiStatus','Przygotowuję zmniejszony obraz i wysyłam go do Google Gemini…');const image=await makePcbAiImage();const response=await win.fetch('/api/academy/fix186/pcb-analysis',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({consent:true,mimeType:image.mimeType,imageData:image.imageData,context:text($('a186PcbNote')?.value||'',300)})});let payload={};try{payload=await response.json();}catch{}if(!response.ok||payload.ok!==true||!payload.report)throw new Error(payload.message||payload.error||`HTTP ${response.status}`);renderPcbAiReport(payload.report);state.pcbSessions.unshift({fix:186,kind:'ai-pcb-visual-inspection',imageWidth:pcbImage.width,imageHeight:pcbImage.height,observationCount:payload.report.observations?.length||0,summary:text(payload.report.summary,700),createdAt:new Date().toISOString(),imageStored:false});state.pcbSessions=state.pcbSessions.slice(0,30);persist();status('a186PcbAiStatus','Analiza zakończona. To obserwacje wizualne AI, nie diagnoza elektryczna. Zweryfikuj je pod mikroskopem i pomiarami.');}catch(e){status('a186PcbAiStatus',`Analiza obrazu niedostępna: ${text(e.message,220)}`,true);}finally{if(button)button.disabled=!($('a186PcbAiConsent')?.checked===true&&!!pcbImage);}});
    canvas?.addEventListener('click',event=>{if(!pcbImage)return;const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;const kind=$('a186PcbKind')?.value||'Obszar do sprawdzenia',note=text($('a186PcbNote')?.value||'',300);pcbMarks.push({x,y,kind,note,addedAt:new Date().toISOString()});drawPcb();status('a186PcbStatus',`Dodano oznaczenie ${pcbMarks.length}: ${kind}. To adnotacja technika, nie automatyczne rozpoznanie wady.`);});
    $('a186PcbClear')?.addEventListener('click',()=>{pcbMarks=[];pcbAiObservations=[];pcbAiReport=null;drawPcb();status('a186PcbStatus','Usunięto oznaczenia z bieżącej sesji.');});
    $('a186PcbExport')?.addEventListener('click',()=>{if(!pcbImage||(!pcbMarks.length&&!pcbAiObservations.length)){status('a186PcbStatus','Wczytaj zdjęcie i dodaj oznaczenie ręczne lub wykonaj analizę AI.',true);return;}const record={fix:186,kind:'pcb-image-visual-review',imageName:$('a186PcbFile')?.files?.[0]?.name||'',imageWidth:pcbImage.width,imageHeight:pcbImage.height,markers:pcbMarks,aiObservations:pcbAiObservations,aiSummary:pcbAiReport?.summary||null,aiProvider:pcbAiReport?'Google Gemini':'none',createdAt:new Date().toISOString(),automaticElectricalDiagnosis:false};canvas.toBlob(blob=>{if(blob){const url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='PCB_analiza_FIX186.png';doc.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}download('PCB_analiza_FIX186.json',JSON.stringify(record,null,2));state.pcbSessions.unshift({...record,imageName:record.imageName});state.pcbSessions=state.pcbSessions.slice(0,30);persist();},'image/png');});
    // Practical final exam: sequence + root cause + evidence quality, not a multiple-choice-only quiz.
    const examSelect=$('a186ExamScenario');function renderExamScenario(){const sc=practicalCases.find(x=>x.id===examSelect?.value)||practicalCases[0];const host=$('a186PracticalExam');if(!host)return;host.replaceChildren();appendSafe(host,'h4','',sc.title);appendSafe(host,'p','',sc.symptom);sc.steps.forEach((step,i)=>{const lab=el(doc,'label',{class:'a186-exam-field'});lab.textContent=step[0];const sel=el(doc,'select',{id:`a186ExamStep${i}`});sel.append(el(doc,'option',{value:'-1',text:'Wybierz działanie'}));step[1].forEach((choice,j)=>sel.append(el(doc,'option',{value:String(j),text:choice})));lab.append(sel);host.append(lab);});
      const cause=el(doc,'label',{class:'a186-exam-field'});cause.textContent='Najbardziej uzasadniona hipoteza';const cs=el(doc,'select',{id:'a186ExamCause'});cs.append(el(doc,'option',{value:'-1',text:'Wybierz hipotezę'}));[sc.cause,'Brak danych — potrzebna dalsza diagnostyka','Pewna awaria systemu Windows niezależna od sprzętu'].forEach((x,j)=>cs.append(el(doc,'option',{value:String(j),text:x})));cause.append(cs);host.append(cause);
      const report=el(doc,'label',{class:'a186-exam-field'});report.textContent='Raport technika: objaw, dowody, decyzje, wynik i ograniczenia';report.append(el(doc,'textarea',{id:'a186ExamReport',rows:'5',maxlength:'2500',placeholder:'Opisz własnymi słowami tok diagnozy i dowody…'}));host.append(report);appendSafe(host,'p','a186-muted','Wynik ocenia kolejność bezpiecznych kroków, hipotezę i kompletność raportu. To egzamin edukacyjny, nie formalna kwalifikacja.');const b=el(doc,'button',{type:'button',class:'a168-btn primary',text:'Oceń egzamin praktyczny'});b.addEventListener('click',()=>{let score=0,details=[];sc.steps.forEach((st,i)=>{const ok=Number($(`a186ExamStep${i}`)?.value)===st[2];if(ok)score++;details.push(`${ok?'PASS':'DO POPRAWY'}: ${st[0]}`);});const causeOk=Number($('a186ExamCause')?.value)===0;if(causeOk)score++;details.push(`${causeOk?'PASS':'DO POPRAWY'}: hipoteza`);const body=text($('a186ExamReport')?.value||'',2500);const complete=body.length>=120&&/objaw|symptom/i.test(body)&&/dowod|log|pomiar|test/i.test(body)&&/wynik|wniosek|hipotez/i.test(body);if(complete)score++;details.push(`${complete?'PASS':'DO POPRAWY'}: raport zawiera objaw, dowód i wniosek`);const pct=Math.round(score/5*100),passed=pct>=80;const result={scenario:sc.id,title:sc.title,score,total:5,percent:pct,passed,details,reportLength:body.length,at:new Date().toISOString()};state.examHistory.unshift(result);state.examHistory=state.examHistory.slice(0,30);persist();const out=$('a186ExamResult');out.replaceChildren();appendSafe(out,'b','',`Wynik praktyczny: ${score}/5 (${pct}%). ${passed?'ZALICZONO':'NIEZALICZONO'}`);details.forEach(d=>appendSafe(out,'p','',d));appendSafe(out,'p','a186-muted','Zapisano lokalnie w historii FIX186.');});host.append(b);}
    examSelect?.addEventListener('change',renderExamScenario);$('a186ExamRandom')?.addEventListener('click',()=>{if(examSelect)examSelect.value=practicalCases[Math.floor(Math.random()*practicalCases.length)].id;renderExamScenario();});
    if(examSelect){examSelect.replaceChildren();practicalCases.forEach(x=>examSelect.append(el(doc,'option',{value:x.id,text:x.title})));renderExamScenario();}
    // Summary export, no raw ETL/EVTX or customer records saved in storage.
    $('a186Export')?.addEventListener('click',()=>download('FIX186_Laboratorium_Raport.json',JSON.stringify({fix:186,exportedAt:new Date().toISOString(),state,limits:{rawETLParsedInBrowser:false,rawEVTXParsedInBrowser:false,aiUsesExistingGeminiApi:true,pcbAutomaticRecognition:false,firmwareCapsuleSignatureVerifiedByBrowser:false}},null,2)));
    status('a186Status',storage ? 'FIX186 gotowy. Import, adnotacje i raporty działają lokalnie; Gemini używa istniejącego API Akademii.' : 'FIX186 gotowy, ale przeglądarka blokuje localStorage. Eksportuj raporty, aby zachować postępy.');
    return true;
  }
  global.ACADEMY_FIX186_TOOLS={parseCsv,parseXml,parseJsonRows,parseTextRows,normalizeImportedFile,classifyEvent,analyzeEvents,safeGeneratedCase,readState,saveState,localCases,practicalCases,boot};
  function start(){boot(global.document,global);}
  if(global.document){if(global.document.readyState==='loading')global.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null));
