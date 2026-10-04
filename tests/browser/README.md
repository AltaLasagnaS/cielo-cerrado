# Pruebas de interfaz en CI

Tarea del bloque Técnica de `ROADMAP.md`. Paquete de pruebas aislado; no modifica dependencias del juego, física, datos, golden ni el test existente `tests/ui.browser.mjs`.

## Ejecutar

Desde la raíz del repo, con Node 20 o posterior:

```bash
npm ci --prefix tests/browser
cd tests/browser
npx --no-install playwright install chromium
npm test
```

En Linux puede hacer falta instalar las bibliotecas de sistema con `npx --no-install playwright install --with-deps chromium`. La workflow de GitHub lo hace en su runner. La versión de Playwright está fijada en el package y en su lockfile; la instalación usa integridad npm normal, sin desactivar verificaciones.

Si ya existe Playwright/Chromium externo se pueden usar `PLAYWRIGHT_MODULE=/ruta/a/playwright/index.mjs` y `CHROMIUM_PATH=/ruta/a/chromium`. `PLAYWRIGHT_MODULE` debe ser una ruta absoluta importable. `npm test --prefix tests/browser` sirve también desde la raíz; no hace falta `npm run dev` ni un puerto libre determinado.

Algunas instalaciones administradas de Chromium bloquean `file://`. En ese caso `STANDALONE_HTTP=1` sirve exactamente el mismo bundle en loopback, sin imports nativos ni red externa; el informe registra `http:` para no presentarlo como comprobación de `file://`. No se desactiva la política del navegador ni se hace un fallback silencioso. La CI usa `file://` por defecto con el Chromium instalado por Playwright; debe pasar ese modo realmente.

## Qué ejecuta

1. El runner inicia su propio servidor de sólo lectura en loopback y puerto efímero para `src/`, sin watcher. Ejecuta **la prueba existente** `tests/ui.browser.mjs`: campos numéricos, atajos, bloqueo del juego durante Monte Carlo, comparativa con el motor nativo y finalización/error de la serie. No la reemplaza por un smoke más pequeño.
2. Abre el `index.html` versionado directamente con `file://` y red bloqueada. Comprueba arranque/mapa, pestañas, ficha/Academia, modales, briefing y selector, cantidades, Guardar/Cargar JSON por descarga/input, rechazo de importación inválida sin mutar preparación, iniciar/pausar/reiniciar y controles visuales. No intenta importar `/sim` desde el archivo autocontenido: eso crearía una instancia de estado distinta o no funcionaría con el archivo descargado.

El runner cierra sólo el servidor que creó. Propaga fallas, señales y timeouts como salida no cero. Las pruebas no arrancan ni detienen un servidor del usuario, no editan `src` ni actualizan golden.

## Diagnóstico y CI

La workflow `browser.yml` corre en push, pull request y manualmente. No reemplaza el job existente de lint/tests/build/docs; ese job sigue verificando que el archivo autocontenido esté al día.

Cada ejecución genera un subdirectorio propio en `tests/browser/artifacts/` (ignorado por Git), con logs de ambas suites y resultados del autocontenido. En caso de fallo del autocontenido también guarda screenshot, traza de Playwright y detalle del paso fallido. `BROWSER_ARTIFACTS` permite elegir otra carpeta de resultados. Los artefactos de GitHub se retienen siete días; no se suben dependencias.

Se bloquea la red externa y se comprueba que **ningún pedido externo se intente**, además de cargar las tres familias y sus ocho pesos con `document.fonts.load`: tiene que devolver fuentes reales cargadas, no sólo un respaldo del sistema. Se verifica también que el archivo descargable conserve los avisos OFL. La CI ejecuta estas comprobaciones en `file://`; el fallback local administrado queda registrado como `http:`. Excepciones JavaScript del juego hacen fallar el smoke. Regla, fijar pistas y vista restringida siguen siendo tareas aparte.

No se certifica compatibilidad con todos los navegadores o tamaños de pantalla, ni niebla de guerra sin fugas, física real, seguridad del archivo local o balance de escenarios. Esta primera CI usa Chromium en escritorio y escenarios incluidos en el repo.

## Coordinación con Claude

El usuario confirmó que Claude está inactivo y su próxima tarea era detección. Codex toma estas pruebas de navegador y después el bloque de detección en otra PR. Si Claude retoma, no trabajar ambos sobre `src/physics/radar.js`, fuentes/incertidumbre o sus consumidores al mismo tiempo; acordar un responsable antes de editar.
