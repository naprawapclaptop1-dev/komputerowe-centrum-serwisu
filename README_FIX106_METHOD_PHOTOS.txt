NAUKA OD A DO Z — FIX106

Co naprawia:
- Jawne przypisanie kategorii tematycznej do 147 metod napraw.
- Karty metod przekazują katalogowi zdjęć własny identyfikator, tytuł i kategorię.
- Kolejka zdjęć jest uruchamiana po pierwszym renderze, wyszukiwaniu i zmianie kategorii.
- Działa ponowne kolejkowanie po zmianie widoku i przewinięciu strony.
- Zdjęcia z 21 priorytetowych pól strony głównej są zarezerwowane dla właściwych kart.
- W widoku metod jest status: załadowane, oczekujące, fallback, kolejka, błędy źródła i dzienny limit; przycisk „Wznów pobieranie zdjęć”.
- OneClick i Auto-Watcher blokują publikację, jeśli brakuje runtime, CSS, źródeł, mapowania tematów, renderer handoff lub statusu.

Pliki główne:
- WEB_PUBLISH/assets/photo-catalog-fix106.js
- WEB_PUBLISH/assets/photo-catalog-fix106.css
- WEB_PUBLISH/assets/service-workshop.js
- WEB_PUBLISH/media/photo-sources-online.json
- WEB_PUBLISH/index.html
- WEB_PUBLISH/service-worker.js
- WEB_PUBLISH/release.json
- ONECLICK_AKADEMIA.js
- AUTO_PUBLISH_WATCHER.js

Testy:
Uruchom WYKONAJ_TESTY_FIX106.cmd.

Uwaga:
Nowe zdjęcia dla metod są pobierane ze źródeł online i przypisywane progresywnie. Nie są to 147 plików offline. Jeśli dostawcy nie zwrócą odpowiedniej licencjonowanej fotografii, karta pozostawi oznaczoną ilustrację. Nie wyłączono limitów, kontroli licencji, dopasowania tematycznego ani unikalności.

Wersja produktu pozostaje 6.8.0. Hotfix FIX106. Runtime zdjęć FIX106.
Cloudflare Pages nie zostało wdrożone; D1 nie zostało zmienione.
