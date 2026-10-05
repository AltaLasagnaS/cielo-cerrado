# Datos de física: enlaces, actualización y demoras

Consulta: 5 de octubre de 2026. Sólo documentación para Claude; base `main` tras #53. Complementa [C2 y datalink](c2-datalink.md) sin cambiar sus parámetros ni el motor.

## Resultado

Se verificaron **temporización básica Link 16** en una tesis técnica pública y **semántica de tiempo ASTERIX** en la especificación de EUROCONTROL. Ninguna de ellas permite convertir automáticamente esos tiempos en latencia de una pista recibida o en calidad de tiro. **No se encontró una tasa operativa de pistas ni una demora extremo a extremo verificable por las configuraciones solicitadas.**

No se confirmó en una fuente primaria accesible un gateway **Link 16 ↔ Delta/Kropyva** con demora publicada. Un acuerdo de integración, una demostración de interoperabilidad o la existencia de una imagen aérea común no demuestran que cualquier lanzador pueda disparar con la pista de cualquier sensor.

## Tabla por red o formato

**NF = no encontrado**, no igual a cero y no prueba de ausencia. Se separan: período de medida del sensor, programación del enlace, transporte, fusión, conversión de formato y consumo por el sistema de armas. La confianza sólo se aplica a la magnitud especificada.

| Red / formato | Dato encontrado | Actualización de pistas típica por configuración | Demora extremo a extremo | Fuente / tipo / confianza |
|---|---|---|---|---|
| **Link 16 / JTIDS**, descripción clásica | Ranura TDMA **7,8125 ms**, asignación de **128 ranuras/s**; empaquetado Standard / Packed-2 / Packed-4 | **NF** para J-series y participantes del catálogo. Una ranura no es un ciclo de actualización de cada pista | **NF**. No usar duración de ranura como demora total | [L1], tesis técnica pública, §2.7–2.7.1, pp. impresas 2-17–2-18; **media** para descripción clásica citada, no garantía de una red desplegada. |
| **ASTERIX CAT048**, edición **1.32** | Formato de reportes monorradar; puede llevar plots o tracks. `I048/140` codifica el tiempo del **evento** con LSB **1/128 s** | **NF** como tasa universal; depende del sensor/productor y su servicio | **NF** como demora universal; ASTERIX describe formato, no un transporte único | [L2], especificación primaria EUROCONTROL, §4.6 y §5.2.17, pp. 12 y 40; **alta** para semántica/formato. |
| **Polyana-D4** | NF de demora/tasa con fuente primaria leída de esta variante | **NF** | **NF** | Se buscó fabricante [L4], referencias del catálogo y Armada [L5]; accesos fallidos. No heredar D4M1. |
| **Polyana-D4M1 / 9S52M1** | El proyecto referencia la ficha del fabricante, pero no se pudo leer en esta consulta | **NF** | **NF** | [L4], intento primario fallido 503; sin cifras certificadas aquí. |
| **Baikal**, versión no fijada | NF por versión concreta | **NF** | **NF** | Referencias de C2 del proyecto [L8] y ruta Armada [L5] bloqueada. No extrapolar Baikal-1ME a toda la familia. |
| **Senezh**, versión no fijada | NF por versión concreta | **NF** | **NF** | [L8], referencias generales; no manual técnico primario ni ensayo cuantificado encontrado. |

### Qué significan las cifras de Link 16

[L1], §2.7.1, da **26,88 / 53,76 / 107,52 kbit/s** de información táctica para Standard / Packed-2 / Packed-4, bajo su cálculo con todas las ranuras de la secuencia. **Unidades: kbit/s, no pistas/s.** Tipo: tesis técnica; confianza media para el cálculo histórico documentado, sin garantía de capacidad útil de un participante.

Son tasas de la estructura descrita, no presupuesto individual: las ranuras se reparten entre participantes y funciones, existen requisitos de redundancia/relé, y cada mensaje tiene estructura y restricciones. No convertirlas en tasa de pistas dividiendo por un tamaño de mensaje inventado. No se obtuvo una tabla abierta de requisitos J3.2 por modo/red que justifique un refresco fijo para el juego.

La tesis contiene un desliz tipográfico **«7.1825 msec»** en un párrafo de §2.7.1, mientras repite **7.8125 ms** y **1/128 s** en la definición y el modelo. Se registra la diferencia; no se usa el desliz como dato alternativo. Sus simulaciones de **IP/IPSec sobre Link 16** no son mediciones de latencia de pistas J-series ni de redes ucranianas.

### Qué significa la marca temporal ASTERIX

[L2], `I048/140`, p. impresa 40, establece que la marca representa el **instante exacto del evento**, en pasos de **1/128 s desde la medianoche**, y recomienda una fuente horaria sincronizada. **No establece que cada pista se publique cada 1/128 s.** Tipo: norma primaria; confianza alta en esa semántica.

[L3], apéndice A CAT048, edición **1.13**, §2.3, «Time Offset for POS and GA», codifica un desplazamiento relativo con LSB **1/128 s**. También es resolución de un campo temporal, no demora de procesamiento. No confundir el **apéndice de expansión reservada** con la norma base.

Para estimar la edad de una pista harían falta tanto la marca del evento como la hora de recepción, relojes comparables y una descripción de cualquier extrapolación intermedia. Una pista extrapolada a «ahora» puede conservar incertidumbre del dato viejo. El fabricante de un sensor puede soportar ASTERIX sin que un interceptor acepte ese flujo como datos de guiado.

## Tabla por gateway solicitado

