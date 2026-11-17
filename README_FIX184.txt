NAUKA OD A DO Z 6.8.0 — FIX184
CENTRUM DIAGNOSTYKI EKSPERCKIEJ

CO ZAWIERA
Nowa, 19. zakładka istniejącej Akademii. Zakres wyłącznie komputery stacjonarne i laptopy:
1) Windows firmowy / Active Directory.
2) PowerShell i automatyzacja raportów serwisowych.
3) Zaawansowany Windows Kernel Debugging.
4) Bezpieczny serwis zdalny.
5) Integralność sygnału szybkich interfejsów.

Materiały FIX184: 20 lekcji, 60 pytań kontrolnych, 15 przypadków, 10 projektów,
40 haseł słownika, egzamin 20-pytaniowy i pięć narzędzi edukacyjnych.

WAŻNE OGRANICZENIA
- Polecenia w kursach i generatorze PowerShell są przykładami/tekstowymi szablonami.
  Strona ich nie uruchamia.
- Narzędzia nie łączą się z komputerem, domeną, siecią, urządzeniami ani oscyloskopem.
- Kalkulator sygnału jest uproszczonym modelem matematycznym, nie pomiarem ani testem zgodności.
- Driver Verifier omawiany jest jako procedura dla odizolowanej maszyny testowej;
  nie uruchamia się go na komputerze klienta jako automatycznej naprawy.

INSTALACJA AKTUALIZACJI
1. Wykonaj kopię zapasową całego aktualnego folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj ZIP FIX184 do tego samego folderu projektu i nadpisz pliki, gdy system zapyta.
3. Zachowaj własne pliki i ustawienia: .dev.vars, wrangler.toml, TOOLS_CLOUDFLARE,
   zapisane ustawienia Node/Wrangler/OAuth oraz kopię bazy D1. Nie usuwaj ich.
4. W katalogu projektu uruchom WYKONAJ_TESTY_FIX184.cmd.
5. Wymagany jest wynik PASS. Raport zostaje zapisany w FIX184_FULL_TESTS.log.
6. Po pozytywnych testach uruchom dotychczasowy START_FIX105.cmd, aby wykonać
   dotychczasową procedurę publikacji na istniejącym projekcie.
7. Zachowaj START_FIX105.log i przekaż go do kontroli końcowej.

NIE TWÓRZ NOWEGO PROJEKTU CLOUDFLARE ANI NOWEJ BAZY D1.
Paczka nie zawiera lokalnych sekretów ani prywatnego pliku wrangler.toml.

JAK ZNALEŹĆ MODUŁ
Akademia → Centrum Diagnostyki Eksperckiej (FIX184).

STATUS
FIX184 został zbudowany i przetestowany lokalnie. Samo przygotowanie ZIP i testy lokalne
nie potwierdzają publikacji produkcyjnej. W release.json productionPublished=false.
