# Hoja de ruta

Rumbo: un **CMO liviano, de código abierto y educativo**. Escenarios cortos sobre relieve real, modelos físicos simples pero con la forma correcta, datos públicos con la incertidumbre a la vista, y un debrief que enseña.

Son ideas ordenadas por prioridad, no promesas. Cada ítem que cambie resultados debe pasar por las pruebas golden y quedar en el CHANGELOG.

## Próximo

- **Perspectivas por bando** (etapa 1 del plan de Codex, [`PLAN-MAESTRO.md`](experimentos/catalogo-presupuesto/docs/PLAN-MAESTRO.md)): dueño explícito de cada unidad, separado del país del equipo; lo que sabe cada bando (lo propio, y del enemigo solo contactos con edad e identificación); interfaz en modo laboratorio, defensa o ataque; y tiro sin trampa (predecir con la pista observada, no con la trayectoria real). Destraba la niebla de guerra, el briefing propio, el presupuesto y la campaña.

## Física (cada ítem es **[sim]**)

Propuesta detallada, con orden, dificultad, datos y pruebas: [docs/investigacion/mejoras-fisica.md](docs/investigacion/mejoras-fisica.md). Cada ítem dice qué espera.

- **Clutter de mar y de lluvia; integración de pulsos por radar.** *Espera datos.* El modelo de integración no coherente ya está y está verificado, y el clutter simple actual (pérdida estimada por tipo de procesamiento y notch Doppler) también. Lo que falta, según [la investigación de datos](docs/investigacion/clutter-y-pulsos-datos.md): por variante de radar, la mejora sub-clutter (SCV) medida, los pulsos integrados o el tiempo en el blanco, y el tipo de procesamiento (MTI, MTD, pulso-Doppler); para el mar, un modelo de reflectividad verificado en su fuente original (NRL, GIT o Nathanson) y el tamaño de la celda de cada radar; para la lluvia, una ley `Z–R` con fuente y la frecuencia exacta de cada radar. Sin eso, cualquier número sería inventado. Pendiente aparte: Air Power Australia atribuye MTI al radar del S-125 (SNR-125) y el catálogo lo tiene sin MTI; hace falta una segunda fuente para cambiarlo (en octubre de 2026 no se encontró).
- **Interceptor, maniobra según la altura.** *Espera datos:* aceleración lateral máxima y forma de control de cada misil (aletas o empuje lateral directo, como PAC-3 y Aster), y cuánta maniobra exige cada blanco. Ya están el perfil de motor y planeo, la zona de no escape y la ficha de alcance y energía.
- **Daño funcional, segunda parte** (daño por lanzador, reparación con tiempo y recursos, objetivos con capacidades). *Espera la etapa 2 del plan de Codex* (componentes: lanzador, radar y control por separado) y la de logística.
- **Enlaces de datos, segunda parte** (pasarelas entre familias con demora y pérdida; pertenencia a la red de mando por unidad). *Va con las perspectivas por bando*. Ya están las familias por sistema y la separación visual entre C2 y enlace técnico.
- **ECM/ECCM, segunda parte** (engaño DRFM, SLB, home-on-jam, triangulación de jammers). *Espera aviones como blancos:* home-on-jam y engaño apuntan sobre todo a los aviones de interferencia, que hoy no se pueden atacar.
- **Clima, segunda parte** (día y noche para sensores IR, nieve, clima que cambia durante la noche, viento según la altura). Se puede hacer, pero rinde poco con los sensores actuales y no hay datos para cuantificar el día y la noche en las cámaras térmicas. Ya están los estados base y el viento sobre drones y crucero.

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
