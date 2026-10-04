# Guerra electrónica ucraniana y aliada (2022–2026): OSINT para *Cielo Cerrado*

Fecha de la investigación: 2 de octubre de 2026. Escrito para el catálogo `src/data/jammers.js`, `UNC.jam` y `SRC`.

> **Nota de método (leer primero).** En esta sesión, el proxy de red bloqueó la descarga directa de páginas (WebFetch dio `EGRESS_BLOCKED` en forbes.com, kyivpost.com, militarnyi.com, isis-online.org, united24media.com, wikipedia.org y spectrum.ieee.org). Todo lo que sigue sale de **búsquedas web**: el buscador devolvió el título, la URL y extractos o resúmenes de cada página. Las URL listadas existen y aparecieron en esos resultados, pero **no leí el texto completo de ninguna**. Antes de pasar a `alta` la confianza de una cifra, conviene abrir la fuente y confirmarla.


> **Verificación cruzada (4 de octubre de 2026).** El proxy de red sigue bloqueando la lectura directa de las páginas, así que tampoco se leyeron los textos completos. Lo que sí se hizo es contrastar las cifras que usa el motor en **varias fuentes independientes** con búsquedas nuevas, que es lo que este documento llama confianza **alta**. Resultado en la sección G. Cuando la red lo permita, falta abrir las fuentes y confirmar las citas textuales.

---

## A) Resumen ejecutivo

1. Del lado ucraniano, la guerra electrónica pública y relevante para la **defensa aérea estratégica** es casi toda **anti-GNSS**: **Pokrova** (red nacional de supresión y engaño; anunciada en nov-2023, operativa en ene/feb-2024) y **Lima / Lima-Quant** (Cascade Systems y la unidad "Night Watch"; en uso desde el verano de 2024; contra Shahed, KAB/UMPK, crucero y Kinzhal). No encontré ningún **interferidor de radar** terrestre ucraniano documentado públicamente.
2. Hay muchísima GE **antidrón táctica** (Bukovel-AD, Nota, Piranha AVD 360, Kvertus, Shatro, Synytsia, EDM4S lituano). Casi toda actúa sobre enlaces de control y video (FPV, Mavic, Orlan, ZALA) a cientos de metros o pocos km. Le sirve poco a un simulador de defensa contra Shahed y misiles, salvo por su componente GNSS.
3. La GE aliada confirmada es poca: **pods de autoprotección de los F-16** donados (AN/ALQ-131 en los holandeses; ALQ-162 en pilones ECIPS en los daneses), reprogramados por el 68.º EWS de la USAF (ago-2024). También los **señuelos ADM-160 MALD** lanzados desde Su-27/MiG-29 (desde may-2023). Que Ucrania tenga MALD-**J** (la versión con interferidor) **no está confirmado**.
4. Efectividad contra Shahed: según la Fuerza Aérea ucraniana (vía ISIS), entre ago-2024 y may-2025 cerca del **35 %** de los drones lanzados quedaron "**perdidos localmente**", con noches de 45–50 % en nov/dic-2024. Ojo: esa categoría **mezcla GE con señuelos sin combustible y fallas**, y el número cayó cuando Rusia introdujo antenas CRPA **Kometa** de 12/16 elementos y **Kometa-M** (dic-2025), módems mesh, LTE y Starlink.
5. Contra KAB/UMPK, las fuentes ucranianas e independientes (Forbes, JAPCC) coinciden en que la precisión cayó mucho en 2025. Rusia respondió con Kometa-M24 y UMPK-PD de más alcance (>95 km). Las cifras extremas (eficacia "cero", 58–61 Kinzhal neutralizados, más de 20.000 Shahed) **vienen del fabricante o de la unidad que lo opera**.
6. Para el motor: hoy el anti-GNSS solo agrega un error aleatorio de 0,15–1,5 km y **no distingue bandos**. Para representar esto bien hacen falta cuatro cosas, en orden de prioridad: (1) filtro por bando, (2) modo **engaño** con desvío dirigido distinto de la **interferencia** con deriva inercial, (3) **CRPA** según el número de elementos frente al número de fuentes, y (4) la categoría "perdido localmente".

---

## B) Tabla de sistemas

Confianza: **alta** = varias fuentes independientes concuerdan; **media** = una fuente seria o varias de un solo bando; **baja** = fabricante o propaganda sin contraste, o casi sin datos.

| Sistema | Función | Bandas / frecuencias | Alcance declarado | Plataforma / año | Confianza | Fuentes (claves de la sección E) |
|---|---|---|---|---|---|---|
| **Pokrova** (UA) | Supresión y **engaño** GNSS a escala nacional, contra Shahed, Kalibr y otras armas guiadas por satélite | GPS/GLONASS (y otros GNSS). Frecuencias y potencias no publicadas | "Toda la línea de contacto y la mayor parte del territorio" (Defense Express). Sin radio por nodo | Red fija de estaciones. Anunciada nov-2023, operativa ene/feb-2024 | Existencia y función: **alta**. Parámetros: **baja** | kp_pokrova, dx_pokrova, forbes_pokrova, dpost_spoof, euronews_lost |
| **Lima** (UA, Cascade Systems / unidad "Night Watch") | Interferencia, **engaño** y "ataque digital" al receptor GNSS. Contra UMPK/KAB, Shahed, crucero y Kinzhal | GNSS (GLONASS/GPS). Sin datos públicos de potencia | Fabricante/unidad: hasta 300 km contra Kinzhal. Según la prensa, una ciudad grande necesita 30–100 estaciones | Estaciones fijas o transportables, ~€58.000 cada una, más de 400 entregadas. En uso desde el verano de 2024; ampliado a infraestructura civil en el otoño de 2025 | Uso contra KAB: **media** (Forbes, JAPCC, monitoreo). Cifras de derribos: **baja** (fabricante) | kp_lima, kp_lima2, nv_lima, forbes_kab25, emp_kab25, japcc_kab, ki_kinzhal, forbes_kinzhal, up_cascade, interfax_lima, mil_lima_half |
| **Lima-Quant** (UA) | Versión mejorada pensada contra CRPA de 16 o más elementos | GNSS | Fabricante: CRPA a 50 km, KAB a más de 100 km, crucero y balísticos "a más distancia" | 2025–2026 | **baja** (fabricante, vía Forbes/United24) | forbes_limaq, u24_limaq |
| **Bukovel-AD** (UA, Proximus) | Detección e interferencia de enlaces de drones más supresión GNSS | Detecta y suprime 320–6.000 MHz. Antenas típicas: 2,4 GHz, 5,8 GHz, GPS L1, GLONASS L1, **10 W por antena** | Detección 70–100 km; enlace de datos 16–20 km; GNSS hasta 35 km | Vehículo o trípode, 2 min de despliegue. En servicio desde 2016 (Donbás); también lo usa Marruecos | **media** (datos del fabricante repetidos por Wikipedia y por una fuente rusa) | wp:Bukovel_(counter_unmanned_aircraft_system), azov_bukovel, topwar_bukovel, mil_bukovel |
| **Nota** (UA, Tritel) | Antidrones, telefonía móvil (GSM/UMTS/LTE/CDMA), Wi-Fi, VHF y GNSS; radiogoniometría | "Configurable a pedido" (bandas, diagrama, potencia) | Sin datos públicos | Terrestre | **baja** | naudi_nota |
| **Piranha AVD 360** (UA, Piranha-Tech) | Cúpula antidrón para vehículos: control, video y GLONASS | Sin frecuencias publicadas; potencia de al menos 200 W | Cúpula de ~600 m | Montada en vehículo blindado, 2023 | **media** (fabricante y prensa) | ar_piranha, ukr_piranha |
| **Kvertus** (mochila, cúpulas, **Atlas** = Azimuth + Mirage) | Antidrón: control y video FPV; Atlas suma detección e interferencia en red | Mochila: 720–1.050 MHz. Cúpulas: 220–1.050 MHz más 2,4 y 5,8 GHz | Cúpula: 0,8 km omnidireccional, 1,5 km direccional. Atlas: neutraliza hasta 8 km, detecta hasta 30 km | Portátil, vehicular y en red de frente ("muro antidrón", feb-2025) | **media** | wp:Kvertus, dx_atlas, emp_backpack |
| **Shatro** (UA) | Cúpula de 360° contra FPV y lanzamientos desde drones | Módulos de al menos 50 W por canal | Corto (trinchera) | Fijo, de posición; 48 unidades para Járkov y Donetsk (2024) | **media** | dpost_shatro |
| **Synytsia / "Синиця"** (UA, comercial) | Cúpulas anti-FPV de 1 a 8 canales | 50–220 W según el modelo | 50–200 m (las versiones 1–3); hasta 2 km (versión 6) | Portátil o vehicular | **baja** (tiendas). Ojo: Ukrinform también llama "Synytsia" a una **estación rusa** destruida | revolt_synytsia, ukrinform_synytsia |
| **Mandat R-330UM** (heredado soviético; fabrica Iskra en UA) | Interferencia de comunicaciones HF/VHF | HF y VHF de comunicaciones (no radar ni GNSS) | Sin dato | Vehículo; modernización R-330UV1 | **media** | unian_mandat |
| **Stryi** (UA, InLab) | Antidrón | 300–2.500 MHz y 2.000–6.000 MHz, 2 × 100 W | Sin dato | 2026 | **baja** | dpost_multiband |
| **Enclave** | No encontré ninguna fuente pública verificable (ni en inglés ni con "Енклав") | — | — | — | **sin datos** | — |
| **SHARK con GE** (avión liviano checo-eslovaco) | Detecta perfiles de emisión (Shahed, Orlan); interfiere GNSS y enlaces de video y control | GNSS más enlaces | Radio de 4,5 km volando a 1.800 m | Aéreo, 2025 | **baja-media** | u24_shark |
| **EDM4S Sky Wiper** (Lituania, NT Service) — aliado | "Fusil" antidrón: control, video y GNSS | 433 MHz, 900 MHz, 2,4 GHz, 5,8 GHz y GNSS (módulos de 4 o 6 bandas) | 3–5 km con línea de vista | Portátil, 5,5 kg. Donado desde 2022: 110 en el primer lote, luego miles (Janes) | **alta** | wp:EDM4S, janes_edm4s |
| **HP 47** (Alemania) — aliado | Fusil antidrón | Control y GNSS | ~1 km | Portátil | Entrega a Ucrania **no confirmada** (hubo un bloqueo alemán en la NSPA) | uawire_hp47 |
| **AN/ALQ-131** en F-16 holandeses; **ALQ-162** en ECIPS de F-16 daneses — aliado | Autoprotección: interfiere radares de control de tiro y de búsqueda | ALQ-131: **2–20 GHz** en configuraciones de 1 a 3 bandas (las de Ucrania no son públicas) | — (autoprotección) | Pod o pilón en F-16, desde 2024; reprogramación de la USAF (68.º EWS) | Existencia: **alta**. Bandas y potencia en Ucrania: **baja** | ng_alq131, fas_alq131, dx_f16nl, afm_f16ew, d1_f16ew |
| **ADM-160 MALD** — aliado (EE. UU.) | **Señuelo** que imita misiles de crucero (no es un interferidor confirmado) | — | — | Lanzado desde Su-27 y MiG-29, desde may-2023 | Uso: **alta**. Variante con interferidor (MALD-J): **no confirmada** | twz_mald |

