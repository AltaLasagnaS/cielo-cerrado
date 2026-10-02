'use strict';
// ---------------- ESCENARIOS ----------------
const SCEN = {
  mb_noche: { map: 'monterey', name: 'Monterey · noche de ataque combinado (defensa ucraniana)', build() {
    const d = (type, x, y, o = {}) => addDef(type, x, y, o);
    d('ewr', 85.4, 53.2, { name: 'Radar 3D (cerro Gabilan)' });
    d('p18', 70, 40, { name: 'Radar VHF' });
    d('patriot', 58, 58, { az: 320, name: 'Patriot-1' });
    d('irist', 44, 67, { name: 'IRIS-T-1' });
    d('nasams', 56, 62, { name: 'NASAMS-1' });
    d('gepard', 40, 62, { name: 'Gepard-1' }); d('gepard', 64, 57, { name: 'Gepard-2' });
    d('mfg', 52, 47, { name: 'Grupo móvil 1' }); d('mfg', 66, 62, { name: 'Grupo móvil 2' }); d('mfg', 47, 64, { name: 'Grupo móvil 3' });
    d('acoustic', 50, 50, { name: 'Acústico 1' }); d('acoustic', 60, 52, { name: 'Acústico 2' }); d('acoustic', 44, 61, { name: 'Acústico 3' });
    d('intdrone', 60, 54, { name: 'Interceptores-1' });
    addSalvo({ type: 'shahed', count: 14, interval: 25, tStart: 0, agl: 800, pts: [[2, 28], [34, 44], [63.5, 55.8]] });
    addSalvo({ type: 'gerbera', count: 8, interval: 30, tStart: 60, agl: 900, pts: [[2, 36], [36, 50], [62, 56]] });
    addSalvo({ type: 'shahed', count: 6, interval: 40, tStart: 200, agl: 2200, pts: [[88, 108], [70, 70], [63.5, 55.8]] });
    addSalvo({ type: 'kh101', count: 4, interval: 15, sync: true, tArrive: 1500, agl: 40, pts: [[88, 110], [80, 85], [73, 70], [63.5, 55.8]] });
    addSalvo({ type: 'kalibr', count: 3, interval: 10, sync: true, tArrive: 1480, agl: 25, pts: [[0, 75], [30, 70], [42.2, 64.3]] });
    addSalvo({ type: 'isk_m', count: 2, interval: 20, sync: true, tArrive: 1530, launchDist: 300, maneuver: true, decoys: true, pts: [[60, 0], [58.2, 58]], targetUnit: 'Patriot-1' });
    addJam('soj', 4, 18, { alt: 8000 });
  } },
  gb_ruso: { map: 'goteborg', name: 'Gotemburgo · ataque ucraniano contra base con defensa rusa', build() {
    const d = (type, x, y, o = {}) => addDef(type, x, y, o);
    d('s400', 52, 28, { az: 240, name: 'S-400' });
    d('pantsir', 54, 30, { name: 'Pantsir-1' }); d('pantsir', 55, 22, { name: 'Pantsir-2' });
    d('tor', 56, 38, { name: 'Tor-M2' }); d('buk', 48, 20, { name: 'Buk-M1' });
    d('p18', 58, 14, { name: 'Radar VHF' });
    addSalvo({ type: 'storm', count: 6, interval: 6, sync: true, tArrive: 1480, agl: 35, pts: [[0, 60], [30, 46], [44, 38], [57.8, 32.5]] });
    addSalvo({ type: 'neptune', count: 2, interval: 10, sync: true, tArrive: 1485, agl: 12, pts: [[0, 20], [36, 30], [52.5, 28]], targetUnit: 'S-400' });
    addSalvo({ type: 'lyutyi', count: 16, interval: 6, sync: true, tArrive: 1440, agl: 200, pts: [[40, 110.8], [50, 70], [57.8, 32.5]] });
    addSalvo({ type: 'atacms', count: 4, interval: 6, sync: true, tArrive: 1490, launchDist: 220, pts: [[40, 111], [52.2, 28]], targetUnit: 'S-400' });
    addJam('gnss', 56, 30, {});
  } },
  mb_vacio: { map: 'monterey', name: 'Monterey · vacío', build() {} },
  gb_vacio: { map: 'goteborg', name: 'Gotemburgo · vacío', build() {} }
};
function addDef(type, x, y, o = {}) {
  const d = DEFENSES[type];
  const u = { id: uid++, type, x, y, az: o.az ?? defaultAz(x, y), mast: d.radar ? (d.kind === 'aew' ? 0 : d.radar.mast) : 2, alt: d.alt, mag: d.sam ? d.sam.mag : 0, salvo: d.sam ? d.sam.salvo : 0, noDrones: d.sam ? !!d.sam.noDrones : false, name: o.name || nextName(type) };
  S.setup.defs.push(u); return u;
}
function nextName(type) { const n = S.setup.defs.filter(u => u.type === type).length + 1; return DEFENSES[type].short + '-' + n; }
function defaultAz(x, y) {
  const sv = S.setup.salvos[0]; if (sv) { const p = sv.pts[0]; return Math.round(azOf(p[0] - x, p[1] - y)); }
  return Math.round(azOf(-1, 0));
}
function addSalvo(o) {
  const T = THREATS[o.type];
  const sv = { id: uid++, type: o.type, count: o.count || 1, interval: o.interval ?? 20, tStart: o.tStart || 0, sync: !!o.sync, tArrive: o.tArrive || 0, agl: o.agl ?? T.agl, launchDist: o.launchDist ?? T.launchDist, maneuver: o.maneuver ?? T.maneuver, decoys: !!o.decoys, pts: o.pts, targetUnit: null };
  if (o.targetUnit) { const u = S.setup.defs.find(d => d.name === o.targetUnit); if (u) { sv.targetUnit = u.id; sv.pts[sv.pts.length - 1] = [u.x, u.y]; } }
  S.setup.salvos.push(sv); return sv;
}
function addJam(type, x, y, o = {}) { const J = JAMMERS[type]; const j = { id: uid++, type, x, y, alt: o.alt ?? J.alt, on: true }; S.setup.jams.push(j); return j; }
function loadScenario(key) {
  resetSim();
  const sc = SCEN[key]; if (MAP?.key !== sc.map) loadBuiltin(sc.map);
  S.setup = { defs: [], salvos: [], jams: [] }; S.sel = null; S.mode = 'select';
  sc.build(); renderAll(); schedCov();
}
