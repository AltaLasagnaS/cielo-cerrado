# Estado y relevo: leer primero

Registro original: 4 de octubre de 2026, base `9cafba0`. Reconciliado el 5 de octubre contra `main` `f0428e4` (merge #68, que incluye #61 y su integración de campaña). #64 ya incorporó perspectivas y tiro observado; #42 incorporó el perfil del interceptor y #43 el paquete experimental; #47 corrigió Kiev/solveTd y #49 la UX chica. Los estados de documentos en `archivo/` son históricos, no estados actuales.

## Qué pidió el usuario

Conservar todo lo conversado y el trabajo previo, mantener la estructura del proyecto y avanzar sólo donde no se superponga con Claude. Realismo antes que balance; dos perspectivas restringidas, presupuesto y briefing propios, más variantes, movilidad/logística, campaña persistente y aviación después. También registrar y tratar los pedidos de interfaz sin confundirlos con cambios ya realizados.

## Índice de continuidad

- [PLAN-MAESTRO.md](PLAN-MAESTRO.md): visión completa, etapas y criterios transversales.
- [DECISIONES.md](DECISIONES.md): decisiones estables y alternativas descartadas.
- [PENDIENTES.md](PENDIENTES.md): pedidos identificados y criterios de cierre.
- [INVESTIGACION-PENDIENTE.md](INVESTIGACION-PENDIENTE.md): evidencia que falta, sin rellenar vacíos.
- [REFERENCIAS.md](REFERENCIAS.md): qué aportaron los manuales y adjuntos, y qué no prueban.
- [FICHAS.md](FICHAS.md): fuentes públicas y catálogo de referencia.
- [BRIEFING-CAMPANA.md](BRIEFING-CAMPANA.md): integración futura de misión/campaña.
- [PROTOCOLO-PROTOTIPO.md](PROTOCOLO-PROTOTIPO.md): contrato ejecutable nuevo y limitaciones.
- [INTEGRACION.md](INTEGRACION.md): reparto de archivos y revisión antes de conectar al juego.
- [NOTAS-USUARIO.md](NOTAS-USUARIO.md): contexto de las observaciones de interfaz.
- [VERIFICACION.md](VERIFICACION.md): pruebas ejecutadas y límites concretos de lo comprobado.
- [MENSAJE-PARA-CLAUDE.md](MENSAJE-PARA-CLAUDE.md): relevo listo para copiar, no enviado automáticamente.
- [COMPONENTES-E-INVENTARIO.md](COMPONENTES-E-INVENTARIO.md): contrato ejecutable de munición tipada, dependencias y pérdidas.
- [LOGISTICA-Y-CONTINUIDAD.md](LOGISTICA-Y-CONTINUIDAD.md): contrato de plazos, recursos, tránsito y reparación; integrado a la campaña nativa en #68.
- [AUTONOMIA-2026-10-05.md](AUTONOMIA-2026-10-05.md): autorización de coordinación directa, entregas y dependencias actuales.
- `archivo/`: contrato, matriz y entrega externos originales preservados, con advertencia histórica.

## Estado real de funcionalidades

| Área | Qué hay | Qué NO hay todavía |
|---|---|---|
| Catálogo | Referencias, fuentes y validadores; diez candidatos deshabilitados | Nuevas configuraciones activas o prestaciones/precios certificados |
| Presupuesto | Pantalla de campaña nativa con asignación, compras/plazos/cancelación; libro único conectado al combate (#68) | Precios reales certificados (controles de campaña Q05 cerrados en #69) |
| Componentes/logística | Inventario tipado por depósito/lanzador, cargas explícitas, daño autorizado, tránsito, entregas, reparación con fondos/repuestos; puente conectado al controlador nativo | Variantes nuevas activas, trayectos geográficos y severidad de averías documentada |
| Continuidad | Dos guardias nativas con daño/munición/ofertas/fondos/repuestos/trabajos, posiciones, reloj e informes persistentes; guardado estratégico con replay | Campaña atacante (la tercera guardia ya se elige en el menú desde #69) y restauración del mundo durante combate |
| Briefing propio | Preparación, recursos y reportes fechados; contactos en combate y parte propio, perspectivas/tiro observado (#64/#68) | BDA incierto y política de revelación del resultado para la campaña atacante; auditoría de aislamiento completa |
| Pedidos de interfaz | Delete/enteros/explicación C2, regla, track, doctrina, selección múltiple/rectángulo, rótulos y C2 individual en main | Menú/tutorial experimental #66 pendiente de integración (controles de campaña Q05 cerrados en #69) |
| Física | `solveTd` corregido en main; investigación independiente #54–58. No se modifica desde esta entrega | Validación completa de todos los supuestos; los datos desconocidos no se completan artificialmente |

La lógica de recursos sigue en `experimentos/catalogo-presupuesto/`; desde #68 `src/ui/campaign.js` importa sus módulos directamente, sin copiarlos. La extensión de tres guardias agrega una definición opcional y pruebas; no modifica los ataques del catálogo ni las golden. Su documentación está en `docs/investigacion/tercera-guardia-odesa.md` desde la raíz del repositorio.

## Reparto conservador mientras no haya nuevo acuerdo

Claude conserva `ROADMAP.md`, `src/`, física/simulación, catálogo activo, incertidumbre, render/UI, pruebas activas y documentación generada. Su siguiente asignación concreta debe verificarse antes de asumir que terminó o quedó libre un área.

Codex trabaja en esta carpeta experimental: documentos originales, fuentes/fichas, contratos, presupuesto, continuidad y sus pruebas. No editar el mismo archivo porque una rama sea distinta: eso evita algunos conflictos de Git, no conflictos semánticos.

Cada ampliación exige designar un único responsable para los archivos compartidos. No copiar la carpeta experimental entera al motor ni habilitar todos sus candidatos. Los bugs de controles de campaña se entregaron a Claude por [GitHub](https://github.com/AltaLasagnaS/cielo-cerrado/issues/62#issuecomment-6002465534); su integración conserva `src/ui/`.

## Siguiente entrega segura

1. Revisar conocimiento por bando (los controles de campaña Q05 quedaron cerrados en #69 con prueba de regresión).
2. Completar una configuración del catálogo por vez, sin tocar consumidores hasta tener evidencia suficiente.
3. Mantener el reparto confirmado: Claude integró la selección de dos/tres guardias en `src/` (#69); Codex entrega definición/pruebas aparte y actualiza #63/#65/#66/#67 contra main.
4. Continuar variantes verificadas, movilidad y campaña atacante; presupuesto/logística/persistencia de dos guardias ya funcionan en la pantalla nativa.

## Cómo retomar sin perder contexto

Leer este documento y `DECISIONES.md`; hacer fetch del último main, revisar las PR abiertas y el árbol local sin descartar cambios ajenos; reconciliar el estado de cada pendiente. Ejecutar la suite experimental y `npm run check` del proyecto antes de publicar.

La PR #43 ya conserva la primera entrega en GitHub. Esta continuación debe publicarse como otra PR contra main, sin merge automático. La carpeta externa y el archivo comprimido antiguo no son la fuente actual del prototipo.
