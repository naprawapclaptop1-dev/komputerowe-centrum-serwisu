# FIX131 — zdjęcia przez ten sam adres strony

FIX131 usuwa zależność 19 głównych zdjęć sprzętu od bezpośrednich żądań przeglądarki do zewnętrznych CDN. Strona pobiera `/media/photos/{seedId}.jpg` z własnej domeny. Cloudflare Pages Function pobiera obraz wyłącznie z zamkniętej listy 19 identyfikatorów i trzech dozwolonych hostów Pexels/Wikimedia, weryfikuje typ MIME i ustawia cache.

Service Worker zapisuje poprawnie pobrane obrazy w `academy-photo-library-fix131` i podaje je offline. Nieudane żądanie zostawia lokalny SVG jako wyraźnie oznaczoną ilustrację; etykieta „Fotografia sprzętu” pojawia się dopiero po dekodowaniu obrazu o wymiarach co najmniej 320×180.

## Testy

Uruchom `node scripts/run-tests-fix131.mjs` albo `WYKONAJ_TESTY_FIX131.cmd`.

## Wdrożenie

Uruchom `URUCHOM_NAUKE_OD_A_DO_Z.cmd` z katalogu pełnego projektu. Publikacja musi obejmować katalog `functions/` i `WEB_PUBLISH/`. Po wdrożeniu otwórz stronę w nowej karcie lub wykonaj twarde odświeżenie. Testy lokalne nie potwierdzają automatycznie działania upstream Pexels/Wikimedia na koncie Cloudflare.

Produkt pozostaje w wersji 6.8.0. FIX131 nie zmienia D1, kont, haseł, sekretów ani danych nauki.

## Co sprawdza dodatkowy test FIX131

Test porównuje każdy z 19 wpisów manifestu z dokładnym adresem źródłowym w zamkniętej liście funkcji Pages. Test wydania sprawdza też odpowiedzi proxy (status, MIME i nagłówek `X-Photo-Delivery`) podczas kontroli produkcyjnej Watchera. Sam test lokalny korzysta z kontrolowanych odpowiedzi testowych i nie dowodzi, że konto Cloudflare może pobrać każde zewnętrzne zdjęcie.
