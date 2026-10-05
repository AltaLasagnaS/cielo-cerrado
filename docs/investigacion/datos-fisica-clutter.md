# Datos de física: clutter y procesado de radar

Consulta: 5 de octubre de 2026. Entrega para el bloque de física de Claude; **sólo investigación**, sin cambios al motor ni a `UNC`. Complementa [la investigación inicial](clutter-y-pulsos-datos.md), que conserva el registro de consultas anteriores.

## Resultados utilizables

- Se localizó y leyó el informe original **NRL/MR/5310-12-9346**, incluida su ecuación y su código de referencia. Permite implementar la reflectividad marina dentro de su dominio, con las salvedades que siguen.
- La ficha técnica del fabricante confirma **Pulse Doppler** para **TRML-4D**. Su precisión de seguimiento en distancia no es resolución en distancia.
- Hay dos descripciones técnicas secundarias de **MTI en la familia SNR-125**, una de ellas identifica SNR-125M. La etiqueta general «sin filtro» necesita revisión; todavía falta un manual primario de la variante que se quiera modelar.
- **SCV, factor de mejora MTI I, número de pulsos del cancelador, número integrado y permanencia por blanco: no encontrado para las variantes exactas del catálogo.** No hay aquí un valor apto para cerrar esos campos numéricos de `UNC`.

SCV es la capacidad de detectar un blanco por debajo del clutter bajo condiciones declaradas; `I` compara la relación señal/clutter antes y después del filtro. «Rechazo de clutter», ECCM, notch Doppler y ganancia de integración no se intercambian con esas magnitudes. Un dato desconocido sigue siendo `null`, nunca cero. No deducir integración a partir de la rotación, del refresco o de la PRF sola.

## Tabla por sistema

**NF = no encontrado en las fuentes indicadas**, no inexistencia del dato. En todas las filas quedan NF **SCV/I**, ancho de pulso *comprimido*, número de pulsos del cancelador, integración y permanencia. Las cifras secundarias se conservan para contraste, sin promoverlas a mediciones del radar del juego. La confianza mide el respaldo de la afirmación delimitada, no una certificación del catálogo completo.

