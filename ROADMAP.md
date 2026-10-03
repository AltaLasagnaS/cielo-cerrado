# Hoja de ruta

Rumbo: un **CMO liviano, de código abierto y educativo**. Escenarios cortos sobre relieve real, modelos físicos simples pero con la forma correcta, datos públicos con la incertidumbre a la vista, y un debrief que enseña.

Son ideas ordenadas por prioridad, no promesas. Cada ítem que cambie resultados debe pasar por las pruebas golden y quedar en el CHANGELOG.

## Próximo (0.4)

- **Arnés de calibración reproducible** (`npm run calibrar`): reconstruir los casos de `CAL` con geometría guardada y correr el Monte Carlo en Node. Hace falta para cualquier cambio de física.
- **Verificar las fuentes de la investigación de EW ucraniana** (ver `docs/investigacion/`) y subir la confianza de lo confirmado.
- **Documentar el origen de los relieves** incluidos.

## Física (cada ítem es **[sim]**)

- RCS según el aspecto (usar `rcsSide` según el ángulo de vista).
- Clutter de suelo y mar para blancos rasantes, según el tipo de radar.
- Fluctuación de RCS (Swerling) en la probabilidad de detección.
- Discriminación de señuelos según la banda y el tiempo de seguimiento.
- CRPA explícita contra la cantidad de fuentes GNSS (propuesta en `docs/investigacion/`).
- Recarga de munición con tiempos y depósitos como objetivos.
- Interceptor con perfil de energía y límite de g en lugar de velocidad media.
- Daño funcional: un radar dañado pierde alcance, una base dañada no lanza.
- Clima: atenuación por lluvia en X/Ku y restricciones ópticas.

## Juego

- Más escenarios: Kyiv (relieve SRTM), corredor del mar Negro.
- Plataformas aéreas propias: patrullas de cazas como interceptores con radio de acción.
- Niebla de guerra más estricta: jugar solo con lo que ven tus sensores.
- Editor de objetivos y metas desde la interfaz.
- Repetición de la corrida (línea de tiempo navegable en el debrief).
- Idioma inglés (los textos ya están separados de la lógica en buena parte).

## Técnica

- Versión de escritorio opcional (Tauri o Electron) si hace falta acceso a archivos grandes.
- Tipografías embebidas para el uso sin conexión.
- Pruebas de interfaz en el navegador dentro de la CI (Playwright).
- TypeScript gradual o `// @ts-check` sobre los tipos JSDoc de `src/types.js`.
