NAUKA OD A DO Z — PEŁNY PROJEKT FIX63
GLOBAL ACADEMY PRO | Produkt 6.8.0

Ten pełny projekt zawiera FIX51, FIX54–FIX60, FIX61, FIX62 i FIX63.

NAJWAŻNIEJSZA POPRAWKA FIX63
Poprzedni log pokazał, że Wrangler 4.156.0 nie zwracał production_branch na liście Pages. FIX63 odpytuje wtedy oficjalny endpoint Cloudflare Pages API dla dokładnego konta i projektu, używając istniejącego CLOUDFLARE_API_TOKEN lub oauth_token z profilu Wrangler. Odczytana gałąź trafia do `wrangler pages deploy --branch`.

Token jest używany wyłącznie w pamięci procesu. Nie jest wypisywany, nie jest kopiowany do ZIP i nie jest zapisywany w plikach projektu.

URUCHOMIENIE
1. Zachowaj kopię dotychczasowego G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj pełny ZIP do G:\AKADEMIA_SERWISU_PRO, scalając katalogi i nadpisując pliki aplikacji.
3. Zachowaj istniejące: wrangler.toml, TOOLS_CLOUDFLARE, BACKUPS_D1, lokalne pliki konfiguracyjne i poświadczenia. Nie usuwaj dwóch dodatkowych migracji historycznych, jeśli są w Twoim folderze.
4. Uruchom WYKONAJ_TESTY_FIX63.cmd (wymaga Node.js 24.19.0 zgodnie z docelowym środowiskiem).
5. Dopiero po PASS uruchom ONECLICK_AKADEMIA.cmd.
6. Obserwator potwierdzi stały adres produkcyjny; wdrożenie nie jest uznane za sukces tylko dlatego, że Wrangler je wysłał.

ZACHOWANE ELEMENTY
- istniejący projekt Pages: naprawa-pc-akademia-serwisu-pro;
- istniejąca baza D1 naprawapc-orders i jej binding;
- sekret OPENAI_API_KEY (bez ponownej konfiguracji);
- dotychczasowe moduły akademii, ilustracje, zdjęcia, testy, manifesty i dokumentacja;
- ręczny bezpieczny fallback dla Production Branch.

BEZPIECZEŃSTWO
- nie tworzono nowej bazy D1;
- nie wykonano migracji SQL podczas budowania FIX63;
- dwie historyczne migracje 0008 i 0009 pozostają zachowane i wymagają ręcznej oceny;
- testy API używają odpowiedzi symulowanych; rzeczywisty odczyt ustawień Cloudflare następuje dopiero na komputerze użytkownika.

Plik CLOUDFLARE_PRODUCTION_BRANCH_CONFIRMED.txt pozostaje pusty celowo. Jest potrzebny tylko wtedy, gdy Wrangler oraz Pages API nie zwrócą gałęzi.
