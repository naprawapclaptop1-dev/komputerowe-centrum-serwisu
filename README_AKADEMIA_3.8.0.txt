NAPRAWA PC — AKADEMIA SERWISU PRO 3.8.0
PEŁNY PROJEKT + GLOBALNY LICZNIK + JEDEN START

URUCHOMIENIE
1. Rozpakuj cały ZIP do G:\AKADEMIA_SERWISU_PRO (zastąp pliki WWW i functions). Zachowaj TOOLS_CLOUDFLARE, jeśli już istnieje.
2. Zamknij poprzedni watcher Ctrl+C.
3. Uruchom tylko URUCHOM_AKADEMIE.cmd.
4. Pozostaw to jedno okno otwarte.

JEDEN CMD WYKONUJE PO KOLEI
- sprawdzenie Node, Wrangler, konta i istniejącego Pages;
- jeżeli brakuje wrangler.jsonc, pobiera aktualną konfigurację z istniejącego projektu Pages poleceniem Wrangler;
- sprawdza istniejący D1 o nazwie naprawa-pc-akademia-db i wiąże go pod DB, jeśli jest już w koncie;
- wykonuje oczekujące migracje D1 (z kopią bezpieczeństwa Wrangler);
- testuje tabelę licznika;
- kontroluje WEB_PUBLISH i limit plików 25 MiB;
- publikuje do istniejącego projektu na gałąź main;
- sprawdza /api/health i uruchamia obserwator zmian.

BEZPIECZEŃSTWO
- Nie tworzy nowego projektu Pages ani nowej bazy D1.
- Jeśli istniejąca baza nie jest dostępna, przerywa działanie i niczego nie tworzy.
- Nie nadpisuje konfiguracji bez kopii zapasowej.
- Nie używa PowerShell ExecutionPolicy Bypass.
- Publikuje wyłącznie WEB_PUBLISH i katalog functions/ wymagany przez Pages Functions.
- Globalne wizyty są agregowane serwerowo. Nie są lokalnymi licznikami. API zapisuje dzienne agregaty, haszowany losowy identyfikator sesji i losowy ID odsłony; nie zapisuje IP ani fingerprintu.

CZAT
Bezpłatny czat pozostaje lokalnym mechanizmem wyszukiwania i porządkowania wiedzy Akademii. Nie jest generatywnym LLM i nie wymaga płatnego API.

PROJEKT
Cloudflare Pages: naprawa-pc-akademia-serwisu-pro
Konto: 4ddfc3803a4f0c4457ccae083f18b975
Gałąź: main
Stały adres: https://naprawa-pc-akademia-serwisu-pro.pages.dev
