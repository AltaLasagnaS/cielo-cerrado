# Clutter de mar/lluvia e integración: datos disponibles

Fecha de consulta: **4 de octubre de 2026**. Investigación para el siguiente bloque de física; **no modifica el motor, el catálogo, la incertidumbre ni las golden**. Base: `main` con el PR #48. Complementa [la derivación de integración de pulsos](integracion-pulsos.md).

## Qué se puede usar y qué falta

- No se encontró un **número de pulsos integrados**, tiempo de permanencia equivalente o **mejora subclutter (SCV) cuantificada y atribuible a la variante exacta** de ningún radar del catálogo. Esos campos quedan **sin dato**, no en cero ni en uno. No asignar `radar.integrationPulses` con esta investigación.
- Hensoldt confirma procesamiento Doppler y haces simultáneos para TRML-4D. Air Power Australia (APA), fuente técnica secundaria, describe MTI en SNR-125, pulso Doppler en el radar de seguimiento del Tor y del Pantsir, y canales pulsado/CW en el Buk. Se deben conservar sus límites de variante y de función.
- Hay dominios públicos de modelos de reflectividad marina. El estado del mar por sí solo no determina la reflectividad: también hacen falta frecuencia, ángulo rasante y polarización; algunos modelos requieren viento relativo.
- Para lluvia se encontró documentación de reflectividad **volumétrica**, distribución de gotas y unidades. No se encontró una tabla pública validada de coeficientes empíricos de reflectividad por banda S/C/X/Ku aplicable sin más a estos radares. La sección de lluvia separa lo confirmado de una conversión física condicional y de lo pendiente.

**Estados:** «primaria» = fabricante/organismo leído; «secundaria» = análisis técnico leído; «pendiente» = no confirmado en la consulta. Un enlace bloqueado o una referencia a una familia distinta no confirma el dato. Las etiquetas `mti` actuales del simulador son decisiones del catálogo, no resultados de esta búsqueda.

## Inventario por radar

En todas las filas: **N integrado, permanencia en el blanco y SCV en dB pendientes**. «Barrido» no equivale a permanencia; «rechazo de clutter» no equivale automáticamente a mejora subclutter.

