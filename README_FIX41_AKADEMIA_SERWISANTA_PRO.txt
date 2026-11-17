NAUKA OD A DO Z 6.8.0 FIX41
AKADEMIA SERWISANTA PRO
===============================================

CHARAKTER WYDANIA
FIX41 jest rozszerzeniem istniejącej aplikacji WWW/PWA NAUKA OD A DO Z 6.8.0.
Zachowuje wcześniejsze moduły i dodaje centralne centrum Akademii Serwisanta PRO.
Nie jest instalatorem EXE ani samodzielnym programem desktopowym.

NOWE CENTRUM AKADEMII
W obrębie Centrum Nauki dodano 11 widoków:
1. Pulpit Akademii i skróty do wcześniejszych laboratoriów.
2. Konfigurator komputera PC z regułami zgodności socket/RAM/płyta/GPU/zasilacz.
3. Generator losowych przypadków diagnostycznych z procedurami i informacją zwrotną.
4. Atlas płyty EDU z Board ID, rewizją i warstwami elementów.
5. Laboratorium pomiarowe: edukacyjny multimetr, przebieg oscyloskopu i model zasilacza.
6. Repair Challenge z limitem czasu, pytaniami i oceną.
7. Akademia BIOS/UEFI z checklistą identyfikacji i analizą tylko do odczytu.
8. Trener SMD/BGA z checklistą jakości i bezpieczeństwa.
9. Knowledge Center z wyszukiwaniem w lokalnych bazach edukacyjnych.
10. Nauczyciel lokalny, który buduje kontekst z bazy wiedzy i pozwala ręcznie przekazać go do istniejącego czatu AI.
11. Centrum postępów ucznia z XP, poziomami i historią ćwiczeń FIX41.

INTEGRACJA Z WCZEŚNIEJSZYMI MODUŁAMI
Akademia prowadzi do wcześniej istniejących modułów PCB 3D, schematów/Boardview,
laboratorium elektroniki, warsztatu BIOS, kursów, egzaminów, biblioteki komponentów,
Repair Challenge i raportów. Nie zastępuje tych modułów ani nie usuwa ich kodu.

DANE I ZAPIS
Nowe wyniki FIX41 są przechowywane lokalnie w pamięci przeglądarki (localStorage)
pod kluczem npNaukaAkademiaSerwisantaFix41. Stan ma ograniczenia liczby rekordów
oraz walidację podczas odczytu. Wcześniejsze moduły zachowują własne mechanizmy
zapisu i postępu; centrum FIX41 nie migruje ich automatycznie do jednego magazynu.

WAŻNE OGRANICZENIA
- Laboratorium pomiarowe FIX41 jest symulacją edukacyjną, nie steruje prawdziwym
  multimetrem, oscyloskopem ani zasilaczem.
- Symulator konfiguracji PC sprawdza wybrane reguły szkoleniowe; nie zastępuje
  listy obsługiwanych CPU, QVL pamięci, sprawdzenia BIOS, wymiarów i weryfikacji
  konkretnych modeli przez producenta.
- Nauczyciel lokalny wyszukuje wiedzę z lokalnego katalogu. Nie jest samodzielnym
  generatywnym modelem AI. Przekazanie kontekstu do istniejącego czatu następuje
  po świadomym kliknięciu użytkownika.
- Checklista BIOS jest edukacyjna i tylko do odczytu. FIX41 nie programuje kości,
  nie modyfikuje wsadów ani nie wykonuje flashowania.
- Atlas w FIX41 ma warstwy edukacyjne. Pełny interaktywny podgląd PCB 3D i schematy
  pozostają w zachowanych wcześniejszych modułach.
- Certyfikaty i wyniki ćwiczeń lokalnych nie są automatycznie poświadczane przez
  zewnętrzny urząd certyfikujący. Weryfikację online należy skonfigurować osobno.

URUCHOMIENIE LOKALNE
1. Rozpakuj całe archiwum, zachowując strukturę katalogów.
2. Do testów wymagany jest Node.js z obsługą ES modules.
3. W Windows uruchom WYKONAJ_TESTY_FIX41.cmd.
4. Aplikację WWW/PWA uruchamiaj przez istniejący lokalny serwer/deweloperski
   mechanizm projektu lub publikację Cloudflare Pages zgodną z konfiguracją.
   Nie otwieraj index.html przez file://, ponieważ funkcje PWA/API wymagają serwera.

PUBLIKACJA
Przed publikacją sprawdź WEB_PUBLISH/release.json, konfigurację Cloudflare Pages,
sekrety OAuth i wymagane migracje D1. One-click publisher oraz watcher mają teraz
wymagania FIX41 dla plików runtime/CSS/testu i cache PWA. Nie uruchomiono wdrożenia
produkcyjnego ani migracji bazy podczas przygotowania tego archiwum.

NUMER WYDANIA
Numer wersji produktu pozostaje 6.8.0. Identyfikator kompilacji:
6.8.0-social-login-fix41-service-academy-20261104
