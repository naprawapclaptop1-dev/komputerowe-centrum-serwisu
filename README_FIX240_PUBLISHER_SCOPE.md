# FIX240 — poprawka zakresu zmiennych publikatora

## Przyczyna

`verifyWeb()` w `ONECLICK_AKADEMIA.js` odczytuje HTML do `indexHtml` i Service Worker do `sw`. Kontrola FIX231–FIX239 błędnie używała niezadeklarowanego aliasu `html`, powodując `ReferenceError: html is not defined` po przejściu wcześniejszych kontroli.

## Zmiana

- OneClick używa teraz `indexHtml` i `sw`, zgodnie z deklaracjami w `verifyWeb()`.
- Auto Publisher Watcher zachowuje lokalne aliasy `html` i `sw` z `verifyLocalRelease()`.
- Oba publikatory wymagają testu `test-fix240-publisher-scope.mjs`, dokumentacji i metadanych FIX240.
- Test uruchamia `node --check` na obu publikatorach i kontroluje, że nie ma błędnego odwołania `html` w zakresie FIX231–FIX239 OneClick.

## Wdrożenie

Na kopii projektu rozpakuj nakładkę FIX240, zachowując `wrangler.toml`, sekrety i binding D1. Uruchom `TESTY_FIX240.cmd`, a po PASS ponownie uruchom START FIX105. Ta poprawka nie wykonuje publikacji ani migracji produkcyjnej.

Produkt pozostaje 6.8.0.
