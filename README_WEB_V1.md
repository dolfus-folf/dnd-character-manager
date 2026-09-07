# DND APP WEB V1 — GitHub Pages + PWA

Esta versión adapta la aplicación actual para ejecutarse completamente en el navegador, sin servidor Node.js durante el uso normal.

## Qué incluye
- UI actual de creación y hoja de personaje.
- Core D&D ejecutándose en el navegador.
- Catálogo local de clases, subclases, especies, trasfondos, dotes, conjuros y equipo.
- `localStorage` para conservar el personaje en el dispositivo.
- PWA: manifest + service worker para permitir uso offline después de una primera carga/visita online.

## Importante sobre el modo offline
La primera visita necesita Internet para descargar la aplicación y permitir que el navegador la guarde en caché. Después, si el navegador conserva la caché, la aplicación puede abrirse y funcionar sin Internet.

El guardado actual es local al dispositivo/navegador. Un personaje creado en un teléfono no aparece automáticamente en otro dispositivo. Más adelante podemos añadir exportar/importar JSON y, posteriormente, una nube como Supabase.

## Publicar con GitHub Pages
1. Crea un repositorio nuevo en GitHub, por ejemplo `dnd-character-manager`.
2. Sube **el contenido de esta carpeta**, no la carpeta contenedora completa.
3. En GitHub: `Settings` → `Pages`.
4. En `Build and deployment`, selecciona `Deploy from a branch`.
5. Selecciona `main` y carpeta `/ (root)`.
6. Guarda.
7. GitHub mostrará la URL de Pages, normalmente `https://TU-USUARIO.github.io/dnd-character-manager/`.
8. Abre la URL una vez con Internet en cada dispositivo donde quieras disponer del modo offline.

## Si el repositorio es público
No guardes aquí contraseñas, claves API privadas ni datos sensibles. Los datos D&D incluidos en esta versión son parte del catálogo de la aplicación.

## Desarrollo futuro
- Exportar/importar personajes JSON para jugar sin Internet entre dispositivos.
- Sincronización en la nube.
- Autenticación.
- Campañas y varios personajes.
- Backend/API solo cuando realmente haga falta.
