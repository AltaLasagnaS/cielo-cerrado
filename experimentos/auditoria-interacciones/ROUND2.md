# Segunda tanda: puente, tooltips e invalidación

Continuación autónoma del 12 de octubre de 2026. Producción sigue idéntica a
**9560c77**; el HEAD auditado contiene también la primera entrega #75. Los
hashes de los módulos centrales se conservan en cada JSON. No se revisó ni modificó
una rama de correcciones de Claude.

## Resultado

- Campaña: **4 casos**, 1 violación y 3 controles válidos, sin errores.
- Chromium: **14 comprobaciones**, 10 violaciones y 4 controles sin errores JS;
  cinco conductas contrastadas en fuente y bundle HTTP. No son diez bugs nuevos.
- Rendimiento: calentamiento y cinco ejecuciones por tamaño, hasta 3.000 amenazas.

Las violaciones amplían **F05, F07 y F10** del adjunto. No se aplicaron fixes al
motor; los ejecutables conservan salida 2 cuando encuentran esas violaciones.
Salida 1 significa fallo de ejecución/fixture, también en los procesos hijos.

Localizadores en la misma base de producción **9560c77**:

| Caso | Prioridad | Funciones a contrastar |
|---|---|---|
| `campaign-hoj-ui-progress`, `native-campaign-hoj-progress` | P1 | `src/sim/engine.js#step`, `src/ui/loop.js#loop` y `experimentos/catalogo-presupuesto/lib/port-combat.mjs#step/ended` |
| `historical-objective-tooltip` | P2 | `src/ui/input.js#showTip/hitTest` y `src/sim/replay.js#frameAt` |
| `partial-radar-damage-coverage-invalidation` | P2 | `src/sim/engine.js#damageUnits`, `src/ui/coverage.js#schedCov/computeCov` |
| `jammer-loss-coverage-invalidation` | P2 | `src/sim/engine.js#damageJammers`, `src/ui/coverage.js#schedCov/computeCov` |
| `historical-coverage-time` | P2 | `src/ui/coverage.js#computeCov`, `src/sim/replay.js#frameAt` |

Los comandos al final repiten los casos; los JSON registran los SHA concretos
de cada ejecución, además de hashes. Los pasos, estímulos y controles se
detallan a continuación. No se trasladan estas conclusiones a un main posterior
sin ejecutar nuevamente contra ese commit.

## Finalización de campaña, ahora comprobada en la pantalla nativa

Se usa el puente real y se carga la operación por el input **Cargar partida**.
El botón **Iniciar guardia** es el real. La operación de prueba tiene NASAMS del
catálogo, stock y servicios del libro real, con aliases genéricos de munición.
La plantilla se copia y renombra; no se modifica el catálogo ni se cargan misiles
Buk/S-125 en NASAMS. Créditos, medios y plazos de esta escena son un fixture,
no una configuración militar nueva ni una reconstrucción de Odesa.

Se sustituye la cronología de ataques por un único estímulo de jamming para
aislar el cierre. A 0,25 s hay un HOJ genuino cuya llegada se prevé a **24,81 s**:

| Campo | Observado |
|---|---|
| Puente devuelve «queda trabajo» | Sí |
| Guardia terminada según el puente | No |
| HOJ pendiente | 1 |
| `S.running` después del paso | **false** |
| Reloj después de 12 frames nativos | Sigue en **0,25 s** |

No hubo una orden de pausa del jugador. La interfaz sólo entra en su bloque de
avance cuando `S.running` es verdadero (`ui/loop.js`). Resolver manualmente por
`campaignStep()` permite terminar a 25 s: el puente tiene trabajo válido, pero
el bucle dejó de llamarlo. Esto confirma el mecanismo de F05 de punta a punta,
sin atribuir el bloqueo a una falla del libro.

Propuesta: una autoridad de finalización compartida para el motor, MC, controles
y campaña, que contemple efectos especiales pendientes. No basta con corregir
sólo `ended()` del puente: ese método ya incluye HOJ.

Evidencia: [campaña](evidence/round2-campaign.json),
[navegador](evidence/round2-browser.json) y
[captura de la guardia detenida](evidence/source-campaign-hoj-stalled.png).
La prueba manual del puente y la prueba de pantalla se ejecutan en
procesos/páginas distintos para no heredar el singleton de combate.

## Contabilidad que se sostiene

| Caso | Engine | Libro | Fondos durante combate |
|---|---:|---:|---|
| Home-on-jam | 1 disparo | 1 ronda expendida | 1.020 → 1.020 créditos |
| DRFM, carga inicial de 4 y recarga de otras 4 | 8 disparos fantasma | 8 rondas expendidas | 1.170 → 1.170 créditos |

