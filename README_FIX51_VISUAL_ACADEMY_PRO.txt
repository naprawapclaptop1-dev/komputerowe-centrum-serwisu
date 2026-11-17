NAUKA OD A DO Z — FIX51 VISUAL ACADEMY PRO
Wydanie: 6.8.0 / FIX51
Build: 6.8.0-fix51-visual-academy-pro-20261105
Baza: przesłany FIX49 → FIX50 Photo Reliability → FIX51

CEL
FIX51 usuwa globalne wyczerpywanie puli zdjęć w kartach lekcji i dodaje osobny, weryfikowalny Atlas Ilustracji Technicznych. Fotografie są wybierane tematycznie i mogą być używane ponownie pomiędzy lekcjami; trzy sloty pojedynczej karty naprawy pozostają różne. Zdjęcia z Internetu są dodatkiem — nie są wymagane do wyświetlenia lokalnego materiału.

CO ZAWIERA FIX51
1. Biblioteka 12 lokalnych fotografii warsztatowych oraz 3 lokalne plakaty lekcji systemowych, używana według kategorii zamiast jednej globalnej puli jednorazowych zdjęć.
2. 18 nowych autorskich plansz SVG: mapa płyty, VRM, laptop warstwowy, DDR4/DDR5, SATA/NVMe, multimetr, oscyloskop, chłodzenie, tor matrycy, BIOS/UEFI, USB-C PD, ESD, GPU/VRAM, SMART, Wi-Fi, metoda diagnostyczna, tor audio i złącza.
3. Atlas ilustracji z wyszukiwaniem, filtrem kategorii, podglądem i otwieraniem pełnej planszy.
4. Symulator multimetru: tryby DC, AC, Ω i ciągłość oraz przykładowe scenariusze z opisem interpretacji.
5. Symulator oscyloskopu: sinus, prostokąt, trójkąt i piła; regulacja amplitudy i częstotliwości.
6. Kreator diagnostyki krok po kroku dla braku zasilania, braku obrazu, przegrzewania i problemu z ładowaniem USB-C.
7. Lokalna galeria zdjęć oraz kontrola rzeczywistego załadowania plików przez przeglądarkę.
8. Service Worker pre-cache nowych skryptów, stylów, 18 plansz i dodatkowych plakatów lokalnych.
9. Lokalny podgląd HTTP bez instalowania zależności npm.

WAŻNE OGRANICZENIA I BEZPIECZEŃSTWO
- Symulatory generują dane syntetyczne. Nie odczytują prawdziwego multimetru, oscyloskopu ani płyty.
- Ilustracje SVG są autorskimi schematami edukacyjnymi. Nie są dokumentacją producenta, boardview ani pinoutem do lutowania.
- Każdy pomiar na realnym urządzeniu musi być prowadzony według dokumentacji konkretnego modelu i rewizji.
- Nie dodano automatycznego sterowania zasilaczem, programatorem BIOS, portem USB ani innym sprzętem.
- Nie zmieniono konfiguracji OpenAI, OAuth, sekretów ani Cloudflare.
- Nie wykonano migracji D1, zapisów do bazy produkcyjnej ani publikacji produkcyjnej.

INSTALACJA / TESTY WINDOWS 10/11
1. Rozpakuj ZIP do nowego folderu, np. G:\AKADEMIA_SERWISU_PRO_FIX51.
2. Zachowaj FIX49 i FIX50 jako kopie bazowe. Nie rozpakowuj FIX51 na stary projekt.
3. Uruchom WYKONAJ_TESTY_FIX51.cmd. Skrypt kontroluje składnię, dostępny zestaw testów regresyjnych, bibliotekę wizualną, kontrakt wydania i audyty.
4. Uruchom URUCHOM_PODGLAD_FIX51.cmd. Otworzy lokalny podgląd pod http://127.0.0.1:8765/.
5. Na stronie głównej otwórz sekcję Visual Academy PRO. Sprawdź Atlas ilustracji, filtr, podgląd, multimetr, oscyloskop i kreator diagnostyki.
6. W statusie biblioteki sprawdź wynik ładowania wszystkich 33 lokalnych plików wizualnych: 12 zdjęć + 3 plakaty + 18 plansz SVG.
7. Test offline wykonaj dopiero po pierwszym otwarciu pod adresem localhost i aktywacji Service Workera. Odśwież stronę, poczekaj na aktywację cache, a następnie przełącz przeglądarkę offline.

UWAGA O PODGLĄDZIE
URUCHOM_PODGLAD_FIX51.cmd uruchamia prosty serwer statyczny dla WEB_PUBLISH. Nie udostępnia funkcji Cloudflare Pages/Functions, logowania OAuth ani połączenia D1. To jest lokalny podgląd interfejsu i zasobów.

WERSJONOWANIE
Numer aplikacji pozostaje 6.8.0. Wydanie otrzymuje kolejny znacznik FIX51. Poprzednie pliki FIX50 i historyczne kontrakty pozostają w archiwum projektu.

WYNIKI WYKONANE W KONTENERZE
- 81/81 testów regresyjnych i 221/221 kontroli składni przeszły.
- 12/12 lokalnych JPG zdekodowano, 18/18 SVG wyrenderowano.
- Lokalny serwer HTTP i lokalny OneClick verifyWeb() przeszły kontrole.
- Użyty runtime: Node.js v22.16.0, nie docelowy v24.19.0. WYKONAJ_TESTY_FIX51.cmd należy uruchomić na docelowym Windows 10/11.
- Nie udało się wykonać testu GUI Chrome/Edge w kontenerze; ręczna akceptacja wyglądu strony nadal jest wymagana.
- Podgląd wszystkich 18 plansz: docs/FIX51_VISUAL_ATLAS_CONTACT_SHEET.jpg.

DODATKOWE INTERAKCJE
- Hotspoty w atlasie są opisami edukacyjnymi, nie punktami pomiarowymi do lutowania.
- Atlas laptopa to schemat warstwowy 2D, nie model 3D/CAD.
- Quiz liczy wynik w bieżącej sesji; nie zapisuje postępów do konta.
- Porównanie przed/po przyjmuje własne pliki obrazu przez przeglądarkę i utrzymuje podgląd lokalnie w pamięci strony.

LICENCJE ZDJĘĆ I PLAKATÓW
18 diagramów SVG zostało utworzonych w FIX51. Dwanaście lokalnych fotografii JPG i trzy plakaty lekcji są odziedziczone po wcześniejszym pakiecie FIX49/FIX50; nie potwierdziłem niezależnie ich pierwotnego źródła ani licencji. Przed publiczną lub komercyjną publikacją sprawdź prawa i wymagane atrybucje tych 15 plików rastrowych.
