FIX114 — NAPRAWA AUTO-PUBLISH-WATCHER

Problem: ReferenceError: localReleaseMetadata is not defined podczas verifyLocalRelease().
Przyczyna: pomyłka nazwy zmiennej. Lokalny obiekt jest zdefiniowany jako localRelease.
Poprawka: photo-catalog-publication-contract-fix111 otrzymuje remoteRelease: localRelease.

Test: WYKONAJ_TESTY_FIX114.cmd.
Po PASS uruchom standardowy bezpieczny start publikacji.

FIX114 nie zmienia WEB_PUBLISH/release.json, wersji produktu 6.8.0, runtime FIX111, cache FIX109 ani bazy D1.
Nie wykonano publikacji w ramach tej poprawki.

Wynik lokalny: 53/53 regresje i 10/10 kontroli składni PASS na Node.js v22.16.0.
Test FIX114: 5/5 PASS. Przed ponowną publikacją uruchom WYKONAJ_TESTY_FIX114.cmd na Windows/Node 26.13.0.
