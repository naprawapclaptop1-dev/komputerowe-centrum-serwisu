NAUKA OD A DO Z 6.8.0 FIX30 — INSTRUKCJA

INSTALACJA
1. Rozpakuj całe archiwum do nowego folderu, np. G:\AKADEMIA_SERWISU_PRO_FIX30.
2. Nie mieszaj zawartości FIX30 z FIX28/FIX29 ani starszym folderem.
3. Uruchom WYKONAJ_TESTY_FIX30.cmd. Nie publikuj, jeśli którykolwiek test zgłosi błąd.
4. Uruchom URUCHOM_AKADEMIE.cmd, aby przejść przez dotychczasowy kontrolowany proces publikacji.
5. Przed migracją publikator powinien wykonać kopię istniejącej D1 do BACKUPS_D1. Jeśli kopia się nie powiedzie lub będzie pusta, migracja ma zostać przerwana.
6. Po publikacji uruchom CHECK_KONTA_FIX30.cmd. To test negatywny z fikcyjnym adresem example.invalid; nie rejestruje konta.

CO SPRAWDZIĆ RĘCZNIE W PRZEGLĄDARCE
- Kliknij Pulpit, Kursy, Laboratoria, Centrum Praktyki, Wiedza i pozostałe pozycje menu.
- Po każdym kliknięciu sprawdź, czy zmienia się zawartość i aktywna pozycja menu.
- Na telefonie otwórz menu, wybierz widok i sprawdź, czy menu się zamyka.
- Sprawdź 6 slajdów na stronie startowej — każde zdjęcie powinno być inne.
- Sprawdź 13 kart modułów — 12 fotografii/źródeł i 10 osobnych grafik SVG zostało przygotowanych jako unikalne elementy.
- Otwórz kilka kursów i galerii; po wykorzystaniu puli zdjęć karta powinna otrzymać unikalną ilustrację techniczną, a nie powtórzone zdjęcie.

WAŻNE
- FIX30 jest lokalnie przetestowany; nie został jeszcze opublikowany na Cloudflare.
- Nie wykonano migracji produkcyjnej D1.
- Nie wpisuj haseł, Client Secret, tokenów ani kluczy API do czatu lub logów.
- Nie przywracaj Google Drive, OneDrive ani Dropbox. Te integracje nie należą do Akademii.
- W porównaniu z FIX29 nie usunięto żadnego pliku. Sześć powtarzalnych kafli ścieżki nauki zostało uporządkowanych w trzy etapy, ale wszystkie moduły pozostają dostępne.
- Środowisko budowania blokowało lokalny test Chromium (ERR_BLOCKED_BY_ADMINISTRATOR), dlatego sprawdzenie rzeczywistych kliknięć w przeglądarce Windows pozostaje końcową kontrolą użytkownika.
