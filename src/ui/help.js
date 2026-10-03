// Ventana "Cómo se usa".
import { $ } from './dom.js';
import { openModal } from './fichas.js';

export function initHelp() {
$('#helpBtn').onclick = () => openModal(`<header><h2>Cómo se usa</h2><button class="btn x">Cerrar</button></header><div class="bd">
  <ul>
    <li><b>Defensa:</b> elegí un sistema y tocá el mapa. Seleccionalo para cambiar mástil, orientación del sector (Patriot, S-400), rumbo del AEW, munición e interceptores por blanco. Arrastrá para mover.</li>
    <li><b>Ataque:</b> elegí el arma, cantidad, horario (o "sincronizar llegada" para saturar), altura y maniobra; después "Trazar ruta". Los balísticos y supersónicos se lanzan desde fuera del mapa en la dirección que marques.</li>
    <li><b>Guerra electrónica:</b> jammers de ruido (aéreo o Krasukha) y supresor GNSS. Las líneas violeta muestran qué radar está siendo interferido.</li>
    <li><b>Cobertura:</b> el mapa sombrea en turquesa dónde tus sensores ven un blanco de referencia a cierta altura sobre el terreno, considerando relieve real, curvatura terrestre, RCS en la banda de cada radar e interferencia. Bajá la altura y vas a ver aparecer los huecos de los valles.</li>
    <li><b>Simulación:</b> ▶ Iniciar, velocidades 1×–60×. "Vista del defensor" oculta lo que no fue detectado y muestra los señuelos igual que las armas reales.</li>
    <li><b>Relieve propio:</b> "Cargar relieve .hgt" acepta tiles SRTM descomprimidos (por ejemplo N50E030.hgt para Kyiv), de 1201×1201 o 3601×3601 muestras.</li>
  </ul>
  <h3>Qué modela y qué no</h3>
  <p>Línea de vista radar sobre el relieve con refracción estándar (Tierra 4/3); ecuación del radar simplificada (R ∝ σ<sup>¼</sup>); RCS por banda; sectores de antena; interferencia de ruido con lóbulo principal/lateral y margen ECCM; red de mando integrada o baterías autónomas; tiempo de reacción, canales de tiro, munición, cinemática de intercepción y Pk por clase con modificadores; señuelos; desvío por GNSS; costos estimados.</p>
  <p>Datos: cada parámetro del catálogo tiene un rango (mín / probable / máx) con nivel de confianza y fuentes; la simulación usa el probable. Las Pk están calibradas contra tasas reportadas en Ucrania (pestaña Catálogo → Calibración de Pk).</p>
  <p>No modela: clutter de suelo, efecto Doppler, clima, multitrayecto, fatiga de operadores, recarga, ni guerra electrónica ofensiva contra buscadores. Es un juego educativo con datos públicos aproximados, no una herramienta de planificación.</p>
</div>`, () => $('#helpBtn').click());
}
