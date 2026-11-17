NAUKA OD A DO Z — FIX117
Rejestracja zdjęć pierwszego renderu w katalogu zdjęć

DLACZEGO TA POPRAWKA JEST POTRZEBNA
FIX116 przypisywał zdjęcia z manifestu do elementów IMG, ale nie przekazywał kompletnych rekordów do Mapy assignments runtime katalogu. Kiedy kolejka uruchamiała się później, mogła uznać te same sloty za nieprzypisane i wrócić do lokalnych SVG. FIX117 naprawia właśnie ten brakujący krok.

CO ROBI FIX117
- Bootstrap eksportuje kompletne rekordy wszystkich 21 głównych slotów.
- Katalog ponownie sprawdza adres HTTPS, format rastrowy, licencję, kategorię/temat, właściciela slota i globalną unikalność.
- Poprawne rekordy trafiają do Mapy assignments oraz trwałego assignmentState.
- Rezerwowane są providerId, strona źródłowa i adres obrazu, aby inne karty nie mogły przejąć zdjęcia.
- Kolejka wykorzystuje zapisane przypisanie i nie przywraca SVG tylko dlatego, że nie znalazła kolejnego wyniku online.
- Pięć problematycznych slotów z ostatnich zrzutów jest sprawdzanych indywidualnie: 07, 08, 11, 12 i 19.

INSTALACJA
1. Wykonaj kopię folderu `G:\AKADEMIA_SERWISU_PRO`.
2. Rozpakuj całe archiwum FIX117 do tego samego katalogu projektu, zachowując strukturę folderów i nadpisując zmienione pliki.
3. Uruchom `WYKONAJ_TESTY_FIX117.cmd`.
4. Wymagany wynik: 54/54 testy, 6/6 kontroli składni i 2/2 manifesty JSON.
5. Dopiero po PASS uruchom standardowy bezpieczny start publikacji OneClick. Nie uruchamiaj osobnych migracji ręcznie.
6. Po publikacji otwórz stronę w nowym odświeżeniu i sprawdź karty 07, 08, 11, 12, 19 oraz sześć kart w „Specjalizacje serwisowe PRO”.

KONTROLA PO WDROŻENIU
W konsoli przeglądarki sprawdź:
`window.NPA_PHOTO_CATALOG_FIX117?.getStats()?.primedHomeAssignments`
Oczekiwana wartość po prawidłowej rejestracji: 21.
Można też sprawdzić:
`window.NPA_HOME_PHOTO_PRIME_FIX117?.slots`
Oczekiwana wartość: 21.
Jeżeli obraz zewnętrzny rzeczywiście nie może się załadować, pozostaje podpisana ilustracja SVG. Nie jest ona liczona jako fotografia.

BEZPIECZEŃSTWO I ZACHOWANE DANE
- Produkt nadal ma wersję 6.8.0.
- Nie twórz nowego projektu Pages ani nowej bazy D1.
- Nie zmieniaj bindingu D1 ani sekretów Cloudflare/OpenAI.
- Nie resetuj bazy, kont, postępów ani danych przeglądarki.
- Nazwa cache PWA FIX109 została zachowana, aby nie wymuszać niepotrzebnego resetu offline.

TESTY
Pełny raport: `RAPORT_FIX117_TESTY.log`
Zmiany: `CHANGELOG_6.8.0_FIX117.txt`
Szczegółowy wykaz: `FIX117_FILE_CHANGE_REPORT.txt`
Test nowej rejestracji: `scripts/test-homepage-photo-prime-registration-fix117.mjs`

OGRANICZENIA WERYFIKACJI
Testy uruchomiono w środowisku roboczym Node.js v22.16.0. Nie wykonano jeszcze produkcyjnej publikacji ani końcowego testu na komputerze użytkownika z Node.js v26.13.0. Publikację trzeba potwierdzić nowym logiem OneClick/Watchera.
