# AKADEMIA SERWISU PRO 6.1.0 — FIX2

## Przyczyna błędu z logu 2026-11-02

Stały adres produkcyjny zwracał HTTP 200 i właściwy identyfikator builda 6.1.0, a wszystkie flagi kontroli poza `academyFeatures` były prawdziwe. W bramce `verifyPublishedRelease()` watcher sprawdzał jednak dosłowny tekst `id="lessonTotalBadge">1000`, podczas gdy opublikowany `WEB_PUBLISH/index.html` zawiera `id="lessonTotalBadge">1060`. To powodowało fałszywe odrzucenie poprawnie wdrożonego HTML i ponawianie publikacji.

## Zmiany

- Poprawiono oczekiwaną liczbę lekcji w kontroli produkcyjnej z 1000 na 1060.
- Rozszerzono test regresji: porównuje liczbę lekcji w watcherze i `index.html`, sprawdza brak `indexHtml` oraz obecność znaczników kont, katalogu modeli, statystyk i sekcji wsparcia.
- Uaktualniono test konfiguratora OpenAI, który szukał starego, nieużywanego zapisu ścieżki do głównego skryptu; aktualny CMD wywołuje go przez `%ROOT%`.

## Testy lokalne

- `node --check` dla wszystkich plików `.js` i `.mjs` poza `node_modules` — PASS.
- `scripts/test-watcher-release-guard.js` — PASS.
- `scripts/test-wrangler-production-d1.js` — PASS.
- `scripts/test-cloudflare-pages-d1.js` — PASS.
- `scripts/test-openai-key-setup.mjs` — 10/10 PASS.
- `scripts/test-email-account-local.mjs` — PASS.
- `scripts/test-hybrid-chat.mjs` — PASS.

## Granice weryfikacji

Nie wykonano wdrożenia do Cloudflare z tego środowiska. Nie zmieniono sekretów, bazy D1, migracji ani danych użytkowników. Po uruchomieniu pakietu na komputerze właściciela należy potwierdzić stały adres produkcyjny i działanie funkcji w przeglądarce.

## FIX3 — kontrola produkcyjna odporna na formatowanie HTML

W logu z 2026-11-02 wdrożenie Cloudflare zakończyło się sukcesem, stały adres zwracał HTTP 200 i identyfikator builda 6.1.0, ale watcher nadal raportował wyłącznie `academyFeatures=false`. Poprzednia poprawka FIX2 nadal porównywała fragmenty HTML znak w znak. To pozostawiało fałszywe odrzucenie przy zmianie białych znaków, cudzysłowów lub kolejności atrybutów.

FIX3 zastępuje te porównania kontrolą strukturalną ID i wartości elementów, z tolerancją na formatowanie HTML. W logu błędu watcher wypisuje teraz dokładne nazwy brakujących funkcji (`academyFeaturesMissing=...`), zamiast samego `academyFeatures=false`. Dzięki temu następny problem nie będzie ukryty za jedną ogólną flagą.

Test regresji sprawdza również wariant z pojedynczymi cudzysłowami, dodatkowymi atrybutami i białymi znakami. Nie zmieniono bazy D1, sekretów, danych kont ani konfiguracji projektu Cloudflare. Wdrożenie produkcyjne z tego środowiska nie zostało wykonane.
