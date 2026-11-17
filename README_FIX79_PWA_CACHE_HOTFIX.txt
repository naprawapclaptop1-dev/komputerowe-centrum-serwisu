NAUKA OD A DO Z — FIX79
NAPRAWA SERVICE WORKER PWA / PRE-CACHE FILMU WSPARCIA

CO ZOSTAŁO NAPRAWIONE
1. Service Worker zawierał film MP4 i napisy VTT, ale brakowało plakatu:
   /media/video_posters/akademia-wsparcie-poster.jpg
   W rezultacie kontrola OneClick zatrzymywała publikację przed migracjami.
2. CACHE_NAME zawierał sklejone i wielokrotnie powielone identyfikatory historycznych poprawek.
   Został zastąpiony krótką nazwą:
   nauka-od-a-do-z-6.8.0-fix79-pwa-cache-20261106
3. W CORE istniały cztery powtórzone wpisy video-index-01/02/03/08, choć były już generowane przez zakres 01..08. Powtórzenia usunięto.
4. Preflight sprawdza aktualną nazwę cache, obecność MP4/JPG/VTT oraz pozostałe wymagane zasoby. Watcher sprawdza analogicznie lokalne i opublikowane zasoby.

TESTY
- Uruchom WYKONAJ_TESTY_FIX79.cmd.
- Runner Node: scripts/run-tests-fix79.mjs.
- Test regresyjny: scripts/test-service-worker-fix79.mjs.
- Główny zestaw ma 34 skrypty testowe; osobny test Service Workera wykonuje 8 asercji.
- Test lokalnego CORE sprawdza wszystkie 491 adresów i nie wykrywa brakujących plików ani powtórzonych URL-i.

INSTALACJA
1. Zrób kopię aktualnego katalogu projektu.
2. Rozpakuj pełne archiwum FIX79 do katalogu projektu, zastępując pliki aplikacji.
3. Zachowaj własny wrangler.toml, lokalne poświadczenia Cloudflare oraz katalogi konfiguracji, których nie ma w archiwum.
4. Uruchom WYKONAJ_TESTY_FIX79.cmd.
5. Po pozytywnym wyniku uruchom dotychczasowy OneClick.

PO WDROŻENIU
Nowy Service Worker ma nowy CACHE_NAME. Po pomyślnej instalacji i aktywacji powinien usunąć poprzednie cache aplikacji z prefiksami naprawa-pc-akademia- i nauka-od-a-do-z-. Jeśli nowy precache nie przejdzie, Service Worker nie powinien się aktywować, a poprzedni aktywny cache pozostanie dostępny.

BEZPIECZEŃSTWO I ZAKRES
- Wersja produktu pozostaje 6.8.0; poprawka jest oznaczona FIX79.
- Nie dodano migracji D1 i nie wykonano SQL.
- Nie zmieniano OPENAI_API_KEY ani ustawień istniejącego projektu Cloudflare Pages.
- Nie utworzono nowego projektu ani nowej bazy.
- Nie wykonano publikacji produkcyjnej.

ŚRODOWISKO TESTOWE
Node.js v22.16.0 w Linux. Na docelowym Windows należy potwierdzić testy z Node.js v24.19.0.
