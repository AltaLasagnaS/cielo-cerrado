> Archivo histórico: se conserva el trabajo original externo, incluidos sus estados de aquel momento. No usarlo para inferir la situación actual de PR, pruebas o responsables. Consultar [el estado actual](../ESTADO-Y-RELEVO.md).

# Matriz inicial de variantes y evidencia

Estado: borrador de investigación, no catálogo implementado. Preparado fuera del repo para trabajar en paralelo con Claude. Fecha: 4 de octubre de 2026.

Base local: `bb0d718`. El nuevo interceptor no está disponible en este checkout; Claude informa que está subido al PR #41. Ya aclaró campos, unidades y significado de `tb`; el contrato documenta todavía pendientes de muestreo e integración. No se cambiaron prestaciones, golden, fuentes ni archivos generados del proyecto.

## Alcance de esta entrega

Identificar entidades distintas y los datos que faltan para configurarlas. No dar por validadas nuevas envolventes, tiempos de motor, inventarios nacionales ni empleo remoto. Las afirmaciones del fabricante confirman lo que el fabricante declara, no un resultado operacional universal.

| Familia | Entradas que conviene distinguir | Evidencia disponible | Pendiente antes de activar |
|---|---|---|---|
| Patriot | GEM-T; PAC-3 CRI; PAC-3 MSE | Catálogo local separa GEM-T y MSE; listas CMO identifican diversas configuraciones; CSIS confirma evolución de PAC-2 a un interceptor PAC-3 distinto | Fuente específica por munición, revisión de lanzador/control y combinaciones de carga; no deducir CRI/MSE sólo de la palabra PAC-3 |
| NASAMS | AIM-120 por variante verificada; AMRAAM-ER; AIM-9X Block II como ampliación posterior | Kongsberg presenta estas familias para NASAMS y su Multi-Missile Launcher | Variante exacta de AIM-120, versión del sistema, integración, disponibilidad por operador y fecha; no habilitar todo en todos los escenarios |
| S-300P | PT; PT-1; PS, con sus misiles y componentes asociados | Lista DB3K 442 distingue PT/5V55K, PT-1/5V55KD y PS/5V55R; APA distingue generaciones | Corroboración de cada pareja y modernización; no importar directamente los nombres de la lista como relaciones autorizadas |

La familia se identifica para organizar el selector. La configuración verificada autoriza una combinación concreta. Nacionalidad, propietario de la unidad desplegada y bando son atributos separados.

## Observaciones sobre el catálogo local

- `patriot` describe PAC-3 MSE, pero agrupa radar, munición y recursos de batería en una sola entrada. Su `mag` no debe reinterpretarse como capacidad física de un único M903 sin migración explícita.
- `nasams` no identifica una variante específica de AIM-120 en el nombre. Evitar asignarle automáticamente las prestaciones de C7, otra versión o ER.
- `s300` agrupa PS/PT bajo 5V55R. Separarlo requiere conservar el escenario legado, no modificarlo silenciosamente a otra composición.
- Las etiquetas `datalinks` actuales representan el modelo del proyecto. No son, por sí solas, evidencia de capacidad nativa ni de empleo remoto de una combinación nueva.
- `sam.cost` se documenta actualmente como millones de dólares por disparo. No reutilizarlo sin más como costo de adquisición de un sistema o como gasto cobrado al lanzar.

## Estados de evidencia

Para cada relación de compatibilidad registrar uno de estos estados:

- Documentada: una referencia describe esa combinación y su alcance.
- Negativa documentada: existe evidencia de incompatibilidad o una restricción concreta.
- Desconocida: no hay base suficiente para autorizarla.
- Hipótesis de laboratorio: combinación explícitamente experimental, fuera de las configuraciones verificadas.

Desconocida no significa físicamente imposible. En el selector de configuraciones verificadas, tampoco significa disponible. Mostrar el motivo sin inventar una confirmación negativa.

Toda relación lleva configuración, período, fuente y condiciones. Una observación de familia no confirma una variante nacional. Una pista compartida no confirma capacidad de lanzamiento ni guía remotos.

## Ficha mínima que prepararemos por variante

