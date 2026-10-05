# Datos de física: maniobra por altura

Consulta: 5 de octubre de 2026. Sólo investigación para Claude; `main` tras #53. **No se encontraron curvas primarias públicas leídas de aceleración lateral frente a altura/velocidad para los misiles solicitados.** No se propone completar `gMax` con valores de otra variante o con un techo de interceptación.

## Lo confirmado

- **EUROSAM** describe para la familia **Aster** control aerodinámico combinado con control directo por empuje **PIF-PAF**, y capacidad de maniobras «high G». No cuantifica en esa página la aceleración ni las condiciones de vuelo.
- Un informe primario del **PAC-3 MSE** identifica motor de mayor rendimiento y superficies de control más responsivas. No proporciona un máximo lateral en g ni una curva por altura.
- Una publicación histórica oficial sobre **ERINT/PAC-3** menciona motores de control de actitud. Es respaldo de esa arquitectura histórica; no basta para reconstruir el número, impulso, duración o rendimiento de ACM de **MSE**.
- La cifra **60 g** de Aster encontrada en una descripción técnica secundaria se conserva **como afirmación OSINT pendiente de confirmación primaria**, no como dato validado para todas las alturas o toda la familia.

## Tabla por interceptor

**NF = no encontrado en esta consulta**, no ausencia de la capacidad. «Techo de maniobra» significa altura a la que se garantiza la maniobra especificada; no es automáticamente techo de interceptación. El nombre de un misil no fija subvariante, buscador, control ni condición de vuelo.

| Misil / variante | Máximo lateral g, fuente primaria | Altura/velocidad del máximo | Techo de maniobra garantizado | Control lateral/directo confirmado en lo leído | Fuente / tipo / confianza |
|---|---|---|---|---|---|
| **PAC-2 GEM-T** | **NF** | **NF** | **NF** | NF para detalle cuantificado de GEM-T; no heredar ACM del PAC-3 | [M6], manual Patriot distingue familias; falta ficha de maniobra GEM-T. |
| **PAC-3 MSE** | **NF** | **NF** | **NF** | Superficies más responsivas confirmadas. Parámetros ACM propios de MSE **NF** | [M2], informe institucional primario, p. impresa 6, **alta** para la descripción delimitada; fabricante [M7] bloqueado. |
| **Aster 15** | **NF** | **NF** | **NF** | Familia con aerodinámica + empuje directo PIF-PAF | [M1], fabricante, «PIF-PAF Technology», **alta** para arquitectura de familia; cifras por variante pendientes. |
| **Aster 30 / B1** | **NF** | **NF** | **NF** | Misma descripción de familia; no transferir parámetros de B1NT/Block 2 | [M1], fabricante, **alta** para arquitectura; [M4] cifra secundaria delimitada debajo. |
| **IRIS-T SL / SLM**, no IRIS-T aire-aire | **NF** | **NF** | **NF** | NF para ficha primaria específica de control del SL leída | [M8], fabricante bloqueado. Un valor del misil aire-aire no define el del lanzado desde tierra. |
| **AIM-120**, bloque no fijado / NASAMS | **NF** | **NF** | **NF** | NF para límite de control por bloque/configuración terrestre | [M9], fabricante bloqueado. Altura/velocidad inicial del avión no equivalen a lanzamiento terrestre. |
| **48N6E2** | **NF** | **NF** | **NF** | NF por variante exacta | APA S-300/S-400 [M10] y búsqueda de ficha exacta en Missilery sin primaria leída. No heredar E3. |
| **48N6E3** | **NF** | **NF** | **NF** | NF por variante exacta | Igual búsqueda [M10], sin curva primaria; no copiar E2. |
| **9M96**, subvariante no fijada | **NF** | **NF** | **NF** | NF de arquitectura y parámetros de subvariante exacta en primaria leída | [M10] como inventario OSINT, no ficha primaria del control lateral. Separar 9M96E/E2 y variantes domésticas. |
| **9M317** | **NF** | **NF** | **NF** | NF con respaldo primario por variante | Rosoboronexport Buk-M2E [M11] no accesible. Missilery Buk-M1 [M12] no describe este misil. |
| **9M317M** | **NF** | **NF** | **NF** | NF por variante exacta | Búsqueda en referencias Buk del proyecto sin fuente primaria de la variante leída. No equiparar M, MA y 9M38. |
| **57E6** | **NF** | **NF** | **NF** | Detalle por versión exacta pendiente de fuente primaria | Missilery Pantsir [M13] y APA [M10], descripciones secundarias; no curva g-altura confirmada. |
| **9M338** | **NF** | **NF** | **NF** | NF por variante exacta | Missilery Tor [M14] trata generaciones distintas; no heredar datos de 9M330/9M331. |
| **5V27** | **NF** | **NF** | **NF** | NF para límites de control de subvariante | Missilery S-125 [M15] y APA [M10], fuentes secundarias; no curva primaria leída. |
| **MIM-23**, bloque no fijado | **NF** | **NF** | **NF** | NF por versión/condición exacta | Referencias HAWK del proyecto; no se obtuvo manual primario con curvas g-altura. No trasladar entre HAWK básico y mejoras. |

