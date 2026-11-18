"""Sentetik renderer PDF kanıtını yeniden açar, kapsam/basım sınırlarını denetler."""
from pathlib import Path
import json
import re
import subprocess
import sys
import pdfplumber
from pypdf import PdfReader


def main(folder, renderer):
    results = []
    for name in ['p02-missing-static.pdf', 'p02-failed-static.pdf']:
        file = folder/name
        reader = PdfReader(file)
        texts = [page.extract_text() or '' for page in reader.pages]
        text = '\n'.join(texts)
        assert all('TASLAK' in t for t in texts)
        assert not re.search('E-İMZALIDIR|Resmi Onay Belgesidir|TÜM SINIRLAR SAĞLANDI|GÜVENLİ', text)
        if 'failed' in name:
            assert 'SAĞLANMADI' in text
            assert all(f'column-{i}' in text for i in range(100))
        else:
            assert 'VERİ EKSİK' in text
        outside = []
        with pdfplumber.open(file) as pdf:
            for p, page in enumerate(pdf.pages, 1):
                for char in page.chars:
                    if char['text'].strip() and (char['x0'] < 0 or char['x1'] > page.width+0.1 or char['top'] < 0 or char['bottom'] > page.height+0.1):
                        outside.append({'page': p, 'text': char['text'], 'x': char['x0'], 'y': char['top']})
        assert not outside, outside[:10]
        selected = sorted(set([1, 2, len(reader.pages)]))
        for page in selected:
            subprocess.run([renderer, '-f', str(page), '-l', str(page), '-r', '120', '-singlefile', '-png', str(file), str(folder/f'{file.stem}-p{page}')], check=True, timeout=30, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        results.append({'file': str(file), 'pages': len(reader.pages), 'textCharacters': len(text), 'outsidePageGlyphs': outside, 'renderedPages': selected})
    (folder/'pdf-qa.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(results, ensure_ascii=False))


if __name__ == '__main__':
    main(Path(sys.argv[1]), sys.argv[2])
