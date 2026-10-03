// Genera docs/CATALOGO.md a partir de los datos del juego (src/data): cada arma, defensa y sistema de
// guerra electrónica con sus parámetros, rango de incertidumbre, confianza, razonamiento y fuentes.
//
//   npm run docs
//
// No lo edites a mano: se regenera y la CI verifica que esté al día.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { THREATS, DEFENSES, JAMMERS, UNC, PL, OBS, CAL, SRC_REF, CLS_NAME, BANDS, TARGET_TYPES } from '../src/data/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await (await import('node:fs/promises')).readFile(join(root, 'package.json'), 'utf8'));
const md = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const num = (v, unit) => v == null ? '—' : unit === 'M US$' ? (v >= 1 ? 'US$' + v + ' M' : 'US$' + Math.round(v * 1000) + 'k') : (Math.abs(v) >= 1e5 ? v.toExponential(0) : (+v.toPrecision(4)).toLocaleString('es-AR'));
const link = s => s[1] ? `[${md(s[0])}](${s[1]})` : md(s[0]);

function uncTable(kind, k) {
  const P = UNC[kind]?.[k]; if (!P) return '_Sin parámetros con rango._\n';
  const used = [], ref = id => { let i = used.indexOf(id); if (i < 0) { used.push(id); i = used.length - 1; } return i + 1; };
  let out = '| Parámetro | Mín | Probable | Máx | Confianza | Fuentes | Razonamiento |\n|---|---:|---:|---:|---|---|---|\n';
  for (const [path, u] of Object.entries(P)) {
    const [lab, unit] = PL[path] || [path, ''];
    out += `| ${md(lab)}${unit && unit !== 'M US$' ? ' (' + md(unit) + ')' : ''} | ${num(u.min, unit)} | **${num(u.p, unit)}** | ${num(u.max, unit)} | ${u.c} | ${u.src.map(s => '[' + ref(s) + ']').join(' ') || '—'} | ${md(u.nota) || '—'} |\n`;
  }
  if (used.length) out += '\n' + used.map((id, i) => `${i + 1}. ${link(SRC_REF(id))}`).join('\n') + '\n';
  return out;
}

let doc = `# Catálogo de Cielo Cerrado (v${pkg.version})

> **Archivo generado** por \`scripts/gen-catalog-doc.mjs\` a partir de \`src/data/\`. No lo edites a mano: cambiá los datos y corré \`npm run docs\`.

Cada parámetro numérico relevante tiene un **rango** (mínimo, probable, máximo), un nivel de **confianza** y su **razonamiento** con fuentes. La simulación usa el valor *probable*; el mínimo y el máximo quedan para el modo Monte Carlo. "est" significa estimación propia (física o sistemas análogos) cuando no hay un dato público directo. La metodología completa está en [DATOS-Y-FUENTES.md](DATOS-Y-FUENTES.md).

**Confianza:** *alta* = varias fuentes independientes concuerdan · *media* = una fuente seria o varias de un mismo bando · *baja* = fabricante, propaganda sin contraste o estimación propia.

## Índice

- [Amenazas](#amenazas): ${Object.values(THREATS).map(t => t.short).join(', ')}
- [Defensas y sensores](#defensas-y-sensores): ${Object.values(DEFENSES).map(d => d.short).join(', ')}
- [Guerra electrónica](#guerra-electrónica): ${Object.values(JAMMERS).map(j => j.short).join(', ')}
- [Bandas](#bandas) · [Objetivos](#objetivos) · [Calibración de Pk](#calibración-de-pk)

## Amenazas
`;

for (const [k, t] of Object.entries(THREATS)) {
  doc += `\n### ${t.name}\n\n\`${k}\` · ${t.side === 'RU' ? 'Rusia' : 'Ucrania / OTAN'} · ${CLS_NAME[t.cls]} · perfil \`${t.prof}\`\n\n${md(t.profile)}\n\n`;
  doc += `- **Guiado:** ${md(t.guidance)}\n- **Propulsión:** ${md(t.engine)}\n- **Ojiva:** ${md(t.warhead)}\n- **Alcance:** ${md(t.range)}\n- **Costo:** ${md(t.costNote)}\n`;
  if (t.navFix || t.seekerKm) doc += `- **Sin GNSS:** ${t.navFix ? 'descarta el engaño con ' + md(t.navFix) : 'sin corrección independiente del satélite'}${t.seekerKm ? '; su buscador terminal corrige errores de hasta ' + t.seekerKm + ' km' : ''}\n`;
  if (t.aglRange) doc += `- **Altura de vuelo:** típica ${t.agl} m, límites reales ${t.aglRange[0]}–${t.aglRange[1]} m${t.aglModes ? ' · perfiles: ' + t.aglModes.map(([n, h]) => `${md(n)} ${h} m`).join(', ') : ''}. ${md(t.aglNote)}\n`;
  doc += '\n';
  doc += t.notes.map(n => `- ${md(n)}`).join('\n') + '\n\n#### Parámetros\n\n' + uncTable('thr', k);
  if (OBS[k]?.length) doc += `\n#### Tasas de intercepción reportadas\n\n| Período | Lanzados | Derribados | Tasa | Nota | Fuente |\n|---|---:|---:|---|---|---|\n` + OBS[k].map(o => `| ${md(o[0])} | ${o[1] ?? '—'} | ${o[2] ?? '—'} | ${md(o[3])} | ${md(o[5])} | ${link(SRC_REF(o[4]))} |`).join('\n') + '\n';
  doc += `\n#### Fuentes generales\n\n${t.sources.map(s => '- ' + link(s)).join('\n')}\n`;
}

