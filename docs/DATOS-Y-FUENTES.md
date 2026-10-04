# Datos y fuentes: de dónde sale cada número

Cielo Cerrado es un juego con **aspiraciones de realismo** hecho con **datos públicos**. Este documento explica cómo se construyó el catálogo, qué tan confiable es cada tipo de dato y cómo agregar o corregir información. El detalle completo, arma por arma y parámetro por parámetro, está en **[CATALOGO.md](CATALOGO.md)**, que se genera automáticamente desde el código.

## 1. Principios

1. **Todo número relevante tiene un rango.** No hay un único valor "verdadero": cada parámetro tiene mínimo, probable y máximo, una confianza (alta, media o baja) y su razonamiento. La simulación usa el probable; el modo Monte Carlo puede sortear cada parámetro dentro de su rango (distribución triangular mín–probable–máx) para ver cuánto pesa lo que no sabemos.
2. **Se cita la fuente o se dice que es una estimación.** Si no hay un dato público, la nota empieza con **"est"** y explica el razonamiento (física, sistemas análogos, tamaño o forma).
3. **Se separan las afirmaciones de los hechos.** Las cifras de fabricantes, gobiernos o fuerzas armadas en guerra se marcan como tales y bajan la confianza.
4. **Calibrar contra la realidad, no contra la propaganda.** Las Pk no se copian de los folletos: se ajustan para que el motor reproduzca episodios reales observados (§4).

## 2. Dónde vive cada dato

| Archivo | Contenido |
|---|---|
| `src/data/threats.js` | Amenazas: descripción, perfil de vuelo, notas y fuentes generales |
| `src/data/defenses.js` | Defensas y sensores: radar, arma, Pk por clase |
| `src/data/jammers.js` | Guerra electrónica |
| `src/data/uncertainty.js` | **Rangos** de cada parámetro (`UNC`) con confianza, fuentes y razonamiento |
| `src/data/sources.js` | Todas las fuentes (`SRC`): clave → [título, URL] |
| `src/data/observed.js` | Tasas de intercepción reportadas en Ucrania (`OBS`) |
| `src/data/calibration.js` | Casos de calibración de Pk (`CAL`) |
| `src/data/bands.js` | Bandas: frecuencia, λ, ancho de haz y reglas de RCS |
| `src/data/targets.js` | Tipos de objetivo y parámetros de daño (de juego, sin fuente) |
| `src/data/scenarios.js` | Escenarios |
| `src/data/terrain/` | Relieves (grillas de 200 m) |

Los valores escritos en `threats.js`, `defenses.js` y `jammers.js` son solo de lectura cómoda: al cargar, `applyProbable()` los reemplaza por el valor *probable* de `UNC`. Una prueba verifica que sean coherentes.

## 3. Cómo se estimó cada tipo de dato

| Dato | Método | Confianza típica |
|---|---|---|
| Velocidad, alcance, ojiva, altura de vuelo | Fichas técnicas (CSIS Missile Threat, GUR, Wikipedia con fuentes) y análisis de restos (Defense Express, KNDISE) | Alta / media |
| Costo | Contratos rusos filtrados 2024–2027, presupuestos del DoD (P-1, P-40), estimaciones de prensa | Media |
| CEP | Valores de folleto contrastados con análisis independientes (el GUR da 20–30 m para el Iskander-M frente a los 5–7 m del folleto) | Baja / media |
| **RCS** | **Casi nunca hay mediciones públicas.** Se estima por analogía con la tabla de GlobalSecurity (Tomahawk 0,5 m², ALCM furtivo < 0,05, Harpoon/Exocet 0,1), por tamaño, forma, tomas de aire y materiales. La única medición técnica pública es el modelado del Shahed de la Universidad de la Fuerza Aérea de Járkov. Se guarda **frente, costado y cola**. Como segunda opinión se usa la base de datos de *Command: Modern Operations* (DB3000 515 para las armas modernas; estimaciones de juego, citadas valor por valor; no se copia la base): cuando OSINT y CMO difieren, el probable es la **media geométrica** y el rango cubre a las dos. Sin dato de CMO para el arma, se usa su regla general (en 452 armas guiadas de su base: costado = frente +3 dB, cola = frente) y el probable es la media geométrica con la estimación por forma (cuerpo cilíndrico visto de costado, toberas y hélices atrás) | Baja |
| RCS en VHF | Física de resonancia: con λ ≈ 1,5–2 m el conformado furtivo pierde efecto | Baja |
| Alcance de radar contra 1 m² | Alcances instrumentados y contra blancos grandes, escalados con σ^¼ | Baja / media |
| Pk | Calibradas (§4) | Media / baja |
| Potencia de jammers (`P`) | **Parámetro de juego**: las potencias reales no son públicas. Solo importan las proporciones (Krasukha 1e6 > Il-22PP 3e5 > pod de caza 3e4) | Baja |
| Objetivos y daño | Parámetros de juego elegidos por consistencia | — |

