# NAUKA OD A DO Z 6.8.0 — FIX137

FIX137 naprawia kontrolę publikacji OneClick po FIX136. Nie zmienia wyglądu ani zawartości strony.

## Przyczyna zatrzymania

FIX136 ma dwa niezależne cache Service Workera:

- cache aplikacji: `nauka-6.8.0-fix136-top-photo-priority-practice-lessons-20261114`
- cache fotografii FIX135: `academy-photo-library-fix135`

Walidator OneClick nadal wymagał starej nazwy cache aplikacji FIX135, mimo że aktywna nazwa została prawidłowo zaktualizowana w FIX136. Ten stary warunek powodował fałszywy błąd `FIX129: homepage photo blocker scripts remain active or photo cache is not configured.`

## Co poprawiono

OneClick używa wspólnego helpera `scripts/photo-cache-contract-fix137.cjs`. Helper sprawdza nazwę cache aplikacji względem `release.latestHotfixBuild`, porównuje osobny `PHOTO_CACHE_NAME` z biblioteką fotografii i nadal blokuje publikację, gdy pojawi się stary zakazany skrypt albo brakuje rzeczywistego mechanizmu cache'owania zdjęć.

## Uruchomienie

Uruchom dotychczasowy bezpieczny start projektu. Publisher i Watcher uruchamiają teraz `scripts/run-tests-fix137.mjs`, który wykonuje cały zestaw runtime FIX136 oraz nowe testy walidacji FIX137.

Raport wynikowy: `RAPORT_FIX137_TESTY.log`.

## Bezpieczeństwo zakresu

FIX137 nie zmienia `WEB_PUBLISH/index.html`, `#view-home`, zdjęć, lekcji ani danych. Nie zmienia konta Cloudflare, Pages, D1, `env.AI`, sekretów ani migracji. To narzędziowa poprawka kontroli publikacji. Sama paczka nie jest dowodem wdrożenia produkcyjnego.
