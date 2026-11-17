NAUKA OD A DO Z — FIX50 PHOTO RELIABILITY
Wersja platformy: 6.8.0
Build: 6.8.0-fix50-photo-reliability-20261105
Punkt bazowy: FIX49 (archiwum wejściowe)
Stan paczki: 856 plików; zachowano wszystkie 834 pliki bazowe, dodano 22 pliki, zmodyfikowano 59 plików bazowych, nie usunięto żadnego pliku bazowego.

CEL WYDANIA
Naprawa pustych fotografii w katalogu usterek. Zdjęcia lokalne są pokazywane od pierwszego renderowania. Zdjęcia pobrane z Internetu są wyłącznie opcjonalnym ulepszeniem lokalnego zestawu.

CO ZMIENIONO
1. Dodano lokalny dobór fotografii zależnie od kategorii usterki.
2. Każda karta otrzymuje 3 różne zdjęcia z lokalnej puli już przed rozpoczęciem pobierania online.
3. Karty listy i galeria szczegółów nie czekają na zewnętrzne API, aby wyświetlić obrazy.
4. Blokada odczytu pikseli canvas przez CORS nie odrzuca obrazu, który przeglądarka prawidłowo załadowała. DHash jest kontrolą pomocniczą, a nie warunkiem renderowania.
5. Po błędzie pobierania/ładowania zdjęcia online przywracany jest lokalny obraz.
6. W trybie offline lokalne obrazy pozostają dostępne i silnik nie wywołuje zewnętrznych dostawców fotografii.
7. Service Worker otrzymał nowy namespace cache i pre-cache lokalnych fotografii.
8. Ujednolicono build ID w release.json, HTML i endpointzie statusu kont.
9. Zachowano historyczny manifest FIX49 i jego moduł Quality Center. Bieżący wydaniem zarządza osobny kontrakt FIX50.

LOKALNE ZDJĘCIA
12 plików JPG w WEB_PUBLISH/media. Manifest FIX50 i test kontraktu sprawdzają ich obecność i rozmiar. Trzy sloty pojedynczej karty są różne; fotografie mogą być ponownie użyte w innych kartach jako bezpieczny fallback.

JAK TESTOWAĆ W WINDOWS
1. Rozpakuj ZIP do nowego folderu, np. G:\AKADEMIA_SERWISU_PRO_FIX50.
2. Nie nadpisuj FIX49 ani kopii D1.
3. Uruchom WYKONAJ_TESTY_FIX50.cmd.
4. Sprawdź TEST_REPORT_6.8.0_FIX50.txt i TEST_LOG_6.8.0_FIX50.txt.
5. Otwórz lokalną stronę w przeglądarce i sprawdź katalog usterek, widok szczegółów oraz tryb offline.
6. Przed publikacją wykonaj oddzielny przegląd operatora i potwierdź środowisko preview.

ŚRODOWISKO
W czasie przygotowania i testów lokalnych: Node.js v22.16.0. W instrukcji historycznej FIX49 wskazano Node.js 24.19.0 dla docelowej stacji Windows; należy uruchomić runner także na docelowym środowisku. Testy składni i testy Node nie zastępują pełnego E2E w rzeczywistej przeglądarce.

BEZPIECZEŃSTWO I DANE
- Oryginalny FIX49 pozostał bez zmian.
- Nie wykonano publikacji produkcyjnej.
- Nie uruchamiano migracji D1 ani nie modyfikowano bazy.
- Nie rekonfigurowano OpenAI, Cloudflare ani sekretów.
- Nie dodawano zależności npm do naprawy zdjęć.
- Testy są lokalne i nie wymagają prawdziwego połączenia z API fotografii dla fallbacku.

WAŻNE OGRANICZENIE
Nie potwierdzono w tej sesji testu na Windows 10/11 z Node 24.19.0 ani ręcznej inspekcji w Chrome/Edge. Raport jasno rozdziela testy uruchomione lokalnie od testów wymagających komputera docelowego.