| Unidades del catálogo / radar | Procesamiento encontrado y alcance de la evidencia | Fuente / estado |
|---|---|---|
| Patriot PAC-3 y GEM-T / AN/MPQ-65 | No se confirmó un dato nuevo de N, permanencia, MTI/MTD o SCV para **MPQ-65**. No trasladar datos de MPQ-53. | [CSIS, Patriot](https://missilethreat.csis.org/system/patriot/) es referencia del catálogo, pendiente de contraste específico; la ficha de Radartutorial enlazada en el catálogo devolvió 404. |
| SAMP/T / Arabel | El catálogo usa `pd`; no se verificó aquí una especificación de procesado, N o SCV de Arabel. | [CSIS, SAMP/T](https://missilethreat.csis.org/defsys/samp-t/), acceso 403 en esta consulta: pendiente. |
| IRIS-T SLM / TRML-4D | **Haces simultáneos y procesamiento Doppler** explícitos. No publica N/permanencia/SCV en la página consultada; no convertir «high update rates» en un número. | [Hensoldt, TRML-4D](https://www.hensoldt.net/products/trml-4d-air-surveillance-and-target-acquisition-radar), primaria. |
| NASAMS / AN/MPQ-64 Sentinel | Fuente consultada describe el sistema, sin esos parámetros de radar. No trasladar valores de Sentinel **A4** a MPQ-64 sin fijar variante. | [CRS IF12230](https://www.everycrsreport.com/reports/IF12230.html), documento institucional alojado por tercero; procesado pendiente. |
| S-300P / 30N6 y mástil 40V6 | APA describe la familia de radares de control de tiro; no se extrajo una cifra de integración o SCV para la variante modelada. No confundir 30N6 del S-300P con 9S32 del S-300V. El mástil no define procesado. | [APA, radares de control de tiro](https://www.ausairpower.net/APA-Engagement-Fire-Control.html), secundaria; MTI/MTD específico pendiente. |
| Buk-M1 / 9S35 Fire Dome + 9S18M1 Snow Drift | Para **9S35**, APA describe canal pulsado de búsqueda/seguimiento con chirp y compresión, y canal CW de iluminación. Eso no demuestra una cifra SCV ni un procesador MTD concreto. Falta separar los datos del **9S18M1**. | [APA](https://www.ausairpower.net/APA-Engagement-Fire-Control.html), secundaria; [composición Buk-M1](https://en.missilery.info/missile/bukm1), secundaria. |
| Gepard / búsqueda S + seguimiento Ku | Dos funciones y bandas distintas. No se encontró una fuente de procesado con N/permanencia/SCV atribuible a la versión del catálogo. | Pendiente de manual o ficha técnica de los radares exactos; no usar fuentes de munición como evidencia de radar. |
| Hawk / AN/MPQ-61 HPIR + AN/MPQ-50 PAR + AN/MPQ-62 CWAR | Se agrupan búsqueda pulsada, adquisición CW e iluminación. No corresponde asignarles un único N por analogía. Falta documentación de la configuración concreta. | Pendiente; la etiqueta `pd` del catálogo no certifica los tres equipos ni una SCV. |
| S-125 / SNR-125 Low Blow + P-18/P-19 de búsqueda | APA atribuye **cancelador de clutter y circuitos MTI analógicos al Low Blow**. Contradice la simplificación actual `mti: 'none'`: requiere revisión de variante antes de cambiarla. No atribuir ese MTI a los radares auxiliares. | [APA, sección SNR-125](https://www.ausairpower.net/APA-Engagement-Fire-Control.html), secundaria. |
| S-200 / 5N62 Square Pair + P-14/red | APA describe **CW/FMCW**, medida de velocidad radial y codificación de fase. La iluminación continua necesita un tratamiento compatible con CW; no cargar un N discreto de pulsos por defecto. Búsqueda auxiliar separada. | [APA, sección 5N62](https://www.ausairpower.net/APA-Engagement-Fire-Control.html), secundaria. |
| Pantsir / adquisición 1RS1 y seguimiento 1RS2 | APA describe **pulso Doppler** para 1RS2/1RS2E Shlem. Su sección de adquisición menciona 2RL80/2RL80E, barrido 2 o 4 s y rechazo de clutter citado de 55 dB: **no es una SCV verificada del conjunto 1RS1/1RS2**, ni N. Hay variantes posteriores distintas. | [APA, Pantsir/Tunguska](https://www.ausairpower.net/APA-96K6-Pantsir-2K22-Tunguska.html), secundaria. |
| Tor-M2 / adquisición + seguimiento | APA describe el radar de seguimiento de la familia como **pulso Doppler coherente**, compresión y procesado digital. La página recorre variantes: pendiente fijar correspondencia exacta con M2 y radar de adquisición. | [APA, sección Tor](https://www.ausairpower.net/APA-Engagement-Fire-Control.html), secundaria. |
| S-400 / 92N6 Grave Stone + 40V6M | APA describe evolución y digitalización respecto a 30N6; no se obtuvo un N, permanencia, SCV ni clasificación MTI/MTD específica verificable para 92N6. | [APA](https://www.ausairpower.net/APA-Engagement-Fire-Control.html), secundaria; [CSIS S-400](https://missilethreat.csis.org/defsys/s-400-triumf/), referencia del catálogo pendiente de contraste específico. |
| Radar 3D / 36D6 Tin Shield | No se verificó el procesado de la variante exacta. | Referencias del catálogo: [Radartutorial](https://www.radartutorial.eu/19.kartei/11.ancient/karte060.en.html), 404; [UkrOboronService](https://en.uos.ua/produktsiya/tehnika-pvo/rls/98-), acceso bloqueado. Pendiente. |
| Radar VHF / P-18MR | No trasladar especificaciones del P-18 analógico a la modernización **MR**. | [Defense Express, P-18MR](https://en.defence-ua.com/weapon_and_tech/closing_air_coverage_gaps-1670.html), 403; pendiente. |
| Saab AEW / Erieye | No se verificó una tabla N/permanencia/SCV. No atribuir a Erieye inicial datos de Erieye ER. | [Saab Erieye](https://www.saab.com/products/erieye), 403; [GlobalSecurity](https://www.globalsecurity.org/military/world/europe/erieye.htm), 403. Pendiente. |
| A-50U / Shmel-M | No se encontró evidencia accesible para esos parámetros; rotación del radomo no determina integración por blanco. | Pendiente de manual/ficha de Shmel-M, no del Shmel original. |

Sensores ópticos, IR y acústicos quedan fuera de esta tabla de radares. «Procesado digital», «coherente», MTI, Doppler de pulso y MTD no son sinónimos; las fuentes consultadas no permiten completar una columna MTD de todas las unidades.

### Cifras encontradas que NO son `integrationPulses`

En la tabla del SNR-125 de APA, la PRF de búsqueda figura como **1750–3500 Hz** y la de seguimiento **3560–3585 Hz**, según modo. Sin permanencia, selección de pulsos y tipo de integración, PRF no determina N. `N ≈ PRF × dwell` sólo describe cuántos pulsos podrían iluminar el blanco bajo un modo uniforme; no cuántos integra realmente el detector.

APA da para 9S35 barrido autónomo de un sector de 120° en **4 s** y búsqueda dirigida de un sector 10° × 7° en **2 s**. Son tiempos de búsqueda de sector, no permanencia en un blanco. Los **55 dB** de adquisición Pantsir citados arriba tampoco permiten llenar SCV: faltan definición, geometría, referencia y variante.

La SCV requiere comparar la señal detectable del blanco con el clutter en condiciones de velocidad, espectro y probabilidad de detección declaradas. Ni una cifra ECCM general ni el notch de Doppler dan por sí solos esa mejora. Además, el modelo opcional actual integra **no coherentemente**, Swerling lento 1/3: no basta que un radar diga «Doppler» para afirmar que reproduce esa arquitectura.

## Reflectividad de mar

Fuente técnica leída: [MathWorks `seaReflectivity`](https://www.mathworks.com/help/radar/ref/seareflectivity.html), documentación de una implementación de los modelos. **No se ejecutó MATLAB ni se obtuvieron muestras numéricas de estos modelos**. Los libros e informes de su bibliografía no se presentan como leídos completos.

| Modelo | Ángulo rasante | Frecuencia | Estado del mar | Límites/características publicados |
|---|---:|---:|---:|---|
| GIT | 0,1–10° | 1–100 GHz | 1–6 | Semiempírico; intervienen multipath, viento, dirección relativa y altura/dinámica de las olas. |
| APL | 0,1–10° | 1–100 GHz | 1–6 | Olas/viento; la documentación lo compara con GIT y advierte diferencias a estados bajos. |
| NRL | 0,1–60° | 0,5–35 GHz | 0–6 | Empírico, sin dependencia de azimut de viento en esta implementación. |
| Nathanson | 0,1–60° | UHF 0,3–1; L 1–2; S 2–4; C 4–8; X 8–12; Ku 12–18; Ka 32–36 GHz | 0–6 | Tabla por banda/estado, promediada sobre direcciones del viento; no intercambiar esos intervalos con otra convención de bandas. |
| TSC | 0,1–90° | 0,5–35 GHz | 0–5 | Ajuste de datos de Nathanson; la documentación lo ofrece como alternativa conservadora cuando falta información. |

Estos son **dominios de la implementación documentada**, no garantía de error pequeño en cualquier combinación ni datos de rendimiento de un radar concreto. La interfaz genérica de la función puede aceptar más estados que un modelo particular: se respeta la fila del modelo, no el máximo de la interfaz.

La reflectividad superficial `σ⁰` es adimensional (m²/m²); `σ⁰_dB = 10 log10(σ⁰)`. Para obtener RCS de clutter hay que multiplicar por el área de la celda efectivamente iluminada. Se requieren la geometría del haz, resolución en distancia, polarización y ángulo rasante. No convertir «mar 4» en una pérdida fija universal de alcance o en SCV.

El estado del mar y Beaufort no son la misma escala. [MathWorks `seaRoughness`](https://www.mathworks.com/help/radar/ref/searoughness.html) documenta una conversión modelada entre estado, altura, pendiente y viento: no es una observación meteorológica local. VHF del P-18MR queda fuera de varios dominios anteriores; no extrapolar GIT/APL a esa frecuencia. Las coordenadas/altura del blanco tampoco definen por sí solas el área de mar dentro del haz.

Referencias identificadas en la bibliografía de `seaReflectivity`: Gregers-Hansen y Mittal, informe NRL/MR/5310-12-9346 (2012); Nathanson, *Radar Design Principles*; Barton, *Radar Equations for Modern Radar* (2013); Reilly, McDonald y Dockery, *Advanced Refractive Effects Prediction System* (1997). Consultar originales antes de reconstruir fórmulas o interpolaciones del modelo. No copiar tablas cuya licencia no permita redistribución.

## Reflectividad de lluvia por banda

### Confirmado en fuentes leídas

- [MathWorks `rainReflectivity`](https://www.mathworks.com/help/radar/ref/rainreflectivity.html): devuelve **RCS por volumen**, `η` en m²/m³ = m⁻¹, con frecuencia real, lluvia en mm/h y polarización. Usa una distribución de gotas Marshall–Palmer y aproxima gotas pequeñas/casi esféricas mediante Rayleigh. La página no publica una tabla de coeficientes empíricos S/C/X/Ku ni la fórmula completa de su implementación.
- [MathWorks `clutterVolumeRCS`](https://www.mathworks.com/help/radar/ref/cluttervolumercs.html): convierte reflectividad de volumen a RCS con la geometría de la celda. No basta una tasa de lluvia del escenario para conocer la potencia de clutter recibida.
- [NOAA Jetstream, Reflectivity](https://www.noaa.gov/jetstream/reflectivity): `Z` lineal en **mm⁶/m³** y escala `dBZ = 10 log10 Z`. La tabla de tasas de lluvia es aproximada; no equivale a una ley universal de distribución de gotas ni a reflectividad en m⁻¹.
- [NOAA Jetstream, Precipitation Estimation](https://www.noaa.gov/jetstream/precipitation): estimación de lluvia dependiente de tamaño/intensidad de gotas, mejorada por doble polarización. No publica en esa página los coeficientes de una ley `Z = a R^b`.

### Conversión condicional: no son coeficientes medidos de los radares

Para una población de esferas pequeñas bajo Rayleigh, al sumar sus secciones radar se obtiene:

```text
η = C(f) · |K|² · Z
C(f) = π⁵ · 10⁻¹⁸ / λ⁴ ; λ = c/f ; c = 299792458 m/s
```

`10⁻¹⁸` convierte mm⁶ a m⁶; `K` es el factor dieléctrico de las gotas. Ésta es una **derivación física condicional**, no una tabla copiada de MathWorks ni una ejecución de su modelo. Requiere contraste con un manual meteorológico técnico antes de implementarla. No se fija `|K|²`, temperatura o polarización con datos inexistentes.

| Banda ilustrativa | Frecuencia elegida para mostrar la conversión | `C(f)` (multiplicar por `|K|² · Z`) | Estado |
|---|---:|---:|---|
| S | 3 GHz | 3,06868 × 10⁻¹² | Cálculo algebraico bajo Rayleigh; no ajuste empírico por banda. |
| C | 6 GHz | 4,90989 × 10⁻¹¹ | Ídem. |
| X | 10 GHz | 3,78849 × 10⁻¹⁰ | Ídem; comprobar tamaño de gotas respecto a λ. |
| Ku | 15 GHz | 1,91792 × 10⁻⁹ | Ídem; no extender la aproximación a gotas grandes, granizo o régimen no Rayleigh. |

Las frecuencias son ejemplos explícitos, **no frecuencias medidas de los equipos**. Dentro de una misma banda `C` varía con `f⁴`: hace falta la frecuencia concreta. Si se eligiera una ley meteorológica `Z = a R^b`, resultaría `η = C(f)|K|² a R^b`; **los coeficientes `a`, `b` y la elección de `K` siguen pendientes de fuente y régimen de lluvia**, por lo que la tabla no permite llenar automáticamente parámetros del juego. No adoptar `200 R^1,6` u otro ajuste sólo porque resulte familiar.

Los coeficientes `k, α` de ITU-R P.838 y funciones de atenuación de lluvia describen **dB/km**, no RCS por volumen. Son otra magnitud; no usarlos como coeficientes de clutter. La documentación MathWorks menciona anchuras de espectro de movimiento de lluvia de alrededor de 4 m/s y hasta 8 m/s: son referencias genéricas, no notch o rechazo certificados de ningún radar del catálogo.

## Entrega al bloque de física y próximos datos

1. Revisar **SNR-125 MTI** con una segunda fuente y fijar variante. Mantener visible la contradicción con `none` hasta resolverla, sin cambiar silenciosamente la calibración.
2. Separar función/banda en radares compuestos antes de introducir N o SCV; distinguir CW de detección pulsada. No heredar el dato del buscador al iluminador ni de una modernización a otra.
3. Pedir para cada variante: PRF **y** dwell efectivo, ventana de integración/CPI, integración coherente/no coherente, esquema de cancelación/MTD, condiciones y definición de SCV. Un escaneo de manual aportado por el usuario puede resolver huecos que no están en OSINT abierto.
4. Elegir un modelo marino dentro de su dominio y especificar celda iluminada/polarización. Mantener incertidumbre explícita cuando falten medidas ambientales; no inventar σ⁰ ni SCV para recuperar balance.
5. Para lluvia, obtener ley de gotas o `Z–R` de un régimen declarado y validar la conversión a `η`, incluyendo límites no Rayleigh. Después, modelar volumen/espectro y procesado; evitar duplicar la ganancia ya incluida en los alcances publicados.

Se accedió al texto de Hensoldt, APA, Missilery, CRS, MathWorks y NOAA citado aquí. Los 403/404 se registran como restricciones de consulta, no como inexistencia de documentación. No se usaron bases de juegos para completar datos físicos sin fuente, ni fragmentos de productos relacionados para atribuir especificaciones a otro radar.
