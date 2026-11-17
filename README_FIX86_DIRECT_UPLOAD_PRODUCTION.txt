FIX86 — CLOUDFLARE PAGES DIRECT UPLOAD PRODUCTION

Projekt w logu użytkownika ma:
- Pages project: naprawa-pc-akademia-serwisu-pro
- Git Provider: No (Direct Upload)
- Production Branch: main
- stałą domenę: https://naprawa-pc-akademia-serwisu-pro.pages.dev

WAŻNE: W Direct Upload flagą --branch wskazuje się deployment preview.
Do publikacji produkcyjnej należy użyć:
  wrangler pages deploy WEB_PUBLISH --project-name naprawa-pc-akademia-serwisu-pro

FIX86 automatycznie dodaje bezpieczne metadane commit-dirty/commit-message,
ale celowo NIE przekazuje --branch ani --env. Domyślna gałąź produkcyjna jest
wciąż odczytywana z istniejącej konfiguracji Cloudflare i raportowana.
Nie zmieniaj ręcznie nazwy projektu ani nie twórz nowego projektu.

Naprawiono też walidację manifestu FIX83:
- galleryIllustrationCount = 54
- categories zawiera vram oraz ram
- vramRule wymaga GDDR/BGA i zabrania DIMM/SO-DIMM dla VRAM

Uruchom:
  WYKONAJ_TESTY_FIX86.cmd
następnie:
  URUCHOM_AKADEMIE.cmd

Po publikacji log musi pokazać:
- komendę Direct Upload production bez --branch i --env,
- adres deploymentu zwrócony przez Wrangler jako diagnostykę,
- stałą domenę z `academy-hotfix=FIX86`,
- `latestHotfix=FIX86`,
- `visualHotfix=FIX83`,
- poprawny manifest FIX83 i Service Workera.

Sam hash.pages.dev ani HTTP 200 z dowolnego endpointu nie oznacza sukcesu.
Nie ujawniaj tokenów Cloudflare ani OPENAI_API_KEY w logach.

Dokumentacja Cloudflare:
https://developers.cloudflare.com/workers/wrangler/commands/pages/
https://developers.cloudflare.com/pages/get-started/direct-upload/
https://developers.cloudflare.com/pages/configuration/branch-build-controls/
