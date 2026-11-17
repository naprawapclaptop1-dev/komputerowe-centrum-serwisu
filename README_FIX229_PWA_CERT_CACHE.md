# FIX229 — odświeżenie zasobu weryfikacji certyfikatów

## Przyczyna
Kod interfejsu certyfikatów z FIX227 zmienił się, ale w `index.html` i Service Worker nadal wskazywał wcześniejszy parametr wersji zasobu. Przeglądarka lub PWA mogła więc używać poprzedniej kopii skryptu i nie pokazywać linku weryfikacyjnego.

## Zmiana
- Zaktualizowano parametr zasobu do `academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification` w HTML i precache Service Worker.
- Zaktualizowano kontrolę publikacji OneClick i Auto-Watcher, w tym zdalny test tego samego zasobu.
- Dodano test zgodności HTML/PWA oraz testy składni strażników publikacji.
- Zachowano nazwy cache PWA i zdjęć; nie zmieniono numeru produktu 6.8.0 ani logiki endpointu weryfikacji.

## Weryfikacja
Uruchom `TESTY_FIX220_FIX229.cmd`. Pakiet uruchamia testy Node.js oraz test migracji SQLite (wymaga Python 3). Test sprawdza zgodność URL w HTML, Service Worker, metadanych i obu mechanizmach publikacji oraz brak starego URL w aktywnych ścieżkach.

Publikacja produkcyjna nie jest wykonywana przez tę poprawkę. Po wdrożeniu przeglądarka pobierze nową wersję zasobu dzięki nowemu parametrowi URL.
