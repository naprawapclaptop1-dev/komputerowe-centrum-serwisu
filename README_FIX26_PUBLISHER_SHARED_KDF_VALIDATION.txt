NAUKA OD A DO Z 6.8.0 FIX26 — INSTRUKCJA

CEL
FIX26 naprawia kontrolę wydania, która zatrzymywała publikację komunikatem:
"Brak rejestracji/logowania e-mail: PBKDF2."

PRZYCZYNA
W FIX25 implementacja PBKDF2 została prawidłowo przeniesiona do:
  functions/_password-kdf.js
Endpoint:
  functions/api/session.js
importuje funkcje createPasswordSalt, derivePassword, isSupportedPasswordSalt oraz DUMMY_PASSWORD_SALT.
Stary verifyWeb() szukał jednak tekstu "PBKDF2" bezpośrednio w functions/api/session.js, jakby algorytm był tam zaimplementowany. To była błędna kontrola ścieżki, a nie brak KDF.

CO ZMIENIONO
- Dodano scripts/password-kdf-contract-fix26.js.
- ONECLICK_AKADEMIA.js i AUTO_PUBLISH_WATCHER.js korzystają z tego samego walidatora.
- Endpoint kont musi importować i używać wspólny helper.
- Helper musi zawierać PBKDF2_ITERATIONS = 100000, PBKDF2 i SHA-256.
- Reset hasła musi używać tego samego helpera.
- Stary limit 210000 powoduje błąd walidacji.
- Nowy build: 6.8.0-social-login-fix26-publisher-shared-kdf-verify-20261103.
- Cache PWA otrzymuje nową rewizję FIX26.

JAK URUCHOMIĆ
1. Rozpakuj cały ZIP do nowego folderu. Nie mieszaj plików z FIX25.
2. Uruchom WYKONAJ_TESTY_FIX26.cmd.
3. Jeśli testy przejdą, uruchom URUCHOM_AKADEMIE.cmd.
4. Publikator powinien przejść krok 5/7, sprawdzając wspólny KDF w jego rzeczywistym module.
5. Publikator zachowuje istniejący przepływ: potwierdzenie konta/projektu/D1, kopia D1 przed ewentualnymi migracjami, wdrożenie Pages i obserwator.
6. Po publikacji uruchom CHECK_KONTA_FIX26.cmd. Test negatywny używa wyłącznie qa-login-check@example.invalid i nie tworzy konta.

BAZA D1
FIX26 nie zawiera nowej migracji. Migracje 0013–0015 pozostają częścią dotychczasowego schematu. Publikator nadal wykonuje eksport D1 przed zastosowaniem ewentualnych oczekujących migracji.

OGRANICZENIA WERYFIKACJI
- Testy FIX26 wykonano lokalnie na Node.js v22.16.0 w środowisku budowania.
- Nie wykonano tutaj publikacji Cloudflare ani testu produkcyjnego logowania.
- Wersja produkcyjna nie jest oznaczona jako opublikowana.
- Po publikacji wymagane jest sprawdzenie HTTP 401 dla fikcyjnego adresu .invalid; nie wolno uznać samego HTTP 200 strony za test działającego logowania.

BEZPIECZEŃSTWO
Nie wklejaj kluczy API, tokenów Wrangler, haseł ani sekretów OAuth do czatu lub logów. Konfiguruj je lokalnie w istniejących bezpiecznych narzędziach projektu.
