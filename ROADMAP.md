# Hoja de ruta

Rumbo: un **CMO liviano, de código abierto y educativo**. Escenarios cortos sobre relieve real, modelos físicos simples pero con la forma correcta, datos públicos con la incertidumbre a la vista, y un debrief que enseña.

Son ideas ordenadas por prioridad, no promesas. Cada ítem que cambie resultados debe pasar por las pruebas golden y quedar en el CHANGELOG.

## Próximo (0.4)

- (vacío: la lectura completa de las fuentes de EW ucraniana está hecha, sección H de `docs/investigacion/guerra-electronica-ucraniana.md`).

## Física (cada ítem es **[sim]**)

Propuesta detallada, con orden, dificultad, datos y pruebas: [docs/investigacion/mejoras-fisica.md](docs/investigacion/mejoras-fisica.md).


- Detección, tercera parte: asignar integración de pulsos por radar **cuando haya datos** (modelo no coherente opcional Swerling 1/3 implementado y verificado; catálogo conserva la aproximación de un pulso), clutter de mar según el estado del mar y de lluvia, visibilidad sub-clutter por radar con datos. Ver [investigación de integración de pulsos](docs/investigacion/integracion-pulsos.md).
- Interceptor, segunda parte (el perfil de motor y planeo, la zona de no escape y la tabla de alcance y energía en la ficha ya están): maniobra según la altura (densidad del aire). **Espera datos**: hace falta la aceleración lateral máxima de cada misil y su forma de control (aletas o empuje lateral directo, como PAC-3 y Aster), y un modelo de cuánta maniobra exige cada blanco; sin eso, un factor por altura sería inventado.
- Daño funcional, segunda parte: reparación con el tiempo, daño por lanzador y objetivos con capacidades (una base aérea dañada no lanza aviones, cuando haya aviones).
- Clima, segunda parte (los estados base y el viento sobre drones y crucero ya están): día y noche para los sensores IR, nieve, clutter de lluvia, viento que cambia con la altura y clima que cambia durante la noche.
- Enlaces de datos, segunda parte (las familias por sistema ya están: Link 16, red nacional ucraniana y red rusa, y solo comparten pistas los compatibles): pasarelas entre familias con demora y pérdida, y pertenencia a la red de mando por unidad, separada del interruptor de enlace técnico.

- ECM/ECCM, segunda parte: engaño (DRFM, robo de ventana de distancia) contra los radares de tiro, supresión de lóbulos laterales (SLB) contra pulsos, home-on-jam (misiles que van contra el avión de interferencia) y triangulación de jammers con varios radares.

## Juego

- Más escenarios: corredor del mar Negro (Kiev, Járkov y Odesa ya están).
- Plataformas aéreas propias: patrullas de cazas como interceptores con radio de acción.
- Niebla de guerra más estricta: jugar solo con lo que ven tus sensores.
- Editor de objetivos y metas desde la interfaz.
- Idioma inglés (los textos ya están separados de la lógica en buena parte).

## Técnica

- Versión de escritorio opcional (Tauri o Electron) si hace falta acceso a archivos grandes.
- Tipografías embebidas para el uso sin conexión.
- Pruebas de interfaz en el navegador dentro de la CI (Playwright).
- TypeScript gradual o `// @ts-check` sobre los tipos JSDoc de `src/types.js`.
