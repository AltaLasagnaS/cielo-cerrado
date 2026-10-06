# Bases DB3K: configuraciones y comparación por versión

Revisión del 5 de octubre de 2026. Se inspeccionaron los archivos **496, 512,
514 y 515**; no se afirma haber revisado todas las versiones subidas. La 515
es la más reciente por nombre en este lote. Los números de build proceden del
nombre suministrado, con hash por base; no se han certificado mediante un
metadato interno. No se redistribuyen las bases.

## Lectura comprobada

Las cuatro bases son SQLite legible. Los comprimidos de 7–14 MB sí se pueden
descargar; que una base extraída ocupe 60 MB no infringe el límite de transferencia
del adjunto. Se verificaron rutas y tamaño antes de extraer, y se consultaron en
modo de solo lectura.

| Build por nombre | Armas | Mounts | Sensores |
| --- | ---: | ---: | ---: |
| 496 | 3954 | 3510 | 6667 |
| 512 | 4419 | 4115 | 7227 |
| 514 | 4449 | 4154 | 7251 |
| 515 | 4472 | 4190 | 7304 |

[db3k-versions-review.json](../data/db3k-versions-review.json) conserva una
selección de **14 armas, 9 mounts y 6 sensores por build**, con nombres,
campos crudos y asociaciones. Cada ID está delimitado por tabla y build;
los hashes fijan los archivos consultados.

## Cargas que declara el juego

Consulta `DataMountWeapons → DataWeaponRecord → DataWeapon`, build 515:

| Mount ID | Etiqueta del mount | Munición del registro | Carga inicial / máxima del registro |
| --- | --- | --- | --- |
| 388 | Patriot M901 | PAC-2 GEM, arma 994 | 4 / 4 |
| 816 | Patriot M901 | PAC-2 GEM+, arma 642 | 4 / 4 |
| 963 | Patriot M901 | PAC-3 ERINT, arma 1150 | 16 / 16 |
| 2759 | Patriot M901 | PAC-3 MSE, arma 3207 | 8 / 8 |
| 2760 | Patriot M901 | PAC-3 MSE, arma 3207 | 12 / 12 |
| 2761 | Patriot M901 | MSE, arma 3207, y ERINT, arma 1150 | 6 MSE + 8 ERINT |
| 1658 | SA-10a [5P85T] TEL; comentario S-300PT | 5V55K | Ver registros de carga preservados |
| 936 | SA-10a [5P85T] TEL; comentario S-300PT-1 | 5V55KD | Ver registros de carga preservados |
| 318 | SA-10b [5P85S] TEL; comentario S-300PS | 5V55R | Ver registros de carga preservados |

Estas asociaciones son evidencia de **configuraciones del juego**, confianza
media-baja para inspirar candidatos. No certifican que el lanzador real M901
admita MSE. Tampoco convierten ERINT automáticamente en CRI ni GEM+ en GEM-T.
La base contiene un registro mixto concreto: 6+8; no se construye una mezcla
sumando máximos de otros mounts. `DataMount.Capacity` puede diferir de la suma
de registros: en el mount 2759 figura 16, aunque el registro MSE tiene máximo
8. No usar ese campo como límite físico universal del lanzador.

El comentario S-300PT identifica al candidato del juego; verificar la
designación exacta del remolque/control con fuentes técnicas. La base no
resuelve sola la configuración histórica de una batería concreta.

## Diferencias de versión encontradas en la selección

- En 496 **no existe** la columna `DataWeapon.BurnoutTime`. En las versiones
  posteriores existe y las armas seleccionadas tienen cero. Ausencia de columna
  y valor inicial cero se preservan por separado; ninguno acredita tiempo de
  aceleración `tb=0`.
- IRIS-T SLM, arma 4041: `AirRangeMax` cambia de **20** en 496 a **21,6** en
  512. Se conserva en unidades crudas; no se convierte a kilómetros sin
  verificación del significado/unidad de ese campo.
- Aster 30 Blk 1, arma 681: aparece el código `Multi-Stage Missile` en 512,
  ausente en 496. Es una diferencia de codificación del juego, no una fecha de
  cambio físico de Aster.
- Entre 512, 514 y 515 **no se encontraron cambios en los campos de esta
  selección**. Los conteos generales sí cambian. No significa que las bases
  completas sean equivalentes.

IRIS-T SLS, arma 2891, y SLM, arma 4041, se mantienen separados. Los Aster
navales de nombres PAAMS/SAAM no sustituyen automáticamente al B1 terrestre.

## Límite del buscador y corrección terminal

PAC-3 MSE y ERINT referencian el sensor 1715, `Active Radar Seeker`, con
`RadarHorizontalBeamwidth=1` y `RadarVerticalBeamwidth=1`. **Ancho de haz no
es ángulo de giro del buscador ni campo total de adquisición**. La selección
no contiene una cifra verificada de gimbal, aceleración lateral terminal,
autoridad de actuadores o tiempo remanente de corrección. Esos parámetros
permanecen `null`.

Los códigos `High Off-Boresight`, `Attitude Control - Combined` o `HOJ`
son etiquetas de capacidad del juego, no valores cuantitativos. Una maniobra
terminal requiere conocer posición/velocidad actuales del interceptor,
tiempo y margen lateral; que el blanco quede dentro del alcance global de
la batería no prueba que el misil pueda corregir hacia él.

## Reproducir

```sh
python experimentos/catalogo-presupuesto/research/read-db3k.py \
  --database 496=RUTA/DB3K_496.db3 \
  --database 512=RUTA/DB3K_512.db3 \
  --database 514=RUTA/DB3K_514.db3 \
  --database 515=RUTA/DB3K_515.db3 \
  --output /tmp/db3k-versions-review.json
node experimentos/catalogo-presupuesto/scripts/check.mjs
node --test experimentos/catalogo-presupuesto/tests/*.test.mjs
```

La lectura rechaza bases no SQLite, esquemas sin identidad o tamaño excesivo.
Columnas ausentes se registran explícitamente. El validador impide activar
registros, completar gimbal a partir del haz o certificar hardware desde cargas
del juego. Las pruebas certifican esa separación, no las prestaciones reales.
