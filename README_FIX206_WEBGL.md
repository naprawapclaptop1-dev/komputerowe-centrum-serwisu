# FIX206 — renderer WebGL warsztatu

- Zmieniono renderer wielokątowej sceny warsztatowej z Canvas 2D na WebGL 2, z obsługą WebGL 1 i zapasowym Canvas 2D.
- Renderer tworzy bufory pozycji i kolorów, kompiluje shadery zgodne z WebGL1 / GLSL ES 1.00 i WebGL2 / GLSL ES 3.00 oraz renderuje trójkąty z testem głębokości.
- Zachowano obracanie, zoom, wybór i podświetlanie podzespołów.
- Model ma 411 ścian polygonów, ale nadal jest modelem edukacyjnym, nie modelem CAD, nie odzwierciedla konkretnej płyty głównej i nie ma tekstur producentów.
