> Archivo histórico: se conserva el trabajo original externo, incluidos sus estados de aquel momento. No usarlo para inferir la situación actual de PR, pruebas o responsables. Consultar [el estado actual](../ESTADO-Y-RELEVO.md).

# Contrato provisional entre catálogo y física

Estado: contrato de campos y unidades aclarado por Claude; integración y muestreo conjunto pendientes. No modifica su código ni le exige una refactorización ahora.

Origen: actualizaciones de Claude facilitadas por el usuario, incluida su respuesta sobre el PR #41. No se inspeccionó ni se ejecutó esa implementación en esta sesión. Las afirmaciones sobre tests y estado del PR son reportadas por Claude, no verificaciones independientes.

## Estado reportado de la entrega física

Claude informa que el perfil está subido al PR en borrador [#41](https://github.com/AltaLasagnaS/cielo-cerrado/pull/41), sobre #40 y #39; que pasan 167 pruebas y el lint; y que están regenerados `index.html` y `docs/CATALOGO.md`. Su actualización posterior informa que la tabla de calibración y los Monte Carlo terminaron, que `npm run check` pasó y que la CI quedó verde en el último commit. No se verificaron esos resultados independientemente aquí.

La respuesta posterior deja el MANPADS legado sin `vmax/tb`. También aumenta Kiev de siete a nueve Kh-101 para recuperar su tasa de victoria anterior. El usuario confirmó que prioriza realismo; se recomendó revertir únicamente ese cambio de escenario y conservar la física, dejando cualquier variante más difícil separada. No se modificó el PR.

Actualización verificada en lectura: el perfil llegó finalmente a `main` mediante el #42; `FETCH_HEAD` en `4bbb5a2` contiene el módulo y todavía nueve Kh-101 en Kiev. No se cambió la rama local ni se ejecutaron en ella las pruebas del main nuevo. El reporte de CI verde proviene de la captura de Claude.

## Entidades y responsabilidades

| Entidad | Contenido propio | No asumir |
|---|---|---|
| Munición | Identidad, prestaciones condicionadas, guía, parámetros del modelo | Inventario o capacidades completas de la batería |
| Lanzador | Configuración, municiones admitidas, carga física y mecanismo de recarga | Canales de radar o todos los tiempos de mando |
| Sensor/control | Detección, seguimiento y recursos de empleo | Compatibilidad por simple pertenencia al bando |
| Configuración | Asociación verificada de componentes y funciones | Mezcla universal de todas las piezas de la familia |
| Unidad desplegada | Propietario, posición, carga real, reserva, daño y estado | Confundir nacionalidad con propietario |
| Oferta económica | Concepto, cantidad, moneda, año, condiciones | Que costo por misil represente precio de batería |

## Adaptador al modelo actual

Preparar datos independientes y un adaptador futuro al formato `DEFENSES`. La integración será otra entrega, después de cerrar y verificar la física de Claude. No reemplazar ahora `sam`, `radar` ni la lectura que hace `solve()`.

Campos de munición solicitados por Claude: `maxR`, `maxRtbm`, `minR` en km; `altMin`, `altMax` en m; `vInt`, `vmax` en m/s; `tb` en s. `vmaxT`, `guid`, `pk` y `cost` necesitan mantener sus semánticas documentadas, no sólo sus nombres.

`vInt` permanece obligatorio para el adaptador descrito por Claude. Cuando sea un parámetro de calibración, se etiqueta como tal; no se presenta como velocidad física medida.

`vmax` y `tb` aparecen juntos o se omiten juntos. La omisión activa el comportamiento legado que Claude describe, no una inferencia de duración o velocidad desconocidas. La excepción para cañones y guiado por operador se mantiene como regla de ese modelo, sin extenderla a otras familias por analogía.

Definición confirmada por Claude: `tb` es el tiempo desde el lanzamiento hasta alcanzar `vmax`, suponiendo aceleración uniforme. No es necesariamente el tiempo total de combustión. Para nuevos datos se registra como parámetro del perfil aproximado y se conserva aparte cualquier duración física de motor publicada. No copiar automáticamente esa duración a `tb`.

Claude propone usar la duración del booster cuando concentra la aceleración y la combustión total cuando representa la aceleración hasta el final. Son reglas de aproximación que necesitan justificación por variante; no prueban que el modelo represente literalmente sostenedores, doble pulso o ramjet.

`mag`, `reserve`, `reloadS`, `salvo`, `react` y `ch` pueden seguir disponibles en la vista legada. Al estructurar datos nuevos hay que documentar alcance y cardinalidad: por lanzador, unidad de fuego o batería. `ch` podría representar un recurso de control y `react` una combinación de doctrina/procesos; no moverlos automáticamente a la ficha física del lanzador.

## Condición del perfil y comportamiento alternativo

Claude corrigió la fórmula del mensaje anterior. Con `R_m = maxR × 1000` y `T_s = R_m / vInt`, informa que existe la solución de frenado calibrada cuando se cumplen ambas condiciones:

- `T_s > tb`.
- `vmax × (T_s − tb/2) > R_m`.

Si no se cumplen, informa que el misil vuela sin frenado y no conserva necesariamente el tiempo `T_s` al alcance máximo. Esto no es lo mismo que omitir `vmax` y `tb`: hay que distinguir perfil ausente, perfil calibrado con frenado y perfil sin solución de frenado. Las igualdades quedan fuera de la condición estricta que reportó.

La entrada al adaptador debe ser numéricamente válida; esta condición adicional clasifica el comportamiento de calibración y no demuestra por sí sola imposibilidad física de una munición. Mostrar una advertencia para configuraciones nuevas que no preserven el tiempo de referencia. No inventar parámetros para forzar que entren en la rama calibrada.

Claude informa que corrigió el caso `T_s ≤ tb` y agregó una prueba. No se verificó aquí el código ni su resultado. Antes de integrar datos nuevos, revisar además el caso límite de igualdad y las muestras de incertidumbre que puedan cambiar de rama.

La lectura posterior de `main` confirma esa guarda. Además se reprodujo un límite inferior no cubierto por la condición descrita: si `T_s > tb` y `R_m ≤ vmax × tb / 2`, no puede encontrarse un frenado positivo que preserve ese tiempo. Ver la [nota reproducible](../NOTA-INTERCEPTOR.md). No se verificó que ocurra en perfiles actuales; el comprobador de nuevos datos lo marca para revisión.

## Preguntas que siguen abiertas

1. ¿Cuándo y cómo muestrea `vInt`, `vmax`, `tb` y alcance desde `UNC`? ¿Qué ocurre si una muestra pasa de perfil calibrado a perfil sin frenado?
2. ¿Qué cardinalidad tienen los recursos `ch` y `mag` en el adaptador y cómo distingue posteriormente municiones mixtas?

No interpretar booster, sostenedor, doble pulso y ramjet como perfiles físicos equivalentes. Si el modelo actual los aproxima con un único tramo, registrar explícitamente la limitación. Conservar el tiempo de vuelo al alcance máximo y superar una calibración no prueban por sí solos fidelidad del perfil ni de toda la envolvente.

## Incertidumbre y validación

- Toda magnitud tiene unidades, ámbito, fuente, confianza y condición. Una fuente de alcance no valida automáticamente duración de motor ni velocidad media.
- El muestreo debe respetar restricciones entre parámetros: límites marginales válidos no garantizan una muestra conjunta físicamente o matemáticamente admisible.
- Mantener el RNG central del proyecto y reproducibilidad. No decidir aquí una política nueva de muestreo sin revisar la que implementó Claude.
- Validar costos, existencia de fuentes y referencias, IDs y compatibilidades, además de números finitos y unidades.
- No actualizar golden ni calibración desde esta línea de trabajo. Claude debe revisar sus cambios de resultados, nuevas pruebas y documentación antes de cerrar su PR.

## Límites del trabajo paralelo

Codex: estas fichas, matriz y contrato; investigación de presupuesto/briefing/campaña. Claude: roadmap, física y las áreas que tiene asignadas. No editar simultáneamente catálogo activo, incertidumbre global, motor, render, pruebas existentes ni archivos generados.

Ya existe un [paquete independiente](../../README.md) con datos de referencia, validación, fichas y prototipo económico. No está activado en el simulador ni sustituye ningún archivo de Claude.

La integración se revisa contra el último main. Si ambos necesitan modificar un archivo, se designa un único responsable para esa entrega. No confiar únicamente en la ausencia de conflictos textuales: dos cambios pueden ser incompatibles semánticamente aunque Git los combine.
