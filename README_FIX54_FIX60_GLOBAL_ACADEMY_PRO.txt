NAUKA OD A DO Z — DLA WSZYSTKICH
GLOBAL ACADEMY PRO — FIX54–FIX60
Podstawa zgodności: 6.8.0 FIX51 + FIX53
============================================================

CO ZAWIERA PAKIET

FIX54 — GLOBAL QUALITY / SECURITY CENTER
- Audyt zasobów wizualnych wykonywany w przeglądarce.
- Kontrola endpointów health/auth oraz stanu Service Workera.
- Kontrola dostępności obrazów, tekstów alt, identyfikatorów i nawigacji.
- Panel prywatności pokazuje wyłącznie stan przeglądarki i publiczne statusy API.
- Watcher nie zgaduje gałęzi produkcyjnej. Jeśli Wrangler nie zwróci production_branch, FIX63 odczytuje ją przez uwierzytelnione Cloudflare Pages API.
  publikacja zostanie bezpiecznie zatrzymana przed wysłaniem plików.

FIX55 — PHOTO & VIDEO ACADEMY
- Biblioteka 12 odziedziczonych fotografii warsztatowych.
- 3 odziedziczone plakaty materiałów wideo.
- 30 diagramów SVG: 18 odziedziczonych z FIX51 i 12 nowych diagramów FIX54.
- Katalog 12 kursów zewnętrznych oparty na istniejącym katalogu projektu.
- Linki prowadzą do stron źródłowych. Nie są to lokalne kopie filmów.

FIX56 — MASTER DIAGNOSTICS AI
- Formularz edukacyjny do opisu symptomów, urządzenia i kategorii problemu.
- Korzysta z istniejącego, serwerowego endpointu /api/chat.
- Nie umieszcza klucza OpenAI w kodzie przeglądarki.
- Nie wykonuje pomiarów, napraw, flashowania firmware ani operacji dyskowych.
- Wynik AI jest hipotezą wymagającą weryfikacji w dokumentacji.

FIX57 — UNIVERSAL DEVICE DATABASE
- Przeszukiwanie istniejącego katalogu rodzin i modeli urządzeń.
- Opcjonalne pobranie zatwierdzonych wpisów z istniejącego /api/models.
- Nazwa rodziny nie potwierdza zgodności części; pełny model, SKU i rewizję należy zweryfikować.

FIX58 — SERVICE WORKSHOP MANAGER
- Lokalny rejestr spraw napraw, kosztów, diagnozy, procedur i części.
- Import/eksport kontrolowanego JSON.
- Dane zapisują się w localStorage tej przeglądarki.
- Nie są automatycznie wysyłane do D1 ani synchronizowane między urządzeniami.

FIX59 — EXAMINATION CENTER
- 18 pytań w puli, losowanych jest 8 do pojedynczego ćwiczenia.
- Wyniki zapisywane lokalnie.
- Wydruk potwierdzenia ma charakter edukacyjny i nie jest certyfikatem akredytowanym.

FIX60 — GLOBAL OFFLINE ACADEMY
- Pakiety materiałów zapisywane w Cache Storage przeglądarki.
- Kontrola zawartości pakietów, usuwanie cache i eksport danych modułu.
- Duże nagrania zewnętrzne nie są pobierane automatycznie.
- Nie ma synchronizacji między urządzeniami.

ZASOBY WIZUALNE
- 12 zdjęć + 3 plakaty + 30 diagramów = 45 plików wizualnych.
- 30 diagramów technicznych obejmuje 18 wcześniejszych SVG FIX51 oraz 12 nowych SVG FIX54.
- 12 zdjęć i 3 plakaty odziedziczono z wcześniejszego projektu. Ich status licencyjny
  nadal wymaga potwierdzenia przez właściciela materiałów.
- Nowe diagramy FIX54 są edukacyjnymi schematami poglądowymi, a nie OEM boardview,
  pinoutem konkretnej rewizji ani instrukcją pomiarów dla wszystkich płyt.

BEZPIECZEŃSTWO I ZACHOWANIE DANYCH
- Zachowano produktową wersję bazową 6.8.0 oraz identyfikator wydania FIX51.
- Nie dodano migracji SQL do D1.
- Nie zmieniano sekretów ani konfiguracji OpenAI.
- Nie zmieniano bindingu istniejącej bazy D1.
- Nie dodano automatycznego wysyłania spraw klientów do chmury.
- Watcher pobiera production_branch z Cloudflare Pages API albo z odpowiedzi Wrangler; nie zakłada domyślnie main.
- Produkcja nie jest publikowana przez ten pakiet automatycznie.

INSTALACJA / TEST NA WINDOWS
1. Rozpakuj ZIP do nowego katalogu, np. G:\AKADEMIA_SERWISU_FIX54_FIX60.
2. Nie usuwaj katalogów FIX49, FIX50, FIX51, FIX52 ani FIX53.
3. Uruchom WYKONAJ_TESTY_FIX60.cmd. Test obejmuje również 45 plików przez lokalny HTTP.
4. Po testach uruchom PODGLAD_FIX54_FIX60.cmd i sprawdź stronę lokalnie.
5. FIX63 automatycznie odczytuje Production Branch przez Cloudflare Pages API, używając już istniejącego profilu OAuth Wrangler.
6. Jeśli konto API nie zwróci gałęzi (np. brak uprawnień), wpisz dokładną nazwę do CLOUDFLARE_PRODUCTION_BRANCH_CONFIRMED.txt; bez API i bez ręcznego potwierdzenia publikacja pozostanie zablokowana.

ŚRODOWISKO TESTÓW W TYM WYDANIU
- Lokalne Node.js: 22.16.0.
- Docelowy komputer użytkownika używa Node.js 24.19.0; test Windows należy wykonać ponownie.
- Testy HTTP preview i testy statyczne nie zastępują ręcznego testu Chrome/Edge.

PODGLĄD
- docs/FIX54_FIX60_VISUAL_ATLAS_CONTACT_SHEET.jpg — plansza wszystkich 30 diagramów.
- docs/FIX54_FIX60_PHOTO_CONTACT_SHEET.jpg — podgląd 12 zdjęć i 3 plakatów odziedziczonych z wcześniejszych wydań.

Pliki źródłowe i wcześniejsze moduły pozostają w archiwum.


FIX61 — KOMPATYBILNOŚĆ STRAŻNIKA WIDOKÓW

Po FIX54–FIX60 aplikacja zawiera 34 samodzielne ekrany: 33 historyczne oraz nowy #view-globalacademy. Stary strażnik FIX35 został rozszerzony o jawnie zatwierdzony 34. widok, bez usuwania żadnego ekranu. Przed publikacją uruchom WYKONAJ_TESTY_FIX61.cmd.
