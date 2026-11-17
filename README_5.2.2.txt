NAPRAWA PC — AKADEMIA SERWISU PRO 5.2.2 ULTRA SERVICE CENTER

AKTUALIZACJA ISTNIEJĄCEGO PROJEKTU. NIE TWÓRZ NOWEGO PAGES ANI D1.

INSTALACJA
1. Zatrzymaj stary obserwator: Ctrl+C.
2. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj zawartość ZIP do G:\AKADEMIA_SERWISU_PRO, scalając i nadpisując pliki projektu.
4. Zachowaj swój lokalny TOOLS_CLOUDFLARE, wrangler.toml, BACKUPS_D1 oraz lokalne sekrety.
5. Uruchom URUCHOM_AKADEMIE.cmd.
6. Publikator sprawdza pełny pakiet, potwierdza istniejący projekt i binding D1, wykonuje kopię bazy, stosuje wyłącznie oczekujące migracje i dopiero potem uruchamia publikację.
7. Po publikacji obserwator sprawdza stały adres produkcyjny, a nie sam adres preview.

NOWE FUNKCJE
- 800 lekcji szkoleniowych w dziesięciu obszarach napraw.
- Katalog 33 producentów i 150 modeli referencyjnych laptopów, komputerów stacjonarnych, mini-PC, workstation i AIO.
- Formularz rejestracji i logowania e-mail/hasło; hasło 12–128 znaków, skrót PBKDF2-HMAC-SHA256.
- Publiczny katalog marek/modeli i społecznościowe zgłoszenia dokładnych modeli z moderacją.
- Statystyki: wizyty/sesje, unikalne anonimowe identyfikatory sesji, odsłony, ruch dzienny/tygodniowy/miesięczny, profile, konta e-mail, uczniowie z postępem, otwarcia i ukończenia lekcji, odtworzenia filmów, przypadki i modele.
- Rozbudowana sekcja „Dlaczego warto wspierać Akademię?” z filmem, polskimi napisami i informacją o dobrowolnym wsparciu.

- Strona „Wesprzyj Akademię”: wyjaśnienie celu wpłat, sześć obszarów rozwoju, FAQ, inne sposoby pomocy, film 33 s z polską narracją i napisami.

BAZA I PRYWATNOŚĆ
- Migracje 0006 i 0007 są addytywne. 0007 tworzy tabelę skrótów losowych identyfikatorów sesji i uzupełnia ją z zachowanej historii sesji; nie zmienia liczników dziennych.
- Licznik mierzy anonimowe sesje przeglądarki, nie potwierdzoną liczbę osób. Nie zapisuje surowego IP, user-agenta ani fingerprintu.
- Statystyki postępów dotyczą tylko profili, które wyraziły odrębną zgodę na synchronizację w chmurze.
- Rejestracja e-mail nie obejmuje weryfikacji skrzynki ani resetu hasła e-mailem w tym wydaniu; użytkownik musi zachować swoje unikalne hasło.
- Modele referencyjne są rodzinami/handlowymi przykładami; numer płyty i rewizję trzeba potwierdzić na urządzeniu. Wpisy społeczności przechodzą moderację.

Publikacja produkcyjna nie jest wykonywana z poziomu tego archiwum. Uruchomienie lokalnego publikatora w istniejącym środowisku Cloudflare potwierdzi wdrożenie.
