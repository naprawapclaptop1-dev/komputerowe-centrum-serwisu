NAUKA OD A DO Z — FIX93
Instrukcja kontroli i publikacji

CEL POPRAWKI
FIX93 usuwa konflikt pomiędzy katalogiem fotografii online a historycznymi mechanizmami FIX77/FIX83, które mogły zastępować zdjęcia SVG. Poprawka jest w kodzie źródłowym i jest podłączona do OneClick oraz Auto-Watchera.

CO ZOSTAŁO ZMIENIONE
- Ochrona slotów fotografii w rzeczywistych wrapperach strony: .photo-credit-fix90, .np640-photo-credit, figcaption.
- Odzyskiwanie brakującego ID slotu z podpisu lub kontekstu kafelka.
- Katalog jako właściciel onerror dla zdjęć katalogowych.
- Handlery i markery ustawiane przed src.
- Bezpośrednie ładowanie obrazu docelowego bez osobnego długiego probe.
- Próba oryginalnego URL przed fallbackiem.
- Licznik zlicza wyłącznie zdekodowane fotografie rastrowe (min. 320x180); SVG nie jest zdjęciem.
- Testy i publikator wymagają zgodności FIX77/FIX83 z katalogiem FIX93.

URUCHOMIENIE NA WINDOWS
1. Rozpakuj całe archiwum do osobnego katalogu, np. G:\AKADEMIA_SERWISU_PRO_FIX93.
2. Otwórz katalog i uruchom WYKONAJ_TESTY_FIX93.cmd.
3. Oczekiwany wynik: FIX93 TEST SUMMARY: 130/130 PASS.
4. Dopiero po zaliczeniu testów uruchom URUCHOM_AKADEMIE.cmd.
5. Pozostaw okno obserwatora otwarte zgodnie z komunikatem OneClick.
6. Po publikacji otwórz stały adres Pages i wykonaj Ctrl+F5.

CO SPRAWDZIĆ PO PUBLIKACJI
- W DevTools / Elements sprawdź, że obrazy katalogowe mają HTTPS URL prowadzący do JPG/JPEG/PNG/WebP/AVIF, a nie .svg i nie data:image/svg+xml.
- Sprawdź naturalWidth/naturalHeight. Licznik FIX93 zwiększa się dopiero po poprawnym dekodowaniu fotografii >= 320x180.
- Podpis pod zdjęciem musi podawać autora, źródło i licencję; kliknięcie źródła ma prowadzić do strony oryginalnej.
- Jeżeli dostawca nie zwróci odpowiedniego zdjęcia lub zdjęcie nie przejdzie walidacji, może pozostać wyraźnie oznaczona ilustracja techniczna. Nie jest ona liczona jako fotografia.
- Zweryfikuj stały adres produkcyjny, a nie losowy URL preview/deploymentu.

WAŻNE OGRANICZENIA WERYFIKACJI
- W tym pakiecie wykonano 130/130 testów regresyjnych na Node.js v22.16.0.
- Lokalny test OneClick verifyWeb() przeszedł; nie połączył się z Cloudflare i nie uruchomił migracji.
- Nie uruchomiono testów na Node.js v24.19.0 użytkownika.
- Nie wykonano rzeczywistego wdrożenia Cloudflare z tego środowiska.
- Kontrola DOM publicznej strony przed wdrożeniem FIX93 wykazała 6/6 obrazów jako SVG. Po poprawce konieczna jest ponowna kontrola już po wdrożeniu; nie należy traktować lokalnych testów jako dowodu, że produkcja została zaktualizowana.
- Nie zmieniono bazy D1, migracji ani sekretów.

WERSJE
Produkt: 6.8.0
Hotfix: FIX93
Runtime zdjęć: assets/photo-catalog-fix93.js?v=6.8.0-fix93
