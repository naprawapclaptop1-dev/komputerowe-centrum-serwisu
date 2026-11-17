NAUKA OD A DO Z 6.8.0 — FIX185
CENTRUM DIAGNOSTYKI NAJWYŻSZEGO POZIOMU

1. Wdrożenie do istniejącego projektu
- Wykonaj kopię folderu G:\AKADEMIA_SERWISU_PRO.
- Otwórz ZIP i rozpakuj jego zawartość bezpośrednio do G:\AKADEMIA_SERWISU_PRO (nie twórz dodatkowego podfolderu). Zezwól na zastąpienie wyłącznie plików o tych samych ścieżkach.
- Nie usuwaj .dev.vars, wrangler.toml, TOOLS_CLOUDFLARE, tokenów, certyfikatów ani kopii D1.
- Nie twórz nowego projektu Cloudflare Pages i nie twórz nowej bazy D1.

2. Testy
- Uruchom WYKONAJ_TESTY_FIX185.cmd.
- Wynik PASS powinien zakończyć się kodem 0.
- Pełny log jest zapisywany w FIX185_FULL_TESTS.log.
- Nie kontynuuj publikacji, jeżeli którykolwiek test zakończy się FAIL.

3. Publikacja
- Po wyniku PASS uruchom dotychczasowy START_FIX105.cmd.
- Przekaż START_FIX105.log do analizy. Raport porównania plików znajduje się w FIX185_FILE_CHANGE_REPORT.txt.
- FIX185 nie jest uznany za opublikowany, dopóki watcher nie potwierdzi nowej metadanej online, panelu HTML i zasobów Service Workera na stałej domenie.

4. Nowy moduł
- Otwórz Akademię Serwisu i wybierz 20. zakładkę: ETW, PCIe, Storage, PCB i Firmware FIX185.
- W panelu są lekcje, quizy, przypadki, projekty, egzamin, słownik, 8 narzędzi edukacyjnych i eksport raportu.
- Dane postępów FIX185 są lokalne i odrębne od poprzednich poprawek.

5. Ważne ograniczenia
- Narzędzia pokazują przykładowe scenariusze i dane symulowane.
- Nie uruchamiają WPR/WPA, WinDbg, poleceń systemowych, sterowników ani poleceń PowerShell.
- Nie komunikują się ze sprzętem, PCIe, kontrolerami dysków ani firmware.
- Syntetyczny przebieg nie jest pomiarem oscyloskopu.
- Materiały edukacyjne nie zastępują instrukcji producenta i procedur ESD/bezpieczeństwa.
