# NAPRAWA PC FAN CONTROL PRO AI 2.0.3 — FIX005

Niezależna aplikacja Windows x64 zbudowana od czystego projektu. Nie jest modyfikacją ani rozpakowaną kopią instalatora V10.2.77.

## Funkcje
- Monitoring czujników CPU, GPU, RAM, płyty głównej, kontrolerów i dysków przez LibreHardwareMonitor.
- Temperatura, obciążenie, zegary, moc, napięcia i prędkości wentylatorów — w zakresie udostępnianym przez sprzęt i sterowniki.
- Profile chłodzenia: Cichy, Zrównoważony i Wydajny oraz ręczne sterowanie kanałami wystawionymi przez sterownik.
- Przywracanie ustawień domyślnych i próba przywrócenia kanałów przy zamykaniu aplikacji.
- Inwentaryzacja CPU, płyty, BIOS-u, modułów i slotów RAM, GPU, dysków, systemu oraz identyfikatorów monitorów z EDID.
- Raport tekstowy i ciemny interfejs w języku polskim.

## Budowanie
Wymagane: Windows 10/11 x64, .NET 10 SDK oraz Inno Setup 6 (dla instalatora Setup.exe). Uruchom BUILD.cmd z katalogu projektu. Wyniki trafiają do katalogu `artifacts` poziom wyżej: aplikacja publikowana, archiwum portable ZIP i instalator Setup.exe.

W CI budowanie jest wykonywane na Windows x64. Skrypt instalatora wskazuje katalog publikacji oraz katalog wyjściowy względem położenia pliku INSTALLER.iss, dzięki czemu nie zależy od bieżącego katalogu roboczego.

## Ograniczenia sprzętowe
Suwak ręczny ma bezpieczny dolny limit 20%, aby ograniczyć ryzyko przypadkowego zatrzymania wentylatora. Tryb Domyślne sterownika przywraca i pozostawia ustawienia domyślne.

Sterowanie wentylatorami jest dostępne wyłącznie wtedy, gdy kontroler, firmware i sterownik udostępniają kanał IControl. Wiele laptopów i płyt głównych pozwala tylko na odczyt albo blokuje zmianę obrotów z poziomu aplikacji Windows. Aplikacja nie obchodzi zabezpieczeń kontrolera i nie zapisuje ustawień BIOS/UEFI. Automatyczne profile działają wyłącznie na wykrytych kanałach kontrolowanych.

Inwentaryzacja EDID i WMI zależy od danych dostarczanych przez monitor, adapter, firmware i sterownik. Niektóre stacje dokujące lub przejściówki nie przekazują modelu matrycy.

## Bezpieczeństwo
Nie ma automatycznego flashowania BIOS-u ani wymuszania nieobsługiwanych wartości. Program wymaga uprawnień administratora do części odczytów i dostępu do kontrolerów.

## Walidacja
CI sprawdza przywracanie pakietów, kompilację i publikację Windows x64, kompilację instalatora Inno Setup, utworzenie archiwum portable i obecność gotowych artefaktów. Sterowanie wentylatorami wymaga dodatkowego testu na fizycznym komputerze z obsługiwanym kontrolerem.