| Radar / variante | Procesamiento | Resolución de distancia | PRF por modo | Haz en elevación / forma | Polarización | Fuente, tipo y confianza |
|---|---|---|---|---|---|---|
| AN/MPQ-65 | NF para arquitectura exacta del filtro | NF | NF | NF | NF | [F5], manual de batería; identifica equipo pero no completa estos parámetros. |
| Arabel | NF en documento primario leído | NF | NF | NF | NF | Referencias CSIS de la investigación inicial; acceso bloqueado. Sin confirmación nueva. |
| **TRML-4D** | **Pulse Doppler, AESA de estado sólido GaN**; haces apilados con estabilización electrónica. Cancelador/MTD concreto NF | NF; la ficha publica **precisión**, ver abajo | NF | Haz apilado; ancho individual y forma NF | NF | [F1], fabricante, PDF p. 2, **alta** para estos descriptores. |
| AN/MPQ-64 Sentinel | NF para variante concreta; no trasladar Sentinel A4 | NF | NF | NF | NF | CRS IF12230 consultado en investigación inicial; descripción del sistema, no estos parámetros. |
| 30N6 | Arquitectura exacta NF | NF | NF | NF | NF | [F2], análisis OSINT de familia, sin dato numérico utilizable para estos campos. |
| 92N6 | Arquitectura exacta NF; digitalización no demuestra MTD determinado | NF | NF | NF | NF | [F2], OSINT de familia; pendiente variante. |
| 36D6 / ST-68UM | NF para variante exacta | NF | NF | NF | NF | Radartutorial y UOS en investigación inicial: 404/bloqueo; sin confirmación nueva. |
| **9S35** Fire Dome | Canal pulsado de búsqueda/seguimiento con chirp y compresión; iluminación CW separada | NF; «compresión» no da ancho efectivo | NF | Seguimiento e iluminación distintos; cifras secundarias debajo | NF | [F2], OSINT técnico, **media** para descripción de 9S35; no heredar a M2/M3. |
| **9S18M1** Snow Drift | NF en fuente primaria leída | NF | NF | NF | NF | [F2] no resuelve este radar auxiliar; composición Buk-M1 en Missilery no determina su filtro. |
| **1RS1** adquisición Pantsir | NF para equipo exacto | NF | NF | NF | NF | [F3] también trata **2RL80/2RL80E**: no atribuir sus especificaciones a 1RS1. |
| **1RS2/1RS2E** Shlem | Pulso Doppler descrito; generación exacta pendiente | NF | NF | NF | NF | [F3], OSINT técnico, **media** para familia Shlem, no para toda versión posterior. |
| Tor-M2, búsqueda | NF para variante concreta | NF | NF | NF | NF | [F2] recorre varias generaciones Tor. |
| Tor-M2, seguimiento | Familia descrita como pulso Doppler coherente, compresión y DSP; correspondencia exacta con M2 pendiente | NF | NF | NF | NF | [F2], OSINT técnico, **baja** para extrapolar a M2. |
| **SNR-125 / SNR-125M** Low Blow | Cancelador de clutter + MTI analógico [F2]; selector de blancos móviles con sustracción entre períodos y líneas de retardo ultrasónicas [F4] | NF; duración emitida no es resolución efectiva | Cifras secundarias debajo | Dos anchos tabulados, sin asignación inequívoca elevación/azimut | NF | [F2]+[F4], dos fuentes técnicas secundarias, **media** para existencia de MTI de familia / M. Primaria pendiente. |
| **5N62** Square Pair | CW/FMCW; modos de iluminación y codificación de fase. No asignar PRF/N de radar pulsado al canal CW | NF | NF para modos concretos; CW no tiene PRF ordinaria | NF | NF | [F2], OSINT técnico, **media** para carácter CW; resto pendiente. |
| **P-18MR** | NF para modernización MR | NF | NF | NF | NF | Defense Express bloqueado en investigación inicial. No copiar procesado del P-18 analógico. |
| **Erieye** inicial, ASC 890 | NF en fuente primaria accesible | NF | NF | NF | NF | Saab/GlobalSecurity bloqueados en investigación inicial. No heredar Erieye ER. |
| **Shmel-M**, A-50U | NF para M | NF | NF | NF | NF | Búsqueda de fuentes públicas de la investigación inicial; no confundir Shmel original. |
| **AN/MPQ-61** HPIR | Iluminación y seguimiento; detalle del procesado NF | NF | NF | NF | NF | Configuración del catálogo; no se obtuvo manual primario de MPQ-61. |
| **AN/MPQ-50** PAR | Adquisición pulsada; detalle del filtro NF | NF | NF | NF | NF | No se obtuvo manual primario de MPQ-50; separado de HPIR/CWAR. |
| **AN/MPQ-62** CWAR | Adquisición CW; detalle del procesado NF | NF | No aplicar PRF ordinaria sin identificar modo | NF | NF | No se obtuvo manual primario de MPQ-62. |
| **Gepard**, búsqueda / seguimiento | NF para versiones exactas; dos funciones separadas | NF | NF | NF | NF | No se obtuvo manual/ficha primaria de cada radar. |

### Cifras encontradas y límites de uso

