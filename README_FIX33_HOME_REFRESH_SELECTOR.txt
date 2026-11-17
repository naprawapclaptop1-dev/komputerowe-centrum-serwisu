NAUKA OD A DO Z 6.8.0 FIX33 — INSTRUKCJA

1. Zachowaj kopię obecnego folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj całe archiwum FIX33 do folderu projektu, zachowując strukturę katalogów.
3. Uruchom URUCHOM_AKADEMIE.cmd. Nie twórz nowego projektu Pages ani nowej bazy D1.
4. Pozostaw jedno okno obserwatora otwarte. Po wdrożeniu watcher sprawdzi stały adres produkcyjny i raportuje osobno status oraz rozmiar CSS i JS strony startowej.
5. W razie potrzeby uruchom WYKONAJ_TESTY_FIX33.cmd. Kontrola API kont bez rejestracji użytkownika: CHECK_KONTA_FIX33.cmd.

Naprawiony błąd: watcher wcześniej wymagał .np30-module-grid, podczas gdy aktywny arkusz CSS używa .np640-module-grid. FIX33 współdzieli kontrakt walidacji między lokalnym publikatoriem i zdalnym watcherem.

Ważne: ta paczka została przetestowana lokalnie. Nie wykonano wdrożenia FIX33 ani zmian produkcyjnej bazy D1 z tego środowiska.
