# Integración sin pisar el roadmap

## Estado y evidencia

Este paquete se incorpora exclusivamente en `experimentos/catalogo-presupuesto/`, con una workflow independiente. No modifica consumidores del motor ni archivos de Claude. La preparación original estaba fuera del checkout; esta entrega permite revisarla en una PR aislada.

Base local examinada: `bb0d718`, anterior al interceptor de #41. Sobre #41, la última actualización de Claude informa calibración y comparaciones terminadas, `npm run check` completo y CI verde en el último commit. Estos resultados no se verificaron de forma independiente aquí.

Actualización verificada después: `git fetch --no-tags origin main` y lectura de `FETCH_HEAD` confirman `main` en `4bbb5a2`, merge del #42, con los commits del perfil y la tabla nueva. #41 no había llevado el cambio al main correcto; #42 lo incorpora. La copia de trabajo sigue en `bb0d718`, sin checkout/pull ni cambios de archivos. Se verificó presencia de código y escenario, no se ejecutó aquí la suite del main nuevo ni se consultó su CI.

El usuario confirmó que prioriza realismo. Recomendación comunicada: conservar Kiev con sus siete Kh-101 de referencia, sin el incremento a nueve destinado sólo a recuperar el porcentaje anterior. No se aplicó aquí esa reversión ni se cambió el PR.

En `4bbb5a2` Kiev todavía declara nueve Kh-101, tanto en briefing como en la salva. El pedido de revertirlo aparece en la captura después del bloqueo por límite de la sesión de Claude; no hay confirmación de su ejecución.

## Responsables

- Claude: roadmap, motor, física, daño/clima, render, catálogo activo y las pruebas/documentación necesarias para sus cambios, además de sus tareas posteriores de perspectiva/repetición/técnica.
- Codex: catálogo de referencia, fichas/fuentes, contratos, prototipo económico y diseño de briefing/campaña.
- Archivos compartidos: un responsable por entrega, con acuerdo previo. Una rama por sí sola no evita pisarse si se trabaja en la misma carpeta.

## Secuencia recomendada de PR

1. Claude cierra su rama de física y sus dependencias. Revisar el escenario de Kiev y las simplificaciones del MANPADS; no mezclar nuevas unidades todavía.
2. Revisar este paquete de referencia. Elegir ubicaciones nuevas para datos/validación sin cambiar consumidores ni archivos generados.
3. Completar una configuración y su evidencia por vez. Preparar adaptador de datos y migración explícita del legado. No activar diez candidatos simultáneamente.
4. Integrar una primera misión con presupuesto y briefing desde un bando, aprovechando la perspectiva que implemente Claude. El libro económico no consulta la verdad enemiga.
5. Asociar munición lista/reserva a componentes concretos y enlazar eventos de logística/daño de un único motor.
6. Añadir persistencia de campaña después de validar guardado, transiciones y conocimiento por bando.

## Compatibilidad del perfil

El contrato de Claude usa km para rangos, m para alturas, m/s para velocidades y s para `tb`. `tb` es tiempo aproximado hasta `vmax`, no necesariamente duración de motor.

El chequeo independiente comprueba la condición estricta de frenado calibrado y la alternativa sin frenado; no sustituye `solveTd`, `solve` ni `calcPk`. Todavía requiere revisar cómo se muestrean juntos parámetros de `UNC`, especialmente cuando una muestra cambia de rama.

También se reprodujo un caso límite inferior con números ficticios: ver [NOTA-INTERCEPTOR.md](NOTA-INTERCEPTOR.md). No se alteró el motor ni se confirmó impacto en los valores del catálogo.

El MANPADS legado queda sin `vmax/tb`, según su última actualización. Las fichas nuevas no deberían asignarles números sólo para mantener una tasa de victoria o copiar el perfil de otra familia.

## Revisión antes del merge

- Incorporar y revisar el último main, sin ejecutar descartes amplios de cambios locales.
- Resolver diferencias semánticas, no solamente conflictos de Git.
- Verificar datos e incertidumbre por parámetro; registrar cambios `[sim]` justificados.
- Ejecutar tests, lint, build y generación de documentación con los comandos del proyecto ya integrado.
- Confirmar que la interfaz no tiene fugas de información entre bandos; Node no sustituye esa prueba.
- Revisar golden por causa y tamaño de efecto, no regenerarlas para ocultar una regresión.
- Mantener el escenario de referencia para comparar física. No ajustar el ataque sólo para recuperar su estadística anterior.

## Propuesta de regla para CONTRIBUIR

No se editó el archivo activo, pero conviene reemplazar en una entrega coordinada la exigencia de «balancear» todo escenario para evitar victorias constantes por esta regla:

> Medir los escenarios con Monte Carlo y registrar condiciones, incertidumbre y resultados. Un escenario de referencia puede ser asimétrico. Los resultados extremos motivan una auditoría de datos, geometría y modelos, no una obligación de alterar fuerzas. Las variantes didácticas o de dificultad deben identificar sus cambios y mantenerse separadas de la referencia.

Esta regla mantiene la comprobación reproducible y elimina el conflicto con la preferencia de realismo confirmada por el usuario.

## Preservar la entrega

La entrega original externa incluía un archivo `entrega-paralela.tar.gz`; no se añade ese binario al repo. Esta PR versiona directamente las fuentes, documentos y pruebas, sin dependencias, manuales, credenciales ni bases comerciales. Versionarlo no implica que esté integrado al juego.
