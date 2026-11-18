"""REA kaynak konumlarından Windows diyaloglarını salt okunur ayrıştırır."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import struct


class Reader:
    def __init__(self, data):
        self.data, self.pos = data, 0

    def take(self, count):
        if count < 0 or self.pos + count > len(self.data):
            raise ValueError(f"Kaynak sınırı aşıldı: {self.pos}+{count}/{len(self.data)}")
        start = self.pos
        self.pos += count
        return self.data[start:self.pos]

    def number(self, fmt):
        return struct.unpack('<' + fmt, self.take(struct.calcsize('<' + fmt)))[0]

    def align(self):
        self.take((-self.pos) % 4)

    def text(self):
        chunks = []
        while True:
            word = self.take(2)
            if word == b'\x00\x00':
                return b''.join(chunks).decode('utf-16-le', errors='strict')
            chunks.append(word)

    def variable(self):
        word = self.number('H')
        if word == 0:
            return None
        if word == 0xffff:
            return {'ordinal': self.number('H')}
        self.pos -= 2
        return self.text()


def decode_dialog(data):
    r = Reader(data)
    extended = data[:4] == b'\x01\x00\xff\xff'
    if extended:
        r.take(4)
        help_id, ex_style, style = [r.number('I') for _ in range(3)]
    else:
        help_id = None
        style, ex_style = r.number('I'), r.number('I')
    count = r.number('H')
    bounds = [r.number('h') for _ in range(4)]
    menu, window_class, title = r.variable(), r.variable(), r.text()
    font = None
    if style & 0x40:  # DS_SETFONT: genişletilmiş biçimde ek font alanları var.
        font = {'pointSize': r.number('H')}
        if extended:
            font.update(weight=r.number('H'), italic=r.number('B'), charset=r.number('B'))
        font['typeface'] = r.text()
    controls = []
    for index in range(count):
        r.align()
        offset = r.pos
        if extended:
            control_help, control_ex, control_style = [r.number('I') for _ in range(3)]
        else:
            control_help = None
            control_style, control_ex = r.number('I'), r.number('I')
        control_bounds = [r.number('h') for _ in range(4)]
        control_id = r.number('I' if extended else 'H')
        control_class, text = r.variable(), r.variable()
        extra_bytes = r.number('H')
        # Standart DLGITEMTEMPLATE boyutu, boyut kelimesini de içerir.
        extra_payload = extra_bytes if extended else max(0, extra_bytes - 2)
        r.take(extra_payload)
        controls.append({'index': index, 'offsetWithinResource': offset,
                         'bytes': r.pos - offset, 'controlId': control_id,
                         'class': control_class, 'text': text, 'bounds': control_bounds,
                         'style': control_style, 'extendedStyle': control_ex,
                         'helpId': control_help, 'extraBytes': extra_bytes})
    return {'format': 'extended' if extended else 'standard', 'title': title,
            'helpId': help_id, 'style': style, 'extendedStyle': ex_style,
            'bounds': bounds, 'menu': menu, 'class': window_class, 'font': font,
            'declaredControls': count, 'controls': controls,
            'consumedBytes': r.pos, 'trailingBytes': len(data) - r.pos}


def decode_string_block(data, block_id):
    r = Reader(data)
    strings = []
    for index in range(16):
        offset = r.pos
        size = r.number('H')
        text = r.take(size * 2).decode('utf-16-le', errors='strict')
        if text:
            strings.append({'stringId': (block_id - 1) * 16 + index,
                            'offsetWithinResource': offset, 'text': text})
    if r.pos != len(data):
        raise ValueError('String bloğu sonunda açıklanamayan baytlar')
    return strings


def inspect(executable, bundle, destination):
    raw = executable.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    evidence = json.loads(bundle.read_text(encoding='utf-8'))
    record = next(r for r in evidence['records'] if r['operation'] == 'inspect_pe_resources')
    report = record['normalized_result']
    if report['artifact']['sha256'] != sha or report['artifact']['bytes'] != len(raw):
        raise ValueError('REA kanıtı EXE kimliğiyle eşleşmiyor')
    pattern = re.compile(r'donat|reinforc|malzeme|material|zemin|soil|temel|foundation|analiz|analysis|rapor|report|diyafram|diaphragm|winkler|taşıma', re.I)
    dialogs, strings, errors = [], [], []
    for resource in report['resources']:
        kind = resource['type'].get('id')
        if kind not in (5, 6):
            continue
        loc = resource['payload']['location']
        start, size = loc['offset'], loc['bytes']
        data = raw[start:start+size]
        if len(data) != size or hashlib.sha256(data).hexdigest() != resource['payload']['sha256']:
            raise ValueError('Kaynak payload kimliği eşleşmiyor')
        identity = {'resourceIndex': resource['index'], 'name': resource['name'],
                    'language': resource['language'], 'location': loc,
                    'payloadSha256': resource['payload']['sha256']}
        try:
            if kind == 5:
                dialog = decode_dialog(data)
                texts = [dialog['title'], *[c['text'] for c in dialog['controls'] if isinstance(c['text'], str)]]
                dialog.update(identity)
                dialog['selectedForEngineering'] = any(pattern.search(t) for t in texts)
                dialogs.append(dialog)
            else:
                if resource['name'].get('kind') != 'id':
                    raise ValueError('String bloğu kimliği sayısal değil')
                for row in decode_string_block(data, resource['name']['id']):
                    if pattern.search(row['text']):
                        strings.append({**identity, **row})
        except (ValueError, UnicodeError, struct.error) as error:
            errors.append({**identity, 'reason': str(error)})
    output = {'exeSha256': sha, 'evidenceId': record['evidence_id'],
              'authority': 'derived', 'source': 'REA payload konumlarından statik RT_DIALOG/RT_STRING ayrıştırma',
              'limitations': ['UI alanı hesap etkisini, serializer ofsetini veya geçerli normatif kuralı kanıtlamaz.',
                              'Runtime gözlemi ve kontrol ID -> ayar nesnesi -> hesap tüketicisi bağlantısı henüz yok.'],
              'dialogs': dialogs, 'selectedStrings': strings, 'decodeErrors': errors}
    destination.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return {'dialogs': len(dialogs), 'selectedDialogs': sum(d['selectedForEngineering'] for d in dialogs),
            'selectedStrings': len(strings), 'decodeErrors': len(errors), 'evidenceId': record['evidence_id']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--exe', type=Path, required=True)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(inspect(args.exe, args.bundle, args.output), ensure_ascii=False))
