# FIX135 — komplet zdjęć w dolnej siatce strony głównej

## Co naprawia

Na stronie głównej górny baner wyświetlał fotografie, ale część niższych kafelków modułów wciąż pokazywała lokalne ilustracje zastępcze. Przyczyną była niepełna i niejednoznaczna mapa seedów: część wyselekcjonowanych fotografii była rezerwowana dla innych slotów, a część kart wnioskowała kategorię zdjęcia wyłącznie z ogólnego tytułu.

FIX135 przypisuje 19 unikalnych fotografii sprzętu do 19 głównych kart modułów. Każdy obraz ma `data-photo-id` i jawne `data-photo-kind`, zgodne z kategorią źródła. Katalog i bootstrap pierwszego renderu korzystają z tej samej mapy. Zarezerwowane zdjęcie nie może zostać przejęte przez inną kartę ani metodę.

## Co zostało zachowane

- Same-origin Pages Function `/media/photos/{seedId}.jpg` z allowlistą źródeł i bezpieczną obsługą przekierowań FIX134.
- Atrybucja autorów i licencji przy fotografiach.
- Filtr metadanych odrzucający ludzi, twarze, dłonie i grafiki niebędące fotografiami.
- Service Worker i oddzielny cache zdjęć offline.
- Lokalny SVG jako jawnie opisany fallback, który nie jest liczony jako fotografia.
- Dynamiczne dopasowanie zdjęć dla sześciu kart specjalistycznych.
- Istniejąca baza D1 i konfiguracja logowania.

## Testy lokalne

Uruchom w katalogu projektu:

```bat
WYKONAJ_TESTY_FIX135.cmd
```

Runner `scripts/run-tests-fix135.mjs` uruchamia pełen zestaw 17 skryptów, w tym `scripts/test-home-module-photo-coverage-fix135.mjs`.

## Publikacja

Po wyniku PASS uruchom:

```bat
URUCHOM_NAUKE_OD_A_DO_Z.cmd
```

Pozostaw okno Watchera otwarte. Publikacja nie może zostać uznana za zakończoną tylko na podstawie komunikatu `Deployment complete`. Watcher musi potwierdzić aktualny `release.json`, 19 przypisań zdjęć oraz trzy próbne odpowiedzi zdjęć HTTP o typie MIME `image/*`.

## Ograniczenie weryfikacji

Testy lokalne sprawdzają strukturę, mapę slotów, metadane, licencje, allowlistę i kod. W środowisku przygotowania paczki nie było dostępu DNS do źródeł zewnętrznych, dlatego nie potwierdzono rzeczywistego pobrania wszystkich zdjęć w przeglądarce. Ostateczne potwierdzenie wymaga Watchera po publikacji na Cloudflare Pages.
