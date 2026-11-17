# FIX235 — kopie D1 i bezpieczny test odtworzenia

- `BACKUP_D1_FIX235.cmd` korzysta ze sprawdzonego eksportu `wrangler d1 export` z FIX210 i po utworzeniu kopii wywołuje weryfikator FIX235.
- `VERIFY_D1_BACKUP_FIX235.cmd` sprawdza SHA-256 z manifestem i importuje SQL do tymczasowej bazy SQLite, następnie wykonuje `PRAGMA integrity_check`.
- `RESTORE_D1_STAGING_FIX235.cmd` odtwarza wyłącznie do jawnie wskazanej bazy z nazwą zawierającą `staging`, `stage`, `test` lub `dev`. Bazy `naprawapc-orders`, produkcyjne, `prod`, `live` i `main` są blokowane.
- Test przywracania lokalny nie zmienia zdalnej D1. Zdalne odtworzenie staging wymaga potwierdzenia nazwy i pustej bazy testowej.

Nie wykonano kopii ani przywracania na koncie użytkownika.
