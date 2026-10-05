# Datos de física: niebla, nieve, visores y viento

Consulta: 5 de octubre de 2026. Investigación para Claude, sin cambios al motor, a `UNC` ni a archivos generados. Base `main` tras #53.

## Resultado

- **Nubes/niebla:** norma primaria ITU-R P.840-9 y cálculo reproducible de atenuación específica para frecuencias representativas S/C/X/Ku. Hace falta temperatura y agua líquida; una etiqueta «niebla» no basta.
- **Nieve seca/húmeda:** no encontrado un coeficiente por banda respaldado por fuente primaria leída que permita parametrizar los escenarios solicitados. No reutilizar automáticamente lluvia o niebla.
- **Visores:** manuales históricos de Stinger e Igla confirman el límite de adquisición/identificación visual de noche o con tiempo adverso. No publican en los apartados examinados una tabla de alcance día/noche/lluvia por visor exacto.
- **Viento:** se descargaron datos mensuales públicos de **NOAA IGRA para Kyiv**, y se calculó un perfil de componentes medias con interpolación declarada. Es climatología local incompleta, **no un viento operativo ni una media representativa de toda Ucrania**.

## Nubes y niebla: fuente primaria y unidades

[C1], **ITU-R P.840-9, *Attenuation due to clouds and fog***, agosto 2023 (PDF vigente con nota de enmiendas editoriales 2026), anexo 1 §§1–2, pp. impresas 2–3. Tipo: recomendación técnica primaria; confianza **alta** en las ecuaciones/unidades y **condicional** para aplicar a un escenario.

Para gotas pequeñas de agua líquida bajo la aproximación Rayleigh:

```text
gamma_c(f, T) = K_l(f, T) * rho_l

gamma_c: dB/km
K_l:     (dB/km)/(g/m³)
rho_l:   densidad de agua líquida, g/m³
f:       GHz
T:       temperatura del agua líquida, K
```

El ámbito general declarado es **1–200 GHz**; el anexo formula la aproximación para gotas pequeñas y frecuencias hasta **200 GHz**. No es una ley de extinción óptica ni de nieve sólida. La temperatura importa: no introducir grados Celsius donde la fórmula exige kelvin.

### Tabla por banda: ejemplo calculado, no constante de banda

Todas las cifras siguientes son **cálculo propio de [C1], ecuaciones (1)–(10), p. 3**, con **T = 273,15 K** como condición elegida. Frecuencias elegidas representativas, no promedio de banda ni asignación automática de cada radar. Confianza **alta aritmética / media condicional de aplicación**, siempre que se cumplan las hipótesis y se conozca el medio.

[C1], p. 2, da como densidades orientativas de niebla **0,05 g/m³** y **0,5 g/m³**. Se usan aquí sólo como dos ejemplos; no como mediciones de Kyiv u Odesa.

| Banda, frecuencia de ejemplo | K_l, (dB/km)/(g/m³) | γ para ρ_l = 0,05 g/m³, dB/km | γ para ρ_l = 0,5 g/m³, dB/km |
|---|---:|---:|---:|
| S, **3 GHz** | 0,00840753 | 0,000420376 | 0,00420376 |
| C, **6 GHz** | 0,0335369 | 0,00167684 | 0,0167684 |
| X, **10 GHz** | 0,0925504 | 0,00462752 | 0,0462752 |
| Ku, **15 GHz** | 0,205626 | 0,0102813 | 0,102813 |

La pérdida de un trayecto debe integrar la atenuación sobre el tramo realmente dentro de la nube/niebla. En un radar monostático el eco atraviesa ida y vuelta; no confundir atenuación de un enlace unidireccional con la del eco. Tampoco usar todo el alcance del radar como espesor de niebla sin geometría.

La fórmula de trayecto inclinado Tierra-espacio de P.840 utiliza agua integrada en columna y ángulo de elevación; **no aplicarla sin adaptación a un trayecto horizontal o casi horizontal**. La tabla calcula atenuación *específica*, no reducción universal de alcance ni probabilidad de derribo.

### Cálculo reproducible de la tabla

Transcripción funcional de [C1], ecuaciones (2)–(10); los coeficientes pertenecen a esa formulación y sus unidades. No se ejecutó el motor del simulador ni una biblioteca ITU externa para obtener la tabla.

```python
def cloud_kl(f_ghz, temperature_k):
    theta = 300 / temperature_k - 1
    eps0 = 77.66 + 103.3 * theta
    eps1 = 0.0671 * eps0
    eps2 = 3.52
    fp = 20.20 - 146 * theta + 316 * theta**2
    fs = 39.8 * fp
    real = ((eps0 - eps1) / (1 + (f_ghz / fp)**2)
            + (eps1 - eps2) / (1 + (f_ghz / fs)**2) + eps2)
    imag = (f_ghz * (eps0 - eps1) / (fp * (1 + (f_ghz / fp)**2))
            + f_ghz * (eps1 - eps2) / (fs * (1 + (f_ghz / fs)**2)))
    eta = (2 + real) / imag
    return 0.819 * f_ghz / (imag * (1 + eta**2))

for frequency in (3, 6, 10, 15):
    kl = cloud_kl(frequency, 273.15)
    print(frequency, kl, kl * 0.05, kl * 0.5)
```

