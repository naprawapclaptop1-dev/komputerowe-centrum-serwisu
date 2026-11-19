# CHANGELOG

## 2.0.3 — FIX005
- Naprawiono ścieżki Inno Setup: źródło publikacji i katalog wyjściowy są wskazywane względem lokalizacji INSTALLER.iss, a nie bieżącego katalogu repozytorium.
- Zmieniono kontrolę wyników CI: build sprawdza obecność aplikacji, instalatora Setup.exe i archiwum portable.
- BUILD.cmd tworzy publikację Windows x64, archiwum portable oraz Setup.exe (gdy zainstalowano Inno Setup 6).
- Zaktualizowano numer wersji aplikacji, manifest, raport i dokumentację.

## 2.0.2 — FIX004
- Całkowicie nowy, niezależny projekt WPF x64.
- Nowy polski interfejs z pulpitem i kartami monitoringu, wentylatorów oraz inwentaryzacji.
- Monitoring sensorów LibreHardwareMonitor co 2 sekundy.
- Profile chłodzenia, tryb ręczny, przywracanie wartości domyślnych.
- Inwentaryzacja WMI/SMBIOS i dekodowanie nazwy monitora z EDID.
- Raport TXT, skrypt BUILD.cmd, definicja instalatora Inno Setup i testy CI.
- FIX004: bezpieczny dolny limit suwaka 20%, osobny tryb przywracania wartości domyślnych oraz automatyczne budowanie instalatora Setup.exe.

## Historia wcześniejszych poprawek
Szczegóły wcześniejszych wersji są zachowane w historii repozytorium.
