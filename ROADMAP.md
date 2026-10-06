# Hoja de ruta

Rumbo: un **CMO liviano, de código abierto y educativo**. Escenarios cortos sobre relieve real, modelos físicos simples pero con la forma correcta, datos públicos con la incertidumbre a la vista, y un debrief que enseña.

Son ideas ordenadas por prioridad, no promesas. Cada ítem que cambie resultados debe pasar por las pruebas golden y quedar en el CHANGELOG.

## Próximo

- **Perspectivas por bando, segunda parte** (etapa 1 del plan de Codex, [`PLAN-MAESTRO.md`](experimentos/catalogo-presupuesto/docs/PLAN-MAESTRO.md)). Ya están el dueño explícito de cada unidad (`u.owner`) y la vista del defensor con contactos (posición estimada, edad, último reporte; ficha de pista sin la verdad). Ya está también el **tiro sin omnisciencia** (la defensa apunta con su pista; CHANGELOG). Ya están también la **vista del atacante** y el registro, los resultados y los objetivos por bando; el debrief muestra la verdad a propósito (análisis posterior). Ya está también el control de emisiones (radares que emiten siempre, con la primera alerta o nunca). Falta: el tiempo de encendido de cada radar y la doctrina real de emisiones (datos pedidos a Codex).

## Física (cada ítem es **[sim]**)

Propuesta detallada, con orden, dificultad, datos y pruebas: [docs/investigacion/mejoras-fisica.md](docs/investigacion/mejoras-fisica.md). Cada ítem dice qué espera.

- **Clutter: datos por radar; integración de pulsos por radar.** El modelo físico ya está (suelo Billingsley, mar NRL 2012 por estado del mar, lluvia de Barton, celda de resolución, factor de mejora MTI/PD por clase; docs/FISICA.md §2) con parámetros por clase y rango en `UNC.clu`. *Espera datos* para pasar a valores por radar: mejora sub-clutter o factor de mejora, PRF, resolución en distancia, ancho de haz en elevación y polarización (handoff a Codex), y los pulsos integrados. El S-125 ya tiene MTI (APA y Missilery); falta un manual primario de la variante.
- **Interceptor, maniobra: datos por misil.** Ya están el perfil de motor y planeo, la zona de no escape, la ficha de alcance y energía y la maniobra según la altura (atmósfera estándar; `sam.hFull` por clase; PAC-3 y Aster con empuje lateral directo). *Espera datos* (handoff a Codex, tema 4): aceleración lateral máxima de cada misil por altura y cuánto maniobra cada amenaza; tampoco está todavía que las amenazas maniobren menos arriba.
- **Daño funcional, segunda parte** (daño por lanzador, reparación con tiempo y recursos, objetivos con capacidades). *Espera la etapa 2 del plan de Codex* (componentes: lanzador, radar y control por separado) y la de logística.
- **Enlaces de datos, tercera parte.** Ya están las familias por sistema, la pasarela Link 16 ↔ red C2 ucraniana (demora y Pk estimadas) y el nivel de C2 por unidad. Ya están también los puestos de mando separados. Falta: saturación de la red por cantidad de pistas y puestos que se pasan pistas entre sí con demora: *bloqueados por datos* (Codex no encontró demoras confirmadas, docs/investigacion/datos-fisica-enlaces.md).
- **ECM/ECCM, tercera parte.** Ya están el engaño DRFM con blanqueo de lóbulos laterales, la capacidad de seguimiento por radar, la triangulación de jammers y el home-on-jam contra jammers aéreos (docs/FISICA.md §4). Ya están también los disparos desperdiciados contra falsos blancos y la ubicación del jammer DRFM por su emisión. Ya se pueden destruir jammers terrestres con una salva apuntada a ellos. Falta: arrastre de distancia o velocidad (RGPO/VGPO) con un jammer a bordo del blanco y misiles antirradiación que se guíen a la emisión (hacen falta sus datos en el catálogo). Los datos que entregó Codex (tema 2) no alcanzan para RGPO/VGPO por sistema.
- **Clima, tercera parte.** Ya están día y noche (factor óptico estimado), nieve, cambios de tiempo durante la noche y viento según la altura. Falta: nieve húmeda (atenúa), el clima sobre los buscadores IR de los misiles y el alcance de visores térmicos por hora: *bloqueados por datos* (Codex no encontró fuentes, docs/investigacion/datos-fisica-clima.md). También falta clima distinto por zona del mapa (no necesita datos, es trabajo de interfaz).

## Dudas abiertas (para decidir con el usuario)

- Ninguna por ahora: las cuatro de la noche del 5-oct se resolvieron (CHANGELOG).

## Juego

- Niebla de guerra más estricta: ver **Perspectivas por bando**.
- **Campaña experimental de Odesa en el juego** (botón Campaña; lógica de Codex en `experimentos/catalogo-presupuesto/`): dos o tres guardias con presupuesto, munición pedida y cargada con plazos, daño y munición que se arrastran, guardado entre guardias. Falta: más misiones y campaña del atacante (Codex), configuraciones y precios con evidencia, traslados por el mapa, reporte de daño incierto para el atacante y restaurar una guardia a mitad de camino.
- **Movilidad, segunda parte** (etapa 5 del plan de Codex). Ya está el mecanismo de traslado, programable desde el escenario (`sim/mobility.js`). Falta:
  - Los tiempos de repliegue y despliegue y la velocidad de cada sistema (*espera datos*, pedidos a Codex en #62).
  - Ordenar un traslado desde el mapa durante la partida.
  - Detectar o disparar en movimiento cuando esté documentado.
  - Traslados en la campaña.
- Corredor del mar Negro, segunda parte: barcos que navegan por el corredor (ya están los barcos amarrados como objetivo y el escenario `od_corredor`). *Espera movilidad* (etapa 5 del plan de Codex).
- Plataformas aéreas propias: patrullas de cazas como interceptores. *El plan de Codex las deja para el final* (etapa 7).
- Idioma inglés (los textos ya están separados de la lógica en buena parte). Baja prioridad.

## Técnica

- Versión de escritorio opcional (Tauri o Electron), solo si hace falta acceso a archivos grandes.

Hecho en esta etapa (ver CHANGELOG): perfil del interceptor, viento, integración de pulsos opcional, repetición de la corrida, editor de metas, escenarios de Odesa, tipografías sin conexión, pruebas de navegador en la CI, `@ts-check` con `strictNullChecks` en todas las capas, clutter, guerra electrónica y enlaces (segunda parte), maniobra por altura, clima (segunda parte), tiro sin omnisciencia, vista del atacante, registro y resultados por bando, control de emisiones, jammers terrestres atacables y selección por rectángulo.