doc += '\n## Defensas y sensores\n';
for (const [k, d] of Object.entries(DEFENSES)) {
  doc += `\n### ${d.name}\n\n\`${k}\` · ${d.side === 'RU' ? 'Rusia' : d.side === 'UA' ? 'Ucrania / OTAN' : 'ambos bandos'} · tipo \`${d.kind}\`\n\n`;
  if (d.range) doc += `${md(d.range)}${d.interceptor ? ' · ' + md(d.interceptor) : ''}\n\n`;
  if (d.radar) doc += `- **Sensor:** ${md(d.radar.name)}, ${BANDS[d.radar.band].name}, ${d.radar.R1} km contra 1 m², sector ${d.radar.sector}°, refresco ${d.radar.scan} s, ECCM ${d.radar.eccm >= 99 ? 'inmune' : d.radar.eccm + ' dB'}\n`;
  if (d.radar?.mastRange) { const [lo, hi] = d.radar.mastRange; doc += `- **Altura de antena:** ${lo === hi ? lo + ' m, fija' : d.radar.mast + ' m por defecto, regulable ' + lo + '–' + hi + ' m'}. ${md(d.radar.mastNote)}\n`; }
  if (d.sam) doc += `- **Arma:** ${md(d.sam.shot)}, guiado ${d.sam.guid}, ${d.sam.minR}–${d.sam.maxR} km (balísticos: ${d.sam.maxRtbm || '—'} km), ${d.sam.altMin} m–${d.sam.altMax / 1000} km, ${d.sam.ch} canales, ${d.sam.mag} disparos, Pk base ${Object.entries(d.sam.pk).map(([c, v]) => c + ' ' + v).join(' · ')}\n`;
  doc += '\n' + d.notes.map(n => `- ${md(n)}`).join('\n') + '\n\n#### Parámetros\n\n' + uncTable('def', k) + `\n#### Fuentes generales\n\n${d.sources.map(s => '- ' + link(s)).join('\n')}\n`;
}

doc += '\n## Guerra electrónica\n\nEl efecto depende del **rol**: los interferidores de radar degradan los radares de la defensa; los anti-GNSS desvían las armas del atacante.\n';
for (const [k, j] of Object.entries(JAMMERS)) {
  doc += `\n### ${j.name}\n\n\`${k}\` · ${j.side === 'RU' ? 'Rusia' : j.side === 'UA' ? 'Ucrania / aliados' : 'ambos'} · ${j.gnssJam ? (j.spoofKm ? 'engaño GNSS' : 'supresión GNSS') + ', radio ' + j.radius + ' km' : 'ruido contra radares en ' + j.bands.join('/') + ', potencia relativa ' + j.P.toExponential(0)}\n\n`;
  doc += j.notes.map(n => `- ${md(n)}`).join('\n') + '\n\n#### Parámetros\n\n' + uncTable('jam', k) + `\n#### Fuentes generales\n\n${j.sources.map(s => '- ' + link(s)).join('\n')}\n`;
}

doc += `\n## Bandas\n\n| Banda | Frecuencia | Ancho de haz | Cómo cambia la RCS en el motor |\n|---|---|---|---|\n${Object.values(BANDS).map(b => `| ${md(b.name)} | ${md(b.freq)} | ${b.bw >= 360 ? '—' : b.bw + '°'} | ${md(b.rcsWhy)} |`).join('\n')}\n`;
doc += `\n## Objetivos\n\nParámetros de juego (sin fuente): vida, huella y vulnerabilidad relativa.\n\n| Tipo | Vida | Huella | Vulnerabilidad | Descripción |\n|---|---:|---:|---:|---|\n${Object.values(TARGET_TYPES).map(t => `| ${md(t.name)} | ${t.hp} | ${t.radius} m | ×${t.vuln} | ${md(t.desc)} |`).join('\n')}\n`;
doc += `\n## Calibración de Pk\n\nCasos corridos con el motor (Monte Carlo) para ajustar las Pk contra episodios reales. Ver la ventana "Calibración de Pk" del juego para el método.\n\n| Caso | Dato real | Objetivo | Simulado | Con Pk mín–máx |\n|---|---|---|---:|---|\n${CAL.map(c => `| ${md(c.caso)} | ${md(c.real)} | ${md(c.obj)} | ${Math.round(c.sim * 100)}% | ${Math.round(c.lo * 100)}–${Math.round(c.hi * 100)}% |`).join('\n')}\n`;

const out = join(root, 'docs', 'CATALOGO.md');
await writeFile(out, doc);
console.log(`docs/CATALOGO.md generado (${(doc.length / 1024).toFixed(0)} KB)`);
