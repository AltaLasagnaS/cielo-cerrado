# Changelog

Todos los cambios relevantes del proyecto. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/): mientras la versión sea 0.x, cualquier versión menor puede cambiar resultados de la simulación.

Cuando un cambio **altera los resultados de la simulación** (física o datos), se indica con **[sim]**.

## [Sin publicar]

### Agregado
- **[sim] Triangulación de interferidores y home-on-jam** (docs/FISICA.md §4, `physics/jamloc.js`, `sim/ew.js`). Dos radares de la defensa que oyen al mismo jammer y comparten marcaciones por la red lo ubican (error del monopulso y del ángulo de cruce); con el jammer aéreo ubicado, PAC-2 GEM-T, NASAMS e I-Hawk (`sam.hoj`, con fuente) le pueden disparar misiles que se guían a su ruido (`sam.pkHoj`, estimada con rango en UNC). Un jammer derribado deja de interferir; el mapa marca el error y el derribo. En los escenarios incluidos el Il-22PP queda ubicado pero fuera de alcance: los resultados no cambian, solo el registro suma esa línea.
- **[sim] Engaño DRFM, blanqueo de lóbulos laterales y capacidad de seguimiento** (docs/FISICA.md §4). Nuevo modo de jammer `drfm`: no mete ruido, crea falsos blancos por el lóbulo principal y, si es fuerte, por los laterales, salvo en radares con blanqueo (`radar.slb`). Cada radar tiene ahora una capacidad de seguimiento (`radar.tracks`, publicada para Patriot, Arabel, TRML-4D, Sentinel, 30N6, 9S18M, Tor y 92N6; estimada el resto, con rango en UNC): si las pistas reales más las falsas la llenan, no abre pistas nuevas. Sin jammers DRFM en los escenarios incluidos, el único cambio es el puente de Monterey, donde el Pantsir-1 llega a su capacidad de 20 con el enjambre; el resultado no se mueve (40 noches: el ataque gana 28%, igual que antes). Calibración sin cambios: sus casos no tienen DRFM ni llenan la capacidad.
- **`@ts-check`** en las capas `util`, `data`, `physics` y `sim`: TypeScript (solo como herramienta de desarrollo) revisa los tipos con los JSDoc que ya había. `npm run typecheck`, incluido en `npm run check` y en la CI. Sin errores en esas capas; `render` y `ui` quedan para después (ver ROADMAP).
- **Editor de metas**: botón "Metas" en la tarjeta del escenario (también en los mapas libres). Elegís de qué bando jugás y agregás, cambiás o borrás metas de cada bando (destruir, dañar con un mínimo, mantener operativo o que no sea destruido un objetivo; destruir o conservar una unidad), principales o secundarias, con el texto armado solo. Trabaja sobre una copia: el escenario incluido no cambia. Las metas se guardan en el archivo del escenario y el debrief las evalúa como siempre.
- **Escenario de Odesa: noche de los puertos** (`od_puertos`, defensa ucraniana) sobre el relieve real (tile SRTM N46E030, `scripts/gen-terrain.mjs odesa`), más el mapa libre `od_vacio`. Inspirado en la noche del 19/7/2023 tras el fin del acuerdo de granos (ISW): 16 Shahed, 8 Kalibr, 4 Kh-22 y 3 Oniks contra la terminal de granos de Chornomorsk y el puerto de Odesa. Lugares con coordenadas de Wikidata y Wikipedia; defensa ilustrativa. Una primera versión con los radares tierra adentro dejaba ciega la aproximación por el mar (la meseta costera tapaba a los Kalibr a 20 m): se reubicaron con un análisis de línea de vista sobre el relieve. Resultado (40 noches, valores probables): la defensa gana 40%; Kalibr derribados 89% (real esa noche: 13 de 16, 81%), Kh-22 13% y Oniks 23% (real: ninguno; el modelo sigue sobreestimando a los supersónicos, ver el caso de control del Oniks).
- **Delete borra la selección en preparación**, reutilizando el botón de eliminar de defensas, objetivos, jammers y salvas. Ignora campos y contenido editable, ventanas, corridas activas o pausadas y Monte Carlo.
- **Cantidades enteras con mensajes explícitos**: munición, reserva, interceptores por blanco y cantidad de ataque rechazan fracciones sin redondear; indican el error y conservan el último valor válido.
- **C2 y datalink separados visualmente**: la selección distingue coordinación general y enlace técnico de pistas, y explica qué se pierde al desconectar cada uno. No cambia el modelo ni agrega pertenencia C2 por unidad.
- **Investigación de clutter de mar/lluvia e integración por radar**, `docs/investigacion/clutter-y-pulsos-datos.md`: fuentes, dominios GIT/Nathanson/NRL y magnitudes de lluvia; mantiene sin dato los pulsos integrados y la SCV no publicados. Señala la evidencia secundaria de MTI en SNR-125 y distingue radares pulsados de iluminación CW. Sólo documentación; no cambia física, datos ni resultados.
- **Tipografías incluidas sin conexión**: IBM Plex Sans/Mono y Barlow Condensed originales, con sus avisos OFL completos también dentro del HTML descargable. El build no usa red y el archivo ya no pide Google Fonts. Integridad/procedencia fijadas por SHA-256 y Chromium exige fuentes cargadas sin intentos de red externa. Bundle: 4,03 MiB sobre la base #48; detalles en `docs/TIPOGRAFIAS.md`. No cambia la simulación.
- **Repetición de la corrida**: desde el debrief, "Ver repetición" vuelve a mostrar la noche sobre el mapa con una línea de tiempo (reproducir, pausar, arrastrar, 5×/30×/120×) y las últimas líneas del registro de cada instante; el panel de objetivos sigue el instante elegido. No graba fotos: anota cuándo cambia cada cosa y reconstruye el mapa con las mismas trayectorias del motor (`sim/replay.js`, docs/ARQUITECTURA.md). Una prueba compara el cuadro reconstruido con el estado real de la simulación. No cambia resultados.
- **Ficha de cada misil: alcance, tiempo de vuelo y energía.** Alcance efectivo de frente, de costado y contra un blanco que se aleja (la zona de no escape del modelo), y una tabla con el tiempo de vuelo, la velocidad al llegar y el factor de Pk al 25, 50, 75, 90 y 100% del alcance. Usa las mismas funciones que la simulación; no cambia resultados. La maniobra según la altura queda pendiente por falta de datos (ver ROADMAP).
- **Viento** sobre drones y misiles de crucero (`S.wind`, pestaña Defensa → Clima, `rules.wind` en los archivos). Vuelan a su velocidad respecto del aire y el viento cambia la velocidad sobre el suelo en cada tramo de la ruta (triángulo de velocidades, docs/FISICA.md §5): con 10 m/s de frente, un Shahed tarda un 24% más y un Kalibr un 4%. No afecta a balísticos ni planeadoras. Por defecto calma: los escenarios, las golden y la calibración no cambian.
- **Integración no coherente de pulsos opcional**, Swerling lento 1/3 (`physics/pulse-integration.js`, `radar.integrationPulses`, entero 1–128). Conserva el alcance publicado como Pd=50%: no suma otra ganancia de alcance a un dato que ya incluye procesamiento. Verificada contra 96 casos de SciPy y un experimento de señal/ruido I/Q con semilla. **No cambia los escenarios actuales ni sus golden**: ningún radar recibe un número de pulsos sin fuente; ausencia del campo mantiene exactamente la aproximación anterior. Quedan pendientes los datos por radar, Swerling 2/4 y clutter de mar/lluvia. Derivación, fuentes y límites en `docs/investigacion/integracion-pulsos.md`.
- **Ejemplo interactivo de integración de pulsos en la Academia**: compara Swerling 1/3 y cantidades hipotéticas de pulsos al mismo alcance publicado. No modifica unidades ni escenarios. Verificado en Chromium tanto en los módulos de desarrollo como en el archivo autocontenido.
- **Escape cierra las ventanas también con el foco en un campo o selector**. Antes el filtro de atajos de edición interceptaba Escape antes de cerrar la ventana; espacio sigue sin iniciar la simulación detrás de una ventana.
- **Lectura completa de las fuentes de guerra electrónica ucraniana** (sección H de `docs/investigacion/guerra-electronica-ucraniana.md`). Corrige fechas: las CRPA chinas de 16 elementos se ven en Shahed desde mar-2025 y las UMPK llevan 12 desde abr-2025; "Kometa-M" existe desde 2022 (no desde dic-2025). Los "5–10 km" de desvío de Pokrova no aparecen en ninguna fuente: el valor de `spoofKm` queda como estimación. No cambia la simulación. Forbes sigue bloqueando el acceso.
- **Verificación cruzada de la investigación de guerra electrónica ucraniana** (sección G de `docs/investigacion/guerra-electronica-ucraniana.md`): sube la confianza de lo que confirman fuentes independientes (Kometa de 12/16 elementos, especificaciones del ALQ-131, existencia y uso de Lima). Corrige la fecha de los Kometa de 16 elementos (mediados de 2025, no dic-2025) y anota que el pod del F-16 ucraniano probablemente sea el ALQ-162. No cambia la simulación. Las páginas no se pudieron abrir completas: la red de la sesión las bloquea.

