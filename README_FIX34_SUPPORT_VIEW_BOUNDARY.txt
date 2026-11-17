NAUKA OD A DO Z 6.8.0 — FIX34
NAPRAWA OSOBNEJ ZAKŁADKI WSPARCIA

CO NAPRAWIA FIX34?
Na zrzucie ekranu z FIX33 treści „Wesprzyj rozwój platformy” pojawiały się na ekranie Repair Master AI. Przyczyną był drugi, nadmiarowy znacznik </div> po filmie wsparcia w WEB_PUBLISH/index.html. Przedwcześnie zamykał on kontener strony i rozłączał część sekcji wsparcia z właściwą zakładką.

FIX34 usuwa ten dodatkowy znacznik. Nawigacja „Wesprzyj rozwój platformy” pozostaje osobną pozycją data-view="support", a #view-support i #view-repairmaster są niezależnymi ekranami.

JAK ZAINSTALOWAĆ
1. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj całe archiwum FIX34 do folderu projektu z zachowaniem struktury katalogów i nadpisz pliki.
3. Uruchom WYKONAJ_TESTY_FIX34.cmd, aby wykonać testy regresji na Windows.
4. Uruchom URUCHOM_AKADEMIE.cmd, aby wykonać dotychczasowy proces publikacji.
5. Po zakończonej publikacji możesz uruchomić CHECK_KONTA_FIX34.cmd, aby sprawdzić publiczny status kont i schemat API. Skrypt nie tworzy konta; używa wyłącznie kontrolnej próby logowania z adresem .invalid.

WAŻNE
- Nie twórz nowego projektu Cloudflare Pages ani nowej bazy D1.
- Nie zmieniaj ręcznie sekretu OPENAI_API_KEY. W dotychczasowym logu sekret był już zapisany.
- FIX34 zachowuje istniejące powiązanie z bazą naprawapc-orders.
- Numer wersji aplikacji nadal wynosi 6.8.0; FIX34 jest numerem poprawki.
- W tym archiwum nie wykonano wdrożenia produkcyjnego ani migracji D1. Test lokalny verifyWeb() nie łączy się z Cloudflare.

KONTROLA STRUKTURY
Nowy walidator sprawdza, czy wszystkie 26 ekranów są niezależnymi widokami we wspólnym kontenerze content-wrap oraz czy sekcje wsparcia nie wychodzą poza #view-support. Ta sama kontrola działa w publikatorze jednorazowym i w obserwatorze.

Build: 6.8.0-social-login-fix34-support-view-boundary-20261104
