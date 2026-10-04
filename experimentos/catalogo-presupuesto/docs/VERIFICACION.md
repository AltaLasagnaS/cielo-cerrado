# Verificación de la continuación aislada

Fecha: 4 de octubre de 2026. Base del juego: `9cafba0`. Node local: 24; workflow del paquete: Node 20. Los resultados de CI se revisan en la PR; este registro describe comprobaciones locales ejecutadas, no certifica por adelantado la CI.

## Ejecutado

- `npm run check`: lint limpio, 167 pruebas aprobadas y una omitida, build y catálogo regenerados idénticos a los versionados. Ningún golden actualizado.
- `node --test experimentos/catalogo-presupuesto/tests/*.test.mjs`: 58 pruebas aprobadas, cero fallas/omitidas. Incluye 12 de continuidad, nueve de briefing y una de enlaces, además de las 36 previas.
- `scripts/check.mjs`: catálogo de referencia coherente, diez candidatos y cero habilitados.
- `scripts/demo.mjs` y `scripts/campaign-demo.mjs`: saldo/stock/replay y ejemplo de briefing/continuidad comprobados con datos ficticios.
- `tests/demo.browser.mjs` en Chromium: compra, rechazo de fracciones/vacío, consumo, cambio de bando, continuidad, bloqueo de devolución de compras comprometidas, briefing sólo en preparación, guardado de dos etapas y ancho móvil sin desborde; sin errores JavaScript.
- `tests/simulator-observations.browser.mjs` en Chromium: `mag/reserve/salvo` no aceptan 1,5 en el estado, blur restaura el último valor válido, exportación conserva enteros y JSON con `mag: 1.5` se rechaza. Delete no borra en esta base. Sin modificaciones al simulador.
- `git diff --check` sin errores; `git diff --exit-code` de `src`, pruebas activas, roadmap, changelog, paquetes, `index.html` y `docs/CATALOGO.md` sin diferencias.

El primer intento del diagnóstico de Delete tocó el canvas detrás de la barra superpuesta y agotó el timeout de Playwright. Se corrigió únicamente la ubicación del click de la prueba, fuera de esa barra, y se ejecutó de nuevo con éxito. No era una regresión del juego ni se omitió el check.

## No comprobado / no implementado

No se afirma campaña jugable, niebla de guerra del motor, física de variantes nuevas, precios reales, bajas/reparaciones/logística ni todas las entradas numéricas de la UI. El diagnóstico de enteros cubre tres campos y una importación; no sustituye una revisión completa. Las pruebas de aislamiento del briefing verifican esta API, no la ausencia de fugas en el juego.

No se realizaron nuevos Monte Carlo de escenarios: no hubo cambios en la simulación. La suite activa ejecutó sus regresiones habituales. La workflow experimental no instala navegadores; el smoke local no se presenta como prueba de navegador de la CI.
