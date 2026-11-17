NAUKA OD A DO Z 6.8.0 — FIX112

CEL
Naprawa lokalnej kontroli HTTP FIX77, która na części konfiguracji Node.js 26 kończyła się błędem `TypeError: fetch failed / bad port` mimo poprawnego uruchomienia lokalnego serwera.

ZMIANY
1. Test lokalnego WWW używa bezpośredniego `http.request()` do 127.0.0.1; nie przechodzi przez globalny fetch ani zmienne proxy środowiskowe.
2. Port przydzielony przez system jest sprawdzany jako liczba całkowita z zakresu TCP 1–65535.
3. Test w dalszym ciągu sprawdza 32 zasoby WWW, żądanie HEAD i blokadę path traversal.
4. OneClick i Watcher uruchamiają dodatkową regresję FIX112; test symuluje wadliwy HTTP_PROXY/HTTPS_PROXY.
5. Nie zmieniono silnika zdjęć FIX111, Service Workera/cache FIX109, projektu Pages, bindingu D1, migracji ani danych użytkowników.

TESTY
Uruchom `WYKONAJ_TESTY_FIX112.cmd`. Raport: `RAPORT_FIX112_TESTY.log`.

PUBLIKACJA
Po pozytywnym wyniku uruchom dotychczasowy bezpieczny start publikacji. Błąd HTTP preflight był lokalny; poprzednia próba zatrzymała się przed migracjami D1 i przed publikacją.

Wersja produktu: 6.8.0 (bez zmiany).
