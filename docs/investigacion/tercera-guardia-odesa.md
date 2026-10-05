# Continuación opcional de Odesa

`experimentos/catalogo-presupuesto/data/port-campaign-extended.mjs` exporta
`extendedPortCampaignDefinition(selection)`. Usa las mismas elecciones y el mismo
contrato de `portCampaignDefinition`; no modifica esa fábrica ni el controlador
de campaña de `src/ui/`. La integración nativa actual sigue creando dos guardias.

La definición opcional agrega una tercera guardia 24 horas después del cierre de
la segunda. Reutiliza **od_puertos sin modificar las salvas**: es otro ejercicio
hipotético con el escenario existente, no una reconstrucción de una tercera
noche histórica ni una nueva investigación sobre el ataque. Los tres resultados
de la segunda guardia permiten continuar; esa orden de permanecer en el sector es
una regla del ejercicio, incluso si se fracasó. La tercera termina la campaña.

Se mantienen el saldo, los límites de suministro ya gastados, los repuestos, los
trabajos, el stock por munición, los componentes y el daño de infraestructura.
La asignación reservada para la segunda guardia permanece disponible en la
tercera con su estado real. No se conceden medios nuevos, curación, recargas o
bonificaciones. Un puerto perdido puede impedir cumplir una meta posterior:
esta continuación no promete recuperar el resultado ni equilibrar la dificultad.

La definición conserva el identificador de la familia Odesa porque utiliza los
mismos medios y formato de guardado. El guardado incluye la definición completa,
por lo que las partidas de dos guardias siguen teniendo dos; no se migran ni se
extienden en silencio. La pantalla nativa admite cargar una partida estratégica
creada con esta definición, sin cambiar las APIs del libro de recursos.

Verificación: prueba de tres combates con el motor real, guardado/replay entre
guardias y comprobación de que ni los daños ni cuatro disparos consumidos se
restauran. No se usa un parte inventado para avanzar entre batallas.

```sh
node --test experimentos/catalogo-presupuesto/tests/port-campaign-extended.test.mjs
node experimentos/catalogo-presupuesto/tests/port-extended.browser.mjs
```

La prueba de Chromium carga la partida de tres guardias por la pantalla nativa,
ejecuta sus tres combates con el mismo controlador y descarga/restaura el estado
final. Usa Playwright (`PLAYWRIGHT_MODULE` y `CHROMIUM_PATH` opcionales). Corre sin
solicitudes a sitios externos; es una prueba contra el servidor fuente, no una
afirmación de funcionamiento de esta opción en un bundle antiguo.

Para ofrecerla como opción nueva en el menú, el controlador nativo deberá elegir
la fábrica de tres guardias explícitamente. Ese cambio queda a cargo del PR de
integración de Claude; esta entrega sólo añade definición, pruebas y documentación.
