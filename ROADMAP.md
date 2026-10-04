# Hoja de ruta

Rumbo: un **CMO liviano, de código abierto y educativo**. Escenarios cortos sobre relieve real, modelos físicos simples pero con la forma correcta, datos públicos con la incertidumbre a la vista, y un debrief que enseña.

Son ideas ordenadas por prioridad, no promesas. Cada ítem que cambie resultados debe pasar por las pruebas golden y quedar en el CHANGELOG.

## Próximo (0.4)

- (vacío: la lectura completa de las fuentes de EW ucraniana está hecha, sección H de `docs/investigacion/guerra-electronica-ucraniana.md`).

## Física (cada ítem es **[sim]**)

Propuesta detallada, con orden, dificultad, datos y pruebas: [docs/investigacion/mejoras-fisica.md](docs/investigacion/mejoras-fisica.md).


- Detección, tercera parte: integración de pulsos, clutter de mar según el estado del mar y de lluvia, visibilidad sub-clutter por radar con datos (Swerling 3 ya está, verificado).
- Interceptor con perfil de velocidad (motor y planeo) y límite de g en lugar de velocidad media (el paso A, alcance según el aspecto y Pk según la energía, ya está).
- Daño funcional, segunda parte: reparación con el tiempo, daño por lanzador y objetivos con capacidades (una base aérea dañada no lanza aviones, cuando haya aviones).
- Clima, segunda parte (los estados base ya están): día y noche para los sensores IR, nieve, clutter de lluvia, viento sobre los drones y clima que cambia durante la noche.
- **Enlaces de datos por sistema** (Link 16, red nacional ucraniana, red rusa tipo Polyana) con pasarelas: solo comparten pistas los sistemas compatibles.

- ECM/ECCM, segunda parte: engaño (DRFM, robo de ventana de distancia) contra los radares de tiro, supresión de lóbulos laterales (SLB) contra pulsos, home-on-jam (misiles que van contra el avión de interferencia) y triangulación de jammers con varios radares.

## Juego

- Más escenarios: corredor del mar Negro, Odesa con `scripts/gen-terrain.mjs` (Kiev y Járkov ya están).
- Plataformas aéreas propias: patrullas de cazas como interceptores con radio de acción.
- Niebla de guerra más estricta: jugar solo con lo que ven tus sensores.
- Editor de objetivos y metas desde la interfaz.
- Repetición de la corrida (línea de tiempo navegable en el debrief).
- Idioma inglés (los textos ya están separados de la lógica en buena parte).

## Técnica

- Versión de escritorio opcional (Tauri o Electron) si hace falta acceso a archivos grandes.
- Tipografías embebidas para el uso sin conexión.
- Pruebas de interfaz en el navegador dentro de la CI (Playwright).
- TypeScript gradual o `// @ts-check` sobre los tipos JSDoc de `src/types.js`.
