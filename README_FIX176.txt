NAUKA OD A DO Z – DLA WSZYSTKICH
FIX176 – NAPRAWA PUSTEGO CENTRUM WIEDZY I BEZPOŚREDNIE WEJŚCIE DO AKADEMII MISTRZA
Produkt: 6.8.0
Build: 6.8.0-fix176-global-academy-rescue-and-master-launch-20261115

CEL WYDANIA
1. Naprawić pusty ekran istniejącego widoku ?view=globalacademy.
2. Zapewnić statyczną zawartość awaryjną w HTML, widoczną również wtedy, gdy skrypt Centrum Wiedzy nie uruchomi się.
3. Jeżeli dynamiczny montaż Centrum Wiedzy zakończy się wyjątkiem, przywrócić statyczną zawartość zamiast pozostawiać pusty panel.
4. Dodać bezpośrednie wejście do Akademii Mistrza Serwisu w górnym menu, menu bocznym i na pulpicie.
5. Zachować laboratoria FIX168–FIX175 oraz pięć narzędzi wspólnych.

CO WIDAĆ W CENTRUM WIEDZY
- Akademia Mistrza Serwisu – 8 laboratoriów i 5 narzędzi.
- Skrót do istniejącego katalogu 1083 kursów i lekcji.
- Skrót do istniejącej diagnostyki i pomiarów.
- Skrót do istniejącej bazy napraw.
- Komunikat informacyjny, gdy dynamiczny moduł nie zostanie uruchomiony.

BEZPIECZEŃSTWO I ZAKRES
- Produkt pozostaje w wersji 6.8.0.
- Zachowano 35 istniejących widoków; nie dodano nowego route.
- Zachowano 1083 lekcje.
- Zachowano istniejący projekt Cloudflare Pages i istniejącą bazę D1 naprawapc-orders.
- Nie dodano nowych tabel, nowej bazy ani migracji D1.
- Zachowano istniejące logowanie, OAuth, sekret GEMINI_API_KEY i ograniczenia tematyczne Gemini.
- Zachowano 19 przypisań zdjęć sprzętu oraz osobny cache zdjęć academy-photo-library-fix135.
- Nie zmieniono strony głównej poza istniejącymi, wcześniej dodanymi wejściami do Akademii Mistrza.
- Laboratoria FIX168–FIX175 pozostają edukacyjnymi symulacjami; nie wykonują operacji na prawdziwych dyskach, zasilaczach ani urządzeniach.

INSTALACJA
1. Zamknij uruchomione procesy projektu.
2. Wykonaj kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj cały ZIP FIX176 do G:\AKADEMIA_SERWISU_PRO, zastępując wcześniejsze pliki.
4. Uruchom WYKONAJ_TESTY_FIX176.cmd.
5. Gdy wynik to STATUS: PASS, uruchom START_FIX105.
6. Po zakończeniu publikacji sprawdź stronę: https://naprawa-pc-akademia-serwisu-pro.pages.dev/?view=globalacademy

KLUCZ GEMINI
FIX176 nie zmienia ani nie usuwa GEMINI_API_KEY. Poprzedni log potwierdził, że sekret istnieje w Cloudflare Pages Production. Nie powinno być potrzeby ponownego wklejania klucza.

TESTY
Uruchomienie: node scripts/run-tests-fix176.mjs
Raport: RAPORT_FIX176_TESTY.log
W zestawie są historyczne testy FIX136–FIX167, test 16/16 dla laboratoriów FIX168–FIX175, testy statycznej strony awaryjnej FIX176 i kontrakt zachowania zdjęć.

OGRANICZENIE WERYFIKACJI
Testy kodu i kontraktów lokalnych przechodzą. Nie wykonano publikacji produkcyjnej ani pełnego testu interakcji w przeglądarce. Produkcyjny rezultat potwierdzi dopiero nowy log START_FIX105 i otwarcie adresu po publikacji.
