> Archivo histórico: se conserva el trabajo original externo, incluidos sus estados de aquel momento. No usarlo para inferir la situación actual de PR, pruebas o responsables. Consultar [el estado actual](../ESTADO-Y-RELEVO.md).

# Entrega paralela y estado de coordinación

## Preparado

- [Paquete ejecutable y documentación](../../README.md), fuera del repo activo.
- [Fichas originales de Patriot, NASAMS y S-300P](../FICHAS.md), con alerta adicional sobre MANPADS/RBS 70.
- Diez entradas de munición de referencia, nueve componentes y diez candidatos; ninguna configuración nueva activada. Una entrada de AIM-120 es un marcador sin variante identificada.
- Prototipo económico con fondos, disponibilidades, paquetes, cancelación, preparación, consumo y guardado por eventos.
- [Diseño de briefing y campaña](../BRIEFING-CAMPANA.md) y [guía de integración](../INTEGRACION.md).
- [Nota de un límite matemático del interceptor](../NOTA-INTERCEPTOR.md), reproducida sin modificar el módulo de Claude.

## Verificado

- Paquete: 36 pruebas pasan, sin omitidas ni fallas; validación del catálogo y demo pasan.
- Baseline local `bb0d718`: `npm test` dio 151 aprobadas, una omitida y ninguna falla. No son las pruebas del main nuevo.
- Lectura de main remoto en `4bbb5a2`: está el merge #42 y el perfil; Kiev todavía tiene nueve Kh-101. No se verificó su CI ni se ejecutó su suite aquí.
- La rama y los archivos del checkout local no cambiaron. Sólo se actualizaron referencias Git mediante fetch y se leyeron archivos del commit remoto.

## Pendiente y límites

Claude debe recibir el pedido de conservar el escenario original de Kiev sin el ajuste destinado a recuperar balance. La captura no confirma que lo haya procesado después del límite de sesión.

El paquete no está en GitHub ni integrado al juego. Todavía faltan evidencia y revisión para parámetros físicos, costos reales, configuración nacional/temporal y conectividad/empleo concretos. No se copiaron datos desconocidos de otras variantes ni se rellenaron con cero.

Los límites de comunicaciones, niebla de guerra, daño y reparación se integrarán con un único motor y una única vista por bando. Aquí no se implementó otra física ni se tomaron tareas de Claude por su pausa.

La próxima entrega de integración puede añadir registros y validación en archivos nuevos acordados, preservando datos legados y sin tocar física. La primera configuración activa debe completarse y verificarse por separado.

## Conservar o pasar el trabajo

Descargar `entrega-paralela.tar.gz` conserva fuentes, documentación y pruebas del paquete y los documentos de diseño. No incluye los manuales adjuntos, bases comerciales, dependencias ni secretos.

Para Claude: leer primero `paquete/docs/INTEGRACION.md` y `paquete/docs/NOTA-INTERCEPTOR.md`; no copiar el paquete entero a los consumidores del juego sin revisar qué datos están pendientes.
