// Genera un relieve incluido (src/data/terrain/<clave>.js) a partir de un tile SRTM de 1° × 1°.
//
//   node scripts/gen-terrain.mjs kyiv                 (baja el tile de AWS Terrain Tiles)
//   node scripts/gen-terrain.mjs kyiv N50E030.hgt     (usa un archivo .hgt o .hgt.gz local)
//   node scripts/gen-terrain.mjs kharkiv [N50E036.hgt.gz N49E036.hgt.gz]
//                                                     (ventana de 1° armada con dos tiles: ver latS)
//
// Fuente: "Terrain Tiles" de Mapzen/AWS (formato skadi), derivadas de SRTM (NASA, dominio público).
// Atribución: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
// Conversión: igual que la importación .hgt del juego (celdas de 200 m, 1° × 1°), pero promediando
// todas las muestras de cada celda en lugar de tomar una sola (relieve más suave, sin aliasing).
// Agua: en SRTM los espejos de agua están aplanados a una altura constante. Una muestra es "agua"
// si es igual a sus cuatro vecinas y está por debajo de WATER_MAX_M; una celda es agua si al menos
// el 40% de sus muestras lo son. La máscara es SOLO para el dibujo y la lectura del terreno: la
// física usa la elevación real del espejo de agua.
import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Relieves que el script sabe generar. places: [nombre, latitud, longitud] (se pasan a km). */
const MAPS = {
  kyiv: {
    tile: 'N50E030', name: 'Kiev (Ucrania)',
    // posiciones de etiquetas (aprox. ±1 km): centros urbanos; aeropuertos y base según Wikipedia
    places: [
      ['Kiev (centro)', 50.4501, 30.5234], ['Brovary', 50.5110, 30.7909], ['Boryspil (aeropuerto)', 50.3447, 30.8947],
      ['Irpin', 50.5218, 30.2506], ['Bucha', 50.5435, 30.2120], ['Vyshhorod', 50.5847, 30.4890],
      ['Hostomel (aeropuerto)', 50.6036, 30.1919], ['Obukhiv', 50.1080, 30.6181], ['Base aérea de Vasylkiv', 50.2333, 30.3000],
      ['Ukrainka', 50.1520, 30.7400], ['Boyarka', 50.3290, 30.2880]
    ]
  },
  // Járkov está en 49,99° N: justo en el borde norte del tile N49E036. Para tener la ciudad entera y
  // la frontera rusa al norte, la ventana va de 49,5° a 50,5° N (mitad sur de N50E036 + mitad norte
  // de N49E036), con el mismo tamaño que un tile.
  odesa: {
    tile: 'N46E030', name: 'Odesa (Ucrania)',
    // posiciones (±1 km): Wikidata P625 (Odesa, Chornomorsk, puerto de Chornomorsk, Teplodar) y Wikipedia
    // (puerto de Odesa, aeropuerto, Ovidiopol, Bilhorod-Dnistrovskyi, Usatove, Dobroslav)
    places: [
      ['Odesa (centro)', 46.47747, 30.73262], ['Puerto de Odesa', 46.50361, 30.74444], ['Chornomorsk', 46.30132, 30.65452],
      ['Puerto de Chornomorsk', 46.32889, 30.65944], ['Aeropuerto de Odesa', 46.42694, 30.67806], ['Teplodar', 46.50361, 30.32444],
      ['Ovidiopol', 46.24472, 30.44472], ['Bilhorod-Dnistrovskyi', 46.18333, 30.35], ['Usatove', 46.53639, 30.65667], ['Dobroslav', 46.81944, 30.94167]
    ]
  },
  kharkiv: {
    tiles: ['N50E036', 'N49E036'], latS: 49.5, lonW: 36, name: 'Járkov (Ucrania)',
    // posiciones (±1 km): Wikipedia/Wikidata (ciudades, aeropuerto) y Global Energy Monitor (centrales)
    places: [
      ['Járkov (centro)', 49.9925, 36.2311], ['Aeropuerto de Járkov', 49.9247, 36.2900], ['Chuhuiv', 49.8363, 36.6813],
      ['Derhachi', 50.1170, 36.1170], ['Merefa', 49.8060, 36.0503], ['Lyptsi', 50.2092, 36.4211],
      ['Vovchansk', 50.2908, 36.9411], ['Central CHP-5 (Podvirky)', 49.9714, 36.1006], ['Central de Zmiiv', 49.5874, 36.5307]
    ]
  }
};

const WATER_MAX_M = 125, WATER_FRACTION = 0.4;

const key = process.argv[2], local = process.argv[3];
const M = MAPS[key];
if (!M) { console.error('Uso: node scripts/gen-terrain.mjs <' + Object.keys(MAPS).join('|') + '> [archivo.hgt(.gz)]'); process.exit(1); }

const tileLat = t => +t.slice(1, 3) * (t[0] === 'N' ? 1 : -1), tileLon = t => +t.slice(4, 7) * (t[3] === 'E' ? 1 : -1);
const tiles = M.tiles || [M.tile];
const lat0 = M.latS ?? tileLat(tiles[0]), lon0 = M.lonW ?? tileLon(tiles[0]);

