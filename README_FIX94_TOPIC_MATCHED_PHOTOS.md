# NAUKA OD A DO Z — FIX94

## Cel poprawki

FIX94 koryguje dopasowanie prawdziwych fotografii do treści kafelków, slajdów i lekcji. Wcześniejsze wydania mogły przypisywać legalnie używalne, ale tematycznie błędne zdjęcia (np. rozmyte światła do USB-C albo stary nośnik do RAM). Nowy katalog wymaga zgodności tematu w tytule, tagach lub opisie fotografii.

## Najważniejsze zmiany

- **USB-C:** akceptowane jest zdjęcie portu/złącza USB-C w laptopie lub komputera. Odrzucane są porty w autobusach, pociągach i na stacjach, rozmyte światła oraz niepowiązane akcesoria.
- **RAM:** wymagane jest potwierdzenie pamięci komputerowej DDR/DIMM/SO-DIMM. Karty SD, pamięci flash, kartridże, dyskietki, kasety i stare nośniki są odrzucane.
- **VRAM:** wymagane są kości GDDR/HBM/VRAM lub jednoznaczna informacja o pamięci graficznej. Moduły DIMM/SO-DIMM/UDIMM i zwykły RAM są odrzucane. Samo słowo BGA nie wystarcza.
- **GPU i chłodzenie:** osobne zdjęcia karty graficznej, układów GPU oraz chłodzenia.
- **Lutowanie:** fotografia musi przedstawiać lutowanie elementów na elektronice/PCB, a nie dowolny obraz warsztatu.
- **Strona główna:** osobne kategorie USB-C, GPU i RAM w nagłówku; sześć slajdów ma osobne kategorie i identyfikatory; karta laboratorium lutowania wymusza prawdziwe źródło online.
- **Unikalność:** 19 ręcznie sprawdzonych seedów ma różne identyfikatory i URL-e. Katalog nadal pilnuje globalnego pojedynczego przydziału zdjęcia do slotu oraz kontroli pHash tam, gdzie przeglądarka pozwala odczytać piksele.
- **Stare przypisania:** nowa przestrzeń magazynowania FIX94 nie odzyskuje błędnych przypisań FIX93. Stare stany wyczerpania zapytań są ponownie otwierane.
- **PWA:** osobny cache FIX94; film wsparcia, plakat, napisy i dotychczasowe moduły offline zostają w precache.

## Zweryfikowane źródła

Manifest `WEB_PUBLISH/media/photo-sources-online.json` ma 19 rekordów, każdy z HTTPS asset URL, stroną źródłową, autorem i licencją. Raport CSV `FIX94_PHOTO_SOURCES.csv` zawiera czytelny spis. Nowe ręcznie wskazane źródła obejmują: port USB-C laptopa, moduły RAM DIMM/SO-DIMM, osobne kości GDDR3, kartę GPU, chłodzenie GPU i lutowanie PCB.

Zdjęcia zewnętrzne są ładowane online; pliki zdalne nie zostały w całości pobrane do ZIP. Przy braku Internetu lub niedostępności źródła platforma pokazuje **wyraźnie opisaną ilustrację techniczną offline**, której nie zalicza do fotografii.

## Uruchomienie

1. Rozpakuj cały ZIP do nowego katalogu.
2. Uruchom `WYKONAJ_TESTY_FIX94.cmd`.
3. Jeśli testy przejdą, uruchom `URUCHOM_AKADEMIE.cmd`.
4. Po publikacji otwórz stały adres Pages i wykonaj `Ctrl+F5`. Nowy Service Worker ma odrębny cache FIX94.
5. Sprawdź trzy zdjęcia nagłówka, sześć slajdów oraz kafelki modułów. Licznik ma obejmować tylko prawidłowo zdekodowane fotografie, nie SVG.

## Ważne ograniczenia testów

- Testy automatyczne wykonano w środowisku Node.js **v22.16.0**. Node.js v24.19.0 na komputerze docelowym nie został tu uruchomiony.
- Nie wykonano rzeczywistej publikacji Cloudflare ani testu produkcyjnego po wdrożeniu. Nie oznacza to, że zdjęcia są już widoczne na stałej domenie.
- Nie zmieniono bazy D1, sekretu `OPENAI_API_KEY` ani migracji. Migracje 0008 i 0009 pozostają historycznie oznaczone do ręcznego przeglądu; nie wykonano żadnego SQL.
- Przy pełnym katalogu 1800+ slotów pobieranie jest progresywne i zależy od dostępności źródeł, licencji oraz limitów API. FIX94 nie twierdzi, że wszystkie fotografie są już pobrane.
