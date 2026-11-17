# FIX221 — rewizje stanu i kontrola konfliktów

Migracja addytywna `0021_state_revision_cas_fix221.sql` tworzy tabelę rewizji i ustawia rewizję początkową dla zapisanych stanów. API `/api/state` przyjmuje `expectedRevision`; zapis jest wykonywany przez D1 batch z tokenem zapisu i porównaniem rewizji. Konflikt zwraca HTTP 409 i nie nadpisuje wartości. Przeglądarka zachowuje lokalną kopię, blokuje automatyczne ponawianie konfliktu i umożliwia pobranie raportu porównawczego. Przy ręcznym scalaniu użytkownik powinien wybrać właściwą treść przed ponowną synchronizacją.

Test migracji 0021/0022 i logiki CAS w lokalnym SQLite: `python scripts/test-fix221-222-migrations.py` (wymaga standardowej biblioteki Python).
