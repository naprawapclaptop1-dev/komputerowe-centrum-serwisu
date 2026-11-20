# NAPRAWA PC FAN CONTROL PRO AI 2.0.5 — FIX007

Niezależna aplikacja Windows x64 zbudowana od czystego projektu. Nie jest modyfikacją ani rozpakowaną kopią instalatora V10.2.77.

## Uruchamianie po instalacji
Instalator uruchamia program z podwyższonymi uprawnieniami odziedziczonymi po instalatorze. Dzięki temu aplikacja z manifestem wymagającym administratora może zostać uruchomiona z ekranu końcowego Setup bez błędu Windows 740.

## Jedna paczka ZIP
Pakowanie wydania jest weryfikowane przez CI po ponownym rozpakowaniu archiwum i sprawdzeniu braku zagnieżdżonych plików ZIP.
Pobierasz tylko jedno archiwum ZIP. Po rozpakowaniu w głównym katalogu znajduje się:
- `Setup.exe` — instalator Windows.
- `Portable\` — komplet plików programu do uruchomienia bez instalacji, w tym `NaprawaPCFanControl.exe`.
- `README.txt` — krótka instrukcja.

W środku nie ma drugiego archiwum ZIP. Nie trzeba pobierać osobnego instalatora ani osobnego pliku portable.

## Funkcje
- Monitoring czujników CPU, GPU, RAM, płyty głównej, kontrolerów i dysków przez LibreHardwareMonitor.
- Temperatura, obciążenie, zegary, moc, napięcia i prędkości wentylatorów — w zakresie udostępnianym przez sprzęt i sterowniki.
- Profile chłodzenia: Cichy, Zrównoważony i Wydajny oraz ręczne sterowanie kanałami wystawionymi przez sterownik.
- Przywracanie ustawień domyślnych i próba przywrócenia kanałów przy zamykaniu aplikacji.
- Inwentaryzacja CPU, płyty, BIOS-u, modułów i slotów RAM, GPU, dysków, systemu oraz identyfikatorów monitorów z EDID.
- Raport tekstowy i ciemny interfejs w języku polskim.

## Budowanie
Wymagane: Windows 10/11 x64, .NET 10 SDK oraz Inno Setup 6. Uruchom BUILD.cmd. Pliki wynikowe trafiają do katalogu nadrzędnego `artifacts`; finalnym wydaniem jest jedno archiwum `NAPRAWA_PC_FAN_CONTROL_PRO_AI_2.0.5_FIX007_ONE_ZIP.zip`.

## Ograniczenia sprzętowe
Suwak ręczny ma bezpieczny dolny limit 20%, aby ograniczyć ryzyko przypadkowego zatrzymania wentylatora. Tryb Domyślne sterownika przywraca i pozostawia ustawienia domyślne.

Sterowanie wentylatorami jest dostępne wyłącznie wtedy, gdy kontroler, firmware i sterownik udostępniają kanał IControl. Wiele laptopów i płyt głównych pozwala tylko na odczyt albo blokuje zmianę obrotów z poziomu aplikacji Windows. Aplikacja nie obchodzi zabezpieczeń kontrolera i nie zapisuje ustawień BIOS/UEFI.

Inwentaryzacja EDID i WMI zależy od danych dostarczanych przez monitor, adapter, firmware i sterownik.

## Walidacja
CI sprawdza kompilację Windows x64, budowę Setup.exe, przygotowanie katalogu Portable, rozpakowanie końcowego ZIP i brak zagnieżdżonych archiwów ZIP. Sterowanie wentylatorami wymaga dodatkowego testu fizycznego na komputerze z obsługiwanym kontrolerem.
