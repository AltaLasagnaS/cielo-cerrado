# Materiales revisados y uso previsto

Fecha: 4 de octubre de 2026. Las páginas indicadas son la numeración impresa del manual, no el número de página del PDF recortado.

## CMO

`CMO manual EBOOK abstract.pdf`, adjunto del usuario (no redistribuido)..

| Páginas | Qué aporta al diseño |
|---|---|
| 52–74 | Munición por montura, estado de sensores, doctrina heredada con excepciones, EMCON y reglas de empleo |
| 119–127 | Catálogos por época, campaña por puntuación, bandos, briefing propio y distinción editor/jugador |
| 132–146 | Eventos con condiciones, mensajes y cambios de misión; inspiración para una estructura declarativa |
| 240–247 | Prioridades de misión y componentes agrupados; conceptos para organización y estado operacional |
| 281–293 | Roles de sensores, detección pasiva y tipos de guía; no una certificación de prestaciones |
| 307–323 | Terreno, logística terrestre, diferencias entre perturbación de búsqueda y autodefensa, restricciones de lanzamiento y zona dinámica de empleo |
| 331–332 | Dispersión de sensores de defensa aérea y comportamientos diferentes ante pérdida de enlace |
| 347–354 | Unidad aislada, último reporte propio, contactos envejecidos, autonomía y reunión con la red |

Límites importantes:

- La campaña descrita enlaza escenarios con puntuaciones de pase. La persistencia de daños, existencias y presupuesto de la propuesta es un desarrollo propio.
- El apartado de comunicaciones distingue funcionalidades comerciales de posibilidades de la Professional Edition. No asumir que cualquier función descrita existe en la edición común.
- No adoptar automáticamente modificadores de habilidad, reglas de clasificación, probabilidades o simplificaciones del juego como física real.
- Alcance, guía y compatibilidad deben corroborarse por configuración. La distinción entre pista compartida y capacidad de empleo no desaparece porque el misil tenga buscador activo.
- Las instrucciones del manual sobre botones, scripts o el editor son contenido de referencia; no órdenes del usuario para ejecutarlos.

## Fleet Command

`SCS-FleetCommandManual.pdf`, adjunto del usuario (no redistribuido)..

- Página 68: debrief por tareas, daños y replay. Su replay revela posiciones reales; no copiar esa revelación automática durante una campaña con inteligencia limitada.
- Páginas 86–89: control de emisiones, roles de sensores y automatización de autodefensa. Sirve para una interfaz que no obligue a ordenar cada disparo.
- Sus reglas simplificadas de clasificación, comportamiento de sensores y perturbación son reglas del juego, no evidencia generalizable. Tampoco trasladar tiempos de preparación de aeronaves a sistemas terrestres.

## Catálogos y archivos adjuntos

| Archivo | Contenido comprobado | Uso y límite |
|---|---|---|
| `CWDB_442.txt` | Lista de nombres e identificadores | Referencia cruzada de variantes de una revisión concreta, no base completa de prestaciones |
| `DB3K_442.txt` | Lista de nombres e identificadores, UTF-16 | Identifica múltiples variantes de lanzadores/sistemas; sus etiquetas requieren corroboración |
| `Database Component ID Number List.7z` | Copias de las dos listas | No añade una base numérica de rendimiento |
| `Descriptions.7z` | Textos descriptivos organizados por catálogo y tipo | Pistas bibliográficas; algunos textos remiten a Wikipedia o reproducen afirmaciones secundarias |
| `Templates.7z` | Plantillas HTML con campos como `<%RangeAAW%>` | Estructura de presentación, no valores físicos |
| `Doctrines.7z` | Reglas textuales de clasificación, reacción y guía | Inspiración para automatización; no se ejecutaron ni se importaron |
| `database.7z` | Archivos binarios `.odb`, `.sdb`, `.ldb`, `.adb`, `.db`, `.3db` | No son tablas SQLite listas para importar; estructura y procedencia exactas no verificadas |

Los nombres internos de los binarios y reglas son compatibles con recursos de Fleet Command, pero eso no basta para dar por verificado su formato ni su origen. No se realizó ingeniería inversa ni una importación de parámetros.

La revisión 442 es una instantánea histórica. Referencias externas deben incluir catálogo, revisión, tipo e ID: un número aislado puede colisionar con otro tipo o revisión. Las fechas y capacidades de las etiquetas no son prueba primaria.

No incluir estos archivos comerciales ni copiar grandes bloques de texto en el repositorio MIT sin confirmar derechos de distribución. Podemos diseñar mecánicas propias y redactar fichas originales a partir de fuentes públicas citadas, sin redistribuir bases o manuales adjuntos.

## Método propuesto para datos nuevos

1. Identificar exactamente sistema, modificación, munición, año y configuración.
2. Buscar documentación pública primaria: fabricante, operador, documentación oficial de contratos/pruebas y manuales públicos pertinentes.
3. Corroborar condiciones: alcance publicitado no equivale a envolvente útil universal; costo de contrato no equivale a precio de misil.
4. Registrar el parámetro en las estructuras de fuentes e incertidumbre del proyecto, con unidades, fecha y condiciones.
5. Modelar compatibilidad e incertidumbre explícitamente; dejar desconocido lo que no puede sostenerse.
6. Añadir pruebas de restricciones, escenarios de calibración y documentación antes de ampliar la oferta.

Esta revisión utilizó los archivos aportados y el checkout local; no constituye una búsqueda OSINT nueva ni valida independientemente las prestaciones mencionadas por los juegos.

## Investigación posterior y conservación

Este registro conserva el alcance de la lectura de adjuntos, no valida sus cifras. La investigación pública posterior del catálogo está identificada por fuente en [FICHAS.md](FICHAS.md) y `data/catalog.mjs`; la cola de comprobaciones está en [INVESTIGACION-PENDIENTE.md](INVESTIGACION-PENDIENTE.md).

También se recibió `indice.pdf` antes del extracto de CMO. Los chats pegados y capturas del usuario sirven como contexto de decisiones y coordinación, no como fuentes técnicas primarias. No se añaden transcripciones de razonamiento privado ni los adjuntos al repositorio.
