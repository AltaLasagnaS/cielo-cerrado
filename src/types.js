// Tipos de datos del catálogo y de los escenarios, en JSDoc. No se ejecuta: documenta los campos y
// le da autocompletado al editor (VS Code lo toma solo). Si agregás un campo, documentalo acá.

/**
 * Amenaza (data/threats.js).
 * @typedef {Object} Threat
 * @property {string} name   Nombre completo
 * @property {string} short  Nombre corto (mapa, registro)
 * @property {'RU'|'UA'} side
 * @property {'dron'|'crucero'|'supersonico'|'balistico'|'hiper'} cls  Clase: decide qué Pk usa cada defensa
 * @property {'drone'|'cruise'|'bunt'|'ballistic'|'highdive'|'hilo'} prof  Perfil de vuelo (docs/FISICA.md §5)
 * @property {number} v       Velocidad de crucero (m/s)
 * @property {number} [vDive] Velocidad en picada (m/s, perfil highdive)
 * @property {number} [vLow]  Velocidad del tramo rasante (m/s, perfil hilo)
 * @property {number} [agl]   Altura de vuelo sobre el terreno (m)
 * @property {[number, number]} [aglRange] Límites reales de operación: lo que el jugador puede elegir (m)
 * @property {Array<[string, number]>} [aglModes] Perfiles de aproximación típicos: [nombre, m AGL]
 * @property {string} [aglNote] De dónde salen la altura típica y los límites
 * @property {number} [cruiseAlt] Altura de crucero (m, highdive/hilo)
 * @property {number} [apogee]    Apogeo (km, ballistic)
 * @property {number} [diveDist]  Distancia de picada (km, highdive)
 * @property {number} [launchDist] Distancia de lanzamiento fuera del mapa (km)
 * @property {number} rcs     RCS frontal en X/S (m²)
 * @property {number} [rcsVHF] RCS en VHF (m²)
 * @property {1|3} [swerling] Fluctuación de la RCS entre barridos (physics/radar.js#pdRel): 1 = muchos reflectores parecidos (por defecto), 3 = uno dominante (balísticos)
 * @property {boolean} [lo]   Baja firma (furtivo)
 * @property {boolean} [ir]   Lanza bengalas contra buscadores IR
 * @property {boolean} [cold] Sin motor (planeadora): casi invisible para buscadores IR
 * @property {string} [datalink] Enlace de datos que puede llevar (módem/mesh): descarta el engaño GNSS
 * @property {string[]} [datalinks] Familias de enlace compatibles para una defensa o sensor
 * @property {number} gnss    Dependencia del GNSS: 0 = total, 1 = inmune
 * @property {string} [navFix] Corrección de navegación independiente del satélite (descarta el engaño GNSS)
 * @property {number} [seekerKm] Ventana que corrige el buscador terminal (km)
 * @property {number} cep     CEP (m)
 * @property {number} cost    Costo unitario (M US$)
 * @property {boolean} maneuver Maniobra terminal por defecto
 * @property {number} [manPk]  Factor de Pk por su maniobra terminal
 * @property {number} [decoys] Señuelos que libera por misil
 * @property {boolean} [decoy] Es un señuelo (sin ojiva)
 * @property {number} [dmgMult] Multiplicador de daño (por defecto 1)
 * @property {{rangeKm:number, warheadKg:number}} [info] Lo escribe applyProbable() desde UNC
 * @property {string} warhead  Texto
 * @property {string} range    Texto
 * @property {string} costNote Texto
 * @property {string} guidance Texto
 * @property {string} engine   Texto
 * @property {string} profile  Texto
 * @property {string[]} notes
 * @property {Array<[string, string]>} sources [título, URL]
 */

