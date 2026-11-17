NAUKA OD A DO Z 6.8.0 — FIX182
=============================

NOWY DZIAŁ: LINUX, UEFI SHELL, DIAGNOSTYKA OEM, BMC/REDFISH I CHROMEOS

Gdzie szukać:
  Akademia Mistrza Serwisu -> zakładka „Linux, UEFI Shell, OEM, BMC i ChromeOS FIX182”.

W module dostępne są:
  * 20 lekcji / 5 specjalizacji (po 4 lekcje na specjalizację)
  * 60 pytań kontrolnych z wyjaśnieniami
  * 17 trudnych przypadków, każdy z trzema etapami
  * 10 projektów praktycznych z checklistą
  * 40 haseł słownika
  * egzamin 16 pytań, zaliczenie od 80%
  * 5 symulatorów na przykładowych danych
  * notatki, lokalny postęp, historia egzaminów, kopia postępu i raport JSON

SYMULATORY — CO NAPRAWDĘ ROBIĄ
  1. Linux Rescue: podpowiada bezpieczny pierwszy krok w scenariuszu; niczego nie naprawia na dysku.
  2. UEFI Shell: pokazuje przykładowy wynik wybranej komendy odczytowej; nie łączy się z firmware.
  3. OEM Report Analyzer: sprawdza wyłącznie format przykładowego kodu/ID; nie łączy się z Dell/HP/Lenovo.
  4. Redfish: wyświetla statyczny przykładowy JSON; nie wykonuje żądań HTTP ani nie łączy się z BMC.
  5. ChromeOS: prezentuje procedurę decyzyjną zależnie od statusu urządzenia; nie resetuje Chromebooka.

DANE I PRYWATNOŚĆ
  Postęp FIX182 jest oddzielny i zapisywany lokalnie w przeglądarce (localStorage).
  Nie jest to synchronizacja pomiędzy urządzeniami/kontami. Notatki nie powinny zawierać haseł,
  kluczy szyfrowania, numerów seryjnych ani danych klienta. Można wyeksportować kopię JSON.

INSTALACJA / AKTUALIZACJA
  1. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
  2. Rozpakuj zawartość FIX182 do istniejącego folderu projektu, zastępując zmienione pliki.
  3. Zachowaj własne .dev.vars, wrangler.toml, tokeny, TOOLS_CLOUDFLARE i kopię D1.
  4. Uruchom WYKONAJ_TESTY_FIX182.cmd.
  5. Po wyniku PASS uruchom istniejący START_FIX105.cmd.
  6. Prześlij nowy START_FIX105.log w celu potwierdzenia publikacji online.

Nie wykonano migracji D1, nie utworzono nowego projektu i nie zmieniono numeru wersji 6.8.0.
FIX182 jest przygotowany i przetestowany lokalnie; nie należy zakładać, że jest już opublikowany.

Dokumentacja źródłowa poszczególnych lekcji jest podpięta w panelu (UEFI Forum, Btrfs, cryptsetup,
Dell, HP, Lenovo, DMTF, Google i Chromium).
