# Catálogo de Cielo Cerrado (v0.3.0)

> **Archivo generado** por `scripts/gen-catalog-doc.mjs` a partir de `src/data/`. No lo edites a mano: cambiá los datos y corré `npm run docs`.

Cada parámetro numérico relevante tiene un **rango** (mínimo, probable, máximo), un nivel de **confianza** y su **razonamiento** con fuentes. La simulación usa el valor *probable*; el mínimo y el máximo quedan para el modo Monte Carlo. "est" significa estimación propia (física o sistemas análogos) cuando no hay un dato público directo. La metodología completa está en [DATOS-Y-FUENTES.md](DATOS-Y-FUENTES.md).

**Confianza:** *alta* = varias fuentes independientes concuerdan · *media* = una fuente seria o varias de un mismo bando · *baja* = fabricante, propaganda sin contraste o estimación propia.

## Índice

- [Amenazas](#amenazas): Shahed, Geran-3, Gerbera, Kh-101, Kalibr, 9M728, Iskander-M, Kinzhal, UMPK, Kh-22, Oniks, Tsirkon, Storm Shadow, ATACMS, Neptune, Liutyi, Flamingo
- [Defensas y sensores](#defensas-y-sensores): Patriot, Patriot GEM-T, SAMP/T, IRIS-T, NASAMS, S-300P, Buk-M1, Gepard, Grupo móvil, MANPADS, Interceptores, Hawk, S-125, S-200, Pantsir, Tor-M2, S-400, Radar 3D, Radar VHF, Acústico, Saab AEW, A-50U
- [Guerra electrónica](#guerra-electrónica): Jammer aéreo, Krasukha-4, Krasukha-2, Pole-21, Pokrova, Lima, Bukovel-AD, F-16 ECM
- [Bandas](#bandas) · [Objetivos](#objetivos) · [Calibración de Pk](#calibración-de-pk)

## Amenazas

### Shahed-136 / Geran-2

`shahed` · Rusia · Dron de ataque / señuelo · perfil `drone`

Vuela lento (≈185 km/h). Desde 2025 crucero a 2–5 km de altura para quedar fuera del alcance de ametralladoras y luego pica casi vertical sobre el blanco.

- **Guiado:** INS + GNSS con antena CRPA "Kometa-M" de 4–16 elementos
- **Propulsión:** Motor de pistón MD-550 (copia del Limbach L550E), hélice propulsora
- **Ojiva:** 50 kg (BCh-50); 90 kg (BCh-90, 62 kg de explosivo)
- **Alcance:** ≈1.350–1.800 km típico; 2.500 km máx. declarado; ≈650 km con ojiva de 90 kg
- **Costo:** Producción rusa US$20–80k (CSIS usa 35k); el precio de importación iraní era US$193k
- **Altura de vuelo:** típica 2000 m, límites reales 50–5000 m · perfiles: Bajo (2022–23) 1000 m, Alto (desde 2025) 3000 m. Volaba a 700–2.000 m en 2022–23; desde 2025, 2–5 km con picada final (Forbes, Ukrainska Pravda). Por debajo de ~50 m choca con el terreno y los cables.

- Se lanzan en oleadas de cientos por noche: 54.538 drones tipo Shahed en 2025, ~40% señuelos (ISIS).
- Neutralización mensual 83–93% entre ago-2025 y may-2026, sumando derribos y "pérdidas" por guerra electrónica (ISIS).
- Red acústica Sky Fortress (~10.000 micrófonos) para detectarlos a baja cota.
- RCS: el único estudio técnico (Járkov, 2023) da mediana 0,23 m² en todos los aspectos y ~0,05 m² de frente; la base de CMO estima mucho menos (~0,008 de frente). El juego usa el punto medio: 0,02 de frente, 0,14 de costado y 0,03 de cola.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 39 | **51** | 58 | alta | [1] [2] | 185 km/h típico; 140–150 km/h de promedio en rutas largas; 200–210 km/h a gran altura |
| Altura de vuelo (m AGL) | 50 | **2.000** | 5.000 | alta | [3] [4] [2] | 2022–23: 700–2.000 m; desde 2025: 2–5 km con picada final |
| RCS frontal (X/S) (m²) | 0,005 | **0,02** | 0,2 | baja | [5] [6] [2] | Járkov (OSINT): ≈0,05 de frente (mediana 0,23 m² en todos los aspectos; de frente se detecta 1,7–2× más cerca que de costado). CMO: −21 dBsm ≈ 0,008 en E–M. probable = media geométrica entre OSINT y CMO |
| RCS lateral (X/S) (m²) | 0,02 | **0,14** | 3 | baja | [5] [6] | Járkov: media lateral modelada 1,6 m² (X) y 2,1 m² (S). CMO: −17 dBsm ≈ 0,02 (analogía con Harop/Mobin). probable = media geométrica entre OSINT y CMO; es el valor más incierto |
| RCS de cola (X/S) (m²) | 0,005 | **0,03** | 0,3 | baja | [6] | CMO: −21 dBsm ≈ 0,008. OSINT est: motor de pistón y hélice atrás, ≈2× el frente (0,1). probable = media geométrica entre OSINT y CMO |
| RCS en VHF (m²) | 0,013 | **0,064** | 1 | baja | [6] [7] | est por resonancia 0,3 m²; CMO (DB3K, Shahed-136): −18,7 dBsm ≈ 0,013 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 5 | **15** | 50 | baja | — | est: con GNSS + CRPA 10–20 m; solo INS empeora mucho |
| Costo unitario | US$20k | **US$35k** | US$80k | media | [8] [9] | CSIS: 20–80k, usa 35k; Forbes Ukraine 50k; exportación iraní 193k |
| Alcance (km) | 650 | **1.500** | 2.500 | media | [10] [1] | el informe de ISIS dice que con BCh-90 cae a ~650 km desde ~1.350 km |
| Ojiva (kg) | 40 | **50** | 90 | alta | [10] | BCh-50 o BCh-90 (62 kg de explosivo) |

1. [Army Recognition: Shahed-136, datos técnicos](https://www.armyrecognition.com/military-products/army/unmanned-systems/unmanned-aerial-vehicles/shahed-136-loitering-munition-kamikaze-suicide-drone-technical-data)
2. [Recomendaciones a unidades contra Shahed-136 (sprotyvg7)](https://sprotyvg7.com.ua/lesson/rekomendacii-pidrozdilam-shhodo-borotbi-z-bezpilotnimi-litalnimi-aparatami-kamikadze-shahed-136-geran-2)
3. [UNITED24: por qué los enjambres vuelan más alto (2025)](https://united24media.com/war-in-ukraine/why-russias-drone-swarms-are-getting-deadlier-by-flying-higher-9305)
4. [Forbes (Hambling): interceptores contra Shahed a gran altura (abr-2025)](https://www.forbes.com/sites/davidhambling/2025/04/11/ukraines-interceptors-take-down-high-flying-russian-shaheds/)
5. [Sukharevsky et al. (Univ. Fuerza Aérea, Járkov, 2023): modelado de RCS del Shahed-136](https://fliphtml5.com/pdvau/uvoj/Shahed_136_UAV_RCS_measurements/)
6. [Base de datos de Command: Modern Operations (pedido #2214): firma del Shahed-136 por aspecto en bandas A–D y E–M (estimación de juego)](https://github.com/PygmalionOfCyprus/cmo-db-requests/issues/2214)
7. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
8. [CSIS: costo-efectividad de los ataques con drones](https://www.csis.org/analysis/calculating-cost-effectiveness-russias-drone-strikes)
9. [Ekonomichna Pravda / Forbes Ukraine: costos estimados (2024)](https://www.pravda.com.ua/eng/news/2024/08/26/7472003/)
10. [ISIS: ojivas del Shahed de Alabuga](https://isis-online.org/isis-reports/alabugas-shahed-136-geran-2-warheads-a-dangerous-escalation)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| feb-22 → ago-24 | 13315 | 8836 | 63% | Shahed + Lancet | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |
| mar → may-25 | 7974 | 4188 | 52% derribo + 35% EW | incluye señuelos; 12,5% impactaron | [ISIS: análisis del uso del Shahed, mar–may 2025](https://isis-online.org/isis-reports/may-2025-updated-analysis-of-russian-shahed-136-deployment-against-ukraine) |
| ago-25 → may-26 | — | — | 83% → 93% neutralizados | derribos + supresión EW | [ISIS: análisis mensual del Shahed (ago-2025 → jun-2026)](https://isis-online.org/isis-reports/monthly-analysis-of-russian-shahed-136-deployment-against-ukraine) |
| jul-26 | — | — | 87% | todos los drones | [TechTimes: julio 2026, 87% de drones y 15% de balísticos interceptados](https://www.techtimes.com/articles/323544/20260807/ukraine-stopped-87-drones-only-15-ballistic-missiles-patriot-supply-ran-out.htm) |

#### Fuentes generales

- [Wikipedia: HESA Shahed 136](https://en.wikipedia.org/wiki/HESA_Shahed_136)
- [CSIS: del Shahed al Geran](https://www.csis.org/analysis/shahed-geran-how-russia-continues-reinvent-one-way-attack-drone)
- [Sukharevsky et al. (Univ. Fuerza Aérea, Járkov, 2023): modelado de RCS del Shahed-136](https://fliphtml5.com/pdvau/uvoj/Shahed_136_UAV_RCS_measurements/)

### Geran-3 (Shahed a reacción)

`geran3` · Rusia · Dron de ataque / señuelo · perfil `drone`

Crucero ≈300 km/h, hasta ≈370 km/h al cruzar zonas defendidas (GUR). Los 550–600 km/h que circulan son del Shahed-238 iraní, no de este.

- **Guiado:** INS + GNSS con CRPA Kometa-M12
- **Propulsión:** Turbojet chino Telefly JT80 (confirmado por el GUR en un ejemplar capturado)
- **Ojiva:** ≈50 kg termobárica-fragmentación (TBBCh-50)
- **Alcance:** ≈1.000 km (GUR)
- **Costo:** Sin cifra oficial: ≈Geran-2 + 40% (el motor JT80 cuesta US$18–35k en el mercado civil)
- **Altura de vuelo:** típica 1500 m, límites reales 100–5000 m. Estimación: mismo envolvente que el Geran-2.

- Uso regular desde junio de 2025; primer derribo con dron interceptor Sting el 30/11/2025.
- La inteligencia ucraniana informó en 2026 que se frenó su producción en transición al Geran-4.
- Firma térmica y sonora mayor que el Geran-2: más fácil de oír, más difícil de alcanzar para interceptores lentos.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 83 | **92** | 103 | alta | [1] [2] [3] | GUR: 300 km/h crucero, 370 km/h máx. |
| Altura de vuelo (m AGL) | 100 | **1.500** | 5.000 | baja | — | est: mismo envolvente que el Geran-2 |
| RCS frontal (X/S) (m²) | 0,007 | **0,023** | 0,2 | baja | [1] [4] [5] | est por forma/OSINT 0,075 m²; CMO (DB3K, Shahed-238): −21,7 dBsm ≈ 0,0068 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,03 | **0,2** | 3 | baja | — | est: como el Shahed de costado, con la góndola del motor a reacción |
| RCS de cola (X/S) (m²) | 0,01 | **0,05** | 0,5 | baja | — | est: tobera del turborreactor visible desde atrás |
| RCS en VHF (m²) | 0,013 | **0,064** | 1 | baja | [4] [5] | est por resonancia 0,3 m²; CMO (DB3K, Shahed-238): −18,7 dBsm ≈ 0,013 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 5 | **15** | 50 | baja | — | est: como el Geran-2 |
| Costo unitario | US$50k | **US$70k** | US$100k | baja | [3] [1] | est: Geran-2 + ~40%; el JT80 cuesta 18–35k |
| Alcance (km) | 600 | **1.000** | 1.500 | media | [1] [3] | — |
| Ojiva (kg) | 50 | **50** | 90 | media | [3] [6] | — |

1. [Defense Express (GUR): el Geran-3 lleva motor chino JT80 (sep-2025)](https://en.defence-ua.com/news/russian_geran_3_drone_revealed_to_contain_chinese_engine_and_western_components-15843.html)
2. [Militarnyi: primer derribo de un Geran-3 con dron interceptor](https://militarnyi.com/en/news/ukrainian-interceptor-drone-downs-jet-powered-shahed-for-the-first-time/)
3. [Forbes (Hambling): el Shahed a reacción (sep-2025)](https://www.forbes.com/sites/davidhambling/2025/09/18/russias-new-jet-powered-shahed-revealed-what-it-means-for-ukraine/)
4. [Base de datos de Command: Modern Operations (pedido #2214): firma del Shahed-136 por aspecto en bandas A–D y E–M (estimación de juego)](https://github.com/PygmalionOfCyprus/cmo-db-requests/issues/2214)
5. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
6. [CSIS Missile Threat: Shahed-238](https://missilethreat.csis.org/missile/shahed-238/)

#### Fuentes generales

- [Defense Express (GUR): el Geran-3 lleva motor chino JT80 (sep-2025)](https://en.defence-ua.com/news/russian_geran_3_drone_revealed_to_contain_chinese_engine_and_western_components-15843.html)
- [Forbes (Hambling): el Shahed a reacción (sep-2025)](https://www.forbes.com/sites/davidhambling/2025/09/18/russias-new-jet-powered-shahed-revealed-what-it-means-for-ukraine/)
- [Militarnyi: primer derribo de un Geran-3 con dron interceptor](https://militarnyi.com/en/news/ukrainian-interceptor-drone-downs-jet-powered-shahed-for-the-first-time/)
- [CSIS Missile Threat: Shahed-238](https://missilethreat.csis.org/missile/shahed-238/)

### Gerbera (señuelo)

`gerbera` · Rusia · Dron de ataque / señuelo · perfil `drone`

Imita a un Shahed en trayecto. Su único trabajo es hacer gastar munición y saturar canales de tiro.

- **Guiado:** INS + GNSS
- **Propulsión:** Motor de pistón chico (DLE60 / 70 cc)
- **Ojiva:** Ninguna en la mayoría (algunas 2,5–5 kg o cámara)
- **Alcance:** 300–600 km
- **Costo:** ≈US$10k según funcionarios ucranianos: espuma y terciado, motor de aeromodelismo
- **Altura de vuelo:** típica 1200 m, límites reales 100–3000 m. Señuelo: vuela a la altura de los Shahed que acompaña.

- Primer uso en julio de 2024; Alabuga produce hasta ~50 por día (ISIS).
- La espuma es casi transparente al radar: lo que refleja es el motor y la electrónica, por eso su RCS es menor que la del Shahed.
- Otro señuelo, el "Parodiya", lleva lente de Luneburg y puede verse más grande que un Shahed en el radar.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 33 | **40** | 44 | media | [1] | hasta 160 km/h |
| Altura de vuelo (m AGL) | 100 | **1.200** | 3.000 | media | [1] | — |
| RCS frontal (X/S) (m²) | 0,005 | **0,02** | 0,05 | baja | — | est: espuma casi transparente; reflejan motor, electrónica y cableado |
| RCS lateral (X/S) (m²) | 0,01 | **0,05** | 0,2 | baja | — | est: la espuma casi no suma de costado; reflejan el motor y los cables |
| RCS de cola (X/S) (m²) | 0,005 | **0,03** | 0,1 | baja | — | est: motor y hélice atrás |
| RCS en VHF (m²) | 0,03 | **0,1** | 0,3 | baja | — | est: con λ≈1,5–2 m el cuerpo entra en zona de resonancia y el conformado furtivo pierde efecto |
| Costo unitario | US$3k | **US$10k** | US$15k | media | [2] [3] | "unos pocos miles" a ~10k |
| Alcance (km) | 300 | **450** | 600 | media | [3] | — |

1. [Wikipedia: Gerbera (drone)](https://en.wikipedia.org/wiki/Gerbera_(drone))
2. [ISIS: señuelos rusos con partes occidentales](https://isis-online.org/isis-reports/russian-decoy-drones-that-depend-on-western-parts-pose-a-great-challenge/)
3. [Kyiv Post: Gerbera](https://www.kyivpost.com/post/46692)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| 2025 | 54538 | — | — | ~40% de los drones tipo Shahed eran señuelos | [ISIS: revisión del uso de drones tipo Shahed en 2025](https://isis-online.org/isis-reports/a-comprehensive-analytical-review-of-russian-shahed-type-uavs-deployment-against-ukraine-in-2025) |

#### Fuentes generales

- [Wikipedia: Gerbera (drone)](https://en.wikipedia.org/wiki/Gerbera_(drone))
- [ISIS: señuelos rusos con partes occidentales](https://isis-online.org/isis-reports/russian-decoy-drones-that-depend-on-western-parts-pose-a-great-challenge/)
- [Kyiv Post: Gerbera](https://www.kyivpost.com/post/46692)

### Kh-101 (misil de crucero aéreo)

`kh101` · Rusia · Misil de crucero subsónico · perfil `cruise`

Crucero a 700–720 km/h y 30–70 m sobre el terreno en la fase final, siguiendo valles para esconderse del radar. Forma de baja firma.

- **Guiado:** INS + GLONASS + correlación óptica del terreno + buscador terminal TV/IR
- **Propulsión:** Turbofán TRDD-50A
- **Ojiva:** 400–480 kg; ≈800 kg en la variante de dos ojivas
- **Alcance:** ≈2.500–2.800 km (CSIS); hasta 3.500 km según otras fuentes
- **Costo:** Contratos rusos filtrados: US$2,0 M (2024) y 2,0–2,4 M (2025). Forbes Ukraine estimaba US$13 M
- **Sin GNSS:** descarta el engaño con correlación óptica del terreno; su buscador terminal corrige errores de hasta 2 km
- **Altura de vuelo:** típica 50 m, límites reales 30–6000 m · perfiles: Rasante 50 m, Crucero alto 6000 m. 30–70 m siguiendo el terreno; también puede cruzar a ≈6.000 m (Wikipedia, CSIS). Alto ahorra combustible pero lo ve cualquier radar.

- Lanzado desde Tu-95MS y Tu-160 fuera del alcance ucraniano.
- Desde fines de 2023 lleva dispensador de bengalas (módulo L-504, activo a 3–5 km del blanco); en 2026 se reportó además el sistema SP-504 de autoprotección electrónica.
- A 50 m de altura, el horizonte de un radar con mástil de 10 m es de ~42 km: por eso importan los mástiles altos y los AEW.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 195 | **200** | 270 | alta | [1] | Mach 0,58 crucero, 0,78 máx. |
| Altura de vuelo (m AGL) | 30 | **50** | 70 | alta | [1] | 30–70 m en la fase final; tramos de crucero más altos |
| Ventana que corrige el buscador terminal (km) | 1 | **2** | 4 | baja | [1] | est: buscador TV/IR terminal y correlación óptica de la escena; revisa unos pocos km alrededor del punto previsto |
| RCS frontal (X/S) (m²) | 0 | **0,002** | 0,1 | baja | [2] [3] | est por forma/OSINT 0,03 m²; CMO (DB3K, AS-23A Kodiak [Kh-101]): −40,1 dBsm ≈ 0,000098 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0 | **0,008** | 1 | baja | [3] | est por forma/OSINT 0,3 m²; CMO (DB3K, AS-23A Kodiak [Kh-101]): −37,3 dBsm ≈ 0,00019 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0 | **0,002** | 0,2 | baja | [3] | est por forma/OSINT 0,06 m²; CMO (DB3K, AS-23A Kodiak [Kh-101]): −40,1 dBsm ≈ 0,000098 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,001 | **0,022** | 1 | baja | [3] | est por resonancia 0,5 m²; CMO (DB3K, AS-23A Kodiak [Kh-101]): −30,1 dBsm ≈ 0,00098 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 6 | **15** | 20 | media | [1] [4] | CSIS: 6 m, generalmente 10–20 m |
| Costo unitario | US$1.2 M | **US$2.2 M** | US$13 M | media | [5] [6] [7] | contratos filtrados 2,0–2,4 M; Forbes Ukraine 13 M (inflado) |
| Alcance (km) | 2.500 | **2.800** | 5.500 | media | [1] [4] | con dos ojivas, más o menos la mitad |
| Ojiva (kg) | 400 | **450** | 800 | alta | [1] [8] | — |

1. [CSIS Missile Threat: Kh-101/Kh-102](https://missilethreat.csis.org/missile/kh-101-kh-102/)
2. [GlobalSecurity: tabla de RCS de referencia](https://www.globalsecurity.org/military/world/stealth-aircraft-rcs.htm)
3. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
4. [GlobalSecurity: Kh-101](https://www.globalsecurity.org/wmd/world/russia/kh-101.htm)
5. [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)
6. [Ekonomichna Pravda / Forbes Ukraine: costos estimados (2024)](https://www.pravda.com.ua/eng/news/2024/08/26/7472003/)
7. [Responsible Statecraft: crítica a las estimaciones de costo](https://responsiblestatecraft.org/cost-russian-missiles/)
8. [TWZ: Kh-101 con dos ojivas](https://www.twz.com/air/russia-now-firing-kh-101-cruise-missiles-modified-with-two-warheads-at-ukraine)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| feb-22 → ago-24 | — | — | 67% | crucero agrupado (Kalibr, Kh-101/555, Iskander-K) | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |
| nov-25 | 108 | — | 70–85% | crucero agrupado | [Kyiv Dialogue: Ukraine air war monitor vol. XI (nov-2025)](https://www.kyiv-dialogue.org/en/news/newsreader/ukraine-air-war-monitor-vol-xi.html) |
| jul-26 | 265 | 187 | 71% | crucero agrupado | [TechTimes: julio 2026, 87% de drones y 15% de balísticos interceptados](https://www.techtimes.com/articles/323544/20260807/ukraine-stopped-87-drones-only-15-ballistic-missiles-patriot-supply-ran-out.htm) |
| feb-22 → feb-26 | — | 2459 | — | derribados acumulados | [ISW/CTP: Russian offensive campaign assessment 24/02/2026 (totales derribados)](https://www.criticalthreats.org/analysis/russian-offensive-campaign-assessment-february-24-2026) |

#### Fuentes generales

- [CSIS Missile Threat: Kh-101/Kh-102](https://missilethreat.csis.org/missile/kh-101-kh-102/)
- [TWZ: Kh-101 filmado lanzando bengalas](https://www.twz.com/russian-kh-101-cruise-missile-filmed-firing-off-decoy-flares)
- [TWZ: Kh-101 con dos ojivas](https://www.twz.com/air/russia-now-firing-kh-101-cruise-missiles-modified-with-two-warheads-at-ukraine)
- [Ukrainska Pravda (MoD Ucrania, may-2026): Kh-101 con SP-504](https://www.pravda.com.ua/eng/news/2026/05/11/8034192/)
- [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)

### 3M-14 Kalibr (crucero naval)

`kalibr` · Rusia · Misil de crucero subsónico · perfil `cruise`

Subsónico (Mach 0,7–0,8), ≈20 m sobre el agua y 50–150 m sobre tierra.

- **Guiado:** INS + GLONASS + correlación de terreno + buscador terminal
- **Propulsión:** Turbojet/turbofán con booster de lanzamiento
- **Ojiva:** ≈450–500 kg
- **Alcance:** 1.500–2.500 km (CSIS)
- **Costo:** Contratos rusos filtrados: ≈US$2 M. Forbes Ukraine estimaba 6,5 M
- **Sin GNSS:** descarta el engaño con correlación del terreno (TERCOM); su buscador terminal corrige errores de hasta 2 km
- **Altura de vuelo:** típica 50 m, límites reales 20–300 m · perfiles: Sobre el mar 20 m, Sobre tierra 50 m. ≈20 m sobre el agua, 50–150 m sobre tierra (Wikipedia).

- Lanzado desde corbetas, fragatas y submarinos del Mar Negro y el Caspio.
- La estadística ucraniana lo agrupa con Kh-101/555 e Iskander-K: 66,6% interceptados entre feb-2022 y ago-2024.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 230 | **240** | 270 | alta | [1] [2] | Mach 0,7–0,8 |
| Altura de vuelo (m AGL) | 20 | **50** | 150 | media | [1] | ≈20 m sobre el agua, 50–150 m sobre tierra |
| Ventana que corrige el buscador terminal (km) | 1 | **2** | 4 | baja | [1] | est: correlación de la escena final (tipo DSMAC) o buscador terminal |
| RCS frontal (X/S) (m²) | 0,05 | **0,072** | 0,3 | baja | [3] [4] | est por forma/OSINT 0,1 m²; CMO (DB3K, SS-N-30A Sagaris [3M14 Kalibr]): −12,9 dBsm ≈ 0,051 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,098 | **0,31** | 3 | baja | [4] | est por forma/OSINT 1 m²; CMO (DB3K, SS-N-30A Sagaris [3M14 Kalibr]): −10,1 dBsm ≈ 0,098 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,05 | **0,1** | 0,5 | baja | [5] [4] | est por forma/OSINT 0,2 m²; CMO (DB3K, SS-N-30A Sagaris [3M14 Kalibr]): −12,9 dBsm ≈ 0,051 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,1 | **0,23** | 1 | baja | [4] | est por resonancia 0,5 m²; CMO (DB3K, SS-N-30A Sagaris [3M14 Kalibr]): −9,9 dBsm ≈ 0,1 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 3 | **10** | 20 | baja | [1] | 2–3 m declarado con GLONASS; real est 5–20 m |
| Costo unitario | US$1 M | **US$2 M** | US$6.5 M | media | [6] [7] [8] | — |
| Alcance (km) | 1.400 | **1.750** | 2.500 | media | [2] | — |
| Ojiva (kg) | 450 | **450** | 500 | alta | [2] | — |

1. [Wikipedia: Kalibr (missile family)](https://en.wikipedia.org/wiki/Kalibr_(missile_family))
2. [CSIS Missile Threat: SS-N-30A (3M-14 Kalibr)](https://missilethreat.csis.org/missile/ss-n-30a/)
3. [GlobalSecurity: tabla de RCS de referencia](https://www.globalsecurity.org/military/world/stealth-aircraft-rcs.htm)
4. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
5. [Predição Radar do Míssil de Cruzeiro Tomahawk em Banda L (simulación MLFMA: frente 1,41 m², cola 0,41 m²)](https://www.researchgate.net/publication/363731654_Predicao_Radar_do_Missil_de_Cruzeiro_Tomahawk_em_Banda_L_baseado_na_RCS_Dinamica)
6. [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)
7. [Ekonomichna Pravda / Forbes Ukraine: costos estimados (2024)](https://www.pravda.com.ua/eng/news/2024/08/26/7472003/)
8. [Responsible Statecraft: crítica a las estimaciones de costo](https://responsiblestatecraft.org/cost-russian-missiles/)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| feb-22 → ago-24 | — | — | 67% | crucero agrupado | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |
| jul-26 | 265 | 187 | 71% | crucero agrupado | [TechTimes: julio 2026, 87% de drones y 15% de balísticos interceptados](https://www.techtimes.com/articles/323544/20260807/ukraine-stopped-87-drones-only-15-ballistic-missiles-patriot-supply-ran-out.htm) |
| feb-22 → feb-26 | — | 709 | — | derribados acumulados | [ISW/CTP: Russian offensive campaign assessment 24/02/2026 (totales derribados)](https://www.criticalthreats.org/analysis/russian-offensive-campaign-assessment-february-24-2026) |

#### Fuentes generales

- [CSIS Missile Threat: SS-N-30A (3M-14 Kalibr)](https://missilethreat.csis.org/missile/ss-n-30a/)
- [Wikipedia: Kalibr (missile family)](https://en.wikipedia.org/wiki/Kalibr_(missile_family))
- [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)

### 9M728 Iskander-K (crucero)

`isk_k` · Rusia · Misil de crucero subsónico · perfil `cruise`

Versión de crucero terrestre del sistema Iskander, derivada de la familia Kalibr. Puede bajar a pocos metros en la aproximación final.

- **Guiado:** INS + GNSS + buscador radar terminal (se activa a ~20 km)
- **Propulsión:** Turbofán
- **Ojiva:** ≈480–500 kg
- **Alcance:** ≈500 km (publicado)
- **Costo:** Contratos rusos filtrados: ≈US$1,5–1,7 M
- **Sin GNSS:** sin corrección independiente del satélite; su buscador terminal corrige errores de hasta 5 km
- **Altura de vuelo:** típica 50 m, límites reales 6–6000 m · perfiles: Rasante 50 m, Crucero alto 6000 m. Tramo medio a ≈6 km de altura y 7–150 m al acercarse al blanco (RUSI).

- Se lanza desde el mismo camión que el Iskander-M: el defensor no sabe de antemano si viene balístico o crucero.
- Ucrania contabilizó 261 Iskander-K derribados hasta feb-2026 (ISW).

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 220 | **250** | 280 | baja | — | est: derivado del Kalibr, subsónico |
| Altura de vuelo (m AGL) | 6 | **50** | 150 | media | [1] | — |
| Ventana que corrige el buscador terminal (km) | 2 | **5** | 10 | baja | [1] | est: el buscador radar se activa a ~20 km del blanco; la ventana que puede corregir es menor |
| RCS frontal (X/S) (m²) | 0,05 | **0,13** | 0,3 | baja | [2] [3] | est por forma/OSINT 0,1 m²; CMO (DB3K, SSC-7 Southpaw [9M728 Iskander-K]): −7,6 dBsm ≈ 0,17 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,2 | **0,58** | 3 | baja | [3] | est por forma/OSINT 1 m²; CMO (DB3K, SSC-7 Southpaw [9M728 Iskander-K]): −4,8 dBsm ≈ 0,33 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,05 | **0,19** | 0,5 | baja | [3] | est por forma/OSINT 0,2 m²; CMO (DB3K, SSC-7 Southpaw [9M728 Iskander-K]): −7,6 dBsm ≈ 0,17 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,17 | **0,29** | 1 | baja | [3] | est por resonancia 0,5 m²; CMO (DB3K, SSC-7 Southpaw [9M728 Iskander-K]): −7,6 dBsm ≈ 0,17 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 3 | **10** | 20 | baja | [1] | 1–3 m declarado |
| Costo unitario | US$1 M | **US$1.6 M** | US$1.8 M | media | [4] [5] | — |
| Alcance (km) | 480 | **500** | 500 | media | [1] | — |
| Ojiva (kg) | 480 | **480** | 500 | alta | [1] | — |

1. [RUSI: Iskander-M and Iskander-K, a technical profile (2022)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-m-and-iskander-k-technical-profile)
2. [GlobalSecurity: tabla de RCS de referencia](https://www.globalsecurity.org/military/world/stealth-aircraft-rcs.htm)
3. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
4. [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)
5. [Responsible Statecraft: crítica a las estimaciones de costo](https://responsiblestatecraft.org/cost-russian-missiles/)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| feb-22 → ago-24 | — | — | 67% | crucero agrupado | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |
| feb-22 → feb-26 | — | 261 | — | derribados acumulados | [ISW/CTP: Russian offensive campaign assessment 24/02/2026 (totales derribados)](https://www.criticalthreats.org/analysis/russian-offensive-campaign-assessment-february-24-2026) |

#### Fuentes generales

- [RUSI: Iskander-M and Iskander-K, a technical profile (2022)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-m-and-iskander-k-technical-profile)
- [Wikipedia: 9K720 Iskander](https://en.wikipedia.org/wiki/9K720_Iskander)
- [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)

### 9M723 Iskander-M (cuasibalístico)

`isk_m` · Rusia · Balístico / aerobalístico · perfil `ballistic`

Trayectoria aplanada con apogeo típico de 40–50 km; hasta 2.100 m/s, ≈1.300–1.400 m/s cerca del blanco (GUR). Maniobra terminal y señuelos.

- **Guiado:** INS + GNSS (Kometa) + buscador óptico/radar terminal
- **Propulsión:** Cohete de combustible sólido, una etapa
- **Ojiva:** 450–700 kg
- **Alcance:** 390–500 km (9M723-2: ≈550 km)
- **Costo:** Contratos rusos filtrados: US$2,4–3,0 M
- **Sin GNSS:** sin corrección independiente del satélite; su buscador terminal corrige errores de hasta 1 km

- Lleva señuelos 9B899 (RUSI escribe 9B999): unos 6 por misil, con emisor RF e IR.
- Desde fines de 2025 una actualización de software agrega picada empinada o viraje terminal: la intercepción cayó de 37% (ago-2025) a 6% (sep-2025) según el FT.
- RUSI encontró una distribución bimodal: en 273 de 345 ataques no se interceptó ninguno; cuando hay Patriot bien ubicado se intercepta casi todo.
- CEP: 5–7 m es el valor de folleto; el GUR da 20–30 m.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 1.000 | **1.150** | 1.400 | media | [1] [2] | velocidad horizontal media del modelo; pico 2.100–2.600 m/s, 1.300–1.400 m/s cerca del blanco |
| Apogeo (km) | 40 | **45** | 100 | media | [1] [3] | típico 40–50 km; el GUR da 100 km como máximo |
| Ventana que corrige el buscador terminal (km) | 0,5 | **1** | 2 | baja | — | est: buscador óptico de correlación de escena en la picada final: ventana chica |
| RCS frontal (X/S) (m²) | 0,03 | **0,14** | 0,3 | baja | [4] [5] | est por forma/OSINT 0,1 m²; CMO (DB3K, SS-26 Stone [9M723 Iskander-M]): −7,3 dBsm ≈ 0,19 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,2 | **0,6** | 3 | baja | [5] | est por forma/OSINT 1 m²; CMO (DB3K, SS-26 Stone [9M723 Iskander-M]): −4,5 dBsm ≈ 0,35 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,1 | **0,24** | 1 | baja | [5] | est por forma/OSINT 0,3 m²; CMO (DB3K, SS-26 Stone [9M723 Iskander-M]): −7,3 dBsm ≈ 0,19 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,1 | **0,24** | 1 | baja | [5] | est por resonancia 0,3 m²; CMO (DB3K, SS-26 Stone [9M723 Iskander-M]): −7,3 dBsm ≈ 0,19 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 5 | **25** | 30 | media | [1] [6] [7] | GUR: 20–30 m; 5–7 m es valor de folleto |
| Costo unitario | US$2.4 M | **US$2.7 M** | US$3 M | alta | [8] | — |
| Señuelos por misil | 2 | **6** | 6 | media | [1] [9] [3] | unos 6 señuelos 9B899 por misil (RUSI escribe 9B999). La discriminación del juego es solo por tiempo de seguimiento (BANDS.decoyTau): el mínimo representa un radar que descarta la mayoría |
| Efecto de su maniobra terminal sobre la Pk (×) | 0,4 | **0,6** | 0,85 | baja | [10] [3] | calibrado: perfil con la actualización de 2025; 0,85 ≈ perfil 2023–24 |
| Alcance (km) | 390 | **450** | 550 | alta | [1] | — |
| Ojiva (kg) | 450 | **480** | 700 | media | [1] [6] | — |

1. [GUR War&Sanctions: Iskander-M](https://war-sanctions.gur.gov.ua/en/page-iskander-m)
2. [Wikipedia: 9K720 Iskander](https://en.wikipedia.org/wiki/9K720_Iskander)
3. [RUSI: Iskander, an improved Russian missile tests Ukraine’s air defence (nov-2025)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-improved-russian-missile-tests-ukraines-air-defence)
4. [Foro Matrix Games, base DB3000 de CMO: RCS del Iskander-E −9,8 dBsm (estimación de juego)](https://forums.matrixgames.com/viewtopic.php?t=243914&start=1820)
5. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
6. [RUSI: Iskander-M and Iskander-K, a technical profile (2022)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-m-and-iskander-k-technical-profile)
7. [CSIS Missile Threat: SS-26 Iskander](https://missilethreat.csis.org/missile/ss-26-2/)
8. [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)
9. [TWZ: señuelos secretos del Iskander](https://www.twz.com/44760/russias-use-of-iskander-ballistic-missiles-in-ukraine-exposes-secret-decoy-capability)
10. [AeroTime (resume Financial Times): intercepción de balísticos 37% → 6% (2025)](https://www.aerotime.aero/articles/russias-upgraded-ballistic-missiles-outmaneuver-ukraines-patriot-systems-ft)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| feb-22 → ago-24 | 1388 | 62 | 4,5% | incluye Tochka-U y KN-23, en su mayoría fuera de cobertura Patriot | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |
| ene → may-25 | 128 | 20 | 15% | Iskander-M + KN-23 | [RUSI: Iskander, an improved Russian missile tests Ukraine’s air defence (nov-2025)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-improved-russian-missile-tests-ukraines-air-defence) |
| jun → sep-25 | 179 | 67 | 37% | Iskander-M + Kinzhal | [RUSI: Iskander, an improved Russian missile tests Ukraine’s air defence (nov-2025)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-improved-russian-missile-tests-ukraines-air-defence) |
| sep-25 | — | — | 6% | tras la actualización de maniobra | [AeroTime (resume Financial Times): intercepción de balísticos 37% → 6% (2025)](https://www.aerotime.aero/articles/russias-upgraded-ballistic-missiles-outmaneuver-ukraines-patriot-systems-ft) |
| 1 → 24 oct-25 | 78 | 14 | 17% |  | [RUSI: Iskander, an improved Russian missile tests Ukraine’s air defence (nov-2025)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-improved-russian-missile-tests-ukraines-air-defence) |
| jul-26 | 195 | 29 | 15% | escasez de PAC-3 MSE | [TechTimes: julio 2026, 87% de drones y 15% de balísticos interceptados](https://www.techtimes.com/articles/323544/20260807/ukraine-stopped-87-drones-only-15-ballistic-missiles-patriot-supply-ran-out.htm) |

#### Fuentes generales

- [GUR War&Sanctions: Iskander-M](https://war-sanctions.gur.gov.ua/en/page-iskander-m)
- [RUSI: Iskander, an improved Russian missile tests Ukraine’s air defence (nov-2025)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-improved-russian-missile-tests-ukraines-air-defence)
- [AeroTime (resume Financial Times): intercepción de balísticos 37% → 6% (2025)](https://www.aerotime.aero/articles/russias-upgraded-ballistic-missiles-outmaneuver-ukraines-patriot-systems-ft)
- [TWZ: señuelos secretos del Iskander](https://www.twz.com/44760/russias-use-of-iskander-ballistic-missiles-in-ukraine-exposes-secret-decoy-capability)
- [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)

### Kh-47M2 Kinzhal (aerobalístico)

`kinzhal` · Rusia · Balístico / aerobalístico · perfil `ballistic`

Lanzado desde MiG-31K. Rusia lo vende como "Mach 10", pero un operador de Patriot midió ≈1.240 m/s (Mach 3,6) en el momento de la intercepción.

- **Guiado:** INS + corrección en vuelo + buscador terminal
- **Propulsión:** Cohete sólido (derivado del Iskander)
- **Ojiva:** ≈480 kg
- **Alcance:** ≈460–480 km tras el lanzamiento
- **Costo:** Contratos rusos filtrados: ≈US$4,5 M. Forbes Ukraine estimaba 10–15 M
- **Sin GNSS:** sin corrección independiente del satélite; su buscador terminal corrige errores de hasta 1 km

- Primer derribo confirmado por Patriot sobre Kyiv el 4/5/2023.
- 111 lanzados y 28 interceptados (25%) hasta ago-2024.
- Técnicamente es un balístico aerolanzado, no un hipersónico maniobrable.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 1.100 | **1.250** | 1.500 | media | [1] [2] | ≈1.240 m/s medido en la intercepción (The Economist); CSIS: acelera a Mach 4 |
| Apogeo (km) | 35 | **45** | 80 | baja | [3] | est por física: lanzado a 15–20 km y Mach 2+ |
| Ventana que corrige el buscador terminal (km) | 0,5 | **1** | 2 | baja | — | est: análogo al Iskander-M |
| RCS frontal (X/S) (m²) | 0,03 | **0,14** | 0,3 | baja | [3] [4] | est por forma/OSINT 0,1 m²; CMO (DB3K, AS-24 Killjoy [Kh-47M2 Kinzhal]): −7,3 dBsm ≈ 0,19 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,2 | **0,6** | 3 | baja | [4] | est por forma/OSINT 1 m²; CMO (DB3K, AS-24 Killjoy [Kh-47M2 Kinzhal]): −4,5 dBsm ≈ 0,35 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,1 | **0,24** | 1 | baja | [4] | est por forma/OSINT 0,3 m²; CMO (DB3K, AS-24 Killjoy [Kh-47M2 Kinzhal]): −7,3 dBsm ≈ 0,19 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,1 | **0,24** | 1 | baja | [4] | est por resonancia 0,3 m²; CMO (DB3K, AS-24 Killjoy [Kh-47M2 Kinzhal]): −7,3 dBsm ≈ 0,19 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 10 | **20** | 30 | baja | — | est: análogo al Iskander-M |
| Costo unitario | US$2 M | **US$4.5 M** | US$15 M | media | [5] [6] [7] | contrato filtrado 4,4–4,5 M |
| Efecto de su maniobra terminal sobre la Pk (×) | 0,6 | **0,8** | 0,9 | baja | [8] | calibrado |
| Alcance (km) | 460 | **470** | 480 | media | [1] | — |
| Ojiva (kg) | 480 | **480** | 500 | media | [2] | — |

1. [Wikipedia: Kh-47M2 Kinzhal](https://en.wikipedia.org/wiki/Kh-47M2_Kinzhal)
2. [CSIS Missile Threat: Kinzhal](https://missilethreat.csis.org/missile/kinzhal/)
3. [GlobalSecurity: Kh-47M2 / 9M730](https://www.globalsecurity.org/wmd/world/russia/9m730.htm)
4. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
5. [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)
6. [Ekonomichna Pravda / Forbes Ukraine: costos estimados (2024)](https://www.pravda.com.ua/eng/news/2024/08/26/7472003/)
7. [Responsible Statecraft: crítica a las estimaciones de costo](https://responsiblestatecraft.org/cost-russian-missiles/)
8. [AeroTime (resume Financial Times): intercepción de balísticos 37% → 6% (2025)](https://www.aerotime.aero/articles/russias-upgraded-ballistic-missiles-outmaneuver-ukraines-patriot-systems-ft)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| 16 may-23 (Kyiv) | 6 | 6 | 100% (reclamado) | junto con 9 Kalibr y 3 Iskander | [AeroTime: Ucrania reclama 6 Kinzhal derribados (may-2023)](https://www.aerotime.aero/articles/ukraine-claims-6-kinzhal-missiles-downed-russia-claims-patriot-system-destroyed) |
| feb-22 → ago-24 | 111 | 28 | 25% |  | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |
| hasta 24 oct-25 | 939 | 227 | 24% | Iskander-M + Kinzhal | [RUSI: Iskander, an improved Russian missile tests Ukraine’s air defence (nov-2025)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-improved-russian-missile-tests-ukraines-air-defence) |

#### Fuentes generales

- [Wikipedia: Kh-47M2 Kinzhal](https://en.wikipedia.org/wiki/Kh-47M2_Kinzhal)
- [CSIS Missile Threat: Kinzhal](https://missilethreat.csis.org/missile/kinzhal/)
- [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html)
- [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)

### FAB-500M-62 con UMPK (bomba planeadora)

`kab` · Rusia · Misil de crucero subsónico · perfil `glide`

Un Su-34 la suelta a 9–12 km de altura y a ~1.000 km/h a 50–70 km de la línea del frente, fuera del alcance de casi toda la defensa. Planea sin motor y llega a ~700–800 km/h. No deja estela térmica y llegan muchas juntas.

- **Guiado:** INS + GLONASS con antena CRPA Kometa; alas desplegables
- **Propulsión:** Ninguno: planea (hay versiones nuevas con turborreactor)
- **Ojiva:** 500 kg (≈200 kg de explosivo)
- **Alcance:** 40–70 km (UMPK); 95–100 km las versiones nuevas soltadas a 12 km
- **Costo:** Bomba FAB-500 de stock más kit UMPK de ≈US$20–30 mil (JAPCC)

- El arma rusa más usada contra el frente y Járkov desde 2024: miles por mes.
- Interceptarla con Patriot o NASAMS es posible pero insostenible (US$4–7 M contra US$25 mil): la respuesta habitual es derribar al avión o interferir su GLONASS.
- En el juego usa la Pk de la clase "crucero" (blanco subsónico sin maniobra).

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 200 | **250** | 330 | media | [1] [2] | suelta a ~280 m/s (1.000 km/h), llega a 200–220 m/s (700–800 km/h); JAPCC habla de 300–400 m/s |
| Altura de crucero (m) | 9.000 | **10.000** | 12.000 | media | [2] | Su-34 a 9–12 km |
| RCS frontal (X/S) (m²) | 0,014 | **0,037** | 0,1 | baja | [3] | est por forma 0,1 m² (cuerpo de 0,4 m con alas); CMO (DB3K, UMPK FAB-500M-62): −18,7 dBsm ≈ 0,0135 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,029 | **0,12** | 0,5 | baja | [3] | est por forma 0,5 m²; CMO (DB3K): −15,4 dBsm ≈ 0,029 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,014 | **0,037** | 0,1 | baja | [3] | est por forma 0,1 m²; CMO (DB3K): cola = frente. Probable = media geométrica |
| RCS en VHF (m²) | 0,014 | **0,064** | 0,3 | baja | [3] | est por resonancia 0,3 m²; CMO (DB3K): −18,7 dBsm ≈ 0,0135 m² en bandas A–D. Probable = media geométrica |
| CEP (m) | 5 | **15** | 50 | baja | [1] | est: guiado satelital; el engaño GNSS la empeora mucho |
| Costo unitario | US$20k | **US$30k** | US$50k | media | [1] | kit ≈US$20–30 mil + bomba de stock |
| Distancia de lanzamiento (km) | 40 | **60** | 100 | media | [2] | 40–70 km el UMPK clásico; 95–100 km las versiones nuevas |
| Alcance (km) | 40 | **60** | 100 | media | [2] | — |
| Ojiva (kg) | 450 | **500** | 520 | alta | [2] | FAB-500M-62 |

1. [JAPCC (OTAN): Countering Russia’s glide bomb warfare in Ukraine](https://www.japcc.org/articles/countering-russias-glide-bomb-warfare-in-ukraine/)
2. [Wikipedia: UMPK (bomb kit)](https://en.wikipedia.org/wiki/UMPK_(bomb_kit))
3. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)

#### Fuentes generales

- [Wikipedia: UMPK (bomb kit)](https://en.wikipedia.org/wiki/UMPK_(bomb_kit))
- [JAPCC (OTAN): Countering Russia’s glide bomb warfare in Ukraine](https://www.japcc.org/articles/countering-russias-glide-bomb-warfare-in-ukraine/)
- [Forbes (Axe): los interferidores ucranianos confunden a las bombas planeadoras (mar-2025)](https://www.forbes.com/sites/davidaxe/2025/03/23/ukraines-jammers-are-confusing-russias-glide-bombs-watch-one-stray-off-course/)

### Kh-22 / Kh-32 (supersónico pesado)

`kh22` · Rusia · Misil supersónico · perfil `highdive`

Sube a ≈27 km, vuela a Mach 3,5–4,6 y pica casi vertical. Muy impreciso contra blancos terrestres porque el buscador es antibuque.

- **Guiado:** INS + buscador radar activo (antibuque)
- **Propulsión:** Cohete de combustible líquido R-201
- **Ojiva:** ≈950–1.000 kg (Kh-32: ≈500 kg)
- **Alcance:** ≈600 km (Kh-32: hasta 1.000 km)
- **Costo:** Stock soviético: estimación ucraniana ≈US$1 M (no figura en los contratos filtrados)

- Hasta ago-2024: 2 interceptados de 362 lanzados (0,55%).
- Según la Fuerza Aérea, solo 3 de más de 400 se habían derribado antes de feb-2026; el 2/2/2026 se derribaron 9 de 12 sobre Kyiv. La diferencia es estar dentro de la cobertura Patriot/SAMP-T.
- Enorme (11,6 m) y nada furtivo: se ve de lejos, el problema es la velocidad y el ángulo de picada.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 1.030 | **1.100** | 1.360 | media | [1] [2] | Mach 3,5–4,6 |
| Velocidad terminal (picada) (m/s) | 900 | **1.100** | 1.350 | baja | — | est: no hay medición pública de la picada |
| Altura de crucero (m) | 12.000 | **27.000** | 40.000 | media | [1] [2] | ≈27 km régimen alto; ≈12 km régimen bajo; Kh-32 hasta ~40 km |
| RCS frontal (X/S) (m²) | 0,5 | **0,73** | 3 | baja | [3] | est por forma/OSINT 1 m²; CMO (DB3K, AS-4 Kitchen [Kh-22M]): −2,7 dBsm ≈ 0,54 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 1 | **3,2** | 30 | baja | [3] | est por forma/OSINT 10 m²; CMO (DB3K, AS-4 Kitchen [Kh-22M]): 0 dBsm ≈ 1 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,54 | **1** | 5 | baja | [3] | est por forma/OSINT 2 m²; CMO (DB3K, AS-4 Kitchen [Kh-22M]): −2,7 dBsm ≈ 0,54 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,54 | **1,3** | 10 | baja | [3] | est por resonancia 3 m²; CMO (DB3K, AS-4 Kitchen [Kh-22M]): −2,7 dBsm ≈ 0,54 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 90 | **150** | 500 | baja | [1] | >91 m; buscador antibuque, malo contra tierra |
| Costo unitario | US$500k | **US$1 M** | US$1.5 M | baja | [4] | solo estimación Forbes/EP |
| Alcance (km) | 600 | **600** | 1.000 | media | [1] [2] | — |
| Ojiva (kg) | 500 | **950** | 1.000 | alta | [1] | — |

1. [Wikipedia: Kh-22](https://en.wikipedia.org/wiki/Kh-22)
2. [Wikipedia: Kh-32](https://en.wikipedia.org/wiki/Kh-32)
3. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
4. [Ekonomichna Pravda / Forbes Ukraine: costos estimados (2024)](https://www.pravda.com.ua/eng/news/2024/08/26/7472003/)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| feb-22 → ago-24 | 362 | 2 | 0,55% | Kh-22 + Kh-32 | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |
| 2 feb-26 (Kyiv) | 12 | 9 | 75% | un solo ataque, dentro de cobertura Patriot | [RBC-Ukraine: 9 de 12 Kh-22 derribados sobre Kyiv (feb-2026)](https://newsukraine.rbc.ua/news/kyiv-attack-air-force-shoots-down-9-kh-22-1770042905.html) |

#### Fuentes generales

- [Wikipedia: Kh-22](https://en.wikipedia.org/wiki/Kh-22)
- [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html)
- [RBC-Ukraine: 9 de 12 Kh-22 derribados sobre Kyiv (feb-2026)](https://newsukraine.rbc.ua/news/kyiv-attack-air-force-shoots-down-9-kh-22-1770042905.html)
- [Ekonomichna Pravda / Forbes Ukraine: costos estimados (2024)](https://www.pravda.com.ua/eng/news/2024/08/26/7472003/)

### P-800 Oniks (supersónico antibuque)

`oniks` · Rusia · Misil supersónico · perfil `hilo`

Mach 2,6 a ~14 km y baja a 10–15 m para el tramo final, a Mach 2.

- **Guiado:** INS + buscador radar activo/pasivo
- **Propulsión:** Estatorreactor (ramjet) + booster sólido
- **Ojiva:** 200–300 kg
- **Alcance:** 300 km exportación; ≈600 km versión rusa
- **Costo:** Estimación Forbes Ukraine 2022: ≈US$1,25 M (no figura en los contratos filtrados)

- Usado desde baterías costeras Bastion-P contra blancos terrestres.
- 211 lanzados y 12 interceptados (5,7%) hasta ago-2024.
- La toma de aire frontal es una cavidad que agranda su RCS de frente.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 700 | **750** | 884 | media | [1] [2] | Mach 2,6 a 14 km |
| Velocidad rasante final (m/s) | 600 | **680** | 750 | media | [1] | Mach 2 a ras |
| Altura de crucero (m) | 10.000 | **14.000** | 15.000 | media | [2] | — |
| Altura de vuelo (m AGL) | 10 | **15** | 20 | media | [2] | — |
| RCS frontal (X/S) (m²) | 0,1 | **0,29** | 1 | baja | [3] | est por forma/OSINT 0,3 m²; CMO (DB3K, SS-N-26 Strobile [P-800 Onyx]): −5,6 dBsm ≈ 0,28 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,5 | **1** | 5 | baja | [3] | est por forma/OSINT 2 m²; CMO (DB3K, SS-N-26 Strobile [P-800 Onyx]): −2,8 dBsm ≈ 0,52 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,2 | **0,37** | 1 | baja | [3] | est por forma/OSINT 0,5 m²; CMO (DB3K, SS-N-26 Strobile [P-800 Onyx]): −5,6 dBsm ≈ 0,28 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,28 | **0,52** | 3 | baja | [3] | est por resonancia 1 m²; CMO (DB3K, SS-N-26 Strobile [P-800 Onyx]): −5,6 dBsm ≈ 0,28 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 10 | **20** | 50 | baja | — | est: buscador nuevo para tierra desde 2024 |
| Costo unitario | US$1 M | **US$1.25 M** | US$1.5 M | baja | [4] | — |
| Alcance (km) | 300 | **500** | 600 | media | [1] | — |
| Ojiva (kg) | 200 | **250** | 300 | media | [1] | — |

1. [Wikipedia: P-800 Oniks](https://en.wikipedia.org/wiki/P-800_Oniks)
2. [RBC-Ukraine: perfil de vuelo del Oniks](https://newsukraine.rbc.ua/news/supersonic-speed-and-complex-trajectory-key-1695648974.html)
3. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
4. [Responsible Statecraft: crítica a las estimaciones de costo](https://responsiblestatecraft.org/cost-russian-missiles/)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| feb-22 → ago-24 | 211 | 12 | 5,7% |  | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |

#### Fuentes generales

- [Wikipedia: P-800 Oniks](https://en.wikipedia.org/wiki/P-800_Oniks)
- [RBC-Ukraine: perfil de vuelo del Oniks](https://newsukraine.rbc.ua/news/supersonic-speed-and-complex-trajectory-key-1695648974.html)
- [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html)

### 3M22 Tsirkon (Zircon)

`zircon` · Rusia · Hipersónico (planeo/crucero) · perfil `highdive`

Rusia declara Mach 8–9. El GUR registró como máximo Mach 6,8; Defense Express estimó Mach 5,5 a mitad de vuelo y ≈4,5 en la aproximación. Crucero a 30–40 km y picada final.

- **Guiado:** INS + buscador radar activo
- **Propulsión:** Dos etapas de combustible sólido según el GUR y los restos analizados (Rusia declara scramjet)
- **Ojiva:** ≈120 kg (KNDISE: ≤40 kg de explosivo)
- **Alcance:** ≈1.000 km (declarado, sin confirmar)
- **Costo:** Contratos rusos filtrados: US$5,2–5,6 M

- Dos derribados sobre Kyiv el 25/3/2024 (SAMP/T y Patriot).
- Hasta ago-2024: 6 lanzados, 2 interceptados. Ucrania contabilizaba 11 derribados a feb-2026.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 690 | **1.500** | 2.000 | media | [1] [2] [3] | GUR: máx. Mach 6,8; Defense Express: Mach 5,5 a mitad de vuelo |
| Velocidad terminal (picada) (m/s) | 690 | **1.150** | 1.500 | media | [2] [4] [3] | ≈Mach 4,5 en la aproximación; KNDISE midió ~2.500 km/h al final |
| Altura de crucero (m) | 25.000 | **30.000** | 40.000 | media | [1] | — |
| RCS frontal (X/S) (m²) | 0,05 | **0,21** | 0,5 | baja | [5] | est por forma/OSINT 0,15 m²; CMO (DB3K, SS-N-33 [3M22 Zircon]): −5,4 dBsm ≈ 0,29 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,3 | **0,74** | 3 | baja | [5] | est por forma/OSINT 1 m²; CMO (DB3K, SS-N-33 [3M22 Zircon]): −2,6 dBsm ≈ 0,55 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,1 | **0,29** | 1 | baja | [5] | est por forma/OSINT 0,3 m²; CMO (DB3K, SS-N-33 [3M22 Zircon]): −5,4 dBsm ≈ 0,29 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,2 | **0,38** | 1 | baja | [5] | est por resonancia 0,5 m²; CMO (DB3K, SS-N-33 [3M22 Zircon]): −5,4 dBsm ≈ 0,29 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 10 | **30** | 50 | baja | — | est |
| Costo unitario | US$5 M | **US$5.4 M** | US$5.6 M | alta | [6] | — |
| Efecto de su maniobra terminal sobre la Pk (×) | 0,7 | **0,85** | 1 | baja | — | est |
| Alcance (km) | 500 | **800** | 1.000 | baja | [2] | oficialmente no confirmado |
| Ojiva (kg) | 40 | **120** | 300 | media | [7] [3] | — |

1. [GUR War&Sanctions: 3M22 Zircon](https://war-sanctions.gur.gov.ua/en/ballistics/zircon)
2. [Defense Express: velocidad real del Zircon según los restos](https://en.defence-ua.com/analysis/how_russian_3m22_zircon_reached_hypersonic_yet_failed_to_accomplish_the_very_task_it_was_created_for-9980.html)
3. [Kyiv Independent: KNDISE sobre el Zircon (feb-2024)](https://kyivindependent.com/russia-used-2-zircon-hypersonic-missiles-during-feb-7-attack/)
4. [NV: SAMP/T y Patriot interceptan Zircon (mar-2024)](https://english.nv.ua/nation/ukraine-uses-european-samp-t-and-american-patriot-systems-to-intercept-russian-zircon-missiles-50404796.html)
5. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
6. [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)
7. [UNITED24: Ucrania detalla el Zircon (ago-2026)](https://united24media.com/war-in-ukraine/ukraine-details-russias-3m22-zircon-missile-and-identifies-70-companies-behind-it-22067)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| feb-22 → ago-24 | 6 | 2 | 33% |  | [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html) |
| 25 mar-24 (Kyiv) | 2 | 2 | 100% | SAMP/T y Patriot | [NV: SAMP/T y Patriot interceptan Zircon (mar-2024)](https://english.nv.ua/nation/ukraine-uses-european-samp-t-and-american-patriot-systems-to-intercept-russian-zircon-missiles-50404796.html) |

#### Fuentes generales

- [GUR War&Sanctions: 3M22 Zircon](https://war-sanctions.gur.gov.ua/en/ballistics/zircon)
- [UNITED24: Ucrania detalla el Zircon (ago-2026)](https://united24media.com/war-in-ukraine/ukraine-details-russias-3m22-zircon-missile-and-identifies-70-companies-behind-it-22067)
- [Defense Express: velocidad real del Zircon según los restos](https://en.defence-ua.com/analysis/how_russian_3m22_zircon_reached_hypersonic_yet_failed_to_accomplish_the_very_task_it_was_created_for-9980.html)
- [NV: SAMP/T y Patriot interceptan Zircon (mar-2024)](https://english.nv.ua/nation/ukraine-uses-european-samp-t-and-american-patriot-systems-to-intercept-russian-zircon-missiles-50404796.html)
- [Defence Blog / Militarnyi: costos de contratos rusos filtrados 2024–2027](https://defence-blog.com/analysts-break-down-real-cost-of-russian-missiles/)

### Storm Shadow / SCALP-EG

`storm` · Ucrania / OTAN · Misil de crucero subsónico · perfil `bunt`

Vuelo rasante a 30–40 m guiado por mapa de terreno; al final hace un "bunt": trepa para identificar el blanco con el IR y pica.

- **Guiado:** INS + GPS + TERPROM + buscador IR de imagen
- **Propulsión:** Turbojet Microturbo TRI 60-30
- **Ojiva:** 450 kg BROACH (penetrante en tándem)
- **Alcance:** ≈250 km (exportación, la entregada a Ucrania); ≈550 km versión UK/FR
- **Costo:** ≈£2 M (≈US$2,5 M, 2023); el precio original era £790k
- **Sin GNSS:** descarta el engaño con TERPROM (correlación del terreno); su buscador terminal corrige errores de hasta 2 km
- **Altura de vuelo:** típica 35 m, límites reales 30–300 m. 30–40 m en la fase rasante (Defense Mirror); más alto es estimación.

- Lanzado por Su-24 ucranianos adaptados.
- Rusia reclamó decenas de intercepciones sin datos verificables; no hay tasa independiente.
- El ascenso final lo expone por unos segundos a defensas de punto (Pantsir, Tor).

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 270 | **275** | 323 | alta | [1] [2] | Mach 0,8–0,95 |
| Altura de vuelo (m AGL) | 30 | **35** | 40 | alta | [2] | — |
| Ventana que corrige el buscador terminal (km) | 1 | **2** | 4 | baja | [2] | est: buscador IR de imagen con reconocimiento automático del blanco |
| RCS frontal (X/S) (m²) | 0 | **0,001** | 0,1 | baja | [3] [2] [4] | est por forma/OSINT 0,05 m²; CMO (DB3K, Storm Shadow): −44,2 dBsm ≈ 0,000038 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0 | **0,005** | 1 | baja | [4] | est por forma/OSINT 0,3 m²; CMO (DB3K, Storm Shadow): −41,2 dBsm ≈ 0,000076 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0 | **0,002** | 0,3 | baja | [4] | est por forma/OSINT 0,1 m²; CMO (DB3K, Storm Shadow): −44,2 dBsm ≈ 0,000038 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0 | **0,014** | 1 | baja | [4] | est por resonancia 0,5 m²; CMO (DB3K, Storm Shadow): −34,2 dBsm ≈ 0,00038 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 1 | **2** | 3 | baja | [2] | no hay CEP oficial; buscador IR de imagen |
| Costo unitario | US$1.3 M | **US$2.5 M** | US$2.8 M | media | [1] [5] | — |
| Alcance (km) | 250 | **250** | 550 | alta | [1] [6] | — |
| Ojiva (kg) | 450 | **450** | 450 | alta | [1] | — |

1. [Wikipedia: Storm Shadow](https://en.wikipedia.org/wiki/Storm_Shadow)
2. [Defense Media Network: Storm Shadow at war](https://www.defensemedianetwork.com/stories/storm-shadow-at-war/)
3. [GlobalSecurity: tabla de RCS de referencia](https://www.globalsecurity.org/military/world/stealth-aircraft-rcs.htm)
4. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
5. [AOAV: costo del Storm Shadow (2025)](https://aoav.org.uk/2025/uk-refuses-to-disclose-cost-of-new-storm-shadow-missile-deal-with-france/)
6. [Defense News: Ucrania recibe Storm Shadow (may-2023)](https://www.defensenews.com/global/europe/2023/05/11/ukraine-gets-british-long-range-missiles-ahead-of-counteroffensive/)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| 2023 | — | — | sin dato | solo afirmaciones rusas, no verificables | [Defense Media Network: Storm Shadow at war](https://www.defensemedianetwork.com/stories/storm-shadow-at-war/) |

#### Fuentes generales

- [Wikipedia: Storm Shadow](https://en.wikipedia.org/wiki/Storm_Shadow)
- [Defense Media Network: Storm Shadow at war](https://www.defensemedianetwork.com/stories/storm-shadow-at-war/)
- [Defense News: Ucrania recibe Storm Shadow (may-2023)](https://www.defensenews.com/global/europe/2023/05/11/ukraine-gets-british-long-range-missiles-ahead-of-counteroffensive/)
- [AOAV: costo del Storm Shadow (2025)](https://aoav.org.uk/2025/uk-refuses-to-disclose-cost-of-new-storm-shadow-missile-deal-with-france/)

### MGM-140 ATACMS

`atacms` · Ucrania / OTAN · Balístico / aerobalístico · perfil `ballistic`

Balístico táctico lanzado desde HIMARS/M270, Mach 3+ en terminal. Apogeo hasta ~50 km en tiro máximo.

- **Guiado:** INS + GPS
- **Propulsión:** Cohete sólido, una etapa
- **Ojiva:** ≈230 kg unitaria (M57) o submuniciones
- **Alcance:** 165 km (M39) / 300 km (M39A1, M48, M57)
- **Costo:** ≈US$1,5 M (M39 actualizado a FY2022); M57 ≈1,7 M

- Usado contra bases aéreas y baterías S-400.
- El MoD ruso dijo derribar 5 de 6, 3 de 5 y 7 de 8 en noviembre de 2024; son cifras sin verificar y admitió impactos.
- El GPS lo hace sensible a la interferencia GNSS rusa.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 900 | **1.000** | 1.200 | media | [1] | Mach 3+ |
| Apogeo (km) | 25 | **40** | 50 | media | [1] | 50 km es el techo; a 300 km un tiro óptimo daría ~75 km, así que la trayectoria es deprimida |
| RCS frontal (X/S) (m²) | 0,05 | **0,08** | 0,3 | baja | [2] | est por forma/OSINT 0,1 m²; CMO (DB3K, MGM-140 ATACMS): −11,9 dBsm ≈ 0,065 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,13 | **0,62** | 10 | baja | [2] | est por forma/OSINT 3 m²; CMO (DB3K, MGM-140 ATACMS): −8,9 dBsm ≈ 0,13 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,065 | **0,14** | 1 | baja | [2] | est por forma/OSINT 0,3 m²; CMO (DB3K, MGM-140 ATACMS): −11,9 dBsm ≈ 0,065 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,065 | **0,14** | 1 | baja | [2] | est por resonancia 0,3 m²; CMO (DB3K, MGM-140 ATACMS): −11,9 dBsm ≈ 0,065 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 9 | **10** | 50 | media | [3] | — |
| Costo unitario | US$820k | **US$1.5 M** | US$1.7 M | media | [1] | — |
| Alcance (km) | 165 | **300** | 300 | alta | [3] | — |
| Ojiva (kg) | 230 | **230** | 560 | alta | [3] | — |

1. [Wikipedia: MGM-140 ATACMS](https://en.wikipedia.org/wiki/MGM-140_ATACMS)
2. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
3. [CSIS Missile Threat: ATACMS](https://missilethreat.csis.org/missile/atacms/)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| nov-24 | 19 | 15 | 79% (reclamado) | MoD ruso, sin verificar | [TASS (MoD ruso, cifras sin verificar): ATACMS "interceptados"](https://tass.com/politics/1874721) |

#### Fuentes generales

- [Wikipedia: MGM-140 ATACMS](https://en.wikipedia.org/wiki/MGM-140_ATACMS)
- [CSIS Missile Threat: ATACMS](https://missilethreat.csis.org/missile/atacms/)
- [TASS (MoD ruso, cifras sin verificar): ATACMS "interceptados"](https://tass.com/politics/1874721)

### R-360 Neptune

`neptune` · Ucrania / OTAN · Misil de crucero subsónico · perfil `cruise`

Antibuque subsónico rasante (4–5 m sobre el agua en la fase final). Hundió al crucero Moskva en abril de 2022.

- **Guiado:** INS + GNSS + buscador terminal
- **Propulsión:** Turbofán Motor Sich MS400 + booster
- **Ojiva:** 150 kg (Long Neptune ≈260 kg)
- **Alcance:** 280–300 km (Long Neptune ≈1.000 km)
- **Costo:** Sin cifra oficial; ≈US$1,5 M es una estimación de prensa
- **Sin GNSS:** sin corrección independiente del satélite; su buscador terminal corrige errores de hasta 3 km
- **Altura de vuelo:** típica 15 m, límites reales 3–300 m · perfiles: Sobre el mar 5 m, Sobre tierra 30 m. 3–5 m sobre el mar (RBC-Ucrania); ≈30 m sobre tierra es estimación.

- La versión de ataque a tierra (más larga y gruesa) amplió el alcance a ~1.000 km.
- Producción de ~100 por año en 2024.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 250 | **260** | 270 | media | [1] | — |
| Altura de vuelo (m AGL) | 3 | **15** | 100 | media | [1] | 4–5 m sobre el mar; est ~30 m sobre tierra |
| Ventana que corrige el buscador terminal (km) | 1 | **3** | 6 | baja | [1] | est: buscador radar terminal (diseñado como antibuque) |
| RCS frontal (X/S) (m²) | 0,049 | **0,07** | 0,3 | baja | [2] [3] | est por forma/OSINT 0,1 m²; CMO (DB3K, R-360MC Neptun): −13,1 dBsm ≈ 0,049 m² de frente. Probable = media geométrica |
| RCS lateral (X/S) (m²) | 0,1 | **0,32** | 3 | baja | [3] | est por forma/OSINT 1 m²; CMO (DB3K, R-360MC Neptun): −10 dBsm ≈ 0,1 m² de costado. Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,049 | **0,099** | 0,5 | baja | [3] | est por forma/OSINT 0,2 m²; CMO (DB3K, R-360MC Neptun): −13,1 dBsm ≈ 0,049 m² de cola. Probable = media geométrica |
| RCS en VHF (m²) | 0,049 | **0,16** | 1 | baja | [3] | est por resonancia 0,5 m²; CMO (DB3K, R-360MC Neptun): −13,1 dBsm ≈ 0,049 m² de frente en bandas A–D. Probable = media geométrica |
| CEP (m) | 5 | **10** | 20 | baja | — | no público |
| Costo unitario | US$500k | **US$1.5 M** | US$2 M | baja | — | sin cifra oficial; estimación de prensa |
| Alcance (km) | 280 | **300** | 1.000 | media | [4] [5] | — |
| Ojiva (kg) | 150 | **150** | 260 | media | [1] | — |

1. [RBC-Ukraine: especificaciones del Neptune largo](https://newsukraine.rbc.ua/news/range-up-to-1-000-km-specifications-of-new-1759356853.html)
2. [GlobalSecurity: tabla de RCS de referencia](https://www.globalsecurity.org/military/world/stealth-aircraft-rcs.htm)
3. [Base de datos de Command: Modern Operations (DB3000 515): firma radar por arma (frente, costado y cola en bandas A–D y E–M). Son estimaciones del juego, no mediciones; se citan valor por valor](https://www.matrixgames.com/game/command-modern-operations)
4. [Wikipedia: R-360 Neptune](https://en.wikipedia.org/wiki/R-360_Neptune)
5. [Militarnyi: Long Neptune llega a 1.000 km](https://militarnyi.com/en/news/long-neptune-has-reached-range-of-1000-km/)

#### Fuentes generales

- [Wikipedia: R-360 Neptune](https://en.wikipedia.org/wiki/R-360_Neptune)
- [Militarnyi: Long Neptune llega a 1.000 km](https://militarnyi.com/en/news/long-neptune-has-reached-range-of-1000-km/)
- [RBC-Ukraine: especificaciones del Neptune largo](https://newsukraine.rbc.ua/news/range-up-to-1-000-km-specifications-of-new-1759356853.html)

### AN-196 Liutyi (dron de largo alcance)

`lyutyi` · Ucrania / OTAN · Dron de ataque / señuelo · perfil `drone`

Dron de ataque ucraniano de 250–300 kg usado contra refinerías y bases en Rusia.

- **Guiado:** INS + GNSS + terminal asistida por IA
- **Propulsión:** Motor de pistón bóxer con hélice
- **Ojiva:** 50–75 kg
- **Alcance:** ≈1.000–1.400 km (hasta 2.000 km con ojiva liviana)
- **Costo:** ≈US$200k (reportado)
- **Sin GNSS:** sin corrección independiente del satélite; su buscador terminal corrige errores de hasta 0.3 km
- **Altura de vuelo:** típica 500 m, límites reales 50–3000 m. Estimación: envolvente análogo al Shahed.

- Usado en grandes oleadas contra infraestructura petrolera.
- Más grande y metálico que un Shahed: su RCS estimada es mayor.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 44 | **56** | 83 | baja | [1] | fuentes entre 160 y 300 km/h |
| Altura de vuelo (m AGL) | 50 | **500** | 3.000 | baja | — | est: análogo al Shahed |
| Ventana que corrige el buscador terminal (km) | 0,1 | **0,3** | 1 | baja | — | est: guiado terminal con cámara y reconocimiento por IA de alcance corto |
| RCS frontal (X/S) (m²) | 0,1 | **0,3** | 1 | baja | — | est: motor y hélice como reflectores principales |
| RCS lateral (X/S) (m²) | 0,3 | **0,77** | 3 | baja | [2] | est por forma 1 m² (×3 el frente); regla de CMO: costado = frente +3 dB (×2, mediana de 452 armas guiadas de su base). Probable = media geométrica |
| RCS de cola (X/S) (m²) | 0,1 | **0,3** | 1 | baja | [2] | est por forma 0,3 m²; regla de CMO: cola = frente. Probable = media geométrica |
| RCS en VHF (m²) | 0,3 | **1** | 2 | baja | — | est: con λ≈1,5–2 m el cuerpo entra en zona de resonancia y el conformado furtivo pierde efecto |
| CEP (m) | 3 | **10** | 20 | baja | — | est |
| Costo unitario | US$150k | **US$200k** | US$250k | media | [1] [3] | — |
| Alcance (km) | 800 | **1.200** | 2.000 | media | [1] [3] | — |
| Ojiva (kg) | 50 | **75** | 75 | alta | [1] | — |

1. [Wikipedia: Liutyi](https://en.wikipedia.org/wiki/Liutyi)
2. [Base de datos de Command: Modern Operations (CWDB 514): en 452 armas guiadas, costado = frente +3 dB y cola = frente (regla del juego, no medición)](https://www.matrixgames.com/game/command-modern-operations)
3. [Euromaidan Press: ojiva del Liutyi (ago-2025)](https://euromaidanpress.com/2025/08/09/ukraine-liutyi-drone-warhead-50-percent-growth/)

#### Fuentes generales

- [Wikipedia: Liutyi](https://en.wikipedia.org/wiki/Liutyi)
- [Euromaidan Press: ojiva del Liutyi (ago-2025)](https://euromaidanpress.com/2025/08/09/ukraine-liutyi-drone-warhead-50-percent-growth/)

### FP-5 Flamingo

`flamingo` · Ucrania / OTAN · Misil de crucero subsónico · perfil `cruise`

Misil de crucero grande y barato: crucero a 850–900 km/h y 20–40 m de altura. No es furtivo, apuesta a cantidad y alcance.

- **Guiado:** INS + GNSS con antena CRPA
- **Propulsión:** Turbofán AI-25TL reacondicionado + booster
- **Ojiva:** 1.000–1.150 kg (declarado)
- **Alcance:** 3.000 km declarado; ≈950 km en línea recta demostrado
- **Costo:** "Un poco menos de US$600k" según la CEO de Fire Point (jul-2026)
- **Altura de vuelo:** típica 35 m, límites reales 15–1000 m. Declarado: 15–114 m en crucero (Wikipedia); el tope de 1.000 m es estimación.

- Datos mayormente declarados por el fabricante.
- Kyiv Post (jun-2026): de 34 lanzamientos, solo 5 impactos creíbles, sin separar intercepción de falla.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Velocidad de crucero (m/s) | 194 | **245** | 264 | media | [1] [2] | 700 km/h crucero a 950 km/h máx. declarado |
| Altura de vuelo (m AGL) | 15 | **35** | 114 | baja | [1] | — |
| RCS frontal (X/S) (m²) | 0,3 | **1** | 2 | baja | — | est: fuselaje de composite pero góndola de motor dorsal grande |
| RCS lateral (X/S) (m²) | 1 | **2,4** | 10 | baja | [3] | est por forma 3 m² (×3 el frente); regla de CMO: costado = frente +3 dB (×2, mediana de 452 armas guiadas de su base). Probable = media geométrica |
| RCS de cola (X/S) (m²) | 1 | **1,4** | 5 | baja | [3] | est por forma 2 m²; regla de CMO: cola = frente. Probable = media geométrica |
| RCS en VHF (m²) | 1 | **2** | 5 | baja | — | est: con λ≈1,5–2 m el cuerpo entra en zona de resonancia y el conformado furtivo pierde efecto |
| CEP (m) | 14 | **14** | 50 | baja | [1] | 14 m declarado |
| Costo unitario | US$500k | **US$600k** | US$1.1 M | media | [4] | — |
| Alcance (km) | 950 | **1.800** | 3.000 | media | [4] [1] | 3.000 km es dato del fabricante |
| Ojiva (kg) | 1.000 | **1.000** | 1.150 | alta | [1] | declarado |

1. [Wikipedia: FP-5 Flamingo](https://en.wikipedia.org/wiki/FP-5_Flamingo)
2. [Militarnyi: guiado Safran en el FP-5](https://militarnyi.com/en/news/fp-5-flamingo-missile-uses-safran-guidance-system/)
3. [Base de datos de Command: Modern Operations (CWDB 514): en 452 armas guiadas, costado = frente +3 dB y cola = frente (regla del juego, no medición)](https://www.matrixgames.com/game/command-modern-operations)
4. [Ukrinform: CEO de Fire Point sobre el costo del Flamingo (jul-2026)](https://www.ukrinform.net/rubric-economy/4148530-fire-point-ceo-ukrainian-flamingo-missiles-cost-six-times-less-than-tomahawks.html)

#### Tasas de intercepción reportadas

| Período | Lanzados | Derribados | Tasa | Nota | Fuente |
|---|---:|---:|---|---|---|
| hasta jun-26 | 34 | — | 5 impactos creíbles | no separa intercepción de falla | [Kyiv Post: resultados del Flamingo (jun-2026)](https://www.kyivpost.com/post/79225) |

#### Fuentes generales

- [Wikipedia: FP-5 Flamingo](https://en.wikipedia.org/wiki/FP-5_Flamingo)
- [Ukrinform: CEO de Fire Point sobre el costo del Flamingo (jul-2026)](https://www.ukrinform.net/rubric-economy/4148530-fire-point-ceo-ukrainian-flamingo-missiles-cost-six-times-less-than-tomahawks.html)
- [Kyiv Post: resultados del Flamingo (jun-2026)](https://www.kyivpost.com/post/79225)
- [Militarnyi: guiado Safran en el FP-5](https://militarnyi.com/en/news/fp-5-flamingo-missile-uses-safran-guidance-system/)

## Defensas y sensores

### Patriot (PAC-3 MSE)

`patriot` · Ucrania / OTAN · tipo `sam`

≈40 km vs balísticos (estimado), ≈100 km vs aeronaves · PAC-3 MSE: hit-to-kill, buscador activo, motor de doble pulso, techo ≈36 km

- **Sensor:** AN/MPQ-65, Banda C (G/H OTAN), 100 km contra 1 m², sector 90°, refresco 2 s, ECCM 10 dB
- **Altura de antena:** 4 m, fija. Fija: la antena va sobre el semirremolque M860, inclinada a 67,5°. El mástil de ≈30 m de la batería (AMG) es de comunicaciones, no del radar (FM 3-01.85).
- **Arma:** PAC-3 MSE, guiado activo, 3–100 km (balísticos: 40 km), 50 m–36 km, 8 canales, 16 disparos, Pk base dron 0.9 · crucero 0.9 · supersonico 0.6 · balistico 0.7 · hiper 0.5

- El AN/MPQ-65 busca en un sector de ~90° (sigue en ~120°): hay que orientarlo hacia la amenaza. El LTAMDS nuevo tiene 3 paneles y 360°.
- El radar guía hasta ~9 misiles a la vez.
- Lanzador M903: hasta 12 MSE (o 16 CRI); una batería tiene 6–8 lanzadores.
- Costo: US$4,19 M por misil en el presupuesto FY2025; el contrato plurianual de 2025 da ≈4,97 M con costos asociados.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Tiempo de recarga de la batería (s) | 1.800 | **2.400** | 3.600 | baja | [1] | foro de CMO: ≈40 min; 30–60 min por lanzador con grúa |
| Radar: detección contra 1 m² (km) | 90 | **100** | 120 | baja | [2] | est: 170 km es el alcance instrumentado; avión grande 150–170 km, escalado con σ^¼ |
| Radar: sector de búsqueda (°) | 90 | **90** | 120 | media | [2] | búsqueda 90°, seguimiento 120° |
| Radar: refresco (s) | 1 | **2** | 3 | baja | — | est: barrido electrónico en sector fijo |
| Radar: discriminación de señuelos (×, divide el τ de su banda) (×) | 1 | **4** | 8 | baja | — | est: el MPQ-65 es un arreglo de fase multifunción con modos de discriminación de blancos balísticos; no hay cifra pública. ×4 compensa la dificultad de los señuelos de balístico (DECOY_HARD) y los clasifica al ritmo de un señuelo común |
| Alcance vs aeronaves/crucero (km) | 60 | **100** | 120 | baja | [3] | — |
| Alcance vs balísticos (km) | 30 | **40** | 60 | baja | [3] | — |
| Techo (m) | 35.000 | **36.000** | 40.000 | media | [3] | — |
| Velocidad media del interceptor (m/s) | 1.100 | **1.300** | 1.500 | baja | — | est: ≈0,75 × velocidad máxima |
| Tiempo de reacción (s) | 8 | **9** | 15 | baja | [4] | — |
| Canales simultáneos | 6 | **8** | 9 | media | [2] | 9 misiles guiados a la vez |
| Munición de la unidad | 12 | **16** | 48 | media | [5] | M903: 12 MSE; 6–8 lanzadores por batería |
| Costo por disparo | US$4 M | **US$4.2 M** | US$5.3 M | alta | [6] [7] | FY2025: 4,19 M; plurianual 2025 ≈4,97 M con costos asociados |
| Pk por disparo vs drones | 0,8 | **0,9** | 0,95 | baja | — | est |
| Pk por disparo vs crucero | 0,8 | **0,9** | 0,95 | media | — | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs supersónicos | 0,4 | **0,6** | 0,8 | baja | [8] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs balísticos | 0,4 | **0,7** | 0,85 | media | [9] [10] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs hipersónicos | 0,3 | **0,5** | 0,7 | baja | [11] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Foro de Matrix Games: recargar una batería Patriot en CMO (≈40 min, ejemplo de juego)](http://www.matrixgames.com/forums/viewtopic.php?t=294701)
2. [Radartutorial: AN/MPQ-53](https://www.radartutorial.eu/19.kartei/06.missile/karte003.en.html)
3. [Wikipedia: MIM-104 Patriot](https://en.wikipedia.org/wiki/MIM-104_Patriot)
4. [Army Recognition: SAMP/T vs Patriot en Ucrania](https://www.armyrecognition.com/focus-analysis-conflicts/army/defence-security-industry-technology/french-samp-t-vs-u-s-patriot-air-defense-systems-technical-and-operational-analysis-in-ukraine)
5. [CSIS Missile Defense: Patriot](https://missilethreat.csis.org/system/patriot/)
6. [US Army FY2025 Missile Procurement (P-40, costo unitario PAC-3 MSE)](https://www.asafm.army.mil/Portals/72/Documents/BudgetMaterial/2025/Base%20Budget/Procurement/Missile-Procurement-Army.pdf)
7. [Breaking Defense: contrato plurianual PAC-3 (sep-2025)](https://breakingdefense.com/2025/09/army-awards-lockheed-multiyear-9-8-billion-contract-for-thousands-of-pac-3-missiles/)
8. [RBC-Ukraine: 9 de 12 Kh-22 derribados sobre Kyiv (feb-2026)](https://newsukraine.rbc.ua/news/kyiv-attack-air-force-shoots-down-9-kh-22-1770042905.html)
9. [RUSI: Iskander, an improved Russian missile tests Ukraine’s air defence (nov-2025)](https://www.rusi.org/explore-our-research/publications/commentary/iskander-improved-russian-missile-tests-ukraines-air-defence)
10. [AeroTime (resume Financial Times): intercepción de balísticos 37% → 6% (2025)](https://www.aerotime.aero/articles/russias-upgraded-ballistic-missiles-outmaneuver-ukraines-patriot-systems-ft)
11. [NV: SAMP/T y Patriot interceptan Zircon (mar-2024)](https://english.nv.ua/nation/ukraine-uses-european-samp-t-and-american-patriot-systems-to-intercept-russian-zircon-missiles-50404796.html)

#### Fuentes generales

- [Wikipedia: MIM-104 Patriot](https://en.wikipedia.org/wiki/MIM-104_Patriot)
- [CSIS Missile Defense: Patriot](https://missilethreat.csis.org/system/patriot/)
- [Radartutorial: AN/MPQ-53](https://www.radartutorial.eu/19.kartei/06.missile/karte003.en.html)
- [US Army FY2025 Missile Procurement (P-40, costo unitario PAC-3 MSE)](https://www.asafm.army.mil/Portals/72/Documents/BudgetMaterial/2025/Base%20Budget/Procurement/Missile-Procurement-Army.pdf)
- [Breaking Defense: contrato plurianual PAC-3 (sep-2025)](https://breakingdefense.com/2025/09/army-awards-lockheed-multiyear-9-8-billion-contract-for-thousands-of-pac-3-missiles/)

### Patriot (PAC-2 GEM-T)

`patriot2` · Ucrania / OTAN · tipo `sam`

≈160 km vs aeronaves, ≈20 km vs balísticos · GEM-T: fragmentación, guiado TVM (necesita que el radar propio vea el blanco), Mach ≈3,5

- **Sensor:** AN/MPQ-65, Banda C (G/H OTAN), 100 km contra 1 m², sector 90°, refresco 2 s, ECCM 10 dB
- **Altura de antena:** 4 m, fija. Fija: la antena va sobre el semirremolque M860. El mástil de ≈30 m (AMG) es de comunicaciones, no del radar.
- **Arma:** PAC-2 GEM-T, guiado TVM, 3–160 km (balísticos: 20 km), 60 m–24 km, 8 canales, 16 disparos, Pk base dron 0.8 · crucero 0.85 · supersonico 0.55 · balistico 0.4 · hiper 0.25

- Mayor alcance contra aviones y misiles de crucero que el MSE, pero peor contra balísticos.
- 4 misiles por lanzador M901/M903.
- Precio unitario no publicado: US$2–4 M según estimaciones de prensa.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 90 | **100** | 120 | baja | [1] | mismo radar que el MSE |
| Radar: discriminación de señuelos (×, divide el τ de su banda) (×) | 1 | **4** | 8 | baja | — | est: mismo radar que el MSE |
| Radar: sector de búsqueda (°) | 90 | **90** | 120 | media | [1] | — |
| Alcance vs aeronaves/crucero (km) | 120 | **160** | 160 | baja | [2] | — |
| Alcance vs balísticos (km) | 15 | **20** | 30 | baja | — | — |
| Techo (m) | 24.000 | **24.000** | 32.000 | baja | [2] | — |
| Velocidad media del interceptor (m/s) | 800 | **900** | 1.100 | baja | — | est: Mach 3,5 máx. |
| Costo por disparo | US$2 M | **US$3 M** | US$4 M | baja | [3] | precio oficial no público |
| Pk por disparo vs crucero | 0,7 | **0,85** | 0,9 | baja | — | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs supersónicos | 0,4 | **0,55** | 0,7 | baja | — | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs balísticos | 0,2 | **0,4** | 0,6 | baja | — | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs hipersónicos | 0,1 | **0,25** | 0,4 | baja | — | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Radartutorial: AN/MPQ-53](https://www.radartutorial.eu/19.kartei/06.missile/karte003.en.html)
2. [Wikipedia: MIM-104 Patriot](https://en.wikipedia.org/wiki/MIM-104_Patriot)
3. [Army Recognition: pedido de GEM-T 2026](https://www.armyrecognition.com/news/army-news/2026/us-army-pac-2-gem-t-patriot-interceptor-order)

#### Fuentes generales

- [Wikipedia: MIM-104 Patriot](https://en.wikipedia.org/wiki/MIM-104_Patriot)
- [CSIS Missile Defense: Patriot](https://missilethreat.csis.org/system/patriot/)
- [Army Recognition: pedido de GEM-T 2026](https://www.armyrecognition.com/news/army-news/2026/us-army-pac-2-gem-t-patriot-interceptor-order)

### SAMP/T (Aster 30 B1)

`sampt` · Ucrania / OTAN · tipo `sam`

≈100 km vs aeronaves (50 km por debajo de 3 km de altura), 20–35 km vs balísticos · Aster 30: 1,4 km/s, buscador activo, control "PIF-PAF" (toberas laterales para maniobra final)

- **Sensor:** Arabel, Banda X (I/J OTAN), 80 km contra 1 m², sector 360°, refresco 1 s, ECCM 10 dB
- **Altura de antena:** 5 m, fija. Fija: Arabel montado sobre camión (altura estimada).
- **Arma:** Aster 30, guiado activo, 3–100 km (balísticos: 25 km), 50 m–20 km, 10 canales, 32 disparos, Pk base dron 0.85 · crucero 0.88 · supersonico 0.6 · balistico 0.6 · hiper 0.4

- Radar Arabel en banda X, giratorio a 60 rpm (refresco 1 s), ~100 km de alcance.
- 8 misiles por lanzador vertical, 4–6 lanzadores por batería; 10 blancos simultáneos.
- En Ucrania tuvo problemas de software contra algunos balísticos y escasez de misiles (2025). La afirmación de que superó al Patriot contra Iskander es de baja confianza.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 70 | **80** | 100 | media | [1] [2] | Arabel: ~100 km, banda X, 60 rpm |
| Alcance vs aeronaves/crucero (km) | 50 | **100** | 120 | media | [1] [2] | 100 km por encima de 3 km de altura, 50 km por debajo |
| Alcance vs balísticos (km) | 20 | **25** | 35 | baja | [1] | prueba: intercepción a 26 km de distancia |
| Techo (m) | 20.000 | **20.000** | 20.000 | media | [1] | — |
| Velocidad media del interceptor (m/s) | 950 | **1.050** | 1.200 | baja | — | est: 1,4 km/s máx. |
| Tiempo de reacción (s) | 5 | **8** | 10 | baja | [3] | — |
| Canales simultáneos | 10 | **10** | 10 | media | [2] | — |
| Munición de la unidad | 24 | **32** | 48 | media | [1] | 4–6 lanzadores × 8 |
| Costo por disparo | US$1 M | **US$2 M** | US$3 M | baja | — | sin precio oficial; €1–2,5 M según fuentes |
| Pk por disparo vs crucero | 0,75 | **0,88** | 0,95 | media | — | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs balísticos | 0,3 | **0,6** | 0,8 | baja | [3] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk"); problemas de software reportados en 2025 |
| Pk por disparo vs hipersónicos | 0,2 | **0,4** | 0,6 | baja | [4] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Army Technology: Aster 30](https://www.army-technology.com/projects/aster-30/)
2. [CSIS Missile Defense: SAMP/T](https://missilethreat.csis.org/defsys/samp-t/)
3. [Army Recognition: SAMP/T vs Patriot en Ucrania](https://www.armyrecognition.com/focus-analysis-conflicts/army/defence-security-industry-technology/french-samp-t-vs-u-s-patriot-air-defense-systems-technical-and-operational-analysis-in-ukraine)
4. [NV: SAMP/T y Patriot interceptan Zircon (mar-2024)](https://english.nv.ua/nation/ukraine-uses-european-samp-t-and-american-patriot-systems-to-intercept-russian-zircon-missiles-50404796.html)

#### Fuentes generales

- [Wikipedia: SAMP/T](https://en.wikipedia.org/wiki/SAMP/T)
- [CSIS Missile Defense: SAMP/T](https://missilethreat.csis.org/defsys/samp-t/)
- [Army Technology: Aster 30](https://www.army-technology.com/projects/aster-30/)
- [Army Recognition: SAMP/T vs Patriot en Ucrania](https://www.armyrecognition.com/focus-analysis-conflicts/army/defence-security-industry-technology/french-samp-t-vs-u-s-patriot-air-defense-systems-technical-and-operational-analysis-in-ukraine)

### IRIS-T SLM

`irist` · Ucrania / OTAN · tipo `sam`

40 km, techo 20 km (SLX: 80 km) · IRIS-T SL: guiado inercial + datalink, buscador IR de imagen terminal, ≈Mach 3

- **Sensor:** Hensoldt TRML-4D, Banda C (G/H OTAN), 100 km contra 1 m², sector 360°, refresco 1 s, ECCM 10 dB
- **Altura de antena:** 6 m por defecto, regulable 4–12 m. Mástil hidráulico sobre el camión: la antena llega hasta 12 m (Hensoldt). Retraído ≈4 m (estimado).
- **Arma:** IRIS-T SL, guiado IR, 1–40 km (balísticos: — km), 10 m–20 km, 8 canales, 24 disparos, Pk base dron 0.9 · crucero 0.88 · supersonico 0.2 · balistico 0 · hiper 0

- El TRML-4D es banda C (G OTAN): 250 km instrumentados, cazas a más de 120 km, misiles supersónicos a más de 60 km, 1.500 pistas.
- Diehl y operadores ucranianos reclaman "casi 100%" (≈240 derribos a jun-2024), sobre todo contra crucero y drones. No hay datos contra balísticos.
- Al ser IR, puede atacar con pista de la red sin que el radar propio vea el blanco en el último tramo; las bengalas del Kh-101 son justamente contra este tipo de buscador.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Tiempo de recarga de la batería (s) | 600 | **1.200** | 2.400 | baja | — | est: sin dato público firme |
| Radar: detección contra 1 m² (km) | 80 | **100** | 150 | media | [1] | cazas a más de 120 km, misiles supersónicos a más de 60 km |
| Alcance vs aeronaves/crucero (km) | 40 | **40** | 40 | alta | [2] | — |
| Alcance vs balísticos (km) | 0 | **0** | 10 | baja | — | sin datos públicos de capacidad antibalística (se quitó del modelo) |
| Techo (m) | 20.000 | **20.000** | 20.000 | alta | [2] | — |
| Altura mínima de enfrentamiento (m) | 5 | **10** | 30 | baja | — | est: no publicado; buscador IR de imagen, sin problema de clutter de mar |
| Velocidad media del interceptor (m/s) | 650 | **750** | 850 | baja | — | est: ≈Mach 3 máx. |
| Blanco más rápido enfrentable (m/s) | 1.000 | **1.200** | 1.500 | baja | — | est: no hay datos contra blancos de Mach 3+ |
| Canales simultáneos | 8 | **8** | 12 | baja | [3] | "100% en oleadas de más de 12 blancos" |
| Costo por disparo | US$430k | **US$500k** | US$610k | media | [2] | €400–565k |
| Pk por disparo vs drones | 0,8 | **0,9** | 0,97 | media | [3] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs crucero | 0,8 | **0,88** | 0,97 | media | [3] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs supersónicos | 0,1 | **0,2** | 0,35 | baja | [4] | est: sin datos contra Mach 2–4; Oniks 5,7% a nivel nacional |

1. [Hensoldt: TRML-4D](https://www.hensoldt.net/products/trml-4d-air-surveillance-and-target-acquisition-radar)
2. [Wikipedia: IRIS-T SL](https://en.wikipedia.org/wiki/IRIS-T_SL)
3. [Defense Mirror: Diehl, IRIS-T SLM ~100% en Ucrania](https://defensemirror.com/news/34282/IRIS_T_SLM_air_defence_system_Achieved_100_Per_Cent_Hit_Rate_in_Ukraine__Diehl_Defence)
4. [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html)

#### Fuentes generales

- [Wikipedia: IRIS-T SL](https://en.wikipedia.org/wiki/IRIS-T_SL)
- [Wikipedia: TRML](https://en.wikipedia.org/wiki/TRML)
- [Hensoldt: TRML-4D](https://www.hensoldt.net/products/trml-4d-air-surveillance-and-target-acquisition-radar)
- [Defense Mirror: Diehl, IRIS-T SLM ~100% en Ucrania](https://defensemirror.com/news/34282/IRIS_T_SLM_air_defence_system_Achieved_100_Per_Cent_Hit_Rate_in_Ukraine__Diehl_Defence)

### NASAMS (AIM-120 AMRAAM)

`nasams` · Ucrania / OTAN · tipo `sam`

≈35–40 km (AMRAAM-ER: 50–60 km) · AIM-120: misil aire-aire adaptado, buscador radar activo

- **Sensor:** AN/MPQ-64 Sentinel, Banda X (I/J OTAN), 60 km contra 1 m², sector 360°, refresco 2 s, ECCM 8 dB
- **Altura de antena:** 4 m, fija. Fija: Sentinel sobre remolque (altura estimada).
- **Arma:** AIM-120, guiado activo, 1–35 km (balísticos: — km), 30 m–15 km, 6 canales, 18 disparos, Pk base dron 0.85 · crucero 0.88 · supersonico 0.4 · balistico 0 · hiper 0

- Noruega reclamó 94% de éxito en Ucrania (feb-2025, ~900 AMRAAM); no se aclara si es por disparo o por blanco y ~60% de los blancos eran crucero.
- Sentinel: banda X, 30 rpm (refresco 2 s); 40 km el modelo básico, 120 km el F1.
- 3 lanzadores de 6 misiles por unidad de fuego. No sirve contra balísticos.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Tiempo de recarga de la batería (s) | 900 | **1.800** | 3.600 | baja | — | est: lanzador de 6 AMRAAM recargado con grúa; sin dato público firme |
| Radar: detección contra 1 m² (km) | 40 | **60** | 90 | media | [1] | 40 km el básico, 120 km el F1/A3 |
| Alcance vs aeronaves/crucero (km) | 25 | **35** | 40 | media | [2] | — |
| Techo (m) | 12.000 | **15.000** | 21.000 | baja | [3] | est |
| Altura mínima de enfrentamiento (m) | 15 | **30** | 60 | baja | — | est: buscador radar activo contra clutter de superficie |
| Velocidad media del interceptor (m/s) | 800 | **900** | 1.000 | baja | — | est |
| Costo por disparo | US$1 M | **US$1.07 M** | US$2.5 M | alta | [4] | AIM-120 ≈1,07 M (P-1 FY2025); AMRAAM-ER sin precio oficial |
| Pk por disparo vs drones | 0,75 | **0,85** | 0,94 | media | [5] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs crucero | 0,75 | **0,88** | 0,94 | media | [5] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk"); Noruega reclama 94% |
| Pk por disparo vs supersónicos | 0,25 | **0,4** | 0,6 | baja | — | est |

1. [Wikipedia: AN/MPQ-64 Sentinel](https://en.wikipedia.org/wiki/AN/MPQ-64_Sentinel)
2. [CRS IF12230: NASAMS](https://www.everycrsreport.com/reports/IF12230.html)
3. [Kongsberg: AMRAAM-ER](https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/raytheon-missiles/)
4. [DoD FY2025 P-1 (AMRAAM, PAC-3)](https://comptroller.defense.gov/Portals/45/Documents/defbudget/FY2025/FY2025_p1.pdf)
5. [Aviation Week: Noruega reclama 94% para NASAMS en Ucrania](https://aviationweek.com/defense/missile-defense-weapons/norway-claims-94-success-rate-nasams-deployed-ukraine)

#### Fuentes generales

- [Wikipedia: NASAMS](https://en.wikipedia.org/wiki/NASAMS)
- [CRS IF12230: NASAMS](https://www.everycrsreport.com/reports/IF12230.html)
- [Kongsberg: AMRAAM-ER](https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/raytheon-missiles/)
- [Aviation Week: Noruega reclama 94% para NASAMS en Ucrania](https://aviationweek.com/defense/missile-defense-weapons/norway-claims-94-success-rate-nasams-deployed-ukraine)
- [DoD FY2025 P-1 (AMRAAM, PAC-3)](https://comptroller.defense.gov/Portals/45/Documents/defbudget/FY2025/FY2025_p1.pdf)

### S-300PS/PT (5V55R)

`s300` · Ucrania / OTAN · tipo `sam`

47 km (5V55K) / 75 km (5V55R), techo 27 km · 5V55: hasta 2.000 m/s, guiado por mando (K) o TVM (R)

- **Sensor:** 30N6 Flap Lid (en torre 40V6), Banda X (I/J OTAN), 100 km contra 1 m², sector 90°, refresco 2 s, ECCM 3 dB
- **Altura de antena:** 25 m por defecto, regulable 7–39 m. Sin torre, la antena queda a ≈7 m sobre su vehículo (estimado); en la torre 40V6M a ≈25 m y en la 40V6MD a ≈39 m (Air Power Australia). Armar la torre lleva 1–2 h, no se cambia durante el combate.
- **Arma:** 5V55R, guiado TVM, 5–75 km (balísticos: 25 km), 25 m–27 km, 4 canales, 16 disparos, Pk base dron 0.5 · crucero 0.6 · supersonico 0.4 · balistico 0.15 · hiper 0.05

- Ucrania tenía 35 batallones S-300PS/PT en feb-2022 (RUSI), ~250 lanzadores: fue la columna vertebral de su defensa en 2022.
- El 30N6 puede ir sobre la torre 40V6M (antena a ~24 m) o 40V6MD (~39 m): con 24 m ve un blanco a 25 m de altura a ~41 km.
- Misiles soviéticos escasos: no hay producción nueva.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 80 | **100** | 130 | baja | [1] | est |
| Radar: sector de búsqueda (°) | 90 | **90** | 90 | alta | [1] | — |
| Alcance vs aeronaves/crucero (km) | 47 | **75** | 75 | alta | [2] | 5V55K 47 km / 5V55R 75 km |
| Velocidad media del interceptor (m/s) | 1.100 | **1.300** | 1.500 | baja | — | est: 2.000 m/s máx. |
| Canales simultáneos | 4 | **4** | 6 | media | [1] [2] | PT: 4 blancos; PS: 6 |
| Costo por disparo | US$300k | **US$500k** | US$1 M | baja | — | est: sin precio público |
| Pk por disparo vs crucero | 0,4 | **0,6** | 0,75 | media | [3] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs balísticos | 0,05 | **0,15** | 0,3 | baja | [3] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Ausairpower: radares de control de tiro rusos](https://www.ausairpower.net/APA-Engagement-Fire-Control.html)
2. [Wikipedia: S-300 missile system](https://en.wikipedia.org/wiki/S-300_missile_system)
3. [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html)

#### Fuentes generales

- [Wikipedia: S-300 missile system](https://en.wikipedia.org/wiki/S-300_missile_system)
- [RUSI: Preliminary lessons in conventional warfighting (2022)](https://static.rusi.org/359-SR-Ukraine-Preliminary-Lessons-Feb-July-2022-web-final.pdf)
- [Ausairpower: radares de control de tiro rusos](https://www.ausairpower.net/APA-Engagement-Fire-Control.html)
- [Ausairpower: mástil 40V6M](https://www.ausairpower.net/APA-40V6M-Mast-System.html)

### Buk-M1 (9M38)

`buk` · ambos bandos · tipo `sam`

3,3–35 km, techo 22 km · 9M38: ≈Mach 3, semiactivo: el radar del lanzador tiene que iluminar el blanco hasta el impacto

- **Sensor:** 9S35 Fire Dome (+9S18M1 Snow Drift), Banda X (I/J OTAN), 50 km contra 1 m², sector 360°, refresco 2 s, ECCM 3 dB
- **Altura de antena:** 4 m, fija. Fija: radar sobre el vehículo de orugas (altura estimada).
- **Arma:** 9M38, guiado SARH, 3.3–35 km (balísticos: 10 km), 15 m–22 km, 3 canales, 12 disparos, Pk base dron 0.55 · crucero 0.6 · supersonico 0.35 · balistico 0.05 · hiper 0

- Lo usan ambos bandos (Rusia con versiones M2/M3). Ucrania tenía 15 divisiones en 2022.
- El 9S18M1 (banda centimétrica) detecta a ~85 km a altura; a 100 m de altura solo ~35 km.
- Ucrania adaptó lanzadores Buk para disparar RIM-7 Sea Sparrow ("FrankenSAM").

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 35 | **50** | 85 | baja | [1] | 9S18M1 85 km a altura; 9S35 est 40–50 km |
| Alcance vs aeronaves/crucero (km) | 33 | **35** | 42 | media | [2] | — |
| Velocidad media del interceptor (m/s) | 550 | **650** | 750 | baja | — | est: ≈850 m/s máx. |
| Blanco más rápido enfrentable (m/s) | 800 | **830** | 1.000 | media | [1] | — |
| Tiempo de reacción (s) | 15 | **22** | 25 | media | [2] | — |
| Costo por disparo | US$300k | **US$500k** | US$1 M | baja | — | est |
| Pk por disparo vs crucero | 0,4 | **0,6** | 0,75 | media | [3] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Wikipedia: Buk missile system](https://en.wikipedia.org/wiki/Buk_missile_system)
2. [Missilery.info: Buk-M1](https://en.missilery.info/missile/bukm1)
3. [Defense Express: estadística de Syrskyi (24/02/2022–21/08/2024)](https://en.defence-ua.com/news/cinc_of_ukraines_forces_syrskii_releases_statistics_on_missiles_and_drones_usage_by_russians_number_of_destroyed_threats-11588.html)

#### Fuentes generales

- [Wikipedia: Buk missile system](https://en.wikipedia.org/wiki/Buk_missile_system)
- [Missilery.info: Buk-M1](https://en.missilery.info/missile/bukm1)
- [RUSI: Preliminary lessons in conventional warfighting (2022)](https://static.rusi.org/359-SR-Ukraine-Preliminary-Lessons-Feb-July-2022-web-final.pdf)

### Flakpanzer Gepard (2×35 mm)

`gepard` · Ucrania / OTAN · tipo `gun`

≈3,5–4 km típico (5,5 km con FAPDS) · Dos cañones Oerlikon 35 mm, 550 disparos/min cada uno, 640 proyectiles a bordo

- **Sensor:** Búsqueda S + seguimiento Ku, Banda S (E/F OTAN), 15 km contra 1 m², sector 360°, refresco 1 s, ECCM 0 dB
- **Altura de antena:** 3 m, fija. Fija: radar sobre la torreta (altura estimada).
- **Arma:** ráfaga 35 mm, guiado cañón, 0.1–4 km (balísticos: — km), 0 m–3 km, 1 canales, 20 disparos, Pk base dron 0.55 · crucero 0.35 · supersonico 0.05 · balistico 0 · hiper 0

- Considerado de los mejores "mata-Shahed".
- Cada proyectil cuesta ~US$600 (Rheinmetall, 2025): una ráfaga de 20–40 disparos sale US$12–24k.
- El cuello de botella es la munición de 35 mm; inútil si el dron vuela por encima de ~3 km.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Alcance vs aeronaves/crucero (km) | 3,5 | **4** | 5,5 | media | [1] | — |
| Techo (m) | 2.500 | **3.000** | 3.500 | baja | — | est |
| Munición de la unidad | 16 | **20** | 32 | media | [1] | 640 proyectiles / 20–40 por ráfaga |
| Costo por disparo | US$12k | **US$18k** | US$24k | media | [2] | ≈US$600 por proyectil × 20–40 |
| Pk por disparo vs drones | 0,35 | **0,55** | 0,75 | baja | — | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Wikipedia: Flakpanzer Gepard](https://en.wikipedia.org/wiki/Flakpanzer_Gepard)
2. [Forbes (Hambling): costo de la munición antidrón (sep-2025)](https://www.forbes.com/sites/davidhambling/2025/09/10/why-some-anti-drone-artillery-comes-at-a-sky-high-price/)

#### Fuentes generales

- [Wikipedia: Flakpanzer Gepard](https://en.wikipedia.org/wiki/Flakpanzer_Gepard)
- [Forbes (Hambling): costo de la munición antidrón (sep-2025)](https://www.forbes.com/sites/davidhambling/2025/09/10/why-some-anti-drone-artillery-comes-at-a-sky-high-price/)

### Grupo de fuego móvil (ametralladora + reflector)

`mfg` · Ucrania / OTAN · tipo `gun`

≈1,5 km · Pickup con ametralladora pesada (DShK/M2), reflector y visor térmico

- **Sensor:** Visual / térmico, Óptico / IR, 5 km contra 1 m², sector 360°, refresco 1 s, ECCM inmune
- **Altura de antena:** 2 m, fija. Fija: ojos y óptica del equipo.
- **Arma:** ráfaga 12,7 mm, guiado cañón, 0–1.5 km (balísticos: — km), 0 m–1.5 km, 1 canales, 30 disparos, Pk base dron 0.2 · crucero 0.05 · supersonico 0 · balistico 0 · hiper 0

- Muy barato, se reubica rápido y aprovecha la alerta de la red acústica.
- Por eso Rusia subió la altura de vuelo de los Shahed a 2–5 km.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Tiempo de recarga de la batería (s) | 60 | **120** | 300 | baja | — | est: cambiar la cinta de la ametralladora |
| Radar: detección contra 1 m² (km) | 2 | **5** | 8 | baja | — | est: visual/térmico nocturno con alerta acústica |
| Alcance vs aeronaves/crucero (km) | 1 | **1,5** | 2 | media | — | — |
| Pk por disparo vs drones | 0,05 | **0,2** | 0,3 | baja | — | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

#### Fuentes generales

- [Wikipedia: HESA Shahed 136](https://en.wikipedia.org/wiki/HESA_Shahed_136)
- [UNITED24: por qué los enjambres vuelan más alto (2025)](https://united24media.com/war-in-ukraine/why-russias-drone-swarms-are-getting-deadlier-by-flying-higher-9305)

### MANPADS (Stinger / Igla)

`manpads` · ambos bandos · tipo `sam`

≈4,8 km, techo ≈3,8 km · Misil portátil con buscador infrarrojo (Stinger Mach 2,2; Igla ≈570 m/s)

- **Sensor:** Visual / IR, Óptico / IR, 7 km contra 1 m², sector 360°, refresco 1 s, ECCM inmune
- **Altura de antena:** 2 m, fija. Fija: el tirador.
- **Arma:** FIM-92 Stinger, guiado IR, 0.2–4.8 km (balísticos: — km), 10 m–3.8 km, 1 canales, 4 disparos, Pk base dron 0.5 · crucero 0.4 · supersonico 0.05 · balistico 0 · hiper 0

- Stinger: más de US$400k; Igla: ~US$60–80k (dato viejo).
- Se usan en grupos móviles y contra helicópteros. Las bengalas los degradan.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Alcance vs aeronaves/crucero (km) | 4,5 | **4,8** | 6 | alta | [1] [2] | — |
| Velocidad media del interceptor (m/s) | 450 | **550** | 650 | baja | — | est |
| Costo por disparo | US$60k | **US$450k** | US$500k | media | [1] [2] | Igla 60–80k; Stinger >400k |
| Pk por disparo vs drones | 0,3 | **0,5** | 0,7 | baja | — | est |

1. [Wikipedia: FIM-92 Stinger](https://en.wikipedia.org/wiki/FIM-92_Stinger)
2. [Wikipedia: 9K38 Igla](https://en.wikipedia.org/wiki/9K38_Igla)

#### Fuentes generales

- [Wikipedia: FIM-92 Stinger](https://en.wikipedia.org/wiki/FIM-92_Stinger)
- [Wikipedia: 9K38 Igla](https://en.wikipedia.org/wiki/9K38_Igla)

### Drones interceptores (tipo Sting)

`intdrone` · Ucrania / OTAN · tipo `sam`

≈25 km · Ala/cuadricóptero rápido (Sting: 343 km/h, techo 3.000 m, cámara térmica) guiado por operador

- **Arma:** dron interceptor, guiado operador, 0.3–25 km (balísticos: — km), 50 m–3 km, 4 canales, 20 disparos, Pk base dron 0.6 · crucero 0.05 · supersonico 0 · balistico 0 · hiper 0

- No tiene sensor propio: necesita pista de la red (radar o acústica). Sin red, no sirve.
- Sting cuesta ~US$2.100. Interceptores: >70% de los Shahed derribados sobre Kyiv en feb-2026 y ~1/3 de los blancos a nivel nacional en mar-2026, con >60% de éxito por salida.
- Contra un Geran-3 (≈300–370 km/h) solo funciona de frente: el primer derribo fue en nov-2025.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Alcance vs aeronaves/crucero (km) | 10 | **25** | 25 | media | [1] | — |
| Velocidad media del interceptor (m/s) | 70 | **85** | 95 | media | [1] | 343 km/h máx. |
| Blanco más rápido enfrentable (m/s) | 70 | **95** | 100 | baja | [2] | derribó un Geran-3 de frente |
| Tiempo de reacción (s) | 10 | **20** | 40 | baja | — | est: despegue y aproximación |
| Costo por disparo | US$2k | **US$3k** | US$5k | media | [1] [3] | — |
| Pk por disparo vs drones | 0,4 | **0,6** | 0,75 | media | [3] | >60% de éxito por salida |

1. [Wikipedia: Sting (drone)](https://en.wikipedia.org/wiki/Sting_(drone))
2. [Militarnyi: primer derribo de un Geran-3 con dron interceptor](https://militarnyi.com/en/news/ukrainian-interceptor-drone-downs-jet-powered-shahed-for-the-first-time/)
3. [Defense News: drones interceptores (mar-2026)](https://www.defensenews.com/global/europe/2026/03/05/novel-interceptor-drones-bend-air-defense-economics-in-ukraines-favor/)

#### Fuentes generales

- [Wikipedia: Sting (drone)](https://en.wikipedia.org/wiki/Sting_(drone))
- [Ukrinform: interceptores derriban >70% de los Shahed sobre Kyiv (feb-2026)](https://www.ukrinform.net/amp/rubric-ato/4097519-interceptor-drones-shot-down-over-70-of-shahed-drones-over-kyiv-in-feb-syrskyi.html)
- [Defense News: drones interceptores (mar-2026)](https://www.defensenews.com/global/europe/2026/03/05/novel-interceptor-drones-bend-air-defense-economics-in-ukraines-favor/)
- [Militarnyi: primer derribo de un Geran-3 con dron interceptor](https://militarnyi.com/en/news/ukrainian-interceptor-drone-downs-jet-powered-shahed-for-the-first-time/)

### MIM-23B I-Hawk (Fase III)

`hawk` · Ucrania / OTAN · tipo `sam`

1,5–40 km, techo ≈17 km · MIM-23B: ≈Mach 2,5, semiactivo: el HPIR ilumina el blanco hasta el impacto

- **Sensor:** AN/MPQ-61 HPIR (+ AN/MPQ-50 PAR, AN/MPQ-62 CWAR), Banda X (I/J OTAN), 70 km contra 1 m², sector 360°, refresco 2 s, ECCM 5 dB
- **Altura de antena:** 4 m, fija. Fija: radares sobre remolques (altura estimada).
- **Arma:** MIM-23B, guiado SARH, 1.5–40 km (balísticos: — km), 60 m–17.7 km, 2 canales, 9 disparos, Pk base dron 0.6 · crucero 0.7 · supersonico 0.4 · balistico 0 · hiper 0

- España entregó baterías Fase III desde fines de 2022 (21 lanzadores, radares MPQ-61 y MPQ-62) y más lanzadores en 2023–24; EE. UU. aportó misiles.
- Una sola unidad ucraniana reclamó 14 misiles de crucero y 40 Shahed derribados.
- Cada HPIR guía contra un blanco a la vez: dos secciones de fuego = dos canales.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 50 | **70** | 100 | baja | [1] | CMO: HPIR 45 nmi (83 km) y PAR 54 nmi (100 km) de alcance instrumentado; est contra 1 m² |
| Alcance vs aeronaves/crucero (km) | 35 | **40** | 50 | media | [1] [2] | CMO 22 nmi ≈ 40 km; OSINT 35–50 km |
| Velocidad media del interceptor (m/s) | 600 | **700** | 850 | baja | [2] | Mach 2,5 máx.; est media |
| Blanco más rápido enfrentable (m/s) | 700 | **820** | 900 | baja | [1] | CMO: blancos hasta 1.600 nudos |
| Tiempo de reacción (s) | 10 | **15** | 30 | baja | — | est |
| Costo por disparo | US$200k | **US$300k** | US$500k | baja | — | est: misil viejo de stock reacondicionado |
| Pk por disparo vs crucero | 0,5 | **0,7** | 0,85 | baja | [2] | analistas occidentales hablan de ~85%; est más conservadora. calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |
| Pk por disparo vs drones | 0,4 | **0,6** | 0,8 | baja | [2] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Base de datos de Command: Modern Operations (DB3000 515): alcances, techos y velocidades de MIM-23, 5V28 y 5V27 (estimaciones de juego, en millas náuticas)](https://www.matrixgames.com/game/command-modern-operations)
2. [Defence Blog: el veterano Hawk resulta eficaz contra misiles rusos (una unidad: 14 crucero y 40 Shahed)](https://defence-blog.com/vintage-hawk-system-proves-effective-against-russian-missiles/)

#### Fuentes generales

- [Wikipedia: MIM-23 Hawk](https://en.wikipedia.org/wiki/MIM-23_Hawk)
- [Militarnyi: MIM-23 Hawk, un veterano al servicio de Ucrania](https://militarnyi.com/en/articles/mim-23-hawk-air-defense-veteran-in-the-service-of-the-armed-forces-of-ukraine/)
- [Defence Blog: el veterano Hawk resulta eficaz contra misiles rusos (una unidad: 14 crucero y 40 Shahed)](https://defence-blog.com/vintage-hawk-system-proves-effective-against-russian-missiles/)
- [Base de datos de Command: Modern Operations (DB3000 515): alcances, techos y velocidades de MIM-23, 5V28 y 5V27 (estimaciones de juego, en millas náuticas)](https://www.matrixgames.com/game/command-modern-operations)

### S-125 Pechora / Newa-SC (modernizado)

`s125` · Ucrania / OTAN · tipo `sam`

2,5–25 km, techo 18 km · 5V27: guiado por radiocomando desde el SNR-125 (un blanco a la vez)

- **Sensor:** SNR-125 "Low Blow" (+ P-18/P-19 de búsqueda), Banda X (I/J OTAN), 40 km contra 1 m², sector 360°, refresco 2 s, ECCM 3 dB
- **Altura de antena:** 4 m por defecto, regulable 4–6 m. Cabina de radar sobre remolque; la versión polaca Newa-SC va sobre chasis MAZ-543 (≈4–6 m, estimado).
- **Arma:** 5V27, guiado mando, 2.5–25 km (balísticos: — km), 25 m–18 km, 1 canales, 8 disparos, Pk base dron 0.45 · crucero 0.55 · supersonico 0.3 · balistico 0 · hiper 0

- Sistema de los años 60, modernizado en Ucrania y en Polonia (Newa-SC, digital y sobre chasis con orugas o ruedas).
- En su primer combate un S-125 ucraniano derribó un Kalibr; muy bueno a baja altura para su edad.
- Un solo canal: se satura enseguida con oleadas.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 30 | **40** | 60 | baja | [1] | CMO: SNR-125 32 nmi (59 km) instrumentado; est contra 1 m² |
| Alcance vs aeronaves/crucero (km) | 18 | **25** | 30 | media | [2] [1] | Newa-SC con 5V27: 25 km; CMO 10–16 nmi |
| Velocidad media del interceptor (m/s) | 500 | **600** | 900 | baja | — | est |
| Tiempo de reacción (s) | 15 | **25** | 40 | baja | — | est |
| Costo por disparo | US$100k | **US$150k** | US$300k | baja | — | est |
| Pk por disparo vs crucero | 0,35 | **0,55** | 0,7 | baja | [3] | calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Base de datos de Command: Modern Operations (DB3000 515): alcances, techos y velocidades de MIM-23, 5V28 y 5V27 (estimaciones de juego, en millas náuticas)](https://www.matrixgames.com/game/command-modern-operations)
2. [Militarnyi: los S-125 Newa-SC polacos ya operan en Ucrania](https://militarnyi.com/en/news/polish-s-125-newa-sc-sam-are-already-operating-in-ukraine/)
3. [Kyiv Post: Ucrania saca provecho de material soviético viejo (S-125 derriba un Kalibr)](https://www.kyivpost.com/post/35197)

#### Fuentes generales

- [Wikipedia: S-125 Neva/Pechora](https://en.wikipedia.org/wiki/S-125_Neva/Pechora)
- [Militarnyi: los S-125 Newa-SC polacos ya operan en Ucrania](https://militarnyi.com/en/news/polish-s-125-newa-sc-sam-are-already-operating-in-ukraine/)
- [Kyiv Post: Ucrania saca provecho de material soviético viejo (S-125 derriba un Kalibr)](https://www.kyivpost.com/post/35197)
- [Base de datos de Command: Modern Operations (DB3000 515): alcances, techos y velocidades de MIM-23, 5V28 y 5V27 (estimaciones de juego, en millas náuticas)](https://www.matrixgames.com/game/command-modern-operations)

### S-200V Vega (5V28)

`s200` · Ucrania / OTAN · tipo `sam`

17–250 km, techo ≈40 km; no baja de 300 m · 5V28: misil de 7 t con cohetes aceleradores, semiactivo (el 5N62 ilumina hasta el impacto)

- **Sensor:** 5N62 "Square Pair" (iluminación; búsqueda con P-14/radar de la red), Banda C (G/H OTAN), 250 km contra 1 m², sector 120°, refresco 4 s, ECCM 3 dB
- **Altura de antena:** 8 m, fija. Fija: antena del 5N62 sobre su base (altura estimada).
- **Arma:** 5V28, guiado SARH, 17–250 km (balísticos: — km), 300 m–40 km, 1 canales, 6 disparos, Pk base dron 0.2 · crucero 0.25 · supersonico 0.2 · balistico 0 · hiper 0

- Ucrania lo reactivó en 2022 (con aporte polaco) para cazar aviones: se le atribuyen un A-50 y un Tu-22M3 a ≈300 km. También se adaptó como misil de ataque a tierra.
- Contra drones y misiles de crucero es un desperdicio: lento para reaccionar, un solo canal y piso de 300 m.
- El juego todavía no tiene aviones como blanco: acá solo puede enfrentar drones altos, planeadoras y misiles.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 150 | **250** | 400 | baja | [1] | CMO: 5N62 220 nmi (≈400 km) contra blancos grandes; est contra 1 m² |
| Alcance vs aeronaves/crucero (km) | 150 | **250** | 300 | media | [1] [2] | 5V28 ≈250 km, 5V28M ≈300 km; derribo a ≈308 km reclamado |
| Altura mínima de enfrentamiento (m) | 200 | **300** | 300 | media | [1] | CMO 198 m; fuentes clásicas 300 m |
| Velocidad media del interceptor (m/s) | 900 | **1.100** | 1.300 | baja | — | est: ≈Mach 4 máx. |
| Tiempo de reacción (s) | 40 | **60** | 120 | baja | — | est: sistema de los 60, mucha preparación |
| Costo por disparo | US$300k | **US$600k** | US$1 M | baja | — | est |
| Pk por disparo vs crucero | 0,1 | **0,25** | 0,4 | baja | — | est: pensado contra aviones grandes. calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk") |

1. [Base de datos de Command: Modern Operations (DB3000 515): alcances, techos y velocidades de MIM-23, 5V28 y 5V27 (estimaciones de juego, en millas náuticas)](https://www.matrixgames.com/game/command-modern-operations)
2. [Defense Express: Polonia reconoce la entrega de S-200 a Ucrania (A-50 y Tu-22M3 derribados)](https://en.defence-ua.com/news/poland_officially_acknowledges_transfer_of_s_200_systems_to_ukraine_used_to_shoot_down_russian_a_50_tu_22m3_aircraft-19061.html)

#### Fuentes generales

- [Wikipedia: S-200 (missile)](https://en.wikipedia.org/wiki/S-200_(missile))
- [The War Zone: el S-200 reactivado por Ucrania en acción](https://www.twz.com/air/our-best-look-at-ukraines-reactivated-s-200-air-defense-system-in-action)
- [Defense Express: Polonia reconoce la entrega de S-200 a Ucrania (A-50 y Tu-22M3 derribados)](https://en.defence-ua.com/news/poland_officially_acknowledges_transfer_of_s_200_systems_to_ukraine_used_to_shoot_down_russian_a_50_tu_22m3_aircraft-19061.html)
- [Base de datos de Command: Modern Operations (DB3000 515): alcances, techos y velocidades de MIM-23, 5V28 y 5V27 (estimaciones de juego, en millas náuticas)](https://www.matrixgames.com/game/command-modern-operations)

### Pantsir-S1

`pantsir` · Rusia · tipo `sam`

18–20 km misil, 4 km cañones · 57E6: 1.300 m/s al apagar el motor, ≈900 m/s promedio a 12 km; guiado por mando radio, ojiva de varillas

- **Sensor:** 1RS1 búsqueda (S) + 1RS2 seguimiento (Ku), Banda S (E/F OTAN), 30 km contra 1 m², sector 360°, refresco 1 s, ECCM 5 dB
- **Altura de antena:** 6 m, fija. Fija: radares sobre el camión (altura estimada).
- **Arma:** 57E6, guiado mando, 1–18 km (balísticos: 5 km), 5 m–15 km, 3 canales, 12 disparos, Pk base dron 0.65 · crucero 0.6 · supersonico 0.3 · balistico 0.1 · hiper 0

- Radar de búsqueda: 36 km contra 2 m², 20 km contra un misil de crucero de 0,1 m².
- Defensa de punto de las baterías S-400.
- Recibió parches de software para HIMARS y Storm Shadow; aun así se registraron muchas pérdidas.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 25 | **30** | 36 | media | [1] | 36 km vs 2 m² |
| Alcance vs aeronaves/crucero (km) | 18 | **18** | 20 | media | [2] | — |
| Velocidad media del interceptor (m/s) | 780 | **900** | 1.000 | media | [2] [1] | — |
| Canales simultáneos | 2 | **3** | 4 | baja | [1] | — |
| Costo por disparo | US$100k | **US$150k** | US$200k | baja | — | est |
| Pk por disparo vs crucero | 0,4 | **0,6** | 0,75 | baja | — | est |

1. [Ausairpower: Pantsir](https://www.ausairpower.net/APA-96K6-Pantsir-2K22-Tunguska.html)
2. [GlobalSecurity: misil 57E6](https://www.globalsecurity.org/military/world/russia/57e6.htm)

#### Fuentes generales

- [Wikipedia: Pantsir missile system](https://en.wikipedia.org/wiki/Pantsir_missile_system)
- [Ausairpower: Pantsir](https://www.ausairpower.net/APA-96K6-Pantsir-2K22-Tunguska.html)
- [GlobalSecurity: misil 57E6](https://www.globalsecurity.org/military/world/russia/57e6.htm)

### Tor-M2

`tor` · Rusia · tipo `sam`

15–16 km, techo 10 km · 9M338: lanzamiento vertical, guiado por mando

- **Sensor:** Búsqueda (banda F ≈ S) + seguimiento (G/H y Ku), Banda S (E/F OTAN), 25 km contra 1 m², sector 360°, refresco 1 s, ECCM 5 dB
- **Altura de antena:** 4 m, fija. Fija: radar sobre el vehículo de orugas (altura estimada).
- **Arma:** 9M338, guiado mando, 1–15 km (balísticos: 5 km), 10 m–10 km, 4 canales, 16 disparos, Pk base dron 0.75 · crucero 0.7 · supersonico 0.35 · balistico 0.1 · hiper 0

- Defensa de punto contra drones, bombas planeadoras y misiles de crucero.
- 4 blancos y 8 misiles simultáneos; 16 misiles en el M2 (8 en el M2E).

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 20 | **25** | 32 | media | [1] [2] | >30 km contra cazas |
| Alcance vs aeronaves/crucero (km) | 15 | **15** | 16 | media | [3] [1] | — |
| Velocidad media del interceptor (m/s) | 600 | **700** | 850 | baja | — | est |
| Costo por disparo | US$200k | **US$300k** | US$500k | baja | — | est |
| Pk por disparo vs crucero | 0,5 | **0,7** | 0,8 | baja | — | est |

1. [Army Recognition: Tor-M2E](https://www.armyrecognition.com/military-products/army/air-defense-systems/air-defense-vehicles/tor-m2e)
2. [Wikipedia: Tor missile system](https://en.wikipedia.org/wiki/Tor_missile_system)
3. [GlobalSecurity: 9M338](https://www.globalsecurity.org/military/world/russia/sa-15-9m338.htm)

#### Fuentes generales

- [Wikipedia: Tor missile system](https://en.wikipedia.org/wiki/Tor_missile_system)
- [GlobalSecurity: 9M338](https://www.globalsecurity.org/military/world/russia/sa-15-9m338.htm)
- [Army Recognition: Tor-M2E](https://www.armyrecognition.com/military-products/army/air-defense-systems/air-defense-vehicles/tor-m2e)

### S-400 (48N6DM)

`s400` · Rusia · tipo `sam`

48N6DM: 240–250 km; 40N6: hasta 380–400 km · 48N6: ≈2.000 m/s, guiado TVM; 9M96E2 (activo) para corto/medio alcance

- **Sensor:** 92N6 Grave Stone (en torre 40V6M), Banda X (I/J OTAN), 200 km contra 1 m², sector 120°, refresco 2 s, ECCM 8 dB
- **Altura de antena:** 25 m por defecto, regulable 7–39 m. Sin torre, la antena queda a ≈7 m sobre su vehículo (estimado); en la torre 40V6M a ≈25 m y en la 40V6MD a ≈39 m (Air Power Australia). Armar la torre lleva 1–2 h, no se cambia durante el combate.
- **Arma:** 48N6, guiado TVM, 3–250 km (balísticos: 60 km), 10 m–27 km, 10 canales, 32 disparos, Pk base dron 0.75 · crucero 0.7 · supersonico 0.6 · balistico 0.5 · hiper 0.3

- Ucrania destruyó varios radares (92N6, 96L6, 91N6) y lanzadores con ATACMS, Neptune y drones.
- Contra blancos rasantes su alcance real lo pone el horizonte de radar, no el misil.
- Precio por misil no publicado: estimación US$1–2 M.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 150 | **200** | 250 | baja | [1] | 92N6: 250–340 km contra blancos grandes |
| Alcance vs aeronaves/crucero (km) | 240 | **250** | 250 | alta | [2] | — |
| Alcance vs balísticos (km) | 40 | **60** | 60 | media | [3] | — |
| Velocidad media del interceptor (m/s) | 1.300 | **1.500** | 1.700 | baja | — | est: 2.000 m/s máx. |
| Costo por disparo | US$1 M | **US$1.5 M** | US$2.5 M | baja | — | est: sin precio público |
| Pk por disparo vs crucero | 0,5 | **0,7** | 0,85 | baja | — | est |
| Pk por disparo vs balísticos | 0,3 | **0,5** | 0,7 | baja | [4] | las cifras rusas contra ATACMS (≈79%) no son verificables |

1. [Army Recognition: radar 92N6E](https://www.armyrecognition.com/military-products/army/radars/air-defense-radars/96n6-92n6e-grave-stone-radar)
2. [Wikipedia: S-400 missile system](https://en.wikipedia.org/wiki/S-400_missile_system)
3. [CSIS Missile Defense: S-400](https://missilethreat.csis.org/defsys/s-400-triumf/)
4. [TASS (MoD ruso, cifras sin verificar): ATACMS "interceptados"](https://tass.com/politics/1874721)

#### Fuentes generales

- [Wikipedia: S-400 missile system](https://en.wikipedia.org/wiki/S-400_missile_system)
- [CSIS Missile Defense: S-400](https://missilethreat.csis.org/defsys/s-400-triumf/)
- [Army Recognition: radar 92N6E](https://www.armyrecognition.com/military-products/army/radars/air-defense-radars/96n6-92n6e-grave-stone-radar)

### Radar de vigilancia 3D (36D6 / ST-68UM)

`ewr` · ambos bandos · tipo `sensor`

200 km instrumentados; contra 1 m² a 50 m de altura ≈110–115 km con mástil

- **Sensor:** 36D6 "Tin Shield", Banda S (E/F OTAN), 175 km contra 1 m², sector 360°, refresco 5 s, ECCM 3 dB
- **Altura de antena:** 10 m por defecto, regulable 10–39 m. Sobre su remolque ≈10 m (estimado); puede ir en la torre 40V6M/MD hasta ≈39 m (Air Power Australia). Armar la torre lleva 1–2 h.

- Radar de alerta y adquisición que alimenta a las baterías S-300. Rota a 6 o 12 rpm.
- Podés subirle el mástil (torre 40V6M) para ver más lejos a baja cota.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 110 | **175** | 200 | media | [1] [2] | 200 km instrumentados |
| Radar: refresco (s) | 5 | **5** | 10 | media | [1] | 6 o 12 rpm |

1. [Radartutorial: 36D6](https://www.radartutorial.eu/19.kartei/11.ancient/karte060.en.html)
2. [UOS (fabricante): 36D6-M](https://en.uos.ua/produktsiya/tehnika-pvo/rls/98-)

#### Fuentes generales

- [Radartutorial: 36D6](https://www.radartutorial.eu/19.kartei/11.ancient/karte060.en.html)
- [UOS (fabricante): 36D6-M](https://en.uos.ua/produktsiya/tehnika-pvo/rls/98-)

### P-18 / P-18MR (VHF)

`p18` · ambos bandos · tipo `sensor`

P-18MR contra 1 m²: 35 km a 100 m de altura, 120 km a 5 km

- **Sensor:** P-18MR, VHF (banda métrica), 160 km contra 1 m², sector 360°, refresco 6 s, ECCM 0 dB
- **Altura de antena:** 8 m, fija. Fija: antenas Yagi sobre su soporte (altura estimada).

- En VHF las formas furtivas pierden efecto: la RCS del Kh-101 o del Storm Shadow "crece" mucho.
- Precisión pobre: sirve para alerta y para pasar pistas a la red, no para guiar misiles.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 120 | **160** | 200 | baja | [1] | — |
| Radar: refresco (s) | 6 | **6** | 6 | alta | [2] | 10 rpm |

1. [Defense Express: P-18MR](https://en.defence-ua.com/weapon_and_tech/closing_air_coverage_gaps-1670.html)
2. [Wikipedia: P-18 radar](https://en.wikipedia.org/wiki/P-18_radar)

#### Fuentes generales

- [Wikipedia: P-18 radar](https://en.wikipedia.org/wiki/P-18_radar)
- [Defense Express: P-18MR](https://en.defence-ua.com/weapon_and_tech/closing_air_coverage_gaps-1670.html)

### Nodo acústico (red Sky Fortress)

`acoustic` · Ucrania / OTAN · tipo `acoustic`

≈5 km por grupo de sensores (cada micrófono oye 1–3 km)

- **Sensor:** Micrófonos en red, Acústico, 5 km contra 1 m², sector 360°, refresco 2 s, ECCM inmune
- **Altura de antena:** 0 m, fija. Micrófonos a nivel del suelo.

- ~10.000 sensores de US$400–500 c/u conectados por celular.
- Solo detecta drones con motor; no ve misiles ni blancos muy altos.
- Inmune a la interferencia de radar y al RCS.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 2 | **5** | 8 | baja | [1] | est: cada sensor 1–3 km; el ícono es un grupo |
| Altura máxima detectable (m) | 2.000 | **3.000** | 4.000 | baja | — | est |

1. [Odessa Journal: red de ~10.000 sensores acústicos](https://odessa-journal.com/ukrainian-engineers-have-created-a-network-of-nearly-10000-acoustic-sensors-to-track-russian-drones)

#### Fuentes generales

- [Wikipedia: Sky Fortress (drone defense system)](https://en.wikipedia.org/wiki/Sky_Fortress_(drone_defense_system))
- [Odessa Journal: red de ~10.000 sensores acústicos](https://odessa-journal.com/ukrainian-engineers-have-created-a-network-of-nearly-10000-acoustic-sensors-to-track-russian-drones)

### Saab 340 AEW (ASC 890, Erieye)

`aew_s340` · Ucrania / OTAN · tipo `aew`

≈330–350 km contra cazas; 450 km instrumentados

- **Sensor:** Erieye (AESA, lateral), Banda S (E/F OTAN), 240 km contra 1 m², sector 150°, refresco 4 s, ECCM 10 dB

- Suecia lo anunció en mayo de 2024; la transferencia se confirmó en agosto de 2025 y opera en combate desde marzo de 2026.
- Antena lateral "tabla": ve a ambos costados (~150° c/u) y tiene zonas ciegas adelante y atrás. Orientá el rumbo de vuelo.
- Desde 6 km de altura ve misiles rasantes a más de 100 km, donde un radar terrestre no llega.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 200 | **240** | 280 | media | [1] [2] | cazas a 330–350 km |
| Radar: sector de búsqueda (°) | 150 | **150** | 160 | media | [1] | — |
| Altitud de patrulla (m) | 5.000 | **6.000** | 7.600 | media | [3] | — |

1. [GlobalSecurity: Erieye](https://www.globalsecurity.org/military/world/europe/erieye.htm)
2. [Wikipedia: Erieye](https://en.wikipedia.org/wiki/Erieye)
3. [Wikipedia: Saab 340 AEW&C](https://en.wikipedia.org/wiki/Saab_340_AEW&C)

#### Fuentes generales

- [Wikipedia: Saab 340 AEW&C](https://en.wikipedia.org/wiki/Saab_340_AEW&C)
- [Wikipedia: Erieye](https://en.wikipedia.org/wiki/Erieye)
- [Defense Express: el Saab 340 AEW opera en Ucrania desde mar-2026](https://en.defence-ua.com/weapon_and_tech/saab_340_aew_has_been_operating_in_ukraine_since_march_2026_but_ukrainian_mod_has_revealed_more_details-19689.html)
- [GlobalSecurity: Erieye](https://www.globalsecurity.org/military/world/europe/erieye.htm)

### Beriev A-50U

`aew_a50` · Rusia · tipo `aew`

≈650 km contra blancos grandes; 150 pistas dentro de 230 km

- **Sensor:** Shmel-M (rotodomo), Banda S (E/F OTAN), 230 km contra 1 m², sector 360°, refresco 10 s, ECCM 5 dB

- Rusia perdió dos A-50 en 2024 (14/1 y 23/2).
- Rotodomo de 360°. La banda del Shmel-M no es pública (se asume S).

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radar: detección contra 1 m² (km) | 180 | **230** | 300 | baja | [1] | est |
| Altitud de patrulla (m) | 8.000 | **9.000** | 10.000 | baja | — | est |

1. [Wikipedia: Beriev A-50](https://en.wikipedia.org/wiki/Beriev_A-50)

#### Fuentes generales

- [Wikipedia: Beriev A-50](https://en.wikipedia.org/wiki/Beriev_A-50)

## Guerra electrónica

El efecto depende del **rol**: los interferidores de radar degradan los radares de la defensa; los anti-GNSS desvían las armas del atacante.

### Avión de interferencia stand-off (tipo Il-22PP)

`soj` · Rusia · ruido contra radares en S/C/X, potencia relativa 3e+5

- Interferencia de ruido desde lejos. Pega fuerte solo cuando está en el lóbulo principal del radar (alineado con los blancos), y mucho menos por lóbulos laterales.
- Bandas y potencia del Il-22PP no son públicas: los valores son genéricos de juego.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Potencia relativa (juego) | 1e+5 | **3e+5** | 1e+6 | baja | — | parámetro de juego: bandas y potencia del Il-22PP no son públicas |

#### Fuentes generales

- [Wikipedia: Ilyushin Il-22](https://en.wikipedia.org/wiki/Ilyushin_Il-22)
- [Key.aero: Il-22PP](https://www.key.aero/article/ilyushin-il-22pp)

### Krasukha-4 (terrestre)

`krasukha4` · Rusia · ruido contra radares en X/Ku, potencia relativa 1e+6

- Bandas X y Ku, alcance declarado ~300 km. Ucrania capturó uno en 2022.
- Pensado contra radares aerotransportados y de control de tiro.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Potencia relativa (juego) | 3e+5 | **1e+6** | 3e+6 | baja | — | parámetro de juego |

#### Fuentes generales

- [Wikipedia: Krasukha (electronic warfare system)](https://en.wikipedia.org/wiki/Krasukha_(electronic_warfare_system))

### Krasukha-2 (terrestre)

`krasukha2` · Rusia · ruido contra radares en S, potencia relativa 1e+6

- Banda S, ~250 km: diseñado contra aviones AEW tipo E-3.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Potencia relativa (juego) | 3e+5 | **1e+6** | 3e+6 | baja | — | parámetro de juego |

#### Fuentes generales

- [Wikipedia: Krasukha (electronic warfare system)](https://en.wikipedia.org/wiki/Krasukha_(electronic_warfare_system))

### Supresor GNSS ruso (tipo Pole-21)

`gnss` · Rusia · supresión GNSS, radio 25 km

- No afecta radares: interfiere GPS/GLONASS. Las armas que dependen del satélite pasan a navegación inercial y se desvían.
- Pole-21: ≥25 km por módulo, montado en torres de celular (fuente rusa). Protege bases e infraestructura rusas.
- Las antenas CRPA y la navegación por terreno u óptica reducen el efecto (en el juego, el campo gnss de cada arma).

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radio de efecto (km) | 15 | **25** | 50 | media | [1] | ≥25 km por módulo (fuente rusa) |

1. [Topwar: Pole-21 (fuente rusa)](https://en.topwar.ru/182196-kompleksy-rjeb-pole-21-v-rossijskoj-armii.html)

#### Fuentes generales

- [Topwar: Pole-21 (fuente rusa)](https://en.topwar.ru/182196-kompleksy-rjeb-pole-21-v-rossijskoj-armii.html)

### Pokrova (red ucraniana de supresión y engaño GNSS)

`pokrova` · Ucrania / aliados · engaño GNSS, radio 25 km

- Red nacional de estaciones anunciada en nov-2023 y operativa desde ene/feb-2024: suprime GPS/GLONASS o los engaña (spoofing) con coordenadas falsas.
- Engañar no es lo mismo que meter ruido: el arma cree estar en otro lugar y se desvía kilómetros sin darse cuenta. Los primeros reportes hablaban de 5–10 km; en algunas noches de nov/dic-2024, la mitad de los Shahed terminó "perdida localmente" o en Bielorrusia (esa categoría mezcla GE, señuelos y fallas).
- No hay datos públicos de potencia, frecuencias ni radio por nodo: el radio y el desvío son valores de juego.
- Las antenas CRPA rusas (Kometa de 8/12/16 elementos; Kometa-M desde dic-2025) le restan mucho efecto.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radio de efecto (km) | 10 | **25** | 50 | baja | [1] [2] | est: no hay radio por nodo publicado; mismo orden de magnitud que Pole-21. La red nacional son muchos nodos superpuestos |
| Desvío típico por engaño GNSS (km) | 2 | **5** | 10 | baja | [1] [3] | primeros reportes ucranianos de 2024: desvíos de 5–10 km |

1. [Defense Express: Pokrova, la GE que inutiliza los receptores GPS (ene-2024)](https://en.defence-ua.com/events/pokrova_ew_system_is_a_real_game_changer_in_ukrainian_fight_against_shahed_136_drones_and_cruise_missiles_that_renders_gps_receivers_useless-8462.html)
2. [Kyiv Post: sistema ucraniano Pokrova](https://www.kyivpost.com/post/28059)
3. [Forbes (Hambling): Pokrova engaña a los Shahed (feb-2024)](https://www.forbes.com/sites/davidhambling/2024/02/12/ukraines-pokrova-spoofing-system-tells-shaheds-to-get-lost/)

#### Fuentes generales

- [Kyiv Post: sistema ucraniano Pokrova](https://www.kyivpost.com/post/28059)
- [Defense Express: Pokrova, la GE que inutiliza los receptores GPS (ene-2024)](https://en.defence-ua.com/events/pokrova_ew_system_is_a_real_game_changer_in_ukrainian_fight_against_shahed_136_drones_and_cruise_missiles_that_renders_gps_receivers_useless-8462.html)
- [Forbes (Hambling): Pokrova engaña a los Shahed (feb-2024)](https://www.forbes.com/sites/davidhambling/2024/02/12/ukraines-pokrova-spoofing-system-tells-shaheds-to-get-lost/)
- [The Defense Post: Ucrania desvía casi 100 Shahed por spoofing (dic-2024)](https://thedefensepost.com/2024/12/05/ukraine-spoofs-shahed-drones/)
- [Euronews: cómo Ucrania desvía drones rusos hacia Bielorrusia (dic-2024)](https://www.euronews.com/my-europe/2024/12/04/lost-and-spoofed-how-ukraine-redirects-russian-drones-to-belarus)
- [Defense Express: "perdidos localmente" o derribados, el Estado Mayor explica la estadística](https://en.defence-ua.com/analysis/lost_or_destroyed_ukraines_general_staff_explains_the_confusing_shahed_downing_statistics-12432.html)

### Lima / Lima-Quant (estaciones anti-GNSS ucranianas)

`lima` · Ucrania / aliados · engaño GNSS, radio 40 km

- Interferencia, engaño y "ataque digital" al receptor GNSS. En uso desde 2024 contra bombas planeadoras UMPK/KAB y Shahed; según sus operadores, también contra crucero y Kinzhal.
- ~€58.000 por estación; una ciudad grande necesita 30–100, porque contra una antena CRPA hacen falta muchas fuentes desde distintos puntos.
- Cifras del fabricante y de la unidad, sin verificación independiente: más de 20.000 Shahed afectados, 58–61 Kinzhal "neutralizados", alcance de 300 km contra Kinzhal. Forbes y JAPCC confirman de forma independiente que la precisión de los KAB cayó en 2025.
- Rusia respondió con Kometa-M24 y con planeadoras de mayor alcance (UMPK-PD, lanzadas desde más de 95 km).

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radio de efecto (km) | 20 | **40** | 100 | baja | [1] [2] [3] | fabricante: CRPA a 50 km, KAB a más de 100 km, Kinzhal a 300 km. Que una ciudad necesite 30–100 estaciones sugiere un radio efectivo menor contra CRPA; est |
| Desvío típico por engaño GNSS (km) | 1 | **3** | 10 | baja | [4] [5] | est: desvíos de km contra planeadoras (Forbes); sin cifra pública por arma |

1. [Kyiv Post: Lima cuesta €58.000 por estación (2026)](https://www.kyivpost.com/post/76818)
2. [Forbes (Hambling): Lima-Quant contra las nuevas planeadoras (abr-2026; cifras del fabricante)](https://www.forbes.com/sites/davidhambling/2026/04/03/new-ukrainian-jammer-makes-russias-latest-glide-bombs-useless-again/)
3. [Kyiv Independent: Night Watch y Lima contra el Kinzhal (2026)](https://kyivindependent.com/patriots-or-no-patriots-ukraine-may-have-solved-the-problem-of-russias-kinzhal-missiles/)
4. [Forbes (Axe): los interferidores ucranianos confunden a las bombas planeadoras (mar-2025)](https://www.forbes.com/sites/davidaxe/2025/03/23/ukraines-jammers-are-confusing-russias-glide-bombs-watch-one-stray-off-course/)
5. [NV (resume Politico): Ucrania usa Lima para desviar misiles y drones (2026)](https://english.nv.ua/russian-war/ukraine-uses-lima-system-to-divert-russian-missiles-and-drones-politico-says-50610791.html)

#### Fuentes generales

- [Kyiv Post: el interferidor Lima contra bombas planeadoras](https://www.kyivpost.com/post/50474)
- [Kyiv Post: Lima cuesta €58.000 por estación (2026)](https://www.kyivpost.com/post/76818)
- [NV (resume Politico): Ucrania usa Lima para desviar misiles y drones (2026)](https://english.nv.ua/russian-war/ukraine-uses-lima-system-to-divert-russian-missiles-and-drones-politico-says-50610791.html)
- [Forbes (Axe): los interferidores ucranianos confunden a las bombas planeadoras (mar-2025)](https://www.forbes.com/sites/davidaxe/2025/03/23/ukraines-jammers-are-confusing-russias-glide-bombs-watch-one-stray-off-course/)
- [JAPCC (OTAN): Countering Russia’s glide bomb warfare in Ukraine](https://www.japcc.org/articles/countering-russias-glide-bomb-warfare-in-ukraine/)
- [Kyiv Independent: Night Watch y Lima contra el Kinzhal (2026)](https://kyivindependent.com/patriots-or-no-patriots-ukraine-may-have-solved-the-problem-of-russias-kinzhal-missiles/)
- [Forbes (Hambling): Lima-Quant contra las nuevas planeadoras (abr-2026; cifras del fabricante)](https://www.forbes.com/sites/davidhambling/2026/04/03/new-ukrainian-jammer-makes-russias-latest-glide-bombs-useless-again/)
- [Militarnyi: según el comandante de Night Watch, Lima hace la mitad de la supresión de blancos aéreos](https://militarnyi.com/en/news/ew-system-lima-accounts-for-half-of-air-target-suppression-night-watch-commander-says/)

### Bukovel-AD (antidrón ucraniano: enlaces y GNSS)

`bukovel` · Ucrania / aliados · supresión GNSS, radio 15 km

- De Proximus, en servicio desde 2016. Detecta en 320–6.000 MHz hasta 70–100 km e interfiere enlaces de datos hasta 16–20 km. El fabricante declara supresión GNSS hasta 35 km, con 10 W por antena.
- El motor solo representa la parte GNSS: cortar el enlace de control no detiene a un Shahed autónomo (sí "aterrizó" un ZALA 421-16E2 ruso).
- Con 10 W y frente a receptores con CRPA, el radio real es mucho menor que el declarado: valor de juego conservador.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Radio de efecto (km) | 5 | **15** | 35 | baja | [1] [2] | fabricante: GNSS hasta 35 km con 10 W por antena; contra CRPA mucho menos; est |

1. [Wikipedia: Bukovel (counter unmanned aircraft system)](https://en.wikipedia.org/wiki/Bukovel_(counter_unmanned_aircraft_system))
2. [azov.one: ficha técnica de Bukovel (datos del fabricante)](https://azov.one/en/blog/electronics-warfare-systems/electronic-warfare-system-bukovel)

#### Fuentes generales

- [Wikipedia: Bukovel (counter unmanned aircraft system)](https://en.wikipedia.org/wiki/Bukovel_(counter_unmanned_aircraft_system))
- [azov.one: ficha técnica de Bukovel (datos del fabricante)](https://azov.one/en/blog/electronics-warfare-systems/electronic-warfare-system-bukovel)
- [Militarnyi: Bukovel-AD "aterriza" un ZALA 421-16E2 ruso](https://militarnyi.com/en/news/ukrainian-bukovel-ad-ew-system-landed-russian-zala-421-16e2-uav/)

### F-16 ucraniano con pod de autoprotección (AN/ALQ-131)

`f16ecm` · Ucrania / aliados · ruido contra radares en C/X/Ku, potencia relativa 3e+4

- Los F-16 holandeses llegaron con AN/ALQ-131 y los daneses con ALQ-162 en pilones ECIPS; un escuadrón de guerra electrónica de la USAF los reprogramó contra amenazas rusas (ago-2024).
- El ALQ-131 cubre 2–20 GHz en configuraciones de 1 a 3 bandas: no se sabe cuáles tiene Ucrania. Acá se asumen las bandas de control de tiro (C/X/Ku).
- Es un pod de autoprotección, no un interferidor stand-off: en el juego representa una patrulla escoltando un ataque, con mucha menos potencia que un Il-22PP o un Krasukha. Confianza baja.

#### Parámetros

| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |
|---|---:|---:|---:|---|---|---|
| Potencia relativa (juego) | 10.000 | **30.000** | 1e+5 | baja | [1] [2] | parámetro de juego: potencia y bandas del pod no son públicas. Un orden de magnitud menos que el Il-22PP (3e5): un pod de caza tiene menos potencia y antenas mucho más chicas; est |
| Altitud de patrulla (m) | 300 | **4.000** | 8.000 | baja | — | est: los F-16 ucranianos vuelan bajo para sobrevivir y suben para lanzar; altura de patrulla de juego |

1. [Northrop Grumman (fabricante): pod AN/ALQ-131(V)](https://www.northropgrumman.com/what-we-do/mission-solutions/electronic-warfare/an-alq-131v-electronic-countermeasures-ecm-pod)
2. [FAS: AN/ALQ-131, pod de autoprotección](https://man.fas.org/dod-101/sys/ac/equip/an-alq-131.htm)

#### Fuentes generales

- [Northrop Grumman (fabricante): pod AN/ALQ-131(V)](https://www.northropgrumman.com/what-we-do/mission-solutions/electronic-warfare/an-alq-131v-electronic-countermeasures-ecm-pod)
- [FAS: AN/ALQ-131, pod de autoprotección](https://man.fas.org/dod-101/sys/ac/equip/an-alq-131.htm)
- [Defense Express: qué traen distinto los F-16 holandeses (ALQ-131, ECIPS)](https://en.defence-ua.com/news/ukraines_new_f_16s_from_the_netherlands_whats_different_from_danish_version-12107.html)
- [Air & Space Forces Magazine: la USAF reprogramó la GE de los F-16 ucranianos (ago-2024)](https://www.airandspaceforces.com/ukraine-f-16-electronic-warfare-us-air-force/)

## Bandas

| Banda | Frecuencia | Ancho de haz | Cómo cambia la RCS en el motor |
|---|---|---|---|
| VHF (banda métrica) | 30–300 MHz (radares de alerta: ~150–200 MHz) | 6° | Con λ de 1–2 m, partes del blanco (alas, aletas, el fuselaje entero) miden lo mismo que la onda y entran en resonancia: devuelven mucha más energía. El conformado furtivo está pensado para bandas centimétricas y acá pierde efecto. El motor usa la RCS VHF estimada de cada arma (rcsVHF) y, si falta, multiplica la frontal: ×12 si es de baja firma, ×4 si es muy chica (< 0,05 m²), ×2 en el resto. |
| Banda L | 1–2 GHz | 3° | Todavía cerca de la zona de resonancia para misiles chicos: el motor multiplica la RCS frontal ×3 si el blanco es de baja firma y ×1,4 en el resto. |
| Banda S (E/F OTAN) | 2–4 GHz | 2° | Es una de las bandas de referencia del catálogo: el motor usa la RCS frontal (th.rcs) sin cambios. |
| Banda C (G/H OTAN) | 4–8 GHz | 1.5° | Régimen óptico para casi todos los blancos: el motor usa la RCS frontal sin cambios. |
| Banda X (I/J OTAN) | 8–12 GHz | 1° | Banda de referencia del catálogo (RCS frontal "X/S"). Con λ de ~3 cm todos los blancos son grandes respecto de la onda (régimen óptico): manda la forma, y por eso funcionan el conformado furtivo y los materiales absorbentes. |
| Banda Ku/Ka | 12–18 GHz (Ku) y 27–40 GHz (Ka) | 0.8° | Las longitudes de onda milimétricas "ven" detalles chicos (hélices, motores, cables): el motor sube ×1,6 la RCS de los drones y deja igual el resto. |
| Acústico | Sonido de motores: ~50–500 Hz | — | No usa RCS: el motor detecta drones dentro del alcance (R1) y por debajo de su altura máxima. |
| Óptico / IR | Visible 0,4–0,7 µm · infrarrojo 3–14 µm | — | No usa RCS: el motor usa un alcance fijo (R1) con línea de vista. |

## Objetivos

Parámetros de juego (sin fuente): vida, huella y vulnerabilidad relativa.

| Tipo | Vida | Huella | Vulnerabilidad | Descripción |
|---|---:|---:|---:|---|
| Depósito logístico | 1000 | 40 m | ×1 | Galpones y playones de almacenamiento. Estructura liviana pero extensa. |
| Depósito de combustible | 800 | 50 m | ×1.3 | Tanques de combustible: inflamables, el fuego propaga el daño. |
| Base aérea | 2500 | 300 m | ×0.6 | Pista, calles de rodaje y refugios dispersos en un área grande: hacen falta muchos impactos para inutilizarla. |
| Sitio de radar | 600 | 25 m | ×1.2 | Antenas y shelters livianos, muy sensibles a esquirlas. |
| Puesto de mando | 900 | 20 m | ×0.8 | Estructura reforzada o semienterrada. |
| Depósito de munición | 900 | 40 m | ×1.4 | Las explosiones secundarias amplifican el daño de cada impacto. |
| Sitio de comunicaciones | 500 | 15 m | ×1.1 | Torres y equipos de enlace: blancos chicos y frágiles. |
| Infraestructura | 1500 | 60 m | ×0.9 | Puerto, puente, subestación eléctrica o similar. |

## Calibración de Pk

Casos corridos con el motor (Monte Carlo) para ajustar las Pk contra episodios reales. Ver la ventana "Calibración de Pk" del juego para el método.

| Caso | Dato real | Objetivo | Simulado | Con Pk mín–máx |
|---|---|---|---:|---|
| 16 Kh-101 (cada 5 s) contra IRIS-T + NASAMS + radar 3D | NASAMS: 94% reclamado; IRIS-T: "casi 100%" (≈240 derribos). Datos de operador/fabricante, sesgados hacia arriba. | 85–100% | 100% | 100–100% |
| 20 Kalibr (cada 3 s) contra S-300PS + Buk-M1 + radar 3D | 67% para crucero a nivel nacional (feb-22 → ago-24), con defensa mayormente soviética. | 60–85% | 88% | 62–97% |
| 60 Shahed + 30 Gerbera contra 2 Gepard, 3 grupos móviles, 2 equipos de interceptores, red acústica | Derribo cinético 52% (mar–may 25) a 63% (2022–24); el resto de la neutralización es guerra electrónica, que el juego no modela como pérdida. | 50–70% | 64% | 45–78% |
| 8 Iskander-M con maniobra 2025 y señuelos contra 1 Patriot MSE (16 misiles) | 37% nacional en jun–sep 25 (IC95% 31–45%), cota inferior de lo que pasa dentro de cobertura; 6–17% en otoño 2025. | 35–65% | 21% | 16–25% |
| 6 Kinzhal contra 1 Patriot MSE | 6 de 6 sobre Kyiv el 16/5/2023 (IC95% 61–100%); 25% a nivel nacional. | 61–100% | 99% | 84–100% |
| 12 Kh-22 (cada 5 s) contra 1 Patriot MSE (16 misiles) | 9 de 12 sobre Kyiv el 2/2/2026 (IC95% 47–91%). | 47–91% | 62% | 48–67% |
| 6 Kh-22 contra IRIS-T + NASAMS, sin Patriot | 3 de más de 400 derribados antes de feb-2026 (IC95% 0–2%). | 0–10% | 0% | 0–0% |
| 6 Oniks (perfil hi-lo) contra IRIS-T + NASAMS ubicados en el blanco | 5,7% a nivel nacional (12 de 211). No hay datos dentro de cobertura: caso de control, sin objetivo. | — | 67% | 35–88% |
| 4 Zircon contra Patriot + SAMP/T | 2 de 2 sobre Kyiv el 25/3/2024 (IC95% 34–100%); 33% nacional hasta ago-24. | 34–100% | 99% | 90–100% |
