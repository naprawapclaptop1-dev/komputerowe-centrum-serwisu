NAUKA OD A DO Z — FIX61 VIEW GUARD HOTFIX

Problem:
Strażnik scripts/support-view-guard-fix35.js wymagał dokładnie 33 widoków. FIX54–FIX60 dodał prawidłowy, samodzielny widok #view-globalacademy jako 34. ekran. Publikacja zatrzymywała się mimo poprawnej struktury.

Poprawka:
- zachowano 33 historyczne widoki;
- zatwierdzono dokładnie jeden rozszerzający widok: #view-globalacademy;
- wymagane jest jego data-view="globalacademy" w nawigacji;
- nadal blokowane są brakujące ID, duplikaty, zagnieżdżone widoki i błędy granic sekcji wsparcia;
- zaktualizowano trzy historyczne asercje testowe do nowej struktury 34 widoków;
- dodano scripts/test-view-count-fix61.mjs i WYKONAJ_TESTY_FIX61.cmd.

Uruchomienie:
1. Rozpakuj archiwum do nowego folderu.
2. Uruchom WYKONAJ_TESTY_FIX61.cmd.
3. Jeżeli testy przejdą, uruchom istniejący ONECLICK_AKADEMIA.cmd.

Bez zmian:
Wersja produktu 6.8.0, build FIX51/FIX54–FIX60, istniejący Pages, D1, OpenAI API key i wszystkie 34 widoki.

Nie wykonano publikacji ani migracji D1 w ramach przygotowania hotfixu.
