# FIX198 — Rzeczywisty odczyt sprzętu Windows

## Uruchomienie
1. Rozpakuj projekt na komputerze Windows 10/11.
2. Uruchom `WYKONAJ_DIAGNOSTYKE_SPRZETU_FIX198.cmd`.
3. Skrypt zapisze raport JSON i TXT w folderze `AKADEMIA_RAPORTY_SPRZET` na pulpicie.
4. W aplikacji otwórz laboratorium serwisowe i wybierz raport JSON w kontrolce FIX198.

## Zakres
Kolektor korzysta z CIM/Storage/Windows Event Log, identyfikuje procesor, płytę, BIOS, pamięć, GPU, dyski, wybrane sterowniki, baterię, obsługiwane strefy ACPI oraz wybrane zdarzenia WHEA/PCIe/Storage/Display.

## Ważne
Kolektor nie gwarantuje odczytu temperatur CPU/GPU ani RPM wentylatorów, ponieważ zależą one od sprzętu i sterowników. Wartość VRAM z Win32_VideoController jest tylko orientacyjna — pole WMI może mieć ograniczenie 32-bitowe. Nie wykonuje napraw, flashowania ani testów obciążeniowych. Raport może zawierać treść zdarzeń systemowych z lokalnymi ścieżkami lub nazwami kont — sprawdź go przed udostępnieniem. Raport jest importowany lokalnie, bez automatycznego uploadu.