/** Lee (archivo local) o baja un tile → { lat, buf, n }. */
async function loadTile(t, file) {
  let buf;
  if (file) buf = await readFile(file);
  else {
    const url = `https://elevation-tiles-prod.s3.amazonaws.com/skadi/${t.slice(0, 3)}/${t}.hgt.gz`;
    console.log('Bajando ' + url);
    const res = await fetch(url); if (!res.ok) throw new Error('HTTP ' + res.status);
    buf = Buffer.from(await res.arrayBuffer());
  }
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf);
  const n = Math.round(Math.sqrt(buf.length / 2));
  if (n * n * 2 !== buf.length || (n !== 1201 && n !== 3601)) throw new Error('Tile de tamaño inesperado: ' + buf.length + ' bytes');
  return { lat: tileLat(t), buf, n };
}
const T = [];
for (let i = 0; i < tiles.length; i++) T.push(await loadTile(tiles[i], process.argv[3 + i] ?? (i === 0 ? local : undefined)));
const n = T[0].n; if (T.some(t => t.n !== n)) throw new Error('Los tiles tienen resoluciones distintas');

// grilla del juego: celdas de 200 m sobre el tile completo (misma fórmula que physics/terrain.js#hgtToMap)
const cell = 200, kmx = 111.32 * Math.cos((lat0 + 0.5) * Math.PI / 180), kmy = 111;
const W = Math.round(kmx * 1000 / cell), H = Math.round(kmy * 1000 / cell);
const out = new Int16Array(W * H);
// grilla n×n de la ventana [lat0, lat0 + 1]: cada fila sale del tile que contiene su latitud
// (fila 0 = norte; en un tile, fila r = latitud lat + 1 − r/(n − 1))
const S = new Int16Array(n * n);
for (let r = 0; r < n; r++) {
  const la = lat0 + 1 - r / (n - 1);
  const t = T.find(q => la >= q.lat - 1e-9 && la <= q.lat + 1 + 1e-9); if (!t) throw new Error('Falta un tile para la latitud ' + la.toFixed(4));
  const tr = Math.round((t.lat + 1 - la) * (n - 1));
  for (let c = 0; c < n; c++) S[r * n + c] = t.buf.readInt16BE((tr * n + c) * 2);
}
const sample = (r, c) => { const v = S[r * n + c]; return v < -1000 ? null : v; };   // -32768 = hueco
const flat = new Uint8Array(n * n);
for (let r = 1; r < n - 1; r++) for (let c = 1; c < n - 1; c++) { const k = r * n + c, v = S[k]; if (v > -1000 && v <= WATER_MAX_M && S[k - 1] === v && S[k + 1] === v && S[k - n] === v && S[k + n] === v) flat[k] = 1; }
const water = new Uint8Array(Math.ceil(W * H / 8));
let nWater = 0;
for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
  const r0 = Math.floor(i / H * (n - 1)), r1 = Math.max(r0, Math.floor((i + 1) / H * (n - 1)) - 1);
  const c0 = Math.floor(j / W * (n - 1)), c1 = Math.max(c0, Math.floor((j + 1) / W * (n - 1)) - 1);
  let s = 0, k = 0, f = 0, t = 0;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const v = sample(r, c); t++; f += flat[r * n + c]; if (v !== null) { s += v; k++; } }
  if (f / t >= WATER_FRACTION) { const q = i * W + j; water[q >> 3] |= 1 << (q & 7); nWater++; }
  const v = k ? Math.round(s / k) : 0;
  out[i * W + j] = v <= 0 ? -5 : v;
}
const dlat = 1 / H, dlon = 1 / W, cellKm = cell / 1000;
const places = M.places.map(([nm, la, lo]) => [nm, +(((lo - lon0) / dlon) * cellKm).toFixed(1), +(((lat0 + 1 - la) / dlat) * cellKm).toFixed(1)]);
const b64 = Buffer.from(out.buffer).toString('base64');
let mn = 1e9, mx = -1e9; for (const v of out) { if (v < mn) mn = v; if (v > mx) mx = v; }

const js = `// ARCHIVO GENERADO por scripts/gen-terrain.mjs (no editar a mano): relieve de "${M.name}".
// Grilla de ${W}×${H} celdas de ${cell} m (enteros de 16 bits con signo, little-endian, en metros;
// negativos = mar). Se decodifica con decodeB64() (physics/terrain.js).
// Fuente: ${tiles.length > 1 ? 'tiles' : 'tile'} SRTM ${tiles.join(' + ')}${M.latS != null ? ' (ventana ' + lat0 + '–' + (lat0 + 1) + '° N)' : ''} (NASA, dominio público) vía Terrain Tiles de Mapzen/AWS (formato skadi),
// promediado a celdas de ${cell} m. Elevación ${mn}–${mx} m. Ver docs/DATOS-Y-FUENTES.md §6.
// water: máscara de ríos y lagos (1 bit por celda, en el orden de la grilla) solo para el dibujo.
export default {
  name: ${JSON.stringify(M.name)},
  W: ${W},
  H: ${H},
  cell: ${cell},
  latN: ${lat0 + 1},
  lonW: ${lon0},
  dlat: ${dlat},
  dlon: ${dlon},
  // [nombre, x km, y km] desde la esquina noroeste
  places: [
${places.map(p => '    ' + JSON.stringify(p)).join(',\n')}
  ],
  b64: "${b64}",
  water: "${Buffer.from(water).toString('base64')}"
};
`;
await writeFile(join(root, 'src/data/terrain', key + '.js'), js);
console.log(`src/data/terrain/${key}.js: ${W}×${H}, ${mn}–${mx} m, agua ${(100 * nWater / (W * H)).toFixed(1)}%, ${(js.length / 1024).toFixed(0)} KB`);
