NAUKA OD A DO Z 6.7.0 FIX18A — INSTRUKCJA HOTFIXA

Ten hotfix naprawia zatrzymanie publikacji: „Service Worker nadal używa starej pamięci filmu FIX8”.

DLACZEGO WYSTEPOWAL BLAD
Service Worker mial nowa, unikalna nazwe cache FIX18, a film MP4 byl w liscie CORE. Publikator sprawdzal jednak tylko historyczny znacznik support-video-clean-fix9. Brak znacznika powodowal falszywy alarm.

CO NAPRAWIONO
- Cache otrzymal nowy namespace FIX18A i zachowal znacznik support-video-clean-fix9.
- Walidator sprawdza nazwe cache, MP4, plakat JPG i napisy VTT.
- Ten sam warunek sprawdza publikator jednorazowy i obserwator.
- Test regresyjny zostal dodany do WYKONAJ_TESTY_FIX18.cmd.
- Cache nadal pomija /api/ i usuwa stare cache aplikacji przy aktywacji.

URUCHOMIENIE
1. Rozpakuj cale archiwum FIX18A do nowego folderu.
2. Uruchom WYKONAJ_TESTY_FIX18.cmd.
3. Uruchom zwykly URUCHOM_AKADEMIE.cmd z TEGO NOWEGO FOLDERU.
4. Publikator ponownie wykona kontrole i dopiero po przejsciu walidacji moze przejsc do kopii/migracji zgodnie z dotychczasowym procesem.

Nie kopiuj pojedynczego service-worker.js do starszego folderu. Uzyj calego ZIP, aby publikator, watcher i zasoby byly zgodne.
Nie uruchamiaj starego URUCHOM_AKADEMIE.cmd z folderu FIX14/FIX17/FIX18.

Hotfix nie zawiera sekretow OAuth i nie wymaga ponownego wpisywania Client Secret. Nie zmienia produkcyjnej bazy D1 i nie publikuje automatycznie podczas testow.