## 4. Calibración de la Pk

Las tasas de intercepción que publica Ucrania **no son una Pk**: son el resultado de todo el sistema. Una forma simple de leerlas:

```
tasa observada ≈ C × [1 − (1 − Pk·m)ⁿ]
```

`C` es la fracción de blancos que pasa por una zona defendida con munición y tiempo, `m` son los modificadores (maniobra, bengalas, furtividad, interferencia) y `n` los interceptores por blanco.

Por eso no se calibró contra el promedio nacional (0,55% contra el Kh-22 o 4,5% contra balísticos hasta 2024, dominados por C ≈ 0). Se calibró contra **episodios donde el blanco cayó dentro de la cobertura de un sistema capaz**, por ejemplo 9 de 12 Kh-22 sobre Kyiv con Patriot, o 2 de 2 Zircon con SAMP/T y Patriot. Esos casos se corrieron en el motor (Monte Carlo) y se ajustaron las Pk hasta que la tasa simulada cayera dentro del intervalo de confianza del 95% del dato real. La tabla completa está en CATALOGO.md y en el juego (Catálogo → Calibración de Pk).

**Arnés reproducible:** `npm run calibrar` corre los casos de `src/data/calibration-cases.js` (geometría guardada, mapa plano, semillas 1–40) y muestra la tasa con las Pk probables y con todas en el mínimo y el máximo de `UNC`. `npm run calibrar -- --write` regenera `src/data/calibration.js` (la tabla `CAL`). La geometría de la versión original no quedó guardada, así que los casos son **reconstrucciones** a partir de su descripción.

Estado (40 noches): 7 de 9 casos con objetivo caen dentro. Quedan dos **fuera**, pendientes de una decisión (ver ROADMAP):
- **Iskander-M con señuelos contra un Patriot**: 21% (objetivo 35–65%), ya con la discriminación propia del MPQ-65 (`radar.discrim` ×4; con ×8 llega a 28%). Ya daba 16% con el motor de hace 15 PRs, así que no es un cambio reciente: con 6 señuelos por misil, el Patriot gasta sus 16 misiles antes de clasificarlos. Sin señuelos da 77%. Ni la doctrina de ignorar señuelos, ni la C2 integrada ni espaciar los lanzamientos lo llevan al objetivo. Lo que hay que revisar es la cantidad de señuelos, la discriminación o el cargador de la batería, no la Pk.
- **Kalibr contra S-300 + Buk**: 88% (objetivo 60–85%). Daba 73% con el motor de #19; subió con los cambios de física de #20–#33.

## 5. Sesgos de las fuentes

| Tipo | Ejemplos | Cuidado |
|---|---|---|
| Fabricante | Diehl, Northrop Grumman, Cascade (Lima), Proximus | Tienden a declarar el máximo teórico |
| Gobierno o fuerzas armadas | Fuerza Aérea de Ucrania, GUR, MoD ruso/TASS | Sesgo de bando; cifras no auditables |
| Medios ucranianos | Defense Express, Militarnyi, Kyiv Post, UNITED24 (estatal) | Útiles y detallados, con sesgo de bando posible |
| Fuentes rusas | Topwar, TASS | Minimizan lo ucraniano y exageran lo propio |
| Independientes | CSIS, RUSI, ISIS, JAPCC, Forbes (Hambling, Axe), TWZ | Mejor contraste; igual dependen de datos oficiales |

Ejemplos de cómo se trató esto:
- La afirmación rusa de derribar el 79% de los ATACMS figura como "MoD ruso, sin verificar".
- "Casi 100%" del IRIS-T es un dato del fabricante y del operador.
- La categoría ucraniana "perdido localmente" mezcla guerra electrónica, señuelos y fallas.

## 6. Relieves

Los dos relieves de la versión original (Monterey y Gotemburgo) son grillas de 200 m cuya fuente no quedó anotada. Se reconstruyó comparándolos contra las fuentes públicas candidatas con `node scripts/verificar-relieves.mjs` (baja los tiles de AWS y vuelve a hacer la cuenta):

