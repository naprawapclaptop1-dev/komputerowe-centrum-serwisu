NAUKA OD A DO Z — FIX118
LOCAL PHOTO LIBRARY / STATIC FIRST RENDER / PWA CACHE STORAGE
Produkt: 6.8.0
Build poprawki: 6.8.0-fix118-local-photo-library-20261110

CEL POPRAWKI
FIX118 usuwa zaleznosc pierwszego wyswietlenia 21 kuratorowanych kafelkow od asynchronicznej kolejki JavaScript. Adres kazdej fotografii jest zapisany bezposrednio w HTML, a glowny katalog zdjec rejestruje te same rekordy w swojej mapie przypisan.

CO ZMIENIONO
1. 21 unikalnych slotow strony glownej i specjalizacji ma statyczne src z manifestu oraz zachowany, podpisany fallback SVG.
2. Atrybucja autora, strony zrodla i licencji jest widoczna przy kazdym zdjeciu.
3. FIX118 rejestruje statyczne przypisania w glownym katalogu przed uruchomieniem kolejki dostawcow.
4. Service Worker przechwytuje obrazy z images.pexels.com, thumb.wikimedia.org i upload.wikimedia.org. Po udanym pobraniu zapisuje odpowiedz w Cache Storage `academy-photo-library-fix118`.
5. Nowa pamiec PWA jest niezalezna od cache aplikacji i przetrwa aktualizacje zwyklego cache aplikacji. Przy aktywacji stare cache `academy-photo-library-*` sa czyszczone, a `academy-photo-library-fix118` zostaje.
6. Zdjecia sa ladowane z niskim priorytetem, aby po pierwszym polaczeniu mogly zostac zapisane do pracy offline.
7. Na stronie glownej dodano zwijany panel kontroli: zaladowane zdjecia, ilustracje awaryjne, oczekujace sloty i liczba fotografii zapisanych w pamieci PWA. Przycisk ponawia ladowanie slotow pozostawionych na ilustracji.
8. OneClick i Auto-Watcher sprawdzaja nowy skrypt, manifest biblioteki, cache PWA i kontrakt 21 slotow przed publikacja.

ZRODLA I LICENCJE
Zdjecia pozostaja przy swoich zrodlach (Pexels / Wikimedia Commons). Manifest `WEB_PUBLISH/media/home-photo-library-fix118.json` przechowuje autora, strone zrodla, licencje, kategorie i przypisanie slotu. Nie usuwaj tych danych i nie publikuj ponownie materialow z pominięciem licencji.

JAK DZIALA PAMIEC OFFLINE
Paczka projektu zawiera manifest oraz kod obslugi lokalnej biblioteki PWA, nie zawiera kopii binarnych wszystkich 21 zewnetrznych fotografii. Pierwsze pobranie wymaga Internetu. Po pierwszym udanym pobraniu Service Worker zapisuje odpowiedz obrazu w Cache Storage tej przegladarki i moze podawac ja offline. Pamiec jest przypisana do konkretnej przegladarki i domeny; nie jest synchronizowana miedzy komputerami. Jezeli obraz nigdy nie zostal pobrany albo dostawca go odrzuci, pozostaje podpisana lokalna ilustracja SVG.

URUCHOMIENIE / TESTY
1. Wykonaj kopie folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj FIX118 do folderu projektu, zachowujac istniejaca konfiguracje.
3. Uruchom `WYKONAJ_TESTY_FIX118.cmd`.
4. Po wyniku PASS uruchom dotychczasowy bezpieczny start publikacji OneClick.
5. Po publikacji otworz strone online, rozwin panel „Kontrola biblioteki zdjec” i sprawdz 21 slotow oraz licznik pamieci offline. Przy pierwszym wdrozeniu nowy Service Worker musi zostac aktywowany; przegladarka powinna przejsc na nowy cache FIX118.

BEZPIECZENSTWO DANYCH
- Wersja produktu pozostaje 6.8.0.
- Nie dodano migracji D1 ani zmian schematu bazy.
- Nie tworzy sie nowego projektu Pages ani nowej bazy D1.
- Dotychczasowy limit Openverse i logika kolejki aktywnego widoku pozostaja bez zmian.
- Testy FIX118 nie wykonaly publikacji Cloudflare ani migracji D1.

ZAKRES WERYFIKACJI W TEJ PACZCE
53/53 testow regresji OneClick/Watcher, 10/10 kontroli skladni i 3/3 manifesty JSON. Test symuluje przechowanie nieprzezroczystej odpowiedzi obrazu cross-origin w Cache Storage i ponowne uzycie bez kolejnego pobrania sieciowego. Testy lokalne nie zastepuja koncowego testu przegladarki po wdrozeniu.
