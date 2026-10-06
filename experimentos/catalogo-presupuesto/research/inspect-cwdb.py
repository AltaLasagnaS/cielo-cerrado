"""Reproduce a small read-only audit of the supplied CWDB SQLite file.

This is schema/identity evidence, not a physical-unit converter. No extensions,
database modification, full database export or executable content are needed.
"""
import argparse
import hashlib
import json
import sqlite3
from pathlib import Path

EXPECTED_HASH = '4a4ba98ecad165268b4df488b50099b77fb6b3759fd0e70839a922ae22ea2ce4'
TABLES = ('DataWeapon', 'DataSensor', 'DataMount', 'DataFacility', 'DataWeaponRecord')


def inspect(path):
    path = path.resolve(strict=True)
    if path.stat().st_size > 32 * 1024 * 1024:
        raise ValueError('El archivo supera el tamaño de esta revisión')
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_HASH:
        raise ValueError('Archivo distinto del revisado; revisar versión y esquema antes de reutilizar los IDs')
    if not raw.startswith(b'SQLite format 3\x00'):
        raise ValueError('No es una base SQLite reconocible')
    connection = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute('PRAGMA query_only=ON')
        connection.execute('PRAGMA trusted_schema=OFF')
        counts = {table: connection.execute('SELECT COUNT(*) FROM ' + table).fetchone()[0]
                  for table in TABLES}
        sensor = dict(connection.execute('''SELECT ID, Name, Comments, RangeMax,
            ScanInterval, RadarPRF, RadarPulseWidth, RadarPeakPower, MaxContactsIlluminate
            FROM DataSensor WHERE ID=234''').fetchone())
        codes = [dict(row) for row in connection.execute('''SELECT a.CodeID, b.Description
            FROM DataSensorCodes a LEFT JOIN EnumSensorCode b ON b.ID=a.CodeID
            WHERE a.ID=234 ORDER BY a.CodeID''')]
        weapons = [dict(row) for row in connection.execute('''SELECT ID, Name
            FROM DataWeapon WHERE ID IN (16, 168, 1010) ORDER BY ID''')]
        return {
            'format': 'cielo-cerrado/cwdb-schema-review', 'version': 1,
            'source': {'file': path.name, 'sha256': digest, 'database': 'CWDB',
                       'buildLabel': 512, 'versionBasis': 'supplied-filename',
                       'verifiedInternalBuild': None, 'role': 'game-database'},
            'counts': counts, 'selectedSensor': {
                'table': 'DataSensor', 'rawFields': sensor, 'codes': codes,
                'normalizedPhysicalParameters': None,
                'note': 'Valores crudos; cero puede ser valor inicial. Unidades/semántica pendientes.'},
            'selectedWeapons': weapons,
            'runtimeEnabled': False,
        }
    finally:
        connection.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('database', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    rendered = json.dumps(inspect(args.database), ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    if args.output:
        args.output.write_text(rendered, encoding='utf-8')
    else:
        print(rendered, end='')


if __name__ == '__main__':
    main()