| Interfaz / ruta | Existencia con respaldo primario leído | Demora añadida | Resultado de búsqueda y límite |
|---|---|---|---|
| **Link 16 ↔ Delta** | **NF** para una implementación concreta y operativa | **NF**, unidades esperadas s o ms pero sin valor | Sitio del Ministerio de Defensa ucraniano y ruta de noticia de interoperabilidad [L6] bloqueados. No se confirma un gateway a partir del título de una ruta no leída. |
| **Link 16 ↔ Kropyva** | **NF** | **NF** | Referencias C2 del proyecto [L8] no publican aquí un esquema o ensayo de este gateway. Recepción en tablet no prueba interfaz al control de tiro. |
| **Link 16 ↔ redes/sistemas ucranianos, acuerdo CSI** | Referencia secundaria ya registrada en el proyecto; **sin nueva verificación primaria** en esta consulta | **NF** | [L7], Defense Express, acceso bloqueado; acuerdo no demuestra conexión universal, prioridad de mensajes ni calidad de tiro. |
| **ASTERIX → pasarela C2 → sistema de armas** | Posibilidad de formatos no certifica una implementación | **NF** | [L2] describe reportes; faltan interfaces/versiones, campos preservados y ensayos del sistema receptor. |

**Delta, Kropyva, ASTERIX y Link 16 pertenecen a capas distintas.** No tratarlos como cuatro modelos equivalentes de módem. La coordinación de mando puede transmitir alertas y asignar tareas aun cuando no exista una interfaz digital compatible para transferir una pista de tiro al arma.

## Qué registrar antes de reemplazar valores de juego

Un dato utilizable de latencia debe identificar origen/destino, variante y versión, mensaje/producto, fecha de medida, carga de red, relés/pasarelas, estadística y condiciones de pérdida. «Typical» sin esas condiciones no equivale a límite máximo. Un promedio y un percentil son distintos; no se propone aquí un valor inventado para ninguno.

Para compatibilidad de tiro, además de existencia del enlace: identidad y referencia geográfica, posición/velocidad, edad y covarianza/calidad, sincronización y autorización del receptor. El guiado del misil puede imponer sensor propio o iluminación continua aunque el C2 publique una pista externa.

Los tiempos generales de coordinación del simulador documentados en [C2 y datalink](c2-datalink.md) son **parámetros de juego**, no mediciones de Link 16, ASTERIX o las redes rusas. Esta entrega no los valida ni los reemplaza.

## Fuentes

- **[L1] Tesis técnica pública, leída en secciones citadas:** Clinton W. Stinson, *Internet Protocol (IP) over Link-16*, AFIT/GCE/ENG/03-04, marzo 2003, §2.7–2.7.1, pp. 2-17–2-18; ranuras en PDF p. 35. Distribución pública ilimitada. [PDF DTIC ADA420762](https://archive.org/download/DTIC_ADA420762/DTIC_ADA420762.pdf). Describe waveform existente citando bibliografía; no reemplaza STANAG/ICD por variante ni un ensayo operativo.
- **[L2] Especificación primaria, leída:** EUROCONTROL, *Specification for Surveillance Data Exchange — Monoradar Target Reports, ASTERIX Part 4 Category 048*, edición 1.32, julio 2024, §4.6 p. 12 y §5.2.17 p. 40 / PDF p. 50. [PDF](https://www.eurocontrol.int/sites/default/files/2024-07/eurocontrol-cat048-part4-edition-1-32.pdf). [Página base](https://www.eurocontrol.int/publication/cat048-eurocontrol-specification-surveillance-data-exchange-asterix-part4).
- **[L3] Especificación primaria, leída:** EUROCONTROL, *ASTERIX Category 048 Appendix A — Reserved Expansion Field*, edición 1.13, diciembre 2024, §2.3, subcampo «Time Offset for POS and GA». [PDF](https://www.eurocontrol.int/sites/default/files/2024-12/eurocontrol-cat-048-appendix-a-p4-ed1-13.pdf). [Introducción oficial ASTERIX](https://www.eurocontrol.int/asterix), formato de intercambio de vigilancia.
- **[L4] Fabricante, acceso fallido 503:** Rosoboronexport, *Polyana-D4M1 (9S52M1)*, [ruta referenciada por el catálogo](https://roe.ru/en/production/protivovozdushnaya-oborona/avtomatizirovannye-sistemy-upravleniya/bazovyy-komplekt-podsistemy-upravleniya-pvo-edinoy-sistemy-upravleniya-voyskami-silami-i-oruzhiem-v/asu-polyana-d4m1/). No se presenta el contenido como leído.
- **[L5] OSINT técnico, bloqueado 403:** Armada International, ruta *Russian Air Defence Command and Control*. [Referencia](https://www.armadainternational.com/2023/08/russian-air-defence-command-and-control/).
- **[L6] Institucional, bloqueado 403:** Ministerio de Defensa de Ucrania, [sitio de noticias](https://mod.gov.ua/en/news) y [ruta consultada de interoperabilidad Delta](https://mod.gov.ua/en/news/delta-combat-system-has-successfully-passed-interoperability-testing-with-nato-systems). No se verificó contenido ni validez editorial de la ruta; no constituye evidencia positiva.
- **[L7] OSINT, bloqueado 403 en esta consulta:** Defense Express, *Ukrainian Patriots, F-16s and Mirages to Join NATO's “Military Wi-Fi” Network via Link-16 Integration*. [Referencia del proyecto](https://en.defence-ua.com/weapon_and_tech/ukrainian_patriots_f_16s_and_mirages_to_join_natos_military_wi_fi_network_via_link_16_integration-14708.html).
- **[L8] Registro previo del proyecto:** [Mejoras de física, apartado de enlaces y fuentes](mejoras-fisica.md), y [C2-datalink](c2-datalink.md). Sirve como inventario de referencias, no como nueva medición primaria.

No se usaron cifras de juegos para completar demoras desconocidas ni se atribuyó calidad de tiro por pertenecer al mismo bando.