La tabla no certifica que esos misiles carezcan de empuje directo o maniobra alta; delimita la evidencia encontrada. Una configuración compuesta del simulador necesita primero una identidad de misil/control suficientemente precisa para incorporar mediciones.

### La cifra Aster que requiere confirmación

| Afirmación | Valor / unidad | Fuente, localizador, tipo, confianza | Lo que falta |
|---|---|---|---|
| Empuje lateral/control en descripción de **Aster 30 SAMP/T** | «up to **60 g** acceleration» | [M4], apartado de guiado y PIF; OSINT técnico secundario; **baja** para parametrizar un máximo | Altura, Mach/velocidad, masa/estado de motor, duración, componente lateral vs aceleración combinada y variante exacta. Fuente primaria y ensayo NF. |

[M4] asocia la cifra al texto sobre empuje lateral; no ofrece curvas ni condiciones. [M1] sólo dice «high G». No convertir esa diferencia en confirmación del fabricante, ni asumir que el gas lateral pueda sostener ese límite durante todo el vuelo.

## Tabla por amenaza

| Amenaza | g de maniobra terminal medidos/publicados en primaria leída | Altura, velocidad y duración asociadas | Resultado de búsqueda |
|---|---|---|---|
| **Iskander-M / 9M723**, subvariante no fijada | **NF** | **NF** para una carga lateral concreta | [M5], RUSI, describe trayectoria y maniobra terminal, y cuestiona afirmaciones de rendimiento; es análisis secundario, no telemetría de g. |
| **Kinzhal** | **NF** | **NF** | Referencias del catálogo y relación de familia con Iskander no dan medición primaria por variante. No copiar el g de 9M723. |
| **Kh-101** | **NF** | **NF** | Referencias de guiado/rutas del proyecto [M16]; cambio de rumbo programado no prueba zigzag terminal a un g fijo. |
| **Kalibr**, variante no fijada | **NF** | **NF** | Inventario del proyecto; separar crucero terrestre de antibuque y su etapa terminal. No heredar un perfil supersónico a todo Kalibr. |

[M5], apartado sobre trayectoria/contramedidas, califica como **afirmación rusa**, no como medición propia, la maniobra a velocidades terminales elevadas. Este análisis no respalda imponer un número de g ni un perfil universal de maniobra aleatoria. Que un misil ataque una posición corregida o use un buscador no determina su aceleración lateral máxima.

## Cómo interpretar altura y capacidad de giro

[M3], fuente técnica primaria NASA, presenta la ecuación de sustentación:

```text
L = C_L * (rho * V_air**2 / 2) * S
```

`rho` es densidad local, `V_air` velocidad relativa al aire, `S` área de referencia y `C_L` coeficiente de sustentación. **Fuente: NASA Glenn, «Lift Equation», ecuación y explicación; confianza alta para esta relación general**, no para coeficientes desconocidos de un misil.

Si se la usa como aproximación de fuerza lateral aerodinámica, dividir por la masa da una aceleración disponible condicionada a esos parámetros. **No justifica una ley sólo de altura**: también cambian Mach, coeficientes, masa, ángulo de ataque, límites estructurales y autoridad del actuador. La presión dinámica puede bajar por altura y subir por velocidad al mismo tiempo.

El control lateral por gas añade una fuerza distinta, limitada por impulso y tiempo disponible; el vectorado del motor depende del empuje presente. No tratarlos como una sustentación aerodinámica permanente ni asignarles un máximo sin duración. El g de una ficha puede ser estructural, pico o sostenido: registrar cuál es antes de usarlo.

Para un giro ideal local, relacionar velocidad, aceleración normal y radio sólo describe la cinemática. No demuestra que el controlador/buscador pueda seguir la orden, que quede energía, ni una zona de no escape real. Tampoco convertir alcance máximo o techo de interceptación en techo de maniobra garantizada.

## Qué queda pendiente para `UNC`

Ningún máximo lateral de esta entrega tiene simultáneamente **variante + condiciones + definición + fuente primaria cuantitativa**. Los campos numéricos por misil quedan desconocidos. Las estimaciones por clase del motor deben seguir declaradas como tales; una calibración de derribos no transforma el supuesto en medición.

