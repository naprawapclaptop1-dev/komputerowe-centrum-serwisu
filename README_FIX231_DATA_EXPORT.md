# FIX231 — eksport i usuwanie danych użytkownika

- `GET /api/export` eksportuje dane profilu, zdarzenia, wiadomości konta, wkłady, stan i porcje synchronizacji, postępy lekcji, opinie, rozmowy, zdarzenia bezpieczeństwa (bez IP), nazwy połączonych dostawców OAuth (bez tokenów), egzaminy, certyfikaty, powiadomienia, relacje opiekunów i zgłoszenia treści.
- Eksport jawnie wymienia wyłączone sekrety: hashe haseł, tokeny sesji, tokeny OAuth, sekrety 2FA, hashe kodów odzyskiwania, klucze Web Push i sekrety API.
- Usuwanie konta usuwa rekordy FIX231–FIX239 powiązane z kontem. Dane, które platforma musi zachować z przyczyn bezpieczeństwa lub obowiązków prawnych, muszą być objęte odrębną retencją i opisem.
- Eksport nadal wymaga aktywnej sesji. Przed udostępnieniem pliku użytkownik powinien przechowywać go bezpiecznie.

Weryfikacja lokalna: `scripts/test-fix231-239-platform.mjs` i migracja SQLite. Nie oznacza to audytu zgodności prawnej.

Instrukcję kolejności wdrożenia, kopii D1, migracji 0023 i konfiguracji powiadomień opisuje `INSTRUKCJA_WDROZENIA_FIX231_239.txt`.
