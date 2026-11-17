NAUKA OD A DO Z 6.8.0 FIX21 — INSTRUKCJA
============================================================

FIX21 naprawia fałszywą blokadę publikatora. Walidator szukał funkcji
rejestracji/logowania w functions/api/auth/sessions.js zamiast w
functions/api/session.js. Obie ścieżki są teraz sprawdzane niezależnie:
- functions/api/session.js: rejestracja, logowanie, accountSchemaStatus;
- functions/api/auth/sessions.js: lista aktywnych sesji i ich unieważnianie.

KROKI
1. Rozpakuj cały ZIP FIX21 do nowego folderu, nie nadpisuj starego FIX20.
2. Uruchom WYKONAJ_TESTY_FIX21.cmd. Musi zakończyć się komunikatem PASS.
3. Uruchom URUCHOM_AKADEMIE.cmd z folderu FIX21.
4. Publikator ma ponownie potwierdzić istniejące konto Cloudflare, istniejący projekt
   Pages i produkcyjny binding D1. Nie tworzy nowego projektu ani nowej bazy.
5. Przed zastosowaniem oczekujących migracji publikuje kopię istniejącej D1.
   Jeżeli eksport/kopia nie powiedzie się lub jest pusta, publikacja musi się zatrzymać.
6. Po publikacji uruchom CHECK_KONTA_FIX21.cmd.
7. Ostatecznie zaloguj się ręcznie na istniejące konto. Sam HTTP 401 dla fikcyjnego
   adresu potwierdza tylko bezpieczną obsługę błędnych danych, nie prawidłowe logowanie.

WAŻNE
- Używaj nowego folderu; nie mieszaj plików z poprzednią paczką.
- Nie usuwaj BACKUPS_D1 ani katalogu TOOLS_CLOUDFLARE.
- Nie wklejaj kluczy OpenAI, OAuth ani Resend do czatu lub plików projektu.
- Nie wyłączaj antywirusa ani ochrony Windows.
- Jeśli kopia D1 jest pusta/niedostępna, publikator ma się zatrzymać. Nie omijaj tej kontroli.

STATUS PRZYGOTOWANIA
FIX21 poprawia kontrolę lokalnego projektu. Nie oznacza, że Cloudflare został
opublikowany. Produkcyjna publikacja następuje dopiero po uruchomieniu skryptu.

Raport: TEST_REPORT_6.8.0_FIX21.txt
Historia zmian: CHANGELOG_6.8.0_FIX21.txt
