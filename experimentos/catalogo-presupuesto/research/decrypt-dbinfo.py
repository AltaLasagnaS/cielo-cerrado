"""Recover the supplied legacy DBInfo registry; never execute game binaries.

Independent implementation of standard primitives, verified on the supplied
file. Format constants were located in the public reference reader documented
in AMPLIACION-VARIANTES-Y-RADARES.md, not guessed from the ciphertext. This is
registry metadata, not a license reader or a weapons-database exporter.
Optional dependency: cryptography. Raw XML is written only to --xml-output.
"""
import argparse
import base64
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import struct
import xml.etree.ElementTree as ET

# Public legacy file-format constants, not a user's authentication secret.
FORMAT_SECRET = ('6b887c5ac993e7ae98c4c08e19f56429fdeb440755a4701b-7e80-4e57-9b96-'
                 '3e9bee544da1942448a6-3112-4975-a68c-68782c80c0af')
FORMAT_SALT = b'o6806642kbM7c5'


def decode(raw):
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives.padding import PKCS7
    if not raw or len(raw) > 2 * 1024 * 1024:
        raise ValueError('Tamaño de DBInfo inválido')
    binary = base64.b64decode(raw.strip(), validate=True)
    if len(binary) < 36 or struct.unpack('<I', binary[:4])[0] != 16 or (len(binary)-20) % 16:
        raise ValueError('Contenedor de DBInfo incompatible')
    key = hashlib.pbkdf2_hmac('sha1', FORMAT_SECRET.encode('ascii'), FORMAT_SALT, 1000, 32)
    decryptor = Cipher(algorithms.AES(key), modes.CBC(binary[4:20])).decryptor()
    padded = decryptor.update(binary[20:]) + decryptor.finalize()
    unpadder = PKCS7(128).unpadder()
    plain = unpadder.update(padded) + unpadder.finalize()
    # .NET StreamReader consumes an optional UTF-8 BOM. No XML entity expansion.
    text = plain.decode('utf-8-sig')
    if '<!DOCTYPE' in text.upper() or '<!ENTITY' in text.upper():
        raise ValueError('Declaraciones XML no admitidas')
    root = ET.fromstring(text)
    if root.tag != 'DBFiles':
        raise ValueError('Texto descifrado no es el registro DBFiles esperado')
    rows = []
    for child in root:
        if len(rows) >= 5000:
            raise ValueError('Demasiadas entradas de registro')
        row = {c.tag: c.text for c in child}
        if (len(child) != 5 or set(row) != {'DBID', 'Name', 'Hash', 'File', 'Supported'}
                or any(v is None for v in row.values()) or not row['DBID'].isdigit()
                or not re.fullmatch(r'[a-fA-F0-9]{40}', row['Hash'])
                or row['Supported'] not in ['True', 'False'] or len(row['Name']) > 2000
                or len(row['File']) > 200 or '/' in row['File'] or '\\' in row['File']):
            raise ValueError('Entrada de registro incompatible')
        rows.append(row)
    if not rows:
        raise ValueError('Registro vacío')
    return plain, rows


def summarize(raw, plain, rows, databases):
    matches = []
    for path in databases:
        # Hash supplied local files only; no paths taken from the XML are read.
        if not path.is_file() or path.stat().st_size > 256 * 1024 * 1024:
            raise ValueError('Base ausente o mayor al límite de lectura')
        data = path.read_bytes()
        sha1 = hashlib.sha1(data).hexdigest()
        candidates = [r for r in rows if r['Hash'].lower() == sha1]
        labels = [r for r in rows if r['File'].casefold() == path.name.casefold()]
        matches.append({'file': path.name, 'sha1': sha1, 'sha256': hashlib.sha256(data).hexdigest(),
                        'hashMatches': candidates, 'sameFilenameRows': labels,
                        'verifiedByThisManifest': len(candidates) == 1})
    return {'format': 'cielo-cerrado/dbinfo-recovery-review', 'version': 1,
            'reviewedOn': '2026-10-05', 'sourceSha256': hashlib.sha256(raw).hexdigest(),
            'cipher': 'AES-256-CBC', 'padding': 'PKCS7', 'encoding': 'base64',
            'keyDerivation': {'algorithm': 'PBKDF2-HMAC-SHA1', 'iterations': 1000, 'keyBytes': 32},
            'plaintextRecovered': True, 'plaintextBytes': len(plain), 'plaintextSha256': hashlib.sha256(plain).hexdigest(),
            'xmlRoot': 'DBFiles', 'records': len(rows), 'countsByDBID': dict(Counter(r['DBID'] for r in rows)),
            'comparisons': matches,
            'scope': 'Registro de archivos, nombres y hashes. Supported es la marca del registro del juego, no prueba de capacidad física ni compatibilidad de armas.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--xml-output', required=True, type=Path)
    parser.add_argument('--review-output', required=True, type=Path)
    parser.add_argument('--database', action='append', type=Path, default=[])
    args = parser.parse_args()
    if args.input.resolve() in [args.xml_output.resolve(), args.review_output.resolve()] or args.xml_output.resolve() == args.review_output.resolve():
        raise ValueError('No sobrescribir entrada ni mezclar salidas')
    raw = args.input.read_bytes()
    plain, rows = decode(raw)
    review = summarize(raw, plain, rows, args.database)
    args.xml_output.write_bytes(plain)
    args.review_output.write_text(json.dumps(review, ensure_ascii=False, indent=2, allow_nan=False)+'\n')
    print(f'DBInfo recuperado: {len(rows)} entradas XML; {sum(r["verifiedByThisManifest"] for r in review["comparisons"])} bases verificadas por hash.')


if __name__ == '__main__':
    main()
