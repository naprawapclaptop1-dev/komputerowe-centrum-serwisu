AKADEMIA SERWISU PRO 5.0.1 — NAVIGATION & SIDEBAR FIX

Ta aktualizacja naprawia problem, przez który szybkie procedury i część przycisków nie działały.

Przyczyna: brak opcjonalnego elementu #startDiagnosis powodował wyjątek podczas podpinania zdarzeń. W efekcie kolejne kontrolki nie otrzymywały obsługi. Dodano bezpieczne podpinanie zdarzeń i niezależną nawigację awaryjną dla przycisku „Pokaż wszystkie naprawy” oraz pozycji szybkich procedur.

Dodatkowo poprawiono przewijanie i wysokość bocznego panelu, zawijanie opisów procedur, wygląd przycisku pełnej bazy oraz zamykanie menu na urządzeniach mobilnych.

AKTUALIZACJA ISTNIEJĄCEGO PROJEKTU:
1. Zatrzymaj obserwator klawiszami Ctrl+C.
2. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj ZIP do folderu tymczasowego.
4. Scal zawartość folderu projektu z G:\AKADEMIA_SERWISU_PRO i zezwól na zastąpienie plików.
5. NIE usuwaj ani nie zastępuj własnych: TOOLS_CLOUDFLARE, wrangler.toml, BACKUPS_D1 ani lokalnych sekretów/konfiguracji.
6. Uruchom URUCHOM_AKADEMIE.cmd.
7. Po publikacji odśwież stronę przez Ctrl+F5. Service Worker otrzymał nowy cache 5.0.1.

Nie dodano migracji D1 ani nie zmieniono istniejących tabel. Nie twórz nowej bazy i nie kasuj danych.

Uwaga: lokalne kontrole kodu i nawigacji przeszły. Publikacja produkcyjna wymaga uruchomienia na komputerze właściciela, na którym znajduje się aktywna sesja Wrangler.
