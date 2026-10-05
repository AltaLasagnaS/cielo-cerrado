"""Inspect the supplied DBInfo envelope, without claiming recovered plaintext.

Base64 decoding is not decryption. A 16-byte length-prefixed header and aligned,
high-entropy payload are consistent with common .NET AES envelopes, but do not
identify the algorithm, mode, key derivation or secret. No password guessing.
"""
import argparse
import base64
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import struct


def inspect(path):
    raw = path.read_bytes()
    if not raw or len(raw) > 2 * 1024 * 1024:
        raise ValueError('DBInfo vacío o mayor al límite de inspección')
    binary = base64.b64decode(raw.strip(), validate=True)
    if len(binary) < 4:
        raise ValueError('No hay longitud inicial')
    prefix = struct.unpack('<I', binary[:4])[0]
    if prefix > 256 or 4 + prefix >= len(binary):
        raise ValueError('Cabecera de longitud incompatible con el candidato de formato')
    payload = binary[4 + prefix:]
    probabilities = [count / len(payload) for count in Counter(payload).values()]
    return {
        'format': 'cielo-cerrado/dbinfo-envelope-review', 'version': 1,
        'sourceFile': path.name, 'sha256': hashlib.sha256(raw).hexdigest(),
        'sourceBytes': len(raw), 'encoding': 'base64', 'decodedBytes': len(binary),
        'prefixLengthLittleEndian': prefix, 'payloadBytes': len(payload),
        'payloadModulo16': len(payload) % 16,
        'payloadEntropyBitsPerByte': -sum(p * math.log2(p) for p in probabilities),
        'cipher': None, 'mode': None, 'keyDerivation': None, 'plaintextRecovered': False,
        'databaseVersionsVerified': None,
        'note': 'Compatible con contenedor .NET de IV y cifrado en bloques; no confirma AES ni descifra. Hace falta el lector/clave del archivo para verificar el esquema.'
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(inspect(args.input), ensure_ascii=False, indent=2, allow_nan=False) + '\n')


if __name__ == '__main__':
    main()
