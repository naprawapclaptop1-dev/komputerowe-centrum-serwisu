NAUKA OD A DO Z 6.8.0 — FIX32
NAPRAWA KONTROLI POKAZU SLAJDÓW I CENTRUM NAUKI
Data: 2026-11-04

CO OZNACZAŁ LOG FIX31
Publikator prawidłowo sprawdził katalog WWW, wykonał eksport istniejącej bazy D1 i nie znalazł oczekujących migracji. Zapytania statystyk i limitera były odczytowe (0 zapisów, changed_db=false). Proces zatrzymał się dopiero w lokalnej kontroli watchera, przed publikacją.

PRZYCZYNA
Watcher szukał <img src=...> w niezmiennym porządku atrybutów i sześciu atrybutów data-fallback. Tymczasem aktualny HTML używa <img data-photo-lock=... src=...>, a plik homepage-showcase-640.js generuje własną ilustrację SVG przy błędzie ładowania zdjęcia. Zdjęcia, pokaz i Centrum Nauki były obecne — kontrola była niezgodna z aktualnym kodem.

NAPRAWA FIX32
- Wspólny helper scripts/homepage-showcase-guard.js parsuje artykuły i atrybuty niezależnie od ich kolejności.
- Sprawdza 6 slajdów, 6 różnych src, 6 różnych data-photo-lock, Centrum Nauki oraz mechanizm błędu obrazu w JS.
- Nie wymaga nieużywanego już statycznego data-fallback.
- AUTO_PUBLISH_WATCHER.js korzysta bezpośrednio z tego helpera.

URUCHOMIENIE
1. Wykonaj kopię folderu projektu (oraz zachowaj istniejący BACKUPS_D1).
2. Rozpakuj pełne archiwum FIX32 do folderu G:\AKADEMIA_SERWISU_PRO z zachowaniem struktury.
3. Uruchom URUCHOM_AKADEMIE.cmd.
4. Jeśli proces zatrzyma się ponownie, zachowaj cały nowy log. Nie twórz nowego projektu Pages ani nowej bazy D1.
5. Po publikacji uruchom CHECK_KONTA_FIX32.cmd.

TESTY LOKALNE
- WYKONAJ_TESTY_FIX32.cmd — wszystkie testy JS/MJS.
- scripts/test-watcher-homepage-showcase-fix32.mjs — test nowej kontroli.
- scripts/test-publisher-verifyweb-local-fix31.mjs nadal uruchamia pełne lokalne verifyWeb() bez Cloudflare i bez migracji.

To wydanie nie wykonuje samo publikacji z tego środowiska i nie zmienia produkcyjnej bazy.
