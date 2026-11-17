NAUKA OD A DO Z 6.8.0 — FIX115
POPRAWKA ZGODNOŚCI ZDJĘĆ I UKŁADU SPECJALIZACJI

CEL
Naprawić problem widoczny na zrzutach: flowchart wyświetlany jako zdjęcie przy kafelku kursów oraz nieograniczone/rozciągnięte obszary zdjęć w sekcji „Specjalizacje serwisowe PRO”.

CO ZMIENIONO
1. Nowy runtime: WEB_PUBLISH/assets/photo-catalog-fix115.js
   - odrzuca diagramy, flowcharty, schematy, infografiki, screenshoty i ilustracje wektorowe jako fotografie;
   - wymaga kilku zgodnych sygnałów dla zdjęć edukacyjnych: edukacja + ludzie + komputer/elektronika;
   - ponownie ocenia stare przypisania i sprawdza zgodność z konkretnym kafelkiem;
   - zwalnia błędny przydział przed wyborem właściwego zdjęcia;
   - zachowuje limity Openverse, niezależny fallback Wikimedia i globalną unikalność.
2. Nowy CSS: WEB_PUBLISH/assets/home-specialist-photo-layout-fix115.css
   - ogranicza zdjęcie do 88×84 px na szerokim widoku, z responsywnymi zmianami;
   - blokuje overflow i powiększanie obrazów poza kartę;
   - ogranicza szerokość tekstu i wymusza siatkę 3/2/1 kolumny.
3. Aktualizacje HTML, Service Workera, manifestu, release.json, OneClick i Watchera.
4. Nowe testy kontraktu publikacji, kategorii zdjęć oraz ograniczeń układu.

INSTALACJA
1. Zamknij proces Watchera/OneClick, jeżeli jest uruchomiony.
2. Wykonaj kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj całe archiwum FIX115 do folderu projektu, zachowując strukturę katalogów i zastępując pliki projektu.
4. Uruchom WYKONAJ_TESTY_FIX115.cmd.
5. Dopiero po wyniku PASS uruchom dotychczasowy bezpieczny start publikacji.
6. Po publikacji odśwież stronę z pominięciem pamięci podręcznej. W razie aktywnej starej PWA sprawdź, czy Service Worker pobrał nowy HTML i arkusz CSS.

BEZPIECZEŃSTWO
- Nie twórz nowej bazy D1.
- Nie usuwaj BACKUPS_D1 ani istniejących migracji.
- Nie zmieniaj sekretów Cloudflare/OpenAI.
- FIX115 nie dodaje migracji SQL.

WYNIKI
- OneClick: 50/50 PASS.
- Auto-Watcher: 52/52 PASS.
- 37/37 lokalnie skonfigurowanych źródeł startowych spełnia nową politykę.
- 21/21 slotów strony głównej ma unikalne przypisania startowe.

WAŻNE OGRANICZENIE
Testy są automatycznymi testami kodu i kontraktów. Nie potwierdzają jeszcze produkcyjnego wdrożenia ani wyglądu po wdrożeniu na Twoim komputerze. W miejscach bez dostępnej legalnej fotografii zostaje wyraźnie oznaczona ilustracja techniczna.