## Nieve: tabla de huecos

| Medio / bandas solicitadas | Coeficiente primario utilizable encontrado | Estado y dónde se buscó |
|---|---|---|
| Nieve **seca**, S/C/X/Ku | **No encontrado** | [C1] modela agua líquida; [C2] lluvia. Ninguno certifica una ley de nieve seca por banda en esta entrega. |
| Nieve **húmeda**, S/C/X/Ku | **No encontrado** | Igual; faltan distribución de partículas, contenido/fase de agua, temperatura y condiciones del dato. |
| Nieve depositada en antena/radomo | **No encontrado** | No confundir pérdidas del radomo/antena con atenuación atmosférica distribuida. |

[C2], ITU-R P.838-3, es el modelo específico de **atenuación de lluvia**, no reflectividad radar de nieve ni prueba de que nieve y lluvia de igual tasa tengan la misma pérdida. Quedan desconocidos los coeficientes de nieve; no rellenarlos con cero ni con los de lluvia. Consulta limitada a las recomendaciones accesibles y referencias meteorológicas del proyecto; no se presenta como revisión exhaustiva de literatura de nieve.

## Tabla por visor / equipo

Se distinguen detección, identificación, adquisición del buscador y alcance del arma. **NF = no encontrado** un alcance con blanco, atmósfera y configuración declarados. Un misil IR no entrega automáticamente una imagen térmica al operador.

| Equipo / variante | Día: alcance de detección/identificación | Noche | Lluvia | Evidencia y confianza |
|---|---|---|---|---|
| **Grupo móvil**, óptica/térmica no identificada | **NF** | **NF** | **NF** | Sin modelo de visor y blanco no se puede atribuir una ficha. Los alcances del juego son supuestos, no resultados de esta búsqueda. |
| **Stinger** histórico del manual | **NF** como tabla por visor/blanco | **NF** cuantitativo; manual restringe operaciones por capacidad de ver/identificar | **NF** cuantitativo; misma limitación con tiempo adverso | [C3], manual primario, cap. 1 «System Description», PDF p. 6; **alta** para limitación descrita, no para variantes/sights modernos. |
| **Igla** del manual brasileño histórico | **NF** como tabla de sensor | **NF** cuantitativo; requiere observación visual y puntería del blanco | **NF** cuantitativo | [C4], manual primario, p. impresa **4-14 / PDF 46**, condición nocturna; **alta** para esa edición, no heredar Igla-S ni visor añadido. |
| **RBS 70 / RBS 70 NG** | **NF** por visor exacto y condiciones | **NF** | **NF** | [C5], fichas Saab bloqueadas. No mezclar visor original, mejoras nocturnas y NG; alcance del misil no es alcance de identificación térmica. |
| **Piorun**, configuración de visor no fijada | **NF** | **NF** | **NF** | [C6], ruta fabricante MESKO bloqueada; no certificar visor/alcance sin contenido primario leído. |

Los manuales C3/C4 son evidencia cualitativa de una limitación distinta de la envolvente cinemática. No proporcionan una pérdida universal para «noche» o «lluvia» aplicable a todas las armas. Un visor térmico puede verse afectado por temperatura/contraste del blanco, fondo, transmisión en su ventana espectral, tamaño angular y umbral de identificación. No convertir atenuación de microondas de [C1] en alcance de un visor IR.

## Viento: datos de Kyiv y cálculo derivado

**Fuente primaria [C7]: NOAA NCEI, Integrated Global Radiosonde Archive (IGRA v2.2)**, medias mensuales `ghgt`, `uwnd`, `vwnd` a **00 UTC**, estación **UPM00033345 / KYIV**. [C8], lista de estaciones, publica **50,3918° N, 30,5356° E, elevación 167,0 m**. Tipo: observaciones meteorológicas institucionales; confianza **alta** en identidad/unidades, **media** para la representatividad climatológica de esta derivación.

Se descargaron los archivos completos de período de registro y se filtró la ventana **1991–2020**. Se retuvieron únicamente meses con las tres variables en todos estos niveles de presión: **925, 850, 700, 500, 400, 300, 250 y 200 hPa**. [C7], descripción de formato, exige al menos **10 observaciones** para publicar una media mensual y codifica viento en **décimas de m/s**, altura geopotencial en **m**. Esos umbrales y unidades son de la fuente, no elegidos para ajustar el juego.

