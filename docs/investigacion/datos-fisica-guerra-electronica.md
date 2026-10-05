# Datos de física: guerra electrónica

Consulta: 5 de octubre de 2026; base `main` tras #53. Investigación para Claude, sin cambios al motor, al catálogo o a `UNC`. Complementa [la investigación ucraniana](guerra-electronica-ucraniana.md).

## Qué se puede usar

**Northrop Grumman confirma DRFM en la modernización digital AN/ALQ-131(V)** de su página actual. No demuestra que todo ALQ-131 antiguo lo tenga, ni que ese pod esté instalado en los F-16 ucranianos. No se encontró ERP ni ancho instantáneo de interferencia con respaldo primario suficiente para los interferidores del catálogo.

El manual Patriot consultado sí describe un misil específicamente contra emisores: **MIM-104B / SOJC**. Es evidencia de esa configuración; **no autoriza atribuir automáticamente HOJ a GEM-T**, PAC-3 o todo Patriot.

## Tabla por interferidor

**NF = no encontrado en las fuentes leídas o accesibles de esta consulta.** «No encontrado» no significa «no lo tiene». La confianza corresponde a la afirmación limitada, no a todo el equipo.

| Sistema / variante | DRFM publicado | RGPO / VGPO publicado por variante | SLB | Fuente, tipo y confianza |
|---|---|---|---|---|
| **AN/ALQ-131(V), modernización digital** | **Sí**, lista explícita «Digital Radio Frequency Memory»; técnicas coherentes y no coherentes | **NF** como modos específicos con parámetros/ensayo. DRFM permite sintetizar réplicas, pero no prueba cualquier técnica implementada | NF como capacidad de un radar protegido; ver distinción debajo | [E1], fabricante, apartados «next-generation capabilities» y «Demonstrated benefits»; **alta** para existencia de DRFM en la modernización anunciada. |
| AN/ALQ-131 Block I / Block II históricos | NF en fuente primaria leída de esos bloques | NF | No asignar por nombre del pod | Búsqueda pública DTIC localizó *AN/ALQ-131 Block I and Block II TWT Screening Analysis*, ADA299676: **sólo metadatos**, no se presenta como informe leído ni como prueba DRFM. |
| **AN/ALQ-184** | NF con respaldo primario leído | NF | No asignar por nombre del pod | Ruta de producto RTX [E6], acceso bloqueado; búsqueda de título exacto en archivo DTIC sin informe pertinente encontrado. Variantes posteriores/integración con señuelo no heredadas. |
| **Khibiny**, variante no fijada | NF con respaldo primario leído | NF | No asignar por nombre del jammer | Sitio KNIRTI [E7], acceso bloqueado. No intercambiar L-175V, L-265 u otras variantes sin fuente exacta. |
| **Krasukha-2** | NF | NF | Defensa del receptor enemigo, no característica demostrada del jammer | Rostec [E8] no accesible; notas del catálogo son referencias OSINT y supuestos de juego, no ficha ERP. |
| **Krasukha-4** | NF | NF | Igual distinción | [E8] no accesible; no copiar datos de Krasukha-2 ni asumir DRFM por poder interferir un radar. |
| **Il-22PP / Porubshchik** | NF | NF | Igual distinción | Referencia Key Aero [E9] del catálogo no aportó aquí una especificación primaria cuantificada; sin dato verificado nuevo. |
| **F-16 ucraniano / ALQ-162(V)6 observado** | NF en la evidencia examinada | NF | Igual distinción | [E2], OSINT basado en identificación de pilones, **media** para la identificación publicada. No extrapolar el DRFM de [E1] a este equipo. |

**SLB — side-lobe blanking — corresponde al receptor/radar que rechaza señales entrando por sus lóbulos laterales**, usando un canal auxiliar y criterios de comparación. No es sinónimo de engaño del interferidor. **SLC — side-lobe cancellation — es otra arquitectura**. [E3], manual de ingeniería, §4-9, describe sus implicaciones para interferencia por lóbulos laterales; no certifica una implementación concreta en cada radar del catálogo.

Tampoco son equivalentes «digital», DRFM, RGPO y VGPO. Una memoria RF respalda réplicas coherentes; atribuir extracción de compuerta de distancia/velocidad requiere una fuente que identifique esa técnica. Los falsos blancos de un modelo de juego no prueban cuántas réplicas crea un equipo real ni su tasa por barrido.

