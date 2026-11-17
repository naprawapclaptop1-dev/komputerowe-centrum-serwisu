NAUKA OD A DO Z 6.8.0 — FIX40 CENTRUM NAUKI PRO
=================================================

CEL WYDANIA
-----------
FIX40 dodaje zintegrowane Centrum Nauki PRO jako nowy widok aplikacji.
Zachowano dotychczasowe 26 widoków i istniejące moduły FIX39. Nowy widok
„Mój pulpit nauki PRO” jest 27. widokiem, a nie zamiennikiem wcześniejszego.

SIEDEM MODUŁÓW
--------------
1. Mój pulpit nauki
   - odczytuje istniejący rejestr ukończonych lekcji Akademii;
   - pokazuje postęp, ostatnio otwierane pozycje i zakładki;
   - obsługuje wznowienie ostatniej lekcji;
   - synchronizuje nowe zakładki z legacy kluczem academyBookmarks.

2. Wyszukiwarka AI i baza przypadków
   - przeszukuje lokalny indeks wiedzy, przypadków, modeli, elementów i metod;
   - pozwala przejść z wynikiem do istniejącego czatu AI po świadomej akcji;
   - wyszukiwarka lokalna nie udaje diagnozy wygenerowanej przez model AI.
     Wyniki wymagają weryfikacji w dokumentacji producenta i praktyce.

3. Wirtualny stół diagnostyczny
   - zawiera scenariusze ćwiczeń edukacyjnych i wybór procedury/pomiaru;
   - sprawdza, czy odpowiedź została wybrana; pusta odpowiedź nie zalicza;
   - zapisuje lokalną historię ćwiczeń wykorzystywaną także w raportach;
   - nie steruje fizycznym sprzętem ani nie wykonuje pomiarów na urządzeniu.
     Przykłady i wyniki symulacji są materiałem szkoleniowym.

4. Egzaminy i certyfikaty QR
   - 3 egzaminy po 8 pytań; próg zaliczenia wynosi 75%;
   - blokuje niekompletne oraz ponowne przesłanie tego samego wyniku;
   - tworzy lokalny certyfikat z kodem QR i historią podejść;
   - generator QR sprawdzono testem dekodowania.
   WAŻNE: certyfikat jest edukacyjnym potwierdzeniem lokalnym. W tej wersji
   nie ma podpisu kryptograficznego, publicznego rejestru ani serwerowej
   weryfikacji QR. Weryfikacja lokalna nie jest dowodem tożsamości.

5. Atlas płyt i układów
   - korzysta z istniejących katalogów producentów/modeli i komponentów;
   - umożliwia zapis lokalnych wpisów Board ID i rewizji;
   - wpisy użytkownika są jawnie oznaczone jako lokalne/niezweryfikowane.
     Nie należy traktować ich jako potwierdzonych danych producenta.

6. Pakiet offline PRO
   - generuje samodzielny plik HTML z eksportem kursów, wpisów wiedzy,
     procedur, modeli, komponentów, danych atlasu i indeksu dokumentacji;
   - oferuje eksport/import JSON z walidacją struktury i limitem 25 MB;
   - zachowuje zagnieżdżone listy kroków, testów i procedur;
   - osobny przycisk pobiera 30 dokumentów biblioteki (około 66,7 MB (63,6 MiB) wg
     metadanych) do cache PWA tej przeglądarki.
   WAŻNE: pojedynczy HTML zawiera indeks/metadane dokumentów, nie osadza
   binarnych PDF/DOCX. Dokumenty są pobierane oddzielnie do cache przeglądarki.
   Pierwsze pobranie wymaga Internetu, działającego Service Workera i miejsca
   w pamięci urządzenia. Dane offline dotyczą tej przeglądarki/urządzenia;
   przeglądarka może je usunąć, np. przy czyszczeniu danych lub presji miejsca.

