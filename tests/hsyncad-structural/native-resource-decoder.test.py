import importlib.util
from pathlib import Path
import struct
import sys
import unittest

sys.dont_write_bytecode = True

MODULE = Path(__file__).resolve().parents[2] / 'scripts/hsyncad/inspect-native-report-resources.py'
SPEC = importlib.util.spec_from_file_location('native_resource_decoder', MODULE)
decoder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(decoder)


def utf16(text):
    return text.encode('utf-16-le') + b'\0\0'


def fixture(extended):
    # Küçük DLG/EX örneği: Türkçe başlık, iki kontrol ve ordinal sınıf.
    if extended:
        data = struct.pack('<HHIIIHhhhh', 1, 0xffff, 0, 0, 0, 2, 0, 0, 100, 80)
    else:
        data = struct.pack('<IIHhhhh', 0, 0, 2, 0, 0, 100, 80)
    data += b'\0\0\0\0' + utf16('Temel – Zemin ğışİ')
    for control_id, text in [(2191, 'qt'), (10722, 'Üst yapı etkileşimli çözüm')]:
        data += b'\0' * ((-len(data)) % 4)
        if extended:
            data += struct.pack('<IIIhhhhI', 0, 0, 0, 1, 2, 30, 10, control_id)
        else:
            data += struct.pack('<IIhhhhH', 0, 0, 1, 2, 30, 10, control_id)
        data += struct.pack('<HH', 0xffff, 0x80) + utf16(text) + b'\0\0'
    return data


class ResourceDecoderTests(unittest.TestCase):
    def test_standard_and_extended_keep_control_identity_and_turkish(self):
        for extended in [False, True]:
            result = decoder.decode_dialog(fixture(extended))
            self.assertEqual([c['controlId'] for c in result['controls']], [2191, 10722])
            self.assertEqual(result['controls'][1]['text'], 'Üst yapı etkileşimli çözüm')
            self.assertEqual(result['controls'][0]['class'], {'ordinal': 0x80})
            self.assertEqual(result['trailingBytes'], 0)

    def test_every_truncated_prefix_is_rejected(self):
        for extended in [False, True]:
            data = fixture(extended)
            for size in range(len(data)):
                with self.assertRaises((ValueError, UnicodeError, struct.error), msg=f'{extended}/{size}'):
                    decoder.decode_dialog(data[:size])

    def test_wrong_count_cannot_read_neighbor_resource(self):
        data = bytearray(fixture(True))
        struct.pack_into('<H', data, 16, 3)
        with self.assertRaises(ValueError):
            decoder.decode_dialog(data)

    def test_missing_control_payload_is_not_ignored(self):
        data = bytearray(fixture(True))
        struct.pack_into('<H', data, len(data)-2, 400)
        with self.assertRaises(ValueError):
            decoder.decode_dialog(data)

    def test_string_ids_and_empty_cells_preserved(self):
        values = ['Beton', '', 'Donatı'] + [''] * 13
        raw = b''.join(struct.pack('<H', len(t)) + t.encode('utf-16-le') for t in values)
        result = decoder.decode_string_block(raw, 4)
        self.assertEqual([r['stringId'] for r in result], [48, 50])
        self.assertEqual(result[1]['text'], 'Donatı')

    def test_invalid_utf16_and_trailing_string_bytes_rejected(self):
        with self.assertRaises(UnicodeError):
            decoder.decode_string_block(b'\x01\0\0\xd8' + b'\0\0' * 15, 1)
        with self.assertRaises(ValueError):
            decoder.decode_string_block(b'\0\0' * 16 + b'\0', 1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
