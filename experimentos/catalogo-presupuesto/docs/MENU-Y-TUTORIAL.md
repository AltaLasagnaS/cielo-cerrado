# Menú y tutorial experimental

`demo/menu.html` presenta Inicio, Escenarios, Campaña, Tutorial, Biblioteca y
Ajustes, en español y sin recursos externos. Está separado de `src/` y todavía
no sustituye la entrada del juego descargable.

El tutorial es **interactivo**: usa el libro de recursos existente, no una
animación que marque pasos completos sin modificar existencias. Seis acciones
guiadas enseñan compra, preparación, activación, consumo, cierre y continuidad.
Se validan cantidades enteras; los errores no avanzan el paso ni alteran saldo.
El ejercicio declara 100 créditos, paquete de 20 y equipo ficticios.

Al terminar quedan 80 créditos, dos consumibles en reserva, uno preparado y
uno consumido, más el equipo durable. Cambiar de sección conserva el estado;
guardar/restaurar conserva el paso y reproduce eventos. Restaurar un archivo
ajeno a ese ejercicio se rechaza, sin reemplazar el estado válido. No ofrece
protección criptográfica contra modificación local.

La biblioteca distingue familias y presenta identidad/evidencia, con prestaciones
y precios todavía pendientes. No habilita variantes nuevas. El enlace Escenarios
abre el simulador para elegir el escenario allí; no promete preselección por URL.
La página Campaña enlaza al juego y explica cómo abrir su campaña nativa de dos
guardias, integrada en main por #68. También ofrece practicar la continuidad con
el tutorial contable, que mantiene su identidad y recursos separados.

## Ejecutar

Servir la raíz del repositorio por HTTP y abrir:
`/experimentos/catalogo-presupuesto/demo/menu.html`.

```sh
node --test experimentos/catalogo-presupuesto/tests/*.test.mjs
TEST_MENU_URL=http://127.0.0.1:8766/experimentos/catalogo-presupuesto/demo/menu.html \
  node experimentos/catalogo-presupuesto/tests/menu.browser.mjs
```

La prueba de navegador acepta `PLAYWRIGHT_MODULE` y `CHROMIUM_PATH`. Comprueba
las seis etapas, fracciones, recursos, guardado inválido/recuperación, navegación,
filtro de biblioteca, ajustes de texto, anchura móvil y ausencia de red externa.

## Integración pendiente

Claude conserva los archivos activos de simulación/render/UI según #62. Para
llevar este menú y tutorial al producto: acordar el punto de entrada y usar el
briefing y perspectiva propios del motor. El adaptador de misión #61 y la
campaña de dos guardias ya están integrados en #68. No copiar el libro
contable de entrenamiento como segundo inventario físico de campaña.

Faltan tutoriales del mapa, sensores/C2/EW y combate observados, biblioteca
completa del catálogo activo y selección de campaña desde este menú. Esta entrega implementa la
navegación experimental y un tutorial de recursos, no esas otras funciones.