| Equipo y magnitud publicada | Valor y unidad | Localizador / tipo / confianza | Interpretación permitida |
|---|---|---|---|
| TRML-4D, precisión TWS de distancia, sigma | **< 15 m** | [F1], PDF p. 2, fila «Track accuracy in Track-While-Scan (Sigma)»; fabricante; **alta** | Precisión de estimación de una pista. **No resolución**, ni ancho de celda, ni pulso comprimido. |
| SNR-125, PRF búsqueda / seguimiento | **1750–3500 / 3560–3585 Hz** | [F2], tabla «SNR-125 Low Blow Principal Specifications»; OSINT; **media** para tabla de familia | Modo y variante concreta requieren manual. No permite calcular N sin permanencia/procesado. |
| SNR-125, duración del pulso | **0,2–5,0 µs** | [F2], misma tabla; OSINT; **media** | La fuente deja vacía «Range Resolution». No convertir este intervalo en resolución comprimida. |
| SNR-125, ancho del lóbulo principal | **12,0 × 1,5°** | [F2], misma tabla; OSINT; **media** | La tabla no asigna los ejes: ancho **en elevación NF**. |
| 9S35, ancho de haz de seguimiento | **2,5° azimut / 1,3° elevación** | [F2], sección 9S35, tabla de especificaciones; OSINT; **media** | No atribuir a adquisición 9S18M1 ni al haz CW. |
| 9S35, ancho del haz de iluminación CW | **1,4° azimut / 2,65° elevación** | [F2], misma sección; OSINT; **media** | Canal de iluminación, separado del seguimiento pulsado. |
| S-125, supresión de ecos fijos/interferencia pasiva citada | **33–36 dB** | [F4], párrafo ruso «Подавление пассивных помех…»; OSINT; **baja** para parametrizar | **No se define como SCV o I**. Mantener como cita pendiente de definición/ensayo, no cargar a `UNC`. |
| Pantsir, rechazo de clutter de adquisición **2RL80/2RL80E** | **55 dB** | [F3], sección de adquisición; OSINT; **baja** para parametrizar | No SCV definida; no es evidencia de 1RS1 ni de 1RS2. |

La corroboración S-125 es descriptiva: [F4] identifica SNR-125M en la composición y explica sustracción entre períodos. **No prueba un número de pulsos ni la arquitectura de todas las modernizaciones**. Dos páginas con autores/editoriales distintos no garantizan mediciones independientes; no se auditó el origen de cada especificación. La discrepancia `mti: 'none'` queda documentada para que Claude decida qué variante representar y cómo declarar la incertidumbre.

## Modelo NRL original: fórmula y límites

**Fuente primaria [F6]:** Vilhelm Gregers-Hansen y **Rashmi Mital** (grafía de la portada), *An Improved Empirical Model for Radar Sea Clutter Reflectivity*, NRL/MR/5310-12-9346, 27-abr-2012, DTIC ADA559494. La portada autoriza distribución pública ilimitada. El PDF tiene páginas preliminares: **p. impresa 6 = p. PDF 10**, y **p. impresa 18 = p. PDF 22**.

La ecuación (7), p. impresa 6, devuelve reflectividad superficial aparente en **dB**:

```text
sigma0_dB = c1
          + c2 * log10(sin(alpha * pi / 180))
          + (27.5 + c3 * alpha) * log10(f_GHz) / (1 + 0.95 * alpha)
          + c4 * (1 + SS) ** (1 / (2 + 0.085 * alpha + 0.033 * SS))
          + c5 * alpha ** 2

sigma0 = 10 ** (sigma0_dB / 10)      # m²/m², adimensional
```

`alpha` es el **ángulo rasante en grados**, respecto de la superficie marina; sólo el seno recibe radianes. `f_GHz` es frecuencia en GHz. `SS` es estado del mar según los datos de Nathanson usados para ajustar el informe. **No** es elevación del blanco respecto del radar ni una pérdida fija de alcance.

### Coeficientes: conservar la diferencia entre tabla y código

Cada fila siguiente procede de [F6], **informe primario / confianza alta** en la transcripción. Son coeficientes del ajuste para las unidades anteriores; no constituyen cinco parámetros físicos independientes ni cinco medidas del radar.

