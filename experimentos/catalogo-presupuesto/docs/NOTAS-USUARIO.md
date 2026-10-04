# Notas del usuario pendientes de implementación

Fecha: 4 de octubre de 2026 (America/Buenos_Aires). El usuario pidió ir anotando estas observaciones sin corregirlas inmediatamente. Esta lista no cambia el motor ni las reglas actuales.

## Enteros donde representan cantidades discretas

Pedido: no admitir decimales donde no corresponden, por ejemplo munición, unidades y cantidades de disparos.

Lectura actual: `bindNumber` ya consulta validez del input; campos de munición/cantidad usan el paso entero por defecto y recuperan el valor válido al perder foco. El importador JSON exige enteros para `mag`, `reserve`, `salvo` y `count`. La comprobación posterior en Chromium sobre la base `9cafba0` confirma que introducir 1,5 en `mag`, `reserve` o `salvo` no llega al estado, blur recupera el valor válido, el guardado conserva enteros e importar `mag: 1.5` se rechaza. Poder escribir provisionalmente un decimal no equivale a guardarlo. Queda ampliar otros campos y la comunicación del error; no se demostró un bug de estado en esos tres campos.

Propuesta a revisar: declarar explícitamente los campos enteros y sus mensajes de error, validarlos por su semántica además del control HTML y ampliar pruebas de pegado/edición/guardar-cargar. No redondear silenciosamente munición fraccionaria. Conservar decimales legítimos en magnitudes continuas; no forzar todas las cifras del juego a enteros.

En la demo aislada de esta PR sí se verificó en navegador que intentar preparar 1,5 consumibles no cambia el inventario y produce un error.

## Aclarar C2 frente a datalink

El usuario no entiende claramente la distinción en la interfaz. Pregunta cómo elegir por unidad su participación en el mando/control, por ejemplo S-200 o S-125, independientemente del enlace técnico.

Lectura actual:

- `S.c2` define un nivel global de coordinación de la defensa.
- `u.link` enciende o apaga los transportes técnicos definidos para esa unidad; no desconecta por sí mismo toda coordinación C2.
- `DATALINKS.ua_c2` aparece rotulado «Red C2 nacional ucraniana», aunque está en el catálogo de transportes técnicos/pasarelas. Esa mezcla de nombres ayuda a explicar la confusión.
- Las alertas C2 pueden transmitirse en el modelo aun con el enlace de pistas apagado.

Propuesta de interfaz: controles distintos «Participa en la red de mando», «Enlace técnico de pistas activo» y «Capacidades compatibles». Mostrar qué deja de funcionar al apagar cada uno. La integración C2 no debe autorizar empleo remoto sin una cadena técnica sustentada.

Al diseñar pertenencia por unidad, definir red/grupo, canal humano o técnico, estado de conexión y coordinación local. No prometer que esta PR ya lo implementa, ni inferir conectividad nativa a partir del nombre «C2».

Las capturas del usuario muestran el S-125 con «Datalink nativo: Red C2 nacional ucraniana» y un tooltip que aclara que las alertas C2 pueden seguir llegando con el enlace apagado. El selector global de coordinación aparece en el panel izquierdo. Registrar que hoy no hay un control separado de pertenencia C2 por unidad, en vez de explicar el checkbox de datalink como si fuera ese control.

La captura de la Academia dice «No se modelan los enlaces por sistema (Link 16 contra la red nacional); ver ROADMAP», mientras la ficha muestra familias concretas. Revisar esa posible desactualización contra la versión que corre el usuario; no se cambió aquí el texto de Academia. El usuario usa un `index.html` descargado, cuya revisión no se conoce sólo por la imagen.

## Señuelos: regla por unidad y edición de grupos

Pedido: reemplazar el único interruptor global por posibilidad de configurar unidades individuales o seleccionadas en grupo. Algunas pueden ignorar pistas clasificadas como señuelo y otras no.

Propuesta: doctrina heredada del bando con opciones por unidad «heredar / no disparar / permitir disparo». Selección múltiple para aplicar una política al grupo y estado visual «mixto» si tienen decisiones distintas. No convertir un toggle de grupo en cambio accidental de todo el bando.

El criterio es la clasificación conocida por la unidad, con sus posibles errores, no saber por el estado real si el contacto es un señuelo. Hoy el motor usa `th.clsAs` y un interruptor global; la nueva perspectiva de Claude debe acordar el alcance local de esa clasificación.

## Selección múltiple

Pedido: seleccionar varias unidades como varios archivos, para actuar sobre el conjunto.

Propuesta por revisar: modificador para agregar/quitar, rectángulo de selección y panel de propiedades comunes. Aplicar sólo a unidades editables/propias según modo; no usar la selección para acceder a contactos o propiedades secretos. Los cambios mixtos requieren una acción explícita y no deben reemplazarse al refrescar el panel.

## BLUEFOR / REDFOR visibles, especialmente en EW

Pedido: identificar bien a qué bando pertenece cada elemento; permitir combinaciones de material sin que resulte confuso. La pestaña de guerra electrónica mezcla equipos y genera dudas.

Separar nacionalidad/disponibilidad del catálogo, propietario desplegado y rol actual. Un equipo ucraniano puede actuar como atacante en un ejercicio; su procedencia no indica automáticamente a qué bando sirve el efecto de interferencia.

Propuesta: etiqueta de bando más icono/texto, agrupación o filtros, y una indicación separada del efecto («perturba sensores», «actúa contra navegación»). No limitarse al color, ni forzar propietario a partir del país del fabricante.

## Tecla Delete para borrar la unidad seleccionada

Pedido: al apretar `Delete`, borrar la unidad seleccionada.

Criterios propuestos: sólo durante edición/preparación; no cuando el foco está en input, textarea, select o contenido editable; no borrar unidades durante simulación. Mantener consistencia con el botón de eliminar y sus efectos sobre referencias/objetivos/rutas.

Con selección múltiple, definir confirmación y alcance antes de borrar un grupo. No confundir borrar del editor con una baja de campaña. No implementar por ahora, conforme al pedido de registrar las ideas.

Observación posterior en Chromium: `Delete` no elimina la defensa seleccionada en el main base. Se conservó como pendiente, sin tocar `src/ui/input.js`. Diagnóstico reproducible en `tests/simulator-observations.browser.mjs`; observa la situación actual, no es una prueba de aceptación de la feature futura.

## Realismo, no ajuste de balance

Confirmación del usuario: conservar escenarios de referencia al mejorar física. No aumentar automáticamente el ataque para recuperar la tasa de victoria anterior. Una variante más difícil es un escenario separado con sus condiciones explícitas.

El pedido de volver Kiev a siete Kh-101 todavía no aparece aplicado en el main examinado; no se cambia desde esta PR experimental.