La compra y carga ocurrieron en preparación. Durante combate no se cobró otra
vez el precio de las rondas. En el caso DRFM se comprueba que hubo **más de cuatro
tiros**, un segundo trabajo de transferencia terminado y que ninguna ronda
apareció gratis. Se mantiene una amenaza tardía para que el motor atraviese el
plazo real del servicio del libro; no se adelanta la recarga modificando relojes.

Otro control muestra que `battle.view().contacts` **sí conserva igualdad** entre
dos mundos con las mismas observaciones aunque cambie `th.alive`. El contacto
general de `contacts.js` cambia en el mismo experimento, como F08 ya documentó.
No reemplazar el filtro correcto del puente por el consumidor que hoy filtra
con verdad oculta. Mantener un contrato autorizado común al corregirlo.

## Tooltip histórico

Fixture: depósito de 800 HP, destruido a T=10; replay detenido en T=5, estado
final en T=20. Se mueve el puntero real sobre el objetivo dibujado, sin llamar a
una función de tooltip reimplementada.

El mapa reconstruye el objetivo de T=5, pero el tooltip muestra:

```text
HP 0 / 800 · Destruido
```

Esperado: **800/800**. Lo observado ocurre en módulos fuente y bundle. Extiende
F07 más allá de la ficha y el hit testing; requiere un cuadro histórico común
para todos los consumidores, o etiquetas explícitas cuando un dato sea final.
Ver [captura del tooltip](evidence/source-historical-tooltip.png).

## Cobertura invalidada por eventos, no sólo por editar controles

Estas pruebas disparan una caída por el motor real. Sólo el CEP de una **copia
de amenaza del fixture** se fija a 0,001 para aislar el daño; no se toca el perfil
ni Pk del catálogo. El radar queda vivo y el estímulo se comprueba antes de
atribuir un fallo a la capa. Se esperan 250 ms para los timers agrupados.

| Evento | Celdas antes | Después, recálculo automático | Después, recálculo manual |
|---|---:|---:|---:|
| Radar NASAMS parcialmente dañado, vivo con 105 HP | 40.340 | **40.340** | 19.674 |
| Jammer terrestre destruido, radar intacto con 300 HP | 17.198 | **17.198** | 40.340 |

Fuente y bundle coinciden. El jammer de ese fixture está a 5 km y su efecto en
la cobertura se verifica positivamente antes/después. No se infiere de ello un
alcance real de interferencia.

La función física recoge el cambio cuando se la llama; falla la invalidación
del cache/UI por esos eventos. **Cambiar el rótulo a «cobertura potencial» no
resuelve estos dos casos:** el daño y la desaparición de ruido modifican también
la capacidad potencial. Propuesta: evento de cambio relevante, recálculo
agrupado y consumidores históricos separados, sin calcular toda la capa en cada
frame.

También se consulta cobertura con replay en **T=0,25**, antes del daño. Aunque el
radar aún estaba sano entonces, la capa devuelve **19.674 celdas** del radar
dañado final en lugar de las **40.340** del control anterior. Recalcular al mover
el slider no alcanza si el cálculo sigue leyendo las unidades finales: necesita
el cuadro histórico, junto con sus condiciones ambientales relevantes.

## Rendimiento repetido

Mismo hardware y Node de la primera entrega, dos sensores, mapa plano, semilla 7,
40 pasos de 0,25 s. Un calentamiento y cinco muestras por tamaño:

| Amenazas | Mediana de medianas de step | Mediana de P95 | Mayor step observado |
|---:|---:|---:|---:|
| 100 | 0,037 ms | 0,700 ms | 3,130 ms |
| 1.000 | 0,251 ms | 2,411 ms | 4,510 ms |
| 3.000 | 0,721 ms | 4,367 ms | 10,594 ms |

No se comparan directamente con la primera tanda de 80 pasos: cambian duración,
calentamiento y mezcla de barridos. No se define aquí un límite seguro de
importación ni se propone migrar a workers por estos números. Heap incluye GC/JIT
y no equivale a memoria retenida. No se ejecutaron 250.000 amenazas.

## Comandos y pendientes

```sh
node experimentos/auditoria-interacciones/round2-campaign.mjs
node experimentos/auditoria-interacciones/round2-performance.mjs
PLAYWRIGHT_MODULE=/ruta/playwright/index.mjs CHROMIUM_PATH=/ruta/chromium \
node experimentos/auditoria-interacciones/round2-browser.mjs
```

Los resultados nuevos van a `results-local/` o `AUDIT_OUTPUT`; la evidencia
entregada permanece congelada. No se sobrescriben los 38 casos de la primera
tanda ni sus JSON.

Queda pendiente contrastar el PR de correcciones cuando el usuario lo entregue;
también la restauración en medio de combate, todos los tipos de tooltip,
invalidación de movilidad histórica y escenarios de estrés más prolongados.
Los controles de esta tanda acotan interacciones, no certifican toda la campaña.
