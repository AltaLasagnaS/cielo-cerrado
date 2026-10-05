# Estado y relevo: leer primero

Registro original: 4 de octubre de 2026, base `9cafba0`. Reconciliado el 5 de octubre contra `main` `872b6bf` (merge #53) y #61 experimental. #42 incorporó el perfil del interceptor y #43 el paquete experimental; #47 corrigió Kiev/solveTd y #49 la UX chica. Los estados de documentos en `archivo/` son históricos, no estados actuales.

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
- [LOGISTICA-Y-CONTINUIDAD.md](LOGISTICA-Y-CONTINUIDAD.md): plazos, recursos, tránsito, reparación y demo nuevos, sin integración al juego.
- [AUTONOMIA-2026-10-05.md](AUTONOMIA-2026-10-05.md): autorización de coordinación directa, entregas y dependencias actuales.
- `archivo/`: contrato, matriz y entrega externos originales preservados, con advertencia histórica.

## Estado real de funcionalidades

| Área | Qué hay | Qué NO hay todavía |
|---|---|---|
| Catálogo | Referencias, fuentes y validadores; diez candidatos deshabilitados | Nuevas configuraciones activas o prestaciones/precios certificados |
| Presupuesto | Libro inicial y nueva autoridad logística con compras/plazos/cancelación declarada; una sola munición física | Pantalla económica conectada al combate, precios reales certificados |
| Componentes/logística | Inventario tipado por depósito/lanzador, cargas explícitas, daño autorizado, tránsito, entregas, reparación con fondos/repuestos | Variantes nuevas activas, cálculo físico propio, trayectos geográficos, severidad de averías o autoridad del motor integrada |
| Continuidad | Misiones experimentales conservan equipos/daño/munición/ofertas/fondos/repuestos/trabajos y reloj, con replay | Campaña jugable, objetivos progresivos, cambio de escenario o inteligencia persistente por bando |
| Briefing propio | Proyección de preparación con recursos del libro y reportes autorizados fechados | Niebla de guerra del motor, IA limitada, contactos vivos ni debrief de combate |
| Pedidos de interfaz | Delete/enteros/explicación C2 implementados en main; Academia actualizada. Regla/track/doctrina/multiselección registrados | Regla, track persistente conocido, multiselección, doctrina por unidad y nuevas etiquetas en la UI activa. C2 individual está en #59, todavía no en main |
| Física | `solveTd` corregido en main; investigación independiente #54–58. No se modifica desde esta entrega | Validación completa de todos los supuestos; los datos desconocidos no se completan artificialmente |

Todo lo ejecutable de esta entrega vive en `experimentos/catalogo-presupuesto/`. No se importa desde `src/` y no cambia resultados, escenarios, golden o archivos generados del juego.

## Reparto conservador mientras no haya nuevo acuerdo

Claude conserva `ROADMAP.md`, `src/`, física/simulación, catálogo activo, incertidumbre, render/UI, pruebas activas y documentación generada. Su siguiente asignación concreta debe verificarse antes de asumir que terminó o quedó libre un área.

Codex trabaja en esta carpeta experimental: documentos originales, fuentes/fichas, contratos, presupuesto, continuidad y sus pruebas. No editar el mismo archivo porque una rama sea distinta: eso evita algunos conflictos de Git, no conflictos semánticos.

Una integración futura exige designar un único responsable para cada archivo compartido. No copiar la carpeta experimental entera al motor ni habilitar todos sus candidatos.

## Siguiente entrega segura

1. Revisar estos contratos con el panorama conocido por bando que implemente Claude.
2. Completar una configuración del catálogo por vez, sin tocar consumidores hasta tener evidencia suficiente.
3. Repartir los archivos de regla/selección de contacto/doctrina/multiselección; Delete/enteros/explicaciones ya están hechos y verificados en main.
4. Integrar una sola misión con briefing y recursos; después persistencia de componentes, logística e inteligencia para campaña.

## Cómo retomar sin perder contexto

Leer este documento y `DECISIONES.md`; hacer fetch del último main, revisar las PR abiertas y el árbol local sin descartar cambios ajenos; reconciliar el estado de cada pendiente. Ejecutar la suite experimental y `npm run check` del proyecto antes de publicar.

La PR #43 ya conserva la primera entrega en GitHub. Esta continuación debe publicarse como otra PR contra main, sin merge automático. La carpeta externa y el archivo comprimido antiguo no son la fuente actual del prototipo.
