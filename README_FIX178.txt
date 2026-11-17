NAUKA OD A DO Z — FIX178
Naprawa końcowej walidacji publikacji w AUTO_PUBLISH_WATCHER.js

Przyczyna:
W grupie Promise.all dotyczącej FIX77/FIX129 kod przypisywał dziewięć
odpowiedzi, ale miał tylko osiem wywołań fetch(). Zmienna
remotePhotoPolicyRuntimeResponse była undefined. Po wysłaniu wdrożenia
Cloudflare watcher próbował odczytać z niej .text() i przerywał weryfikację
stałej domeny.

Naprawa:
Przywrócono brakujące pojedyncze pobranie photo-catalog-fix115.js. Odpowiedź
jest odczytywana przez clone(), a późniejsza walidacja FIX115 wykorzystuje
pierwotną odpowiedź i już odczytaną treść. Skrypt katalogu jest pobierany
jeden raz, a nie dwa razy.

Uruchomienie testów:
node scripts/run-tests-fix178.mjs
lub WYKONAJ_TESTY_FIX178.cmd.

Bezpieczeństwo:
FIX178 nie zmienia wersji produktu 6.8.0, metadanych FIX176, bazy D1,
sekretu Gemini, kont, kursów ani biblioteki zdjęć. Nie wykonuje migracji.

Ważne:
Test lokalny potwierdza naprawę kodu watchera. Dopiero ponowne uruchomienie
OneClick z tej paczki potwierdzi rezultat rzeczywistego wdrożenia i stałej
strony produkcyjnej.
