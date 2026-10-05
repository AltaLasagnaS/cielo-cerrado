# Ampliación seleccionada de armas, montajes y radares

5-oct-2026, datos de CMO suministrados por el usuario; confianza **media-baja**, sin modificar el catálogo activo. La selección adicional compara **58 registros por build**: 20 armas, 21 montajes y 17 sensores en DB3K **496, 512, 514 y 515**. La revisión inicial de 29 registros permanece idéntica. No se redistribuyen bases completas ni fichas comerciales completas.

Datos: [`db3k-expansion-review.json`](../data/db3k-expansion-review.json). Cada registro conserva archivo/build declarado, SHA-256, tabla/ID, presencia, campos crudos, columnas ausentes y asociaciones. El build todavía se identifica por el nombre suministrado; `verifiedInternalBuild=null`. Nombres y fechas de CMO son afirmaciones del juego, no certificación histórica ni disponibilidad de una fuerza concreta.

## Cola de variantes y componentes

| Grupo | Armas seleccionadas (IDs del juego) | Montajes/sensores para revisar | Condición antes de activar |
|---|---|---|---|
| S-125 | 5V27/V-601P `1832`; 5V27D/V-601PD `2333` | Quad Rail `320`, `2012`; SNR-125 ya revisado inicialmente | No fusionar Neva-M/M1 ni modernizaciones; especificar control, operador/época y perfil de vuelo |
| S-200 | 5V28 `512` | Single Rail `115`; 5N62 `963` | Radar CW/FMCW real requiere fuente; el flag CMO no acredita su procesado |
| Stinger | FIM-92A `1673`, B `735`, E `496`, J `3898` | Montajes MANPADS `1475/1476/1478/3729` | Misiles/versiones separadas, sensor/espoleta/carga/fecha propios; no convertir un Avenger en equipo portátil |
| Igla | 9M313 `1153`, 9M39 `1154` | MANPADS `1482/1483` | Igla-1 e Igla no equivalentes; requerir parámetros propios, no heredar Stinger |
| RBS 70 | Rayrider Mk2 `877`, BOLIDE `1324`, etiqueta «RB 70 NG» `4075` | Montajes `51/128/3725`; Giraffe AMB `2991` aparte | NG es sistema de puntería/familia, no identidad suficiente de un misil; guía por haz láser real distinta del flag SALH de CMO |
| Buk | 9M317 `1144`, 9M317M `2970` | TELAR `959/2556`, LLV `2557`; 9S35 `960`, 9S18M1 `2611` | Buk-M1-2/M3 distintos de M1; LLV de 12 no es TELAR de 12. Qué misil admite cada radar/control sigue condicionado |
| Tor | 9M331 `71`, 9M338K `3123` | TELAR `139/2473` | Cargas distintas del juego (8/16); nombres de chassis/control/version deben verificarse |
| Pantsir | 57E6 `2740`, registro S2 `4281` | Montajes `2282/3980` | Misma denominación de misil no prueba perfil idéntico. Capacidad total incluye munición de cañón, no sólo SAM |
| NASAMS | AMRAAM-ER `3842` | Montaje NASAMS III `3431`; MPQ-64F1 `5028`, A4 `5901` | F1 y A4 no equivalentes, ni cualquier AMRAAM aire-aire es el tiro terrestre. Operador/época/enlace específicos |
| SAMP/T | Aster 30 B1NT `3774` | Aster TEL `3381`; Arabel `1971` | Asociación de montaje en CMO no certifica control de tiro Arabel/B1NT ni configuración SAMP/T NG |
| Búsqueda soviética/ucraniana | — | P-18 `2693`, P-19 `2697`, P-14 `412`, 36D6 `632`, 36D6M `7378`, Flap Lid A/B `2634/974` | Alturas, bandas, MTI y versiones por radar; no todos los radares de búsqueda producen calidad de tiro |
| Gepard / S-400 | — | Adquisición/seguimiento Gepard `3198/989`; «Grave Stone [92N2]» `4155` | No unir dos radares en uno; el rótulo 92N2 del juego no se renombra automáticamente a 92N6 |

El registro 9M317M repite uno inicialmente seleccionado para conservar su asociación explícita con TELAR/LLV en esta cola. Eso no crea dos identidades físicas de munición.

## Hallazgos que evitan importaciones incorrectas

