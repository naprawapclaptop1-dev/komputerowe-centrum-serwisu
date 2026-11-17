NAPRAWA PC — AKADEMIA SERWISU PRO 3.8.7

POPRAWKA DLA HTTP 503 / database=false PO WDROŻENIU 3.8.6

W logu 3.8.6 Wrangler ostrzegał, że d1_databases na poziomie głównym nie jest dziedziczone przez env.production. Pages wdraża więc produkcję bez bindingu DB.

Wersja 3.8.7 zapisuje DB w dwóch miejscach konfiguracji:
1. główny [[d1_databases]] — zachowany dla narzędzi lokalnych;
2. [[env.production.d1_databases]] — jawny binding dla środowiska produkcyjnego Pages.

Dla JSON/JSONC analogicznie dodawane jest env.production.d1_databases.

Obserwator AUTO-PUBLISH nie rozpocznie deploymentu, jeżeli produkcyjny binding DB nie istnieje lub nie ma oczekiwanego UUID.

Docelowa baza z logu 3.8.6: naprawapc-orders
UUID: 6ac0a922-639c-43ee-ba33-5da14c25a533

Uruchamianie:
- Zatrzymaj stary obserwator klawiszami Ctrl+C.
- Rozpakuj łatkę do katalogu Akademii, zastępując pliki.
- Uruchom URUCHOM_AKADEMIE.cmd.
- Nie uruchamiaj ponownie ręcznie migracji 0001–0003. Zostały już zastosowane w 3.8.6.

Weryfikacja działania następuje po wdrożeniu przez endpoint /api/health. Sukces wymaga HTTP 200 oraz database=true i globalVisits=true.
