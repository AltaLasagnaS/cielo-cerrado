# Continuidad de recursos y briefing: contrato ejecutable

Estado: laboratorio experimental, no campaña jugable ni sistema de comunicaciones. Importaciones sólo entre módulos de esta carpeta; sin DOM en librerías, sin RNG ni llamadas al simulador.

## Un libro económico, varias misiones de prueba

`createPlan()` admite `missionId` inicial opcional; por compatibilidad, omitirlo crea `mission-initial`. `activate` compromete adquisiciones reservadas: su estado pasa a `committed`, de modo que una misión posterior no permite reembolsar equipo utilizado como si fuera una reserva nueva.

`finish` cierra la misión. Sólo entonces se acepta:

```js
applyCommand(plan, {
  kind: 'begin-mission', commandId: 'transition-second', sideId: 'blue',
  missionId: 'second', elapsedSeconds: 3600
});
```

La transición mantiene balance, ofertas/cotizaciones y disponibilidad remanente, inventario listo/reserva/consumido y adquisiciones previas. Permite planificar nuevas reservas con los recursos remanentes, no crea otro presupuesto ni recupera munición usada. Los pedidos nuevos pueden cancelarse antes de activarse; los comprometidos no.

`elapsedSeconds` es entero no negativo, y sólo registra intervalo entre misiones. No representa duración del combate ni provoca reparación, entrega, descarga o recarga. La campaña real necesitará el tiempo simulado del motor y sus estados físicos. Los consumidos son acumulados, no una cuenta por misión.

Se limitan 100 misiones y 10.000 comandos por libro. IDs de misión únicos; IDs de comando únicos globalmente salvo reintento idéntico. Los eventos se guardan y reconstruyen desde el inicio, incluidos transiciones, sin confiar en snapshots de saldo. El formato v1 anterior sin `missionId` sigue cargando; los consumidores anteriores no entenderán el comando nuevo `begin-mission` y deberán actualizarse. Es un formato experimental, no una migración del guardado del juego.

No se admiten pérdidas de equipos, nuevas cotizaciones, refuerzos o subvenciones en este alcance. No fingir que un equipo durable conservado está ileso: aquí no hay daño ni ubicación. Cuando se integren deben venir del único estado físico autorizado, no de reglas paralelas del presupuesto.

## Briefing de preparación, no vista del combate

`buildPreparationBriefing(plan, input)` sólo admite un libro auténtico en fase `planning` y el mismo `sideId`/`missionId`. Ataque/defensa se elige independientemente de blue/red.

El input acepta exactamente título, rol, emisión, objetivos públicos e informes autorizados. No acepta mundo enemigo, rutas futuras, presupuestos ajenos ni referencias internas de entidades. El output contiene recursos de ese libro, no la configuración completa ni su auditoría.

Reportes: `id`, `text`, `confidence` (`confirmed`, `probable`, `unconfirmed`), `sourceLabel`, `observedAtSeconds`, `receivedAtSeconds`. Tiempos enteros de una línea temporal común; se permiten negativos para inteligencia anterior a la emisión inicial. Se exige observación ≤ recepción ≤ emisión. La antigüedad sale de observación, no de recepción: retransmitir no rejuvenece un reporte.

Objetivos: `id`, `text`, `deadlineSeconds` (relativo al inicio de misión, o `null`). Son instrucciones públicas, no evaluación real, HP enemigo ni comprobación de victoria. `issuedAtSeconds` usa el reloj del escenario; no se deriva del intervalo económico entre misiones, que no registra duración del combate.

El llamador sigue siendo responsable de autorizar textos y certeza: el validador no puede detectar secretos escritos en prosa. Tampoco es una frontera de seguridad ni impide inspeccionar archivos locales. Debe conectarse después a la perspectiva que implemente Claude, y no usarse durante combate para exponer existencias reales de unidades aisladas.

Los exportados son inmutables, listas acotadas a 100 y texto de hasta 2.000 caracteres por campo. Renderizar como texto, nunca `innerHTML`. Las pruebas muestran el contrato de aislamiento en esta API, no certifican ausencia de fugas en la interfaz del simulador.

## Ejecutar

```bash
node --test experimentos/catalogo-presupuesto/tests/*.test.mjs
node experimentos/catalogo-presupuesto/scripts/campaign-demo.mjs
```

La demo usa precios, equipos e informes ficticios. Una segunda misión es una segunda etapa del libro, no una nueva batalla.
