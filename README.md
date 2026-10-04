# Cielo Cerrado

**Simulador táctico de defensa aérea para el navegador.** Un juego con aspiraciones de realismo, en la línea de *Command: Modern Operations* pero más liviano y de código abierto, basado en **datos públicos con fuentes citadas**.

Desplegás radares, baterías antiaéreas y guerra electrónica sobre relieve real; programás oleadas de drones, misiles de crucero y balísticos; y ves qué pasa: quién detecta qué, cuándo, quién dispara, cuánto cuesta y qué llega al blanco. Al final, un **debrief** te explica *por qué* pasó lo que pasó.

## Jugar

**Abrí `index.html` en el navegador** (doble clic). Es un único archivo autocontenido: no necesita instalación ni conexión. Con internet carga tipografías más lindas; sin internet usa las del sistema.

Primeros pasos:
1. Elegí un escenario arriba a la derecha y leé el **briefing**. Hay seis jugables: la noche de ataque combinado sobre Monterey, el ataque a la base con S-400 en Gotemburgo, la **defensa de la refinería de Hisingen** (Gotemburgo), el **ataque al puente de Moss Landing** (Monterey), la **noche contra la energía de Kiev** y las **bombas planeadoras sobre Járkov**, las dos últimas sobre el relieve real de cada ciudad.
2. Tocá **▶ Iniciar**. La velocidad **Auto** acelera cuando no pasa nada y frena cuando hay combate.
3. Al terminar se abre el **debrief**. ¿Fue suerte? El botón **Monte Carlo** corre la misma situación muchas veces y muestra la probabilidad de que cada objetivo sobreviva.
4. Probá cambiar cosas: mové defensas (antes de iniciar), agregá ataques en la pestaña **Ataque** o activá la capa **Relieve → Puntos altos** para ubicar radares en cotas dominantes.
5. **Guardar** descarga lo que armaste como archivo `.json`; **Cargar** lo vuelve a abrir (también en otra computadora).
6. ¿No sabés qué es la RCS o por qué un radar VHF ve misiles furtivos? Pestaña **Academia** o los botones **ⓘ**.

## Qué modela

- **Radar:** ecuación del radar (R ∝ σ^¼), RCS por banda (VHF a Ku), sectores de antena y probabilidad de detección por barrido.
- **Terreno:** relieve real con línea de vista, curvatura terrestre con refracción estándar (Tierra 4/3), horizonte de radar y altura de mástil. Mapa de cobertura y capas de lectura del relieve (puntos altos, curvas de nivel, sombreado).
- **Guerra electrónica:** interferencia de ruido con lóbulos principal y laterales y margen ECCM; supresión y engaño GNSS. Sistemas rusos y ucranianos.
- **Enfrentamiento:** pistas propias y de red, tiempo de reacción, canales de tiro, munición, solución de intercepción, Pk por clase de blanco con modificadores (maniobra, bengalas, furtividad, interferencia, velocidad), señuelos y doctrina de tiro.
- **Daño:** objetivos con vida (depósitos, bases, radares…), dispersión por CEP y daño según la ojiva y la distancia.
- **Economía:** costo de cada interceptor y de cada arma.

Catálogo: 16 amenazas, 19 defensas y sensores y 8 sistemas de guerra electrónica. Cada parámetro tiene rango (mín / probable / máx), confianza y fuentes: ver **[docs/CATALOGO.md](docs/CATALOGO.md)**.

> Es un juego educativo con datos públicos aproximados, **no una herramienta de planificación**. Los valores de RCS y Pk son estimaciones: los reales son secretos.

## Desarrollar

Hace falta [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
npm install        # una vez: instala esbuild (la única dependencia)
npm run dev        # servidor en http://localhost:8000 que recarga al guardar
npm test           # pruebas (física, catálogo, daño, corridas completas)
npm run build      # regenera index.html (el juego en un solo archivo)
npm run docs       # regenera docs/CATALOGO.md desde los datos
npm run check      # todo lo anterior y verifica que index.html y el catálogo estén al día
```

El código está en `src/`, separado en capas: **datos → física → simulación → dibujo → interfaz**. La física y la simulación no dependen del navegador, por eso se pueden probar en Node.

| Documento | Contenido |
|---|---|
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Cómo está organizado el código y cómo corre un paso de simulación |
| [docs/FISICA.md](docs/FISICA.md) | Cada modelo físico con sus fórmulas y simplificaciones |
| [docs/DATOS-Y-FUENTES.md](docs/DATOS-Y-FUENTES.md) | De dónde sale cada número, cómo se calibró y cómo tratar los sesgos de las fuentes |
| [docs/CATALOGO.md](docs/CATALOGO.md) | Todo el catálogo con rangos y fuentes (autogenerado) |
| [CONTRIBUIR.md](CONTRIBUIR.md) | Cómo agregar armas, escenarios o cambiar la física sin romper nada |
| [docs/investigacion/](docs/investigacion/) | Investigaciones: guerra electrónica ucraniana y cómo mejorar los modelos físicos |
| [docs/investigacion/c2-datalink.md](docs/investigacion/c2-datalink.md) | Auditoría de C2, compatibilidad de datalinks y límites del modelo |
| [docs/mediciones/README.md](docs/mediciones/README.md) | Línea de base reproducible y resultados Monte Carlo por escenario |
| [ROADMAP.md](ROADMAP.md) | Hacia dónde va el proyecto |
| [CHANGELOG.md](CHANGELOG.md) | Historial de cambios |

## Licencia

Código bajo licencia [MIT](LICENSE). Los textos y datos del catálogo resumen y citan fuentes públicas de terceros, que conservan sus derechos.
