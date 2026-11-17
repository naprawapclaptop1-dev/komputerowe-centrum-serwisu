NAUKA OD A DO Z 6.8.0 — FIX24
NAPRAWA IZOLACJI LIMITERA LOGOWANIA + DIAGNOSTYKA ETAPU

CEL
FIX23 opublikował stronę i zastosował migrację 0014, ale kontrolowany test negatywny logowania nadal zwracał HTTP 503 ACCOUNT_OPERATION_FAILED. FIX24 odcina ścieżkę logowania od historycznych tabel limitów V1/V2 i wprowadza osobną tabelę V3 przez addytywną migrację 0015.

CO ZMIENIA FIX24
- Runtime limitowania prób używa academy_account_rate_limits_v3.
- Tabela V3 ma pojedynczy PRIMARY KEY(bucket_key) NOT NULL.
- Kontrola schematu odczytuje wszystkie kolumny PK i odrzuca klucz złożony.
- Tabele V1/V2 są zachowane i nie są przebudowywane ani kasowane.
- Logowanie oznacza etapy: login-rate-key-ip, login-rate-key-email, login-rate-limit-ip, login-rate-limit-email, login-account-lookup, login-password-kdf i login-create-session.
- W logu Cloudflare zapisany jest krótki numer referencyjny, etap i ograniczony komunikat techniczny. E-mail, hasło oraz treść żądania nie są logowane.
- /api/session oraz /api/auth/status raportują, że aktywnym limiterem jest academy_account_rate_limits_v3.
- Zachowane są starsze hasła istniejących kont; nowe rejestracje i reset hasła nadal wymagają minimum 12 znaków.
- Nie dodano Google Drive, OneDrive ani Dropbox. Lokalne kopie JSON i kopia D1 przed migracjami pozostają.

INSTALACJA / WDROŻENIE NA WINDOWS
1. Rozpakuj pełne archiwum do nowego folderu, nie nadpisuj ręcznie FIX23.
2. Uruchom WYKONAJ_TESTY_FIX24.cmd. Zatrzymaj się, jeżeli którykolwiek test zakończy się błędem.
3. Uruchom URUCHOM_AKADEMIE.cmd. Publikator weryfikuje istniejący projekt Cloudflare Pages i istniejący binding D1. Przed migracjami wykonuje eksport istniejącej bazy do BACKUPS_D1. Nie tworzy nowej bazy.
4. Migracja 0015 tworzy tabelę V3. Stare tabele i konta pozostają nietknięte.
5. Po publikacji uruchom CHECK_KONTA_FIX24.cmd. Test używa wyłącznie qa-login-check@example.invalid i TestInvalidOnly-2026!, nie tworzy konta i nie zmienia żadnego hasła.
6. Oczekiwany wynik próby negatywnej to HTTP 401 LOGIN_FAILED. Jeżeli pozostanie HTTP 503, skrypt wypisze stage i reference. Wtedy skoreluj reference/etap z logiem Cloudflare Pages Functions; nie wykonuj kolejnych migracji w ciemno.

WAŻNE
W tej paczce przeprowadzono testy lokalne. Nie wykonano z tej sesji publikacji do Cloudflare ani migracji produkcyjnej D1. FIX23 nadal jest ostatnią wersją potwierdzoną w dostarczonym logu użytkownika. Produkcyjne rozwiązanie problemu można potwierdzić dopiero po uruchomieniu publikatora FIX24 i otrzymaniu HTTP 401 z testu .invalid.
