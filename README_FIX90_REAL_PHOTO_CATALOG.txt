NAUKA OD A DO Z — FIX90
KATALOG PRAWDZIWYCH FOTOGRAFII ONLINE
=====================================

CEL
FIX90 uruchamia katalog fotografii online, który wcześniej był wyłączony. Nie traktuje wektorowych ilustracji SVG jako fotografii. Gdy nie ma zweryfikowanego źródła, pokazuje podpisaną ilustrację techniczną offline.

URUCHOMIENIE
1. Rozpakuj kompletne archiwum FIX90 do osobnego katalogu.
2. Uruchom WYKONAJ_TESTY_FIX90.cmd.
3. Jeśli testy zakończą się powodzeniem, uruchom URUCHOM_AKADEMIE.cmd.
4. Po publikacji otwórz stały adres produkcyjny strony w przeglądarce z dostępem do Internetu.
5. Odśwież stronę z pominięciem pamięci podręcznej (Ctrl+F5). W razie potrzeby zamknij i otwórz ponownie kartę PWA.
6. Otwórz stronę główną, moduły, materiały i listę usterek. Przewijaj stronę — obrazy są pobierane leniwie dla widocznych kart.
7. Pasek „Fotografie online” pokazuje liczbę przypisanych zdjęć. „Wznów pobieranie” ponawia nieudane lub oczekujące sloty.

DOSTAWCY
- Pexels: 12 metadanych startowych z bezpośrednim URL, autorem, stroną źródłową i licencją.
- Openverse: oficjalne API wyszukiwania fotografii na licencjach komercyjnie dopuszczających ponowne użycie.
- Wikimedia Commons: oficjalne MediaWiki Action API z parametrem CORS origin=*.

OPENVERSE ogranicza anonimową paginację oraz tempo żądań. FIX90 dodatkowo ogranicza lokalny budżet do 150 zapytań dziennie i rozdziela żądania w czasie. To mechanizm ochronny, nie gwarancja 465 pobranych fotografii w jednej sesji.

UNIKALNOŚĆ
- Ten sam provider ID, landing page i znormalizowany URL nie mogą być ponownie przypisane do innego slotu w tym samym profilu przeglądarki.
- Gdy CORS pozwala, runtime porównuje pHash obrazu i odrzuca podobne kadry.
- 13 wcześniej przypisanych zdjęć na głównych kafelkach pozostaje na swoich miejscach.
- Każda procedura ma jedną fotografię na karcie oraz trzy odrębne materiały w szczegółach.

VRAM / RAM
- VRAM akceptuje wyłącznie zdjęcia z wyraźnym kontekstem GDDR, HBM, video/graphics memory, memory chip lub BGA package.
- DIMM, SO-DIMM, SODIMM, UDIMM, desktop/system RAM i memory module są odrzucane jako zdjęcia VRAM.
- Jeżeli API nie znajdzie zdjęcia samych układów pamięci GDDR/BGA, zostaje oznaczona ilustracja VRAM, a nie fotografia modułu RAM.

WAŻNE
- Runtime korzysta z Internetu. Offline dostępne są ilustracje techniczne, ale nie nowe fotografie online.
- Pobieranie jest progresywne, zależne od widoczności kart, dostępności API, limitów i wyników z odpowiednią licencją.
- Nie deklarujemy 465 zdjęć jako już pobranych. Licznik na stronie pokazuje rzeczywisty stan przypisań w danym profilu.
- Fotografie mają podpis autora, źródła i licencji. Każdy materiał należy wykorzystywać zgodnie z warunkami konkretnej licencji.
- Wdrażanie do Cloudflare Pages nie zostało wykonane z tego środowiska. OneClick po stronie użytkownika przeprowadzi testy i dopiero potem uruchomi istniejącą ścieżkę publikacji.
- FIX90 nie wykonuje migracji D1 i nie zmienia sekretów Cloudflare.
