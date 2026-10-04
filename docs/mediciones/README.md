# Mediciones reproducibles

`baseline.json` es la línea de base del motor anterior a la separación explícita entre C2 y datalink. Se obtuvo con seis escenarios jugables, 40 semillas (`1`–`40`) por escenario y dos modos:

```sh
npm run baseline -- --runs 40 --seed 1 --jobs 2 --out docs/mediciones/baseline.json
```

`probable` usa los valores centrales del catálogo. `sampled` sortea los parámetros que tienen rango de incertidumbre con una distribución triangular. Cada caso conserva el resumen y las 40 corridas individuales; el informe guarda el commit, hashes del código medido, versión de Node, semillas y paso de simulación de 0,25 s.

Los intervalos de 95% son intervalos de Wilson sobre estas 40 corridas, no una validación histórica del escenario. Con 40 casos, un cambio de una corrida mueve la proporción 2,5 puntos porcentuales; no corresponde usar este tamaño para afirmar que una cifra es exacta ni para recalibrar sin más evidencia. Para comparar cambios del motor hay que repetir exactamente las semillas y mirar el mismo escenario, modo y meta.

Resultados centrales (probable; `éxito` es la meta principal del jugador):

| Escenario | Lado jugador | Éxito | IC 95% | Interceptación media |
|---|---|---:|---:|---:|
| Monterey · noche | defensa | 40/40 (100%) | 91,2–100% | 99,1% |
| Gotemburgo · base rusa | ataque | 0/40 (0%) | 0–8,8% | 99,1% |
| Gotemburgo · refinería | defensa | 16/40 (40%) | 26,3–55,4% | 90,2% |
| Monterey · puente | ataque | 21/40 (52,5%) | 37,5–67,1% | 88,9% |
| Kiev · energía | defensa | 27/40 (67,5%) | 52,0–79,9% | 83,5% |
| Járkov · bombas planeadoras | defensa | 22/40 (55%) | 39,8–69,3% | 82,2% |

El modo `sampled` queda en el JSON para mostrar sensibilidad al rango de datos; no se mezcla con el probable. Los resultados anteriores son comparadores del motor viejo: el cambio de C2/datalink altera golden y probabilidades de forma intencional y debe medirse en un informe nuevo, con otro `--out`, antes de ajustar números.

Para una corrida corta de desarrollo:

```sh
npm run baseline -- --runs 2 --seed 17 --jobs 1 --scenarios gb_ruso --out /tmp/cielo-baseline.json
```

El script rechaza semillas repetidas, escenarios no jugables y series incompletas. Es una medición de escenarios incluidos, no el arnés de calibración histórica `CAL` que sigue en el roadmap.
