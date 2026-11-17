NAUKA OD A DO Z — 6.8.0 FIX19B
SOCIAL LOGIN + EMAIL SECURITY + TWO-FACTOR AUTHENTICATION

CO ZOSTALO DODANE
1. OAuth po stronie serwera dla Google, Facebook, Microsoft, X, GitHub i Discord.
2. Panel konta pokazuje wszystkie metody logowania i osobny stan dostawcy. Brak sekretu nie jest ukrywany ani przedstawiany jako gotowe logowanie.
3. Łączenie/odłączanie metod logowania, lista sesji i wylogowanie pozostałych urządzeń.
4. TOTP 2FA (RFC 6238), sekret szyfrowany AES-GCM, jednorazowe kody odzyskiwania.
5. Potwierdzanie adresu e-mail oraz reset hasła przez Resend.
6. Tokeny e-mail są przechowywane w D1 jako skróty SHA-256, są jednorazowe i ograniczone czasowo.
7. Reset hasła unieważnia wszystkie istniejące sesje. Odpowiedź resetu nie ujawnia, czy adres e-mail ma konto.
8. Kontrolowany publikator wymaga migracji 0011/0012, plików API poczty oraz zgodności academy-build / release.json.
9. Service Worker ma nową pamięć FIX19B; API nie jest buforowane.

WAŻNE: CZEGO NIE DA SIE AKTYWOWAC BEZ TWOICH DANYCH
- Google/Facebook/Microsoft/X/GitHub/Discord: potrzebne są Client ID i Client Secret utworzone w panelach tych dostawców.
- Potwierdzenie e-mail i reset hasła: potrzebny jest Resend API Key oraz adres nadawcy z domeny zweryfikowanej w Resend.
- Nie ma w paczce fikcyjnych kluczy. Przycisk jest widoczny, a panel wskazuje brakujące pola.
- Nie wysyłaj Client Secret ani Resend API Key przez czat.

KOLEJNOSC URUCHOMIENIA NA WINDOWS
1. Rozpakuj CAŁE archiwum do nowego folderu. Nie mieszaj plików z FIX18A/FIX18B.
2. Uruchom WYKONAJ_TESTY_FIX19B.cmd. Testy nie łączą się z produkcyjną bazą.
3. Uruchom KONFIGURUJ_LOGOWANIE_SOCJALNE_FIX19B.cmd. Jeżeli lokalny Wrangler nie istnieje, launcher najpierw przygotuje przypiętą wersję 4.156.0.
   - Wpisz pary Client ID / Client Secret wybranych dostawców.
   - Opcjonalnie wpisz Resend API Key i AUTH_EMAIL_FROM.
   - Konfigurator zapisuje wartości przez Wrangler jako Cloudflare Pages Production Secrets.
   - Przy pierwszym uruchomieniu wygeneruje AUTH_TOTP_ENCRYPTION_KEY, jeśli jeszcze go nie ma.
4. W każdym panelu dostawcy zarejestruj dokładnie ten Redirect URI:
   https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback
5. Dopiero po zapisaniu sekretów uruchom URUCHOM_AKADEMIE.cmd.
   Publikator sprawdzi konto/projekt, backupuje istniejącą bazę D1, zastosuje brakujące migracje addytywne i wdroży do istniejącego Pages.
   Nie tworzy nowego projektu ani nowej bazy.
6. Po zakończeniu publikacji uruchom CHECK_LOGOWANIA_OAUTH_FIX19B.cmd.
7. Otwórz stronę ponownie. Jeżeli przeglądarka trzyma stary PWA, zamknij wszystkie okna strony i otwórz ją ponownie albo wykonaj twarde odświeżenie.

CALLBACK / OAUTH
Callback dla wszystkich sześciu dostawców:
https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback
Każdy dostawca może mieć własne dodatkowe ustawienia aplikacji po swojej stronie (np. domeny, dozwolone redirect URI, typ aplikacji, testowi użytkownicy). Samo dodanie przycisków nie aktywuje OAuth.

EMAIL / RESEND
Sekrety:
RESEND_API_KEY
AUTH_EMAIL_FROM
W Resend ustaw i zweryfikuj domenę nadawcy przed wysyłaniem wiadomości. Gdy sekrety nie są skonfigurowane, endpoint statusu pokaże brakujące nazwy; rejestracja nie udaje, że wysłała wiadomość.

MIGRACJE
0011_totp_two_factor.sql — dodaje tabele wyzwań 2FA i kodów odzyskiwania oraz kolumny TOTP.
0012_email_verification_and_password_reset.sql — dodaje email_verified_at i tabelę tokenów e-mail.
Migracje są addytywne. Publikator przed migracjami wykonuje eksport istniejącej bazy D1. Nie uruchamiaj ręcznie na innej bazie.

BEZPIECZENSTWO
- Sekrety nie są umieszczane w ZIP, HTML, JavaScript ani wrangler.toml.
- Konfigurator działa lokalnie na 127.0.0.1 i przesyła sekrety do Wrangler przez bezpieczny kanał wejściowy procesu.
- Status OAuth pokazuje wyłącznie booleany, nazwy brakujących sekretów i status schematu, nigdy wartości sekretów.
- Reset hasła jest ograniczony czasowo, jednorazowy, rate-limited i kończy wszystkie sesje.
- TOTP wymaga poprawnego AUTH_TOTP_ENCRYPTION_KEY. Nie usuwaj tego sekretu po skonfigurowaniu kont 2FA.

WYNIKI TESTOW W TYM SRODOWISKU
33/33 skrypty testowe przeszły na lokalnej bazie testowej i plikach projektu.
Nie oznacza to jeszcze przejścia logowania na prawdziwych kontach dostawców ani wysłania prawdziwego e-maila.
Produkcja nie została opublikowana z tego środowiska.
