# Valores estimados en revisión

Tres valores del motor no tienen una fuente firme y pesan en los resultados. Acá está qué son, de dónde salen, cuánto mueven los escenarios y qué haría falta para confirmarlos.

**Método:** Monte Carlo con `npm run mc` (40 noches, valores probables, semilla 1), cambiando un solo valor por vez sobre el escenario de Kiev (`kv_energia`, la defensa gana 68% con los valores actuales). Medido sobre la pila de PRs hasta Járkov (#29). Con 40 noches el intervalo de confianza es de ±15 puntos aproximadamente: solo las diferencias grandes significan algo.

| Valor | Dónde | Actual | Variantes → Kiev |
|---|---|---|---|
| Pk de un disparo con pista de red (C2 coordinada) | `data/c2.js` `remotePk` | 0,97 | 1,0 → **75%** · 0,97 → **68%** · 0,9 → **48%** |
| Recarga del NASAMS | `data/defenses.js` `sam.reloadS` | 30 min | 15 min → **98%** · 30 min → **68%** · 60 min → **68%** |
| Corte de la detección | `physics/radar.js` `PD_CUTOFF` | 1,2·R | 1,5·R → **88%** |

## 1. `remotePk` = 0,97 en C2 coordinada

**Qué es.** Un disparo hecho sin pista propia, con la de otro sensor, tiene la Pk multiplicada por 0,97: la red entrega la posición con más error y más demora, y el buscador del misil tiene que encontrar el blanco donde la red dice que está.

**De dónde sale.** Es una estimación de juego. No hay un dato público de cuánto empeora la Pk de un AMRAAM o un IRIS-T disparado con la pista de otro radar. Sí está documentado que la imagen aérea común (Link 16, red nacional) tiene errores de posición y latencias de segundos, y que los buscadores activos tienen una "canasta" de adquisición limitada.

**Sensibilidad.** Moderada: 7 centésimos de Pk mueven Kiev 27 puntos (48% → 75%). Eso pasa porque en Kiev muchos tiros de NASAMS e IRIS-T contra Kh-101 son con pista de red, y en una noche de saturación cada fallo es un misil menos.

**Qué haría falta.** Una fuente sobre la calidad de pista de Link 16 (error de posición típico) y el tamaño de la canasta del AIM-120 o del IRIS-T SL; con eso, `remotePk` se podría calcular en vez de estimar. Mientras tanto conviene **sumarlo a `UNC`** con un rango 0,9–1,0, para que el Monte Carlo con sorteo lo tenga en cuenta.

## 2. Recarga del NASAMS: 30 min

**Qué es.** El tiempo para recargar la batería entera desde su reserva (`sam.reloadS` = 1.800 s; rango en `UNC` 15–60 min).

**De dónde sale.** Una ficha técnica que aparece en buscadores (Army Recognition / The Defense Watch) dice "30 minutos" por lanzador. No se pudo abrir la página para verificar la cita (la red de este entorno la bloquea), y son sitios agregadores: **confianza baja**. Un detalle: el motor recarga la batería entera de una vez, y el dato habla de un lanzador (6 AMRAAM, con la grúa del camión). Si los lanzadores se recargan en paralelo, 30 min para toda la batería es razonable; si no, es optimista.

**Sensibilidad.** **Efecto umbral**, el más fuerte de los tres. Con 30 o 60 min el NASAMS no llega a recargar antes de que entren los misiles de crucero (≈25 min después del inicio): da lo mismo. Con 15 min recarga a mitad de la noche, y Kiev pasa de 68% a 98%. O sea: el valor actual está justo en el filo, y un error de pocos minutos cambia el escenario.

**Qué haría falta.** Un dato primario (manual de Kongsberg/Raytheon o un informe de uso en Ucrania) del tiempo de recarga por lanzador y de cuántos lanzadores se recargan a la vez. Mientras tanto, conviene recordar que **Kiev depende de que la recarga sea mayor que ≈25 min**.

## 3. Corte de la detección a 1,2·R

**Estado:** resuelto. El corte se reemplazó por la confirmación "2 de 3" (ver `docs/FISICA.md` §2); queda un corte de rendimiento a 2,5·R, donde la Pd es menor que 10⁻⁴.

**Qué es.** Más allá de 1,2 veces el alcance del catálogo (el de Pd 50%), el motor no sortea la detección: la da por perdida (`PD_CUTOFF`).

**Por qué existe.** El motor confirma una pista con **un solo eco**. Los radares reales piden una regla "M de N", por ejemplo 2 detecciones en 3 barridos. Con un solo eco, un blanco lento que pasa muchos barridos lejos terminaría detectado por pura suerte. El corte compensa eso a lo bruto. La cuenta con la fórmula del motor:

| r / R | 1,0 | 1,1 | 1,2 | 1,3 | 1,4 | 1,5 |
|---|---|---|---|---|---|---|
| Pd por barrido, Swerling 1 | 0,50 | 0,37 | 0,26 | 0,16 | 0,10 | 0,05 |
| Confirmar "2 de 3" | 0,50 | 0,31 | 0,16 | 0,07 | 0,03 | 0,01 |
| Pd por barrido, Swerling 3 | 0,50 | 0,32 | 0,18 | 0,09 | 0,04 | 0,02 |

A 1,2·R confirmar una pista ya es improbable (16%), y más allá cae rápido. Pero un Shahed a 51 m/s pasa ≈12 barridos (de 10 s) entre 1,5 y 1,2 veces el alcance de un radar de 20 km: tiene varias oportunidades.

**Sensibilidad.** Alta: con el corte en 1,5·R, Kiev pasa de 68% a 88%, porque los radares arman pistas antes y la defensa tiene más tiempo.

**Qué haría falta.** No es un dato que se busca: es una **simplificación del modelo**. La mejora correcta es implementar la confirmación "M de N" (por ejemplo 2 de 3) en todo el rango y sacar el corte. Así la detección lejana se vuelve gradual en vez de un escalón. Está anotado en el ROADMAP. Cambia todos los escenarios: hay que recalibrar después.

## Otros hallazgos de esta revisión

- **Valores probables contra sorteo.** Las cifras del CHANGELOG ("Kiev ≈70%", "puente ≈40%") son con los valores **probables**. El botón Monte Carlo de la interfaz sortea los parámetros dentro de su incertidumbre y da otra cosa: por ejemplo, el puente de Monterey baja a ≈10% para el ataque. Ninguna está mal: responden preguntas distintas. `npm run mc` usa los probables; `SAMPLE=1 npm run mc` sortea.
- **La doctrina de alcance domina.** Con la energía del interceptor (#26), tirar dentro del 90% o del 80% del alcance hace que Kiev se gane 40 de 40 noches: en el modelo, esperar no tiene un costo visible contra blancos lentos. Una mejora sería que esperar cueste algo (menos tiempo para un segundo tiro ya existe, pero casi nunca pesa).
  **Estado:** resuelto. La batería retiene el lanzamiento hasta que el blanco entra en el porcentaje elegido (docs/FISICA.md §6).
- **Escenarios desbalanceados.** "Monterey · noche de ataque combinado" se gana 40 de 40 noches y en "Gotemburgo · base con S-400" el ataque gana 0 de 40. Ya pasaba en `main`, no es por estos cambios. Conviene recalibrarlos.
  **Estado:** resuelto. Con la confirmación 2 de 3, C2/datalink y la doctrina de alcance con costo, se recalibraron los tres escenarios que quedaron fuera de rango (40 noches, valores probables): Monterey noche 8 Kh-101 en vez de 4 (la defensa gana 65%), Gotemburgo base 16 Storm Shadow en vez de 6 (el ataque gana 38%) y refinería 4 Kalibr en vez de 6 (la defensa gana 68%; con 6 había caído a 3%). Ver CHANGELOG.
