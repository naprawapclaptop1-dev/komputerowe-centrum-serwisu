# FIX83 — unikalne ilustracje tematyczne

## Diagnoza
FIX77 celowo wyzerował `ACADEMY_ART.onlinePhotos` i nadpisał `dataUrl` abstrakcyjnym rysunkiem ścieżek. Ponadto wzorzec `ram` dopasowywał fragment `vram`, zanim kod rozpoznał pamięć graficzną.

## Zmiany
`WEB_PUBLISH/assets/visual-uniqueness-fix83.js` jest ładowany po FIX77. Nadpisuje klasyfikację i generator obrazów, dodaje 54 unikalne pozycje galerii oraz kontrolę powtórek źródeł w DOM.

- VRAM: dyskretne układy GDDR/BGA montowane na PCB. Nie jest to moduł DIMM/SO-DIMM.
- RAM: osobna ilustracja modułu DIMM/SO-DIMM.
- CPU, GPU, BIOS, VRM, pamięć masowa, chłodzenie, matryca, złącza i pozostałe części mają osobne typy scen.
- Każdy identyfikator lekcji i widoku otrzymuje stabilną, lokalną grafikę.
- Wszystkie 10 posterów wideo ma nowe, tematyczne ilustracje 1280×720; miniatura filmu i obraz odtwarzacza są generowane osobno.
- Procedury napraw dostają trzy oddzielne ilustracje awaryjne; Openverse i Wikimedia mogą dostarczać dodatkowe licencjonowane zdjęcia online.
- Brakujący lub błędny plik nie pozostawia pustego pola.

## Wdrożenie
Nie zmieniono numeru produktu 6.8.0, schematu D1, sekretów ani projektu Cloudflare. Paczka nie wykonuje publikacji produkcyjnej.

## Kontrola wizualna
Raport `qa/FIX83_VISUAL_AUDIT.txt`: 54 galerie SVG, 1 431 porównań par, minimalny 64-bit DCT pHash = 10; 30 rastrowych obrazów merytorycznych, 435 porównań, minimum = 12; 10 posterów lokalnych ma unikalne sumy SHA-256.

## Testy
Uruchom `WYKONAJ_TESTY_FIX83.cmd`. Test sprawdza m.in. rozdzielenie VRAM/RAM, unikalność grafik dla różnych tematów i widoków, zawartość galerii, fallback offline i kolejność ładowania skryptu.

Uwaga: autorskie SVG są ilustracjami edukacyjnymi, nie fotografiami. Istniejące zdjęcia rastrowe pozostają odrębnymi zasobami i nie są fałszywie oznaczane jako nowe fotografie.
