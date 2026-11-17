NAUKA OD A DO Z — FIX42 / REALNY WARSZTAT SERWISOWY PRO
=======================================================
Wersja aplikacji: 6.8.0
Build: 6.8.0-social-login-fix42-real-workshop-20261104
Data przygotowania: 2026-11-04

CEL WYDANIA
-----------
FIX42 dodaje jeden panel Realny Warsztat PRO do istniejącego Centrum Nauki.
Nie usuwa Akademii Serwisanta FIX41 ani wcześniejszych modułów FIX40 i starszych.

NOWE MODUŁY
-----------
1. Schematy / Boardview Studio
   - lokalny podgląd PDF;
   - import Boardview CSV i JSON z oznaczeniem/refdes oraz współrzędnymi x/y;
   - mapa pozycji komponentów, wybór elementu i metadane;
   - szablon CSV i eksport zaimportowanej mapy JSON.
   - pliki PDF nie są trwale zapisywane w localStorage; po odświeżeniu trzeba
     wskazać je ponownie. Import obsługuje wyłącznie jawnie określony CSV/JSON,
     a nie zamknięte, binarne formaty producentów.

2. Laboratorium elektroniki EDU
   - multimetr: napięcie, rezystancja i ciągłość z walidacją trybu;
   - blokada rezystancji/ciągłości w stanie zasilanym;
   - symulator zasilacza 0–24 V / 0–5 A z ograniczeniem prądowym;
   - generator przebiegu sinus/prostokąt/trójkąt do wizualizacji oscyloskopu;
   - dziennik ćwiczeń pomiarowych.
   - nie komunikuje się z przyrządami USB ani prawdziwym sprzętem.

3. Diagnostyka wspomagana
   - deterministyczny silnik reguł dla typowych objawów PC/laptop;
   - lista hipotez, opis niepewności, kolejne testy i warunki STOP;
   - jawne przekazanie kontekstu do istniejącego czatu AI; nic nie wysyła się samo.
   - nie jest autonomicznym modelem AI i nie stwierdza pewnej awarii układu.

4. Service Desk / zlecenia serwisowe
   - przyjęcie urządzenia, model, objaw, stan, diagnoza i plan prac;
   - statusy: przyjęte, diagnostyka, oczekiwanie na część, naprawa,
     test końcowy, zakończone i wstrzymane;
   - koszt części, robocizna, suma; raport do wydruku / Zapisz jako PDF;
   - dane zleceń są lokalne w profilu przeglądarki.

5. Hardware Master / części
   - przykładowe profile edukacyjne MOSFET, diod, bezpieczników,
     kondensatorów, dławików, rezystorów, ESD i termiki;
   - filtrowanie parametrów, obudowy, napięcia, prądu i polaryzacji;
   - lista magazynowa zapisywana lokalnie.
   - katalog EDU nie jest katalogiem producenta ani potwierdzeniem zamiennika.
     Pinout, SOA, termika, footprint i datasheet muszą być sprawdzone osobno.

6. Windows Rescue / wyzwania
   - checklisty edukacyjne BCD, BSOD/minidump, odzyskiwania danych i SMART;
   - rejestr postępu checklist;
   - losowy quiz diagnostyczny i zapis wyniku.
   - nie wykonuje komend systemowych ani nie modyfikuje partycji/dysków.

DANE I PRYWATNOŚĆ
-----------------
- Stan FIX42 zapisuje się pod kluczem localStorage:
  npNaukaRealWorkshopFix42
- Dostępny jest eksport i import kopii JSON.
- Zlecenia i wpisy pozostają w przeglądarce na tym urządzeniu.
- Nie przechowuj haseł, kluczy BitLocker, numerów seryjnych, danych osobowych
  ani poufnych danych klientów w lokalnym rejestrze edukacyjnym.
- Przed czyszczeniem danych przeglądarki wykonaj kopię FIX42.

INTEGRACJA
----------
- FIX42 znajduje się jako nowa zakładka w istniejącym „Mój pulpit nauki PRO”.
- FIX40 nadal obsługuje pulpit, zakładki, wyszukiwarkę, stół, egzaminy QR,
  atlas, offline i raporty.
- FIX41 nadal obsługuje Akademię Serwisanta, składanie PC, generator usterek,
  atlas edukacyjny, pomiary, BIOS, SMD/BGA, wiedzę i postępy.
- Skróty FIX42 przełączają widoczność nadrzędnej sekcji przed otwarciem FIX41.
- Service Worker ma nowy namespace FIX42 i pre-cache obu zasobów warsztatu.

TESTY
-----
Uruchom na Windows z Node.js:
  WYKONAJ_TESTY_FIX42.cmd

Skrypt sprawdza składnię wszystkich plików JS/MJS/CJS oraz uruchamia każdy
skrypt scripts/test-*.js i scripts/test-*.mjs, w tym testy FIX40/FIX41/FIX42.

PUBLIKACJA
----------
- release.json, meta academy-build i API statusu mają wspólny identyfikator FIX42.
- One-click publisher sprawdza pliki, metadane, test regresji i cache PWA.
- Auto Publish Watcher sprawdza zasoby lokalne oraz po wdrożeniu zdalne zasoby
  FIX42 (JS/CSS) i Service Worker.
- Nie uruchomiono publikacji produkcyjnej ani migracji Cloudflare D1.
- Nie należy uznawać deploymentu za PASS, dopóki zdalny watcher nie potwierdzi
  właściwego buildu i zasobów.