Quedaron **337 meses comunes**, no una normal completa de todos los meses de la ventana. No se detectaron claves duplicadas ni valores inválidos en los subconjuntos descargados. Se interpolaron **u y v de cada mes**, linealmente entre alturas geopotenciales; después se promediaron los meses con igual peso. Para alturas solicitadas sobre el terreno se sumó la elevación **167 m** como aproximación: altura geopotencial y altura geométrica no son idénticas. No se extrapoló fuera de los niveles disponibles.

### Tabla por altura solicitada

Todas las cifras siguientes: **cálculo propio sobre [C7–C8]**, unidades **m/s**, confianza **media condicional**. **u positiva hacia el este**, **v positiva hacia el norte**. No son números publicados como tabla por NOAA; la interpolación y agregación son las declaradas arriba.

| Altura sobre estación | u media, m/s | v media, m/s | Norma del vector medio, m/s | Meses | Estado |
|---|---:|---:|---:|---:|---|
| **0 km** | `null` | `null` | `null` | — | **No encontrado** un perfil superficial comparable completo en este procesamiento; no extrapolar desde altura. |
| **1 km** | +2,451 | −0,579 | 2,519 | 337 | Interpolado, no medida directa a altura fija. |
| **3 km** | +4,715 | −0,600 | 4,753 | 337 | Igual. |
| **5 km** | +6,633 | −0,687 | 6,669 | 337 | Igual. |
| **10 km** | +10,759 | −1,750 | 10,900 | 337 | Igual; nivel 200 hPa permite acotar alturas sobre 250 hPa cuando es necesario. |

**La norma del vector medio no es la velocidad media del viento.** Vientos de direcciones opuestas se cancelan al promediar componentes. Tampoco se recuperan ráfagas o percentiles instantáneos a partir de medias mensuales. Usar esta norma como «viento típico de un día» subestimaría la variabilidad. No reemplazar automáticamente el clima del simulador por esos valores.

La superficie sí tiene algunos registros mensuales, pero la intersección de altura/u/v superficial de la ventana es **126 meses**, termina en **mayo de 2006** y tiene otra cobertura que los niveles altos. Por eso se deja `null` en la fila comparable, en vez de mezclar períodos bajo una etiqueta de normal completa.

Meses ausentes de la intersección alta: todo **1991**, **ene–abr 1992**, **dic 1997**, **jul/dic 2010** y **ene–abr 2011**. Los meses de calendario quedan desigualmente representados. Es dato local nocturno, sin homogenización adicional, no una climatología nacional ni garantía del perfil actual en combate.

### Reproducir el perfil

Descargar los tres ZIP [C7] a una carpeta y ejecutar allí este código. Se dejan URL y huellas debajo para identificar la consulta, porque el archivo NOAA se actualiza. El código no descarga nada, no necesita credenciales y no modifica el repositorio.

```python
import math
from zipfile import ZipFile

records = {}
for variable in ('ghgt', 'uwnd', 'vwnd'):
    with ZipFile(f'{variable}_00z-mly.txt.zip') as archive:
        for member in archive.namelist():
            with archive.open(member) as stream:
                for raw in stream:
                    if not raw.startswith(b'UPM00033345'):
                        continue
                    station, year, month, level, value, count = raw.decode().split()
                    year, month, level = int(year), int(month), int(level)
                    if not 1991 <= year <= 2020 or int(count) < 10:
                        continue
                    divisor = 1 if variable == 'ghgt' else 10
                    records.setdefault((year, month, level), {})[variable] = int(value) / divisor

levels = (925, 850, 700, 500, 400, 300, 250, 200)
months = sorted({(year, month) for year, month, level in records
                 if all(len(records.get((year, month, p), {})) == 3 for p in levels)})
for height_agl in (1000, 3000, 5000, 10000):
    target = height_agl + 167
    values = []
    for year, month in months:
        points = sorted((records[year, month, p] for p in levels), key=lambda x: x['ghgt'])
        for lower, upper in zip(points, points[1:]):
            if lower['ghgt'] <= target <= upper['ghgt']:
                fraction = (target - lower['ghgt']) / (upper['ghgt'] - lower['ghgt'])
                values.append(tuple(lower[v] + fraction * (upper[v] - lower[v])
                                    for v in ('uwnd', 'vwnd')))
                break
    u, v = (sum(x[i] for x in values) / len(values) for i in (0, 1))
    print(height_agl, len(values), u, v, math.hypot(u, v))
```

Huellas **SHA-256 de los ZIP descargados el 5-oct-2026**; no se redistribuyen esos archivos en el repo:

| Archivo de [C7] | SHA-256 |
|---|---|
| `ghgt_00z-mly.txt.zip` | `092b6c17b9820f25c27d17f05329a5c66c9c8b6a922c59c2d69d5a6bbec63e91` |
| `uwnd_00z-mly.txt.zip` | `8e67f3c426caa265ad0b3ce367533690d5508d186042a06fcc3bf05dd00fff8f` |
| `vwnd_00z-mly.txt.zip` | `47e9a956b35b7365e8511555fb7567d0d8490e90f49270d113353580aa464733` |

Para extender el dato a Odesa/Járkov y a horas diurnas, consultar otras estaciones/12 UTC y separar estaciones y temporadas, sin rellenar huecos con Kyiv. **ERA5** [C9] ofrece componentes de viento en niveles de presión/superficie como alternativa de reanálisis; se leyeron fichas de conjuntos, **no se descargaron sus campos ni se obtuvieron números ERA5** en esta entrega. Presión y altura fija tampoco son equivalentes sin transformación.

## Fuentes

- **[C1] Norma técnica primaria, leída:** ITU-R, *Recommendation P.840-9 — Attenuation due to clouds and fog*, agosto 2023, anexo 1 §§1–3, pp. impresas 2–4. [PDF oficial](https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.840-9-202308-I!!PDF-E.pdf). Condiciones/unidades explícitas; tabla propia calculada, sin redistribuir el PDF.
- **[C2] Norma técnica primaria, leída:** ITU-R, *Recommendation P.838-3 — Specific attenuation model for rain for use in prediction methods*, marzo 2005, título/alcance y formulación de lluvia. [PDF oficial](https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.838-3-200503-I!!PDF-E.pdf). No coeficientes de nieve ni de extinción óptica.
- **[C3] Manual primario histórico, leído en la sección citada:** US Army, *FM 44-18-1, Stinger Team Operations*, 31-dic-1984, cap. 1, «System Description». [Copia pública PDF](https://archive.org/download/FM_44_18_1_S_T_O_1984/FM%2044-18-1%20Stinger%20Team%20Operations%20%281984%29.pdf), p. PDF 6. La copia está maquetada desde GlobalSecurity; no mantiene paginación original de libro. No transferir alcance a un visor moderno.
- **[C4] Manual primario histórico, leído en apartados pertinentes:** Exército Brasileiro / Estado-Maior, *C 44-62 — Serviço da Peça do Míssil Igla*, primera edición 2000, aprobación Portaria 015-EME, p. impresa 4-14 / PDF 46, condición de observación visual nocturna. [PDF público](https://archive.org/download/C44-62-Manual-ServicoDaPecaDoMissilIgla-1Edicao-2000-Portaria015EME/C44-62_Manual_ServicoDaPecaDoMissilIgla_1Edicao_2000_Portaria015EME_2b6208f.pdf).
- **[C5] Fabricante, acceso bloqueado 403:** Saab, [RBS 70](https://www.saab.com/products/rbs-70) y [RBS 70 NG](https://www.saab.com/products/rbs-70-ng). Sin especificación cuantificada nueva verificada.
- **[C6] Fabricante, ruta bloqueada 403:** MESKO, [ruta Piorun](https://www.mesko.com.pl/en/products/anti-aircraft-missile-systems/piorun-man-portable-air-defence-system). No se certifica contenido de ruta no leída.
- **[C7] Datos y formato institucionales primarios, descargados/leídos:** NOAA NCEI, IGRA, [formato mensual v2.2](https://www.ncei.noaa.gov/pub/data/igra/monthly/igra2-monthly-format.txt), §§notas y definición de variables; [altura geopotencial 00 UTC](https://www.ncei.noaa.gov/pub/data/igra/monthly/monthly-por/ghgt_00z-mly.txt.zip), [viento zonal 00 UTC](https://www.ncei.noaa.gov/pub/data/igra/monthly/monthly-por/uwnd_00z-mly.txt.zip), [viento meridional 00 UTC](https://www.ncei.noaa.gov/pub/data/igra/monthly/monthly-por/vwnd_00z-mly.txt.zip). Filtrado por estación/año/mes/nivel; no tabla precalculada por NOAA a alturas del juego.
- **[C8] Metadatos institucionales primarios, leídos:** NOAA NCEI, [lista IGRA de estaciones](https://www.ncei.noaa.gov/pub/data/igra/igra2-station-list.txt), fila UPM00033345 KYIV. Elevación y coordenadas de la estación.
- **[C9] Fichas institucionales de reanálisis, leídas, sin descarga de campos:** Copernicus CDS, [ERA5 monthly means, pressure levels](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-pressure-levels-monthly-means?tab=overview) y [single levels](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means?tab=overview). Alternativa pendiente; no se presenta como perfil ya medido.

Las pérdidas ópticas o del tiempo de los juegos no se usaron como mediciones físicas. Los datos derivados conservan sus condiciones; su incorporación al modelo y la definición de incertidumbre quedan a Claude.