Los documentos que más cerrarían el hueco son una curva de carga normal disponible, envolvente de control por Mach/altura y una descripción de autoridad/duración de ACM/PIF. Los accesos bloqueados no prueban que no existan. No se usaron bases de juegos para fijar g ni se extrapolaron especificaciones de un misil aire-aire al sistema terrestre.

## Fuentes

- **[M1] Fabricante, leído:** EUROSAM, *ASTER Missile Family*, apartado «PIF-PAF Technology» y familia Aster 15/30. [Página canónica](https://eurosam.com/aster-missiles-family/); también accesible en [ruta alternativa](https://eurosam.com/aster-missiles/). Sin cifra g/altura en texto consultado.
- **[M2] Informe institucional primario, leído:** US DoD, *Patriot Advanced Capability-3 Missile Segment Enhancement (PAC-3 MSE), Selected Acquisition Report*, diciembre 2015, publicación 21-mar-2016, «Mission and Description», p. impresa 6. [PDF DTIC AD1019515](https://archive.org/download/DTIC_AD1019515/DTIC_AD1019515.pdf).
- **[M3] Fuente técnica primaria, leída:** NASA Glenn Research Center, *Lift Equation*. [Ecuación y explicación](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-equation/). Relación general, no especificación de armamento.
- **[M4] OSINT técnico secundario, leído:** Army Technology, *Aster 30 SAMP/T Surface-to-Air Missile Platform / Terrain*, 2-nov-2020, apartado de guiado/PIF. [Texto](https://www.army-technology.com/projects/aster-30/). No se presenta el máximo citado como dato primario.
- **[M5] Análisis técnico secundario, leído:** Sam Cranny-Evans y Sidharth Kaushal / RUSI, *The Iskander-M and Iskander-K: A Technical Profile*, 8-ago-2022, apartados de trayectoria y contramedidas. [Texto](https://www.rusi.org/explore-our-research/publications/commentary/iskander-m-and-iskander-k-technical-profile).
- **[M6] Manual primario y publicación histórica, leídos en apartados pertinentes:** US Army, *FM 3-01.85*, mayo 2002, §5-39 / apéndice B, [PDF](https://archive.org/download/Fm301.85PatriotBattalionAndBatteryOperations/fm%203-01.85%20Patriot%20Battalion%20and%20Battery%20Operations.pdf); Sharon Watkins Lang / USASMDC/ARSTRAT, *PAC-3: The Evolution of a System from Concept to Deployment*, 2011, texto histórico ERINT, [PDF DTIC ADA560833](https://archive.org/download/DTIC_ADA560833/DTIC_ADA560833.pdf), p. PDF 2. Motores de actitud históricos, no parámetros MSE.
- **[M7] Fabricante, bloqueado 403:** Lockheed Martin, [PAC-3](https://www.lockheedmartin.com/en-us/products/pac-3.html).
- **[M8] Fabricante, bloqueado 403:** Diehl, [ruta IRIS-T SLM](https://www.diehl.com/defence/en/products/ground-based-air-defence/iris-t-slm/). No se afirma contenido no leído.
- **[M9] Fabricante, bloqueado 403:** RTX, [AMRAAM](https://www.rtx.com/raytheon/what-we-do/air/amraam-missile).
- **[M10] OSINT técnico secundario / inventario:** APA, [S-300/S-400](https://www.ausairpower.net/APA-Grumble-Gargoyle.html), [radares de control](https://www.ausairpower.net/APA-Engagement-Fire-Control.html), [Pantsir](https://www.ausairpower.net/APA-96K6-Pantsir-2K22-Tunguska.html). Fuentes consultadas para identidad/arquitectura, sin curva primaria de maniobra extraída.
- **[M11] Fabricante, acceso fallido 503:** Rosoboronexport, [ruta Buk-M2E](https://roe.ru/en/catalog/air-defence-systems/air-defense-systems-and-mounts/buk-m2e/). No se certifica contenido ni vigencia de esta ruta.
- **[M12–M15] OSINT secundario, textos leídos:** Missilery [Buk-M1](https://missilery.info/missile/bukm1), [Pantsir](https://missilery.info/missile/panz), [Tor](https://missilery.info/missile/tor), [S-125](https://missilery.info/missile/c125). Historial de generaciones no permite copiar parámetros entre ellas.
- **[M16] Inventario previo del proyecto:** [Mejoras de física](mejoras-fisica.md), apartados de amenazas/enlaces y referencias. No telemetría ni nueva evidencia cuantitativa.
