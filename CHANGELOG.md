# Changelog

Todos los cambios relevantes del proyecto. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/): mientras la versión sea 0.x, cualquier versión menor puede cambiar resultados de la simulación.

Cuando un cambio **altera los resultados de la simulación** (física o datos), se indica con **[sim]**.

## [Sin publicar]

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
