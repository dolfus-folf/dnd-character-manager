# DND APP WEB V2 — GitHub Pages + PWA

Esta versión continúa la V1 estática y corrige el detalle importante de GitHub Pages: los recursos de la página usan rutas relativas (`./...`), por lo que funcionan correctamente cuando el proyecto se publica como un sitio de repositorio, por ejemplo `/dnd-character-manager/`.

## Incluye
- Frontend estático, sin Node.js para el uso normal.
- Core ejecutándose en el navegador.
- Datos locales de D&D 2024 incluidos en `opciones.json` y el runtime.
- 12 clases, 48 subclases, 10 especies, 16 trasfondos, 75 dotes, 331 conjuros y catálogo de equipo disponible en la aplicación.
- Guardado local mediante `localStorage`.
- PWA + service worker para uso offline después de la primera visita online.
- Interfaz visual V2 con tema oscuro de fantasía, tarjetas, paneles y pestañas.
- Rutas relativas compatibles con GitHub Pages.

## Publicación
Sube el contenido de esta carpeta al repositorio y configura GitHub Pages para publicar desde `main` y `/ (root)`.

## Offline
Cada dispositivo debe abrir la aplicación al menos una vez con Internet para descargar los archivos y llenar la caché. Después podrá utilizarse sin conexión mientras el navegador conserve esos datos.

El almacenamiento de personajes sigue siendo local al dispositivo. La sincronización entre dispositivos se implementará en una fase posterior.

## Siguiente fase sugerida
1. Probar creación y hoja de varios personajes desde PC y móvil.
2. Añadir exportación/importación de personajes JSON para compartir partidas sin Internet.
3. Mejorar la automatización de reglas y cálculos.
4. Posteriormente añadir nube/autenticación si realmente hace falta.
