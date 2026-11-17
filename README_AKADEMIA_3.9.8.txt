AKADEMIA SERWISU PRO 3.9.8 — PEŁNA PACZKA
=========================================

Wydanie zawiera dotychczasową Akademię i czat hybrydowy: OpenAI jako model
główny, Cloudflare Workers AI jako awaryjny, z lokalnym wyszukiwaniem Akademii
jako ostatnią ścieżką przy niedostępności obu usług.

Instalacja:
1. Zatrzymaj poprzedni obserwator przez Ctrl+C.
2. Wykonaj kopię folderu projektu.
3. Rozpakuj pełne archiwum do G:\AKADEMIA_SERWISU_PRO, bez dodatkowego folderu pośredniego.
4. Zachowaj lokalny wrangler.toml, TOOLS_CLOUDFLARE i BACKUPS_D1.
5. Ustaw OPENAI_API_KEY jako Cloudflare Secret w środowisku Production.
6. Sprawdź binding Workers AI o nazwie AI w środowisku Production.
7. Uruchom URUCHOM_AKADEMIE.cmd.

Szczegółowe ustawienia klucza, bindingu, testu i kosztów znajdują się w
CHAT_AI_SETUP_3.9.8.txt. Bez klucza OpenAI czat przejdzie na Cloudflare AI, jeśli
binding jest dostępny. Bez obu dostawców pozostanie lokalne wyszukiwanie.

Uwaga: klucze OAuth, OpenAI i Cloudflare nie są wbudowane w ZIP. Nie wysyłaj ich
ikomu ani nie umieszczaj w kodzie strony. Konfiguracja produkcyjna wymaga dostępu
do własnego konta Cloudflare i konta API OpenAI.
