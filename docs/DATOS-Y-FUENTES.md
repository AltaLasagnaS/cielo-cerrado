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
| **RCS** | **Casi nunca hay mediciones públicas.** Se estima por analogía con la tabla de GlobalSecurity (Tomahawk 0,5 m², ALCM furtivo < 0,05, Harpoon/Exocet 0,1), por tamaño, forma, tomas de aire y materiales. La única medición técnica pública es el modelado del Shahed de la Universidad de la Fuerza Aérea de Járkov. Se guarda **frente, costado y cola**. Como segunda opinión se usa la base de datos de *Command: Modern Operations* (estimaciones de juego, citadas valor por valor; no se copia la base): cuando OSINT y CMO difieren, el probable es la **media geométrica** y el rango cubre a las dos. Sin dato de CMO, costado y cola salen de la forma (cuerpo cilíndrico visto de costado, toberas y hélices atrás) | Baja |
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

**Limitación:** la geometría exacta de esos casos de prueba no quedó guardada en la versión original. Reconstruir un arnés de calibración reproducible está en el [ROADMAP](../ROADMAP.md).

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

Los dos relieves incluidos (Monterey y Gotemburgo) son grillas de 200 m con batimetría. **La fuente exacta del raster no quedó documentada en la versión original**; por la resolución y el formato, probablemente sean SRTM para tierra y una batimetría pública para el mar. Documentarla está pendiente (ver ROADMAP). Los relieves que carga el jugador son tiles SRTM `.hgt` (NASA, dominio público).

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
