# Diagnóstico independiente

Base: [9560c77](https://github.com/AltaLasagnaS/cielo-cerrado/commit/9560c772543abcd0c0c7e75bdc9c47c0fb0d6bc5).
No hubo cambios de producción. Fecha: 12 de octubre de 2026, Buenos Aires.

**Resultado:** se reproducen las incoherencias prioritarias de la auditoría.
Las variantes de un mismo problema se cuentan como casos, no como nuevos bugs.
Hay además un hallazgo nuevo de cañones, una extensión de continuidad de guía y
una pregunta de diseño que no se presenta como fallo confirmado.

## Evidencia y controles

| Ejecución | Resultado |
|---|---|
| `npm run check` existente | 248 casos: 247 pasan, 1 omitido, 0 fallidos; lint/tipos/build/catálogo correctos y generados sin diferencias |
| Paquete experimental existente | 116/116 pasan |
| Navegador existente | Interfaz, UX y 9 comprobaciones del bundle pasan; bundle por HTTP local, no `file://` |
| Diagnóstico Node independiente | 38 casos: 26 `VIOLATED`, 11 `HOLDS`, 1 `DESIGN_REVIEW`, 0 `ERROR`; salida 2 |
| Diagnóstico Chromium independiente | Reproducciones en fuente y bundle; detalle y conteos en `evidence/browser.json`; salida 2 |
| Rendimiento | 10/100/1.000 amenazas; 80 pasos por tamaño; cobertura 100²/250²; temporizador/dibujo en interfaz |

Los checks normales verdes demuestran estabilidad de sus casos, no ausencia de
las interacciones que esta carpeta reproduce. El workflow de la nueva PR puede
estar verde mientras este diagnóstico conserva violaciones explícitas. No se
modificó la calibración para hacerlas desaparecer.

## Hallazgos del adjunto contrastados

Cada fila remite a un ID ejecutable del [JSON Node](evidence/node.json) o del
[JSON Chromium](evidence/browser.json). Allí están el esperado, observado,
localizador y hashes. `--only=ID` permite repetir sin correr todos los casos.

| Hallazgo / prioridad | Reproducción y observado | Criterio de corrección independiente |
|---|---|---|
| **F01, P1**, `engine.js#engage/reaches` | `delegation-launcher`, `moving`, `channels`, `blind`: NASAMS solo dispara y derriba; acompañado por Gepard indisponible dispara cero y recibe un impacto. Semilla 7, Monterey plano, 40/40, Shahed 50 m, ruta 40/10→40/40 | Disponibilidad común en delegación, mejor tirador y tiro. No asignar al receptor que no puede intervenir, sin mirar la ruta futura verdadera |
| **F02, P1**, `engine.js#impact/damageUnits` | `targetunit-damage-equivalence`: misma caída y ojiva sintética 1 kg; coordenadas deja 286 HP/viva; `targetUnit` deja 300 HP/muerta. Daño calculado 14,4 HP | Autoridad única de daño. Si hay efecto directo distinto, explícito y probado; no depender del identificador designado |
| **F03, P1**, `solveFor` y resolución | `silent-radar-guide`: S-300 lanza dos TVM, derriba y nunca registra emisión. `guide-silence-during-flight`: apagar después del lanzamiento también deja derribar. Matriz TVM/SARH/mando/activo/IR/cañón con sensor compatible sin munición | Diferenciar recepción, emisión necesaria y continuidad. Si se enciende al disparar, registrar encendido; no inventar arranque frío para completar datos |
| **F04, P1**, `ew.js#ewStep` | `hoj-channel-capacity`: estado controlado con 6 canales ocupados por NASAMS; HOJ deja 7 activos | Reserva/liberación comunes. Nunca superar canales ni duplicar munición, incluyendo tiros normales y falsos blancos |
| **F05, P1**, `engine.js#step` y MC | `hoj-pending-completion`: a 0,25 s apaga `running` con HOJ pendiente. `hoj-montecarlo-completion`: MC termina a 2 s aunque el HOJ llega a 24,84 s; el control que resuelve efectos termina a 25 s | Finalización común que incluya efectos válidos en vuelo. Revisar bucle de interfaz/campaña, no sólo añadir un array al puente |
| **F06, P2**, `replay.js#frameAt/recUnit` | `replay-initial-damage`: radar inicial dañado aparece sano; objetivo de 300/800 aparece 800. `replay-partial-hp`: daño no letal no se reconstruye. `replay-reserve`: reserva histórica ausente | Base inmutable del comienzo real; registrar campos visibles y cambios parciales, sin consumo de RNG |
| **F07, P2**, replay/consumidores | `replay-jammer` y `replay-hoj-flight`: faltan en el cuadro. Chromium: unidad dibujada en posición histórica 40/40 tiene ficha/hit-test en posición final 60/40 | Un cuadro histórico común para dibujo, selección, tooltip, cobertura, objetivos y tiros especiales. Indicar métricas finales como finales |
| **F08, P1**, `contacts.js#contactOf` | `same-observations`: mismas detecciones t=9/10; cambiar sólo `alive` oculto cambia contacto a t=11 y su posición extrapolada | Estado conocido expira por edad o reporte explícito. Mismas observaciones deben producir misma vista |
| **F09, P1**, `render/draw.js#draw` | Chromium fuente/bundle: etiqueta de ruta ausente en marcha aparece al pausar; se dibuja el jammer enemigo sin fix. Captura y etiquetas reales de canvas | Pausa no concede inteligencia. Reglas de conocimiento para rutas/jammers; distinguir laboratorio y comandante |
| **F10, P2**, cobertura física/UI | `coverage-silent-moving` cuenta cobertura con emisión falsa. Chromium también cuenta celdas y muestra «un sensor ve», sin etiqueta potencial | La geometría potencial puede ser correcta. Separarla de cobertura operativa o etiquetarla; invalidar por eventos de disponibilidad y posición, no recalcular cada frame |
| **F11, P2**, `scenario-io.js` | `constructor`, `toString` y `__proto__` aceptados como tipos; `hpNow=99999/max=800` aceptado y descartado al cargar; ruta cero y 250.000 amenazas aceptadas | Claves propias, HP contra máximo, contrato de rutas y costo agregado medido. No es evidencia de ejecución remota |
| **F12, P2**, workflow | Lectura reproducible de YAML: filtros sólo paquete experimental/YAML; sus imports dependen de producción | Activar contratos del puente con cambios de dependencias, o correrlos en verificación común. Confirmar el workflow completo al revisar el PR |

### Controles que evitan atribuir fallos por error

- Gepard operativo conserva el enfrentamiento barato y derriba. Destruido, sin
  munición o aislado **con link apagado** no suprime al NASAMS. El caso ciego
  tiene C2 desconectada y radar en silencio, pero link activo: es el contraste
  que expone la condición insuficiente de la delegación.
- Antes de mutar cada JSON se comprueba que el documento de control sea válido.
  El rechazo de una referencia rota no cambia `S.setup`.
- La matriz de guía conserva los controles de activo/IR con pista nativa y
  cañón sin observación propia. No habilita pasarelas ni extrapola compatibilidad
  real: el sensor es de la misma familia, tiene cero munición y no dispara.
- Una ruta de longitud cero se acepta, pero su consumidor devuelve **vuelo de
  0 s finito**, no NaN. No se encontró ahí el fallo numérico que también se
  investigó. Su rechazo es un criterio de robustez/semántica del adjunto.
- Misión normal y MC sin muestreo coinciden en tiros, derribos e impactos con
  misma preparación y semilla. El puente de campaña coincide con misión normal
  para Odesa con un radar y sin lanzadores: mismo daño, HP de objetivos y cero
  munición gastada. **No generalizar ese control sin lanzadores** a recargas,
  HOJ o campañas atacante: las 116 pruebas existentes cubren otros contratos.

## N04 — Ráfaga ya disparada anulada al morir el Gepard

**Nuevo, P1, reproducción ejecutada.** Funciones: resolución de interceptores en
`src/sim/engine.js`; `RADAR_GUID` en `src/physics/engagement.js` incluye `cañón`.
El mismo módulo documenta que un cañón **no corrige en vuelo**.

```sh
node experimentos/auditoria-interacciones/run.mjs --only=gun-projectile-after-launcher-loss
```

Se espera una ráfaga en vuelo, luego se bloquean nuevos tiros/barridos en ambos
mundos. Sólo cambia si el lanzador sobrevive. El generador se fija a cero para
resolver ese único tiro sin diferencias aleatorias; no se modifica Pk ni el
catálogo y no se estima una tasa real de victoria.

| Rama del experimento | Disparo | Llegada | Resultado |
|---|---:|---:|---|
| Lanzador sigue vivo | 4,25 s | 6,25 s | Una ráfaga, un derribo |
| Lanzador muere después de disparar | 4,25 s | 6,25 s | Una ráfaga, cero derribos; «pierde la guía: su batería fue destruida» |

**Propuesta:** separar requisitos de adquisición/apuntamiento de continuidad de
guía después del disparo. La pérdida del radar o batería no debe tratar todas
las clases como TVM/SARH/mando. Conservar los checks de energía/geometría y azar
del modelo que sí correspondan; no aumentar Pk para compensar.

## N02 — EW en silencio: pregunta de diseño, no bug certificado

`ew-silence-localization` muestra dos NASAMS con `emcon=silencio` que ubican y
atacan el jammer sin emitir. Un receptor puede escuchar interferencia de forma
pasiva: eso **no prueba por sí solo** una incoherencia como la de TVM. El texto
del contrato debe definir si esa recepción está disponible, qué necesita para
triangular y cuándo se registra. Sigue en `DESIGN_REVIEW` y fuera de los bugs
confirmados. No se atribuye esa capacidad a un NASAMS real sólo por el código.

`replay-reserve` (N01) amplía F06; el candidato numérico de ruta cero (N03) quedó
descartado. No se presentan como tres hallazgos independientes nuevos.

## Rendimiento medido y límites

Entorno exacto en JSON: Node 24.19.0, Linux 6.18.44, CPU informada AMD EPYC 9V74,
5 CPU lógicas expuestas, aproximadamente 33,3 GiB de RAM informada por el sistema.
No es una promesa de rendimiento para otro dispositivo ni una medida de cuota
efectiva de CPU.

Mismo mapa plano, NASAMS+EWR, Shahed, semilla 7, parámetros probables, 80 pasos
de 0,25 s. Una ejecución por tamaño; mediana/P95 incluyen pasos con y sin barrido.

| Amenazas | Mediana step | P95 step | Máximo step | Proyección serializada de historia |
|---:|---:|---:|---:|---:|
| 10 | 0,039 ms | 0,312 ms | 3,256 ms | 9.566 bytes |
| 100 | 0,130 ms | 1,379 ms | 2,614 ms | 106.573 bytes |
| 1.000 | 0,598 ms | 4,134 ms | 5,308 ms | 412.866 bytes |

La proyección incluye estelas/observaciones y eventos seleccionados, **no un
snapshot completo del motor**. La historia contiene referencias cíclicas entre
interceptor y amenaza; medir una proyección no certifica el futuro guardado en
combate. Delta de heap puede ser negativo por GC y no mide memoria retenida.

Cobertura de un sensor: 4,62 ms para 100² celdas y 3,33 ms para 250². La segunda
medición más rápida es compatible con calentamiento/JIT y geometría radial;
no demuestra escalado inverso con el tamaño. Repetir varias veces antes de
optimizar o elegir un límite.

En Chromium se ejecutó un bloque **sintético sin ceder** de 80 pasos con 1.000
amenazas. El temporizador del hilo UI se retrasó en torno a 150 ms; números
exactos fuente/bundle en `browser.json`. No es el flujo presupuestado de MC/Auto
ni una medición de latencia de red. El dibujo y el máximo de step están separados.

No se simularon 250.000 amenazas. Su aceptación por importación es una observación
de validación, no una demostración de cuelgue ni de un límite seguro. Tampoco se
midieron móviles, todos los climas, duración máxima de historia o cien unidades.

## Pendientes de esta auditoría

1. Cuando el usuario entregue el PR de Claude, fijar su SHA y ejecutar estos
   casos contra esa copia sin editarla. Clasificar resuelto/persiste/incompatible
   y verificar que los controles válidos siguen funcionando.
2. Revisar contabilidad y finalización en campaña con HOJ/falsos blancos/recargas
   reales: el control sin lanzadores no cierra esa interacción.
3. Revisar tooltip y estado histórico de cobertura después del cuadro común.
   Se verificaron selección, hit-test y cobertura operativa; no cada tooltip ni
   toda invalidación visual de movilidad/daño.
4. Repetir mediciones y probar respuesta con cargas mayores de forma acotada
   antes de fijar límites globales o introducir workers.

No se reabren los tres errores de #72 ya corregidos. No se expandió catálogo,
activaron pasarelas/perfiles ni corrigió el motor en esta rama. La movilidad en
campaña y nuevas variantes siguen pendientes; una carpeta experimental o un
diagnóstico exitoso no las convierten en funciones jugables.
