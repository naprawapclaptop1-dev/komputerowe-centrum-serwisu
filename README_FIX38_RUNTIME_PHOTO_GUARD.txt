NAUKA OD A DO Z 6.8.0 — FIX38
ZGODNOŚĆ TESTU SILNIKA ZDJĘĆ / JAWNA WALIDACJA RUNTIME MARKER
============================================================

PRZYCZYNA
W lokalnym folderze Windows pozostawał stary skrypt scripts\test-unique-repair-photos-long-videos-fix5.js. Nie było go w archiwum FIX37, więc po rozpakowaniu bez usuwania stary plik nie został nadpisany. Test zatrzymywał się na wymaganiu, aby OneClick jawnie walidował runtime marker silnika zdjęć.

NAPRAWA
1. Dodano zgodny skrypt pod tą samą historyczną nazwą test-unique-repair-photos-long-videos-fix5.js. Sprawdza on aktualny silnik FIX7, a pełny test runtime 155 × 3 zdjęć pozostaje w test-unique-repair-photos-long-videos-fix7.js.
2. OneClick i watcher sprawdzają dokładny marker: api.uniquePhotoEngineVersion='6.2.0-fix7-per-repair-3photos-hash'.
3. Kontrola wymaga także trzech zdjęć na przypadek, weryfikacji perceptual hash, braku ponownego używania awaryjnych zdjęć oraz źródeł Openverse/Wikimedia.
4. Dodano test niezależny test-photo-engine-publisher-marker-fix38.mjs i kontrakt wydania FIX38.
5. Zaktualizowano identyfikator buildu w release.json, index.html, API statusu kont, OneClick, watcherze, Service Workerze i testach.
6. WYKONAJ_TESTY_FIX37.cmd i CHECK_KONTA_FIX37.cmd pozostały jako skróty do FIX38.

WERYFIKACJA
59/59 testów PASS (28 plików .js + 31 plików .mjs).
Test FIX7: 465/465 unikalnych, hash-zweryfikowanych zdjęć dla 155 przypadków; bez ponownego użycia URL, strony źródłowej lub perceptual hash.
Lokalny OneClick verifyWeb(): PASS.
171 plików JS/MJS/CJS: 0 błędów składni.
40 arkuszy CSS: 0 błędów strukturalnych.
704 unikalne ID HTML; 128 lokalnych odwołań, 0 braków.
Porównanie FIX37 → FIX38: 0 usuniętych plików; 6 nowych plików projektu/testów i 5 dokumentów (11 nowych plików łącznie).

OGRANICZENIA
Testy wykonano lokalnie w przygotowawczym środowisku Node.js v22.16.0. Log użytkownika podaje Node.js v24.19.0; ta wersja nie była dostępna w środowisku przygotowawczym i wymaga potwierdzenia po rozpakowaniu na Windows.
Nie wykonano publikacji Cloudflare, migracji produkcyjnej D1 ani zmian sekretów.