| Polarización | Localizador | c1 | c2 | c3 | c4 | c5 |
|---|---|---:|---:|---:|---:|---:|
| H | Tabla 1, p. impresa 6 / PDF 10 | −73,00 | 20,78 | 7,351 | 25,65 | 0,00540 |
| V | Tabla 1, p. impresa 6 / PDF 10 | −50,79 | 25,93 | 0,7093 | 21,58 | 0,00211 |
| H | Apéndice B, figura 22, p. impresa 18 / PDF 22 | −73,0 | **20,781** | 7,351 | 25,65 | 0,0054 |
| V | Apéndice B, figura 22, p. impresa 18 / PDF 22 | **−50,796** | 25,93 | 0,7093 | **21,588** | 0,00211 |

No mezclar filas ni completar decimales por intuición. Para reproducir el código publicado, usar íntegra la fila del apéndice; la elección para el motor y su fuente queda a Claude. La extracción textual del PDF pierde parte de la ecuación; se verificó visualmente la página y se contrastó con el listado del apéndice.

### Dominio y condiciones

| Aspecto | Valor / condición | Fuente y confianza |
|---|---|---|
| Frecuencia del conjunto ajustado | **0,5–35 GHz** | [F6], descripción de tablas/datos y apéndice B; informe primario, **alta**; [F7] corrobora dominio de implementación. |
| Ángulo rasante de datos/modelo | **0,1–60°** | [F6], secciones de ajuste, tabla 1 y datos del apéndice B; primario, **alta**. No evaluar en cero. |
| Estado del mar respaldado por tablas de ajuste | **0–6** | [F6], apéndice B y comparación con Nathanson; primario, **alta**. |
| Polarización | **H o V** lineal copolar | [F6], ecuación y listado; primario, **alta**. Circular y cruzada NF. |
| Dirección relativa del viento | Entrada **no usada** por el listado NRL | [F6], figura 22; primario, **alta**. Datos promediados sobre direcciones; no añadir un término GIT como si fuera NRL. |
| Extrapolación VHF | **No respaldada** por el dominio | [F6]; frecuencia real de P-18MR fuera del intervalo no se resuelve extendiendo la curva. |

El comentario del código dice «SS 0–7», pero las tablas/dominio documentados llegan hasta **6**. También habla de ajuste «0–60°», aunque el mínimo de los datos es **0,1°** y `log10(sin(0))` no existe. Conservar esos límites explícitos evita confundir un comentario de interfaz con validación.

El informe distingue el estado del mar de Nathanson de la escala WMO: su estado cero no supone necesariamente superficie perfectamente lisa. Antes de conectar clima y mar, fijar la escala; no convertir automáticamente Beaufort o viento superficial en SS.

Es **reflectividad aparente**: incorpora efectos de propagación/sombreado de los datos. Revisar cualquier factor adicional de multipath para evitar contarlo dos veces. Para convertir a RCS de clutter falta el **área de la celda marina iluminada**, que depende de geometría, haz y resolución. Este informe no determina SCV del receptor, espectro Doppler de clutter ni radar concreto.

### Punto reproducible, sin presentarlo como medición

Con los coeficientes del **apéndice**, H, `SS = 2`, `f = 30 GHz`, `alpha = 10°`:

- Cálculo propio en Python: **−36,6644895 dB**, o **σ⁰ = 0,0002155515 m²/m²**.
- [F7], ejemplo «Sea Surface Reflectivity Using NRL Model», publica **2,1555 × 10⁻⁴**, consistente a su redondeo.

Tipo: **cálculo de una fórmula primaria**, confianza alta en este punto aritmético; no ensayo, no ejecución MATLAB, no validación del motor o del error del modelo fuera de ese punto. Los valores de entrada son un ejemplo de contraste, no un escenario meteorológico ucraniano.

El error del ajuste tampoco es una incertidumbre independiente de radar: el texto en p. impresa 7 cita media de error absoluto H **2,3 dB** / V **2,0 dB** para ángulos bajos, mientras la **tabla 2, p. 8**, da H **2,3** / V **2,2 dB**. La **tabla 3**, hasta el conjunto completo de ángulos, da **2,6 dB** en ambas polarizaciones. Fuente [F6], informe primario, confianza alta en la transcripción; **discrepancia interna**, no elegir silenciosamente el menor error. Comparación con datos de ajuste, no validación independiente de una aplicación antiaérea.

