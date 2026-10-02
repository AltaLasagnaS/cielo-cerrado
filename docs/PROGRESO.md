# Progreso

Plan aprobado en cuatro etapas. Rama de trabajo: `claude/clever-wright-muzju6` (la sesión vino
configurada con ese nombre; el plan original decía `claude/nice-shannon-euppia`, es la misma
rama de trabajo con otro nombre). `main` tiene el `index.html` original sin tocar (commit
`917aefe`), que es la referencia de los golden.

## Estado

| Etapa | Estado |
|---|---|
| 0 · Separar en archivos sin cambiar comportamiento | **hecha** |
| 1 · Motor físico (1a–1g) | pendiente |
| 2 · Herramientas (corte vertical, Monte Carlo, repetición, guardar/cargar) | pendiente |
| 3 · Tutorial guiado | pendiente |

## Etapa 0 — separación

- El `index.html` de 1,3 MB quedó en 19 scripts clásicos + `styles.css`. El IIFE se sacó y se
  cortó por secciones **sin renombrar nada**. Cada script de motor/UI lleva `'use strict'`
  (el IIFE lo tenía); los de datos quedaron como estaban.
- Único movimiento entre secciones: `rcsAt()` pasó de `data/catalog.js` a
  `src/physics/radar.js` (es física, no datos).
- Se verificó con un parser que no hay nombres de nivel superior repetidos entre scripts ni
  que choquen con propiedades de `window`.
- Pruebas (`npm test`, 22 ok):
  - cero errores de consola (se ignoran las fuentes de Google, que se bloquean en las pruebas);
  - `mb_noche` y `gb_ruso` terminan con `step(0.25)`;
  - 16 corridas golden + 5 mapas de cobertura idénticos al original (escenarios de fábrica con
    3 semillas, sin red y disparar-observar-disparar, relieve plano, vista del defensor, un
    escenario "mix" con todas las amenazas, defensas e interferidores, y 4 casos tipo
    calibración);
  - abren las 39 fichas (16 amenazas, 19 defensas y sensores, 4 interferidores), los comparadores, la calibración y la ayuda.
- `npm run equiv`: 50 bloques de HTML (paneles, fichas, comparadores, ayuda, registro) y 2
  capturas de pantalla (al cargar y a mitad de una corrida) idénticos píxel a píxel.
- Se probó que el golden detecta mutaciones chicas del motor (p. ej. bengalas ×0,84 en vez de
  ×0,85, o 1001 en vez de 1000 en el tiempo de vuelo del interceptor).

## Cómo correr las pruebas

```
npm install && npm test
```

En el entorno de desarrollo Playwright está instalado globalmente; `tests/lib.cjs` lo busca en
`node_modules`, como `@playwright/test` o en `/opt/node-tools/node_modules/playwright`.

## Invariantes

- Modelo clásico = original exacto. Lo garantizan los golden (`tests/golden/`).
- El modelo clásico no agrega llamadas a `rnd()` ni cambia su orden.
- Sin módulos ES ni `.json`: la página tiene que abrir con doble clic.
