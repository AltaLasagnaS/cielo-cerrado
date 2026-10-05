# Auditoría de la caída de resultados del PR #64

Informe: [caida-64.md](../../docs/investigacion/caida-64.md). Las herramientas importan el
motor de **otro checkout congelado**. No escriben en él, no cambian `src/`, escenarios,
pasarelas, doctrinas ni resultados golden. Los datos del catálogo permanecen en su valor
probable. `hooks.onLog` permite capturar eventos antes de que el registro corto los descarte.

## Versiones y reproducción

Desde un clon del repositorio (Node ≥20), traer los commits del PR:

```sh
git fetch origin refs/pull/64/head
git worktree add /tmp/audit-base59 --detach 0a77102401f3e057c821d945f6f4da48ef0e7c3e
git worktree add /tmp/audit-pista64 --detach 9acaea9
git worktree add /tmp/audit-red64 --detach f36f609
git worktree add /tmp/audit-prioridad64 --detach a207526
git worktree add /tmp/audit-actual64 --detach 4fb9ac581fbb6d337976e563d99257ea0f00bce2
```

Elegir directorios libres si esos ya existen. Ejecutar desde la rama de este informe:

```sh
for version in base59 pista64 red64 prioridad64 actual64; do
  node experimentos/auditoria-64/run.mjs --repo=/tmp/audit-$version --out=/tmp/caida-$version.json --runs=40 gb_refineria kv_energia mb_noche kh_umpk
done
for version in base59 pista64 red64 prioridad64; do
  node experimentos/auditoria-64/run.mjs --repo=/tmp/audit-$version --out=/tmp/caida-tipos-$version.json --runs=40 gb_refineria kv_energia
done
node experimentos/auditoria-64/run.mjs --repo=/tmp/audit-prioridad64 --out=/tmp/caida64-arrivals.json --runs=10 --arrivals=1 gb_refineria kv_energia
node experimentos/auditoria-64/summarize.mjs /tmp experimentos/auditoria-64/data/resumen.json
```

El segundo bloque corrobora el desglose por tipo y exige que los resultados por semilla
coincidan con el primero. El resumen conserva las 640 corridas principales y verifica
otras 160 del head nuevo. Guarda ejemplos de rechazo y de llegadas aceptadas; los archivos
completos siguen en el directorio de salida. Los otros 320 replays por tipo y 20 de llegada
son controles, no muestras independientes para aumentar el tamaño estadístico.

El runner reconstruye **sin RNG** `solve()` al registrar un lanzamiento para recuperar
la altura del punto apuntado (el interceptor sólo almacena X/Y). Comprueba que el punto
horizontal coincida. Para la segunda arma de una salva conserva esa misma altura/punto;
el motor desplaza el horario 0,6 s, sin volver a apuntar. La instrumentación vive en un
`WeakMap` externo: no añade campos a las unidades, amenazas ni interceptores.

## Qué significan los contadores

- `successes`: metas completas de la defensa; no es el porcentaje de armas derribadas.
- `shots`, `killsIncludingDecoys`, `magLeft`: medias por noche. Los contadores `*ByThreat40`
  son totales de 40 noches e incluyen por separado Gerbera.
- `noReach`, causas y ejemplos: rechazo antes del sorteo de Pk. Una llegada puede tener
  varias causas; los totales por causa no tienen por qué sumar el total de llegadas.
- Muestreo de pistas cada 10 s: pares unidad/blanco no balístico real, vivo, con munición
  y dentro de `maxR` horizontal nominal. `globalVelocityNoLocal` no es un número de tiros
  perdidos: no controla reacción, sector, canales, coordinación ni solución de tiro.
- `kinPredicted`: alcance efectivo de la solución original, reconstruido a partir de
  `sol.f` y su punto 3D. `rWithPredictedAspect` usa ese denominador para diagnóstico;
  no calcula la energía restante ni representa una prueba de que el disparo sea viable.
- Error horizontal bajo `1e-6` km significa coincidencia numérica aproximada de X/Y;
  la altura puede diferir. No demuestra que una trayectoria real haya sido recorrida.

Semillas iguales hacen comparables los experimentos, pero las ramas consumen RNG en
órdenes diferentes después de cambiar decisiones/rechazos. No son resultados emparejados
misil por misil con idéntico azar ni ablaciones de una sola fórmula. Ninguna cifra es una
calibración del porcentaje real de victorias en Ucrania.

## Ventanas bloqueadas: observación sin ablación

```sh
for version in base59 pista64 red64 prioridad64; do
  node experimentos/auditoria-64/run.mjs --repo=/tmp/audit-$version --out=/tmp/caida-windows-$version.json --runs=40 --windows=1 gb_refineria kv_energia
done
node experimentos/auditoria-64/window-summary.mjs /tmp experimentos/auditoria-64/data/ventanas.json
```

La sonda examina cada segundo, **después del paso**, RBS 70-1 contra Kalibr e IRIS-T-1
contra Kh-101. Son configuraciones IR; si cambia su guiado, rechaza la medición antes de
omitir una restricción propia del radar. Comprueba unidad/lanzador, munición, canales,
pista, reacción ya acumulada, doctrina, solución y velocidad. Sólo después distingue
interceptor propio pendiente o bloqueo por otra unidad del mismo puesto.

No modifica `u.avail`, reservas de blancos ni el orden de evaluación. Los instantes
muestreados no son necesariamente los de decisión de cada batería. Una solución de
tiro según el modelo no certifica que el blanco sobreviva hasta ella ni un derribo.
Un episodio reúne muestras consecutivas con los mismos interceptores bloqueadores;
puede terminar porque cambia la pista, llega un misil, se agota munición o muere el
blanco. `noReach`, `kill` y `pkMiss` vienen del evento de llegada; `other` conserva
las otras terminaciones sin atribuirles una causa no registrada. No sumar episodios
o muestras como tiros/victorias recuperables. El resumen exige resultados completos
por semilla idénticos al control anterior.
