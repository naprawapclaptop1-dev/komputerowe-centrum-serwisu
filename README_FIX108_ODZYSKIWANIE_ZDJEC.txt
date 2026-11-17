NAUKA OD A DO Z — FIX108 — ODZYSKIWANIE ZDJĘĆ

Produkt: 6.8.0
Hotfix: FIX108
Runtime zdjęć: 6.8.0-fix108-photo-provider-recovery-20261109

CO POPRAWIONO

FIX107 nadal pozostawiał kilka sytuacji, w których zdjęcie mogło zostać na stałe zastąpione ilustracją:
- odpowiedź Retry-After jako data HTTP była zamieniana na NaN i mogła blokować Openverse bezterminowo;
- chwilowy błąd Wikimedia Commons oznaczał kategorię jako sprawdzoną/wyczerpaną;
- osiągnięcie dziennego limitu Openverse zatrzymywało także ponawianie niezależnego źródła Wikimedia;
- nowe przypisania FIX108 muszą pozostać w pamięci także po odświeżeniu strony.

FIX108 naprawia te ścieżki, zachowuje odrębne blokady providerów, ponawia tymczasowe błędy Wikimedia z backoffem i utrzymuje sprawdzone przypisania zdjęć.

ZASADY ZDJĘĆ

1. Jedno zdjęcie może być przypisane tylko do jednej pozycji.
2. Unikalność jest kontrolowana przez identyfikator dostawcy, stronę źródłową, kanoniczny URL i dostępny skrót percepcyjny pHash.
3. Zdjęcia są pobierane dla aktywnego widoku, priorytetowych kafelków i kolejki progresywnej podczas przewijania. Ukryty widok zaczyna pobieranie po otwarciu.
4. Zdjęcia muszą pasować tematycznie i mieć dopuszczalną licencję. Jeżeli źródła nie zwrócą zgodnego zdjęcia, zostaje jasno oznaczona ilustracja techniczna SVG. Ilustracja nie jest przedstawiana jako fotografia.
5. Limit 180 zapytań dziennie jest zachowany dla Openverse. Wikimedia Commons ma własne tempo i blokadę, a jego ponawianie nie jest zatrzymywane przez limit Openverse.

TESTY

Uruchom WYKONAJ_TESTY_FIX108.cmd.
Oczekiwany raport tej paczki: 228/228 testów regresji oraz 15/15 kontroli składni.
Raport: FIX108_FULL_TESTS.log.

PUBLIKACJA

Po rozpakowaniu paczki uruchom standardowy mechanizm publikacji OneClick w dotychczasowym środowisku projektu. OneClick i Auto-Publish Watcher sprawdzają aktywny runtime FIX108, manifest, HTML, Service Worker i testy przed publikacją.

Nie zmieniono bindingu D1, schematu bazy ani istniejących migracji. Samo przygotowanie archiwum nie publikuje strony na serwerze. Po wdrożeniu trzeba odświeżyć PWA/przeglądarkę; Service Worker ma nowy klucz cache FIX108.