/**
 * Sensor (radar, acústico u óptico) de una defensa.
 * @typedef {Object} Radar
 * @property {string} name
 * @property {'VHF'|'L'|'S'|'C'|'X'|'Ku'|'ACU'|'OPT'} band
 * @property {number} R1     Alcance contra 1 m² (km)
 * @property {'none'|'mti'|'pd'} [mti] Procesamiento contra clutter: sin filtro, MTI o pulso-Doppler (physics/radar.js)
 * @property {number} mast   Altura de antena (m) o de vuelo (AEW)
 * @property {[number, number]} [mastRange] Altura real posible de la antena (m); mín = máx significa fija
 * @property {string} [mastNote] De dónde sale (fija, mástil, torre)
 * @property {number} sector Sector de búsqueda (°; 360 = giratorio)
 * @property {boolean} [side] Antena lateral (dos sectores a ±90°)
 * @property {number} eccm   Margen contra interferencia (dB; 99 = inmune)
 * @property {number} scan   Período de barrido (s)
 * @property {number} [altMax] Altura máxima detectable (m, acústico)
 */

/**
 * Arma de una defensa.
 * @typedef {Object} Sam
 * @property {number} maxR     Alcance contra aeronaves y crucero (km)
 * @property {number} maxRtbm  Alcance contra balísticos (km; 0 = no puede)
 * @property {number} minR     Alcance mínimo (km)
 * @property {number} altMin   Piso (m AGL)
 * @property {number} altMax   Techo (m)
 * @property {number} vInt     Velocidad media del interceptor hasta maxR (m/s)
 * @property {number} [vmax]   Velocidad máxima del interceptor (m/s); con tb, perfil de motor y planeo
 * @property {number} [tb]     Segundos hasta llegar a vmax con aceleración pareja (physics/interceptor.js)
 * @property {number} vmaxT    Blanco más rápido enfrentable (m/s)
 * @property {number} react    Tiempo de reacción (s)
 * @property {number} ch       Canales simultáneos
 * @property {number} mag      Munición
 * @property {number} salvo    Interceptores por blanco (doctrina de salva)
 * @property {'activo'|'TVM'|'SARH'|'mando'|'IR'|'cañón'|'operador'} guid
 * @property {string} shot     Nombre del interceptor
 * @property {boolean} [noDrones] No gastar en drones por defecto
 * @property {number} cost     Costo por disparo (M US$)
 * @property {Object<string, number>} pk  Pk base por clase de blanco
 */

/**
 * Defensa o sensor (data/defenses.js).
 * @typedef {Object} Defense
 * @property {string} name
 * @property {string} short
 * @property {'RU'|'UA'|'both'} side
 * @property {'sam'|'gun'|'sensor'|'aew'|'acoustic'} kind
 * @property {Radar|null} radar
 * @property {Sam} [sam]
 * @property {number} [alt] Altitud de patrulla (AEW, m)
 */

/**
 * Interferidor (data/jammers.js).
 * @typedef {Object} Jammer
 * @property {string} name
 * @property {string} short
 * @property {'RU'|'UA'|'both'} side
 * @property {boolean} air
 * @property {number} [alt]   Altitud (aéreos, m)
 * @property {number} [mast]  Altura de antena (terrestres, m)
 * @property {number} [P]     Potencia relativa de juego
 * @property {string[]} [bands] Bandas que interfiere
 * @property {boolean} [gnssJam] Es anti-GNSS
 * @property {number} [radius] Radio anti-GNSS (km)
 * @property {number} [spoofKm] Desvío típico por engaño (km)
 */

/**
 * Escenario (data/scenarios.js). Ver el encabezado de ese archivo para defs, salvos, jams y goals.
 * @typedef {Object} Scenario
 * @property {string} map  Clave de TERRAIN
 * @property {string} name
 * @property {'ataque'|'defensa'} player
 * @property {string} [time]
 * @property {string} [description]
 * @property {{defensa:string, ataque:string}} [forces]
 * @property {string} [conditions]
 * @property {{net?:boolean, doctrine?:'salva'|'sls'}} [rules]
 * @property {string[]} [rulesText]
 * @property {Array<{type:string, name:string, short?:string, x:number, y:number, hp?:number, desc?:string}>} objectives
 * @property {Array<Object>} defs
 * @property {Array<Object>} salvos
 * @property {Array<Object>} jams
 * @property {Array<{side:'ataque'|'defensa', primary:boolean, kind:string, target:string, min?:number, text:string}>} goals
 * @property {string} [success]
 * @property {string} [failure]
 */

export {};