1. **Pantsir:** montaje `2282` en 515: `Capacity=40`, pero `weaponRecords` contiene **28 ráfagas de cañón de 50 proyectiles + 12 misiles 57E6**. No cargar 40 SAM ni confundir las 28 unidades de ráfaga con 28 proyectiles. El S2 `3980` mantiene registros separados. Son cargas de juego; la capacidad real requiere corroboración.
2. **Buk-M3:** el juego distingue `2556` TELAR de seis 9M317M y `2557` LLV de doce. Un LLV no obtiene control de tiro propio por tener más munición. No asignar sus canales al TELAR por copia.
3. **RBS 70:** los registros `877/1324/4075` enlazan un sensor etiquetado **SALH Seeker**. Eso no acredita guiado semiactivo por reflejo. [Saab, fuente primaria](https://www.saab.com/products/rbs-70-ng), leído completo el 5-oct-2026, dice **laser beam riding missile** en la cronología de RBS 70 y guía láser en NG; Stinger/Igla aparecen con **IR Seeker** en CMO. No traducir la etiqueta SALH al motor ni equiparar todos los MANPADS.
4. **Radar:** `sensorCodes` preserva etiquetas CMO de Pulse Doppler, CW, PESA, etc. El 5N62 aparece como «Pulse-Only» + «Weapon FCR (No CW Illumination)»; eso no refuta las descripciones técnicas CW/FMCW de APA. El número de pulsos integrados, ganancia sub-clutter y permanencia en el blanco siguen **no encontrados**. `ScanInterval` no es permanencia.
5. **Ausencia por build:** `4281` (arma Pantsir S2), `3980` (montaje S2) y `7378` (36D6M) no existen en 496 y sí en las tres bases posteriores. Se mantienen ausentes, sin copiar datos desde 515. Hay 29 diferencias de registro entre builds consecutivos; no equivalen a 29 cambios físicos reales.
6. **Motor/gimbal:** `BurnoutTime=0` en las bases posteriores no prueba un motor sin combustión; columna ausente permanece `null`. El ancho de haz del seeker no da gimbal, aceleración lateral ni velocidad media. `normalizedPhysicalParameters`, gimbal y aceleración terminal siguen `null`; todos los registros `runtimeEnabled=false`.

La página actual de Saab publica, para NG, alcance efectivo **>9000 m**, cobertura **0–5000 m**, despliegue **45 s**, recarga portátil **<5 s** y velocidad máxima BOLIDE **Mach 2**. Se registran aquí como **límites/descriptores publicados de esa página actual**, sin convertir Mach a m/s sin condición atmosférica, sin interpretar máxima como media, sin inventar distribución UNC y sin retrotraer capacidades a versiones/operadores anteriores. La página incluye la evolución Bolide 2; hay que fijar la configuración antes de aplicar una cifra. Las rutas consultadas de MBDA B1NT y Army Sentinel A4 dieron 404: no son evidencia positiva.

## Reproducir

```bash
python research/read-db3k.py --profile expansion \
  --database 496=/ruta/DB3K_496.db3 \
  --database 512=/ruta/DB3K_512.db3 \
  --database 514=/ruta/DB3K_514.db3 \
  --database 515=/ruta/DB3K_515.db3 \
  --output data/db3k-expansion-review.json
```

Lectura SQLite `mode=ro`, `query_only`, `trusted_schema=OFF`, sin extensiones ni ejecución del contenido. La selección y campos son explícitos, no búsquedas difusas que elijan el primer nombre parecido. No se adivinan unidades ni se calcula Pk. `--profile initial` reproduce exactamente el archivo anterior. Las pruebas distinguen ausencia, carga mixta, identidad y códigos duplicados; no certifican fidelidad militar por validar un JSON.

## DBInfo.dat: estado de recuperación

El usuario pidió descifrar el archivo. [`dbinfo-envelope-review.json`](../data/dbinfo-envelope-review.json) y `research/inspect-dbinfo.py` preservan el diagnóstico reproducible: **59.592 bytes ASCII Base64**, **44.692 bytes decodificados**, longitud inicial little-endian **16**, carga **44.672 bytes**, múltiplo de 16 y entropía **7,9962 bits/byte**. Compatible con un contenedor .NET de IV+cifrado en bloques, pero **no confirma algoritmo/derivación ni recupera el texto**. Base64 no es descifrado.

No se encontró el lector/clave en las bases SQLite ni en los archivos adjuntos inspeccionados. La siguiente dependencia es la biblioteca o ejecutable que lee el archivo (por ejemplo `Command_Core.dll`/`Command.exe`, si forman parte de esa instalación), o una exportación legible desde la aplicación. No se ha ejecutado ningún binario ni adivinado una clave. Mientras no se pueda verificar el contenido, no usar DBInfo para afirmar hashes/versiones internas ni llenar `verifiedInternalBuild`.
