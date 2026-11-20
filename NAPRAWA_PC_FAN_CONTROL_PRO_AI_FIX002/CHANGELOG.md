# CHANGELOG

## 2.0.5 — FIX007
- Naprawiono uruchamianie aplikacji z checkboxa końcowego instalatora: dodano jawne `runascurrentuser`, aby proces dziedziczył podwyższone uprawnienia instalatora.
- Usunięto przyczynę błędu Windows 740 przy uruchamianiu programu, którego manifest wymaga administratora.
- Zachowano jeden ZIP: Setup.exe w katalogu głównym oraz folder Portable. Brak zagnieżdżonych archiwów ZIP.
- Zaktualizowano wersję aplikacji, instalatora, manifestu, interfejsu, raportu oraz dokumentacji.

## 2.0.4 — FIX006
- Zmieniono dystrybucję na jedno archiwum ZIP.
- W ZIP znajduje się bezpośrednio instalator Setup.exe oraz kompletne pliki wersji portable w osobnym katalogu Portable.
- Usunięto ZIP portable z wnętrza paczki; użytkownik pobiera tylko jedno archiwum.
- CI rozpakowuje archiwum i sprawdza obecność Setup.exe, programu Portable oraz brak zagnieżdżonych plików ZIP.
- Dodano bezpośredni link do pliku ZIP jako zasobu wydania GitHub.

## 2.0.3 — FIX005
- Naprawiono ścieżki Inno Setup względem lokalizacji skryptu.
- Dodano kontrole gotowych artefaktów.

## 2.0.2 — FIX004
- Całkowicie nowy, niezależny projekt WPF x64.
- Polski interfejs, monitoring sensorów, sterowanie wentylatorami i inwentaryzacja.
- Profile chłodzenia i przywracanie wartości domyślnych.
- Raport TXT i testy CI.
- Bezpieczny dolny limit suwaka 20%.