## Home-on-jam: tabla por misil

| Misil / variante | Resultado publicado y límite | Fuente, tipo y confianza |
|---|---|---|
| **MIM-104B / SOJC** | El manual describe modificación de guiado/navegación para trayectoria elevada hacia la fuente de interferencia y búsqueda del **emisor más fuerte en la fase terminal**. Evidencia funcional para esa configuración | [E4], glosario, entrada **SOJC**; manual US Army; **alta** para la descripción de MIM-104B. |
| **PAC-2 GEM / GEM-T** | **NF** como HOJ propio de esa variante en fuente primaria leída. El mismo manual distingue SOJC, ATM y GEM: no son etiquetas intercambiables | [E4], §5-39 y glosario SOJC; manual. No generalizar el caso MIM-104B. |
| **Aster 15 / 30** | **NF** para HOJ por variante. EUROSAM confirma buscador electromagnético activo y guiado inicial inercial con datos actualizados; eso **no demuestra HOJ** | [E5], fabricante, apartado «ASTER Missile Family»; **alta** para lo publicado, sin conclusión negativa sobre HOJ. |
| **48N6**, variante no fijada | **NF** en fuente primaria leída para la variante exacta | Referencias APA/S-300 de [la investigación inicial de clutter](clutter-y-pulsos-datos.md) y búsqueda de ficha variante en Missilery; no se obtuvo manual de buscador/modo HOJ. |
| **9M317**, variante no fijada | **NF** en fuente primaria leída para la variante exacta | Consulta de Missilery Buk-M1 [E10] no prueba 9M317: describe otra generación. No heredar capacidad de 9M38 ni de 9M317MA. |

El disparo de una batería con seguimiento angular del jammer, triangulación o guiado por comando **no es necesariamente HOJ del buscador del misil**. [E4], §5-31, describe triangulación de Patriot frente a jammers; es una capacidad del sistema, separada de la entrada SOJC. Un emisor de apoyo alejado del blanco y un pod de autoprotección tampoco son el mismo objetivo para HOJ.

## ERP y ancho de banda: tabla del catálogo

Las `P` del motor están declaradas como **potencias relativas de juego, no watts**. No convertirlas a dBW. Una cifra de potencia eléctrica consumida, salida RF por módulo o antena tampoco basta para ERP sin ganancia, pérdidas, modo y referencia de antena.

| Entrada del catálogo / sistema | ERP W o dBW confirmada | Ancho instantáneo de interferencia Hz confirmado | Qué queda pendiente / dónde se buscó |
|---|---|---|---|
| `soj` / tipo Il-22PP | **NF** | **NF** | Fuente Key Aero/catálogo [E9]; no ficha primaria cuantificada leída. |
| `krasukha2` | **NF** | **NF** | Rostec [E8] no accesible; referencias generales no fijan potencia/ganancia/modo. |
| `krasukha4` | **NF** | **NF** | Igual; alcance declarado de cobertura no determina ERP. |
| `f16ecm` / ALQ-131 o ALQ-162 | **NF** | **NF** | [E1] no publica ERP ni ancho; [E2] identifica equipo, sin tabla RF. FAS ALQ-131 [E11] bloqueado. |
| `gnss` / tipo Pole-21 | **NF** | **NF** | Documentación secundaria del catálogo; ningún dato primario nuevo verificado aquí. |
| `pokrova` | **NF** | **NF** | Fuentes de la investigación ucraniana; desempeño de una red no identifica ERP por nodo. |
| `lima` / Lima-Quant | **NF** | **NF** | Fuentes de operadores/fabricante en la investigación ucraniana, sin especificación RF completa verificada aquí. |
| `bukovel` / Bukovel-AD | **NF** | **NF** | El catálogo cita potencia **por antena**, sin ganancia/modo suficientes para ERP; no promover automáticamente a potencia radiada equivalente. La banda de detección no es ancho simultáneo de jamming. |

