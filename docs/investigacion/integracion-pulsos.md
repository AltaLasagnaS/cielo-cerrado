# Integración de pulsos: modelo y datos pendientes

## Qué se implementó

El motor admite **suma no coherente de potencias** de N pulsos independientes de ruido, para blancos Swerling lento 1 y 3. La RCS es constante durante esa decisión y vuelve a fluctuar entre barridos. `radar.integrationPulses` es opcional: **no se asigna a ningún sistema actual** sin conocer el procesamiento del modo correspondiente. El cambio construye y prueba el modelo, pero no completa el bloque de detección del roadmap.

Un radar real puede transmitir e integrar muchos pulsos; el valor ausente no afirma que transmita uno. Conserva la aproximación matemática anterior para que un dato desconocido no se convierta en una capacidad inventada. `radar.scan` es el período entre barridos, no el tiempo de permanencia del haz ni el número de muestras independientes.

## Convenciones y derivación

- SNR es **lineal, media por pulso**, no dB ni energía total integrada.
- Cada cuadratura del ruido tiene varianza 1/2: la potencia media compleja por pulso es 1.
- Se suman potencias, no amplitudes complejas. No se supone ganancia coherente N.
- PFA=10⁻⁶ es **por decisión integrada**, no por cada pulso ni por pista confirmada. Sigue siendo el valor de diseño que ya usaba el simulador.
- Swerling 1: S~Gamma(1,SNR). Swerling 3: S~Gamma(2,SNR/2). El segundo argumento es escala; la media de S es SNR en ambos casos.

Con ruido solo, la energía Y~Gamma(N,1). El umbral T_N resuelve `Q(N,T_N)=PFA`, donde Q es la Gamma superior regularizada. Con una señal fija de potencia S, `2Y~χ²(2N,2NS)` no central. Por lo tanto:

```
Pd = ∫ sf_χ²_no_central(2T_N; 2N, 2NS) · pdf_S(S) dS
```

La distribución no central admite una mezcla de Gamma(N+K,1) con K~Poisson(NS). Al promediar S sobre Gamma(a,SNR/a), con a=1 (modelo 1) o a=2 (modelo 3), K resulta binomial negativa:

```
p = 1/(1 + N·SNR/a),  q = 1−p
w₀ = pᵃ
wₖ₊₁ = wₖ · q · (k+a)/(k+1)
Pd = 1 − Σₖ wₖ · P(N+k,T_N)
```

P es la Gamma inferior regularizada. Esta última suma es la implementación de producción; la primera integral es la referencia independiente. Sumar la probabilidad de fallo permite truncar sin recorrer un número enorme de términos cuando la señal es fuerte: P(N+k,T_N) decrece con k. Una vez que es menor que 10⁻¹⁵, la contribución restante de toda la mezcla es menor que 10⁻¹⁵, porque sus pesos suman como máximo 1. Este límite de truncamiento no incluye el redondeo de coma flotante; las pruebas fijan tolerancias para el resultado completo.

Para N=1 se recuperan las fórmulas cerradas existentes. La API matemática devuelve PFA con SNR=0; el motor conserva Pd=0 cuando no hay señal, y **no crea pistas falsas**. Tampoco usa nuevos sorteos de azar ni cambia la cadencia de barridos.

## Por qué no aumenta automáticamente R1

El alcance del catálogo ya se interpreta como el punto de Pd=50%. Un alcance publicado por fabricante o estimado para un radar completo ya incorpora su procesamiento. Multiplicarlo por otra ganancia de integración sería contarla dos veces.

Se busca por bisección la SNR por pulso que da Pd=0,5 para N y el modelo de fluctuación correspondiente. Esa SNR50_N sustituye el ancla de la curva, manteniendo:

```
SNR(r) = SNR50_N · (detR/r)⁴ / 10^(pérdida_clutter/10)
```

Integrar sí mejora la detección **a igual SNR por pulso**, pero al calibrar dos curvas al mismo alcance observado, lo que cambia es su forma. No se fuerza que todo radar gane alcance. La interpretación del alcance publicado como Pd=50% sigue siendo una convención del simulador, no una condición garantizada por todas las fichas comerciales.

## Fuentes consultadas el 4 de octubre de 2026

