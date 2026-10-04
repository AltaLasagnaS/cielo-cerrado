# Tipografías sin conexión

El HTML descargable incluye **IBM Plex Sans** (400, 500, 600), **IBM Plex Mono** (400, 500) y **Barlow Condensed** (500, 600, 700), las familias y pesos que pedía la hoja de Google Fonts. No contacta Google Fonts. En desarrollo, los mismos archivos se sirven desde `src/assets/fonts/`; en el build se insertan como `data:font/ttf;base64`.

## Procedencia y licencias

Archivos originales obtenidos del repositorio público [google/fonts](https://github.com/google/fonts/tree/9710da1eacb3be272583c3224dcb70f9da6eadbb), commit fijo `9710da1eacb3be272583c3224dcb70f9da6eadbb`, el 4 de octubre de 2026. [El manifiesto](../src/assets/fonts/manifest.json) registra URL exacta, SHA-256 y tamaño de cada archivo y de cada licencia. IBM Plex Sans usa el archivo variable original con ancho normal; Mono y Barlow usan los archivos estáticos originales. Sólo se simplificó el nombre del archivo variable en el directorio local.

Las tres familias usan **SIL Open Font License 1.1**, con los avisos de copyright respectivos. IBM declara el nombre reservado «Plex». Los binarios se conservan **sin modificación, conversión ni recorte de caracteres**, incluidos sus nombres internos; no se crean versiones derivadas con ese nombre. Las fuentes mantienen su licencia OFL, separada de la MIT del código del juego.

Las licencias completas se conservan en `src/assets/fonts/*-OFL.txt` y el build las inserta en un bloque no ejecutable `#font-licenses` del HTML. Así acompañan también al archivo cuando se descarga y distribuye solo. No alcanza con que la licencia quede únicamente en el repositorio.

`npm run build` lee archivos locales: **no requiere red ni herramientas de conversión**. Para actualizar las fuentes, descargar archivos y licencias de una revisión fija, verificar sus hashes, actualizar el manifiesto y regenerar el HTML. No sustituir las licencias por la licencia del proyecto.

## Tamaño y comprobación

En la base `main` del PR #48:

| Archivo/contenido | Bytes |
|---|---:|
| `index.html` anterior | 2.702.396 |
| Seis binarios de fuente originales | 1.132.228 |
| `index.html` con fuentes y licencias | 4.226.088 (4,03 MiB) |
| Aumento del HTML | 1.523.692 (56,4%) |

El aumento incluye codificación base64 y avisos. Se conserva la cobertura completa de los originales para evitar recortes y cambios de licencia/nombre; comprimir o reemplazar fuentes sería otra decisión. Los tamaños cambian cuando cambia el resto del juego. El build informa bytes UTF-8 reales, no cantidad de caracteres JavaScript.

Las pruebas de integridad verifican binarios contra el manifiesto, los seis archivos embebidos y los tres avisos completos. La suite Chromium de `tests/browser/` carga los ocho pesos con `document.fonts.load`, exige fuentes reales en estado `loaded` y ningún intento de solicitud externa en toda la ejecución. La workflow lo hace directamente sobre `file://` con la red bloqueada.

El Chromium administrado del entorno local puede bloquear `file://`; en ese caso se declara `STANDALONE_HTTP=1` para verificar el mismo bundle por loopback. Eso se registra como HTTP y **no sustituye** el resultado real de `file://` en CI. No se desactiva la política del navegador.
