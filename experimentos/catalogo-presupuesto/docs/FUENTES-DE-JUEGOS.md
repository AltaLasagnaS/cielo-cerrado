# Fichas de CMO y Fleet Command como base secundaria

Revisión del 5 de octubre de 2026. El usuario autorizó usar datos de los juegos
como base de confianza media-baja para ampliar variantes. Cada cifra conserva
su procedencia; una contradicción sigue pendiente aunque la fuente sea útil.

## Qué contienen los archivos recibidos

| Archivo | Contenido comprobado | Uso |
| --- | --- | --- |
| `DB3K_442.txt` | Índice de nombres e IDs por sección; UTF-16 | Descubrir variantes y componentes. No contiene prestaciones completas. |
| `CWDB_442.txt` | Índice de la base de Guerra Fría | Identificación; no se cruza por ID con DB3K. |
| `Descriptions.7z` | Fichas de texto de DB3000 y CWDB | Prestaciones reportadas y citas bibliográficas. No se pudo identificar el build. |
| `database.7z` de Fleet Command | Siete tablas binarias; se reconocen nombres en las cadenas | Identificación preliminar. Unidades y estructura numérica todavía no verificadas. |
| `DBInfo.dat` | Texto Base64 que decodifica a 44.692 bytes sin cabecera de formato reconocida | Conservado; contenido y versión no interpretados. |
| `DB.7z` | La descarga fue rechazada por superar 32 MiB | Sin inspeccionar. Requiere archivos extraídos o partes menores al límite. |
| `CWDB_512.db3` | SQLite legible, con tablas y asociaciones de componentes | Permite consultas precisas. `512` procede del nombre suministrado; no de metadatos internos verificados. |

El archivo moderno `DB3K_*.db3`/`DB3000_*.db3` permitiría consultar directamente
las configuraciones modernas. No hace falta enviar imágenes, sonidos o el
ejecutable del juego para investigar estas tablas.

**Actualización:** llegaron bases modernas comprimidas y se pudieron consultar
496/512/514/515. Ver [configuraciones y comparación por versión](BASES-DB3K-RECIBIDAS.md).

## Datos revisados disponibles

[game-source-review.mjs](../data/game-source-review.mjs) conserva trece fichas,
sus hashes, localizadores de las afirmaciones y limitaciones. Valores siguientes
son **afirmaciones del juego**, no mediciones verificadas. `null` significa
desconocido, contradictorio o identificación insuficiente.

| Ficha | Velocidad reportada, m/s | Envolvente aérea reportada, km | Límite TBM, km | Alturas reportadas, m |
| --- | ---: | --- | ---: | --- |
| GEM-T, archivo 642 | 1190 | 3–160 | null | 60–32000 |
| PAC-3 ERINT, archivo 1150 | 1715 | 2,9632–79,636 | 40,744 | 60,0456–24079,2 |
| PAC-3 MSE, archivo 3207 | 1715 | 2,9632–120,38 | 59,264 | null |
| 5V55K | 1700 | 5,0004–46,3 | null | 25–25000 |
| 5V55KD | 1700 | 5,0004–87,044 | null | 25–25000 |
| 5V55R | 1700 | 5,0004–75,006 | null | 25–25000 |
| 5V55RUD | 1700 | 5,0004–75,006 | null | 25–25000 |
| Buk original, archivo 652 | 850 | 5–30 | null | null |
| Buk-M1, archivo 1147 | null | 3–35 | null | 15–22000 |
| Buk, archivo 2970, identificación pendiente | null | null | null | null |
| 48N6 | 2000 | 5–150 | null | 10–27000 |
| 48N6E | 2000 | 5–150 | null | 10–27000 |
| 48N6E2 | 2000 | null | 40 | 10–27000 |

Conversiones dimensionales: 1 milla náutica = 1,852 km; 1 pie = 0,3048 m;
1 nudo = 1852/3600 m/s. Los decimales resultantes reflejan la conversión,
no una precisión física adicional. Se conserva el contexto aire/TBM; el mínimo
aéreo no se convierte automáticamente en mínimo contra balísticos.

Recargas reportadas: Patriot 30–60 minutos; los dos Buk de archivos 652/1147,
13–15 minutos. Son intervalos de la ficha y no plazos garantizados para cualquier
emplazamiento, dotación o logística.

## Contradicciones que impiden copiar directamente

- El índice 442 llama GEM+ al ID 642; la descripción lo llama GEM-T. Build e
  identidad común pendientes. PAC-3 ERINT tampoco identifica por sí solo CRI.