- **Componentes, inventario y logística experimentales** (`experimentos/catalogo-presupuesto/`): munición tipada por depósito/lanzador, cargas completas admitidas, dependencias y pérdidas localizadas; compras con entregas demoradas, tránsito/retorno temporizado y reparación con fondos/repuestos. Conserva recursos, daño y trabajos entre misiones y reconstruye por eventos; incluye briefing propio de preparación y demo de navegador. Ejemplos mecánicos ficticios, variantes investigadas aún deshabilitadas. No está integrado al combate ni constituye campaña jugable; no cambia resultados.

### Cambiado
- **[sim] Clutter físico de suelo, mar y lluvia** (`physics/clutter.js`, `data/clutter.js`, docs/FISICA.md §2). Reemplaza la pérdida fija por debajo de 300 m (`CLUTTER_DB`) por el cociente blanco/clutter de la celda de resolución: suelo con σ°F⁴ de Billingsley (−30 dB ± relieve), mar con el modelo NRL 2012 según banda, ángulo rasante y estado del mar (nuevo `WEATHER[].sea`), lluvia con η de Barton (Rayleigh + Marshall–Palmer), ganancia del haz hacia la superficie, línea de vista al suelo y factor de mejora por clase (MTI: cancelador doble según la dispersión del clutter, techo 35 dB; pulso-Doppler 55 dB). Parámetros por clase con rango y fuentes en `UNC.clu` (Radar Handbook cap. 15, NRL MR 5310-12-9346, Billingsley); sin datos por radar todavía (handoff de datos a Codex). La visibilidad del suelo apunta a árboles y edificios, justo por encima del margen de la línea de vista (`LOS_MARGIN`); una prueba fija ese criterio, porque apuntar a 2 m del suelo lo tapaba casi siempre. Calibración: los 9 casos con objetivo siguen dentro. Monte Carlo (40 noches, antes → después): mb_noche 70→65%, gb_ruso (ataque) 35→40%, gb_refineria 65→65%, mb_puente (ataque) 45→28%, kv_energia 95→90%, kh_umpk 70→70%, od_puertos 40→48%. El único cambio mayor que el ruido (±15 puntos) es mb_puente: contra blancos rasantes sobre el mar, un pulso-Doppler ya no pierde los ≈2 dB fijos del modelo anterior, porque el eco de mar que sobrevive a su filtro es mucho menor que la señal. No se tocó ninguna fuerza para recuperar resultados.

