# Changelog

Todos los cambios relevantes del proyecto. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/): mientras la versión sea 0.x, cualquier versión menor puede cambiar resultados de la simulación.

Cuando un cambio **altera los resultados de la simulación** (física o datos), se indica con **[sim]**.

## [Sin publicar]

### Agregado
- **Publicación en GitHub Pages**: el workflow `pages.yml` sube el `index.html` de la raíz en cada push a `main` (o a mano desde Actions), después de verificar que esté al día con `src/`.

## [0.3.0] - 2026-10-03

Del simulador a un **simulador táctico educativo**: objetivos concretos, daño, debrief, lectura del terreno y una Academia.

### Agregado
- **Objetivos con vida** (depósito, combustible, base aérea, radar, puesto de mando, munición, comunicaciones, infraestructura). Se dibujan en el mapa con barra de vida, se seleccionan, se ubican desde la pestaña Ataque y las rutas pueden apuntarles. **[sim]**
- **Modelo de daño** parametrizable por arma: depende de la ojiva del catálogo y de la distancia (impacto directo, cercano o sin efecto); estados operativo, dañado y destruido. **[sim]**
- **Debrief** al terminar: resultado según las metas del escenario, objetivos, ataque, daño, defensa, explicaciones de por qué pasó lo que pasó, línea de tiempo y tabla por arma.
- **Escenarios completos**: descripción, hora, fuerzas, condiciones, reglas especiales, objetivos, metas por bando y condiciones de éxito y fracaso. Briefing al elegirlos y tarjeta "Escenario" con la vida de cada objetivo en vivo.
- **Capas de relieve**: Normal, Puntos altos (▲ cota), Curvas de nivel y Sombreado. El tooltip muestra elevación, relieve relativo, pendiente y una lectura táctica del punto. No modifican el relieve físico.
- **Confirmación antes de colocar**: el click propone y Confirmar crea. Se distingue click corto de arrastre y de pellizco; la vista previa muestra el alcance y el horizonte de radar.
- **Academia**: 29 conceptos (RCS, bandas, ecuación del radar, horizonte, LOS, lóbulos, ECCM, GNSS, Pk, saturación, ventana práctica…), cada uno con cómo lo calcula el motor y calculadoras interactivas. Botones ⓘ en fichas y paneles.
- **Guerra electrónica ucraniana**: Pokrova, Lima y Bukovel-AD (anti-GNSS) y pod de autoprotección del F-16, con fuentes y rangos. El supresor ruso pasa a llamarse Pole-21. **[sim]** solo si se usan los nuevos.
- **Engaño GNSS** (spoofing) con desvío de kilómetros, y la categoría "perdidas localmente" en el debrief.
- **Velocidad Auto** (60×, 30×, 15× o 5× según la fase), texto con la escala de tiempo y barra de distancia con tiempos de vuelo.
- `docs/CATALOGO.md`, generado desde los datos, con cada parámetro, rango, confianza y fuentes.
- Documentación: FISICA, DATOS-Y-FUENTES, ARQUITECTURA, CONTRIBUIR, ROADMAP e investigación sobre la EW ucraniana.

### Cambiado
- Mapa sin pixelado: relieve a mayor resolución con interpolación bilineal y sombreado de Lambert; costa y curvas vectoriales; cobertura suavizada; respeta `devicePixelRatio`.
- `BANDS` es la única fuente de datos de bandas: las reglas de RCS por banda salen del código de `rcsAt()` y pasan a los datos, con resultados idénticos.
- Pestaña "Guerra E." → "EW"; panel izquierdo un poco más ancho para que entren las 5 pestañas.

## [0.2.0] - 2026-10-02

Reorganización para que el proyecto pueda crecer. **Sin cambios de comportamiento**: una corrida con la misma semilla da exactamente el mismo registro, estadísticas, cobertura, fichas y paneles que la versión original (verificado con 11 corridas en 4 escenarios).

### Cambiado
- El `index.html` monolítico (1,3 MB) se separó en módulos ES dentro de `src/`: datos, física, simulación, dibujo e interfaz.
- La simulación ya no toca el DOM: avisa a la interfaz con enganches y corre en Node.
- Escenarios declarativos y relieves en archivos separados.

### Agregado
- `npm run build` regenera el `index.html` autocontenido; `npm run dev` levanta un servidor con recarga automática.
- Pruebas automáticas: física, integridad del catálogo y regresión "golden".

## [0.1.0] - 2026-10-02

Versión original de Cielo Cerrado: simulador de defensa aérea en un único `index.html`, con catálogo OSINT (revisión de oct-2026), rangos de incertidumbre, calibración de Pk, dos relieves (Monterey y Gotemburgo), cobertura de radar, guerra electrónica e importación de tiles SRTM.

[Sin publicar]: https://github.com/altalasagnas/cielo-cerrado/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/altalasagnas/cielo-cerrado/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/altalasagnas/cielo-cerrado/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/altalasagnas/cielo-cerrado/releases/tag/v0.1.0
