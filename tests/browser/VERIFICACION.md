# Comprobaciones de esta entrega

Base: main `9cafba0`, 4 de octubre de 2026. Tarea: pruebas de navegador dentro de la CI. No modifica `src`, el test de interfaz previo, escenarios, golden, dependencias del juego ni archivos generados.

## Local

- Instalación del paquete aislado con lockfile e integridad npm; Playwright 1.63.0. Caché local configurada en `/tmp` porque la caché npm del home no era escribible.
- `npm run check`: 167 pruebas aprobadas, una omitida, lint/build/docs al día, sin diferencias en generados.
- Tres pruebas del servidor: sirve fuentes y bundle exactos, bloquea traversal/directorios/archivos de raíz y runners paralelos no comparten puerto ni cierran al otro.
- Prueba existente `tests/ui.browser.mjs`: valores numéricos, atajos, bloqueo de Monte Carlo, resultados contra el motor nativo y liberación/error de la serie, sin errores JavaScript.
- Smoke del bundle mediante loopback y sin red externa: siete comprobaciones aprobadas, incluyendo pixels dibujados, pestañas/modales, briefing, cantidades, Guardar/Cargar con descarga real, importación inválida sin mutación e iniciar/pausar/reiniciar.
- Prueba negativa controlada: `PLAYWRIGHT_MODULE` apuntando a un módulo inexistente termina con salida 1. El runner no presenta una prueba no ejecutada como aprobada y cierra su servidor.
- Sintaxis Node y `git diff --check` sin errores. Dependencias y resultados ignorados por Git.

## Diferencia de entorno a no ocultar

El Chromium de sistema de este cloud devuelve `ERR_BLOCKED_BY_ADMINISTRATOR` al abrir archivos locales. No se desactiva su política ni se cuenta esa comprobación como aprobada. Se ejecutó localmente el modo explícito `STANDALONE_HTTP=1`, que sirve exactamente el mismo HTML autocontenido y no importa módulos del motor aparte. El resultado registra el protocolo.

La workflow instala el Chromium propio de Playwright y prueba el modo `file://` por defecto. Su éxito se confirma en la PR de esta entrega; no se presupone desde el resultado HTTP local.

Una primera aserción del texto de ficha era sensible a mayúsculas y CSS muestra ese título en mayúsculas. Se corrigió sólo el matcher para reconocer la misma frase sin depender del estilo, y el smoke completo pasó. No se eliminó la comprobación ni se modificó el texto del juego.

## Límites

No equivale a navegación móvil completa, Firefox/WebKit, accesibilidad auditada, tipografías embebidas, ausencia de fugas de información, física nueva o calibración. Es una primera CI funcional y complementa las pruebas de Node. Los cambios futuros al modelo pueden requerir adaptar escenarios de prueba por causa justificada, nunca desactivar sus aserciones para conseguir verde.
