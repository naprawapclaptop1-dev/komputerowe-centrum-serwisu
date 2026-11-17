# FIX230 — Naprawa strażnika zasobów HTML/PWA

## Objaw
Publikator zatrzymywał wydanie na FIX198–FIX202, mimo że kolektor Windows, warsztat, Hyper-V, panel nauczyciela i synchronizacja znajdowały się w projekcie.

## Przyczyna
Strażnik porównywał stałe, historyczne parametry `?v=` (m.in. FIX206 i FIX204). Późniejsze poprawki prawidłowo zmieniły URL warsztatu 3D na FIX225 oraz synchronizacji na FIX221. HTML i Service Worker zawierały tę samą, aktualną wersję, ale publisher nadal wymagał dawnych numerów.

## Rozwiązanie
`scripts/fix230-pwa-asset-guard.cjs` sprawdza dla każdego wymaganego zasobu:
- dokładnie jedno odwołanie `src`/`href` w HTML;
- obecność parametru wersji `?v=`;
- identyczny, wersjonowany URL w Service Worker;
- obecność rzeczywistego pliku lokalnego w `WEB_PUBLISH`.

Walidator nie pomija kontroli zasobów i nie akceptuje niezgodnych wersji HTML/PWA. Akceptuje nowe numery wersji, gdy obie strony wskazują dokładnie ten sam zasób.

## Zmienione pliki
- `ONECLICK_AKADEMIA.js`
- `AUTO_PUBLISH_WATCHER.js`
- `scripts/fix230-pwa-asset-guard.cjs`
- testy FIX230, runner, launcher, `WEB_PUBLISH/release.json`

## Bezpieczeństwo i zakres
Nie zmieniono konta Cloudflare, projektu Pages, bindingu D1, sekretów OAuth/Gemini, numeru produktu 6.8.0, ani nazw cache PWA. Nie wykonano wdrożenia produkcyjnego.

## Wdrożenie na istniejącym komputerze
1. Zrób kopię folderu `G:\AKADEMIA_SERWISU_PRO`.
2. Rozpakuj `FIX230_PATCH_DO_WGRANIA.zip` bezpośrednio do tego folderu i potwierdź nadpisanie wskazanych plików.
3. Nie zmieniaj `wrangler.toml`, sekretów ani konfiguracji D1.
4. Uruchom `TESTY_FIX220_FIX230.cmd`.
5. Po wyniku PASS uruchom dotychczasowy START FIX105.
