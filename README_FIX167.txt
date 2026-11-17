NAUKA OD A DO Z — FIX167
CMD-ONLY GEMINI KEY CONFIGURATION / PUBLISHER GUARD
Produkt: 6.8.0

PRZYCZYNA POPRZEDNIEGO ZATRZYMANIA
OneClick w FIX166 wymagał, aby teksty „Wklej klucz” i „wyłącznie w oknie CMD” występowały w WEB_PUBLISH/index.html. To był nieprawidłowy warunek: klucz Gemini ma być wprowadzany tylko w CMD, a strona internetowa nie powinna zawierać formularza klucza ani instrukcji jego wprowadzania.

NAPRAWA FIX167
- OneClick sprawdza rzeczywiste pliki USTAW_KLUCZ_GEMINI.cmd i scripts/configure-gemini-secret.ps1.
- Kontrola potwierdza Read-Host -AsSecureString, parametr --stdin-secret oraz przekazanie wartości do procesu Node przez przekierowane stdin.
- Watcher stosuje ten sam kontrakt.
- Testy potwierdzają, że strona WWW nie wymaga pola GEMINI_API_KEY.
- Zaktualizowano historyczny test banera publikatora do bieżącego FIX167.

ZACHOWANE
- Google Gemini jako jedyny dostawca aktywnego czatu; ograniczenie tematyczne do nauki, diagnostyki, naprawy i konserwacji komputerów oraz laptopów.
- Istniejący sekret GEMINI_API_KEY w Cloudflare Pages Production. FIX167 nie odczytuje, nie podmienia ani nie usuwa wartości sekretu.
- Produkt 6.8.0 oraz runtime WWW FIX165.
- Cache PWA aplikacji i cache zdjęć pozostają bez zmian.
- Istniejący projekt Cloudflare Pages i istniejąca baza D1 naprawapc-orders.
- Bez nowych baz, tabel i migracji D1.

URUCHOMIENIE
1. Zrób kopię G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj pełny ZIP FIX167 do G:\AKADEMIA_SERWISU_PRO, zastępując poprzednie pliki.
3. Uruchom WYKONAJ_TESTY_FIX167.cmd. Oczekiwany wynik: STATUS: PASS.
4. Uruchom START_FIX105.
5. Konfigurator powinien wykryć istniejący sekret i nie pytać ponownie o klucz Gemini.

FIX167 NIE PUBLIKUJE SERWISU SAMODZIELNIE. Publikację uruchamia START_FIX105 po pozytywnym lokalnym preflight. Po wdrożeniu sprawdź wynik końcowy i adres produkcyjny.

Raport testów: RAPORT_FIX167_TESTY.log
Historia zmian: CHANGELOG_6.8.0_FIX167.txt
Raport plików: FIX167_FILE_CHANGE_REPORT.txt
Manifest: SHA256_FIX167_CHANGED_FILES.txt
