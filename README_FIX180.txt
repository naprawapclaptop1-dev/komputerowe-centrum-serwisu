NAUKA OD A DO Z 6.8.0 — FIX180
DIAGNOSTYKA SYSTEMOWA WINDOWS I NARZĘDZIA SERWISOWE PRO

CEL
Dodano tylko nowe kursy związane z serwisem komputerów stacjonarnych i laptopów.
FIX180 został poprzedzony audytem pełnego aktywnego katalogu 1083 lekcji oraz 155
wpisów generatora awarii. Nie kopiowano istniejących tematów ogólnych: BIOS/UEFI,
VRM, RAM, GPU, SSD/NVMe, BGA/SMD, matryce, USB-C/PD, chłodzenie, podstawowy
Windows Rescue, odzyskiwanie danych, przyjęcie urządzenia i raport naprawy.

NOWE ELEMENTY
- 15 specjalistycznych lekcji, każda z celami, teorią, procedurą, BHP i 3 pytaniami.
- 13 nowych przypadków z etapami: diagnoza, plan, walidacja.
- 10 projektów praktycznych z listami etapów i rezultatami.
- 28 unikalnych pojęć w słowniku.
- Notatki lokalne, wyszukiwarka, filtry, eksport raportu i kopii postępów.
- Punkty przekazywane do istniejącego profilu i dziennika serwisanta; osobny klucz
  postępów FIX180, bez nadpisywania FIX179.

ZAKRES NOWYCH LEKCJI
WPR/WPA/ETW, ślad rozruchu, Modern Standby/SleepStudy, SetupDiag i Panther,
SetupAPI.dev.log, Driver Store/PnPUtil, WER LocalDumps, diagnostyka preboot OEM,
HVCI/Memory Integrity, NDIS/WFP/netsh trace, GPO/MDM/GPResult, sterowniki WinPE,
USB Selective Suspend, aktywacja po zmianie płyty głównej oraz bezpieczny pakiet
dowodów diagnostycznych.

ZACHOWANIE ISTNIEJĄCEGO PROJEKTU
- Produkt nadal 6.8.0.
- Bez nowego widoku; FIX180 jest 15. zakładką obecnej Akademii Mistrza Serwisu.
- Bez nowych tabel i bez migracji D1.
- Bez zmiany konfiguracji Cloudflare, tokenów, domen, bazy lub mechanizmu publikacji.
- Zachowano dotychczasową zawartość, dane, istniejące klucze postępów oraz FIX179.
- Cache PWA zachowuje dotychczasową nazwę; dwa nowe zasoby dodano do istniejącej listy CORE.

INSTALACJA / TEST
1. Zrób kopię aktualnego folderu projektu.
2. Rozpakuj FIX180 do istniejącego folderu projektu i zezwól na zastąpienie plików.
3. Nie usuwaj .dev.vars, tokenów OAuth, wrangler.toml, TOOLS_CLOUDFLARE ani kopii D1.
4. Uruchom WYKONAJ_TESTY_FIX180.cmd.
5. Dopiero po PASS użyj dotychczasowego START_FIX105.cmd do publikacji.
6. Publikację potwierdza dopiero nowy log z komputera użytkownika.

BEZPIECZEŃSTWO
Treści są edukacyjne. Nie wykonują komend na sprzęcie. Nie zapisuj haseł,
kluczy BitLocker, kluczy produktu, tokenów ani danych klientów. Ślady ETW,
GPResult, dumpy i logi mogą zawierać prywatne metadane. Zbieraj minimum danych,
uzyskaj zgodę i stosuj dokumentację producenta dla konkretnego modelu.

ŹRÓDŁA TECHNICZNE
- https://learn.microsoft.com/pl-pl/windows-hardware/test/wpt/
- https://learn.microsoft.com/en-us/windows-hardware/test/wpt/introduction-to-wpr
- https://learn.microsoft.com/en-us/windows-hardware/test/wpt/wpr-command-line-options
- https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby-sleepstudy
- https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options
- https://learn.microsoft.com/en-us/windows/deployment/upgrade/setupdiag
- https://learn.microsoft.com/en-us/troubleshoot/windows-client/setup-upgrade-and-drivers/windows-setup-log-file-locations
- https://learn.microsoft.com/en-us/windows-hardware/drivers/install/setupapi-device-installation-log-entries
- https://learn.microsoft.com/pl-pl/windows-hardware/drivers/devtest/pnputil-command-syntax
- https://learn.microsoft.com/pl-pl/windows/win32/wer/collecting-user-mode-dumps
- https://learn.microsoft.com/en-us/windows-hardware/test/hlk/testref/driver-compatibility-with-device-guard
- https://learn.microsoft.com/pl-pl/windows-server/administration/windows-commands/netsh-trace
- https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpresult
- https://learn.microsoft.com/en-us/windows-hardware/drivers/usbcon/usb-selective-suspend
- https://support.microsoft.com/pl-pl/windows/activation/reactivating-windows-after-a-hardware-change