## Lo que sigue sin dato

- Manuales primarios por versión para SCV/I, resolución, polarización y PRF, y arquitectura del cancelador. Se consultaron las fichas/enlaces del catálogo, APA, Missilery, Hensoldt y las referencias de la investigación inicial; los accesos bloqueados no prueban que no exista documentación.
- **Billingsley σ°F⁴ por terreno:** no encontrado en fuente primaria leída que permita asignar valores a los terrenos del juego. No fabricar tabla bosque/urbano/mar a partir de categorías de color del mapa.
- **Tablas originales de Nathanson:** el informe NRL contiene los datos usados en su comparación; no se presenta el libro original como leído. No transcribir una matriz universal de «reflectividad por estado» ignorando frecuencia, polarización y ángulo.
- SCV publicada y definida para una **variante exacta del catálogo:** no encontrada. Los valores de supresión secundarios citados no cierran este pendiente.

## Fuentes

- **[F1] Fabricante:** HENSOLDT, *TRML-4D — Multi-Functional Surveillance and Target Acquisition Sensor System*, issue 2, ©2022, tabla p. PDF 2. [PDF](https://dam.hensoldt.net/m/23b5fe680f976d6f/original/TRML-4D-English.pdf). [Página de producto consultada](https://www.hensoldt.net/products/trml-4d-air-surveillance-and-target-acquisition-radar), «Features and benefits». La página y el PDF son ediciones distintas; se identifica la fuente de cada afirmación.
- **[F2] OSINT técnico secundario:** Carlo Kopp / Air Power Australia, *Engagement and Fire Control Radars*, secciones/tablas SNR-125, 9S35, 5N62, Tor, 30N6/92N6. [Texto](https://www.ausairpower.net/APA-Engagement-Fire-Control.html).
- **[F3] OSINT técnico secundario:** Air Power Australia, *96K6 Pantsir / 2K22 Tunguska*, apartados 1RS2 y adquisición 2RL80. [Texto](https://www.ausairpower.net/APA-96K6-Pantsir-2K22-Tunguska.html).
- **[F4] OSINT técnico secundario:** Missilery, *Зенитный ракетный комплекс С-125 «Нева»*, composición SNR-125M y párrafos sobre СДЦ/УЛЗ/supresión. [Original ruso leído](https://missilery.info/missile/c125). [Traducción inglesa](https://en.missilery.info/missile/c125), no sustituye el original para la cifra omitida en traducción.
- **[F5] Manual primario:** US Army, *FM 3-01.85, Patriot Battalion and Battery Operations*, mayo 2002, apéndice B. [Copia pública](https://archive.org/download/Fm301.85PatriotBattalionAndBatteryOperations/fm%203-01.85%20Patriot%20Battalion%20and%20Battery%20Operations.pdf). No demuestra capacidades de una actualización posterior por analogía.
- **[F6] Informe primario:** Gregers-Hansen y Mital, NRL/MR/5310-12-9346, 2012, DOI [10.21236/ada559494](https://doi.org/10.21236/ada559494). [PDF público original en archivo DTIC](https://archive.org/download/DTIC_ADA559494/DTIC_ADA559494.pdf), portada, pp. impresas 1–8 y apéndice B p. 18. [Metadatos](https://archive.org/details/DTIC_ADA559494).
- **[F7] Documentación técnica de implementación:** MathWorks, *seaReflectivity*, dominio NRL y ejemplo numérico. [Texto](https://www.mathworks.com/help/radar/ref/seareflectivity.html). Contraste secundario; no reemplaza [F6].

No se usaron números de CMO/DCS ni se copiaron valores entre radares para cerrar huecos.