- **ROADMAP ordenado por lo que espera cada ítem.** Sale lo hecho (tipografías y pruebas de navegador, que estaban como pendientes). El clutter de mar y de lluvia queda *esperando datos*: la investigación de Codex no encontró mejora sub-clutter por radar ni reflectividad verificada, y no se inventan. El MTI del S-125 queda como contradicción anotada hasta tener una segunda fuente. Lo próximo es la etapa 1 del plan de Codex: perspectivas por bando.
- **[sim]** **Pk del S-300 contra supersónicos: 0,4 → 0,1**, con rango 0,03–0,2 en `UNC`. El 0,4 no tenía rango ni caso de calibración, y en Odesa el S-300 derribaba la mitad de los Kh-22. Caso nuevo `kh22_s300` (6 Kh-22 contra S-300PS + radar 3D, sin Patriot; real: 3 de más de 400 Kh-22 derribados antes de feb-2026, objetivo 0–10%): con 0,4 daba 18%, con 0,1 da 5%. Ningún otro escenario usa S-300: las golden no cambian.
- **[sim]** **Kiev vuelve a 7 Kh-101** (se revierte el aumento a 9). Se prioriza el realismo: el escenario de referencia no se ajusta para recuperar la tasa anterior. Con la física nueva (perfil del interceptor) la defensa gana 95% de las noches (40 noches, valores probables; parcial 5%, fracaso 0%), contra 78% antes del perfil. Con 9 Kh-101 volvía a 78%; si se quiere una versión más difícil, va como escenario aparte. CONTRIBUIR cambia la regla de "balancear" por la de medir y documentar: un escenario de referencia puede ser asimétrico.
- La Academia (Mando y control) decía que no se modelaban los enlaces por sistema; ahora explica las familias de enlace que ya existen y qué falta (pasarelas, pertenencia a la red por unidad). Lo señaló Codex.
- El MANPADS conserva el modelo legado de velocidad constante **por falta de datos**: no valida que Stinger, Igla y RBS 70 sean equivalentes (docs/FISICA.md §6 y nota en `UNC`).

### Corregido
- `solveTd` devolvía un frenado de 0,001 s, sin solución real, cuando el misil ya pasaba el alcance acelerando (`R ≤ vmax·tb/2`); ahora vuela sin frenar, como en los otros casos sin solución, y se verifica que la bisección encierre la solución. No pasa con los valores probables del catálogo (las golden no cambian por esto). Lo encontró la revisión de Codex (`experimentos/catalogo-presupuesto/docs/NOTA-INTERCEPTOR.md`).

