# Autonomía, entregas y dependencias

El 5-oct-2026 el usuario autorizó avanzar sin intervención suya y coordinar directamente mediante comentarios/PRs con Claude. Se mantiene realismo antes que balance, estructura por capas y desconocidos explícitos. No exige nuevos agentes ni cambios simultáneos sobre los mismos archivos.

## Entregas revisables

| PR | Contenido | Alcance |
|---|---|---|
| [#54](https://github.com/AltaLasagnaS/cielo-cerrado/pull/54) | Clutter: informe NRL original, coeficientes/validez y segunda referencia MTI S-125 | Fuentes y contradicciones, no cambio de motor |
| [#55](https://github.com/AltaLasagnaS/cielo-cerrado/pull/55) | EW: DRFM por versión y límite de evidencia SOJC/HOJ | No atribuye al GEM-T la capacidad de MIM-104B |
| [#56](https://github.com/AltaLasagnaS/cielo-cerrado/pull/56) | Enlaces: tiempo de pista, latencia y granularidad | Ranura/LSB no se convierten en latencia |
| [#57](https://github.com/AltaLasagnaS/cielo-cerrado/pull/57) | Maniobra: arquitecturas y fuentes por variante | Curvas g-altura no encontradas |
| [#58](https://github.com/AltaLasagnaS/cielo-cerrado/pull/58) | Clima: P.840 y perfil NOAA reproducible | Norma del viento medio no es velocidad típica |
| [#60](https://github.com/AltaLasagnaS/cielo-cerrado/pull/60) | Pedido de puerto, presupuesto, disponibilidad, campaña y tutorial | Diseño conservado, no implementación jugable |
| [#61](https://github.com/AltaLasagnaS/cielo-cerrado/pull/61) | Variantes, componentes, inventario y logística/continuidad experimental | Código, contratos y demos comprobables, sin importación desde `src/` |

Todos son borradores directos contra `main`. No se hizo merge automático ni se encadenaron bases. Este registro no afirma que Claude haya revisado o adoptado sus datos.

## Coordinación actual

Claude está avanzando en [#59](https://github.com/AltaLasagnaS/cielo-cerrado/pull/59): maniobra, pasarela de enlaces/C2 individual y clima. Su bloque posterior asignado por el relevo es perspectivas por bando, que toca simulación/render/UI. Codex no modifica esos archivos mientras no haya nuevo reparto.

Se enviaron [el reparto propuesto](https://github.com/AltaLasagnaS/cielo-cerrado/pull/59#issuecomment-5988341345) y [el contrato de inventario](https://github.com/AltaLasagnaS/cielo-cerrado/pull/59#issuecomment-5988400475) directamente en su PR. **Claude confirmó el reparto** en los comentarios: física/perspectivas y enganche en `src/` a su cargo; Codex variantes/componentes/recursos/campaña y después menú/tutorial en experimentos. La coordinación continúa en [#62](https://github.com/AltaLasagnaS/cielo-cerrado/issues/62), sin depender del usuario para reenviar mensajes.

Claude incorporó en su rama los commits iniciales de #54–58, #60 y #61, y añadió regla, contactos/ficha conocida, doctrina individual, Shift+clic, rótulos de bando y typecheck completo. **#61 sigue avanzando** con logística/briefing posterior a esa incorporación; no debe cerrarse por contener #59 una versión anterior. Revisar el último head antes de dar una entrega por incluida. Ninguno de estos avances está en `main` hasta su merge.

La física decide impactos, daño y detección. El inventario registra consecuencias; la logística usa ese mismo inventario, no una copia adicional de existencias. Para integrar, el motor debe entregar eventos por componente y el reloj; la perspectiva debe limitar el conocimiento de esos resultados antes de mostrarlos al comandante.

## Pendientes que no se ocultan

- (Conexión con el juego: esperar contrato de perspectivas y repartir los archivos; una demo experimental no cierra campaña, componentes o briefing jugables.)
- (Datos: capacidades/cargas/control exactos Patriot incompletos; SCV por radar y curvas de maniobra desconocidas. Mantener `null`, etiquetas de estimación y fuentes.)
- (Clutter: NRL aporta reflectividad aparente, no supresión subclutter; no usarlo en VHF fuera de rango ni duplicar propagación.)
- (Logística geográfica: faltan trayectos/vehículos, severidad de averías, personal y prioridad de impacto frente a final de trabajo. Los plazos ficticios de demo no son prestaciones reales.)
- (Campaña: faltan escenarios enlazados, objetivos, conocimiento persistente autorizado, debrief restringido y disponibilidad histórica verificada.)
- (UI: regla, fijación de contactos, doctrina por unidad, Shift+clic y rótulos de bando están implementados en #59, pendientes de integración a main; menú/tutorial y selección por rectángulo siguen abiertos. Ver criterios en [PENDIENTES.md](PENDIENTES.md).)

Las pruebas y resultados de cada entrega se anotan en su PR. Antes de continuar: fetch de `main`, revisar comentarios/PRs, no descartar cambios ajenos y no volver a trabajar lo ya cerrado.
