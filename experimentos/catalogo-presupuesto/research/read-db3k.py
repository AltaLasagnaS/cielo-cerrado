"""Selected, reproducible SQLite evidence from supplied DB3K builds.

Keeps raw game values and associations. No guessed units, physical certification,
whole database export, guessed gimbal angle, or automatic runtime enablement.
"""
import argparse
import hashlib
import json
import sqlite3
from pathlib import Path

SELECT = {
    'DataWeapon': [642, 1150, 3207, 403, 1156, 1831, 652, 1147, 2970, 598, 2771, 2891, 4041, 681],
    'DataMount': [388, 816, 963, 2759, 2760, 2761, 1658, 936, 318],
    'DataSensor': [984, 2498, 395, 975, 974, 632],
}
FIELDS = {
    'DataWeapon': ['ID', 'Name', 'Comments', 'BurnoutTime', 'AirRangeMin', 'AirRangeMax',
                   'TargetAltitudeMin', 'TargetAltitudeMax', 'Hypothetical', 'Deprecated'],
    'DataMount': ['ID', 'Name', 'Comments', 'Capacity', 'MagazineCapacity', 'Hypothetical', 'Deprecated'],
    'DataSensor': ['ID', 'Name', 'Comments', 'ScanInterval', 'RadarPRF', 'RadarPulseWidth',
                   'RadarPeakPower', 'RadarHorizontalBeamwidth', 'RadarVerticalBeamwidth',
                   'MaxContactsAir', 'MaxContactsIlluminate', 'Hypothetical', 'Deprecated'],
}

# Small second selection: labels/configurations are game claims, not a list of
# equipment available to Ukraine. Keep land, naval and export records distinct.
EXPANSION = {
    'DataWeapon': [1832, 2333, 512, 496, 735, 1673, 3898, 1154, 1153, 877,
                   1324, 4075, 1144, 2970, 71, 3123, 2740, 4281, 3842, 3774],
    'DataMount': [320, 2012, 115, 1478, 1476, 1475, 3729, 1483, 1482, 51,
                  128, 3725, 959, 2556, 2557, 139, 2473, 2282, 3980, 3431, 3381],
    'DataSensor': [960, 2611, 963, 2693, 2697, 412, 632, 7378, 2634, 974,
                   5028, 5901, 1971, 2991, 989, 3198, 4155],
}
EXPANSION_FIELDS = {**FIELDS, 'DataSensor': FIELDS['DataSensor'] + [
    'RangeMin', 'RangeMax', 'AltitudeMin', 'AltitudeMax', 'AltitudeMin_ASL', 'AltitudeMax_ASL']}


