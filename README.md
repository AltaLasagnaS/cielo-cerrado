# Cielo Cerrado

Simulador educativo de defensa aérea. Ubicás radares y baterías sobre relieve real, trazás
salvas de drones y misiles y mirás qué se detecta, qué se intercepta y cuánto cuesta cada lado.

> Es un juego educativo con **modelos de libro** y **datos públicos aproximados**. Los
> escenarios son inventados y no hay posiciones reales de unidades. No es una herramienta de
> planificación.

## Cómo se abre

Doble clic en `index.html`. No hace falta servidor ni instalar nada: todos los scripts son
clásicos (no módulos ES) y los datos están en archivos `.js`, así que funciona con `file://`.

## Estructura

```
index.html              página (solo el HTML; carga los scripts en orden)
src/ui/styles.css       estilos
data/                   datos (sin lógica de simulación)
  terrain.js            relieve SRTM incorporado (Monterey, Gotemburgo) en base64
  sources.js            fuentes OSINT (WP, SRC, S_, SRC_REF)
  catalog.js            bandas, amenazas, tasas observadas, defensas, interferidores
  uncertainty.js        rangos mín/probable/máx (UNC), calibración (CAL), muestreo
src/util/util.js        utilidades ($, clamp, formatos, rnd)
src/physics/            terreno y línea de vista, radar, cinemática de amenazas
src/engine/             estado, paso de simulación, escenarios
src/ui/                 cobertura, mapa, interacción, controles, paneles, fichas, .hgt
src/main.js             arranque
tests/                  pruebas con Playwright + Chromium headless
docs/PROGRESO.md        estado del trabajo por etapas
```

Orden de carga: datos → utilidades → física → motor → interfaz → inicio. Las declaraciones de
nivel superior (`const`, `let`, `function`) de un script clásico quedan visibles para los
scripts que se cargan después; por eso no hay `import`/`export`.

## Pruebas

```
npm install          # instala Playwright (usa el Chromium que ya tengas configurado)
npm test             # suite completa: consola limpia, escenarios, golden, fichas
npm run equiv        # equivalencia de interfaz con el index.html original (rama main)
npm run golden       # regenera los golden desde el original (no debería hacer falta)
```

Los **golden** (`tests/golden/`) son corridas completas del `index.html` original con
`Math.random` sembrado: estadísticas, registro entero y estado final de cada unidad, más
mapas de cobertura. El modelo clásico tiene que reproducirlos exactamente.
