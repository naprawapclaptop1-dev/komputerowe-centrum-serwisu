NAPRAWA PC — AKADEMIA SERWISU PRO 4.5.0

AKTUALIZACJA
1. Zatrzymaj poprzedni obserwator Ctrl+C.
2. Zrób kopię lokalnego folderu projektu.
3. Rozpakuj ZIP i scal jego zawartość z dotychczasowym G:\AKADEMIA_SERWISU_PRO.
4. Zachowaj TOOLS_CLOUDFLARE, aktywny wrangler.toml, BACKUPS_D1 i własne konfiguracje.
5. Uruchom URUCHOM_AKADEMIE.cmd.
6. Poczekaj na potwierdzenie stałego adresu produkcyjnego w logu. Sam adres preview nie potwierdza publikacji produkcyjnej.

NOWE
- Sekwencja zasilania, USB-C PD, odzyskiwanie danych, ESD, magazyn części.
- Ręczny Inspektor zdjęć PCB, panel instruktora, eksport/import JSON.
- Opcjonalna synchronizacja konta przez /api/state po zalogowaniu i zgodzie.
- Tryb offline rdzenia strony przez Service Worker i druk kart napraw do PDF.

DANE
- Nie dodano destrukcyjnych migracji ani nowej bazy D1.
- Dane nowych modułów są lokalne do czasu eksportu lub opcjonalnej synchronizacji konta.
- Import kopii scala wpisy po identyfikatorach; zawsze przechowuj dodatkową kopię JSON.

OGRANICZENIA
- Symulatory są edukacyjne; odczyty nie pochodzą z fizycznego miernika.
- Inspektor PCB umożliwia ręczne oznaczanie zdjęcia; nie wykonuje automatycznego rozpoznawania AI.
- Tryb offline wymaga pierwszego poprawnego otwarcia strony online. API i logowanie wymagają sieci.
- Wydruk do PDF używa standardowego okna drukowania przeglądarki.

UWAGA DOT. KOMUNIKATU „NIE UDAŁO SIĘ WYKONAĆ TEJ CZYNNOŚCI”
Na przesłanym zrzucie komunikat jest widoczny w interfejsie ChatGPT nad treścią odpowiedzi, nie wewnątrz strony Akademii. Nie jest to potwierdzony błąd endpointu Cloudflare ani nowego modułu. Jeśli pojawi się na stronie Akademii po wdrożeniu, zapisz adres modułu, godzinę i odpowiedź z zakładki Network/Console.
