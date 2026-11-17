NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX129

CEL
FIX129 przywraca prawdziwe fotografie komputerów, laptopów, płyt głównych, RAM, GPU, BIOS, dysków, elektroniki i sieci. Naprawia konflikt FIX122/FIX123, który wyłączał zdjęcia w całej aplikacji.

CO ZOSTAŁO NAPRAWIONE
- Usunięto z aktywnej strony blokujący skrypt globalny i strażnik SVG strony głównej.
- Przywrócono silnik fotografii na stronie głównej; 19 unikalnych slotów modułów i specjalizacji ma kuratorowane źródła zdjęć sprzętu. Pozostałe lokalne grafiki techniczne nadal są ilustracjami, nie fotografiami.
- Przywrócono katalog zdjęć FIX115/FIX118, kolejkę aktywnego widoku, źródła Openverse/Wikimedia oraz 19 kuratorowanych przypisań startowych Pexels/Wikimedia dla strony głównej.
- Dodano filtr metadanych: zdjęcia opisywane jako osoby, twarze, dłonie, grupy, klasy, technicy lub pracownicy są odrzucane.
- Service Worker cache’uje po pierwszym udanym pobraniu zdjęcia z Pexels/Wikimedia. Przy braku obrazu pozostaje lokalna ilustracja SVG z jawną etykietą fallbacku.
- Licznik pokazuje wyłącznie poprawnie załadowane fotografie rastrowe, a ilustracje offline osobno.

INSTALACJA NA WINDOWS
1. Wykonaj kopię obecnego folderu projektu.
2. Rozpakuj całe archiwum do osobnego katalogu testowego albo do G:\AKADEMIA_SERWISU_PRO po wykonaniu kopii. ZIP zawiera pliki od razu w katalogu głównym.
3. Nie nadpisuj lokalnych sekretów i konfiguracji: wrangler.toml, .env, .dev.vars, tokenów, profili Wrangler ani BACKUPS_D1.
4. Uruchom WYKONAJ_TESTY_FIX129.cmd. Wymagany wynik to STATUS: PASS.
5. Uruchom PODGLAD_LOKALNY_FIX17.cmd i sprawdź stronę główną, kursy, moduły i karty. Pierwsze pobranie zdjęć wymaga Internetu.
6. Publikację uruchom dotychczasowym mechanizmem dopiero po kontroli lokalnej.

WAŻNE
- Zachowano produkt 6.8.0; hotfix to FIX129.
- Nie zmieniono D1, migracji, kont ani sekretów.
- Nie wykonano wdrożenia Cloudflare z tego środowiska.
- Filtr ludzi/dłoni opiera się na metadanych źródeł, nie na rozpoznawaniu pikseli.