1. Identificador interno propio y nombre inequívoco; aliases y referencias externas con catálogo/revisión/tipo/ID.
2. Familia y variante; fechas documentadas de disponibilidad, sin confundir demostración, contrato y servicio.
3. Configuraciones admitidas: lanzador, control, sensores y modificaciones necesarias.
4. Munición lista y reserva como existencias de la instancia, no valores inmutables del misil.
5. Tipo de guía y necesidades durante sus fases, diferenciadas de comunicaciones generales del bando.
6. Prestaciones públicas con unidades, condiciones y evidencia por parámetro. Campos desconocidos permanecen pendientes.
7. Supuestos del simulador separados de observaciones públicas y declaraciones comerciales.
8. Costos por concepto: munición, equipo, paquete, sostenimiento; año, moneda, alcance y método de normalización.

No copiar una cifra de éxito de pruebas o de campaña como `pk` por clase de blanco. No convertir Mach a m/s sin condiciones atmosféricas declaradas. Los valores legados pueden conservarse en el adaptador con su procedencia de estimación.

## Fuentes consultadas para esta entrega

### Kongsberg: Raytheon Family of Missiles

https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/raytheon-missiles/

Acceso correcto el 4 de octubre de 2026. La página identifica AIM-120, AMRAAM-ER y AIM-9X Block II dentro de la oferta NASAMS. Describe uso del Multi-Missile Launcher. Sus cifras de éxito y mejoras relativas son declaraciones comerciales; esta entrega no las transforma en probabilidades ni alcances absolutos. No establece disponibilidad universal por operador.

### CSIS: Patriot

https://missilethreat.csis.org/system/patriot/

Acceso correcto el 4 de octubre de 2026. Fuente secundaria de contexto: describe la composición general de una batería y el desarrollo de PAC-3 como interceptor distinto. Los extractos revisados no bastan para certificar cargas mixtas ni todos los detalles de CRI/MSE.

### Air Power Australia: familia S-300P/S-400

https://www.ausairpower.net/APA-Grumble-Gargoyle.html

Acceso correcto el 4 de octubre de 2026. Fuente secundaria histórica, con actualización indicada en 2014. Útil para separar generaciones; no tratar sus juicios comparativos, previsiones de integración ni información histórica como situación confirmada de 2026.

### Lockheed Martin: PAC-3

https://www.lockheedmartin.com/en-us/products/pac-3.html

El acceso respondió HTTP 403. No se validó su contenido en esta entrega ni se le atribuyen datos nuevos. Investigar una publicación oficial accesible antes de completar las fichas de CRI/MSE.

### Ampliación de investigación para el paquete independiente

Se localizaron y revisaron las páginas oficiales actuales de RTX para [GEM-T](https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/guidance-enhanced-missile) y [Patriot](https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/global-patriot-solutions), y la página de [NASAMS](https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/nasams-air-defence-system/) de Kongsberg. También se revisó [RBS 70 NG](https://www.saab.com/products/rbs-70-ng) para documentar su diferencia respecto de la ficha genérica IR. Accesos correctos el 4 de octubre de 2026. Ver [fichas](../FICHAS.md).

Las rutas de RTX terminadas en `/patriot` y `/gem-t` devolvieron 404; no se usaron como evidencia. Las páginas válidas se localizaron desde los enlaces del sitio oficial, sin desactivar TLS.

### Material aportado y repositorio

Listas DB3K/CWDB 442, `src/data/defenses.js`, comentarios de su estructura y fuentes existentes. Las referencias ya presentes en el repo no se consideran automáticamente verificadas por esta lectura. Ver [REFERENCIAS.md](../REFERENCIAS.md) para procedencia y derechos de distribución.

## Próxima entrega delimitada

Completar fichas originales de las tres familias, empezando por identificadores, relaciones y fuentes. Los campos ya pueden prepararse con las unidades aclaradas; `tb` se registra como parámetro de aceleración aproximado y no como combustión total por defecto. No publicar nuevos números físicos hasta verificar sus condiciones y resolver los pendientes de integración. La primera PR podrá contener documentación y datos de referencia desacoplados; su ubicación dentro del repo se acuerda antes con Claude para evitar archivos compartidos.

Las fichas estructurales y el prototipo económico ya están preparados en el [paquete paralelo](../../README.md). Completar parámetros físicos, precios y configuraciones concretas sigue pendiente de evidencia e integración; diez entradas de referencia no equivalen a diez unidades nuevas jugables.
