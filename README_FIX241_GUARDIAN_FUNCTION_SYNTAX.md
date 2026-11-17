# FIX241 — poprawka składni endpointu opiekuna i kontrola składni Pages Functions

## Przyczyna błędu wdrożenia

Wrangler zatrzymywał kompilację na `functions/api/guardians.js` przy zapytaniu SQL zawierającym `status='completed'`. Zapytanie było zapisane w literałach JavaScript ograniczonych apostrofami, więc apostrof SQL kończył literał JavaScript. Analogiczny problem występował w `INSERT` ze statusem `pending`.

## Zmiany

- Poprawiono cytowanie zapytań agregujących postęp lekcji.
- Poprawiono literały SQL wstawiania, zatwierdzania i cofania powiązania opiekuna.
- Dodano test `node --check` wszystkich plików `functions/**/*.js` (54 funkcje w pakiecie FIX239).
- Dodano integracyjny test SQL w tymczasowym SQLite na podstawie migracji 0001, 0019 i 0023.
- OneClick oraz Auto Publisher Watcher wymagają FIX241 przed uruchomieniem publikacji.

## Bezpieczeństwo i zakres

- Brak zmian w tabelach lub migracjach D1.
- Brak zmian w sekretach, `wrangler.toml`, OAuth i cache PWA.
- Nie uruchomiono publikacji Cloudflare.
- Produkt pozostaje w wersji 6.8.0.