---

## C) Entradas propuestas para el motor (listas para pegar)

### Criterios

- Elegí los sistemas mejor documentados que **el motor actual puede representar**: tres anti-GNSS (`gnssJam`) y un interferidor de radar aéreo.
- Los antidrones tácticos (Piranha, Kvertus, Shatro, Synytsia, EDM4S) **no van**: actúan sobre enlaces de control de drones que no existen en el catálogo (FPV, Mavic, Orlan, Lancet), a cientos de metros.
- **Advertencia crítica antes de pegar:** hoy `jamJ()` (src/physics/radar.js) y el bloque GNSS de `src/sim/engine.js` **no miran `side`**. Por eso:
  - Un interferidor de radar `side: 'UA'` también cegaría los radares ucranianos.
  - El supresor GNSS ya existente (`gnss`, desplegado como ruso en el escenario de ataque sobre el S-400) le afecta a cualquier arma, del bando que sea.
  - Los anti-GNSS ucranianos funcionan bien sin cambios mientras se usen en escenarios donde Ucrania defiende. El pod del F-16 **necesita la mecánica D1** para tener sentido.
- Los valores de `P` solo se usan en interferidores de radar. Como referencia: Il-22PP = 3e5, Krasukha = 1e6.
- **Recomendación sobre `gnss`:** conservar la clave (la usa `scenarios.js`) pero pasarlo a `side: 'RU'` con nombre "Pole-21". Pokrova sale en su propia entrada.

### C.1 `JAMMERS` (agregar en src/data/jammers.js)

```js
  pokrova: { name: 'Pokrova (red ucraniana de supresión y engaño GNSS)', short: 'Pokrova', side: 'UA', air: false, gnssJam: true, radius: 25,
    notes: ['Red nacional de estaciones de guerra electrónica anunciada por Zaluzhnyi (nov-2023) y declarada operativa tras el ataque del 13/01/2024: suprime GPS/GLONASS en el frente y en gran parte del territorio, o los engaña (spoofing) con coordenadas falsas.',
      'Engañar no es lo mismo que meter ruido: el arma cree estar en otro lugar y se desvía sin detectarlo. Los primeros reportes hablaban de desvíos de 5–10 km; en nov/dic-2024 la mitad de algunos ataques con Shahed terminó "perdida localmente" o en Bielorrusia.',
      'No hay datos públicos de potencia, frecuencias ni radio por nodo: el radio es un valor de juego.',
      'Las antenas CRPA rusas (Kometa de 8/12/16 elementos; Kometa-M desde dic-2025) le restan mucho efecto. También afecta los receptores GNSS propios y civiles.'],
    sources: [SRC.kp_pokrova, SRC.dx_pokrova, SRC.forbes_pokrova, SRC.dpost_spoof] },
  lima: { name: 'Lima / Lima-Quant (estaciones anti-GNSS de Cascade y "Night Watch")', short: 'Lima', side: 'UA', air: false, gnssJam: true, radius: 40,
    notes: ['Interferencia, engaño y "ataque digital" contra el receptor GNSS. Se usa contra bombas planeadoras UMPK/KAB desde 2024, contra Shahed y, según sus operadores, también contra crucero y Kinzhal.',
      'Cada estación cuesta ~€58.000; una ciudad grande necesita 30–100, porque contra una CRPA hacen falta muchas fuentes desde puntos distintos. Hay más de 400 entregadas.',
      'Cifras del fabricante y de la unidad, sin verificación independiente: más de 20.000 Shahed afectados, 58–61 Kinzhal "neutralizados", la mitad de la supresión de blancos aéreos y alcance de 300 km contra Kinzhal. Lima-Quant: CRPA a 50 km y KAB a más de 100 km.',
      'Forbes y JAPCC confirman de forma independiente que la precisión de los KAB cayó en 2025. Rusia respondió con Kometa-M24 y con UMPK-PD lanzadas desde más de 95 km.'],
    sources: [SRC.kp_lima, SRC.nv_lima, SRC.forbes_kab25, SRC.japcc_kab, SRC.ki_kinzhal, SRC.forbes_limaq] },
  bukovel: { name: 'Bukovel-AD (antidrón: enlaces y GNSS)', short: 'Bukovel-AD', side: 'UA', air: false, gnssJam: true, radius: 15,
    notes: ['Sistema antidrón de Proximus, en servicio desde 2016. Detecta en 320–6.000 MHz hasta 70–100 km e interfiere enlaces de datos hasta 16–20 km. El fabricante declara supresión GNSS hasta 35 km, con 10 W por antena (2,4 y 5,8 GHz, GPS L1 y GLONASS L1).',
      'El motor solo representa la parte GNSS. Cortar el enlace de control no detiene a un Shahed autónomo; sí "aterrizó" un ZALA 421-16E2 ruso.',
      'Con 10 W, frente a receptores con CRPA el radio real es mucho menor que el declarado: valor de juego conservador.'],
    sources: [WP('Bukovel_(counter_unmanned_aircraft_system)'), SRC.azov_bukovel, SRC.mil_bukovel] },
  f16ecm: { name: 'F-16 ucraniano con pod de autoprotección (AN/ALQ-131)', short: 'F-16 ECM', side: 'UA', air: true, alt: 4000, P: 3e4, bands: ['C', 'X', 'Ku'],
    notes: ['Los F-16 holandeses llegaron con AN/ALQ-131 y los daneses con ALQ-162 en pilones ECIPS. El 68.º Escuadrón de GE de la USAF los reprogramó contra amenazas rusas (ago-2024).',
      'El ALQ-131 cubre 2–20 GHz en configuraciones de 1 a 3 bandas: no se sabe cuáles tiene Ucrania. Acá se asumen las bandas de control de tiro (C/X/Ku).',
      'Es autoprotección, no un interferidor stand-off: en el juego representa una patrulla que escolta un ataque. Necesita el filtro por bando (mecánica D1) para no cegar radares propios.'],
    sources: [SRC.ng_alq131, SRC.dx_f16nl, SRC.afm_f16ew] }
```

