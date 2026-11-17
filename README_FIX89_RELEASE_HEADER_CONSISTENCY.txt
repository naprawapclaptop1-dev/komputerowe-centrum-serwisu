NAUKA OD A DO Z — FIX89

Naprawa testu, który wymagał historycznego nagłówka FIX87, choć Auto-Watcher był
już oznaczony jako FIX88. Kontrakt testu jest teraz powiązany z WEB_PUBLISH/release.json.
OneClick, Auto-Watcher, index.html oraz release.json wskazują FIX89.

URUCHOMIENIE
1. Rozpakuj całe archiwum do katalogu roboczego.
2. Sprawdź, czy Node.js jest dostępny w PATH.
3. Uruchom WYKONAJ_TESTY_FIX89.cmd.
4. Jeśli testy przejdą, uruchom URUCHOM_AKADEMIE.cmd.
5. Pozostaw okno Watchera otwarte i sprawdź potwierdzenie stałej domeny produkcyjnej.

WERYFIKACJA
96/96 testów PASS na Node.js v22.16.0.
Node.js v24.19.0 należy sprawdzić lokalnie poleceniem z punktu 3.

BEZPIECZEŃSTWO
- Produkcyjny Direct Upload nie używa --branch ani --env.
- Baza D1 i jej migracje nie zostały zmienione przez FIX89.
- Sekretów i tokenów nie wpisuj do plików źródłowych ani logów.
- Publikacja jest udana dopiero po potwierdzeniu FIX89 na stałym adresie Pages.

Wersja produktu: 6.8.0
Poprawka: FIX89
