# FIX225 — lokalny import modeli GLB

Warsztat 3D umożliwia wybranie pliku GLB 2.0 z lokalnego dysku. Parser obsługuje pojedynczy osadzony bufor BIN i prymitywy trójkątów z pozycjami VEC3 (FLOAT) oraz opcjonalnymi indeksami. Plik nie jest wysyłany na serwer i parser nie pobiera zewnętrznych URI. Limit pliku: 32 MB; limity geometrii i hierarchii chronią przed nadmiernym obciążeniem. Nie jest to pełny importer wszystkich funkcji glTF, materiałów PBR, animacji, skinningu czy CAD.
