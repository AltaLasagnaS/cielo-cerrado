"""Referencia independiente opcional. Python + SciPy; no depende del JS del motor.

python scripts/verify-pulse-integration.py --write
Regenera SOLO tests/fixtures/pulse-integration.json, nunca las golden de escenarios.
Integra la cola chi-cuadrado no central sobre la PDF de la RCS (cuadratura adaptativa).
"""
import argparse
import json
from pathlib import Path

import scipy
from scipy.integrate import quad
from scipy.optimize import brentq
from scipy.stats import gamma, ncx2

PFA = 1e-6


def probability(snr, pulses, model, threshold):
    shape = 1 if model == 1 else 2

    def integrand(u):
        # S = SNR*u, u~Gamma(shape, scale=1/shape), media de u = 1.
        return ncx2.sf(2 * threshold, 2 * pulses, 2 * pulses * snr * u) * gamma.pdf(
            u, shape, scale=1 / shape
        )

    return quad(integrand, 0, float("inf"), epsabs=2e-12, epsrel=2e-12, limit=400)[0]


def reference():
    thresholds, anchors, cases = [], [], []
    for pulses in [1, 2, 4, 8, 32, 128]:
        threshold = float(gamma.isf(PFA, pulses))
        thresholds.append([pulses, threshold])
        for model in [1, 3]:
            anchor = brentq(
                lambda snr: probability(snr, pulses, model, threshold) - 0.5,
                0, 64, xtol=1e-11,
            )
            anchors.append([pulses, model, float(anchor)])
            for snr in [0, 0.01, 0.3, 1, 3, 10, 30, 100]:
                cases.append([pulses, model, snr, probability(snr, pulses, model, threshold)])
    return {
        "method": "SciPy gamma.isf + quad of ncx2.sf averaged over Gamma RCS; no JS imports",
        "scipy": scipy.__version__, "pfa": PFA,
        "thresholds": thresholds, "anchors": anchors, "cases": cases,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    data = reference()
    # Una fila por caso: diff legible, números reproducibles y sin dependencias Python en CI.
    parts = ["{", *[f'  {json.dumps(k)}: {json.dumps(data[k])},' for k in ["method", "scipy", "pfa"]]]
    for key in ["thresholds", "anchors", "cases"]:
        parts.append(f'  "{key}": [')
        parts.extend("    " + json.dumps(row) + ("," if i < len(data[key]) - 1 else "")
                     for i, row in enumerate(data[key]))
        parts.append("  ]" + ("," if key != "cases" else ""))
    parts.append("}")
    content = "\n".join(parts) + "\n"
    if args.write:
        target = Path(__file__).resolve().parents[1] / "tests/fixtures/pulse-integration.json"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        print(f"Referencia escrita: {len(data['cases'])} casos, {target}")
    else:
        print(content, end="")