| Fuente | Qué respalda | Límite de la consulta |
|---|---|---|
| [P. Swerling, RAND RM-1217, 1954](https://www.rand.org/pubs/research_memoranda/RM1217.html) | Referencia primaria histórica sobre blancos fluctuantes | Página y resumen consultados. PDF descargado para consulta local, escaneado sin texto extraíble; no se afirma una lectura completa ni se redistribuye |
| [MathWorks, `shnidman`](https://www.mathworks.com/help/phased/ref/shnidman.html) | Integración no coherente de N pulsos; casos I/III cambian entre barridos, II/IV entre pulsos; PDF exponencial y χ² de cuatro grados de libertad | Página completa accesible. No se implementa ni se usa como verdad la aproximación de Shnidman |
| [MathWorks, `rocsnr`](https://www.mathworks.com/help/phased/ref/rocsnr.html) | Número entero de pulsos integrado y distinción entre tipos de señal/detector | Página completa accesible. No se ejecutó MATLAB y no se afirma equivalencia con su implementación |
| [SciPy, `ncx2`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ncx2.html) | χ² no central, grados de libertad, no centralidad y función de supervivencia | Documentación completa accesible; SciPy 1.17.0 se ejecutó como referencia independiente |

La transformación a mezcla binomial negativa y su evaluación son una derivación del modelo indicado arriba, comprobada numéricamente; no son una fórmula atribuida a una ficha militar. Ninguna de estas fuentes proporciona N para el MPQ-65, Sentinel, 30N6, etc.

## Verificación reproducible

`node --test tests/pulse-integration.test.js` verifica:

- 96 valores de Pd, 6 umbrales y 12 anclas calculados independientemente con SciPy.
- Todo el dominio entero N=1…128: monotonicidad con SNR, valores en [0,1], señal débil, saturación y ancla de 50%.
- Un experimento I/Q con semilla, RCS constante dentro del barrido y ruido gaussiano complejo independiente; genera la señal y suma potencias, sin reutilizar la mezcla Gamma del motor.
- La conexión con `pdScan` y una corrida real de sensores con un radar hipotético, conservación de `detR`, notch/clutter, exclusión de sensores ópticos/acústicos y rechazo de valores fraccionarios o fuera de dominio.
- La curva anterior exacta cuando N falta o vale 1; el catálogo conserva N desconocido.

Los fixtures de `tests/fixtures/pulse-integration.json` se generan con **cuadratura adaptativa** de la cola χ² no central y la PDF Gamma de la RCS, no con la serie de producción. Para regenerarlos, opcionalmente con Python y SciPy:

```sh
python scripts/verify-pulse-integration.py --write
```

La CI usa los fixtures con Node y no necesita Python, SciPy ni red. Este comando no actualiza las golden de escenarios. Para comprobar todo: `npm run check`, con `index.html` previamente regenerado e incluido en el commit.

La Academia incorpora un ejemplo hipotético para comparar ambas curvas al mismo alcance. `tests/pulse-integration.browser.mjs` comprueba 18 combinaciones de N/modelo/distancia en desarrollo y en el bundle, el ancla del 50%, que el escenario quede intacto y que no haya errores JavaScript. Se ejecuta contra un servidor con `TEST_URL` (y, si hace falta, `PLAYWRIGHT_MODULE`/`CHROMIUM_PATH`). `tests/ui.browser.mjs` también comprueba el nuevo concepto: cuando se incorpore la CI de navegador del PR #45, lo cubrirá automáticamente sin depender de esa rama para implementar física.

La primera comprobación de Escape encontró que el filtro de atajos devolvía antes de cerrar una ventana si el foco estaba en un campo. Se corrigió el orden de esas comprobaciones y se añadió una regresión: Escape cierra desde el control del ejemplo y espacio no inicia la simulación detrás de la ventana.

## Lo que falta antes de asignarlo a un radar real

Se necesita la cantidad de **muestras independientes integradas en una decisión** y el modo de funcionamiento que la produce: permanencia del haz, forma de onda, correlación del ruido y fluctuación del blanco. Un conteo de pulsos transmitidos o la frecuencia de repetición por sí solos no bastan. Un dato aplicable debe quedar con fuente en SRC y rango/confianza en UNC; cada valor muestreado tendrá que respetar el dominio entero.

1–128 es el dominio verificado de esta implementación, no un límite de hardware. Si aparece una fuente con otro dominio, se amplía con verificaciones antes de usarla. El modelo actual tampoco cubre integración coherente, ruido correlacionado, fluctuación pulso a pulso (Swerling 2/4), CFAR adaptativo, clutter meteorológico o de mar por estado, ni precisión de seguimiento. No se deduce el caso Swerling de la agilidad de frecuencia ni se usa este modelo para afirmar que un blanco concreto tiene RCS constante durante una permanencia real.

Clutter de lluvia/mar y visibilidad sub-clutter por radar siguen como tareas separadas. Activar N con datos reales requerirá revisar las golden y marcar el cambio de resultados con **[sim]**; no ajustar cantidades de atacantes para recuperar el balance anterior.
