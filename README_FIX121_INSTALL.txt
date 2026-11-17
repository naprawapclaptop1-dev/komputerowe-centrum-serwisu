NAUKA OD A DO Z — INSTALACJA POPRAWKI PUBLIKATORA FIX121

WARIANT A — PEŁNY PROJEKT
1. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj pełne archiwum FIX121 do folderu G:\AKADEMIA_SERWISU_PRO, ze scalaniem folderów i nadpisaniem plików projektu.
3. Nie usuwaj lokalnego wrangler.toml, .env, .dev.vars ani innych lokalnych sekretów/konfiguracji, jeśli występują na komputerze. Archiwum nie zawiera klucza OpenAI ani tokenu Cloudflare.
4. Uruchom WYKONAJ_TESTY_FIX121.cmd. Oczekiwany wynik: 58/58 testów, 19/19 kontroli składni, 4/4 manifestów JSON.
5. Dopiero po zielonym wyniku uruchom dotychczasowy START_FIX105.cmd.

WARIANT B — PATCH DO ISTNIEJĄCEGO FOLDERU
1. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj archiwum FIX121_PATCH bezpośrednio do G:\AKADEMIA_SERWISU_PRO, zachowując strukturę katalogów i wybierając nadpisanie plików.
3. Uruchom WYKONAJ_TESTY_FIX121.cmd.
4. Dopiero po zielonym wyniku uruchom dotychczasowy START_FIX105.cmd.

CO NAPRAWIA FIX121
Poprzedni publikator oczekiwał historycznego adresu JS 6.3.0-fix14, podczas gdy HTML używał 6.8.0-fix119. Teraz HTML, OneClick, Watcher oraz Service Worker używają spójnych adresów JS i CSS 6.8.0-fix119. Nie usuwano Akademii FIX14 ani nie wyłączano walidacji.

BEZPIECZEŃSTWO
FIX121 nie publikuje strony samodzielnie. Testy są lokalne; nie wykonują migracji D1, nie tworzą baz, projektów Pages ani kont. Publikację uruchamiasz dotychczasowym START_FIX105.cmd po sprawdzeniu testów.
