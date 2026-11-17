import { dbRequired, getSession, json, nowIso, readJson, requireConsent, sameOrigin, text, rateLimit, hashedClientRateKey } from '../_lib.js';
import { createPlatformNotification } from '../_notifications.js';
const safeId = value => String(value || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);
const QUESTION_BANK = [
  {id:'pc-001',prompt:'Komputer nie przechodzi POST. Jaki jest bezpieczny pierwszy krok?',options:['Wymienić płytę główną','Sprawdzić zasilanie, przewody i sygnały diagnostyczne','Od razu aktualizować BIOS','Formatować dysk'],answer:1},
  {id:'pc-002',prompt:'Co oznacza SMART w diagnostyce dysku?',options:['Standard pomiaru temperatury CPU','System samokontroli i raportowania parametrów nośnika','Tryb oszczędzania energii','Protokół sieciowy'],answer:1},
  {id:'pc-003',prompt:'Przed pracą przy płycie głównej należy przede wszystkim:',options:['Pozostawić zasilacz pod napięciem','Odłączyć zasilanie i zastosować ochronę ESD','Dotknąć styków RAM','Uruchomić test obciążeniowy'],answer:1},
  {id:'pc-004',prompt:'WHEA w Podglądzie zdarzeń najczęściej wskazuje na:',options:['Błąd przeglądarki','Zgłoszony błąd sprzętowy lub platformy','Brak aktualizacji aplikacji','Uszkodzenie pliku obrazu'],answer:1},
  {id:'pc-005',prompt:'Co należy zrobić przed aktualizacją BIOS/UEFI?',options:['Przerwać zasilanie podczas zapisu','Zweryfikować dokładny model i rewizję płyty oraz oficjalny plik','Użyć dowolnego pliku podobnej płyty','Wyłączyć TPM bez potrzeby'],answer:1},
  {id:'pc-006',prompt:'Wysoka temperatura CPU przy niskim obciążeniu wymaga najpierw:',options:['Wymiany procesora bez pomiarów','Kontroli chłodzenia, mocowania, wentylatorów i odczytu czujników','Zmiany rozdzielczości monitora','Formatowania Windows'],answer:1},
  {id:'pc-007',prompt:'Co jest prawidłową metodą potwierdzenia uszkodzenia RAM?',options:['Jednorazowe spojrzenie na pasek użycia','Test pamięci i weryfikacja modułów/slotów według procedury','Sprawdzenie wyłącznie SMART SSD','Wymiana zasilacza'],answer:1},
  {id:'pc-008',prompt:'Przed naprawą partycji lub systemu plików należy:',options:['Zrobić kopię ważnych danych i ocenić stan nośnika','Zawsze uruchomić formatowanie','Usunąć wszystkie kopie','Wyłączyć logowanie zdarzeń'],answer:0},
  {id:'pc-009',prompt:'Brak obrazu z laptopa może wynikać z:',options:['Wyłącznie dysku SSD','Matrycy, taśmy, podświetlenia, GPU lub toru zasilania','Wyłącznie hasła użytkownika','Tylko ustawień języka'],answer:1},
  {id:'pc-010',prompt:'Co opisuje throttling termiczny?',options:['Automatyczne zwiększanie pojemności RAM','Ograniczenie wydajności po przekroczeniu warunków termicznych','Szyfrowanie dysku','Synchronizację czasu'],answer:1},
  {id:'pc-011',prompt:'Najbezpieczniejsze źródło sterownika to:',options:['Losowy agregator sterowników','Windows Update lub oficjalna strona producenta urządzenia','Załącznik z nieznanej wiadomości','Dowolny plik z forum'],answer:1},
  {id:'pc-012',prompt:'Co oznacza wynik „HealthStatus: Warning” dla nośnika?',options:['Na pewno pełną sprawność','Sygnał wymagający sprawdzenia szczegółów, kopii danych i diagnostyki','Gwarancję odzyskania danych','Informację o wersji BIOS'],answer:1},
  {id:'pc-013',prompt:'Jaki jest właściwy sposób sprawdzenia zasilacza?',options:['Oceniać tylko na podstawie jego wyglądu','Użyć odpowiedniej procedury i sprzętu pomiarowego przez osobę kompetentną','Zewrzeć przypadkowe piny','Otworzyć zasilacz pod napięciem'],answer:1},
  {id:'pc-014',prompt:'Po zalaniu laptopa najważniejsze jest:',options:['Włączyć urządzenie, aby sprawdzić czy działa','Odłączyć zasilanie, nie uruchamiać i przeprowadzić bezpieczną ocenę szkód','Podłączyć ładowarkę','Wykonać aktualizację BIOS'],answer:1},
  {id:'pc-015',prompt:'Co należy sprawdzić przed zakupem modułu RAM?',options:['Tylko kolor radiatora','Typ pamięci, obsługę płyty, pojemność, taktowanie i zgodność','Wyłącznie markę obudowy','Wersję przeglądarki'],answer:1},
  {id:'pc-016',prompt:'Błąd PCIe/WHEA powtarzający się pod obciążeniem może wymagać:',options:['Ignorowania komunikatu','Weryfikacji GPU, zasilania, slotu, temperatur i sterowników','Zmiany tapety','Odinstalowania edytora tekstu'],answer:1},
  {id:'pc-017',prompt:'Co jest ważne przy kopiowaniu danych klienta?',options:['Zachowanie poufności, zgody i kontrola miejsca docelowego','Kopiowanie na prywatny nośnik bez zgody','Przesyłanie do publicznej chmury','Zapisywanie haseł w raporcie'],answer:0},
  {id:'pc-018',prompt:'Jak prawidłowo traktować brak odczytu temperatury w raporcie?',options:['Uznać temperaturę za idealną','Oznaczyć jako brak danych i nie zgadywać wartości','Wpisać 40°C','Uznać urządzenie za uszkodzone'],answer:1},
  {id:'pc-019',prompt:'Co zrobić, gdy podejrzany plik pochodzi z nieznanego źródła?',options:['Uruchomić go na komputerze klienta','Nie uruchamiać; przeprowadzić kontrolę statyczną w izolowanym środowisku','Wyłączyć antywirusa','Zignorować pochodzenie'],answer:1},
  {id:'pc-020',prompt:'Kiedy można uznać naprawę za zakończoną?',options:['Po samym uruchomieniu systemu','Po wykonaniu testów potwierdzających objaw, stabilność i odbiór urządzenia','Po usunięciu ostrzeżenia z ekranu','Po wymianie dowolnej części'],answer:1},
  {id:'pc-021',prompt:'Po wymianie SSD NVMe dysk nie pojawia się w instalatorze Windows. Co sprawdzić najpierw?',options:['Formatować cały dysk', 'Tryb kontrolera, sterownik VMD/RAID, obsługę M.2 i poprawne osadzenie', 'Wymienić RAM', 'Wyłączyć Secure Boot bez diagnozy'],answer:1},
  {id:'pc-022',prompt:'Laptop ładuje się tylko pod określonym kątem wtyku USB-C. Co jest właściwą procedurą?',options:['Doginać wtyk metalowym narzędziem', 'Sprawdzić zasilacz, kabel, gniazdo i tor USB-C/PD pod lupą i pomiarami', 'Zwiększyć moc ładowarki', 'Zewrzeć linie CC'],answer:1},
  {id:'pc-023',prompt:'Po aktualizacji sterownika GPU występują czarne ekrany. Co zrobić?',options:['Usunąć wszystkie punkty przywracania', 'Zanotować wersję, uruchomić tryb awaryjny i wrócić do znanej poprawnej wersji sterownika', 'Podnieść napięcie GPU', 'Od razu flashować VBIOS'],answer:1},
  {id:'pc-024',prompt:'Co oznacza wzrost błędów CRC w SMART SATA?',options:['Zawsze zużycie komórek NAND', 'Często problem transmisji: kabel, złącze lub zakłócenia; sprawdź ponownie po wymianie przewodu', 'Uszkodzenie RAM na pewno', 'Brak partycji EFI'],answer:1},
  {id:'pc-025',prompt:'Komputer resetuje się pod obciążeniem GPU, bez BSOD. Jak postąpić?',options:['Uznać winę GPU bez pomiaru', 'Zweryfikować zasilacz, przewody PCIe, temperatury, zdarzenia i obciążenie osobno', 'Wyłączyć ochronę termiczną', 'Odłączyć uziemienie'],answer:1},
  {id:'pc-026',prompt:'Jaka jest bezpieczna kolejność przy podejrzeniu zalania płyty?',options:['Włączyć i sprawdzić obraz', 'Odłączyć wszystkie źródła zasilania i baterię, nie uruchamiać, udokumentować stan i ocenić korozję', 'Podłączyć USB', 'Wykonać update BIOS'],answer:1},
  {id:'pc-027',prompt:'Co sprawdza MemTest86 lub równoważny test pamięci?',options:['Szybkość Internetu', 'Wzorce odczytu/zapisu pamięci i błędy adresowania w testowanym zakresie', 'Kondycję baterii', 'Sprawność matrycy'],answer:1},
  {id:'pc-028',prompt:'Jaka informacja jest kluczowa przed doborem BIOS?',options:['Kolor płyty', 'Dokładny model i rewizja PCB oraz wersja/region firmware', 'Numer seryjny monitora', 'Wersja przeglądarki'],answer:1},
  {id:'pc-029',prompt:'Dysk HDD wydaje nietypowe odgłosy i znika z systemu. Co jest priorytetem?',options:['Powtarzać pełne skany powierzchni', 'Ograniczyć zasilanie i zapisy; ocenić możliwość bezpiecznego obrazu danych przez specjalistę', 'Uruchomić defragmentację', 'Zainstalować system ponownie'],answer:1},
  {id:'pc-030',prompt:'Co jest właściwe dla ESD podczas pracy z modułem RAM?',options:['Dotykać styków', 'Użyć ochrony ESD, rozładować ładunek i trzymać moduł za krawędzie', 'Odkładać na dywan', 'Pracować na zasilonej płycie'],answer:1},
  {id:'pc-031',prompt:'Laptop wyłącza się przy poruszeniu zawiasem. Jak zawęzić diagnozę?',options:['Wymienić SSD', 'Sprawdzić przewody matrycy, zawiasy, taśmy i ślady zwarć w torze zasilania', 'Zwiększyć jasność', 'Resetować router'],answer:1},
  {id:'pc-032',prompt:'Po zmianie RAM komputer wykonuje wielokrotne treningi pamięci. Co sprawdzić?',options:['Natychmiast odłączyć TPM', 'Zgodność modułów, obsługiwane profile, sloty i zakończenie treningu zgodnie z instrukcją płyty', 'Format dysku', 'Zmienić adres IP'],answer:1},
  {id:'pc-033',prompt:'Co oznacza „Thermal Throttling” w raporcie?',options:['Wzrost pojemności pamięci', 'Ograniczenie taktowania/wydajności z powodu warunków termicznych', 'Błąd DNS', 'Uszkodzenie pliku systemowego'],answer:1},
  {id:'pc-034',prompt:'Jak sprawdzić integralność plików Windows bez ich naprawiania?',options:['sfc /scannow zawsze naprawia', 'sfc /verifyonly wykonuje kontrolę bez trybu naprawy', 'format C:', 'diskpart clean'],answer:1},
  {id:'pc-035',prompt:'Co oznacza brak odczytu temperatury GPU w narzędziu?',options:['GPU ma 0°C', 'Czujnik/sterownik nie udostępnia danych; należy oznaczyć brak pomiaru', 'GPU jest idealnie chłodne', 'Karta jest na pewno uszkodzona'],answer:1},
  {id:'pc-036',prompt:'Przed klonowaniem systemowego SSD należy przede wszystkim:',options:['Wyłączyć kopie danych', 'Sprawdzić stan źródła, wykonać kopię i potwierdzić układ partycji oraz tryb rozruchu', 'Usunąć partycję EFI', 'Wyłączyć szyfrowanie bez klucza'],answer:1},
  {id:'pc-037',prompt:'Jaki jest sens testu SMART short?',options:['Pełna gwarancja braku awarii', 'Szybki wewnętrzny test nośnika; nie zastępuje kopii ani długiej diagnostyki', 'Test pamięci RAM', 'Test napięcia zasilacza'],answer:1},
  {id:'pc-038',prompt:'Komputer działa po odłączeniu jednego modułu RAM. Co dalej?',options:['Wymienić płytę bez testów', 'Testować moduły i sloty oddzielnie, zmieniając jedną zmienną naraz', 'Podnieść napięcia na maksimum', 'Zaktualizować BIOS losowym plikiem'],answer:1},
  {id:'pc-039',prompt:'Co jest prawidłowe przy sprawdzaniu zasilacza ATX?',options:['Otworzyć zasilacz i dotknąć kondensatorów', 'Stosować odpowiedni tester lub pomiary zgodne z procedurą; nie otwierać obudowy PSU', 'Zewrzeć dowolne przewody', 'Mierzyć rezystancję na zasilonym PSU'],answer:1},
  {id:'pc-040',prompt:'W logu występuje Kernel-Power 41. Co można z tego wywnioskować?',options:['Na pewno uszkodzony zasilacz', 'System wykrył nieoczekiwane zamknięcie; trzeba ustalić przyczynę z innych danych', 'Na pewno wadliwy dysk', 'To informacja o aktualizacji'],answer:1},
  {id:'pc-041',prompt:'Do czego służy punkt kontrolny maszyny wirtualnej?',options:['Zastępuje kopię offline', 'Pozwala wrócić do zapisanego stanu VM; nie jest samodzielną kopią zapasową danych', 'Chroni host przed każdym exploitem', 'Szyfruje pliki'],answer:1},
  {id:'pc-042',prompt:'Jak bezpiecznie analizować nieznany plik?',options:['Uruchomić na koncie administratora', 'Najpierw zebrać hash i metadane, a wykonanie rozważać wyłącznie w izolowanym środowisku', 'Wyłączyć Defender', 'Wysłać wszystkim znajomym'],answer:1},
  {id:'pc-043',prompt:'Co należy zrobić, gdy SMART pokazuje rosnącą liczbę sektorów niestabilnych?',options:['Uruchomić benchmark zapisujący dane', 'Zabezpieczyć kopię danych i ocenić nośnik; nie zakładać, że naprawa logiczna przywróci trwałość', 'Zignorować', 'Defragmentować SSD'],answer:1},
  {id:'pc-044',prompt:'Dlaczego po wymianie płyty należy sprawdzić TPM i BitLocker?',options:['Nie mają związku z rozruchem', 'Zmiana sprzętu może uruchomić odzyskiwanie BitLocker; wymagany jest właściwy klucz odzyskiwania', 'Aby zwiększyć VRAM', 'Aby zmienić DNS'],answer:1},
  {id:'pc-045',prompt:'Co zrobić przy artefaktach obrazu tylko pod obciążeniem 3D?',options:['Od razu rozebrać GPU pod napięciem', 'Sprawdzić temperatury, zasilanie, sterownik, pamięć GPU i powtarzalność w kontrolowanych testach', 'Zmienić hasło Windows', 'Wyłączyć wentylatory'],answer:1},
  {id:'pc-046',prompt:'Co powinien zawierać rzetelny raport naprawy?',options:['Tylko słowo „naprawiono”', 'Objaw, model/revizję, wykonane testy, wyniki, części, ograniczenia i zgodę klienta', 'Hasła klienta', 'Klucz BitLocker w jawnym tekście'],answer:1},
  {id:'pc-047',prompt:'Po aktualizacji Windows zniknęło urządzenie PCIe. Co jest właściwe?',options:['Użyć sterownika z losowej strony', 'Sprawdzić Menedżer urządzeń, identyfikator sprzętu, BIOS ustawienia slotu i oficjalny sterownik', 'Wyłączyć Secure Boot bez sprawdzenia', 'Formatować wszystkie dyski'],answer:1},
  {id:'pc-048',prompt:'Co oznacza negatywny wynik jednego testu obciążeniowego?',options:['Udowodniona sprawność całego komputera', 'Brak wykrytego błędu w warunkach tego testu; inne usterki nadal są możliwe', 'Gwarancja braku problemów', 'Potwierdzenie stanu baterii'],answer:1},
  {id:'pc-049',prompt:'Dlaczego należy odnotować temperaturę otoczenia podczas testu?',options:['Nie ma znaczenia', 'Ułatwia interpretację temperatur i porównanie pomiarów w podobnych warunkach', 'Zmienia wynik SMART', 'Jest wymagana do logowania'],answer:1},
  {id:'pc-050',prompt:'Jak prawidłowo zamknąć zlecenie diagnostyczne?',options:['Usunąć wszystkie logi', 'Zweryfikować zgłoszony objaw po naprawie, zachować uzgodniony raport i przekazać urządzenie po odbiorze', 'Zostawić test w tle', 'Wyczyścić konto klienta'],answer:1}
];
async function randomQuestions(env){
  const bank=QUESTION_BANK.slice();
  try{
    const result=await env.DB.prepare("SELECT question_id,category,difficulty,prompt,options_json,correct_index FROM academy_exam_question_bank WHERE status='active' ORDER BY updated_at DESC LIMIT 300").all();
    const ids=new Set(bank.map(item=>item.id));
    for(const row of result.results||[]){let options=[];try{options=JSON.parse(row.options_json||'[]')}catch{}if(!row.question_id||ids.has(row.question_id)||!Array.isArray(options)||options.length<2||options.length>6||!Number.isInteger(row.correct_index)||row.correct_index<0||row.correct_index>=options.length)continue;bank.push({id:row.question_id,prompt:text(row.prompt,500),options:options.map(value=>text(value,240)),answer:row.correct_index,category:text(row.category,80),difficulty:text(row.difficulty,24)});ids.add(row.question_id);}
  }catch(error){if(!/no such table/i.test(String(error?.message||error)))throw error;}
  if(bank.length<10)throw new Error('EXAM_BANK_TOO_SMALL');
  const random=new Uint32Array(bank.length);crypto.getRandomValues(random);
  return bank.map((q,i)=>({q,rank:random[i]})).sort((a,b)=>a.rank-b.rank).slice(0,10).map(x=>x.q);
}
function newCertificateId(){const bytes=crypto.getRandomValues(new Uint8Array(6));const suffix=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();return `NAU-${new Date().getUTCFullYear()}-${suffix}`;}
async function buildCertificate(env,id){return env.DB.prepare('SELECT certificate_id AS id,student_name AS studentName,course_title AS courseTitle,score,created_at AS issuedAt,product_version AS productVersion FROM academy_certificates WHERE certificate_id=? LIMIT 1').bind(id).first();}
export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const id = safeId(new URL(request.url).searchParams.get('id'));
  if (!/^NAU-[0-9]{4}-[A-F0-9]{12}$/.test(id)) return json({ error: 'CERTIFICATE_ID_INVALID', message: 'Nieprawidłowy numer certyfikatu.' }, 400);
  let cert=null;try{cert=await buildCertificate(env,id);}catch(error){if(!/no such table/i.test(String(error?.message||error)))throw error;}
  if(cert){const verificationUrl=new URL(`/api/certificates?id=${encodeURIComponent(id)}`,request.url).toString();return json({ok:true,certificate:{...cert,verificationUrl,isServerGraded:true,recordStatus:'RECORD_FOUND',disclaimer:'Potwierdzenie wyniku egzaminu ocenionego po stronie serwera. Nie jest to państwowe świadectwo, akredytacja ani zewnętrznie nadana kwalifikacja zawodowa.'}});}
  const row = await env.DB.prepare("SELECT title,details_json,created_at FROM academy_events WHERE event_type='academy_certificate_issued' AND resource_id=? LIMIT 1").bind(id).first();
  if (!row) return json({ error: 'CERTIFICATE_NOT_FOUND', message: 'Nie znaleziono wpisu certyfikatu w rejestrze Akademii.' }, 404);
  let details = {}; try { details = JSON.parse(row.details_json || '{}'); } catch {}
  const verificationUrl=new URL(`/api/certificates?id=${encodeURIComponent(id)}`,request.url).toString();
  return json({ ok: true, certificate: { id, verificationUrl, studentName: text(details.studentName, 60), courseTitle: text(row.title, 140), score: Number(details.score), issuedAt: row.created_at, isServerGraded:false, productVersion: '6.8.0', recordStatus: 'LEGACY_RECORD_FOUND', disclaimer: 'To starszy wpis platformowy oparty na wyniku przesłanym przez przeglądarkę; nie jest potwierdzeniem wyniku serwerowo ocenionego egzaminu. Nie jest to państwowe świadectwo ani akredytacja.' } });
}
export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  const user = await getSession(request, env);
  if (!requireConsent(user)) return json({ error: 'SESSION_AND_CONSENT_REQUIRED', message: 'Zaloguj się i zaakceptuj synchronizację, aby rozpocząć egzamin online.' }, 401);
  const rateKey = await hashedClientRateKey(request, `academy-exam:${user.id}`);
  if (!await rateLimit(env, rateKey, 10, 3600)) return json({ error: 'EXAM_RATE_LIMIT' }, 429);
  let body; try { body = await readJson(request, 12000); } catch (error) { return json({ error: 'INVALID_JSON', message: error.message }, 400); }
  const action=text(body.action,16);
  if(action==='start'){
    const courseTitle=text(body.courseTitle,140),studentName=text(body.studentName||user.nickname,60);
    if(!courseTitle||!studentName)return json({error:'EXAM_FIELDS_REQUIRED',message:'Podaj nazwę kursu i imię lub pseudonim.'},400);
    let questions;try{questions=await randomQuestions(env);}catch(error){return json({error:'SECURE_RANDOM_UNAVAILABLE',message:String(error?.message||'Nie udało się wylosować pytań.')},503);}
    const attemptId=crypto.randomUUID(),startedAt=nowIso(),expiresAt=new Date(Date.now()+20*60*1000).toISOString();
    const payload=JSON.stringify(questions.map(({id,answer})=>({id,answer})));
    await env.DB.prepare('INSERT INTO academy_exam_attempts(attempt_id,user_id,course_title,student_name,question_payload,status,started_at,expires_at) VALUES(?,?,?,?,?,?,?,?)')
      .bind(attemptId,user.id,courseTitle,studentName,payload,'started',startedAt,expiresAt).run();
    return json({ok:true,attemptId,courseTitle,studentName,startedAt,expiresAt,durationSeconds:1200,passPercent:70,questions:questions.map(({id,prompt,options})=>({id,prompt,options}))});
  }
  if(action==='submit'){
    const attemptId=text(body.attemptId,80),answers=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?body.answers:{};
    if(!attemptId)return json({error:'EXAM_ATTEMPT_REQUIRED'},400);
    const attempt=await env.DB.prepare('SELECT * FROM academy_exam_attempts WHERE attempt_id=? AND user_id=? LIMIT 1').bind(attemptId,user.id).first();
    if(!attempt)return json({error:'EXAM_ATTEMPT_NOT_FOUND'},404);
    if(attempt.status==='submitted'){if(attempt.passed&&attempt.certificate_id){await env.DB.prepare('INSERT OR IGNORE INTO academy_certificates(certificate_id,attempt_id,user_id,student_name,course_title,score,created_at,product_version) VALUES(?,?,?,?,?,?,?,?)').bind(attempt.certificate_id,attemptId,user.id,attempt.student_name,attempt.course_title,attempt.score,attempt.submitted_at||nowIso(),'6.8.0').run();const cert=await buildCertificate(env,attempt.certificate_id);return json({ok:true,score:attempt.score,passed:true,alreadySubmitted:true,certificate:cert,message:'To podejście zostało już ocenione; zwracam ten sam wpis certyfikatu.'});}return json({ok:true,score:attempt.score,passed:false,alreadySubmitted:true,message:'To podejście zostało już ocenione i nie uzyskało progu zaliczenia.'});}
    if(attempt.status==='started'&&Date.now()>Date.parse(attempt.expires_at)){await env.DB.prepare("UPDATE academy_exam_attempts SET status='expired' WHERE attempt_id=? AND status='started'").bind(attemptId).run();return json({error:'EXAM_EXPIRED',message:'Czas egzaminu minął. Rozpocznij nowe podejście.'},410);}
    let questions=[];try{questions=JSON.parse(attempt.question_payload||'[]');}catch{}
    if(!Array.isArray(questions)||questions.length!==10)return json({error:'EXAM_DATA_INVALID'},503);
    let correct=0;for(const question of questions){const selected=answers[question.id];if(Number.isInteger(selected)&&selected===question.answer)correct++;}
    const score=Math.round(correct/questions.length*100),passed=score>=70,submittedAt=nowIso(),certificateId=passed?newCertificateId():null;
    let newlySubmitted=false;
    if(attempt.status==='started'){
      const update=await env.DB.prepare("UPDATE academy_exam_attempts SET status='submitted',submitted_at=?,score=?,passed=?,certificate_id=? WHERE attempt_id=? AND user_id=? AND status='started'")
        .bind(submittedAt,score,passed?1:0,certificateId,attemptId,user.id).run();
      newlySubmitted=Number(update.meta?.changes??update.changes??0)===1;
    }
    const fresh=await env.DB.prepare('SELECT status,score,passed,certificate_id,submitted_at FROM academy_exam_attempts WHERE attempt_id=? AND user_id=? LIMIT 1').bind(attemptId,user.id).first();
    if(!fresh||fresh.status!=='submitted')return json({error:'EXAM_ALREADY_CONSUMED',message:'To podejście zostało już wykorzystane.'},409);
    if(newlySubmitted)await createPlatformNotification(env,user.id,{type:'exam',title:fresh.passed?'Egzamin zaliczony':'Egzamin zakończony',body:`Wynik egzaminu „${text(attempt.course_title,120)}”: ${Number(fresh.score)||0}/100.${fresh.passed?' Certyfikat został zapisany w rejestrze.':''}`,url:'/?view=account'}).catch(()=>null);
    if(fresh.passed&&fresh.certificate_id){
      await env.DB.prepare('INSERT OR IGNORE INTO academy_certificates(certificate_id,attempt_id,user_id,student_name,course_title,score,created_at,product_version) VALUES(?,?,?,?,?,?,?,?)')
        .bind(fresh.certificate_id,attemptId,user.id,attempt.student_name,attempt.course_title,fresh.score,fresh.submitted_at||submittedAt,'6.8.0').run();
      const cert=await buildCertificate(env,fresh.certificate_id);
      return json({ok:true,score:fresh.score,correct,questionCount:questions.length,passed:true,certificate:cert,message:'Egzamin oceniono po stronie serwera. Rekord ukończenia został zarejestrowany.'});
    }
    return json({ok:true,score:fresh.score,correct,questionCount:questions.length,passed:false,message:'Egzamin zakończony. Wynik poniżej 70%; możesz przygotować się i rozpocząć nowe podejście.'});
  }
  return json({error:'EXAM_ACTION_INVALID',message:'Dozwolone akcje: start i submit. Wyniku egzaminu nie można przesłać samodzielnie.'},400);
}
