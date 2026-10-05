# Campaña con recursos limitados y recorrido de aprendizaje

Registro del pedido del usuario del **5 de octubre de 2026**. **Diseño pendiente**, sin implementación ni cambio del orden del ROADMAP. Amplía los apartados 5 y 7 del [PLAN-MAESTRO](../../experimentos/catalogo-presupuesto/docs/PLAN-MAESTRO.md); no reemplaza lo acordado allí.

## Qué quiere el usuario

El foco del juego, por ahora, es **escenarios y una campaña corta** que permitan entender defensa aérea, radar y guerra electrónica con el mayor realismo que permita la evidencia pública. La recopilación OSINT y el razonamiento sirven para contrastar modelos, detectar contradicciones y declarar lo que falta; no para fabricar prestaciones ni prometer una reconstrucción exacta de hechos desconocidos.

La campaña combina **presupuesto, disponibilidad e inventario heredado**. El jugador ocupa el rol de un comandante con una misión asignada; el rango militar concreto queda pendiente y no es necesario para el primer prototipo.

Ejemplo propuesto por el usuario: **defender un puerto en Odesa** con recursos y limitaciones definidos por el autor del escenario. Puede comenzar con sistemas soviéticos disponibles, reservas finitas y distintas municiones. El dinero permite elegir entre lo disponible; no habilita cualquier equipo del catálogo ni elimina restricciones técnicas o de entrega.

Es un ejemplo de misión para diseñar después; **no documenta una organización, inventario, presupuesto o despliegue real de Odesa**. Una campaña ficticia y una reconstrucción histórica deben identificarse como tales.

## Restricciones que deben ser parte de la misión

| Capa | Qué define el escenario | Consecuencia para el jugador |
|---|---|---|
| Objetivo | Instalaciones o funciones que debe mantener, plazo y condiciones de cumplimiento | El éxito depende de cumplir la tarea, no únicamente de contar derribos. |
| Inteligencia | Lo conocido, probable y desconocido del enemigo | Planifica desde su bando; no ve de antemano las salvas o rutas ocultas. |
| Disponibilidad | Familias, variantes y componentes que puede recibir, con fecha y restricciones | Una configuración costosa puede no estar disponible aun con presupuesto suficiente. |
| Munición | Tipos admitidos, cargados, almacenados y en entrega | Puede administrar una combinación de misiles; sólo cargarlos en configuraciones compatibles. |
| Presupuesto | Asignación y qué gastos incluye | No confundir presupuesto de misión con gasto nacional, ni comprar de nuevo un misil ya en inventario al dispararlo. |
| Logística | Recarga, transporte, mantenimiento y refuerzos disponibles entre misiones | Los recursos tienen ubicación/tiempo; no aparecen de inmediato por pagarlos. |
| Campaña | Qué se conserva y cómo transcurre el tiempo entre escenarios | Pérdidas, daños, municiones consumidas y entregas condicionan la misión siguiente. |

La variedad de misiles, radares y lanzadores debe permitir decisiones con consecuencias documentadas. **No todas las municiones comparten capacidad de carga, control o software.** Hasta que se cierre el contrato de componentes y sus datos, esa selección queda como diseño: no simular mezclas técnicamente inválidas.

Los precios públicos necesitan año, moneda y alcance del contrato. Si falta evidencia económica, mantener la asignación ficticia explícita, como ya indica el plan maestro. Ni los costos ni las restricciones justifican cambiar Pk, velocidad o detección para lograr un balance deseado.

## Progresión de campaña

La propuesta es avanzar **según escenario y situación**, conservando el estado. Nuevos equipos o municiones pueden llegar cuando el guion, la disponibilidad y el tiempo lo permitan. No se propusieron mejoras mágicas de rendimiento por ganar experiencia.

Una primera campaña puede encadenar misiones de la misma responsabilidad de defensa y mostrar cómo cambia la capacidad al consumir munición, perder componentes, reparar o recibir refuerzos. Número de misiones, fechas, inventarios y presupuesto inicial siguen pendientes; no se fijan cifras ficticias bajo apariencia histórica.

Cada misión tiene **briefing previo**, preparación, ejecución y **debrief propio**. En campaña, el debrief no revela automáticamente datos enemigos que seguirían siendo secretos para el siguiente escenario. La reconstrucción completa pertenece al laboratorio o a un cierre explícito de campaña.

Se mantiene el acuerdo previo de poder jugar desde defensa o ataque con información propia. El primer ejemplo de puerto ilustra la perspectiva defensora, sin cancelar el diseño de la atacante. Ambos usan límites de información y recursos; no se trata de habilitar una vista omnisciente al cambiar de pantalla.

## Menú y tutorial

El usuario propone un menú sencillo con estas entradas; los rótulos finales quedan pendientes:

| Entrada | Propósito |
|---|---|
| **Tutorial** | Enseñar a manejar el simulador con ejercicios guiados, objetivos pequeños y explicaciones de lo que ocurrió. |
| **Catálogo / Academia** | Consultar unidades, documentación, fuentes y conceptos. El catálogo de equipos y la explicación conceptual pueden tener secciones claras dentro de esta entrada. |
| **Escenarios** | Elegir misiones independientes; conservar un acceso claro al laboratorio/editor ya previsto. |
| **Campaña** | Iniciar o continuar una secuencia con recursos, pérdidas y conocimiento persistentes. |
| **Ajustes** | Preferencias de uso y presentación. No mezclar preferencias visuales con modificaciones silenciosas de prestaciones físicas. |

El **tutorial es una experiencia guiada**, distinta de abrir una ficha de Academia. Puede enseñar, en orden, preparación y selección; lectura del mapa y medición de distancia; detección/contactos; diferencia entre coordinación C2 y enlace técnico; munición y reglas de empleo; efectos del radar/EW; y lectura del resultado. El orden exacto se valida con una primera misión jugable, sin pedir al principiante que conozca parámetros internos del motor.

La Academia sigue siendo útil como consulta durante el ejercicio. Las explicaciones deben distinguir lo que el jugador observa, lo que el modelo estima y lo que la fuente respalda. No hacer que el tutorial garantice una victoria que la física no produce.

## Cómo retomar este diseño sin pisar la física

Esta nota conserva el pedido mientras Claude trabaja en física. Mantener el orden del plan: perspectivas → variantes/componentes → misión con recursos → operación/logística → campaña. El menú/tutorial pueden diseñarse en paralelo, pero su implementación se coordina con quien esté tocando `src/ui/`.

La primera entrega útil será **una misión de comandante con presupuesto y disponibilidad restringida**, antes de construir toda la campaña. Después se verifica persistencia, guardado/carga y transición entre misiones. No modificar ahora el motor o las golden para materializar esta nota.

Para considerar cumplido el pedido habrá que poder comprobar: configuraciones válidas; conservación de dinero, componentes y munición; pérdidas persistentes; información propia que no filtre al enemigo; objetivos evaluados con reglas explícitas; tutorial comprensible; y prestaciones con fuente o incertidumbre declarada.

## Procedencia y pendientes

Fuente de esta propuesta: **pedido del usuario**, no manual militar, fabricante ni dato OSINT. Los documentos CMO/Fleet Command sirven como inspiración de interfaz y flujo; sus números, si se citan, siguen siendo **estimaciones de juego**.

Continúan pendientes las decisiones editoriales: campaña ficticia o histórica, período, condiciones de asignación, nombre/rango del rol, rótulos finales del menú y cobertura inicial del tutorial. Esta nota no requiere resolverlas para conservar el pedido ni para seguir investigando física.
