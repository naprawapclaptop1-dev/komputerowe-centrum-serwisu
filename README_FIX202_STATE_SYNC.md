# FIX202 — Synchronizacja stanu

Automatyczna synchronizacja obejmuje 16 kluczy localStorage. Zmiany w tej samej karcie są wykrywane przez opakowanie `Storage.setItem`, a zmiany w innych kartach przez zdarzenie `storage`. Synchronizacja jest opóźniona o 650 ms. Podczas pobierania chmury zapis zwrotny jest wstrzymany, aby uniknąć echa. Po zalogowaniu najpierw pobierany i scalany jest stan chmurowy, a dopiero później wysyłany jest stan lokalny.

Stan większy niż 42 000 znaków JSON jest pomijany i nie jest automatycznie dzielony. Historia czatu nadal używa dedykowanego endpointu rozmów. Wymagana jest aktywna sesja i zgoda. Testy kodu nie stanowią potwierdzenia synchronizacji na dwóch prawdziwych urządzeniach produkcyjnych.
