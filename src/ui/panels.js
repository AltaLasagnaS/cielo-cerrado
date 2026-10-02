'use strict';
// ---------------- PANELES ----------------
const sideOf = s => s === 'RU' ? 'ru' : s === 'both' ? '' : '';
function renderTabs() { renderDef(); renderAtkButtons(); renderEW(); }
function renderAll() { renderTabs(); renderAtk(); renderCat(); renderSel(); renderStats(); renderLog(); updatePlay(); }
document.querySelector('.tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; for (const x of document.querySelectorAll('.tabs button')) x.classList.toggle('act', x === b); for (const t of ['def', 'atk', 'ew', 'cat']) $('#tab-' + t).hidden = t !== b.dataset.tab; };

function unitBtn(key, def, act, cls) { return `<button class="ub ${cls} ${act ? 'act' : ''}" data-k="${key}" title="${esc(def.name)}"><span>${esc(def.short)}</span><i data-info="${key}" role="button" aria-label="Ficha">i</i></button>`; }
function renderDef() {
  const el = $('#tab-def');
  const grp = (title, filter) => { const ks = Object.keys(DEFENSES).filter(k => filter(DEFENSES[k])); return `<div class="grp"><h3>${title}</h3><div class="unitgrid">${ks.map(k => unitBtn(k, DEFENSES[k], S.mode === 'placeDef' && S.placeType === k, DEFENSES[k].side === 'RU' ? 'ru' : '')).join('')}</div></div>`; };
  el.innerHTML = `
    ${grp('Ucrania / OTAN', d => (d.side === 'UA' || d.side === 'both') && d.kind !== 'sensor' && d.kind !== 'aew' && d.kind !== 'acoustic')}
    ${grp('Rusia', d => d.side === 'RU' && d.kind !== 'aew')}
    ${grp('Sensores', d => ['sensor', 'aew', 'acoustic'].includes(d.kind))}
    <div class="grp"><h3>Mando y control</h3>
      <label class="check"><input type="checkbox" id="optNet" ${S.net ? 'checked' : ''}><span>Red integrada<br><span class="hint">Las pistas de cualquier sensor se comparten. Misiles activos/IR y drones interceptores pueden disparar con pista ajena, y se evita que dos baterías gasten misiles en el mismo blanco.</span></span></label>
      <div class="field"><label for="optDoc">Doctrina de tiro</label><select id="optDoc" class="sel"><option value="salva" ${S.doctrine === 'salva' ? 'selected' : ''}>Salva (según unidad)</option><option value="sls" ${S.doctrine === 'sls' ? 'selected' : ''}>Disparar-observar-disparar</option></select></div>
    </div>
    <div class="grp"><h3>Cobertura de radar</h3>
      <label class="check"><input type="checkbox" id="optCov" ${S.showCov ? 'checked' : ''}> Mostrar cobertura sobre el mapa</label>
      <div class="field"><label for="optRef">Contra</label><select id="optRef" class="sel">${Object.entries(THREATS).map(([k, t]) => `<option value="${k}" ${k === S.covRef ? 'selected' : ''}>${esc(t.short)} (RCS ${t.rcs} m²)</option>`).join('')}</select></div>
      <div class="field"><label for="optAgl">Altura del blanco sobre el terreno</label><span class="val" id="aglVal">${S.covAgl} m</span><input type="range" id="optAgl" min="10" max="10000" step="10" value="${S.covAgl}"></div>
      <p class="hint" id="covInfo"></p>
    </div>`;
  el.onclick = e => {
    const inf = e.target.closest('[data-info]'); if (inf) { e.stopPropagation(); openFicha('def', inf.dataset.info); return; }
    const b = e.target.closest('.ub'); if (!b) return; if (S.started) { toast('Reiniciá para editar el escenario.'); return; }
    if (S.mode === 'placeDef' && S.placeType === b.dataset.k) setMode('select'); else setMode('placeDef', b.dataset.k);
  };
  $('#optNet').onchange = e => { S.net = e.target.checked; };
  $('#optDoc').onchange = e => { S.doctrine = e.target.value; };
  $('#optCov').onchange = e => { S.showCov = e.target.checked; draw(); };
  $('#optRef').onchange = e => { S.covRef = e.target.value; const T = THREATS[S.covRef]; S.covAgl = T.agl ?? (T.prof === 'ballistic' ? 10000 : (T.prof === 'hilo' ? 15 : 5000)); $('#optAgl').value = S.covAgl; $('#aglVal').textContent = S.covAgl + ' m'; schedCov(); };
  $('#optAgl').oninput = e => { S.covAgl = +e.target.value; $('#aglVal').textContent = S.covAgl + ' m'; schedCov(); };
  renderCovInfo();
}
function renderCovInfo() { const el = $('#covInfo'); if (!el) return; const T = THREATS[S.covRef]; el.innerHTML = `Turquesa: al menos un sensor ve un <b>${esc(T.short)}</b> a <b>${S.covAgl} m</b> sobre el terreno (más intenso = 2+ sensores). Oscuro: hueco de cobertura. ${S.covStat ? 'Cubierto: <b>' + S.covStat.pct + '%</b> del mapa.' : ''}`; }

function renderAtkButtons() {}
function renderAtk() {
  const el = $('#tab-atk');
  if (!S.atk) S.atk = defaultAtk('shahed');
  const a = S.atk, T = THREATS[a.type];
  const off = ['ballistic', 'highdive', 'hilo'].includes(T.prof);
  const opts = side => Object.entries(THREATS).filter(([, t]) => t.side === side).map(([k, t]) => `<option value="${k}" ${k === a.type ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  el.innerHTML = `
    <div class="grp"><h3>Nueva salva</h3>
      <div class="row"><select id="aType" class="sel" style="flex:1;min-width:0"><optgroup label="Rusia">${opts('RU')}</optgroup><optgroup label="Ucrania / OTAN">${opts('UA')}</optgroup></select><button class="btn sm" id="aInfo">Ficha</button></div>
      <p class="hint">${esc(CLS_NAME[T.cls])} · ${kmh(T.v)} (${mach(T.v)}) · RCS ≈${T.rcs} m² · ${money(T.cost)} c/u</p>
      <div class="field"><label for="aCount">Cantidad</label><input id="aCount" class="inp" type="number" min="1" max="60" value="${a.count}"></div>
      <div class="field"><label for="aInt">Intervalo entre lanzamientos (s)</label><input id="aInt" class="inp" type="number" min="0" max="600" value="${a.interval}"></div>
      <label class="check"><input type="checkbox" id="aSync" ${a.sync ? 'checked' : ''}> Sincronizar llegada (en vez de hora de lanzamiento)</label>
      <div class="field"><label for="aTime">${a.sync ? 'Llegada del primero en T+ (s)' : 'Lanzamiento en T+ (s)'}</label><input id="aTime" class="inp" type="number" min="0" max="7200" value="${a.sync ? a.tArrive : a.tStart}"></div>
      ${T.aglRange ? `<div class="field"><label for="aAgl">Altura de vuelo sobre el terreno</label><span class="val" id="aAglV">${a.agl} m</span><input id="aAgl" type="range" min="${T.aglRange[0]}" max="${T.aglRange[1]}" step="5" value="${a.agl}"></div>` : ''}
      ${off ? `<div class="field"><label for="aDist">Distancia real de lanzamiento (km)</label><input id="aDist" class="inp" type="number" min="60" max="1500" value="${a.launchDist}"></div>` : ''}
      ${T.maneuver || T.prof === 'ballistic' || T.cls === 'crucero' ? `<label class="check"><input type="checkbox" id="aMan" ${a.maneuver ? 'checked' : ''}> Maniobra evasiva terminal</label>` : ''}
      ${T.decoys ? `<label class="check"><input type="checkbox" id="aDec" ${a.decoys ? 'checked' : ''}> Liberar ${T.decoys} señuelos en fase terminal</label>` : ''}
      <button class="btn pri" id="aRoute">${S.mode === 'route' ? 'Trazando…' : 'Trazar ruta en el mapa'}</button>
      <p class="hint">${off ? 'Tocá un punto en la dirección desde donde viene y después el blanco. Se lanza a la distancia indicada, fuera del mapa.' : 'Tocá el punto de entrada, los waypoints (usá valles para esconderte del radar) y el blanco. Si el último punto cae sobre una unidad de defensa, la apunta.'}</p>
    </div>
    <div class="grp"><h3>Salvas programadas (${S.setup.salvos.length})</h3><div class="list" id="svList">${S.setup.salvos.map(sv => { const t = THREATS[sv.type]; const tgt = sv.targetUnit ? S.setup.defs.find(u => u.id === sv.targetUnit) : null; return `<div class="item red"><span class="t">${sv.count}× ${esc(t.short)}${tgt ? ' → ' + esc(tgt.name) : ''}</span><span class="s">${sv.sync ? 'llega T+' + sv.tArrive + 's' : 'sale T+' + sv.tStart + 's'} · c/${sv.interval}s</span><span class="a"><button class="btn sm" data-sel="${sv.id}">Ver</button><button class="btn sm danger" data-del="${sv.id}" aria-label="Borrar">✕</button></span></div>`; }).join('') || '<p class="hint">Todavía no hay ataques.</p>'}</div></div>`;
  $('#aType').onchange = e => { S.atk = defaultAtk(e.target.value, S.atk); renderAtk(); };
  $('#aInfo').onclick = () => openFicha('thr', a.type);
  const num = (id, k) => { const i = $(id); if (i) i.onchange = e => { a[k] = +e.target.value; }; };
  num('#aCount', 'count'); num('#aInt', 'interval'); num('#aDist', 'launchDist');
  $('#aTime').onchange = e => { if (a.sync) a.tArrive = +e.target.value; else a.tStart = +e.target.value; };
  $('#aSync').onchange = e => { a.sync = e.target.checked; renderAtk(); };
  if ($('#aAgl')) $('#aAgl').oninput = e => { a.agl = +e.target.value; $('#aAglV').textContent = a.agl + ' m'; };
  if ($('#aMan')) $('#aMan').onchange = e => { a.maneuver = e.target.checked; };
  if ($('#aDec')) $('#aDec').onchange = e => { a.decoys = e.target.checked; };
  $('#aRoute').onclick = () => { if (S.started) { toast('Reiniciá para editar el escenario.'); return; } S.route = { pts: [], targetUnit: null }; S.mode = 'route'; updateModebar(); renderAtk(); };
  $('#svList').onclick = e => {
    const d = e.target.closest('[data-del]'), s = e.target.closest('[data-sel]');
    if (d) { if (S.started) { toast('Reiniciá para editar.'); return; } S.setup.salvos = S.setup.salvos.filter(v => v.id != d.dataset.del); if (S.sel && S.sel.id == d.dataset.del) S.sel = null; renderAtk(); renderSel(); }
    if (s) { S.sel = { kind: 'salvo', id: +s.dataset.sel }; renderSel(); }
  };
}
function defaultAtk(type, prev) { const T = THREATS[type]; return { type, count: prev ? prev.count : (T.cls === 'dron' ? 8 : 2), interval: T.cls === 'dron' ? 20 : 10, tStart: 0, sync: prev ? prev.sync : false, tArrive: prev ? prev.tArrive : 900, agl: T.agl ?? 0, launchDist: T.launchDist, maneuver: !!T.maneuver, decoys: !!T.decoys }; }

function renderEW() {
  const el = $('#tab-ew');
  el.innerHTML = `
    <div class="grp"><h3>Interferidores y contramedidas</h3><div class="unitgrid">${Object.entries(JAMMERS).map(([k, j]) => `<button class="ub ew ${S.mode === 'placeJam' && S.placeType === k ? 'act' : ''}" data-k="${k}" title="${esc(j.name)}"><span>${esc(j.short)}</span><i data-info="${k}" role="button" aria-label="Ficha">i</i></button>`).join('')}</div></div>
    <label class="check"><input type="checkbox" id="optStr" ${S.strobes ? 'checked' : ''}> Mostrar "strobes" de interferencia (líneas violeta radar → jammer)</label>
    <div class="grp"><h3>Desplegados</h3><div class="list" id="jList">${S.setup.jams.map(j => `<div class="item vio"><span class="t">${esc(JAMMERS[j.type].name)}</span><span class="s">${j.x.toFixed(1)}, ${j.y.toFixed(1)} km${JAMMERS[j.type].air ? ' · ' + j.alt + ' m' : ''}</span><span class="a"><button class="btn sm ${j.on ? 'on' : ''}" data-tog="${j.id}">${j.on ? 'Activo' : 'Apagado'}</button><button class="btn sm danger" data-del="${j.id}" aria-label="Borrar">✕</button></span></div>`).join('') || '<p class="hint">Ninguno.</p>'}</div></div>
    <div class="grp"><h3>Modelo</h3><p class="hint">Jammer de ruido: reduce el alcance de detección como <b>R' = R·(1/(1+J/N))<sup>¼</sup></b>. J/N cae con la distancia al cuadrado, solo afecta radares de la misma banda, necesita línea de vista y es ~25 dB más débil fuera del lóbulo principal. Cada radar tiene un margen ECCM (dB) en su ficha. El anti-GNSS no toca radares: desvía armas que navegan por satélite.</p></div>`;
  el.onclick = e => {
    const inf = e.target.closest('[data-info]'); if (inf) { e.stopPropagation(); openFicha('jam', inf.dataset.info); return; }
    const t = e.target.closest('[data-tog]'); if (t) { const j = S.setup.jams.find(v => v.id == t.dataset.tog); j.on = !j.on; if (S.started) { const jl = S.jamsLive.find(v => v.id == j.id); if (jl) jl.on = j.on; } renderEW(); schedCov(); return; }
    const d = e.target.closest('[data-del]'); if (d) { if (S.started) { toast('Reiniciá para editar.'); return; } S.setup.jams = S.setup.jams.filter(v => v.id != d.dataset.del); renderEW(); schedCov(); return; }
    const b = e.target.closest('.ub'); if (!b) return; if (S.started) { toast('Reiniciá para editar el escenario.'); return; }
    if (S.mode === 'placeJam' && S.placeType === b.dataset.k) setMode('select'); else setMode('placeJam', b.dataset.k);
  };
  $('#optStr').onchange = e => { S.strobes = e.target.checked; };
}

function renderCat() {
  const el = $('#tab-cat');
  const row = (kind, k, o, extra) => `<div class="item ${kind === 'thr' ? 'red' : kind === 'jam' ? 'vio' : ''}" style="cursor:pointer" data-f="${kind}:${k}"><span class="t">${esc(o.name)}</span><span class="s">${extra}</span><span class="a"><span class="chip ${o.side === 'RU' ? 'ru' : o.side === 'UA' ? 'ua' : ''}">${o.side === 'RU' ? 'RU' : o.side === 'UA' ? 'UA' : 'ambos'}</span></span></div>`;
  el.innerHTML = `
    <div class="row"><button class="btn" id="cmpT">Comparar amenazas</button><button class="btn" id="cmpD">Comparar defensas</button><button class="btn" id="calB">Calibración de Pk</button></div>
    <p class="hint">Cada ficha tiene una sección <b>Confianza de los datos</b> con rangos mín/probable/máx y fuentes. Revisión OSINT: octubre 2026.</p>
    <div class="grp"><h3>Amenazas</h3><div class="list">${Object.entries(THREATS).map(([k, t]) => row('thr', k, t, kmh(t.v) + ' · RCS ' + t.rcs + ' m²')).join('')}</div></div>
    <div class="grp"><h3>Defensas y sensores</h3><div class="list">${Object.entries(DEFENSES).map(([k, d]) => row('def', k, d, d.sam ? d.sam.maxR + ' km · ' + d.sam.guid : (d.radar ? 'banda ' + d.radar.band : ''))).join('')}</div></div>
    <div class="grp"><h3>Guerra electrónica</h3><div class="list">${Object.entries(JAMMERS).map(([k, j]) => row('jam', k, j, j.gnssJam ? 'GNSS · ' + j.radius + ' km' : 'bandas ' + j.bands.join('/'))).join('')}</div></div>`;
  el.onclick = e => { const f = e.target.closest('[data-f]'); if (f) { const [kind, k] = f.dataset.f.split(':'); openFicha(kind, k); } };
  $('#cmpT').onclick = cmpThreats; $('#cmpD').onclick = cmpDefs; $('#calB').onclick = openCal;
}

function renderSel(live) {
  const el = $('#selCard'); const sel = S.sel;
  if (!sel) { el.innerHTML = '<h3>Selección</h3><p class="hint">Tocá una unidad, jammer o ruta en el mapa para ver y ajustar sus parámetros. Arrastrá unidades para moverlas (antes de iniciar).</p>'; return; }
  if (live && document.activeElement && el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  if (sel.kind === 'def') {
    const u = (S.started ? S.units : S.setup.defs).find(v => v.id === sel.id); if (!u) { S.sel = null; return renderSel(); }
    const d = D(u), r = d.radar; const ll = latlon(u.x, u.y); const ed = !S.started;
    const ground = Math.round(surf(u.x, u.y));
    let html = `<h3>Selección</h3><div class="row" style="justify-content:space-between"><b style="font-size:15px">${esc(u.name)}</b><span class="chip ${d.side === 'RU' ? 'ru' : 'ua'}">${esc(d.short)}</span></div>
      <dl class="kv"><dt>Posición</dt><dd>${u.x.toFixed(1)}, ${u.y.toFixed(1)} km</dd><dt>Lat/Lon</dt><dd>${ll[0].toFixed(3)}°, ${ll[1].toFixed(3)}°</dd><dt>Terreno</dt><dd>${ground} m</dd>`;
    if (r && r.band !== 'ACU') { const hr = antZ(u) - (d.kind === 'aew' ? 0 : ground); const hor = 4.12 * (Math.sqrt(antZ(u) - (d.kind === 'aew' ? 0 : ground)) + Math.sqrt(50)); html += `<dt>Radar</dt><dd>${esc(r.name)} · ${r.band}</dd><dt>Horizonte vs blanco a 50 m</dt><dd>${hor.toFixed(0)} km</dd>`; }
    if (d.sam) html += `<dt>Alcance</dt><dd>${d.sam.maxR} km${d.sam.maxRtbm ? ' (TBM ' + d.sam.maxRtbm + ')' : ''}</dd><dt>Guiado</dt><dd>${d.sam.guid}</dd>`;
    if (S.started && d.sam) html += `<dt>Munición</dt><dd>${u.magLeft}/${u.mag}</dd><dt>En vuelo</dt><dd>${u.active}/${d.sam.ch}</dd>`;
    if (S.started) html += `<dt>Estado</dt><dd style="color:${u.alive ? 'var(--ok)' : 'var(--red)'}">${u.alive ? 'Operativa' : 'Destruida'}</dd>`;
    html += '</dl>';
    if (ed) {
      if (r && d.kind !== 'aew' && r.band !== 'ACU' && r.band !== 'OPT') html += `<div class="field"><label for="sMast">Altura de antena / mástil</label><span class="val">${u.mast} m</span><input id="sMast" type="range" min="2" max="40" value="${u.mast}"></div>`;
      if (d.kind === 'aew') html += `<div class="field"><label for="sAlt">Altitud de vuelo</label><span class="val">${u.alt} m</span><input id="sAlt" type="range" min="2000" max="11000" step="250" value="${u.alt}"></div>`;
      if (r && (r.sector < 360)) html += `<div class="field"><label for="sAz">${r.side ? 'Rumbo de vuelo' : 'Orientación del sector'}</label><span class="val">${u.az}°</span><input id="sAz" type="range" min="0" max="359" value="${u.az}"></div>`;
      if (d.sam) html += `<label class="check"><input type="checkbox" id="sNoD" ${u.noDrones ? 'checked' : ''}> No gastar en drones (reservar para misiles)</label><div class="field"><label for="sMag">Munición disponible</label><input id="sMag" class="inp" type="number" min="1" max="200" value="${u.mag}"></div><div class="field"><label for="sSal">Interceptores por blanco</label><input id="sSal" class="inp" type="number" min="1" max="4" value="${u.salvo}"></div>`;
    }
    html += `<div class="row"><button class="btn sm" id="sInfo">Ficha</button>${ed ? '<button class="btn sm danger" id="sDel">Eliminar</button>' : ''}</div>`;
    el.innerHTML = html;
    $('#sInfo').onclick = () => openFicha('def', u.type);
    if (ed) {
      const bind = (id, k, cov) => { const i = $(id); if (!i) return; i.oninput = e => { u[k] = +e.target.value; const v = i.parentElement.querySelector('.val'); if (v) v.textContent = u[k] + (k === 'az' ? '°' : ' m'); if (cov) schedCov(); }; };
      bind('#sMast', 'mast', 1); bind('#sAlt', 'alt', 1); bind('#sAz', 'az', 1); bind('#sMag', 'mag'); bind('#sSal', 'salvo');
      if ($('#sNoD')) $('#sNoD').onchange = e => { u.noDrones = e.target.checked; };
      $('#sDel').onclick = () => { S.setup.defs = S.setup.defs.filter(v => v.id !== u.id); S.sel = null; renderSel(); schedCov(); };
    }
  } else if (sel.kind === 'jam') {
    const j = (S.started ? S.jamsLive : S.setup.jams).find(v => v.id === sel.id); if (!j) { S.sel = null; return renderSel(); }
    const J = JAMMERS[j.type];
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${esc(J.name)}</b><dl class="kv"><dt>Posición</dt><dd>${j.x.toFixed(1)}, ${j.y.toFixed(1)} km</dd>${J.bands ? '<dt>Bandas</dt><dd>' + J.bands.join(', ') + '</dd>' : '<dt>Radio</dt><dd>' + J.radius + ' km</dd>'}</dl>
      ${J.air && !S.started ? `<div class="field"><label for="jAlt">Altitud</label><span class="val">${j.alt} m</span><input id="jAlt" type="range" min="1000" max="12000" step="250" value="${j.alt}"></div>` : ''}
      <div class="row"><button class="btn sm" id="jInfo">Ficha</button>${!S.started ? '<button class="btn sm danger" id="jDel">Eliminar</button>' : ''}</div>`;
    $('#jInfo').onclick = () => openFicha('jam', j.type);
    if ($('#jAlt')) $('#jAlt').oninput = e => { j.alt = +e.target.value; j._losMap = {}; e.target.parentElement.querySelector('.val').textContent = j.alt + ' m'; schedCov(); };
    if ($('#jDel')) $('#jDel').onclick = () => { S.setup.jams = S.setup.jams.filter(v => v.id !== j.id); S.sel = null; renderSel(); renderEW(); schedCov(); };
  } else if (sel.kind === 'salvo') {
    const sv = S.setup.salvos.find(v => v.id === sel.id); if (!sv) { S.sel = null; return renderSel(); }
    const T = THREATS[sv.type]; const probe = buildThreat(sv, 0, 0); uid--;
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${sv.count}× ${esc(T.name)}</b><dl class="kv"><dt>Recorrido</dt><dd>${probe.L.toFixed(0)} km</dd><dt>Tiempo de vuelo</dt><dd>${fmtT(probe.ft).slice(2)}</dd><dt>${sv.sync ? 'Llegada' : 'Lanzamiento'}</dt><dd>T+${sv.sync ? sv.tArrive : sv.tStart} s</dd>${T.aglRange ? '<dt>Altura</dt><dd>' + sv.agl + ' m AGL</dd>' : ''}<dt>Maniobra</dt><dd>${sv.maneuver ? 'sí' : 'no'}</dd><dt>Costo salva</dt><dd>${money(T.cost * sv.count)}</dd></dl>
      <div class="row"><button class="btn sm" id="vInfo">Ficha</button>${!S.started ? '<button class="btn sm danger" id="vDel">Eliminar</button>' : ''}</div>`;
    $('#vInfo').onclick = () => openFicha('thr', sv.type);
    if ($('#vDel')) $('#vDel').onclick = () => { S.setup.salvos = S.setup.salvos.filter(v => v.id !== sv.id); S.sel = null; renderSel(); renderAtk(); };
  } else if (sel.kind === 'thr') {
    const th = S.threats.find(t => t.id === sel.id); if (!th || !th.p) { el.innerHTML = '<h3>Selección</h3><p class="hint">La amenaza ya no está en vuelo.</p>'; return; }
    const p = th.p, v = speedAt(th, S.t);
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${esc(label(th))}</b><dl class="kv"><dt>Altitud</dt><dd>${Math.round(p.z)} m (${Math.round(p.z - surf(p.x, p.y))} AGL)</dd><dt>Velocidad</dt><dd>${kmh(v)}</dd><dt>Al blanco</dt><dd>${p.rem.toFixed(1)} km</dd><dt>Primera detección</dt><dd>${th.firstDet === null ? '—' : fmtT(th.firstDet)}</dd></dl><div class="row"><button class="btn sm" id="tInfo">Ficha</button></div>`;
    $('#tInfo').onclick = () => openFicha('thr', th.type);
  }
}
function renderStats() {
  const s = S.stats; const real = s.launched - s.decoys;
  const rate = s.launched ? Math.round(100 * s.killed / s.launched) : 0;
  $('#stats').innerHTML = `
    <div class="stat"><b>${s.launched}</b><small>Lanzadas (${s.decoys} señuelos)</small></div>
    <div class="stat g"><b>${s.killed}</b><small>Derribadas · ${rate}%</small></div>
    <div class="stat r"><b>${s.hits}</b><small>Impactos en blanco</small></div>
    <div class="stat a"><b>${s.misses}</b><small>Cayeron fuera</small></div>
    <div class="stat"><b>${s.shots}</b><small>Interceptores usados</small></div>
    <div class="stat"><b>${s.decoysKilled}</b><small>Señuelos derribados</small></div>
    <div class="stat"><b>${money(s.defCost)}</b><small>Gasto defensa</small></div>
    <div class="stat"><b>${money(s.atkCost)}</b><small>Gasto ataque</small></div>
    ${s.lost ? `<div class="stat r"><b>${s.lost}</b><small>Unidades perdidas</small></div>` : ''}`;
}
function renderLog() { logDirty = false; $('#log').innerHTML = S.log.slice(0, 150).map(l => `<div class="${l.cls}"><time>${fmtT(l.t)}</time>${esc(l.msg)}</div>`).join('') || '<div>Sin eventos todavía. Apretá ▶ Iniciar.</div>'; }