Cambio sugerido para la entrada existente, conservando la clave:

```js
  gnss: { name: 'Supresor GNSS ruso (tipo Pole-21)', short: 'Pole-21', side: 'RU', /* resto igual; quitar Pokrova de la nota y de sources */ }
```

### C.2 `UNC.jam` (agregar en src/data/uncertainty.js)

```js
    pokrova: {
      radius: U(10, 25, 50, 'baja', S_('dx_pokrova', 'kp_pokrova'), 'est: no hay radio por nodo publicado; se usa el orden de magnitud de Pole-21. Red nacional = muchos nodos superpuestos')
    },
    lima: {
      radius: U(20, 40, 100, 'baja', S_('kp_lima2', 'forbes_limaq', 'ki_kinzhal'), 'fabricante: CRPA a 50 km, KAB a más de 100 km, Kinzhal a 300 km (cifras de Cascade y Night Watch). Que una ciudad necesite 30–100 estaciones sugiere un radio efectivo por estación menor contra CRPA; est')
    },
    bukovel: {
      radius: U(5, 15, 35, 'baja', S_('wp:Bukovel_(counter_unmanned_aircraft_system)', 'azov_bukovel'), 'fabricante: GNSS hasta 35 km con 10 W por antena; contra CRPA mucho menos; est')
    },
    f16ecm: {
      P: U(1e4, 3e4, 1e5, 'baja', S_('ng_alq131', 'fas_alq131'), 'parámetro de juego: potencia y bandas del pod no son públicas. Un orden de magnitud por debajo del Il-22PP (3e5) porque un pod de caza tiene menos potencia y antenas mucho más chicas que un avión de GE dedicado o un camión Krasukha (1e6); est'),
      alt: U(300, 4000, 8000, 'baja', [], 'est: los F-16 ucranianos vuelan bajo para sobrevivir y suben para lanzar; altura de patrulla de juego')
    },
```

### C.3 Nuevas claves `SRC`

