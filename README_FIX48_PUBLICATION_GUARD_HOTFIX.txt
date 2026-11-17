# NAUKA OD A DO Z — FIX48 PUBLICATION GUARD HOTFIX

FIX48 jest poprawką narzędzi publikacji dla aplikacji 6.8.0 FIX47. Nie zmienia treści ani wyglądu strony.

## Przyczyna

`AUTO_PUBLISH_WATCHER.js` używał `swCacheName` w kontroli kontraktu FIX47, zanim deklarował tę zmienną niżej w `verifyLocalRelease()`. Node.js zgłaszał `Cannot access 'swCacheName' before initialization` i zatrzymywał obserwator przed wdrożeniem.

## Naprawa

Parsowanie `CACHE_NAME` przeniesiono bezpośrednio za odczyt `service-worker.js`. Nowy test regresji sprawdza kolejność deklaracji, jednokrotne wystąpienie i wymóg testu w OneClick/Watcher.

## Uruchomienie na Windows

1. Rozpakuj pełne archiwum FIX48 do nowego katalogu, nie nadpisując kopii FIX47.
2. Uruchom `WYKONAJ_TESTY_FIX48.cmd` w Node.js 24.19.0. Ten skrót przekazuje do pełnego runnera zgodności FIX47/FIX48.
3. Wymagaj wyniku `[OK]` i braku błędów testów.
4. Dopiero po pozytywnym wyniku uruchom `ONECLICK_AKADEMIA.cmd`/dotychczasowy główny start z tego samego katalogu.

## Bezpieczeństwo

FIX48 nie zmienia `WEB_PUBLISH`, publicznego build ID FIX47, Service Workera, sekretów OpenAI, konfiguracji Wrangler, API ani migracji. Nie wykonuje deployu i nie dotyka D1. OneClick nadal ma wykonać własne kontrole, kopię D1 i migracje zgodnie z dotychczasową konfiguracją użytkownika.
