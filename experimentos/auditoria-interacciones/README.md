# Auditoría independiente de interacciones

Encargo: sección 9 de `Auditoria-Cielo-Cerrado.md`, adjunta por el usuario.
Base congelada: **9560c772543abcd0c0c7e75bdc9c47c0fb0d6bc5**. Investigación del
12 de octubre de 2026, Buenos Aires. Rama: `codex/auditoria-interacciones`.

Todo el cambio está en esta carpeta. No modifica producción, catálogos, golden,
generados, workflows ni la rama de Claude. Los fixtures sólo alteran estado de
la corrida en memoria; no habilitan perfiles de movilidad ni armas nuevas.

- [Informe y criterios de corrección](INFORME.md).
- [Segunda tanda: campaña, tooltip e invalidación](ROUND2.md), con ejecutables
  separados y evidencia adicional; conserva intacta la primera tanda.
- [Resultados Node](evidence/node.json), [navegador](evidence/browser.json) y
  [mediciones](evidence/performance.json).
- [Base, checks e identidad del adjunto](evidence/baseline.json).
- Capturas: [defensor pausado](evidence/source-paused-defender.png) y
  [selección histórica](evidence/source-historical-selection.png).

## Reproducir

Desde la raíz del repositorio, Node ≥20, sin instalar dependencias adicionales:

```sh
node experimentos/auditoria-interacciones/run.mjs
node experimentos/auditoria-interacciones/run.mjs --only=F01
node experimentos/auditoria-interacciones/run.mjs --only=gun-projectile-after-launcher-loss
node experimentos/auditoria-interacciones/performance.mjs
```

El ejecutable importa **el motor real**. No copia funciones del motor, no cambia
Pk y no actualiza golden. Cada caso tiene esperado, observado, ubicación y
prioridad. Los controles comprueban que el fixture produce el estímulo requerido:
tiro en vuelo, explosión equivalente, JSON originalmente válido, etc.

**Códigos de salida de `run.mjs` y `browser.mjs`:**

- **0:** las invariantes ejecutadas se sostienen, sin error de ejecución.
- **2:** se reprodujo al menos una violación del producto. Es el resultado
  esperado en esta base, **no una suite verde**.
- **1:** falló el diagnóstico/dependencia/fixture; no atribuirlo al producto.

`DESIGN_REVIEW` solicita revisar un contrato; no cuenta como bug confirmado.
`MEASURED` es una medición, no una aprobación de rendimiento. Un código cero no
convierte una pregunta de diseño en decisión resuelta. La suite normal del juego
no importa estos archivos: mantener sus resultados separados de estas pruebas.

Los resultados nuevos van en `results-local/` (ignorado), o en `AUDIT_OUTPUT`.
Los archivos de `evidence/` son las ejecuciones congeladas entregadas; no se
sobrescriben automáticamente.

### Navegador

Requiere Playwright y Chromium. Reutiliza el servidor de sólo lectura del repo,
con puerto efímero; bloquea destinos externos y registra errores JavaScript.

```sh
PLAYWRIGHT_MODULE=/ruta/absoluta/playwright/index.mjs \
CHROMIUM_PATH=/ruta/absoluta/chromium \
node experimentos/auditoria-interacciones/browser.mjs
```

Sin variables usa el paquete instalado de `tests/browser` y el Chromium de
Playwright. Prueba tanto módulos fuente como el **bundle generado intacto servido
por HTTP local**. Esto no es una afirmación de prueba `file://` ni reemplaza la
CI que verifica ese modo. No usa imports de producción en la página del bundle.

Intercepta etiquetas y traza de caminos de canvas durante dibujos controlados.
Comprueba los tres puntos colineales del fixture además de su etiqueta: ocultar
sólo el nombre no vuelve verde una ruta todavía visible. Restaura los métodos;
no simula la lógica de visibilidad. Hit testing importa su función real sólo en
fuente. En el bundle usa el panel público y `__S`/`__dbg` ya disponibles.

Las escenas de replay y traslado son fixtures controlados, no partidas con un
perfil militar recién habilitado. Se diferencia estado histórico y final para
comprobar los consumidores. Las suites existentes también corrieron completas.

## Comparar el PR de correcciones cuando el usuario lo entregue

`AUDIT_REPO_ROOT` permite importar otra copia **sin cambiar sus archivos**. El
resultado conserva SHA y hashes de las funciones auditadas. No comparar nombres
de ramas móviles ni trasladar una conclusión automáticamente al último main.

```sh
AUDIT_REPO_ROOT=/copia/de/la/version/corregida \
AUDIT_OUTPUT=/tmp/revision-sha-concreto \
node experimentos/auditoria-interacciones/run.mjs
```

La copia objetivo debe conservar los módulos/contratos importados y acceso de
lectura a Git para identificar el commit. Si un PR cambia la API, registrar la
incompatibilidad y adaptar el fixture con explicación; un fallo de importación
no demuestra que la corrección está mal. Para Chromium contra otra versión,
regenerar su bundle con su propio comando y registrar ese artefacto por separado,
sin editar ni regenerar la rama de Claude desde esta auditoría.

**Todavía no se revisó el PR de correcciones de Claude.** El usuario lo pasará
para contrastarlo contra estas reproducciones. #74 es clima, no se tomó como
el PR de correcciones encargado en la auditoría.