7. Generator raportów PDF
   - wypełnia raport z formularza albo ostatniego ćwiczenia;
   - zapisuje lokalną historię raportów;
   - przygotowuje stronę do wydruku; wybierz w oknie drukowania „Zapisz jako
     PDF”. Jeśli blokada wyskakującego okna uniemożliwi wydruk, dostępny jest
     fallback HTML.
   WAŻNE: FIX40 nie dołącza serwerowego silnika PDF ani własnego binarnego
   eksportera PDF. PDF powstaje przez funkcję drukowania przeglądarki.

URUCHOMIENIE I UŻYCIE
---------------------
1. Rozpakuj całe archiwum do nowego katalogu (nie nadpisuj działającej kopii).
2. Otwórz aplikację przez istniejący hosting Cloudflare Pages lub środowisko
   developerskie projektu; FIX40 jest modułem web/PWA, nie instalatorem EXE.
3. Odśwież aplikację, aby przeglądarka pobrała nowy HTML, CSS, JavaScript
   i Service Worker. Po pierwszej aktualizacji odczekaj na przejęcie strony
   przez Service Workera i odśwież ją ponownie.
4. Otwórz „Nauka PRO” / „Mój pulpit nauki PRO”.
5. Aby zapisać dokumenty bez sieci, będąc online wybierz „Pobierz bibliotekę
   do offline” i poczekaj na komunikat końcowy. Nie zamykaj karty w trakcie.
6. W trybie offline uruchom PWA w tej samej przeglądarce i na tym samym
   urządzeniu. Sprawdź osobno HTML offline i dokumenty z biblioteki.

TESTY I BEZPIECZEŃSTWO PUBLIKACJI
---------------------------------
- Uruchom WYKONAJ_TESTY_FIX40.cmd w Windows z Node.js.
- Runner sprawdza składnię trzech kluczowych plików i uruchamia wszystkie
  scripts/test-*.js oraz scripts/test-*.mjs.
- Test FIX40 obejmuje moduły, walidację pakietu offline, zachowanie danych
  zagnieżdżonych, zakładki legacy, próg egzaminu, pustą odpowiedź symulatora,
  poprawne bity QR i ochronę bramki publikacji.
- ONECLICK_AKADEMIA.js i AUTO_PUBLISH_WATCHER.js blokują publikację, gdy brakuje
  nowego widoku, plików, funkcji, testu lub obsługi offline biblioteki.
- Nie uruchamiano publikacji produkcyjnej ani migracji D1. Dane produkcyjne,
  bindingi, konta, endpointy i wcześniejsze moduły nie były modyfikowane.

OGRANICZENIA I WYMAGANE KONFIGURACJE
-----------------------------------
- Wyszukiwanie lokalne jest indeksem wiedzy; pełna odpowiedź generatywna
  wymaga istniejącego czatu AI i poprawnej konfiguracji jego dostawcy.
- Cache dokumentów wymaga pierwszego pobrania online. Nie jest to automatyczny
  transfer cache pomiędzy przeglądarkami, komputerami i profilami użytkownika.
- Certyfikaty QR nie są kwalifikowanymi, państwowymi ani podpisanymi
  kryptograficznie certyfikatami. To osiągnięcia edukacyjne tej aplikacji.
- Atlas nie deklaruje, że każdy Board ID/revizja są potwierdzone. Własne wpisy
  użytkownika są lokalne i niezweryfikowane do czasu niezależnego potwierdzenia.
- Raport PDF zależy od opcji drukowania dostępnej w przeglądarce/systemie.
- Wydanie nie było wdrażane na produkcję i nie wykonywano testów E2E
  w rzeczywistej przeglądarce ani testu na Windows Node.js 24.19.0.

IDENTYFIKACJA
-------------
Wersja platformy: 6.8.0
FIX: 40
Build: 6.8.0-social-login-fix40-learning-center-20261104
Data prac: 2026-11-04
