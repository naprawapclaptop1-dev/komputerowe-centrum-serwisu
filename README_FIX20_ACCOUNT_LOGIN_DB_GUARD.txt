NAUKA OD A DO Z 6.8.0 FIX20 — INSTRUKCJA
============================================================

CEL
FIX20 naprawia walidację istniejących haseł i zabezpiecza ścieżkę logowania przed niepełnym schematem D1.

HASŁA
- Logowanie istniejącego konta: od 1 do 128 znaków (weryfikacja nadal przez PBKDF2).
- Nowa rejestracja i reset hasła: od 12 do 128 znaków.
- Checkbox regulaminu nadal dotyczy rejestracji, nie zwykłego logowania.

MIGRACJA 0013
- Dodaje academy_account_rate_limits i indeks retencji.
- Nie usuwa ani nie modyfikuje academy_rate_limits.
- Runtime korzysta z nowej tabeli po zastosowaniu migracji.

JAK TESTOWAĆ
1. Rozpakuj cały ZIP do nowego, osobnego folderu. Nie łącz plików z poprzednimi wydaniami.
2. Uruchom WYKONAJ_TESTY_FIX20.cmd. Każdy test musi zakończyć się PASS.
3. Uruchom URUCHOM_AKADEMIE.cmd z folderu FIX20. Publikator sprawdza istniejący projekt i binding D1; nie tworzy nowej bazy.
4. Przed migracjami publikator wykonuje eksport/kopię istniejącej bazy D1 do BACKUPS_D1. Jeśli kopia jest pusta lub nie powiedzie się, publikacja zostaje zatrzymana.
5. Wrangler zastosuje oczekujące migracje, w tym 0013_account_runtime_guard.sql, a następnie wdroży stronę i API.
6. Po publikacji watcher sprawdza /api/session, /api/auth/status i wykonuje wyłącznie jeden negatywny test logowania na dany build w ramach procesu watchera, z fikcyjnym adresem qa-login-check@example.invalid. Oczekiwany jest HTTP 401 LOGIN_FAILED.
7. Ręcznie otwórz stronę, wybierz „Mam już konto” i zaloguj się własnymi danymi.
8. Uruchom CHECK_KONTA_FIX20.cmd, aby ponowić kontrolę schematu i bezpieczny test negatywny. Raport wyników lokalnych znajduje się w TEST_REPORT_6.8.0_FIX20.txt.

BEZPIECZEŃSTWO
- Nie wysyłaj haseł ani kluczy OAuth do czatu lub plików projektu.
- Nie uruchamiaj migracji ręcznie na innej bazie. Używaj istniejącego publikatora.
- Nie wyłączaj antywirusa ani zabezpieczeń systemu.
- Test .invalid nie tworzy konta, ale zapisuje pojedynczy wpis w liczniku limitu prób.

OGRANICZENIA
- Ten pakiet nie zawiera sekretów OAuth ani Resend; konfiguracja dostawców pozostaje osobnym krokiem.
- Sam lokalny test nie potwierdza poprawności produkcyjnej D1; po wdrożeniu wymagany jest odczyt statusu i próba na własnym koncie.
- Publikacja nie została wykonana podczas przygotowania ZIP.