```js
  // guerra electrónica ucraniana y aliada
  dx_pokrova: ['Defense Express: Pokrova, el sistema de GE que inutiliza los receptores GPS (ene-2024)', 'https://en.defence-ua.com/events/pokrova_ew_system_is_a_real_game_changer_in_ukrainian_fight_against_shahed_136_drones_and_cruise_missiles_that_renders_gps_receivers_useless-8462.html'],
  forbes_pokrova: ['Forbes (Hambling): Pokrova engaña a los Shahed (feb-2024)', 'https://www.forbes.com/sites/davidhambling/2024/02/12/ukraines-pokrova-spoofing-system-tells-shaheds-to-get-lost/'],
  dpost_spoof: ['The Defense Post: Ucrania desvía casi 100 Shahed por spoofing (dic-2024)', 'https://thedefensepost.com/2024/12/05/ukraine-spoofs-shahed-drones/'],
  euronews_lost: ['Euronews: cómo Ucrania desvía drones rusos hacia Bielorrusia (dic-2024)', 'https://www.euronews.com/my-europe/2024/12/04/lost-and-spoofed-how-ukraine-redirects-russian-drones-to-belarus'],
  dx_lost: ['Defense Express: "perdidos localmente" o derribados, el Estado Mayor explica la estadística', 'https://en.defence-ua.com/analysis/lost_or_destroyed_ukraines_general_staff_explains_the_confusing_shahed_downing_statistics-12432.html'],
  isis_upd: ['ISIS: análisis actualizado del Shahed (ago-2024 → mar-2025, derribados y perdidos)', 'https://isis-online.org/isis-reports/updated-analysis-of-russian-shahed-136-deployment-against-ukraine'],
  kp_lima: ['Kyiv Post: detalles del interferidor Lima contra bombas planeadoras', 'https://www.kyivpost.com/post/50474'],
  kp_lima2: ['Kyiv Post: Lima cuesta €58.000 por estación (2026)', 'https://www.kyivpost.com/post/76818'],
  nv_lima: ['NV (resume Politico): Ucrania usa Lima para desviar misiles y drones (2026)', 'https://english.nv.ua/russian-war/ukraine-uses-lima-system-to-divert-russian-missiles-and-drones-politico-says-50610791.html'],
  forbes_kab25: ['Forbes (Axe): los interferidores ucranianos confunden a las bombas planeadoras (mar-2025)', 'https://www.forbes.com/sites/davidaxe/2025/03/23/ukraines-jammers-are-confusing-russias-glide-bombs-watch-one-stray-off-course/'],
  emp_kab25: ['Euromaidan Press (resume Forbes): cae la precisión de los bombardeos rusos (mar-2025)', 'https://euromaidanpress.com/2025/03/18/forbes-russian-bombing-accuracy-plummets-due-to-ukrainian-electronic-warfare/'],
  japcc_kab: ['JAPCC (OTAN): Countering Russia’s glide bomb warfare in Ukraine', 'https://www.japcc.org/articles/countering-russias-glide-bomb-warfare-in-ukraine/'],
  emp_umpkpd: ['Euromaidan Press: Rusia alarga el alcance de las planeadoras para lanzar fuera de los interferidores (jun-2025)', 'https://euromaidanpress.com/2025/06/06/russias-glide-bombs-glide-farther-now/'],
  forbes_limaq: ['Forbes (Hambling): Lima-Quant contra las nuevas planeadoras (abr-2026; cifras del fabricante)', 'https://www.forbes.com/sites/davidhambling/2026/04/03/new-ukrainian-jammer-makes-russias-latest-glide-bombs-useless-again/'],
  u24_limaq: ['UNITED24: Lima-Quant contra las antenas rusas más nuevas (2026)', 'https://united24media.com/war-in-ukraine/ukraines-lima-quant-ew-system-gets-upgrade-to-counter-most-advanced-russian-antennas-20611'],
  forbes_kinzhal: ['Forbes (Hambling): el spoofing desvía misiles rusos a campos vacíos (nov-2025)', 'https://www.forbes.com/sites/davidhambling/2025/11/20/how-spoofing-is-diverting-russian-missiles-into-empty-fields/'],
  ki_kinzhal: ['Kyiv Independent: Night Watch y Lima contra el Kinzhal (2026)', 'https://kyivindependent.com/patriots-or-no-patriots-ukraine-may-have-solved-the-problem-of-russias-kinzhal-missiles/'],
  up_cascade: ['Ukrainska Pravda: Cascade dice que Lima neutralizó 26 Kinzhal en el 1.er trimestre de 2026 (fabricante)', 'https://www.pravda.com.ua/eng/news/2026/04/20/8030936/'],
  interfax_lima: ['Interfax-Ukraine: Lima desvía 26 Kinzhal en 2026 (fabricante)', 'https://en.interfax.com.ua/news/general/1160762.html'],
  mil_lima_half: ['Militarnyi: según el comandante de Night Watch, Lima hace la mitad de la supresión de blancos aéreos', 'https://militarnyi.com/en/news/ew-system-lima-accounts-for-half-of-air-target-suppression-night-watch-commander-says/'],
  u24_kometa12: ['UNITED24: Rusia equipa las planeadoras con Kometa de 12 canales', 'https://united24media.com/latest-news/russia-equips-glide-bombs-with-12-channel-kometa-antennas-to-counter-ukrainian-jamming-7653'],
  nv_kometa16: ['NV: misiles de crucero rusos más resistentes a la interferencia (Kometa-M de 16 elementos en Iskander-K)', 'https://english.nv.ua/russian-war/russian-cruise-missiles-now-more-resistant-to-jamming-50523018.html'],
  azov_bukovel: ['azov.one: ficha técnica de Bukovel (datos del fabricante)', 'https://azov.one/en/blog/electronics-warfare-systems/electronic-warfare-system-bukovel'],
  topwar_bukovel: ['Topwar (fuente rusa): la GE que tenemos enfrente, Bukovel-AD', 'https://en.topwar.ru/217358-rjeb-kotoryj-protiv-nas-bukovel-ad.html'],
  mil_bukovel: ['Militarnyi: Bukovel-AD "aterriza" un ZALA 421-16E2 ruso', 'https://militarnyi.com/en/news/ukrainian-bukovel-ad-ew-system-landed-russian-zala-421-16e2-uav/'],
  ar_piranha: ['Army Recognition: Piranha AVD 360 (2023)', 'https://www.armyrecognition.com/archives/archives-land-defense/land-defense-2023/ukraine-launches-piranha-avd-360-electronic-warfare-system-to-counter-russian-drones'],
  ukr_piranha: ['Ukrinform: Piranha protege blindados contra drones', 'https://www.ukrinform.net/rubric-defense/3782010-ukraine-creates-piranha-ew-system-to-protect-armored-vehicles-against-drones.html'],
  dx_atlas: ['Defense Express: proyecto Atlas de Kvertus ("muro antidrón" de 1.300 km)', 'https://en.defence-ua.com/news/kvertus_presents_new_atlas_project_capable_of_shielding_1300_km_frontline_from_drones-13400.html'],
  emp_backpack: ['Euromaidan Press: la GE de mochila ucraniana (may-2024)', 'https://euromaidanpress.com/2024/05/17/the-ew-backpack-revolution-how-ukrainian-portable-tech-jams-russian-drones/'],
  naudi_nota: ['NAUDI (asociación industrial ucraniana): ficha de Nota', 'https://naudi.com.ua/products/nota'],
  dpost_shatro: ['The Defense Post: GE "de trinchera" Shatro (jun-2024)', 'https://thedefensepost.com/2024/06/10/ukraine-trench-electronic-warfare/'],
  dpost_multiband: ['The Defense Post: nueva GE multibanda ucraniana, Stryi de InLab (jul-2026)', 'https://thedefensepost.com/2026/07/29/ukraine-electronic-warfare-tech/'],
  unian_mandat: ['UNIAN: modernización de los Mandat R-330UM ucranianos', 'https://www.unian.info/society/10959944-ukraine-s-jamming-systems-facing-deep-upgrade-photo.html'],
  janes_edm4s: ['Janes: Ucrania despliega miles de interferidores lituanos EDM4S', 'https://www.janes.com/osint-insights/defence-news/c4isr/ukraine-conflict-ukraine-deploying-1000s-of-lithuanian-c-uas-jammers'],
  ng_alq131: ['Northrop Grumman (fabricante): pod AN/ALQ-131(V)', 'https://www.northropgrumman.com/what-we-do/mission-solutions/electronic-warfare/an-alq-131v-electronic-countermeasures-ecm-pod'],
  fas_alq131: ['FAS: AN/ALQ-131, pod de autoprotección', 'https://man.fas.org/dod-101/sys/ac/equip/an-alq-131.htm'],
  dx_f16nl: ['Defense Express: qué traen distinto los F-16 holandeses (ALQ-131, ECIPS)', 'https://en.defence-ua.com/news/ukraines_new_f_16s_from_the_netherlands_whats_different_from_danish_version-12107.html'],
  afm_f16ew: ['Air & Space Forces Magazine: la USAF reprogramó la GE de los F-16 ucranianos (ago-2024)', 'https://www.airandspaceforces.com/ukraine-f-16-electronic-warfare-us-air-force/'],
  d1_f16ew: ['Defense One: un escuadrón de GE de la USAF apoya a los F-16 ucranianos', 'https://www.defenseone.com/technology/2024/08/ukraines-f-16s-are-fighting-help-usaf-electronic-warfare-unit/399096/'],
  twz_mald: ['TWZ: ADM-160 MALD en un Su-27 ucraniano', 'https://www.twz.com/air/our-best-look-yet-at-an-adm-160-miniature-air-launched-decoy-on-a-ukrainian-fighter'],
  twz_modem: ['TWZ: Shahed-136 con módem celular hallado en Ucrania', 'https://www.twz.com/shahed-136-with-cellular-modem-found-in-ukraine-what-it-means'],
  hinz_mesh: ['Fabian Hinz (luftlage): Networking the Shahed (módems mesh)', 'https://luftlage.substack.com/p/networking-the-shahed'],
  up_starlink: ['Ukrainska Pravda: drones con Starlink contra la retaguardia (feb-2026)', 'https://www.pravda.com.ua/eng/articles/2026/02/09/8020195/'],
  u24_shark: ['UNITED24: avión liviano SHARK con GE antidrón (2025)', 'https://united24media.com/latest-news/ukraine-deploys-new-shark-aircraft-with-electronic-warfare-system-to-jam-russian-drones-9335'],
```

---

## D) Mecánicas nuevas (breve y concreto)

**D1. Filtro por bando (prerrequisito, cambio mínimo).**
- En `jamJ`: `if (JJ.side !== 'both' && JJ.side === D(u).side) continue;`
- En el bloque GNSS de engine.js: `if (J.side !== 'both' && J.side === th.T.side) continue;`
- Opcional, "fratricidio": si `J.side === th.T.side`, aplicar un 20–30 % del efecto. Pokrova también degradaba el GNSS propio y civil.

**Estado en el motor (PR de ECM/ECCM segunda parte).** El filtro normal ya está aplicado: un jammer con
`side: 'RU'` no degrada radares ni GNSS rusos, y uno con `side: 'UA'` no degrada los ucranianos. Los
equipos marcados `both` quedan exceptuados. El fratricidio parcial sigue fuera del modelo porque no hay
datos públicos suficientes para elegir una tasa y no queremos convertir una capacidad civil o propia en
un número inventado.

**D2. Separar interferencia de engaño (`mode: 'jam' | 'spoof'`).**
- `jam` (ruido): el arma pasa a navegación inercial. Error = `deriva × distancia que le queda hasta el blanco al entrar al radio`, con `deriva = U(0.02, 0.03, 0.05)`. Fuentes: Politico/NV, "≈2 km cada 100 km"; Defense Post, "≈5 % de la distancia". Reemplaza el `300 + rnd·1500` actual, que es demasiado chico para un Shahed y demasiado grande para una UMPK que entra a 20 km del blanco.
- `spoof` (engaño): desvío **dirigido**. El arma se corre un vector de módulo `U(2, 5, 10)` km (Pokrova, primeros reportes de 5–10 km). Dirección: hacia afuera del centro de la estación, o la que elija el jugador (`spoofAz`). Más una probabilidad `pLost` de que el arma quede "perdida localmente" (no impacta: se agota el combustible o se va a Bielorrusia).
- Pokrova y Lima: `spoof`. Bukovel y Pole-21: `jam`.