def read_database(build, path, selection=SELECT, fields=FIELDS, sensor_codes=False):
    path = path.resolve(strict=True)
    if path.stat().st_size > 128 * 1024 * 1024:
        raise ValueError('Tamaño descomprimido mayor al límite de revisión')
    raw = path.read_bytes()
    if not raw.startswith(b'SQLite format 3\x00'):
        raise ValueError('No es SQLite reconocible')
    digest = hashlib.sha256(raw).hexdigest()
    c = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)
    c.row_factory = sqlite3.Row
    try:
        c.execute('PRAGMA query_only=ON')
        c.execute('PRAGMA trusted_schema=OFF')
        records = []
        for table, identifiers in selection.items():
            available = {r['name'] for r in c.execute('PRAGMA table_info('+table+')')}
            if not {'ID', 'Name'} <= available:
                raise ValueError(table + ': falta esquema de identidad requerido')
            columns = ','.join(f for f in fields[table] if f in available)
            missing_columns = [f for f in fields[table] if f not in available]
            for identifier in identifiers:
                row = c.execute('SELECT ' + columns + ' FROM ' + table + ' WHERE ID=?', (identifier,)).fetchone()
                record = {'table': table, 'componentId': identifier, 'present': row is not None,
                          'rawFields': {f: row[f] if f in available else None for f in fields[table]} if row else None,
                          'missingColumns': missing_columns, 'runtimeEnabled': False,
                          'normalizedPhysicalParameters': None}
                if row and table == 'DataMount':
                    record['weaponRecords'] = [dict(r) for r in c.execute('''
                        SELECT m.ComponentNumber, m.ComponentID AS recordId,
                        r.ComponentID AS weaponId, w.Name AS weaponName,
                        r.DefaultLoad, r.MaxLoad, r.Multiple
                        FROM DataMountWeapons m JOIN DataWeaponRecord r ON r.ID=m.ComponentID
                        JOIN DataWeapon w ON w.ID=r.ComponentID
                        WHERE m.ID=? ORDER BY m.ComponentNumber''', (identifier,))]
                    record['realLauncherCompatibility'] = None
                if row and table == 'DataWeapon':
                    record['seekerSensors'] = [dict(r) for r in c.execute('''
                        SELECT s.ID, s.Name, s.RadarHorizontalBeamwidth, s.RadarVerticalBeamwidth
                        FROM DataWeaponSensors w JOIN DataSensor s ON s.ID=w.ComponentID
                        WHERE w.ID=? ORDER BY w.ComponentNumber''', (identifier,))]
                    record['weaponCodes'] = [dict(r) for r in c.execute('''
                        SELECT w.CodeID, e.Description FROM DataWeaponCodes w
                        LEFT JOIN EnumWeaponCode e ON e.ID=w.CodeID
                        WHERE w.ID=? ORDER BY w.CodeID''', (identifier,))]
                    record['seekerGimbalDegrees'] = None
                    record['terminalLateralAccelerationMps2'] = None
                if row and table == 'DataSensor' and sensor_codes:
                    record['sensorCodes'] = [dict(r) for r in c.execute('''
                        SELECT s.CodeID, e.Description FROM DataSensorCodes s
                        LEFT JOIN EnumSensorCode e ON e.ID=s.CodeID
                        WHERE s.ID=? ORDER BY s.CodeID''', (identifier,))]
                records.append(record)
        return {'buildLabel': build, 'versionBasis': 'supplied-filename', 'verifiedInternalBuild': None,
                'file': path.name, 'sha256': digest, 'role': 'game-database', 'confidence': 'medium-low',
                'counts': {t: c.execute('SELECT COUNT(*) FROM '+t).fetchone()[0] for t in SELECT},
                'records': records}
    finally:
        c.close()


def compare(builds):
    differences = []
    for before, after in zip(builds, builds[1:]):
        old = {(r['table'], r['componentId']): r for r in before['records']}
        for new in after['records']:
            key = (new['table'], new['componentId'])
            previous = old[key]
            if previous != new:
                same_label = bool(previous['present'] and new['present'] and
                                  previous['rawFields']['Name'] == new['rawFields']['Name'])
                differences.append({'fromBuild': before['buildLabel'], 'toBuild': after['buildLabel'],
                                    'table': key[0], 'componentId': key[1], 'sameLabel': same_label,
                                    'changedFields': [field for field in sorted(set(previous) | set(new))
                                                      if previous.get(field) != new.get(field)],
                                    'note': 'Cambio de registro del juego; mismo nombre no prueba equivalencia física.'})
    return differences


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', action='append', required=True, help='BUILD=RUTA.db3')
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--profile', choices=['initial', 'expansion'], default='initial')
    args = parser.parse_args()
    builds = []
    for spec in args.database:
        label, path = spec.split('=', 1)
        if args.profile == 'expansion':
            builds.append(read_database(int(label), Path(path), EXPANSION, EXPANSION_FIELDS, sensor_codes=True))
        else:
            builds.append(read_database(int(label), Path(path)))
    builds.sort(key=lambda b: b['buildLabel'])
    if len({b['buildLabel'] for b in builds}) != len(builds):
        raise ValueError('Etiqueta de build repetida')
    result = {'format': 'cielo-cerrado/db3k-selected-review', 'version': 1,
              'reviewedOn': '2026-10-05', 'builds': builds, 'differences': compare(builds),
              'units': 'Raw game fields: units/meaning require independent field-specific verification.',
              'runtimeEnabled': False}
    if args.profile == 'expansion':
        result['selectionProfile'] = 'ground-air-defence-expansion'
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False)+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()
