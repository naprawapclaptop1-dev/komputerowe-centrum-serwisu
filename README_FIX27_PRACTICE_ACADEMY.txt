NAUKA OD A DO Z 6.8.0 FIX27
CENTRUM PRAKTYKI PRO — INSTRUKCJA
=====================================================

CEL
FIX27 dodaje do istniejącej Akademii rozbudowane Centrum Praktyki PRO.
Nie zastępuje wcześniejszych 1060 lekcji ani modułów FIX11–FIX26.
Numer wersji aplikacji pozostaje 6.8.0; numer poprawki to FIX27.

NOWE MODUŁY
1. PCB Repair Master Lab — interaktywna baza ośmiu elementów i dziennik pomiarów.
2. Real Repair Challenge — pięć scenariuszy diagnostycznych z decyzjami i oceną.
3. Schematic Center — lokalny katalog PDF/PNG/JPEG/WEBP, podgląd, markery i notatki.
4. Virtual Electronics Bench — prawo Ohma, dzielnik napięcia, stała czasowa RC i syntetyczny przebieg.
5. AI Technician Mentor — formularz kontekstu kierowany do istniejącego czatu AI; użytkownik sam sprawdza i wysyła pytanie.
6. Specialist Academies — MacBook/Apple Silicon, GPU, Server/RAID/ECC, monitory, USB-C/PD i zasilacze ATX; 36 etapów.
7. Exam Center — sześć lokalnych egzaminów po cztery pytania, próg 75%.
8. Technician Portfolio — eksport JSON i raport do druku.
9. Instructor Studio — lokalne zadania, rubryki i ocena 0–5; import/eksport JSON.
10. Knowledge Search Pro — wyszukiwarka treści nowego Centrum Praktyki.

DANE I PRYWATNOŚĆ
- Postęp, pomiary, scenariusze, egzaminy i zadania są przechowywane lokalnie w przeglądarce.
- PDF i obrazy dokumentacji są przechowywane w IndexedDB; limit pojedynczego pliku 20 MB.
- Eksport postępów nie obejmuje dokumentów binarnych z IndexedDB; eksportuj je osobno w razie potrzeby.
- FIX27 nie dodaje Google Drive, OneDrive, Dropbox ani innego zewnętrznego konektora kopii.
- Moduł praktyki nie wysyła samodzielnie plików, dokumentów ani postępów do serwera.
- AI Mentor tylko wstawia tekst do istniejącego pola czatu; wysłanie wymaga ręcznego kliknięcia.

BEZPIECZEŃSTWO I OGRANICZENIA
- To szkoleniowe modele i procedury. Nie ma automatycznego sterowania zasilaczem, programatorem, miernikiem ani płytą.
- Symulator RC/Ohma jest modelem idealnym, nie modelem konkretnej płyty.
- Schematics Center obsługuje PDF i obrazy. Nie deklaruje parsowania zastrzeżonych formatów BoardView/BRD.
- Studio instruktora działa lokalnie. Nie jest wieloosobowym panelem z rolami ani synchronizacją uczniów.
- Egzaminy są wewnętrznymi ćwiczeniami, nie akredytacją ani uprawnieniami państwowymi.
- Pomiary rezystancji i ciągłości wymagają zaznaczenia odłączenia zasilania.
- Nie traktuj podanych bloków jako wartości referencyjnych dla konkretnego modelu. Zawsze sprawdź board ID, rewizję i dokumentację.

INSTALACJA / TESTY
1. Rozpakuj pełny ZIP do osobnego folderu.
2. Zainstaluj wymagane zależności projektu zgodnie z dotychczasową instrukcją.
3. Uruchom WYKONAJ_TESTY_FIX27.cmd.
4. Przy sukcesie uruchom URUCHOM_AKADEMIE.cmd.
5. Po wdrożeniu użyj CHECK_KONTA_FIX27.cmd do odczytowej kontroli statusu kont.

PUBLIKACJA
Publikator wymaga istniejącego projektu Cloudflare Pages, zgodnego builda, kopii D1 przed oczekującą migracją oraz zgodności API. FIX27 nie dodaje nowej migracji D1. W tej paczce nie wykonano wdrożenia produkcyjnego.

POZOSTAŁA NAPRAWA LOGOWANIA
Poprzednie logi FIX24 wskazywały stage=login-password-kdf. FIX25/FIX26 dodały wspólny moduł KDF i walidację publikatora, jednak dopiero wynik testu po produkcyjnej publikacji potwierdzi, czy istniejące konto loguje się poprawnie. Nie zakładaj sukcesu na podstawie samych testów lokalnych.