[E3], §4-2 y §4-9, establece el vínculo entre potencia transmitida, ganancia y potencia radiada, y distingue ancho del jammer del ancho del receptor. El manual llama ERP al producto con ganancia isotrópica: conservar esa convención al citarlo. En otras fichas ERP respecto de dipolo y EIRP respecto de isotrópica no se intercambian sin conversión. El cociente de anchos sólo tiene sentido después de identificar potencia espectral y modo; no utilizar el intervalo total sintonizable como ancho instantáneo.

## Datos que no cierran una incertidumbre por sistema

- No se encontró una fuente primaria abierta leída que publique parámetros de RGPO/VGPO por esas variantes. Frecuencia sintonizable no es velocidad de extracción de compuerta ni retardo DRFM.
- No hay umbral HOJ, precisión angular pasiva, comportamiento ante apagado del jammer o persistencia publicados y verificados para los misiles solicitados. Esos campos quedan **NF**.
- Las referencias bloqueadas se anotan como limitación de esta consulta, no como prueba de ausencia. La búsqueda no es exhaustiva de todo archivo mundial.
- No se incorporaron estimaciones CMO/DCS. Los parámetros de juego existentes no se presentan como mediciones de esta investigación.

## Fuentes

- **[E1] Fabricante, leído:** Northrop Grumman, *AN/ALQ-131(V) Electronic Countermeasures (ECM) Pod*, página actual «Revolutionized through digital technology» y listas de capacidades. [Texto](https://www.northropgrumman.com/what-we-do/mission-solutions/electronic-warfare/an-alq-131v-electronic-countermeasures-ecm-pod).
- **[E2] OSINT, leído:** Thomas Newdick / The War Zone, *F-16 Officially In Ukrainian Service, Self-Protection Pods Included*, apartado sobre PIDS+/ECIPS y AN/ALQ-162(V)6. [Texto](https://www.twz.com/air/f-16-officially-in-ukrainian-service-self-protection-pods-included).
- **[E3] Manual técnico primario, leído en las secciones citadas:** Naval Air Warfare Center, *Electronic Warfare and Radar Systems Engineering Handbook*, rev. 2, 1-abr-1999, distribución pública ilimitada, DTIC ADA452799, **§4-2 «Power Density», §4-9 «Support Jamming»**. [PDF](https://archive.org/download/DTIC_ADA452799/DTIC_ADA452799.pdf). Manual de relaciones físicas; no ficha de esos sistemas.
- **[E4] Manual primario, leído:** US Army, *FM 3-01.85, Patriot Battalion and Battery Operations*, mayo 2002, §5-31, §5-39, apéndice B y glosario entrada SOJC. [PDF](https://archive.org/download/Fm301.85PatriotBattalionAndBatteryOperations/fm%203-01.85%20Patriot%20Battalion%20and%20Battery%20Operations.pdf). No prueba una modernización posterior.
- **[E5] Fabricante, leído:** EUROSAM, *ASTER Missile Family*, descripción de guiado inicial/buscador terminal. [Texto](https://eurosam.com/aster-missiles/). No ofrece HOJ en el texto consultado.
- **[E6] Fabricante, consulta bloqueada 403:** RTX, ruta AN/ALQ-184. [Ruta consultada](https://www.rtx.com/raytheon/what-we-do/air/an-alq-184). No se certifica que esta ruta sea una ficha vigente ni se presenta contenido no leído.
- **[E7] Fabricante, consulta bloqueada 403:** KNIRTI. [Sitio](https://knirti.com/). No documentación técnica leída.
- **[E8] Fabricante, consulta fallida 503:** Rostec, ruta *Krasukha: Invisible Safety Barrier*. [Ruta consultada](https://rostec.ru/en/news/krasukha-invisible-safety-barrier/). Contenido no confirmado.
- **[E9] Referencia secundaria del catálogo, sin dato técnico nuevo verificado:** Key Aero, *Ilyushin Il-22PP*, [ruta del artículo](https://www.key.aero/article/ilyushin-il-22pp). Esta referencia no equivale a una ficha primaria leída en esta entrega.
- **[E10] OSINT leído:** Missilery, *Buk-M1*. [Texto ruso](https://missilery.info/missile/bukm1). No extrapolar a un misil de otra generación.
- **[E11] Archivo técnico secundario, bloqueado 403 en la investigación previa:** FAS, AN/ALQ-131. [Referencia](https://man.fas.org/dod-101/sys/ac/equip/an-alq-131.htm).
