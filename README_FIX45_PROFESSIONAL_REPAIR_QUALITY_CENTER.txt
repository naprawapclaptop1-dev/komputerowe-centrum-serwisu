NAUKA OD A DO Z — 6.8.0 FIX45
PROFESSIONAL REPAIR & QUALITY CENTER
====================================

CEL WYDANIA
-----------
FIX45 dodaje osobny widok Professional Repair & Quality Center, łączący
Akademię i Professional Service. Wszystkie dotychczasowe moduły FIX44 i starsze
pozostają w projekcie.

NOWE OBSZARY
------------
1. PC Auto Identification — paszport urządzenia, dane wpisane przez użytkownika
   i inwentarz możliwości udostępnianych przez przeglądarkę.
2. Live Hardware Diagnostics — raport możliwości przeglądarki i import
   raportu sprzętowego; przeglądarka nie udostępnia uniwersalnego odczytu
   temperatur CPU/GPU ani pełnej identyfikacji płyty.
3. Professional Burn-in Test — ograniczony, ustępujący zadaniom przeglądarki
   test obliczeniowy JavaScript (100–5000 ms), a nie test stabilności CPU/GPU.
4. Repair Quality Control — lokalna lista kontrolna i zapis wyniku.
5. Universal Driver Laboratory — parsowanie identyfikatorów PCI/USB;
   bez automatycznego pobierania i instalowania sterowników.
6. Laptop Disassembly Academy — edukacyjna checklista demontażu.
7. Thermal Diagnostic PRO — lokalny dziennik ręcznie wpisanych lub
   zaimportowanych pomiarów i źródła danych.
8. Power Supply Academy — ocena wpisanych wartości szyn ATX; nie steruje
   fizycznym zasilaczem i nie certyfikuje jego sprawności.
9. Advanced SMD Database — edukacyjne przykłady oznaczeń; sam kod SMD nie
   wystarcza do jednoznacznej identyfikacji ani doboru zamiennika.
10. Windows Deployment Center — checklista przygotowania instalacji;
    nie uruchamia instalatora ani nie modyfikuje partycji.
11. Customer Device Passport — lokalne paszporty urządzeń.
12. Repair Workflow Automation — lokalne zadania i statusy.
13. Academy Course Creator — lokalne kursy i listy lekcji.
14. AI Repair Investigator — jawnie opisane lokalne hipotezy regułowe;
    nie jest autonomicznym modelem AI i nie potwierdza diagnozy.
15. Master Administrator Center — lokalne kontrole jakości i eksport raportu.
16. Hardware Bridge — sprawdzenie dostępności Web Serial/WebUSB; brak
    automatycznych komend zapisu lub sterowania sprzętem.
17. Backup — eksport i odtwarzanie lokalnego stanu FIX45.

POPRAWKA PUBLIKATORA Z LOGU UŻYTKOWNIKA
-------------------------------------
W AUTO_PUBLISH_WATCHER.js odczyt Service Worker (`sw`) przeniesiono przed
pierwsze użycie zmiennej w verifyLocalRelease(). Usuwa to błąd JavaScript:
"Cannot access 'sw' before initialization". Dodano test statyczny, który
sprawdza kolejność deklaracji i wymagane pliki FIX45.

Dodatkowo cache PWA zachowuje historyczne znaczniki i zawiera pełny bieżący
identyfikator buildu, wymagany przez starsze kontrakty wydania.

OPINIA O WCZEŚNIEJSZYCH WERSJACH
-------------------------------
FIX45 jest rozszerzeniem FIX44. Nie usuwa widoków, kursów, dokumentacji,
formularza opinii ani wcześniejszych laboratoriów.

URUCHOMIENIE LOKALNE (WINDOWS)
-----------------------------
1. Rozpakuj ZIP do nowego katalogu, nie nadpisując starego działającego katalogu.
2. Uruchom WYKONAJ_TESTY_FIX45.cmd.
3. Dopiero po przejrzeniu raportu zdecyduj o uruchomieniu publikatora.

UWAGA: ONECLICK_AKADEMIA.js i AUTO_PUBLISH_WATCHER.js są procesami publikacji.
Ich uruchomienie może wdrożyć pliki do istniejącego projektu Cloudflare Pages.
Nie uruchamiaj ich tylko po to, aby wykonać testy lokalne.

KONFIGURACJA I DANE
-------------------
- Klucz OPENAI_API_KEY pozostaje sekretem Cloudflare; FIX45 nie odczytuje go
  z plików projektu ani nie wymaga ponownego wklejania.
- Moduł FIX45 przechowuje swoje dane w localStorage przeglądarki.
- Eksport FIX45 obejmuje wyłącznie stan nowego modułu; nie modyfikuje danych
  pozostałych rozszerzeń.
- Dane klientów, numery seryjne i notatki wymagają ochrony przez operatora.
- Nie dodano migracji D1 ani zmian tabel kont.

OGRANICZENIA WERYFIKACJI
-----------------------
- Testy wykonano w środowisku przygotowawczym Node.js v22.16.0.
- Log użytkownika potwierdza Node.js v24.19.0 w jego Windows, ale nie oznacza
  to, że ten build został uruchomiony na jego komputerze.
- Nie wykonano testów E2E w rzeczywistej przeglądarce.
- Nie testowano fizycznych czujników, mierników, zasilaczy ani programatorów.
- Nie wykonano publikacji produkcyjnej, migracji D1 ani zmian w Cloudflare.
