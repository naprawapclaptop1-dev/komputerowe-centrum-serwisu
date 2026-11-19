# CHANGELOG

## 2.0.4 — FIX006
- Zmieniono dystrybucję na jedno archiwum ZIP.
- W ZIP znajduje się bezpośrednio instalator Setup.exe oraz kompletne pliki wersji portable w osobnym katalogu Portable.
- Usunięto ZIP portable z wnętrza paczki; użytkownik pobiera tylko jedno archiwum.
- CI sprawdza zawartość archiwum po rozpakowaniu i potwierdza, że nie ma w nim żadnego pliku ZIP.
- Zaktualizowano wersję aplikacji, instalatora, manifestu, interfejsu, raportu i dokumentacji.

## 2.0.3 — FIX005
- Naprawiono ścieżki Inno Setup: źródło publikacji i katalog wyjściowy są wskazywane względem lokalizacji INSTALLER.iss.
- Dodano kontrolę obecności aplikacji, instalatora Setup.exe i archiwum portable.
- Zaktualizowano BUILD.cmd i dokumentację.

## 2.0.2 — FIX004
- Całkowicie nowy, niezależny projekt WPF x64.
- Polski interfejs, pulpit monitoringu, sterowanie wentylatorami i inwentaryzacja.
- Monitoring sensorów LibreHardwareMonitor co 2 sekundy.
- Profile chłodzenia, tryb ręczny, przywracanie wartości domyślnych.
- Inwentaryzacja WMI/SMBIOS i dekodowanie nazwy monitora z EDID.
- Raport TXT i testy CI.
- Bezpieczny dolny limit suwaka 20%.
