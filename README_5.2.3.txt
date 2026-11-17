NAPRAWA PC — AKADEMIA SERWISU PRO 5.2.3
ACCOUNT EXPERIENCE / POPRAWIONA REJESTRACJA

CO ZMIENIONO
- Nowy wygląd sekcji „Moje konto i historia”.
- Widoczny status serwera kont i przycisk „Sprawdź ponownie”.
- Czytelniejszy formularz rejestracji i logowania.
- Przycisk rejestracji jest oddzielony od checkboxa wymaganej zgody.
- Miernik długości hasła, kontrola powtórzenia i przyciski pokaż/ukryj hasło.
- Czytelne komunikaty błędów i sukcesu.
- Potwierdzenie, że po rejestracji przeglądarka otrzymała sesję HttpOnly.
- Duplikat e-mail automatycznie przełącza formularz na logowanie.
- Backend zwraca jednoznaczny kod ACCOUNT_EXISTS.

WARUNKI ZAŁOŻENIA KONTA
1. Podaj prawidłowy adres e-mail.
2. Ustaw hasło długości co najmniej 12 znaków (maksymalnie 128).
3. Wpisz identyczne hasło w drugim polu.
4. Zaznacz zgodę na zasady i politykę prywatności.
5. Kliknij „Utwórz bezpłatne konto”.

W tej wersji adres e-mail nie jest weryfikowany wiadomością, a reset hasła e-mailem nie jest skonfigurowany. Użyj adresu, do którego masz dostęp, i zachowaj hasło. Nie podawaj go w czacie.

INSTALACJA PEŁNEJ WERSJI
1. Zatrzymaj poprzedni obserwator przez Ctrl+C.
2. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj pełny ZIP i scal pliki z istniejącym folderem projektu.
4. Zachowaj lokalny TOOLS_CLOUDFLARE, wrangler.toml, BACKUPS_D1 i sekrety.
5. Uruchom URUCHOM_AKADEMIE.cmd.

BAZA D1
Nie dodano nowych migracji. Zgodnie z przekazanym logiem migracje 0006 i 0007 zostały już zastosowane. Nie twórz nowej bazy i nie usuwaj istniejących danych.

TESTY LOKALNE
Uruchom z folderu projektu:
  node scripts/test-email-account-local.mjs
Test używa lokalnej, tymczasowej bazy SQLite; nie łączy się z produkcyjną bazą Cloudflare i nie tworzy kont w produkcji.
