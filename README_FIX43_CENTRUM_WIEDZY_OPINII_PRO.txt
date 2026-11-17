NAUKA OD A DO Z 6.8.0 — FIX43
CENTRUM WIEDZY, DIAGNOSTYKI I OPINII PRO
============================================================

BUILD: 6.8.0-social-login-fix43-knowledge-feedback-20261104
PUNKT WYJSCIA: NAUKA OD A DO Z 6.8.0 FIX42 REALNY WARSZTAT PRO
CHARAKTER: aplikacja WWW/PWA + API Cloudflare Pages Functions + D1

CO ZOSTALO DODANE
-----------------
1. FIX43 Knowledge Suite — osobna zakladka z 10 obszarami:
   - pulpit i lokalna mapa wiedzy,
   - Board Doctor (lokalne, jawne reguly i dopasowanie przypadkow),
   - analizator sekwencji zasilania,
   - opcjonalna telemetria Web Serial tylko do odczytu,
   - lokalna biblioteka dokumentow w IndexedDB,
   - katalog komponentow EDU i wlasnych pozycji,
   - dziennik dowodow naprawy oraz raport do druku/PDF,
   - weryfikator kompatybilnosci na podstawie danych podanych przez ucznia,
   - lokalny Knowledge Graph z historii i dokumentacji,
   - szyfrowana kopia Offline PRO 2.0.

2. Osobna zakladka „Ocen strone / Zglos problem”:
   - ocena od 1 do 5 gwiazdek,
   - osobne pola: co dodac, co zmienic, co nie dziala,
   - szczegoly i kontekst strony,
   - jawna zgoda na wyslanie zgloszenia,
   - lokalna historia i eksport JSON,
   - dobrowolna wysylka do POST /api/site-feedback,
   - skrzynka administratora GET/POST /api/admin/site-feedback.

3. Nowa addytywna migracja:
   migrations/0017_site_feedback_fix43.sql
   Nie usuwa ani nie przebudowuje tabel uzytkownikow. Tworzy osobna kolejke
   zgloszen i indeksy. Migracja nie zostala wykonana na produkcyjnej bazie D1.

BEZPIECZENSTWO I OGRANICZENIA
-----------------------------
- Sprzet: Web Serial jest opcjonalny i tylko do odczytu; aplikacja nie wysyla
  komend do miernika, zasilacza ani programatora. USB/HID nie sa sterowane.
- Board Doctor: lokalne dopasowanie regul i bazy przypadkow, nie automatyczne
  rozpoznawanie obrazu ani pewna diagnoza uszkodzenia.
- Analizator zasilania: profil edukacyjny; wartosci trzeba porownac z dokladnym
  schematem i rewizja badanej plyty.
- Katalog czesci: przyklady EDU; zamienniki wymagaja sprawdzenia kart katalogowych.
- Kompatybilnosc: ocenia parametry wpisane przez uzytkownika, nie pobiera
  automatycznie aktualnej bazy producentow.
- Dokumenty i postep pozostaja lokalnie w przegladarce, dopoki uzytkownik ich
  recznie nie wyeksportuje.
- Kopia Offline PRO 2.0 uzywa PBKDF2-SHA-256 i AES-256-GCM; haslo nie jest
  zapisywane przez aplikacje. Nalezy zachowac je poza komputerem.
- Opinie sa zapisywane lokalnie przed wysylka. Serwer wymaga zgody, same-origin,
  walidacji i limitu 8 zgloszen na godzine na pseudonimowy hash klienta.
  Surowy adres IP nie jest zapisywany w tabeli opinii.
- Skrzynka opinii jest chroniona kontrola administratora.

INSTALACJA / URUCHOMIENIE
-------------------------
1. Rozpakuj archiwum ZIP do osobnego katalogu roboczego.
2. Nie nadpisuj katalogu dzialajacego wdrozenia bez kopii zapasowej.
3. Do podgladu lokalnego uzyj istniejacej procedury projektu / OneClick.
4. Przed publikacja uruchom WYKONAJ_TESTY_FIX43.cmd.
5. CHECK_KONTA_FIX43.cmd jest kontrola tylko do odczytu.
6. W srodowisku Cloudflare najpierw przygotuj kopie D1 i sprawdz binding DB.
7. Migracje D1 wykonuj dopiero po oddzielnej decyzji o publikacji; FIX43 nie
   wykonuje ich automatycznie podczas przygotowania tego archiwum.

WAŻNE
-----
To kompletne archiwum projektu zrodlowego WWW/PWA, nie instalator EXE.
Nie przeprowadzono produkcyjnego deployu, migracji D1 ani pelnego E2E w
rzeczywistej przegladarce. Testy obejmuja testy regresji, lokalny runtime,
walidacje API w srodowisku testowym oraz lokalne verifyWeb().

Wersja aplikacji pozostaje 6.8.0. Numer poprawki: FIX43.