- PAC-3 MSE: 118.000 ft equivalen a 35.966,4 m, pero el mismo texto dice
  32.000 m. Se conserva altura `null`.
- Buk-M1: 2.332 nudos equivalen a 1.199,68 m/s, pero la ficha dice 850 m/s.
  Se conserva velocidad `null`.
- Buk original: altura `20,0000 m` frente a 65.616 ft. El error tipográfico
  no se corrige con una cifra elegida sin evidencia.
- Archivo 2970: nombre, guía y alcance no permiten atribuir los datos a una
  variante exacta de Buk-M3. Todas las prestaciones quedan pendientes.
- 48N6E2: 81 nm equivalen a 150,012 km, frente a 195 km en el paréntesis.
  El alcance aéreo queda `null`.

[game-index-review.mjs](../data/game-index-review.mjs) separa 33 referencias:
10 lanzadores/mounts, 15 sensores y 8 armas. Las etiquetas M901/MSE de 8, 12
y 14 misiles describen el índice del juego; no acreditan qué lanzador físico
admite MSE, ni prueban una carga mixta. `realLauncherCapacity` permanece `null`.
Los IDs siempre incluyen base, build y sección. No se unen las descripciones
de build desconocido al índice 442 por igualdad del número.

## Consulta inicial de CWDB_512.db3

Lectura SQLite en modo de solo lectura: 1.856 armas, 2.619 sensores,
1.552 mounts, 2.406 instalaciones y 4.934 registros de cargas. Estos conteos
son del archivo recibido; no corresponden a DB3K 442.

El sensor `DataSensor.ID=234` se llama `Low Blow [SNR-125]`. Su tabla de códigos
lo etiqueta `Pulse-Only Radar` y `Continuous Wave Illumination`. Esto no es una
segunda fuente técnica independiente para MTI ni una cuantificación de SCV.
`RadarPRF`, `RadarPulseWidth` y `RadarPeakPower` aparecen en cero: el esquema
define cero como valor inicial y no permite tratarlo como potencia o frecuencia
físicamente nula. Pulsos de integración y mejora subclutter siguen pendientes.

Hay armas diferenciadas `SA-3a Goa [5V24, V-600P]` (ID 168), `SA-3b Goa
[5V27, V-601P]` (ID 16) y `SA-3c Goa [5V27D, V-601PD]` (ID 1010). Son buenos
candidatos para investigar configuraciones por variante con sus asociaciones.

SHA-256 del `.db3` recibido:
`4a4ba98ecad165268b4df488b50099b77fb6b3759fd0e70839a922ae22ea2ce4`.
SHA-256 de `DBInfo.dat`:
`6d29f1bee13b4f4f6cca3447524a79e8fc80c733397d2bce9ce1b080f96f64c5`.

## Cómo llevarlo al simulador

La velocidad de una ficha no acredita `vInt` (velocidad media hasta el alcance
máximo), `vmax` ni tiempo de aceleración `tb`. El límite de alcance tampoco
define una curva de energía ni una probabilidad de derribo. Las Pk genéricas
de las fichas no se asignan a todas las clases de blanco.

La siguiente entrega debe mapear cada campo usando su significado y unidad,
documentar qué es dato de juego y qué es una hipótesis nueva, y contrastar las
configuraciones con fuentes técnicas disponibles. Se pueden implementar
estimaciones explícitas y reproducibles autorizadas por el usuario; esta matriz
no las introduce silenciosamente ni modifica `src/`.

Las referencias bibliográficas dentro de una ficha son pistas para investigar.
Una ficha que cita Jane's no equivale a haber consultado Jane's ni constituye
una segunda fuente independiente de otra ficha derivada de ella.

## Reproducción y verificación

Los scripts leen archivos suministrados y generan únicamente la matriz de
hechos revisados; no se publica la base ni sus descripciones completas:

```sh
python experimentos/catalogo-presupuesto/research/review-game-sources.py RUTA/Descriptions/DB3000 --output /tmp/game-source-review.mjs
python experimentos/catalogo-presupuesto/research/read-game-index.py RUTA/DB3K_442.txt --output /tmp/game-index-review.mjs
python experimentos/catalogo-presupuesto/research/inspect-cwdb.py RUTA/CWDB_512.db3 --output /tmp/cwdb-schema-review.json
node experimentos/catalogo-presupuesto/scripts/check.mjs
node --test experimentos/catalogo-presupuesto/tests/*.test.mjs
```

Los hashes fijan las interpretaciones a los archivos revisados. Un archivo
cambiado exige una revisión nueva. Las pruebas verifican conversión de unidades,
desconocidos, namespace y bloqueo de activación accidental; no certifican las
prestaciones militares.
