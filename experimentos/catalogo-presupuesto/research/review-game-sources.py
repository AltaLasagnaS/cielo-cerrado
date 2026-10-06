"""Build a SMALL reviewed fact matrix from user-supplied CMO descriptions.

No database execution, weapon-performance inference, or wholesale export.
The fixed file hashes bind manual review to the exact supplied texts. Changed
files require a new review, rather than silently retaining old interpretations.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

# Each interpretation was reviewed independently in its own file. Speeds are
# merely reported speeds, never the engine's mean velocity or motor profile.
REVIEWS = [
    (642, 'patriot-gemt-game', 'PAC-2 GEM-T', 'patriot', '865a8cde1b9ee1bd78ddae768498577ec72e72403d5a71c05e97703758cf4bac',
     {'speedMps': 1190, 'rangeKm': [3, 160], 'altitudeM': [60, 32000], 'reloadSeconds': [1800, 3600]},
     ['La ficha nombra GEM-T; el índice 442 nombra GEM+ con el mismo ID. No se certifica equivalencia ni versión común.']),
    (1150, 'patriot-erint-game', 'PAC-3 ERINT (CRI no identificado)', 'patriot', '52c8977ea47aca52e4da8ef70d4e8528dcac394e434585597893b4a078f2a3bd',
     {'speedMps': 1715, 'rangeKm': [1.6 * 1.852, 43 * 1.852], 'tbmMaxRangeKm': 22 * 1.852,
      'altitudeM': [197 * .3048, 79000 * .3048], 'reloadSeconds': [1800, 3600]},
     ['ERINT no se convierte automáticamente en CRI.', 'Altura TBM: 66.000 ft y 20.000 m son cifras aproximadas; no fija el mínimo TBM.']),
    (3207, 'patriot-mse-game', 'PAC-3 MSE', 'patriot', '2a1b286a7600e0c6b5a8cd45cb234b030f9b5b963397bebba11aaf52d8ce10b7',
     {'speedMps': 1715, 'rangeKm': [1.6 * 1.852, 65 * 1.852], 'tbmMaxRangeKm': 32 * 1.852,
      'reloadSeconds': [1800, 3600]},
     ['Mínimo 1,6 nm etiquetado est: es estimación de la ficha.',
      'Altura máxima contradictoria: 118.000 ft = 35.966,4 m; paréntesis dice 32.000 m. Queda sin normalizar.',
      'M901/MSE en índice de mounts no prueba compatibilidad física.']),
    (403, 's300-5v55k-game', '5V55K', 's300p', 'cc0a00d3a08054ac49fa13d1ae3f6e77d8a1bb6a2638c2c526c3333eb401e15a',
     {'speedMps': 1700, 'rangeKm': [2.7 * 1.852, 25 * 1.852], 'altitudeM': [25, 25000]},
     ['Recarga, Pk y maniobra están marcados ??/unknown. No se rellenan.']),
    (1156, 's300-5v55kd-game', '5V55KD', 's300p', 'c4f6265a3370a53842b7f08683681f812ca64f930a03a705557a777ffd76487e',
     {'speedMps': 1700, 'rangeKm': [2.7 * 1.852, 47 * 1.852], 'altitudeM': [25, 25000]},
     ['La ficha afirma SARH; confirmar configuración/guía con evidencia técnica antes de mapear al motor.']),
    (1831, 's300-5v55r-game', '5V55R', 's300p', 'd811fa002ddd1abcb002d7429400babbac8a84b82d19052713caf327f7db9107',
     {'speedMps': 1700, 'rangeKm': [2.7 * 1.852, 40.5 * 1.852], 'altitudeM': [25, 25000]},
     ['La ficha indica TVM. Recarga, Pk y maniobra desconocidos.']),
    (14, 's300-5v55rud-game', '5V55RUD', 's300p', '051a2bcf9db907905243abd2201ef254ed4c1f2ce724405c9e0f4cc713822904',
     {'speedMps': 1700, 'rangeKm': [2.7 * 1.852, 40.5 * 1.852], 'altitudeM': [25, 25000]},
     ['La ficha repite cifras de R; no es una segunda fuente independiente ni certifica que R y RUD sean equivalentes.']),
    (652, 'buk-original-game', 'Buk original / 9M38 por confirmar', 'buk', '4325325aac7415f6a27d372e301c38b00a82668e061714ca1080d2aace71c33a',
     {'speedMps': 850, 'rangeKm': [5, 30], 'reloadSeconds': [780, 900]},
     ['OVERVIEW dice 9K38, índice dice 9M38: no sustituir códigos de sistema/misil.',
      'Altura contiene 20,0000 m frente a 65.616 ft: error tipográfico no resuelto, no normalizado.']),
    (1147, 'buk-m1-game', 'Buk-M1 / 9M38M1 por confirmar', 'buk', 'cef7525d2bed3b85c6b0e3b6bed66bd586e4073122084204ce8a30477944ef95',
     {'rangeKm': [3, 35], 'altitudeM': [15, 22000], 'reloadSeconds': [780, 900]},
     ['Velocidad contradictoria: 2.332 nudos = 1.199,68 m/s, pero la ficha dice 850 m/s. No se elige una automáticamente.',
      'OVERVIEW dice 9K38M1, índice dice 9M38M1.']),
    (2970, 'buk-2970-unresolved-game', 'Buk, identificación pendiente (archivo 2970)', 'buk', 'cdefb750ab10c6c5de00fa7e28181052b5150a31da75775a82dfa451baae0023',
     {}, ['El índice 442 identifica 9M317M/Buk-M3; la ficha dice 9K317M, SARH y 42 km. No se atribuyen esos números a una variante exacta hasta resolver versión/identidad.']),
    (1113, 's300-48n6-game', '48N6', 's300p', '7b13137e78c53a497319ff407fdf2db1553a9e5262c1637f13d4b8b172999b70',
     {'speedMps': 2000, 'rangeKm': [5, 150], 'altitudeM': [10, 27000]}, []),
    (12, 's300-48n6e-game', '48N6E', 's300p', '2d0d47f1e75535b33852f855e975ac0acbea125f33b9b03855621d7656cbf1e2',
     {'speedMps': 2000, 'rangeKm': [5, 150], 'altitudeM': [10, 27000]},
     ['Ficha propia de E; no se rellenó copiando 48N6.']),
    (878, 's300-48n6e2-game', '48N6E2', 's300p', 'd2f0388e42aeeebcc8d06956273762d611613bc18d30b7e899ed2a598fa0ca58',
     {'speedMps': 2000, 'tbmMaxRangeKm': 40, 'altitudeM': [10, 27000]},
     ['Alcance aéreo contradictorio: 81 nm = 150,012 km frente a 195 km; no normalizado.',
      'TBM: 5–40 km y 2.000–25.000 m son afirmaciones de ficha, sin validación independiente.'])
]

FIELDS = {'speedMps': 'm/s', 'rangeKm': 'km', 'tbmMaxRangeKm': 'km', 'altitudeM': 'm', 'reloadSeconds': 's'}
LOCATORS = {'speedMps': 'Speed', 'rangeKm': 'Range', 'tbmMaxRangeKm': 'Range',
            'altitudeM': 'Engagement Altitude', 'reloadSeconds': 'Reload time'}

def read_text(path):
    raw = path.read_bytes()
    if raw[:2] in (b'\xff\xfe', b'\xfe\xff'):
        return raw, raw.decode('utf-16')
    try:
        return raw, raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        return raw, raw.decode('cp1252')

def build(directory):
    files = {p.stem.lower(): p for p in directory.iterdir() if p.is_file()}
    records = []
    for number, identifier, name, family, expected_hash, values, issues in REVIEWS:
        path = files.get(f'weapon_{number}')
        if path is None:
            raise ValueError(f'Falta Weapon_{number}; no se completa por analogía')
        raw, text = read_text(path)
        sha = hashlib.sha256(raw).hexdigest()
        if sha != expected_hash:
            raise ValueError(f'{path.name}: cambió la ficha; necesita nueva revisión')
        claims = []
        for line_number, line in enumerate(text.splitlines(), 1):
            if re.match(r'\s*(?:Speed|Range|Engagement Altitude|Reload time|Kill probability|Maneuverability)\s*:', line, re.I):
                claims.append({'line': line_number, 'text': ' '.join(line.split())})
        measurements = {}
        for field, unit in FIELDS.items():
            measurements[field] = {'value': values.get(field), 'unit': unit,
                                   'confidence': 'medium-low' if field in values else 'unknown',
                                   'locator': LOCATORS[field] if field in values else None}
        records.append({'id': identifier, 'name': name, 'family': family, 'kind': 'weapon',
                        'sourceId': 'cmo-descriptions-supplied', 'file': path.name, 'sha256': sha,
                        'databaseBuild': None, 'gameComponentId': number, 'runtimeEnabled': False,
                        'measurements': measurements, 'claims': claims, 'issues': issues,
                        'model': {key: None for key in ('maxR', 'maxRtbm', 'minR', 'altMin', 'altMax', 'vInt', 'vmax', 'tb', 'pk', 'price')}})
    return {'format': 'cielo-cerrado/game-source-review', 'version': 1, 'reviewedOn': '2026-10-05',
            'source': {'id': 'cmo-descriptions-supplied', 'role': 'game-compilation', 'file': 'Descriptions.7z',
                       'sha256': '6d78a8c84104ef734170fc8cc5de2982e2a69f5581d1a20c827ba5ebdd9b5e68',
                       'databaseBuild': None, 'scope': 'Compilación suministrada; citas dentro no equivalen a lectura independiente de Jane\'s/OSINT.'},
            'records': records}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path, help='Carpeta DB3000 de Descriptions.7z ya descomprimida')
    parser.add_argument('--output', type=Path, help='Módulo derivado pequeño; nunca copia la base completa')
    args = parser.parse_args()
    result = build(args.directory)
    output = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False)
    if args.output:
        args.output.write_text("import { deepFreeze } from '../lib/common.mjs';\n\n"
                               "// Generated by research/review-game-sources.py from manually reviewed facts.\n"
                               "export const GAME_SOURCE_REVIEW = deepFreeze(" + output + ");\n")
    else:
        print(output)

if __name__ == '__main__':
    main()