**D3. CRPA (Kometa) frente a cantidad de fuentes.**
- **Estado:** hecho con la regla N − 1 por dirección y CRPA elegible por salva (`sv.crpa`), sin `crpaMax` por interferidor (ver `docs/FISICA.md` §4).
- Campo nuevo en amenazas: `crpa: 0 | 4 | 8 | 12 | 16` (elementos).
- Una CRPA de N elementos puede anular hasta ~N−1 fuentes. Regla: el efecto se aplica si `fuentesGNSS_que_cubren_el_punto ≥ crpa` o si el interferidor tiene `crpaMax ≥ crpa`. Lima-Quant tendría `crpaMax: 16`; Pokrova y Bukovel, `crpaMax: 4` (est).
- Datos: "8 elementos → hicieron falta 19 Lima viejos; 16 elementos → ni 104" (ingenieros ucranianos vía Forbes/United24; *claim*).
- Esto exige cambiar el `break` del bucle GNSS (hoy corta en el primer interferidor) para **contar** las fuentes.
- Valores sugeridos de `crpa` (todos 'baja'):
  - Shahed 2022–23: 0–4. Shahed 2025: 8–12. Shahed desde mediados de 2025: 16 (ver la sección G).
  - Iskander-K actual: 16 (NV).
  - Kh-101/Kalibr: desconocido. Igual combinan GNSS con correlación de terreno u óptica, así que conviene mantener su `T.gnss` alto.

**D4. Categoría "perdido localmente" en el debrief.**
- Contar aparte las armas con `navErr > 2 km` o `pLost`.
- Así se puede comparar con la estadística de la Fuerza Aérea: ~35 % de los Shahed en ago-2024–may-2025 y 45–50 % en noches de nov/dic-2024. Hay que aclarar que esa cifra real incluye señuelos (D6).

**D5. Interferencia de enlaces (`linkJam`): no prioritaria.**
- Solo tiene sentido si aparecen amenazas con `link: 'rf' | 'lte' | 'mesh' | 'starlink'`: Shahed con módem mesh o LTE (control a ~600 km según las FF. AA. ucranianas), Shahed pilotados por Starlink, Lancet, Molniya.
- Efecto: perder el reapuntado del operador, no la navegación.
- Un Shahed autónomo **no se ve afectado**. El enlace Starlink es mucho más resistente.
- Con el catálogo actual no hace falta.

**D6. Señuelos y "perdidos".** Los Gerbera/Parodiya ya existen. Que un señuelo "perdido" cuente igual que un Shahed desviado inflaría la eficacia de la GE: hay que separarlos en las estadísticas.

**D7. Opcional, de confianza baja: rotura del Kinzhal por maniobra.** Cascade y Night Watch afirman que el engaño induce maniobras que superan los límites estructurales. Si se quiere, `pBreak = U(0, 0.1, 0.5, 'baja')` solo con `spoof` contra `kinzhal`. Hoy el motor tiene `kinzhal.gnss = 1`, o sea inmune; esa cifra podría bajarse a `U(0.8, 0.95, 1)` con la nota "claim ucraniano".

**Qué ya alcanza:**
- El modelo de radio GNSS circular sirve como primera aproximación para Pokrova, Lima y Bukovel.
- `T.gnss` < 1 como "dependencia del satélite" sirve.
- `jamJ` con lóbulo principal y `1/d²` sirve para el pod del F-16, una vez agregado D1.

---

## E) Fuentes (con sesgo indicado)

Leyenda: **[F]** fabricante, **[G]** gobierno o fuerzas armadas (posible sesgo de bando), **[UA-m]** medio ucraniano (independiente del gobierno en distinto grado, pero con sesgo de bando posible), **[RU]** fuente rusa, **[I]** independiente occidental o *think tank*, **[B]** blog o agregador (contrastar).

**Pokrova y "perdidos localmente"**
- [UA-m] Kyiv Post, Pokrova — https://www.kyivpost.com/post/28059 (ya en SRC: `kp_pokrova`)
- [UA-m] Defense Express, Pokrova — https://en.defence-ua.com/events/pokrova_ew_system_is_a_real_game_changer_in_ukrainian_fight_against_shahed_136_drones_and_cruise_missiles_that_renders_gps_receivers_useless-8462.html
- [I] Forbes (Hambling), feb-2024 — https://www.forbes.com/sites/davidhambling/2024/02/12/ukraines-pokrova-spoofing-system-tells-shaheds-to-get-lost/
- [I] The Defense Post, dic-2024 — https://thedefensepost.com/2024/12/05/ukraine-spoofs-shahed-drones/
- [I] Euronews, dic-2024 (cita a J. Hardie, FDD) — https://www.euronews.com/my-europe/2024/12/04/lost-and-spoofed-how-ukraine-redirects-russian-drones-to-belarus
- [I] Newsweek, desvío hacia Bielorrusia — https://www.newsweek.com/ukraine-russia-drones-belarus-spoofing-gps-1992969
- [UA-m] Espreso, "¿Pokrova cambia el juego?" — https://global.espreso.tv/pokrova-system-against-missiles-and-shahed-drones-is-it-really-a-game-changer
- [UA-m] Defense Express, "perdidos o derribados" — https://en.defence-ua.com/analysis/lost_or_destroyed_ukraines_general_staff_explains_the_confusing_shahed_downing_statistics-12432.html
- [UA-m] Obozrevatel, qué significa "perdido localmente" — https://eng.obozrevatel.com/section-war/news-locationally-lost-drone-what-the-term-ukrainians-often-see-in-air-force-reports-on-russian-attacks-means-30-11-2024.html
- [I] ISIS, análisis actualizado del Shahed — https://isis-online.org/isis-reports/updated-analysis-of-russian-shahed-136-deployment-against-ukraine
- [I] ISIS, may-2025 — https://isis-online.org/isis-reports/may-2025-updated-analysis-of-russian-shahed-136-deployment-against-ukraine (ya en SRC: `isis_may25`)
- [I] ISIS, análisis mensual ago-2025 → jun-2026 — https://isis-online.org/isis-reports/monthly-analysis-of-russian-shahed-136-deployment-against-ukraine (ya en SRC: `isis_month`)
- [B] Ukraine's Arms Monitor, "Stopping Shaheds" — https://ukrainesarmsmonitor.substack.com/p/stopping-shaheds-ukraines-solutions
- [I] IEEE Spectrum, GE ucraniana — https://spectrum.ieee.org/ukraine-air-defense

**Lima / Lima-Quant**
- [UA-m] Kyiv Post — https://www.kyivpost.com/post/50474 · https://www.kyivpost.com/post/76818
- [UA-m] NV (resume Politico) — https://english.nv.ua/russian-war/ukraine-uses-lima-system-to-divert-russian-missiles-and-drones-politico-says-50610791.html
- [I] Forbes (Axe), mar-2025 — https://www.forbes.com/sites/davidaxe/2025/03/23/ukraines-jammers-are-confusing-russias-glide-bombs-watch-one-stray-off-course/
- [UA-m] Euromaidan Press (resume Forbes) — https://euromaidanpress.com/2025/03/18/forbes-russian-bombing-accuracy-plummets-due-to-ukrainian-electronic-warfare/
- [I] Forbes (Hambling), nov-2025, Kinzhal — https://www.forbes.com/sites/davidhambling/2025/11/20/how-spoofing-is-diverting-russian-missiles-into-empty-fields/
- [I] Forbes (Hambling), abr-2026, Lima-Quant (cifras del fabricante) — https://www.forbes.com/sites/davidhambling/2026/04/03/new-ukrainian-jammer-makes-russias-latest-glide-bombs-useless-again/
- [UA-m] Kyiv Independent, Kinzhal — https://kyivindependent.com/patriots-or-no-patriots-ukraine-may-have-solved-the-problem-of-russias-kinzhal-missiles/
- [F vía UA-m] Ukrainska Pravda, Cascade: 26 Kinzhal — https://www.pravda.com.ua/eng/news/2026/04/20/8030936/
- [F vía UA-m] Interfax-Ukraine — https://en.interfax.com.ua/news/general/1160762.html
- [G/F vía UA-m] Militarnyi, comandante de Night Watch — https://militarnyi.com/en/news/ew-system-lima-accounts-for-half-of-air-target-suppression-night-watch-commander-says/
- [F vía UA-m] Militarnyi, 61 Kinzhal — https://militarnyi.com/en/news/lima-ew-system-intercept-61-russian-kinzhal/
- [UA-m] UNITED24, Lima-Quant — https://united24media.com/war-in-ukraine/ukraines-lima-quant-ew-system-gets-upgrade-to-counter-most-advanced-russian-antennas-20611
- [UA-m] UNITED24, planeadoras pierden precisión — https://united24media.com/latest-news/ukraine-develops-electronic-warfare-system-that-disrupts-unstoppable-russian-glide-bombs-7420

