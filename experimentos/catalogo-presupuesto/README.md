# Paquete paralelo: catálogo y asignación de recursos

Trabajo original en una carpeta experimental independiente. No cambia `src/`, escenarios, golden ni consumidores del motor. No está integrado ni desplegado en el juego. Se preparó fuera del repo y esta PR lo incorpora como referencia y prototipo revisable.

## Qué está implementado

- Catálogo de referencia normalizado: tres familias, diez entradas de munición (una es un marcador legado sin variante identificada), nueve componentes y diez candidatos de configuración.
- Registro de evidencia y fuentes. Diferencia documentación primaria/secundaria, índices de juego, estimación legada y desconocimiento. No atribuye evidencia a páginas bloqueadas.
- Validación de IDs, referencias, unidades, fuentes, niveles de evidencia y habilitación accidental.
- Comprobación de las ramas del contrato de perfil: velocidad constante legada, candidato a frenado calibrado, alternativa sin frenado y límite inferior que requiere revisión. No implementa vuelo, no calcula Pk ni muestrea parámetros.
- Prototipo puro e inmutable de presupuesto, disponibilidad, compras, cancelaciones, asignación previa, consumo y guardado por eventos.
- Continuidad del mismo libro entre etapas: conserva recursos/cotizaciones/consumo, registra intervalo y no reembolsa adquisiciones comprometidas en misiones anteriores.
- Proyección de briefing de preparación con tareas públicas, recursos propios y reportes fechados; no recibe verdad enemiga ni funciona como vista de combate.
- Inventario físico por componente, munición tipada y cargas completas explícitas: conserva existencias, disparos y pérdidas, y exige componentes de lanzamiento operativos. Ver [el contrato](docs/COMPONENTES-E-INVENTARIO.md).
- Evidencia separada para GEM-T, PAC-3 CRI/MSE y S-300PT/PT-1KD/PS: capacidades desconocidas siguen como `null`. Ver [el relevo de variantes](docs/RELEVO-DATOS-2026-10-05.md).
- Pruebas sin dependencias y demostración ejecutable en Node.

## Ejecutar

Desde esta carpeta:

```bash
node scripts/check.mjs
node --test tests/*.test.mjs
node scripts/demo.mjs
node scripts/campaign-demo.mjs
```

No necesita `npm install`, servidor ni acceso a internet para estas comprobaciones. `research/extract-html.py` es una ayuda opcional para leer páginas públicas; las pruebas no lo ejecutan.

La workflow `catalogo-presupuesto.yml` verifica este paquete aparte. `npm test` sigue ejecutando la suite del simulador y no incorpora silenciosamente las pruebas experimentales.

La demo de navegador está en `demo/index.html`. Se sirve con un servidor HTTP estático desde esta carpeta, por ejemplo `python -m http.server --bind 127.0.0.1 8766`. No funciona necesariamente con `file://` por sus módulos ES. Todos sus precios son ficticios y no representa una misión ni una economía real.

## Lo que NO está terminado

Ninguna configuración nueva está habilitada en el simulador. Los parámetros físicos y precios faltantes están en `unknown/null`, no en cero ni copiados de otra variante. Validar los registros no significa certificar capacidades reales.

Las configuraciones son candidatos de investigación; la compatibilidad familiar no prueba la composición, disponibilidad nacional, fecha, carga mixta ni empleo remoto de una batería concreta.

El prototipo de presupuesto no es una pantalla del juego ni un motor de logística. El contrato de componentes valida capacidades y registra consecuencias autorizadas por el motor; no calcula daño, recargas durante misión, entregas, reparación ni rutas. La integración con el simulador sigue pendiente y requiere un solo dueño de la munición y del daño.

Las cotizaciones se congelan al crear el plan. Los montos son enteros: `credits` identifica créditos ficticios; `USD-2025-minor`, por ejemplo, indica unidades monetarias menores con moneda/año, no permite mezclar ni convertir monedas. La exigencia de referencias es una comprobación de metadatos, no una auditoría automática de veracidad de precios.

Los elementos durables no se consumen como municiones. Las compras se pagan una sola vez; cancelar sólo es posible durante preparación y debe devolver todos los elementos. `load/unload` son asignaciones previas a misión, no recargas instantáneas de combate. Durante misión sólo se consume lo previamente listo.

Cada evento lleva bando e ID. Repetir exactamente un comando no duplica compras ni devoluciones; reutilizar su ID con otro contenido se rechaza. Un plan guardado reconstruye el estado a partir de la configuración inicial y eventos válidos. Esto evita confiar en un saldo editado como snapshot, pero no es protección criptográfica: alguien que modifique su archivo local también puede alterar los datos iniciales.

## Diseño y entrega

Ver las [fichas](docs/FICHAS.md), el [diseño de briefing/campaña](docs/BRIEFING-CAMPANA.md) y la [guía de integración](docs/INTEGRACION.md).

Para retomar todo lo hablado: [estado e índice de continuidad](docs/ESTADO-Y-RELEVO.md), [plan maestro](docs/PLAN-MAESTRO.md), [decisiones](docs/DECISIONES.md) y [pendientes](docs/PENDIENTES.md). Se preservaron también las referencias y los documentos externos originales, distinguiendo sus estados históricos.

El contrato ejecutable de varias etapas y briefing está en [PROTOCOLO-PROTOTIPO.md](docs/PROTOCOLO-PROTOTIPO.md). No implementa cambio de escenario, daño, reparación, contactos ni campaña jugable. Los intervalos contables no son el reloj del combate.

Las observaciones nuevas sobre enteros, C2 por unidad, señuelos, selección múltiple, bandos y `Delete` están en [NOTAS-USUARIO.md](docs/NOTAS-USUARIO.md); se registraron sin implementar cambios al juego.

Hay también una [nota matemática reproducible](docs/NOTA-INTERCEPTOR.md) sobre el main nuevo; no se modificó ese módulo ni se comprobó impacto en parámetros actuales.

La prueba opcional de navegador se ejecuta con `node tests/demo.browser.mjs`, con el servidor estático y Playwright/Chromium disponibles. Acepta `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH` y `TEST_URL`. La workflow mínima no instala navegadores: ejecuta las pruebas puras y los chequeos de catálogo/guardado; el smoke de navegador se verifica aparte.

`node tests/simulator-observations.browser.mjs` es un diagnóstico opcional del juego base servido desde la raíz; usa `TEST_SIM_URL` (por defecto puerto 8768). Confirma rechazo de fracciones en tres cantidades y borrado con Delete en preparación. La prueba completa de campos, ventanas, simulación y Monte Carlo está en `tests/browser/ux.browser.mjs` del repositorio principal.

La primera integración debería ser una PR pequeña de datos y validación desacoplados, no una sustitución del motor. Antes de usar un registro físico nuevo: verificar fuentes, completar incertidumbre, comprobar muestras conjuntas, acordar su configuración y pasar las pruebas del proyecto.

Los manuales y archivos comerciales adjuntos no forman parte de este paquete. No se copió su base de prestaciones ni sus scripts de doctrina.
