# Componentes e inventario tipado: contrato ejecutable

5-oct-2026. Extensión experimental para las etapas 2 y 5 del plan, todavía sin importar desde `src/`. `lib/components.mjs` registra eventos autorizados del motor; no calcula daño, reparación, guiado, movimiento ni tiempo de recarga. La física conserva una única autoridad.

Cada instancia pertenece a un bando. Sensores, lanzadores y control conservan identidades y condición propias. Cada lanzador declara sus dependencias de lanzamiento: no se infieren de la nacionalidad, del datalink ni del nombre de la familia. La calidad de pista y la autorización de fuego siguen siendo responsabilidad del motor.

Las existencias se separan por munición y ubicación: depósito o lanzador concreto. Las cargas admitidas son patrones explícitos; una carga parcial debe ser subconjunto de **un mismo patrón**. Admitir A sola y B sola no admite automáticamente A+B. La configuración lleva fuente o etiqueta ficticia/legado; capacidad desconocida impide habilitar el lanzador. El adaptador de datos todavía necesita cerrar fuentes y parámetros físicos; no se activaron las variantes de investigación.

Eventos: `transfer`, `expend`, `loss`, `condition`, con ID único, bando y tiempo simulado entero. Transferir no crea munición; disparar sólo puede salir de un lanzador operativo con sus dependencias disponibles. Destruir un lanzador contabiliza pérdida de su carga, sin tocar los otros o el depósito. Una reparación completada puede notificarse como recuperación de un componente deshabilitado, pero este contrato no la provoca ni descuenta recursos: el futuro proceso logístico debe autorizarla. Un componente destruido no se resucita.

Se conserva, por cada tipo: existencias actuales + disparadas + perdidas = existencias iniciales. No se cobra al disparar: el contrato no maneja dinero. El futuro puente económico debe registrar adquisiciones/entregas y consumo de manera atómica, sin mantener dos cantidades físicas independientes.

Los eventos son cronológicos, inmutables, acotados e idempotentes ante reintento idéntico. Un ID repetido con otro contenido se rechaza. Guardado guarda inicial y eventos, y reconstruye; no confía en un snapshot mutable de existencias. No es autenticación ni protección contra inspección de un juego local; sólo los eventos autorizados del motor deben entrar aquí.

Pruebas: cargas mixtas inválidas y admitidas; pérdida localizada; sensor compartido que bloquea sólo a quienes dependen de él; transferencia/consumo/pérdida conservados; errores atómicos; reproducción de guardado y orden temporal; cantidades enteras y bando. Los números de las fixtures son **ficticios**, no prestaciones de Patriot/S-300.

```bash
node --test experimentos/catalogo-presupuesto/tests/*.test.mjs
node experimentos/catalogo-presupuesto/scripts/check.mjs
```

(Pendiente de integración: eventos del motor por componente, adquisición/entrega económica atómica, migración del legado y consumidores/UI coordinados con Claude. No se cierra «componentes integrados» por existir este contrato.)
