FIX120 — POPRAWKA STARTU I PUBLIKACJI

Błąd z logu START FIX105 był błędem zakresu/inicjalizacji w ONECLICK_AKADEMIA.js:
verifyWeb() odwoływał się do serviceWorkerVisualSource przed deklaracją const.

Naprawa: deklaracja jest teraz wykonywana na początku verifyWeb(), przed kontrolą zasobów FIX119.
Wydanie strony pozostaje 6.8.0 FIX119. Nie zmieniono projektu Pages, bindingu D1, bazy ani migracji.

Test regresyjny:
  node scripts/test-oneclick-service-worker-tdz-fix120.mjs
Pełny preflight:
  WYKONAJ_TESTY_FIX119.cmd
Publikację uruchamiaj dotychczasowym START_FIX105.cmd dopiero po wykonaniu testów na swoim komputerze.
