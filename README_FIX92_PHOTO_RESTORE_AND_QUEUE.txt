NAUKA OD A DO Z — FIX92
NAPRAWA ODTWARZANIA FOTOGRAFII I KOLEJKI KATALOGU

CO NAPRAWIA FIX92
Na zrzucie strony licznik pozostawał na „5 przypisanych” oraz tysiącach pozycji bez zdjęcia. W kodzie występowały dwa niezależne problemy:
- część etykiet licencji Openverse była zapisana jako „CC CC0” i odrzucana przy kolejnym uruchomieniu;
- stan FIX91 mógł oznaczyć kategorię jako „exhausted”, a po odświeżeniu blokować jej ponowne wyszukiwanie.

FIX92 odtwarza zapisane zdjęcia z kanoniczną etykietą licencji, migruje stan FIX91 do nowego klucza paginacji i ponownie otwiera kategorie z historycznym stanem „exhausted”. Zachowuje również zapisane pule kandydatów.

URUCHOMIENIE
1. Rozpakuj całe archiwum FIX92 do nowego katalogu.
2. Uruchom WYKONAJ_TESTY_FIX92.cmd.
3. Gdy testy zakończą się poprawnie, uruchom URUCHOM_AKADEMIE.cmd.
4. Po opublikowaniu odśwież stronę Ctrl+F5, aby przeglądarka pobrała nowy Service Worker i nowy runtime zdjęć.
5. Pozostaw stronę online. Katalog ma priorytetowo obsłużyć 3 zdjęcia hero, 6 slajdów i 6 nowych kafelków strony głównej; następnie przetwarza pozostałe aktualnie załadowane sloty. Kolejne lekcje są dodawane do kolejki po otwarciu ich widoku.

CO POWINIENEŚ ZOBACZYĆ
- Zapisane fotografie z poprzednich sesji powinny być znowu widoczne, także te z dawną etykietą „CC CC0”.
- W podpisie licencji etykieta powinna być już kanoniczna, np. „CC0”, nie „CC CC0”.
- Licznik ma uwzględniać odtworzone fotografie oraz kolejkę; nie powinien pozostawać zablokowany wyłącznie przez stary stan kategorii.
- Zdjęcie VRAM zostanie zaakceptowane tylko wtedy, gdy opis/tytuł wskazuje na GDDR/HBM/pamięć graficzną. Moduły DIMM/SO-DIMM i samo BGA nie są dowodem VRAM.

WAŻNE O LIMITACH I ZDJĘCIACH
FIX92 naprawia zapis i ponawianie. Nie oznacza to, że wszystkie 1843+ zdjęcia zostaną pobrane w jednej chwili ani że archiwum zawiera 1843 zdjęcia. Runtime pobiera kandydatów stopniowo z licencjonowanych źródeł. Openverse ma lokalny budżet 180 zapytań dziennie na przeglądarkę; po jego osiągnięciu kolejka zachowuje postęp, używa Commons, a pozostałe zapytania Openverse odracza. Jeżeli nie ma odpowiedniej fotografii lub licencja/plik nie przejdzie kontroli, na miejscu pozostaje podpisana ilustracja techniczna offline. Nie jest ona liczona jako zdjęcie.

BEZPIECZEŃSTWO
- Nie wprowadzono migracji D1.
- Nie zmieniono bazy D1, danych kont ani sekretu OPENAI_API_KEY.
- Produkcyjne wdrożenie nie zostało wykonane podczas przygotowania tego archiwum.

TESTY
Uruchomienie WYKONAJ_TESTY_FIX92.cmd wykonuje 92 testy bazowe, 4 testy spójności wersji oraz 18 testów katalogu zdjęć. Oczekiwany wynik: 114/114 PASS.
Środowisko testowe tego pakietu: Node.js 22.16.0. Użytkownik używa Node.js 24.19.0 — test na tej wersji należy wykonać lokalnie przed publikacją.
