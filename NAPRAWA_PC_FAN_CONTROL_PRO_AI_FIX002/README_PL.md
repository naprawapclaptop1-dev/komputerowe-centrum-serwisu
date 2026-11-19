# NAPRAWA PC FAN CONTROL PRO AI 2.0.0 — FIX002

Niezależna aplikacja Windows x64 zbudowana od czystego projektu. Nie jest modyfikacją ani rozpakowaną kopią instalatora V10.2.77.

## Funkcje
- Monitoring czujników CPU, GPU, RAM, płyty głównej, kontrolerów i dysków przez LibreHardwareMonitor.
- Temperatura, obciążenie, zegary, moc, napięcia i prędkości wentylatorów — w zakresie udostępnianym przez sprzęt i sterowniki.
- Profile chłodzenia: Cichy, Zrównoważony i Wydajny oraz ręczne sterowanie kanałami wystawionymi przez sterownik.
- Przywracanie ustawień domyślnych i próba przywrócenia kanałów przy zamykaniu aplikacji.
- Inwentaryzacja CPU, płyty, BIOS-u, modułów i slotów RAM, GPU, dysków, systemu oraz identyfikatorów monitorów z EDID.
- Raport tekstowy i ciemny interfejs w języku polskim.

## Budowanie
Wymagane: Windows 10/11 x64 i .NET 10 SDK. Uruchom BUILD.cmd. Wynik pojawi się w publish\win-x64.
Instalator: otwórz INSTALLER.iss w Inno Setup 6 lub nowszym po zbudowaniu programu.

## Ograniczenia sprzętowe
Sterowanie wentylatorami jest dostępne wyłącznie wtedy, gdy kontroler, firmware i sterownik udostępniają kanał IControl. Wiele laptopów i płyt głównych pozwala tylko na odczyt albo blokuje zmianę obrotów z poziomu aplikacji Windows. Aplikacja nie obchodzi zabezpieczeń kontrolera i nie zapisuje ustawień BIOS/UEFI. Automatyczne profile działają wyłącznie na wykrytych kanałach kontrolowanych.

Inwentaryzacja EDID i WMI zależy od danych dostarczanych przez monitor, adapter, firmware i sterownik. Niektóre stacje dokujące lub przejściówki nie przekazują modelu matrycy.

## Bezpieczeństwo
Nie ma automatycznego flashowania BIOS-u ani wymuszania nieobsługiwanych wartości. Program wymaga uprawnień administratora do części odczytów i dostępu do kontrolerów.

## Walidacja
CI sprawdza kompilację i publikację Windows x64. Sterowanie wentylatorami wymaga dodatkowego testu na fizycznym komputerze z obsługiwanym kontrolerem.