**KAB/UMPK y CRPA Kometa (contramedidas rusas)**
- [I] JAPCC (OTAN) — https://www.japcc.org/articles/countering-russias-glide-bomb-warfare-in-ukraine/
- [UA-m] Euromaidan Press, UMPK-PD fuera del alcance de los interferidores — https://euromaidanpress.com/2025/06/06/russias-glide-bombs-glide-farther-now/
- [UA-m] UNITED24, Kometa de 12 canales en planeadoras — https://united24media.com/latest-news/russia-equips-glide-bombs-with-12-channel-kometa-antennas-to-counter-ukrainian-jamming-7653
- [UA-m] UNITED24, UMPK con antiinterferencia a 95 km — https://united24media.com/latest-news/russia-upgrades-glide-bombs-with-anti-jam-tech-to-hit-targets-95-km-deep-into-ukraine-heres-what-we-know-9703
- [UA-m] NV, Kometa-M de 16 elementos en Iskander-K — https://english.nv.ua/russian-war/russian-cruise-missiles-now-more-resistant-to-jamming-50523018.html
- [I] Forbes (Mittal), planeadoras con antiinterferencia — https://www.forbes.com/sites/vikrammittal/2025/03/18/russian-glide-bombs-upgraded-with-advanced-counter-jamming-system/
- [B] H. Boserup (Substack), Kometa como "Enigma" y la fábrica VNIIR-Progress — https://hansboserup.substack.com/p/russia-built-an-enigma-machine-for
- [I/B] J. Hardie (FDD) en X, Kometa de 12 elementos en un Shahed — https://x.com/JohnH105/status/1891521597913047467
- [UA-m] Militarnyi, CRPA china en un Shahed — https://militarnyi.com/en/news/new-chinese-crpa-antenna-found-on-russian-shahed/
- [B] drone-warfare.com, Kometa-M y caída de la intercepción en dic-2025 (agregador, **baja**) — https://drone-warfare.com/counter-uas/countering-the-shahed-136/

**Enlaces del Shahed (mesh, LTE, Starlink)**
- [I] TWZ, módem celular — https://www.twz.com/shahed-136-with-cellular-modem-found-in-ukraine-what-it-means
- [I] F. Hinz (luftlage) — https://luftlage.substack.com/p/networking-the-shahed
- [UA-m] Ukrainska Pravda, Starlink — https://www.pravda.com.ua/eng/articles/2026/02/09/8020195/

**Antidrones ucranianos**
- [I/B] Wikipedia, Bukovel — https://en.wikipedia.org/wiki/Bukovel_(counter_unmanned_aircraft_system)
- [F/B] azov.one, ficha de Bukovel — https://azov.one/en/blog/electronics-warfare-systems/electronic-warfare-system-bukovel
- [RU] Topwar, Bukovel-AD — https://en.topwar.ru/217358-rjeb-kotoryj-protiv-nas-bukovel-ad.html
- [UA-m] Militarnyi, ZALA derribado con Bukovel — https://militarnyi.com/en/news/ukrainian-bukovel-ad-ew-system-landed-russian-zala-421-16e2-uav/
- [I] Janes, GE ucraniana en foco — https://www.janes.com/defence-intelligence-insights/defence-news/c4isr/ukraine-conflict-ukraines-electronic-warfare-systems-in-focus
- [F] NAUDI, Nota — https://naudi.com.ua/products/nota
- [I] Army Recognition, Piranha — https://www.armyrecognition.com/archives/archives-land-defense/land-defense-2023/ukraine-launches-piranha-avd-360-electronic-warfare-system-to-counter-russian-drones
- [G/UA-m] Ukrinform, Piranha — https://www.ukrinform.net/rubric-defense/3782010-ukraine-creates-piranha-ew-system-to-protect-armored-vehicles-against-drones.html
- [I/B] Wikipedia, Kvertus — https://en.wikipedia.org/wiki/Kvertus
- [UA-m] Defense Express, Atlas — https://en.defence-ua.com/news/kvertus_presents_new_atlas_project_capable_of_shielding_1300_km_frontline_from_drones-13400.html
- [UA-m] Euromaidan Press, GE de mochila — https://euromaidanpress.com/2024/05/17/the-ew-backpack-revolution-how-ukrainian-portable-tech-jams-russian-drones/
- [I] The Defense Post, Shatro — https://thedefensepost.com/2024/06/10/ukraine-trench-electronic-warfare/
- [I] The Defense Post, Stryi — https://thedefensepost.com/2026/07/29/ukraine-electronic-warfare-tech/
- [F] Revolt (tienda), Synytsia 6 — https://revolt.in.ua/ua/p2221040970-reb-sistema-sinitsya.html
- [G/UA-m] Ukrinform, estación **rusa** "Synytsia" destruida — https://www.ukrinform.ua/rubric-ato/3796184-na-kupanskomu-napramku-sili-oboroni-znisili-rosijsku-stanciu-reb-sinica.html
- [UA-m] UNIAN, Mandat — https://www.unian.info/society/10959944-ukraine-s-jamming-systems-facing-deep-upgrade-photo.html
- [UA-m] UNITED24, SHARK — https://united24media.com/latest-news/ukraine-deploys-new-shark-aircraft-with-electronic-warfare-system-to-jam-russian-drones-9335

**Aliados**
- [I/B] Wikipedia, EDM4S — https://en.wikipedia.org/wiki/EDM4S
- [I] Janes, miles de EDM4S — https://www.janes.com/osint-insights/defence-news/c4isr/ukraine-conflict-ukraine-deploying-1000s-of-lithuanian-c-uas-jammers
- [B] UAWire, Alemania bloquea fusiles antidrón — https://uawire.org/germany-blocks-delivery-of-anti-drone-jamming-guns-to-ukraine
- [F] Northrop Grumman, ALQ-131 — https://www.northropgrumman.com/what-we-do/mission-solutions/electronic-warfare/an-alq-131v-electronic-countermeasures-ecm-pod
- [I] FAS, ALQ-131 — https://man.fas.org/dod-101/sys/ac/equip/an-alq-131.htm
- [UA-m] Defense Express, F-16 holandeses — https://en.defence-ua.com/news/ukraines_new_f_16s_from_the_netherlands_whats_different_from_danish_version-12107.html
- [G vía I] Air & Space Forces Magazine — https://www.airandspaceforces.com/ukraine-f-16-electronic-warfare-us-air-force/
- [I] Defense One — https://www.defenseone.com/technology/2024/08/ukraines-f-16s-are-fighting-help-usaf-electronic-warfare-unit/399096/
- [I] TWZ, MALD en Su-27 — https://www.twz.com/air/our-best-look-yet-at-an-adm-160-miniature-air-launched-decoy-on-a-ukrainian-fighter
- [I] TWZ, MALD en MiG-29 — https://www.twz.com/air/adm-160-miniature-air-launched-decoy-spotted-on-ukrainian-mig-29
- [I] Army Recognition, MALD "capaz de interferir" (**especulativo**) — https://www.armyrecognition.com/archives/archives-land-defense/land-defense-2024/ukraine-mig-29s-now-equipped-with-us-adm-160-mald-decoy-missiles-able-to-jam-modern-russian-radars

---

## F) Advertencias

