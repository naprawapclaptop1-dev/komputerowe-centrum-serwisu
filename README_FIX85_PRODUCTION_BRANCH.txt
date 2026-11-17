ARCHIWUM — FIX85 NIE JEST JUŻ ŚCIEŻKĄ PRODUKCYJNĄ DIRECT UPLOAD

UWAGA: Instrukcja poniżej została zastąpiona przez FIX86. Log użytkownika
potwierdził, że przekazywanie `--branch main` tworzyło deploymenty Preview
z adresami hash.pages.dev i nie aktualizowało stałego aliasu produkcyjnego.
W Cloudflare Pages Direct Upload flaga `--branch` wskazuje Preview.
Do produkcji należy pominąć `--branch` i `--env`.

Używaj wyłącznie:
- WYKONAJ_TESTY_FIX86.cmd
- URUCHOM_AKADEMIE.cmd
- README_FIX86_DIRECT_UPLOAD_PRODUCTION.txt

Nie uruchamiaj polecenia FIX85 z `--branch` jako wdrożenia produkcyjnego.

--- PIERWOTNA INSTRUKCJA FIX85 (ARCHIWALNA) ---

FIX85 — PRODUKCYJNA GAŁĄŹ CLOUDFLARE PAGES

W logu FIX84 Wrangler zgłosił zakończenie uploadu i zwrócił hash.pages.dev,
ale stały adres projektu nadal serwował poprzedni build. Cloudflare dokumentuje,
że Wrangler może automatycznie pobrać gałąź z repozytorium Git. W aktywnym
watcherze nie wolno więc polegać na pominięciu --branch.

FIX85 odczytuje Production Branch istniejącego projektu przez tę samą kontrolę
Cloudflare co wcześniej i przekazuje ją jawnie:

  wrangler pages deploy WEB_PUBLISH --project-name <istniejący-projekt> --branch <Production Branch>

Testy sprawdzają, że:
- przekazywana jest dokładnie gałąź potwierdzona przez Cloudflare,
- nie można użyć innej gałęzi ani env preview,
- nie można wdrożyć bez jawnego celu,
- sukces jest potwierdzany na stałym adresie *.pages.dev, a nie na samym adresie
  deploymentu z hashem.

Uruchom WYKONAJ_TESTY_FIX85.cmd, a potem URUCHOM_AKADEMIE.cmd. Po starcie
kontroluj log: ma zawierać `FIX85 Direct Upload: jawne --branch "main"` (lub
inną rzeczywiście potwierdzoną gałąź produkcyjną). Nie wklejaj kluczy Cloudflare
ani OpenAI do logów.

Reguła jest zgodna z dokumentacją Cloudflare:
- Wrangler może automatycznie odczytać bieżącą gałąź z workspace Git;
- dla konfiguracji produkcyjnej dokumentacja Wrangler wskazuje `--branch <PRODUCTION BRANCH>`;
- wartość BRANCH w FIX85 jest pobierana z ustawienia `production_branch` istniejącego projektu, a nie wpisana na stałe jako `main`.
Dokumentacja:
https://developers.cloudflare.com/pages/functions/wrangler-configuration/
https://developers.cloudflare.com/pages/get-started/direct-upload/
https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/
