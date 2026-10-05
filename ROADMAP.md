# Hoja de ruta

Rumbo: un **CMO liviano, de código abierto y educativo**. Escenarios cortos sobre relieve real, modelos físicos simples pero con la forma correcta, datos públicos con la incertidumbre a la vista, y un debrief que enseña.

Son ideas ordenadas por prioridad, no promesas. Cada ítem que cambie resultados debe pasar por las pruebas golden y quedar en el CHANGELOG.

## Próximo

- **Perspectivas por bando** (etapa 1 del plan de Codex, [`PLAN-MAESTRO.md`](experimentos/catalogo-presupuesto/docs/PLAN-MAESTRO.md)): dueño explícito de cada unidad, separado del país del equipo; lo que sabe cada bando (lo propio, y del enemigo solo contactos con edad e identificación); interfaz en modo laboratorio, defensa o ataque; y tiro sin trampa (predecir con la pista observada, no con la trayectoria real). Destraba la niebla de guerra, el briefing propio, el presupuesto y la campaña.

## Física (cada ítem es **[sim]**)

Propuesta detallada, con orden, dificultad, datos y pruebas: [docs/investigacion/mejoras-fisica.md](docs/investigacion/mejoras-fisica.md). Cada ítem dice qué espera.

- **Clutter: datos por radar; integración de pulsos por radar.** El modelo físico ya está (suelo Billingsley, mar NRL 2012 por estado del mar, lluvia de Barton, celda de resolución, factor de mejora MTI/PD por clase; docs/FISICA.md §2) con parámetros por clase y rango en `UNC.clu`. *Espera datos* para pasar a valores por radar: mejora sub-clutter o factor de mejora, PRF, resolución en distancia, ancho de haz en elevación y polarización (handoff a Codex), y los pulsos integrados. Pendiente aparte: Air Power Australia atribuye MTI al SNR-125 del S-125 y el catálogo lo tiene sin MTI; con el clutter nuevo eso lo deja casi ciego contra blancos rasantes sobre tierra cerca de él, así que conviene resolverlo con una segunda fuente.
- **Interceptor, maniobra según la altura.** *Espera datos:* aceleración lateral máxima y forma de control de cada misil (aletas o empuje lateral directo, como PAC-3 y Aster), y cuánta maniobra exige cada blanco. Ya están el perfil de motor y planeo, la zona de no escape y la ficha de alcance y energía.
- **Daño funcional, segunda parte** (daño por lanzador, reparación con tiempo y recursos, objetivos con capacidades). *Espera la etapa 2 del plan de Codex* (componentes: lanzador, radar y control por separado) y la de logística.
- **Enlaces de datos, segunda parte** (pasarelas entre familias con demora y pérdida; pertenencia a la red de mando por unidad). *Va con las perspectivas por bando*. Ya están las familias por sistema y la separación visual entre C2 y enlace técnico.
- **ECM/ECCM, tercera parte.** Ya están el engaño DRFM con blanqueo de lóbulos laterales, la capacidad de seguimiento por radar, la triangulación de jammers y el home-on-jam contra jammers aéreos (docs/FISICA.md §4). Falta: arrastre de distancia o velocidad (RGPO/VGPO) con un jammer a bordo del blanco, disparos desperdiciados contra falsos blancos, ubicar por sus emisiones a un jammer DRFM (hoy solo se triangula el ruido) y atacar jammers terrestres (misiles antirradiación o artillería). *Espera datos* (handoff a Codex, tema 2): qué jammers tienen DRFM, potencias y qué misiles tienen home-on-jam.
- **Clima, segunda parte** (día y noche para sensores IR, nieve, clima que cambia durante la noche, viento según la altura). Se puede hacer, pero rinde poco con los sensores actuales y no hay datos para cuantificar el día y la noche en las cámaras térmicas. Ya están los estados base y el viento sobre drones y crucero.

## Dudas abiertas (para decidir con el usuario)

- **CRPA y enlace de datos (4G/mesh) de los Shahed y otras armas.** Hoy son opciones de cada salva y vienen **apagadas** por defecto (`crpa: 0`, `link: false`); solo las KAB de Járkov usan CRPA de 12. Qué hacen en el motor: la **CRPA** de N elementos anula hasta N − 1 anti-GNSS que llegan desde direcciones distintas (con más, el arma pierde el satélite); el **enlace** le permite descartar el engaño GNSS (el operador ve dónde está de verdad) y seguir solo con el error inercial, y un antidrón como Bukovel se lo corta. No se modela que el operador cambie de blanco ni el video. Pregunta: ¿activarlos por defecto según la fecha del escenario? Según la investigación (`docs/investigacion/guerra-electronica-ucraniana.md`): Kometa de 4 elementos desde 2022, de 12 en Shahed y UMPK desde 2025, CRPA chinas de 16 desde mar-2025; módems 4G/mesh en Shahed desde 2024–25. Eso cambiaría resultados de los escenarios de esas fechas (**[sim]**).

## Juego

- Niebla de guerra más estricta: ver **Perspectivas por bando**.
- Misión de un solo bando con briefing propio, presupuesto y medios finitos (etapa 3 del plan de Codex; prototipo en `experimentos/catalogo-presupuesto/`).
- Campaña corta con estado persistente (etapa 6 del plan de Codex).
- Corredor del mar Negro. *Espera barcos como objetivo* (Kiev, Járkov y Odesa ya están).
- Plataformas aéreas propias: patrullas de cazas como interceptores. *El plan de Codex las deja para el final* (etapa 7).
- Idioma inglés (los textos ya están separados de la lógica en buena parte). Baja prioridad.

## Técnica

- `@ts-check`, segunda parte (ya está en `util`, `data`, `physics` y `sim`, y corre en la CI): sumar `render` y `ui` (falta tipar el DOM) y activar `strictNullChecks` (49 avisos, todos por el mapa activo `MAP` que empieza en `null`; ninguno es un error real).
- Versión de escritorio opcional (Tauri o Electron), solo si hace falta acceso a archivos grandes.

Hecho en esta etapa (ver CHANGELOG): perfil del interceptor, viento, integración de pulsos opcional, repetición de la corrida, editor de metas, escenario de Odesa, tipografías sin conexión, pruebas de navegador en la CI y `@ts-check` en las capas de abajo.