1. **"Perdido localmente" no equivale a "derrotado por GE".** El propio Estado Mayor ucraniano aclara que la categoría no distingue entre supresión electrónica, señuelos (Gerbera, Parodiya) que se quedan sin combustible por diseño y fallas mecánicas. Las fracciones de ~35 % (2024–25) y 45–50 % (algunas noches de nov/dic-2024) son un **techo**, no la eficacia de la GE.
2. **La eficacia cambia mes a mes.** Las cifras de fines de 2024 no valen para 2026. Kometa de 12 elementos (abr-2025), CRPA chinas de 16 (mar-2025), Kometa-M de 16 (mediados de 2025), módems mesh y LTE, y Starlink le restaron efecto a la GE ucraniana. Lima-Quant (2026) dice recuperarlo. Para el motor conviene un parámetro por **época** del escenario.
3. **Cifras del fabricante y de la unidad, sin verificación independiente:** más de 20.000 Shahed afectados por Lima, 58–61 Kinzhal "neutralizados", "58 de 59 aplicaciones", más del 98 % de neutralización "en sus zonas", el 50 % de la supresión total, alcance de 300 km contra Kinzhal, eficacia de los KAB "cero" (869 KAB y 8 heridos leves en un mes), y la regla "19 interferidores contra 8 elementos, ni 104 contra 16". Son útiles como orden de magnitud y deberían tener `c: 'baja'`.
4. **La autoría de Lima es confusa.** Las fuentes de 2025 la atribuyen al equipo "Night Watch" (una unidad); las de 2026, a la *startup* Cascade Systems (registrada en EE. UU., según Kyiv Post). Probablemente sea una colaboración. Conviene nombrar el sistema, no a la empresa.
5. **Pokrova casi no tiene datos técnicos públicos.** Su radio, potencia y arquitectura son estimaciones. Los "desvíos de 5–10 km" se atribuían a los primeros reportes ucranianos de 2024, pero no aparecen en ninguna de las páginas leídas completas (sección H).
6. **"Enclave" no está verificado.** No encontré fuentes públicas con ese nombre. "Synytsia" es un nombre comercial genérico (varias cúpulas anti-FPV) y Ukrinform también lo usa para una estación **rusa**. Mejor no incluir ninguno de los dos como sistema.
7. **GE aliada contra radares:** solo está confirmada la **existencia** de pods de autoprotección en los F-16 y su reprogramación por la USAF. Bandas, potencia y uso real en combate son secretos. Que el MALD ucraniano "interfiera radares" (Army Recognition) es **especulación**: solo el MALD-J tiene interferidor, y su entrega no está confirmada. Que el HP 47 alemán haya llegado a Ucrania **no está confirmado**.
8. **Propaganda de ambos lados.**
   - Los medios ucranianos (UNITED24 es una plataforma estatal; Defense Express, Militarnyi y Kyiv Post son privados, pero con sesgo de bando) tienden a amplificar los éxitos.
   - Las fuentes rusas (Topwar, MoD/TASS) minimizan la GE ucraniana o exageran la propia.
   - Las cifras de "intercepción" de la Fuerza Aérea ucraniana incluyen derribos con GE y no son auditables.
9. **Las cifras de deriva inercial son aproximadas.** "≈2 km cada 100 km" (Politico) y "≈5 %" (otra fuente) difieren por un factor de 2,5. Dependen del arma, de la calidad de su INS y de si tiene navegación por terreno u óptica. Kh-101, Kalibr e Iskander-K tienen correlación de terreno u óptica, y por eso la GE solo GNSS los afecta mucho menos que a Shahed y UMPK.
10. **Limitación de esta investigación:** al principio el acceso directo a las páginas estuvo bloqueado y todo se extrajo de resúmenes de búsqueda (ver la nota del principio). Las fuentes de la sección G se leyeron después completas (sección H), salvo Forbes, que bloquea el acceso.


---

## G) Verificación cruzada (oct-2026)

Búsquedas nuevas, comparando qué dicen fuentes de distinto origen. "Independiente" quiere decir otra redacción, no otro origen del dato: una cifra del fabricante repetida por diez medios sigue siendo del fabricante.

| Dato | Qué dicen las fuentes | Antes | Ahora |
|---|---|---|---|
| **Lima**: ~€58.000 por estación, 30–100 por ciudad, más de 400 entregadas, en uso desde el verano de 2024 | Coinciden Kyiv Post, NV (resume Politico) y Quwa. Las tres cifras salen de Cascade Systems | media | **Existencia y uso: alta. Precio y cantidades: media** (un solo origen, el fabricante) |
| **Lima contra Kinzhal**: 58 de 59 desviados; "más de 60" a julio de 2026 | Quwa y NV, citando al fabricante | baja | **baja** (sigue siendo del fabricante; la cifra subió) |
| **Pokrova**: supresión y engaño GNSS; 95 Shahed desviados en nov-2024, varios hacia Bielorrusia | Coinciden The Defense Post, Newsweek, Euronews, Kyiv Post y Militarnyi | alta (existencia) / baja (parámetros) | **Igual**. Los "desvíos de 5–10 km" **no aparecieron** en ninguna fuente nueva. Sí aparece una deriva inercial del Shahed de **≈5 km cada 100 km** sin GNSS, que coincide con el "≈5 %" de la sección D2 |
| **Kometa**: 4 elementos en Iskander-K (2022), 12 en UMPK (abr-2025), **16 en Shahed e Iskander-K desde jun-2025**; 12 elementos (Kometa-M12R) en Iskander-M | Coinciden UNITED24, Militarnyi (dos notas), Forbes y un análisis independiente | baja | **media**. Corrección: los de 16 elementos aparecen desde **mediados de 2025**, no recién en dic-2025 (esa fecha venía de un agregador) |
| **8 elementos → 19 estaciones; 16 → ni 104** | Forbes y el mismo análisis, citando a ingenieros ucranianos | baja (*claim*) | **baja** (un solo origen) |
| **Bukovel-AD**: GNSS hasta 35 km, 4 antenas de 10 W | Coinciden Wikipedia, ArmedConflicts (solo el radio; ver H) y folletos de Spetstechnoexport y Ukrspecexport | media | **media** (todas son la ficha del fabricante) |
| **AN/ALQ-131**: 2–20 GHz, configuraciones de 1 a 3 bandas | Coinciden FAS y Forecast International | media | **alta** (ficha técnica). TWZ señala que los F-16 ucranianos tienen el **ALQ-162(V)6** instalado: el ALQ-131 no está confirmado en Ucrania |

**Qué cambia en el juego:** nada de la simulación. Los parámetros que usa el motor (radio de cada estación, desvío por engaño, potencia relativa) no tienen dato público y siguen como estimaciones de confianza baja en `UNC.jam`. Se corrigen los textos sobre la fecha de los Kometa de 16 elementos (ficha del Shahed, `jammers.js`, FISICA §4) y se deja anotado que el pod del F-16 ucraniano probablemente sea el ALQ-162.

