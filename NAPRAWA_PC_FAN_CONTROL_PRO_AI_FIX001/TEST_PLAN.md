# TEST PLAN — FIX001

## Test automatyczny
Workflow GitHub Actions na Windows wykonuje restore, build i publish x64.
Po udanej kompilacji publikuje samodzielny artefakt EXE.

## Testy na sprzęcie
1. Uruchom program jako administrator.
2. Sprawdź listę CPU/GPU/Memory/Motherboard/Storage.
3. Porównaj temperatury CPU/GPU z narzędziem producenta.
4. Porównaj RPM z BIOS/UEFI lub aplikacją płyty.
5. Zweryfikuj sloty RAM i dane modułów z SMBIOS/CPU-Z.
6. Porównaj model monitora z EDID i Menedżerem urządzeń.
7. Uruchom profil automatyczny wyłącznie na kanale sterowalnym.
8. Obserwuj temperatury podczas zmiany profilu.
9. Wyłącz automatykę i zweryfikuj powrót sterowania do BIOS/EC.
10. Wyeksportuj raport i sprawdź jego zawartość.

## Warunki zaliczenia
- Brak fikcyjnych odczytów: niedostępny czujnik nie może być przedstawiany jako 0°C ani 0 RPM.
- Sterowanie dostępne wyłącznie dla kanałów z obsługą IControl.
- Błąd jednego czujnika nie blokuje pozostałych.
- Błąd budowania blokuje oznaczenie artefaktu jako gotowego.
