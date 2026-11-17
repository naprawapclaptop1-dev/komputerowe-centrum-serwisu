NAUKA OD A DO Z 6.8.0 — FIX31
NAPRAWA KONTROLI ZASOBÓW PUBLIKATORA
Data: 2026-11-04

CO ZOSTAŁO NAPRAWIONE
Publikator ONECLICK_AKADEMIA.js próbował odczytać trzy różne zasoby jako jeden plik:
  assets/advanced-learning-studio-620.css/home-refresh-fix30.css/photo-unique-thumbnails-fix30.js
Taka ścieżka nie istnieje, dlatego proces kończył się błędem ENOENT na etapie 5/7.

FIX31 odczytuje oddzielnie:
  assets/advanced-learning-studio-620.css
  assets/home-refresh-fix30.css
  assets/photo-unique-thumbnails-fix30.js
Zachowane są osobne kontrole zawartości tych zasobów. Dodano test regresji, który blokuje powrót błędnego sklejania ścieżek.

ZGODNOŚĆ WYDANIA
- Wersja aplikacji: 6.8.0 (bez zmiany numeru semantycznego).
- Identyfikator buildu: 6.8.0-social-login-fix31-publisher-asset-path-20261104.
- Ten sam identyfikator jest w release.json, academy-build w index.html, /api/auth/status i watcherze.
- Service Worker otrzymał nową nazwę cache, aby przeglądarka pobrała aktualny build.
- Zachowano historyczny wpis FIX30 w release.json.

JAK URUCHOMIĆ
1. Zrób kopię zapasową obecnego folderu projektu.
2. Rozpakuj pełne archiwum FIX31 do folderu projektu, zachowując strukturę katalogów i plików.
3. Uruchom URUCHOM_AKADEMIE.cmd.
4. Publikator powinien przejść kontrolę plików WWW (5/7), a następnie wykonać dotychczasowy, zabezpieczony proces kopii D1, oczekujących migracji, publikacji i obserwatora.
5. Po potwierdzeniu publikacji można uruchomić CHECK_KONTA_FIX31.cmd. To narzędzie tylko odczytuje publiczne API i wykonuje negatywną próbę logowania na adresie example.invalid; nie tworzy konta.

DODATKOWE TESTY
- WYKONAJ_TESTY_FIX31.cmd — pełny zestaw testów JS/MJS.
- scripts/test-publisher-assets-separate-fix31.mjs — sprawdza trzy osobne ścieżki.
- scripts/test-publisher-verifyweb-local-fix31.mjs — uruchamia pełne verifyWeb() lokalnie, bez połączenia z Cloudflare, D1 i bez migracji.

WAŻNE O DANYCH I PUBLIKACJI
- FIX31 nie zmienia identyfikatora projektu Cloudflare Pages ani produkcyjnego bindingu D1.
- Nie dodano ani nie uruchomiono migracji SQL w tej poprawce.
- Nie zmieniono sekretów OpenAI ani pozostałych sekretów Cloudflare.
- W tej sesji nie wykonano publikacji do Cloudflare ani zmian produkcyjnej bazy. FIX31 jest gotowy lokalnie do ponownego uruchomienia przez użytkownika.
- Pełny test verifyWeb() jest lokalną kontrolą plików; nie zastępuje rzeczywistej publikacji ani testu publicznego adresu.
