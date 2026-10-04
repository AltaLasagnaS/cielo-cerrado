// Integración NO coherente: suma de potencias de N pulsos, Swerling lento 1/3.
// Ruido gaussiano complejo independiente; RCS constante dentro del barrido.
// Modelo y derivación: docs/investigacion/integracion-pulsos.md. Sin azar ni DOM.

/** PFA por decisión de detección (no por pulso ni por pista). */
export const PFA = 1e-6;
/** Límite del dominio numérico verificado; no es una capacidad física del radar. */
export const MAX_INTEGRATION_PULSES = 128;
const EPS = 1e-15;
const profiles = new Map(), anchors = new Map();
const logFactorial = [0];
for (let i = 1; i <= 2048; i++) logFactorial[i] = logFactorial[i - 1] + Math.log(i);

function validate(pulses, model) {
  if (!Number.isInteger(pulses) || pulses < 1 || pulses > MAX_INTEGRATION_PULSES)
    throw new RangeError(`integrationPulses debe ser entero entre 1 y ${MAX_INTEGRATION_PULSES}`);
  if (model !== 1 && model !== 3) throw new RangeError('Swerling debe ser 1 o 3');
}

// Q(n,x): cola superior de Gamma(n,1) = CDF de Poisson(x) en n−1.
function gammaUpper(n, x) {
  let term = 1, sum = 1;
  for (let j = 1; j < n; j++) { term *= x / j; sum += term; }
  return Math.exp(-x) * sum;
}

// P(n,x): cola de Poisson desde n. Suma positiva para no restar números casi iguales
// cuando P es pequeño. Los perfiles acotan n y x dentro del dominio de arriba.
function gammaLower(n, x) {
  let term = Math.exp(-x + n * Math.log(x) - logFactorial[n]), sum = term;
  for (let j = n + 1; j <= 2048; j++) {
    term *= x / j; sum += term;
    if (j > x && term < sum * EPS * 0.1) return Math.min(1, sum);
  }
  throw new Error('No convergió la cola Gamma de integración de pulsos');
}

function profile(pulses) {
  if (profiles.has(pulses)) return profiles.get(pulses);
  let lo = 0, hi = 2 * pulses + 64;
  while (gammaUpper(pulses, hi) > PFA) hi *= 2;
  for (let j = 0; j < 80; j++) {
    const mid = (lo + hi) / 2;
    if (gammaUpper(pulses, mid) > PFA) lo = mid; else hi = mid;
  }
  const threshold = (lo + hi) / 2, miss = [];
  // P(N+k,T) decrece con k. Toda la cola omitida de la mezcla pesa <= EPS,
  // incluso si casi toda la masa de K está fuera de esta tabla (SNR muy alta).
  for (let k = 0; k < 1024; k++) {
    const p = gammaLower(pulses + k, threshold); miss.push(p);
    if (p < EPS) {
      const value = { threshold, miss }; profiles.set(pulses, value); return value;
    }
  }
  throw new Error('No convergió el perfil de integración de pulsos');
}

/** Umbral T_N tal que Q(N,T_N)=PFA; ruido total Gamma(N,1). */
export function integrationThreshold(pulses = 1) {
  validate(pulses, 1);
  return pulses === 1 ? -Math.log(PFA) : profile(pulses).threshold;
}

/**
 * Pd con SNR media LINEAL por pulso, N pulsos y Swerling 1/3 lento.
 * La energía condicionada a S es ½·χ²(2N,2NS). Al promediar S~Gamma(a,SNR/a),
 * a=1 o 2, K es binomial negativa: w0=p^a, w(k+1)=w(k)·q·(k+a)/(k+1),
 * p=1/(1+N·SNR/a). Pd=1−Σ w(k)·P(N+k,T_N).
 * SNR=0 devuelve PFA matemático; esto NO genera pistas falsas en el motor.
 */
export function noncoherentPd(snr, pulses = 1, model = 1) {
  validate(pulses, model);
  if (typeof snr !== 'number' || Number.isNaN(snr) || snr < 0)
    throw new RangeError('La SNR debe ser un número no negativo');
  if (snr === 0) return PFA;
  if (snr === Infinity) return 1;
  if (pulses === 1) {
    const T = -Math.log(PFA);
    return model === 1 ? Math.pow(PFA, 1 / (1 + snr))
      : (1 + 2 * (snr / (2 + snr)) * (T / (2 + snr))) * Math.exp(-2 * T / (2 + snr));
  }
  const a = model === 3 ? 2 : 1, scale = pulses * snr / a;
  const p = 1 / (1 + scale), q = scale / (1 + scale);
  if (p === 0) return 1;
  let weight = p ** a, missed = 0;
  const { miss } = profile(pulses);
  for (let k = 0; k < miss.length; k++) {
    missed += weight * miss[k]; weight *= q * (k + a) / (k + 1);
  }
  return Math.max(PFA, Math.min(1, 1 - missed));
}

/** SNR por pulso que da Pd=0,5. Cache limitado a 2×128 anclas. */
export function integratedSnr50(pulses = 1, model = 1) {
  validate(pulses, model);
  const key = `${pulses}/${model}`;
  if (anchors.has(key)) return anchors.get(key);
  let lo = 0, hi = 64;
  for (let j = 0; j < 80; j++) {
    const mid = (lo + hi) / 2;
    if (noncoherentPd(mid, pulses, model) < 0.5) lo = mid; else hi = mid;
  }
  const value = (lo + hi) / 2; anchors.set(key, value); return value;
}
