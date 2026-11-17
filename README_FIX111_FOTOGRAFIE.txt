NAUKA OD A DO Z 6.8.0 — FIX111

CEL
Naprawa sytuacji, w której zdjęcia z katalogu FIX109 były rezerwowane przez niewłaściwe karty, a kolejka pobierała materiały z ukrytych widoków i zużywała limit dostawcy.

CO ZMIENIONO
1. Katalog wszystkich widoków jest śledzony, ale obrazy są pobierane dopiero w aktywnej zakładce i w zasięgu ekranu.
2. Po nawigacji, przewinięciu, zmianie wielkości okna lub dynamicznym dodaniu treści kolejka jest ponawiana.
3. Migracja starych danych odrzuca błędne przypisania 21 zdjęć zarezerwowanych dla strony głównej.
4. Openverse zachowuje limit 180 żądań/dzień i odstęp 3,3 sekundy; Wikimedia Commons jest niezależnym źródłem zapasowym.
5. OneClick i Watcher walidują aktualny runtime FIX111 oraz zachowują istniejący cache PWA FIX109.

TESTY
Uruchom WYKONAJ_TESTY_FIX111.cmd. Pełny raport zapisuje się w RAPORT_FIX111_TESTY.log.

PUBLIKACJA
Po pozytywnym teście uruchom dotychczasowy bezpieczny start publikacji. OneClick kontroluje lokalne pliki WWW przed migracjami D1. Nie twórz nowej bazy i nie zmieniaj bindingu DB.

WERYFIKACJA PRODUKCYJNA
Po publikacji sprawdź stronę główną, sekcję Specjalizacje, zakładkę Kursy i przewiń kursy w dół. Odśwież stronę z wyczyszczeniem starej pamięci cache przeglądarki/PWA, jeśli Service Worker nadal serwuje poprzednie pliki. Nie wszystkie kursy dostają zdjęcie natychmiast: dynamiczne wyszukiwanie działa progresywnie i podlega limitom źródeł.

Wersja produktu: 6.8.0 (bez zmiany numeru).