Fuentes de esta verificación: [Quwa](https://quwa.org/pakistan/market-intelligence/ukraines-lima-and-the-convergence-of-electronic-and-cyber-warfare-what-it-signals-for-pakistan/), [NV/Politico](https://english.nv.ua/russian-war/ukraine-uses-lima-system-to-divert-russian-missiles-and-drones-politico-says-50610791.html), [The Defense Post](https://thedefensepost.com/2024/12/05/ukraine-spoofs-shahed-drones/), [Newsweek](https://www.newsweek.com/ukraine-russia-drones-belarus-spoofing-gps-1992969), [Euronews](https://www.euronews.com/my-europe/2024/12/04/lost-and-spoofed-how-ukraine-redirects-russian-drones-to-belarus), [Militarnyi: Pokrova](https://militarnyi.com/en/news/pokrova-ew-system-which-successfully-neutralizes-shaheds-has-been-launched-in-ukraine/), [UNITED24: Kometa de 12](https://united24media.com/latest-news/russia-equips-glide-bombs-with-12-channel-kometa-antennas-to-counter-ukrainian-jamming-7653), [Militarnyi: Kometa-M12R en Iskander-M](https://militarnyi.com/en/news/russia-equips-iskander-m-missile-with-new-12-element-kometa-m12r-vt-antenna/), [Militarnyi: CRPA china en Shahed](https://militarnyi.com/en/news/new-chinese-crpa-antenna-found-on-russian-shahed/), [Hans Boserup (análisis)](https://hansboserup.substack.com/p/russia-built-an-enigma-machine-for), [Forbes: Lima-Quant](https://www.forbes.com/sites/davidhambling/2026/04/03/new-ukrainian-jammer-makes-russias-latest-glide-bombs-useless-again/), [ArmedConflicts: Bukovel-AD](https://www.armedconflicts.com/Bukovel-AD-t283355), [FAS: ALQ-131](https://man.fas.org/dod-101/sys/ac/equip/an-alq-131.htm), [Forecast International: ALQ-131](https://www.forecastinternational.com/archive/disp_old_pdf.cfm?ARC_ID=636), [TWZ: F-16 ucranianos con pods](https://www.twz.com/air/f-16-officially-in-ukrainian-service-self-protection-pods-included).

---

## H) Lectura completa de las fuentes (oct-2026)

Con la red de una sesión nueva se abrieron completas las páginas de la sección G. Las que bloquean los pedidos directos (NV, Euronews, Newsweek) se leyeron con un navegador sin interfaz. **Forbes sigue respondiendo 403**: sus dos notas (Pokrova feb-2024 y Lima-Quant abr-2026) se leen solo a través de quienes las citan. Se agregó una fuente que no estaba en la lista: Defense Express sobre el Kometa-M de 16 elementos en el Iskander-K (jun-2025).

| Dato | Qué dice la página completa | Cambio |
|---|---|---|
| **Kometa de 16 elementos** | Defense Express (jun-2025): los Iskander-K usan Kometa-M de 4 elementos **desde 2022** y aparecen con 16 en ataques recientes a Kiev. Las CRPA **chinas** de 16 elementos se ven en Shahed **desde marzo de 2025** (lo mismo dicen Militarnyi y Boserup; UNITED24 habla de enero). Las UMPK llevan Kometa-M de 12 desde **abril de 2025** | Hay **dos líneas**: la china de 16 desde mar-2025 y la rusa (Kometa-M de 16) desde mediados de 2025. **"Kometa-M" no es de dic-2025**: el nombre ya existía en 2022 con 4 elementos. Se corrige en `jammers.js` y en la advertencia F2 |
| **Fecha de las UMPK con 12 elementos** | Una nota de Militarnyi (Iskander-M) dice "abril de 2024". UNITED24 (cita a Militarnyi del 16/04/2025) y Defense Express dicen **abril de 2025** | Se toma **abril de 2025**. El "2024" de esa nota es casi seguro un error de tipeo |
| **Kometa-M12R-VT en el Iskander-M** | 12 elementos en la nariz para la fase inicial y media, y en la cola el Kometa-R8 (dos arreglos ARP-4T de 4 elementos) para la fase final. El autor del informe (canal "Colonel GSh") estima que suprimirlo pide **más de 11 fuentes de alta potencia** | Es coherente con la regla N − 1 del motor (12 elementos → 11 fuentes). Confianza **baja** (un solo origen) |
| **Cuántas fuentes vencen una CRPA** | Quwa: "un arreglo anula aproximadamente **una fuente menos que su número de elementos**". Defense Express: "teóricamente hacen falta tantas fuentes como elementos" | Las dos formulaciones difieren en uno; el motor usa N − 1, que es la cota clásica. No cambia |
| **Pokrova** | Militarnyi (2024): el vocero de la Fuerza Aérea (Ihnat) confirma que "existe y se usa". Fuera del principio de funcionamiento no hay ningún dato: **probablemente sea una red, no un aparato**. The Defense Post: desplegada en **febrero de 2024** | Sin cambios. Existencia: **alta**. Parámetros: siguen sin dato |
| **Noche del 26/11/2024** | 188 Shahed. **Fuerza Aérea (Newsweek): 95 desviados por GE, 5 hacia Bielorrusia.** Le Monde (The Defense Post): 76 derribados y 95 desviados; 43 a Bielorrusia entre el 24 y el 26/11. Proyecto Hajun: "al menos 17" esa noche | Las cifras de Bielorrusia varían mucho según quién cuenta (5, 17, 43). El 95 tiene dos orígenes: la Fuerza Aérea y una fuente de inteligencia |
| **Cómo se engaña a un Shahed** | Euronews (Hardie, FDD): el engaño se hace **de a poco**, para que el dron no detecte el salto; por eso terminan en Bielorrusia y no de vuelta en Rusia. Hajun, drones que entraron a Bielorrusia por mes en 2024: jul 9, ago 12, sep 27, oct 49, nov 151. "Perdidos" sobre el total: 22 % el 2/10 y 45 % el 2/12 | El engaño gradual coincide con el modelo del motor: un desvío sin salto, que el arma no nota (FISICA §4) |
| **Desvío por engaño (`spoofKm`)** | Quwa (cita al Kyiv Independent): Lima corre las coordenadas "**varios kilómetros**" para mandar el arma a un campo. Los "**5–10 km**" de Pokrova **no aparecen en ninguna página leída** | El rango de Lima (1–3–10 km) queda respaldado. El de Pokrova (2–5–10 km) sigue igual, pero su nota ya no lo atribuye a "primeros reportes": es una **estimación** con el mismo orden de magnitud que Lima |
| **Deriva inercial del Shahed** | The Defense Post: "según estudios", hasta **5 km cada 100 km** sin GNSS. No dice qué estudios | Igual que en G |
| **Lima** | NV (resume Politico, 24/05/2026): en uso desde el verano de 2024, ampliado en el otoño de 2025; hasta 3 millones de grivnas por unidad; 30–100 por ciudad (~€5 millones); según la empresa, 20.500 Shahed interferidos y "decenas" de misiles desviados en 18 meses. Quwa: más de 400 entregadas; 58 de 59 Kinzhal y "más de 60" a julio de 2026; la tercera técnica corrompe los datos de navegación que el receptor descarga y **el error sigue después de salir de la zona** | Sin cambios de confianza: todas las cifras son del fabricante |
| **Lima-Quant** | Boserup (cita a Forbes): suprime los Kometa más nuevos a **50 km**, planeadoras a más de 100 km y crucero y balísticos más lejos | Coincide con la nota de `UNC.jam.lima.radius`. Confianza **baja** |
| **Bukovel-AD** | ArmedConflicts: detección hasta 70 km (ficha) o 100 km (texto), **GNSS hasta 35 km**, enlace de datos hasta 20 km. **Los 10 W por antena no figuran en esa página**: salen de Wikipedia y de los folletos | Se ajusta la tabla de G: ArmedConflicts confirma el radio, no la potencia |
| **AN/ALQ-131** | Forecast International: **2–20 GHz**, configuraciones de 1, 2 o 3 bandas (17 posibles), unas 1.350 unidades fabricadas. FAS habla de "**una a cinco** bandas" en la descripción general y de "2 o 3 módulos de banda" en el Block II | Diferencia menor: el Block II, el que se usa, tiene 2 o 3 bandas |
| **Pods del F-16 ucraniano** | TWZ (ago-2024): pilones Terma **PIDS+** (bengalas, chaff y alerta de misiles AN/AAR-60) y **ECIPS+**, que llevan el interferidor **AN/ALQ-162(V)6** de Northrop Grumman. Lo típico es un pilón de cada tipo | Confirmado en la página. El ALQ-131 sigue sin aparecer en Ucrania |

**Qué cambia en el juego:** nada de la simulación. Cambian textos: la fecha de Kometa-M (ficha de Pokrova en `jammers.js` y advertencia F2), la nota de `UNC.jam.pokrova.spoofKm`, y la fila de Bukovel en la sección G.

Fuente agregada: [Defense Express: Kometa-M de 16 elementos en el Iskander-K](https://en.defence-ua.com/weapon_and_tech/kometa_m_navigation_unit_with_16_antennas_found_in_russian_iskander_k_what_it_means-14876.html).
