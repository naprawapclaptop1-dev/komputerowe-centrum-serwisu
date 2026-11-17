FIX11 — NAUKA OD A DO Z 6.2.0

CO DODANO
- Otwórz: Laboratorium pomiarów PRO.
- Pod symulatorem znajduje się Dziennik pomiarów serwisowych.
- Dodaj typ urządzenia, model, Board ID, rewizję, punkt, rodzaj pomiaru, jednostkę, stan zasilania, odczyt i źródło dokumentacji.
- Zakres referencyjny jest opcjonalny, ale jeśli go używasz, podaj obie granice. Dziennik nie dobiera automatycznie wartości napięć.
- Eksport CSV zapisuje lokalną historię do arkusza kalkulacyjnego.
- Dziennik jest uwzględniany w kopii postępu JSON w sekcji Moje konto.

BEZPIECZEŃSTWO
Pomiar rezystancji, ciągłości i test diody wymagają odłączenia i odizolowania wszystkich źródeł zasilania, w tym baterii. Moduł nie steruje fizycznym miernikiem, zasilaczem ani płytą. Wartości referencyjne sprawdzaj w dokumentacji dokładnego modelu i rewizji.

POPRAWKA PUBLIKACJI
Watcher nie opiera już kontroli filmu na HEAD + Content-Length. Wykonuje GET z Range, sprawdza Content-Range/Content-Length i ma ograniczony odczyt awaryjny. Nowy moduł pomiarów jest również sprawdzany pod stałym adresem Pages.

URUCHOMIENIE
Zachowaj strukturę katalogów. Uruchom istniejący plik URUCHOM_AKADEMIE.cmd albo URUCHOM_NAUKE_OD_A_DO_Z.cmd zgodnie z dotychczasową procedurą projektu. Nie uruchamiaj kilku watcherów jednocześnie.

STATUS
Testy automatyczne: 16/16 PASS. W tym pakiecie nie wykonano publikacji produkcyjnej Cloudflare i nie zmieniano bazy D1. Po publikacji watcher musi potwierdzić wersję na stałym adresie naprawa-pc-akademia-serwisu-pro.pages.dev; adres preview hash.pages.dev nie jest adresem docelowym.
