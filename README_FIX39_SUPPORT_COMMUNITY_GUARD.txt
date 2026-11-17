NAUKA OD A DO Z 6.8.0 — FIX39
NAPRAWA WALIDACJI CENTRUM SPOŁECZNOŚCI NA STAŁYM ADRESIE
============================================================

CO POKAZAŁ LOG FIX38
Cloudflare potwierdził deployment i stały adres zwrócił HTTP 200 z buildem:
6.8.0-social-login-fix38-runtime-photo-guard-20261104.
Jednocześnie API społeczności, CSS, JS i Service Worker zwracały HTTP 200.
Watcher mimo tego ustawiał remoteSupportCommunityValid=false oraz
newPlatformBrand=false.

RZECZYWISTA PRZYCZYNA
Kolumna w D1 nazywa się last_seen_at (snake_case). Endpoint
/api/support/updates.js mapuje ją świadomie na publiczne pole JSON lastSeenAt
(camelCase). Frontend support-community-fix36.js prawidłowo czyta lastSeenAt.
Watcher błędnie szukał SQL-owej nazwy last_seen_at wewnątrz skryptu JS
przeglądarki. Ta nazwa nie występuje w bundlu klienta, więc walidator odrzucał
prawidłową odpowiedź i blokował potwierdzenie wdrożenia.

CO ZMIENIA FIX39
1. Dodaje skrypt scripts/support-community-guard-fix39.js, który waliduje
   rzeczywisty JSON GET /api/support/updates: items, authenticated, enabled,
   lastSeenAt oraz nieujemny całkowity unreadCount.
2. Watcher pobiera i parsuje odpowiedź publicznego endpointu /api/support/updates.
   Pole lastSeenAt jest sprawdzane w JSON i w skrypcie klienta.
3. OneClick sprawdza osobno mapowanie po stronie API: SQL last_seen_at oraz
   publiczny DTO lastSeenAt.
4. Rozdziela status marki platformy od statusu centrum społeczności. Błąd
   społeczności nie będzie już fałszywie raportowany jako brak nowej marki.
5. Bramka wdrożenia nadal wymaga niezależnie poprawnej marki, sekcji wsparcia,
   centrum społeczności, CSS/JS, API i cache PWA. Nie wyłączono żadnej kontroli.
6. Dodaje testy kontraktu DTO i wydania FIX39. Test integracyjny sprawdza
   odpowiedź API dla użytkownika anonimowego i zalogowanego.
7. Historyczne polecenia WYKONAJ_TESTY_FIX37/FIX38 i CHECK_KONTA_FIX37/FIX38
   przekierowują do najnowszych skryptów FIX39. Starsze skróty testowe również
   prowadzą do aktualnego zestawu.

INSTALACJA NA WINDOWS
1. Zachowaj kopię folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj pełne archiwum FIX39 do tego folderu, zachowując strukturę i
   nadpisując aktualizowane pliki.
3. Uruchom WYKONAJ_TESTY_FIX39.cmd.
4. Po pomyślnych testach uruchom URUCHOM_AKADEMIE.cmd.
5. W logu oczekuj remoteSupportUpdatesContractValid=true,
   remoteSupportCommunityValid=true, supportCommunityFeatureValid=true,
   newPlatformBrand=true, a na końcu PUBLICZNA STRONA POTWIERDZONA.

NIE RÓB
- Nie twórz nowego projektu Cloudflare Pages.
- Nie twórz nowej bazy D1 i nie zmieniaj bindingu.
- Nie usuwaj ręcznie starych katalogów ani migracji.
- Nie zmieniaj sekretów OpenAI/OAuth.

BAZA I PUBLIKACJA
FIX39 nie dodaje migracji D1 i nie zmienia schematu bazy. W tym przygotowaniu
nie wykonywano zapytań do produkcyjnej bazy, deployu ani zmian sekretów.
W logu FIX38 kopia D1 została wykonana, migracji nie było, a Cloudflare
potwierdził deployment FIX38. FIX39 jest poprawionym pakietem lokalnym;
wdrożenie FIX39 nastąpi dopiero po uruchomieniu procesu na komputerze użytkownika.

TESTY
61/61 testów .js/.mjs PASS.
Lokalny ONECLICK verifyWeb() PASS — bez Cloudflare, D1 i migracji.
175 JS/MJS/CJS — 0 błędów składni.
40 arkuszy CSS — 0 błędów strukturalnych.
704 unikalne ID HTML; 132 lokalne odwołania; 0 brakujących zasobów.
Porównanie FIX38 -> FIX39: 0 plików usuniętych; 6 nowych plików projektu/testów.
Środowisko przygotowawcze: Node.js v22.16.0. W logu użytkownika: Node.js v24.19.0.