### Cambiado
- **[sim]** **Perfil de velocidad del interceptor** (paso B de la energía, `src/physics/interceptor.js`, docs/FISICA.md §6–§7). El misil acelera parejo hasta su velocidad máxima (`sam.vmax`) en `sam.tb` segundos y después planea frenado por el arrastre; el frenado se ajusta para que el tiempo de vuelo al alcance máximo siga siendo `maxR / vInt`. La solución de tiro usa ese tiempo de vuelo (los tiros cortos llegan antes) y la Pk depende de la velocidad que le queda al misil (`(v/vmax)²`, relativa al tiro típico al 90% del alcance): en el borde pierde menos que antes (×0,85–0,93 en vez de ×0,71). El mapa dibuja el interceptor con el mismo perfil. Datos nuevos con rango en `UNC` para 11 misiles (Patriot PAC-3 y PAC-2, Aster 30, IRIS-T SL, NASAMS, S-300, Buk, Pantsir, Tor, S-125, S-400); verificados contra la fuente los del Pantsir, AIM-120, PAC-2 GEM+ y Buk (motor de unos 15 s), el resto estimados. Hawk, S-200, MANPADS, cañones y drones interceptores siguen a velocidad constante con la energía por tramos (el MANPADS tira a menos de 1–2 km, donde todo depende de un tiempo de aceleración sin dato público). Calibración: los 8 casos siguen dentro (Iskander-M contra Patriot 43% → 53%, Kalibr contra S-300 + Buk 77% → 74%, el resto casi igual; control del Oniks 67% → 57%). Escenarios (40 noches, valores probables): Monterey noche 65% → 70% (defensa), Gotemburgo base 38% → 35% (ataque), refinería 68% → 65% (defensa), puente 43% → 45% (ataque), Járkov 48% → 70% (defensa). Kiev: 78% → 95% (con el escenario original de 7 Kh-101; ver abajo).
- **[sim]** Pk contra crucero del S-300 y del Buk: 0,6 → 0,5. El caso de calibración Kalibr contra S-300 + Buk había subido de 73% a 88% con la energía del interceptor (#26), que premia los tiros cortos contra crucero rasante, porque las Pk se habían calibrado sin ese bonus. Ahora da 77% (objetivo 60–85%). Los escenarios no cambian de balance (puente 43%, Gotemburgo base 38%).
- El caso de calibración del Iskander-M con señuelos se corre contra una batería de 3 lanzadores (36 PAC-3 MSE): 43% (objetivo 35–65%). Con los 16 misiles del catálogo, que siguen representando la escasez en los escenarios, la batería se vacía con los señuelos. **Los 8 casos de calibración quedan dentro de su objetivo.**

### Agregado
- El radar del Patriot (MPQ-65) **discrimina señuelos más rápido** que un radar genérico de banda C (`radar.discrim` = ×4, rango 1–8 en `UNC`, estimado). Pesa con la doctrina "no tirarle a pistas clasificadas como señuelo": los escenarios con sus reglas de inicio no cambian.
- **Arnés de calibración reproducible** (`npm run calibrar`): los casos de la tabla de calibración de Pk tienen ahora su geometría guardada (`src/data/calibration-cases.js`) y `npm run calibrar -- --write` regenera `CAL`. Son reconstrucciones: la geometría original no se había guardado. 7 de 9 casos caen dentro de su objetivo; Iskander-M con señuelos contra Patriot (21%) y Kalibr contra S-300 (88%) quedan fuera y están en el ROADMAP. La ventana "Calibración de Pk" y el catálogo muestran los valores nuevos.
- `remotePk` de la C2 coordinada tiene rango en `UNC` (0,9 – **0,97** – 1,0, confianza baja): el Monte Carlo con sorteo ahora lo varía. El valor probable no cambia.
- **Origen de los relieves de Monterey y Gotemburgo**, reconstruido con `node scripts/verificar-relieves.mjs` (docs/DATOS-Y-FUENTES.md §6). Gotemburgo es el tile SRTM N57E011 promediado a 200 m (sin batimetría: la documentación decía lo contrario). Monterey coincide con las Terrain Tiles de Mapzen/AWS con batimetría (correlación 0,999), pero no celda por celda.

### Cambiado
- **[sim]** **Confirmación de pistas "2 de 3"** en lugar del corte de la detección a 1,2·R. Un eco suelto ya no abre una pista: el radar necesita ver el blanco en 2 de sus últimos 3 barridos; una pista abierta se mantiene con un eco por barrido (ópticos y acústicos siguen con un contacto). La detección lejana pasa a ser gradual (un blanco lento que pasa muchos barridos a 1,2–1,5 veces el alcance puede terminar detectado) y queda solo un corte de rendimiento a 2,5·R. Ver docs/FISICA.md §2 y `docs/investigacion/valores-estimados.md`.
- **[sim]** **Recalibración de los seis escenarios** (40 noches, `npm run mc`, valores probables) con todo lo de esta versión junto: C2 y datalink separados, ECM según el bando, doctrina de alcance con costo y confirmación 2 de 3. Puente de Monterey: Storm Shadow 11 → 10 (el ataque gana ≈43%). Refinería de Hisingen: Kalibr 6 → 4 (la defensa gana ≈68%; con 6 había caído a ≈3%, porque los RBS 70 ya no disparan con la pista de la red contra misiles rasantes que el tirador todavía no ve detrás del relieve). Monterey noche: Kh-101 4 → 8, que llegan cada 8 s (la defensa gana ≈65%; antes 100%). Gotemburgo base con S-400: Storm Shadow 6 → 16 (el ataque gana ≈38%; antes 0%). Kiev (≈78%) y Járkov (≈48%) sin cambios de escenario.
- La prueba "el S-125 enfrenta misiles de crucero" suma tres noches en vez de una: contra un Kalibr a 50 m el S-125 (sin filtro de blancos móviles y con 25 s de reacción) queda al límite y en una de las tres noches no llega.

### Corregido
- **[sim]** Un interceptor guiado por el radar de su batería (TVM, SARH o por mando) pierde la guía si la batería es destruida durante el vuelo; antes podía derribar igual. Los activos, IR y drones interceptores siguen solos. Las golden de los escenarios no cambian.
- **[sim]** Confirmación 2 de 3: los barridos en que el blanco no llegó a sortearse (fuera del sector o más allá del corte) cuentan como "no visto". Antes dos ecos separados por minutos podían abrir una pista.
- `render/draw.js` importaba de `ui/` y rompía la regla de capas. Prueba nueva (`tests/layers.test.js`) que revisa los imports de todo `src/`.
- **[sim]** La partida usa pasos fijos de 0,25 s y conserva las fracciones entre cuadros: cambiar la velocidad o los FPS ya no cambia la secuencia de detecciones y disparos. Las golden y el Monte Carlo mantienen sus resultados.
- Monte Carlo espera al último ataque y al fin de los interceptores, incluso en escenarios de más de 10.000 s. Una corrida que no termina se informa como error, sin contabilizarla como victoria.
- La barra espaciadora y el control de iniciar/pausar no avanzan la partida mientras corre Monte Carlo. Los atajos de edición tampoco actúan detrás de ventanas abiertas.
- Los campos de munición, reserva, salvas y vida de objetivos mantienen el último número válido al ingresar valores vacíos, fraccionarios o fuera de rango. La semilla de Monte Carlo también se valida antes de empezar.
- Pruebas de regresión de tiempo fijo, ataques tardíos y bloqueo de series, más `tests/ui.browser.mjs` para validar entradas y controles en Chromium.

### Agregado
- **[sim]** La doctrina de alcance ahora retiene el lanzamiento hasta que el blanco entra en el porcentaje elegido. Esperar reduce la ventana de tiro y puede dejar pasar la solución; `fireRange = 1` mantiene el comportamiento anterior.

### Agregado
- **[sim]** Segunda parte de ECM/ECCM: los jammers de radar y anti-GNSS respetan el bando (`side`) del equipo afectado. Un interferidor ruso no degrada sus propios radares ni sus propias armas; el fratricidio parcial queda documentado como pendiente por falta de datos.

### Agregado
- **[sim]** C2 y datalink quedan separados: el C2 puede repartir alertas y blancos aunque una unidad tenga apagado su enlace, pero una pista de tiro remota solo cruza entre familias compatibles (`l16`, `ua_c2`, `ru_c2`). NASAMS, Patriot e IRIS-T comparten la abstracción Link 16; S-300 no recibe esa pista. Se actualizan las golden y se agrega la auditoría reproducible en `docs/investigacion/c2-datalink.md`.
- Línea de base reproducible de los seis escenarios (`npm run baseline`), con 40 semillas por modo y resultados individuales en `docs/mediciones/baseline.json`.

### Agregado
- **`npm run mc`**: Monte Carlo de escenarios en Node (40 noches con los valores probables por defecto; `SAMPLE=1` para sortear parámetros, `N=` para otra cantidad). Es la vara de todas las cifras de balance.
- **Revisión de tres valores estimados** (`docs/investigacion/valores-estimados.md`): `remotePk` 0,97, recarga del NASAMS de 30 min y corte de la detección a 1,2·R, con su sensibilidad medida en Kiev. La recarga del NASAMS tiene un efecto umbral (con 15 min Kiev pasa de 68% a 98%) y el corte pesa mucho (con 1,5·R, 88%).

### Agregado
- **[sim]** **ECM y ECCM contra radares, primera parte** (docs/FISICA.md §4):
  - **Ruido de barrera o puntual** (panel de selección del jammer): la barrera reparte la potencia en toda la banda; el puntual la concentra en **un** radar elegido (×10), salvo que ese radar tenga **agilidad de frecuencia** (×0,1). Por defecto, barrera, como antes.
  - **ECCM por radar** en lugar de un solo número: agilidad de frecuencia, **lóbulos laterales bajos** y **canceladores de lóbulos laterales** (anulan los N jammers más fuertes que entran de costado, nunca el del lóbulo principal). Patriot y S-300 con fuentes; el resto, estimaciones documentadas. El `eccm` en dB queda para lo demás (procesamiento).
  - **Distancia de quemado** en la ficha de cada jammer: alcance de cada radar con el jammer de frente o de costado, en barrera o puntual.
  - Academia (ECCM) y pruebas nuevas (tests/ecm.test.js). Efecto medido (40 noches): Monterey noche sin cambios (100%); en la refinería, con el avión de interferencia, la defensa gana ≈40% (antes ≈33%, dentro del ruido estadístico).

### Cambiado
- **[sim]** **Swerling 3 para los balísticos** (Iskander-M, Kinzhal, ATACMS y Tsirkon): su RCS tiene un reflector dominante y "titila" menos que la de un dron o un misil de crucero (Swerling 1). Con la misma SNR media se detectan más seguido de cerca (83% por barrido al 80% del alcance, contra 75%) y menos de lejos (18% a 1,2 veces, contra 26%). El alcance del catálogo sigue siendo el de 50%. Las dos fórmulas están **verificadas** contra una integración numérica independiente (tests/swerling.test.js). La ficha de cada arma muestra su modelo. Efecto medido (40 noches): Kiev 68% y refinería 33% sin cambios; puente de Monterey, el ataque gana ≈53% (antes ≈45%, dentro del ruido estadístico).

### Agregado
- **Mapa de Járkov** sobre el relieve real (SRTM), generado con `scripts/gen-terrain.mjs`. El centro de la ciudad está en el borde norte del tile N49E036, así que el script ahora arma una ventana de 1° con dos tiles (49,5–50,5° N): entra la ciudad entera y la franja de frontera al norte. Kiev se regenera idéntico.
- **[sim]** **Escenario "Járkov · bombas planeadoras"** (jugás la defensa): 30 bombas FAB-500 con UMPK en tres oleadas, soltadas desde Rusia a ≈60 km, con antenas CRPA Kometa de 12 elementos (las dos estaciones Lima de la ciudad no les alcanzan), más 12 Shahed contra el centro. Blancos: la central CHP-5 de Podvirky y el centro de la ciudad. Con la disposición inicial la defensa gana ≈55% (Monte Carlo, 40 noches), gastando decenas de millones en misiles contra bombas de US$30 mil. Golden nueva `kh_umpk_s1`.

### Agregado
- **Antenas CRPA contra varias fuentes de interferencia GNSS** (pestaña Ataque → "Antena GNSS"; se guarda como `crpa` en cada salva): una CRPA de N elementos (4, 8, 12 o 16, como las Kometa rusas) anula hasta N − 1 interferidores que lleguen desde direcciones distintas; dos estaciones casi alineadas vistas desde el arma cuentan como una. Con más fuentes, el arma pierde el GNSS como antes. Por defecto las salvas van sin CRPA: los escenarios y las golden no cambian. Probalo en Kiev: con una CRPA de 4 los Shahed ignoran la única estación Pokrova.

### Agregado
- **[sim]** **Daño funcional de las unidades:** una explosión cerca de una batería la daña sin destruirla. Al perder el 20% de la vida pierde un componente y al 50% el otro: con el **radar dañado** ve un 30% menos y reacciona 1,5 veces más lento; con el **lanzador dañado** no dispara aunque le queden misiles. En el mapa aparece con un anillo naranja; el panel de selección dice qué perdió y el debrief la nombra. No cambia los escenarios incluidos (40 noches de la base de Gotemburgo y del puente de Monterey dan exactamente lo mismo, y las golden solo suman el contador nuevo `unitsDamaged` en 0): sus baterías están lejos de donde caen las armas. Se nota al ubicar defensas pegadas a un objetivo o con armas apuntadas a una unidad que caen cerca sin pegarle.

### Agregado
- **[sim]** **Energía del interceptor** (docs/FISICA.md §6–§7):
  - **Alcance según el aspecto:** un misil llega más lejos contra un blanco que viene de frente que contra uno que se aleja. Alcance efectivo = alcance máximo × (0,8 + 0,2·coseno del aspecto): ×1 de frente, ×0,8 de costado, ×0,6 de cola.
  - **Pk según la energía:** un misil que llega al borde de su alcance llega "cansado". La Pk se multiplica por un factor *relativo* al tiro típico (al 90% del alcance, con el que están calibradas las Pk del catálogo): hasta ×1,25 en un tiro corto, ×0,71 en el borde. No se aplica a cañones ni a drones interceptores.
  - **Doctrina "Disparar dentro del X% del alcance"** (pestaña Defensa, 50–100%, por defecto 100%; se guarda como `rules.fireRange`): esperar a que el blanco se acerque sube la Pk.
  - Concepto nuevo en la Academia: "Energía del interceptor".

### Cambiado
- **[sim]** Rebalanceo con Monte Carlo (40 noches, valores probables, como las mediciones anteriores). Con la energía, el IRIS-T les tiraba a los Shahed en el borde de su alcance, vaciaba el cargador y después pasaban los Kh-101: **Kiev bajaba de ≈70% a ≈38%**; la refinería de ≈35% a ≈25% y el puente (ataque) de ≈40% a ≈30%. Ajustes: Kiev, segunda oleada de Shahed 10 → 6 (vuelve a ≈68%); refinería, Geran-3 6 → 4 (≈33%); puente, Storm Shadow 10 → 11 (el ataque gana ≈45%).
- La doctrina de alcance pesa mucho: en Kiev, tirar dentro del 90% o del 80% del alcance da 40 de 40 noches defendidas. Los briefings lo sugieren.
- La prueba de nubes usa Shahed a 1.000 m: a 1.500 m quedan fuera del alcance efectivo de un grupo móvil.

### Corregido
- Los briefings de Kiev, la refinería y Monterey decían "No hay recarga", pero desde la recarga de munición las baterías tienen reserva. El debrief tampoco dice más "Sin recarga".

### Agregado
- **[sim]** **Recarga de munición:** cada batería tiene una reserva (editable en el panel de selección) y recarga en un tiempo propio cuando se vacía (Patriot ≈40 min, NASAMS ≈30 min, IRIS-T ≈20 min, grupos móviles ≈2 min; estimaciones con rango). Si el mapa tiene depósitos de munición, hace falta uno en pie a menos de 30 km: destruirlo corta la recarga. El debrief cuenta las recargas. Los escenarios casi no cambian (Kiev ≈70%, refinería ≈35%, puente ≈40%): las recargas largas no entran en una noche de 25 minutos de misiles.

### Agregado
- **Discriminación de señuelos:** los radares de tiro (S, C, X, Ku) aprenden a distinguir un señuelo de un arma con el tiempo de seguimiento (más rápido en las bandas altas; los señuelos del Iskander cuestan 4 veces más que un Gerbera; ≈3% de error con armas reales). Nueva opción en la pestaña Defensa: **"no tirarle a pistas clasificadas como señuelo"**. El debrief cuenta los señuelos reconocidos y las armas mal clasificadas. Sin la opción, los resultados no cambian.

### Cambiado
- **[sim]** **Detección por relación señal/ruido.** Cada barrido sortea la detección con la fórmula de Swerling 1, y el alcance del catálogo pasa a ser el de 50% por barrido: 75% al 80% del alcance, 96% a la mitad, 26% a 1,2 veces (ahí se corta: los ecos sueltos no confirman una pista). Además:
  - **Clutter:** un blanco a menos de 300 m pierde señal por el eco del suelo, mucho en un radar sin filtro (S-125), poco en uno pulso-Doppler (Patriot, IRIS-T…), y más en terreno quebrado.
  - **Notch Doppler:** un radar Doppler no ve en ese barrido a un blanco que le pasa de costado.
  
  Cada radar tiene ahora su tipo de procesamiento (`radar.mti`). Efecto medido con Monte Carlo: los rasantes se detectan algo más tarde (Kh-101 ≈10%) y los balísticos 20–30% antes. El puente de Monterey pasa de 9 a 10 Storm Shadow para seguir parejo (≈40%); Kiev queda en ≈70% y la refinería en ≈35%.

### Agregado
- **Bomba planeadora FAB-500 con UMPK** (Rusia): perfil de vuelo nuevo `glide`. Se suelta fuera del mapa a ≈10 km de altura y 40–100 km del blanco, y baja planeando a ≈250 m/s. Es barata (≈US$30 mil), casi no tiene firma infrarroja (×0,3 de Pk para buscadores IR) y su RCS sale de la base de CMO y de la forma.
- **Tres defensas que usa Ucrania**, con datos del DB3K de CMO y de fuentes abiertas:
  - **MIM-23B I-Hawk (Fase III):** 40 km, dos canales, piso de 60 m. Una unidad reclamó 14 misiles de crucero y 40 Shahed.
  - **S-125 Pechora / Newa-SC modernizado:** 25 km, un solo canal, muy bueno a baja altura.
  - **S-200V Vega:** 250 km, piso de 300 m, un canal y reacción lenta. Pensado contra aviones grandes (A-50, Tu-22M3), que el juego todavía no tiene.

### Agregado
- **Mando y control, segunda parte:**
  - **Enlace de datos por unidad** (casilla en el panel de selección): sin enlace, la unidad no comparte lo que ve ni recibe pistas ni alertas.
  - **Mejor tirador y defensa por capas** en el nivel integrado: cada blanco va a la batería más conveniente, y los drones se le dejan a una capa más barata que los espera más adelante (en una prueba, NASAMS + Gepard pasan de gastar US$6,4 M a US$0,13 M con los mismos derribos).
  - **Puesto de mando y comunicaciones como nodos de C2:** si el atacante destruye un objetivo "Puesto de mando", la defensa queda desconectada; cada "Sitio de comunicaciones" destruido la baja un nivel.
  - **Enlace de datos del atacante** (Shahed, Geran-3, Gerbera con módem 4G/mesh o Starlink, casilla en la pestaña Ataque): descartan el engaño GNSS, salvo dentro del radio de un Bukovel-AD, que corta enlaces.

### Cambiado
- **[sim]** **Error de posición de la pista de red:** en el nivel coordinado, un disparo hecho sin pista propia tiene Pk ×0,97. Los escenarios son sensibles a esto (Kiev bajaba de ≈78% a ≈58%): Kiev pasa de 8 a 7 Kh-101 y vuelve a ≈75%; la refinería de Gotemburgo queda en ≈37%.

### Agregado
- **Clima** (pestaña Defensa → "Clima"), fijo durante todo el escenario: despejado, nublado con techo bajo, lluvia moderada, tormenta o niebla. La lluvia atenúa los radares según su banda con la fórmula oficial ITU-R P.838-3 (S y L casi no la notan; X y Ku pierden alcance, sobre todo en tormenta). Los sensores ópticos e infrarrojos (grupos móviles, MANPADS) pierden alcance con lluvia o niebla y no ven nada por encima del techo de nubes; la red acústica oye menos con lluvia. La cobertura del mapa refleja el clima. Se guarda en los archivos de escenario (`rules.weather`). Concepto nuevo en la Academia. Los escenarios incluidos siguen despejados: las golden no cambian.

### Corregido
- **[sim]** En el nivel de C2 **integrada**: los cañones (Gepard, grupos móviles) ya no disparan con la pista de otro sensor (siempre apuntan con el suyo), y un sistema guiado por radar solo lanza con pista ajena si su propio radar cubre el punto de encuentro (sector y alcance), como dice la descripción del nivel. Los escenarios incluidos usan "coordinada": no cambian.
- En celulares y tablets, el arreglo de los botones durante la partida podía dejar congelada la tarjeta de selección o las estadísticas después de tocar un botón. Ahora se detecta el botón *apretado* en lugar de "el puntero encima".
- **[sim]** El techo de cada arma (`sam.altMax`) se comparaba contra la altura del blanco **sobre el nivel del mar** en lugar de la altura **sobre el lanzador**: en mapas altos (Kiev está a 100–200 m) los grupos móviles no tiraban a un Shahed a 1.500 m sobre el terreno aunque lo tuvieran al alcance. Cambia el escenario del puente de Monterey (el ataque gana ≈6 de cada 10 en vez de 5).
- Durante una partida, los botones **Ficha**, **Briefing** y **Ver debrief** a veces no respondían: los paneles se redibujan varias veces por segundo y el botón se reemplazaba entre que se apretaba y se soltaba. Ahora el panel no se redibuja mientras el puntero está sobre uno de sus botones.

### Corregido
- **[sim]** **El engaño GNSS (Pokrova, Lima) era demasiado fuerte contra los misiles de crucero.** Ahora el Kh-101, el Kalibr y el Storm Shadow descartan la posición falsa gracias a su corrección por terreno (quedan con el error del inercial, cientos de metros en vez de kilómetros), y las armas con buscador terminal (Kh-101, Kalibr, Iskander, Kinzhal, Storm Shadow, Neptune, Liutyi) corrigen al final si el error cabe en su ventana (90% de las veces). Los Shahed y Gerbera siguen siendo desviados como antes. Mensajes nuevos en el registro y concepto actualizado en la Academia.

### Cambiado
- **[sim]** El escenario de Kiev vuelve a tener la red **Pokrova** sobre la ciudad: con el modelo corregido la defensa gana ≈3 de cada 4 noches (sin ella, ≈6 de cada 10).

### Cambiado
- **[sim]** **RCS con la base moderna de CMO (DB3K):** para 13 armas, la RCS de frente, costado, cola y en bandas bajas es ahora la media geométrica entre la estimación por forma/OSINT y el valor de CMO para esa arma (antes el costado y la cola usaban una regla general). Lo más fuerte: **Kh-101** frente 0,03 → 0,0017 m² y **Storm Shadow** 0,05 → 0,0014 m² (se detectan a la mitad de distancia); Shahed y Geran-3 en VHF 0,12 → 0,064 m²; Geran-3 frente 0,03 → 0,023; Iskander-M y Kinzhal 0,1 → 0,14; Kalibr 0,1 → 0,072; Kh-22 1 → 0,73.
- **[sim]** Rebalanceo con Monte Carlo (40 noches por escenario) para que sigan siendo desafiantes: Kiev 10 → 8 Kh-101 (la defensa gana ≈6 de cada 10), refinería de Gotemburgo 3 → 2 Kh-101 (≈5 de cada 10), puente de Monterey 12 → 9 Storm Shadow (el ataque gana ≈5 de cada 10).

### Agregado
- **Altura de aproximación con límites reales** (pestaña Ataque): al elegir un arma, la altura arranca en la típica; el deslizador solo deja elegir dentro de lo que el arma vuela de verdad, con botones de perfiles conocidos (Shahed bajo 2022–23 / alto desde 2025; Kh-101 e Iskander-K rasante o crucero a ≈6 km; Kalibr y Neptune sobre el mar o sobre tierra) y la fuente de cada dato. Cambian algunos límites: Kh-101 30–300 → 30–6.000 m, Iskander-K 20–1.000 → 6–6.000 m, Neptune 5–300 → 3–300 m.
- **Altura de antena real de cada radar** (panel de selección): los radares montados sobre vehículo o remolque (Patriot, SAMP/T, NASAMS, Buk, Tor, Pantsir, Gepard, P-18) tienen la antena fija y ya no se puede subir; IRIS-T regula 4–12 m (mástil del TRML-4D); S-300, S-400 y el 36D6 van de su vehículo hasta ≈39 m con la torre 40V6MD. Cada uno explica de dónde sale. El "mástil de 30 m" del Patriot era el de comunicaciones, no el del radar.
- Los archivos guardados con un mástil o una altura fuera de esos límites se cargan acomodados al borde, con un aviso. El catálogo (docs/CATALOGO.md) lista los límites de cada arma y radar.

### Cambiado
- **[sim]** RCS de costado y de cola de los misiles ajustadas con la base de datos de CMO: en sus 452 armas guiadas el costado es el frente +3 dB (el doble) y la cola igual al frente. Para las armas sin dato OSINT directo, el probable pasa a ser la media geométrica entre la estimación por forma y esa regla (por ejemplo Kalibr: costado 1 → 0,45 m²; ATACMS: 3 → 0,77 m²) y el rango cubre las dos. Shahed, Geran-3 y Gerbera no cambian.

### Agregado
- **Niveles de integración de la defensa aérea** (pestaña Defensa → "Integración de la defensa"), en lugar del interruptor "red integrada": *desconectada*, *descoordinada* (solo alertas con ~45 s de demora que adelantan la reacción), *coordinada* (imagen común, el comportamiento de siempre) e *integrada* (pista de calidad de tiro: también los sistemas guiados por radar pueden lanzar con la pista de otro sensor). Los escenarios y los archivos guardados con `net: true|false` se leen como coordinada o desconectada. Concepto nuevo en la Academia. **[sim]** solo si se eligen los niveles nuevos: las golden no cambian.
- **Mapa de Kiev** sobre el relieve real (SRTM N50E030, celdas de 200 m) con el Dniéper, el embalse de Kiev y el Desná, generado por `scripts/gen-terrain.mjs` (reproducible).
- **Escenario "Kiev · noche contra la energía"** (jugás la defensa): Shahed, Gerbera, Kh-101, Kalibr, Iskander-M y Kinzhal contra las centrales CHP-5 y CHP-6 y la represa de Kiev. Con la disposición inicial la defensa gana ≈3 de cada 4 noches. Y "Kiev · vacío" para armar a mano.
- **Ríos y lagos en el mapa**: máscara de agua detectada en el SRTM, solo para el dibujo y la lectura del terreno ("Río o lago"); la física no cambia.

### Cambiado
- Las tintas del relieve arrancan en la tierra más baja del mapa en lugar de 0 m: los mapas sin mar (Kiev, relieves .hgt del interior) ya no salen de un solo color. Monterey y Gotemburgo no cambian.

### Agregado
- **RCS según el aspecto** **[sim]**: cada amenaza tiene RCS de frente, de costado y de cola (bandas X/S), y cada radar la ve según el ángulo desde el que mira el arma, interpolando en decibeles. En VHF y L el contraste es la mitad (resonancia). Datos de OSINT y de la base de CMO; donde difieren, el probable es la media geométrica y el rango cubre a las dos. Cambios de datos: Shahed frente 0,05 → 0,02 m², costado 1 → 0,14 m², VHF 0,3 → 0,12 m²; Geran-3 frente 0,05 → 0,03 m² y VHF 0,3 → 0,12 m²; costado y cola nuevos para todas las armas. Las fichas suman la RCS de costado y una columna "De costado"; la Academia, una calculadora por ángulo.

### Corregido
- **[sim]** El motor descartaba antes de tiempo los blancos a más de 1,2 veces el alcance del radar contra 1 m², aunque su RCS los hiciera visibles más lejos (por ejemplo, el Kh-22 en VHF). Ahora el descarte usa el alcance sin interferencia, que es una cota exacta.
- Investigación de física: decisiones tomadas (dos ejes de C2 —nivel del bando y enlace de datos por unidad— y clima fijo), anexo sobre de dónde sacar la RCS por aspecto y por rango de frecuencia (comparando el catálogo, el modelado de Járkov y la base de CMO) y anexo sobre qué sistemas tienen enlace de datos comprobable.
- Investigación `docs/investigacion/mejoras-fisica.md` (sin implementar): RCS según el aspecto (prioridad), Swerling, clutter y Doppler, integración de la defensa aérea (niveles de C2 y enlaces de datos), estados de clima, discriminación de señuelos, recarga y energía del interceptor. Para cada una: qué cambia, dificultad, datos necesarios, cómo probarla y cómo la resuelven *Command: Modern Operations* y *Fleet Command* (mod NWP).
- **Escenario "Gotemburgo · defensa de la refinería de Hisingen"** (jugás la defensa): oleada de Shahed, Gerbera, Geran-3, Kalibr, Kh-101 y Kinzhal contra la refinería, la terminal de Skarvik y el puerto. Con la disposición inicial la refinería sobrevive ≈40% de las veces (Monte Carlo, 40 corridas).
- **Escenario "Monterey · ataque al puente de Moss Landing"** (jugás el ataque), inspirado en los ataques a los puentes de Chonhar y Crimea: Storm Shadow, Flamingo, ATACMS, Neptune y 30 Liutyi para gastar la munición de S-400, Pantsir, Tor y Buk. El puente cae ≈40% de las veces; el briefing propone sumar un supresor GNSS para ver su efecto.
- Prueba de catálogo de escenarios: posiciones dentro del mapa, blancos y metas que existan y briefing completo en los escenarios jugables. Dos casos golden nuevos (las seis anteriores no cambian).
- **Modo Monte Carlo** (botón *Monte Carlo* sobre el mapa y en el debrief): corre la misma situación 10 a 100 veces con semillas distintas y, si se pide, sorteando cada parámetro del catálogo dentro de su rango (`applySample`). El debrief Monte Carlo muestra la probabilidad de éxito, de que cada objetivo sobreviva o siga operativo, de cumplir cada meta y de perder cada unidad (con intervalo de confianza del 95%), percentiles de interceptación, impactos, daño y costos, y un histograma. Corre en tramos para no congelar la página y se puede cancelar. No cambia la simulación: las golden siguen iguales.
- **Guardar y cargar escenarios** en JSON (botones *Guardar* y *Cargar* de la barra superior): objetivos, defensas con sus ajustes, salvas, jammers, reglas, briefing y metas. Al cargar se valida el formato, el mapa, que las armas, defensas, jammers y objetivos existan en el catálogo, que las posiciones estén dentro del mapa y que los blancos de las salvas existan; si algo falla no se toca lo armado. Formato en `docs/ARQUITECTURA.md`.

## [0.3.0] - 2026-10-03

Del simulador a un **simulador táctico educativo**: objetivos concretos, daño, debrief, lectura del terreno y una Academia.

### Agregado
- **Objetivos con vida** (depósito, combustible, base aérea, radar, puesto de mando, munición, comunicaciones, infraestructura). Se dibujan en el mapa con barra de vida, se seleccionan, se ubican desde la pestaña Ataque y las rutas pueden apuntarles. **[sim]**
- **Modelo de daño** parametrizable por arma: depende de la ojiva del catálogo y de la distancia (impacto directo, cercano o sin efecto); estados operativo, dañado y destruido. **[sim]**
- **Debrief** al terminar: resultado según las metas del escenario, objetivos, ataque, daño, defensa, explicaciones de por qué pasó lo que pasó, línea de tiempo y tabla por arma.
- **Escenarios completos**: descripción, hora, fuerzas, condiciones, reglas especiales, objetivos, metas por bando y condiciones de éxito y fracaso. Briefing al elegirlos y tarjeta "Escenario" con la vida de cada objetivo en vivo.
- **Capas de relieve**: Normal, Puntos altos (▲ cota), Curvas de nivel y Sombreado. El tooltip muestra elevación, relieve relativo, pendiente y una lectura táctica del punto. No modifican el relieve físico.
- **Confirmación antes de colocar**: el click propone y Confirmar crea. Se distingue click corto de arrastre y de pellizco; la vista previa muestra el alcance y el horizonte de radar.
- **Academia**: 29 conceptos (RCS, bandas, ecuación del radar, horizonte, LOS, lóbulos, ECCM, GNSS, Pk, saturación, ventana práctica…), cada uno con cómo lo calcula el motor y calculadoras interactivas. Botones ⓘ en fichas y paneles.
- **Guerra electrónica ucraniana**: Pokrova, Lima y Bukovel-AD (anti-GNSS) y pod de autoprotección del F-16, con fuentes y rangos. El supresor ruso pasa a llamarse Pole-21. **[sim]** solo si se usan los nuevos.
- **Engaño GNSS** (spoofing) con desvío de kilómetros, y la categoría "perdidas localmente" en el debrief.
- **Velocidad Auto** (60×, 30×, 15× o 5× según la fase), texto con la escala de tiempo y barra de distancia con tiempos de vuelo.
- `docs/CATALOGO.md`, generado desde los datos, con cada parámetro, rango, confianza y fuentes.
- Documentación: FISICA, DATOS-Y-FUENTES, ARQUITECTURA, CONTRIBUIR, ROADMAP e investigación sobre la EW ucraniana.

### Cambiado
- Mapa sin pixelado: relieve a mayor resolución con interpolación bilineal y sombreado de Lambert; costa y curvas vectoriales; cobertura suavizada; respeta `devicePixelRatio`.
- `BANDS` es la única fuente de datos de bandas: las reglas de RCS por banda salen del código de `rcsAt()` y pasan a los datos, con resultados idénticos.
- Pestaña "Guerra E." → "EW"; panel izquierdo un poco más ancho para que entren las 5 pestañas.

## [0.2.0] - 2026-10-02

Reorganización para que el proyecto pueda crecer. **Sin cambios de comportamiento**: una corrida con la misma semilla da exactamente el mismo registro, estadísticas, cobertura, fichas y paneles que la versión original (verificado con 11 corridas en 4 escenarios).

### Cambiado
- El `index.html` monolítico (1,3 MB) se separó en módulos ES dentro de `src/`: datos, física, simulación, dibujo e interfaz.
- La simulación ya no toca el DOM: avisa a la interfaz con enganches y corre en Node.
- Escenarios declarativos y relieves en archivos separados.

### Agregado
- `npm run build` regenera el `index.html` autocontenido; `npm run dev` levanta un servidor con recarga automática.
- Pruebas automáticas: física, integridad del catálogo y regresión "golden".

## [0.1.0] - 2026-10-02

Versión original de Cielo Cerrado: simulador de defensa aérea en un único `index.html`, con catálogo OSINT (revisión de oct-2026), rangos de incertidumbre, calibración de Pk, dos relieves (Monterey y Gotemburgo), cobertura de radar, guerra electrónica e importación de tiles SRTM.

[Sin publicar]: https://github.com/altalasagnas/cielo-cerrado/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/altalasagnas/cielo-cerrado/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/altalasagnas/cielo-cerrado/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/altalasagnas/cielo-cerrado/releases/tag/v0.1.0