| Relieve | Fuente identificada | Coincidencia | Confianza |
|---|---|---|---|
| **Gotemburgo** (57–58° N, 11–12° E) | Tile **SRTM N57E011** de 1″ (NASA, dominio público), promedio por celda de 200 m. **Sin batimetría**: todo el mar está a −5 m, como en el importador `.hgt` del juego | Correlación 0,997; diferencia mediana 1 m; 92% de las celdas de tierra a ±3 m | Alta |
| **Monterey** (36,18–37,18° N, 122,37–121,37° O) | Elevación **con batimetría** (el cañón de Monterey llega a −2.804 m). Coincide con las *Terrain Tiles* de Mapzen/AWS en formato *terrarium*, que combinan SRTM/NED en tierra con ETOPO1 y modelos costeros de NOAA en el mar | Correlación 0,999 contra el zoom 9; diferencia mediana 9 m (los píxeles del zoom 9 son de ≈200 m y no caen alineados con las celdas) | Media: no se pudo reproducir celda por celda, así que la fuente exacta de la batimetría y el método de remuestreo siguen sin confirmar |

Atribución de las Terrain Tiles: <https://github.com/tilezen/joerd/blob/master/docs/attribution.md>. Los relieves que carga el jugador son tiles SRTM `.hgt` (NASA, dominio público).

**Kiev** se genera con `scripts/gen-terrain.mjs` a partir del tile SRTM N50E030 (NASA, dominio público), bajado de las *Terrain Tiles* de Mapzen/AWS (formato skadi; atribución en <https://github.com/tilezen/joerd/blob/master/docs/attribution.md>). Cada celda de 200 m es el promedio de las muestras de 1" que contiene. Trae una **máscara de ríos y lagos** detectada en el propio SRTM (los espejos de agua están aplanados): solo sirve para el dibujo y la lectura del terreno, la física usa la elevación real. Las posiciones de los objetivos del escenario salen de Global Energy Monitor (centrales CHP-5 y CHP-6) y Wikipedia (represa de Kiev); las de las defensas son ilustrativas.

**Járkov** sale del mismo script, pero de **dos** tiles (N50E036 y N49E036): el centro de la ciudad está en 49,99° N, justo en el borde norte de N49E036, así que la ventana va de 49,5° a 50,5° N (mitad sur de un tile y mitad norte del otro, mismo tamaño que un tile). Así entran la ciudad entera y la franja de frontera rusa al norte. Posiciones del escenario: ciudades y aeropuerto de Wikipedia/Wikidata; centrales CHP-5 (Podvirky) y Zmiiv de Global Energy Monitor; datos de las UMPK (suelta a 9–12 km de altura y 50–100 km, antenas Kometa de 12 elementos) de JAPCC, UNITED24 y Forbes (ver la ficha de la UMPK y `docs/investigacion/guerra-electronica-ucraniana.md`). Las defensas son ilustrativas.

## 7. Investigación de guerra electrónica ucraniana

En la versión 0.3.0 se sumaron sistemas ucranianos (Pokrova, Lima, Bukovel-AD) y el pod del F-16, para equilibrar un catálogo de EW que era casi todo ruso. El informe completo, con tabla de sistemas, propuesta de mecánicas y advertencias, está en [investigacion/guerra-electronica-ucraniana.md](investigacion/guerra-electronica-ucraniana.md).

**Importante:** esa investigación se hizo con resultados de buscador. Las URL existen, pero no se pudo leer el texto completo de cada página, así que sus cifras están marcadas con confianza baja o media. Verificarlas es una buena primera contribución.

## 8. Cómo agregar o corregir un dato

1. Agregá la fuente en `src/data/sources.js` con una clave corta: `clave: ['Título descriptivo en español', 'URL']`.
2. Cargá o cambiá el rango en `src/data/uncertainty.js`: `parametro: U(min, probable, max, 'confianza', S_('clave1', 'clave2'), 'razonamiento')`.
3. Si es un arma o sistema nuevo, agregalo en `threats.js`, `defenses.js` o `jammers.js` (copiá uno parecido). Los campos están documentados en `src/types.js`.
4. Corré `npm test`: las pruebas de catálogo detectan fuentes inexistentes, rangos desordenados y campos faltantes.
5. Corré `npm run docs` para regenerar CATALOGO.md, y `npm run build`.
6. Si el cambio altera los resultados de la simulación, los golden van a fallar: revisá el cambio, regeneralos (`UPDATE_GOLDEN=1 npm test`) y anotalo en el CHANGELOG.
