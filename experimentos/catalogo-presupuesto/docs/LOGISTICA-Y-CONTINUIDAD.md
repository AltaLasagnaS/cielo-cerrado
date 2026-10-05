# Logística y continuidad: contrato ejecutable y demo

5-oct-2026. `lib/logistics.mjs` extiende el [inventario por componentes](COMPONENTES-E-INVENTARIO.md). La munición sólo vive en ese inventario; no se mantiene un segundo contador contable. El módulo anterior de presupuesto sigue como prototipo de compras por paquetes, sin conectarlo a éste mediante copias de cantidades.

`createCampaign/applyCampaignCommand/saveCampaign/loadCampaign` mantienen una campaña de recursos: fondos, cotizaciones finitas, depósitos, lanzadores, munición por tipo, daños autorizados, repuestos y trabajos temporizados. No implementan combates, contactos, objetivos, movimiento en el mapa ni inteligencia enemiga. El motor conserva la autoridad física y el reloj.

## Operaciones

| Comando | Efecto y límites |
|---|---|
| `order` | Paga una sola vez, limita la disponibilidad del proveedor, agenda entrega. El inventario sólo aumenta al vencer el plazo |
| `transfer` | Saca munición del origen y la coloca en tránsito reservado a esa ruta. Un servicio sólo atiende un trabajo; al vencer el plazo valida equipo y carga admitida |
| `repair` | Equipo degradado o inutilizado; consume repuestos y fondos al comenzar. Recupera al vencer el plazo; la destrucción durante el trabajo lo hace fallar |
| `cancel` | Pedidos sólo si su cotización declara cancelación con devolución. Servicios iniciados no devuelven gasto/repuestos. Retornar carga conserva lo sobreviviente en tránsito y requiere otro plazo y costo |
| `outcome` | Registra disparo, pérdida o daño decidido por el motor. No admite adquisición libre ni recuperación sin reparación |
| `advance` | Procesa trabajos vencidos cronológicamente. El motor suministra este tiempo; no debe usarse para saltarse el combate |
| `activate/finish/begin-mission` | Cambia de fase/misión; conserva recursos, daños y trabajos. No entrega ni repara automáticamente al pasar de misión |

Cada configuración declara costo, plazo, fuentes o etiqueta ficticia, condiciones de cancelación y compatibilidad. No hay conversiones monetarias implícitas. Moneda/año requiere documentación; créditos ficticios no se presentan como precios reales. La nota/fuente conjunta debe aclarar también el alcance del plazo y servicio: validar metadatos no audita la evidencia.

La ruta es un contrato de traslado con origen, destino, ubicación de tránsito y depósito de recuperación. **No es una ruta geográfica ni un vehículo**. La cancelación que ordena retorno mantiene el material en tránsito hasta completarlo; no teletransporta al depósito. Pérdidas parciales y destino inutilizado interrumpen la entrega conservando lo que queda. Si una carga ya no cabe, permanece en tránsito, sin duplicarse ni desaparecer. El servicio incluye un trabajador lógico; no representa personal real ni transporte ilimitado certificado.

Se conserva por munición: existencias + disparadas + perdidas = iniciales + entregadas. Los pedidos aún en camino no cuentan como entregados. El disparo consume munición pero no vuelve a cobrarla. Las reparaciones no reconstruyen equipos destruidos ni repuestos consumidos. Un daño nuevo durante reparación no redefine por sí solo su duración: falta el modelo físico de severidad/trabajo requerido.

Los eventos se reproducen al cargar. Un comando fallido deja intactos fondos, existencias, disponibilidad, reloj y trabajos. Un reintento idéntico no repite efectos. No se aceptan snapshots de saldo/inventario como autoridad, ni eventos de otro bando. Esto no protege criptográficamente una partida local.

`buildCampaignBriefing` proyecta recursos propios en preparación y valida objetivos/reportes autorizados con la misma normalización del briefing anterior. Exige bando, misión y reloj actuales; conserva edad desde la observación, no desde recepción ni cambio de misión. Rechaza campos del plan enemigo. No es la vista de combate: al conectarse con perspectivas debe recibir también el conocimiento autorizado de bajas propias, que puede diferir del inventario físico si una unidad está incomunicada. La demo limpia un briefing que ya no corresponde al estado o fase actual.

El [adaptador de misión](ADAPTADOR-MISION.md) acepta el reloj fraccionario del motor sin truncarlo. Cantidades y fondos siguen siendo enteros. El tiempo se acota a segundos finitos dentro de 1e9 s desde el origen; no se infiere una precisión de radar a partir de ese reloj.

## Verificación y revisión

Todos los datos de `data/demo-campaign.mjs` son **ficticios**. Alpha/Beta no representan GEM-T, PAC-3 ni S-300. Las variantes reales desconocidas siguen deshabilitadas.

```bash
node --test experimentos/catalogo-presupuesto/tests/*.test.mjs
python -m http.server --bind 127.0.0.1 8766 --directory experimentos/catalogo-presupuesto
# En otra terminal, con Playwright y Chromium instalados:
node experimentos/catalogo-presupuesto/tests/logistics.browser.mjs
```

La demo está en [demo/logistics.html](../demo/logistics.html); funciona por HTTP local sin recursos externos. Se comprueban demora real del contrato, devolución condicionada, cargas mixtas, retornos, daño durante reparación, pérdidas de carga, continuidad, replay, errores atómicos y cantidades enteras. El smoke de navegador comprueba el flujo visible y ancho móvil.

(Integración pendiente: motor/vistas por bando de Claude, instancia exacta por componente, recarga/traslado geográfico, severidad de daño, cortes/interrupciones por recursos y reglas de orden simultáneo entre impacto y final de trabajo. El contrato ordena vencimientos iguales por inserción; el motor debe definir esa prioridad antes de conectarse. No se marca «campaña jugable» como terminada.)
