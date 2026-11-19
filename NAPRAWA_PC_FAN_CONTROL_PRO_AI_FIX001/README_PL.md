# NAPRAWA PC FAN CONTROL PRO AI — FIX001

Nowa, samodzielna aplikacja Windows WPF, napisana od podstaw. Nie jest modyfikacją poprzedniego ZIP-a Fan Control.

## Funkcje
- Monitoring temperatur CPU/GPU/RAM/płyty głównej i dysków — wyłącznie gdy urządzenia udostępniają czujniki.
- Odczyt obrotów wentylatorów (RPM).
- Sterowanie programowe tylko kanałami, które LibreHardwareMonitor zgłasza przez IControl.
- Ręczne ustawianie wartości z potwierdzeniem użytkownika.
- Profil automatyczny Cichy / Zrównoważony / Wydajny. Wymaga sterowalnego kanału i pomiaru temperatury CPU/GPU.
- Przywracanie sterowania domyślnego BIOS/EC.
- Inwentaryzacja CPU, płyty, BIOS, RAM i slotów, GPU, dysków i woluminów przez WMI/SMBIOS.
- Identyfikacja monitora i nazwy zapisanej w EDID.
- Alarm ostrzegawczy przy temperaturze co najmniej 90°C.
- Raport tekstowy na pulpit.

## Wymagania
- Windows 10 lub 11 x64
- .NET 10 SDK do budowania
- Połączenie internetowe do pierwszego pobrania pakietów NuGet

## Budowanie
Uruchom BUILD.cmd. Wynik:
publish\NAPRAWA_PC_FAN_CONTROL_PRO_AI.exe

## Instalator
Po zbudowaniu projektu skompiluj INSTALLER.iss za pomocą Inno Setup 6+.

## Ważne ograniczenia
- Wykrywanie czujników i sterowalnych kanałów zależy od chipsetu, firmware'u, kontrolera EC i sterownika.
- Temperatura pamięci RAM i każdego dysku nie jest udostępniana przez wszystkie urządzenia.
- Dokładny model panelu laptopa będzie widoczny tylko wtedy, gdy producent umieścił nazwę w EDID; w innym przypadku pokażemy kod producenta i produktu.
- Liczba slotów RAM pochodzi z SMBIOS. Jeżeli BIOS jej nie podaje, program pokazuje wykryte moduły i nie zgaduje liczby pustych gniazd.
- Sterowanie wymaga uruchomienia z uprawnieniami administratora. Program pokazuje tylko kanały udostępnione przez IControl; nie wysyła surowych zapisów do nieznanych rejestrów.

## Zależności
LibreHardwareMonitorLib 0.9.6 (MPL-2.0) oraz System.Management 10.0.15 (MIT). Szczegóły w THIRD-PARTY-NOTICES.md.
