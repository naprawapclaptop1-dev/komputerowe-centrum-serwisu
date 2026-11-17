NAUKA OD A DO Z — DLA WSZYSTKICH
WYDANIE 6.8.0 FIX36 — CENTRUM WSPARCIA I SPOŁECZNOŚCI
=====================================================

CO ZAWIERA FIX36
----------------
FIX36 rozwija istniejącą, osobną zakładkę „Wesprzyj platformę”. Nie zastępuje
pozostałych modułów i nie tworzy drugiego projektu ani drugiej bazy danych.

1. Dziennik zmian FIX30–FIX36 z rozróżnieniem kodu lokalnego i wdrożenia.
2. Propozycje tematów i funkcji; zgłoszenia oczekują na moderację.
3. Głosowanie na zatwierdzone propozycje, przypisane do konta, z możliwością
   cofnięcia głosu.
4. Przypadki serwisowe dla nauki przekazywane do istniejącego API wiedzy i
   istniejącej kolejki moderacji. To nie jest formularz zlecenia naprawy.
5. Raport rzeczywistych kosztów. Publicznie widoczne są wyłącznie pozycje
   opublikowane przez administratora z publicznym dowodem HTTPS. Nie ma
   automatycznych ani szacowanych kwot.
6. Tablica podziękowań wymagająca osobnej, wyraźnej zgody. Użytkownik może
   usunąć swój wpis przez wycofanie zgody.
7. Obserwowanie aktualności wewnątrz platformy, licznik nieprzeczytanych wpisów
   i przycisk oznaczenia ich jako przeczytane. To nie jest e-mail ani push.
8. Panel administratora korzystający z istniejącego ADMIN_REVIEW_TOKEN.
9. Zbiorczy przycisk „Odśwież centrum” do ponownego pobrania danych sekcji.

PRYWATNOŚĆ I MODERACJA
---------------------
- Zgłoszenia propozycji i przypadków wymagają konta autora.
- Propozycje są prywatne do czasu decyzji moderatora.
- Przypadki korzystają z istniejącej moderacji wiedzy i wymagają potwierdzenia
  praw oraz licencji edukacyjnej.
- Publiczna tablica podziękowań działa wyłącznie po wyraźnej zgodzie; można ją
  wycofać.
- Koszty stają się publiczne dopiero po wprowadzeniu dowodu HTTPS przez
  administratora.
- Ogłoszenia mogą pozostać szkicem; dopiero moderator publikuje je publicznie.
- Teksty użytkowników są kodowane przy wyświetlaniu, a zapisy chronią kontrola
  same-origin, sesja, limity operacji i token administratora.
- Nie dodano formularzy zleceń napraw ani automatycznego publikowania wpisów.

MIGRACJA D1
-----------
Dodano addytywną migrację migrations/0016_support_community_center.sql.
Tworzy sześć nowych tabel społecznościowych. Nie usuwa ani nie przebudowuje
istniejących tabel kont, kursów, płatności, wiedzy ani statystyk.

Podczas normalnego uruchomienia głównego procesu publikacji OneClick powinien
najpierw wykonać kopię istniejącej bazy D1, a następnie zastosować oczekujące
migracje. W tym przygotowaniu FIX36 migracja NIE była wykonywana na produkcyjnej
bazie Cloudflare. Nie twórz nowego projektu ani nowej bazy.

INSTALACJA / URUCHOMIENIE
-------------------------
1. Zrób kopię folderu projektu, np. G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj pełną paczkę FIX36 do tego folderu, zachowując strukturę katalogów.
3. Uruchom WYKONAJ_TESTY_FIX36.cmd.
4. Jeśli testy przejdą, uruchom dotychczasowy URUCHOM_AKADEMIE.cmd.
5. Zachowaj okno procesu publikacji i sprawdź końcowe potwierdzenie stałego
   adresu produkcyjnego.
6. Po publikacji możesz uruchomić CHECK_KONTA_FIX36.cmd. Ten test używa
   wyłącznie adresu e-mail .invalid w próbie negatywnej; nie tworzy prawdziwego
   konta.

Panel wsparcia jest w widoku administratora. Najpierw użyj istniejącego
połączenia panelu administratora przez ADMIN_REVIEW_TOKEN, następnie wybierz
„Pobierz kolejkę wsparcia”. Przypadki serwisowe pozostają w dotychczasowej
kolejce „Przypadki napraw”.

WYNIKI KONTROLI
---------------
54/54 skryptów testowych PASS.
164 pliki JS/MJS/CJS — bez błędów składni.
40 arkuszy CSS — bez błędów parsera.
704 unikalne identyfikatory HTML — bez duplikatów.
127 lokalnych odwołań do zasobów — 0 brakujących.
26 niezależnych widoków platformy.
Pełny lokalny verifyWeb() publikatora: PASS; 1060 lekcji, 12 kart diagnostycznych.
Pełny łańcuch migracji 0001–0016 i testy API wykonane na lokalnej SQLite: PASS.
Porównanie z FIX35: 0 usuniętych plików, 13 nowych plików źródłowych/projektowych.

OGRANICZENIA TESTU
------------------
Testy przygotowania wykonano w Node.js v22.16.0. Nie wykonano testu na Twoim
Windows z Node.js v24.19.0, rzeczywistego testu E2E w przeglądarce ani publikacji
na Cloudflare. Migracja D1 nie była wykonywana na produkcji. FIX36 jest paczką
lokalną gotową do sprawdzenia i uruchomienia, a nie potwierdzeniem wdrożenia.

Wersja: 6.8.0
Build: 6.8.0-social-login-fix36-support-community-center-20261104
