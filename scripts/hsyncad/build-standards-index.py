"""Yerel resmî yeniden yayın ve TSE katalog kanıtından hesap desteği iddia etmeyen indeks."""
import argparse
import datetime
import hashlib
import html
import json
import pathlib
import re
import zipfile
import xml.etree.ElementTree as ET

W_TEXT = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'
M_TEXT = '{http://schemas.openxmlformats.org/officeDocument/2006/math}t'
W_PARA = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'
RULE = re.compile(r'^\s*(\d{1,2}(?:\.\d+){1,4})(?:\s*[–—-]\s*|\.\s+)(\S.*)$')
RC_CHAPTERS = {1, 2, 3, 4, 6, 7, 16}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def numbered_blocks(paragraphs, member):
    """Dizin satırlarını dışla; alt bent ve denklemleri ana madde kaydında tut."""
    blocks = []
    in_contents = False
    for index, paragraph in enumerate(paragraphs):
        if paragraph.strip() == 'İÇİNDEKİLER':
            in_contents = True
            continue
        match = RULE.match(paragraph)
        # Word içindekilerinde uzun bir başlık ayrı paragrafta devam edebilir.
        # Sonraki devam satırındaki noktalı sayfa hedefi de dizin kanıtıdır.
        following = next((p for p in paragraphs[index+1:index+4] if p.strip()), '')
        # Bazı TOC satırlarında hiç noktalı lider yoktur. Açık içindekiler
        # bölgesinden ancak gerçek madde biçimi (numara + tire + hüküm)
        # veya hemen önündeki numaralı başlıkla çıkılır.
        body_rule = r'^\s*\d+(?:\.\d+)+\s*[–—-]\s*\S'
        if in_contents:
            if re.match(body_rule, paragraph) or (match and re.match(body_rule, following)):
                in_contents = False
            else:
                continue
        toc_continuation = bool(match and not RULE.match(following)
                                and re.search(r'\.{3,}\s*\d+\s*$', following))
        if match and not re.search(r'\.{3,}', paragraph) and not toc_continuation:
            blocks.append({'clause': match[1], 'paragraph': index + 1,
                           'member': member, 'paragraphs': [paragraph]})
        elif blocks:
            blocks[-1]['paragraphs'].append(paragraph)
    for block in blocks:
        text = '\n'.join(block.pop('paragraphs')).strip()
        block['textSha256'] = sha(text.encode('utf-8'))
        block['textCharacters'] = len(text)
        block['preview'] = text[:180]
        block['classification'] = 'parent' if any(
            other['clause'].startswith(block['clause'] + '.') for other in blocks
        ) else 'leaf_candidate'
    return blocks


def source_ready_for_rule_use(source):
    # Katalog, arama özeti veya resmî yeniden yayın tek başına sürümlü kural paketi değildir.
    return bool(source.get('fullTextVerified') and source.get('amendmentSetVerified')
                and source.get('equationsReviewed') and source.get('engineeringReviewed'))


def build(evidence, docs):
    members = []
    all_blocks = []
    texts = evidence / 'indexed-text'
    texts.mkdir(exist_ok=True)
    for member in sorted((evidence / 'ipkb-extracted' / 'TR').glob('*.docx'),
                         key=lambda p: int(re.search(r'\d+', p.name)[0])):
        with zipfile.ZipFile(member) as archive:
            tree = ET.fromstring(archive.read('word/document.xml'))
        paragraphs = [''.join(node.text or '' for node in paragraph.iter()
                              if node.tag in (W_TEXT, M_TEXT))
                      for paragraph in tree.iter(W_PARA)]
        text = '\n'.join(paragraphs)
        text_path = texts / (member.stem + '.txt')
        # Hash, platformun CRLF dönüşümüyle değil gerçekten yazılan LF baytlarıyla eşleşir.
        text_path.write_text(text, encoding='utf-8', newline='\n')
        record = {'member': member.name, 'path': str(member), 'bytes': member.stat().st_size,
                  'sha256': sha(member.read_bytes()), 'textPath': str(text_path),
                  'textSha256': sha(text.encode('utf-8')), 'paragraphs': len(paragraphs)}
        members.append(record)
        all_blocks.extend(numbered_blocks(paragraphs, member.name))
    if len(members) != 15:
        raise ValueError('Beklenen İPKB arşivinin 15 DOCX parçası eksik; başarı verilemez.')
    # Parça sınırındaki devam metni sonraki maddeye katılmaz; tam madde incelemesi ayrı kapıdır.
    seen = set()
    for block in all_blocks:
        key = block['member'], block['paragraph'], block['clause']
        if key in seen:
            raise ValueError('Yinelenen kaynak konumu')
        seen.add(key)
        chapter = int(block['clause'].split('.')[0])
        block.update(id=f"TBDY2018:{block['clause']}:{block['member']}:{block['paragraph']}",
                     chapter=chapter, sourceId='TBDY2018-IPKB-republication',
                     profileScope='candidate' if chapter in RC_CHAPTERS else 'outside_initial_profile',
                     sourceReview='indexed_not_interpreted', implementationStatus='missing',
                     engineeringAcceptance=False, testStatus='not_implemented')
    manifest = {
        'schemaVersion': 1, 'acquiredDate': '2026-11-05',
        'sources': [{
            'id': 'TBDY2018-IPKB-republication', 'publisher': 'İstanbul Valiliği İstanbul Proje Koordinasyon Birimi',
            'landingUrl': 'https://www.ipkb.gov.tr/e-kutuphane/2018-deprem-yonetmeligi/',
            'url': 'https://www.ipkb.gov.tr/wp-content/uploads/2023/03/2018_DEPREM_YAPI_YONETMELIGI_TR.rar',
            'localPath': str(evidence / 'tbdy-ipkb.rar'),
            'bytes': (evidence / 'tbdy-ipkb.rar').stat().st_size,
            'sha256': sha((evidence / 'tbdy-ipkb.rar').read_bytes()),
            'authority': 'official_republication', 'documentVersionClaim': 'TBDY 2018 teknik ek',
            'fullTextAcquired': True, 'fullTextVerified': False, 'amendmentSetVerified': False,
            'equationsReviewed': False, 'engineeringReviewed': False,
            'limitation': '15 DOCX parçası Bölüm 1–17 metnini içerir; özgün AFAD/RG PDF ile bayt/metin, şekil ve denklem eşdeğerliği henüz doğrulanmadı.',
            'members': members,
        }], 'catalogRecords': [], 'acquisitionAttempts': []}
    rows = json.loads((evidence / 'selected-catalog-rows.json').read_text(encoding='utf-8'))
    unique = set()
    for row in rows:
        text = row['rowText']
        match = re.search(r'\b(TS\s+\d+(?:/[A-Z]\d*)?)\b', text)
        date = re.search(r'\b\d{2}\.\d{2}\.\d{4}\b', text)
        if not match or not date:
            continue
        identity = match[1], date[0], 'İptal Standard' in text, 'İngilizce Metin' in text
        if identity in unique:
            continue
        unique.add(identity)
        manifest['catalogRecords'].append({
            'standard': match[1], 'acceptanceDate': date[0],
            'withdrawnLabel': identity[2], 'englishLabel': identity[3],
            'sourceUrl': row['url'], 'sourcePath': row['sourcePath'],
            'sourceSha256': sha(pathlib.Path(row['sourcePath']).read_bytes()),
            'authority': 'official_catalog_metadata', 'fullTextVerified': False,
            'amendmentSetVerified': False, 'equationsReviewed': False, 'engineeringReviewed': False,
            'ruleUseApproved': False,
        })
    for name in ('acquisition-attempts.json', 'catalog-and-regulation-attempts.json', 'catalog-exact-attempts.json'):
        manifest['acquisitionAttempts'].extend(json.loads((evidence / name).read_text(encoding='utf-8')))
    manifest['sources'][0]['ruleUseApproved'] = source_ready_for_rule_use(manifest['sources'][0])
    result = {'schemaVersion': 1, 'sourceManifestSha256': None, 'entries': all_blocks,
              'limitations': ['Madde indeksi mühendislik yorumunun veya tam yaprak kapsamının kabulü değildir.',
                              'Alt bentler ve tablolar bağımsız kontrole bölünmedi; parça sınırları özgün kaynakla kontrol edilmeli.',
                              'Başlık paragrafları da adaydır; her aday otomatik olarak uygulanabilir sayılmaz.']}
    manifest_path = evidence / 'standards-source-manifest.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    result['sourceManifestSha256'] = sha(manifest_path.read_bytes())
    (evidence / 'normative-clause-index.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    rows = [b for b in all_blocks if b['profileScope'] == 'candidate' and b['classification'] == 'leaf_candidate']
    lines = ['# Yaprak yönetmelik kapsamı — başlangıç matrisi', '',
             '5 Kasım 2026. **Hesapla destekli kabul edilmiş yaprak kontrol: 0.** Bu kayıt Aşama 01 araştırma tabanıdır; kurum raporu veya mevzuatın tümünün uygulandığı iddiası değildir.', '',
             '## Kaynak ve kabul sınırı', '',
             '- TBDY 2018 teknik metni [İPKB resmî yayınından](https://www.ipkb.gov.tr/e-kutuphane/2018-deprem-yonetmeligi/) 15 DOCX parçası olarak edinildi; Bölüm 1–17 başlıkları mevcut. AFAD/Resmî Gazete özgün PDF ve güncel tadil eşdeğerliği doğrulanmadı. Formüllerin Word metinleştirmesi sayısal uygulama kaynağı olarak onaylı değildir.',
             '- TS 500 22.02.2000 ile T1 06.02.2001 / T2 19.04.2002 / T3 13.11.2014 katalogda gözlendi. TS 498 30.09.2021 ile T1 05.07.2023 / T2 04.03.2024 / T3 08.07.2024; TS 708 24.03.2016 ile T1 08.07.2024 katalogda gözlendi. [TSE arama kaynağı](https://intweb.tse.org.tr/Standard/Standard/StandardAra.aspx). Katalog tarihi, hukuken kullanılacak baskı/tadil setinin veya tam metnin kabulü değildir. Detay istekleri HTTP 200 güvenlik challenge döndürdü; bunlar standart tam metni sayılmadı.',
             '- TS 500/T2 tarihçesi gibi bağlayıcılık farkları özgün Resmî Gazete kaynağıyla ayrıca çözülecek; katalogdaki tüm tadiller körlemesine birleştirilmez. Standart satın alınmadı.',
             '- Tam standart metni dar repo docs/public aramasında bulunmadı. Disk geneli taranmadı.', '',
             '## Durum sözleşmesi', '',
             '`missing`: kaynak/kural/algoritma/test kabulü tamamlanmadı. `requires_review`: açık mühendis değerlendirmesi gerekebilir; otomatik PASS değildir. `not_applicable` yalnız proje koşulu kanıtlanırsa sonuç kaydında kullanılabilir; kapsam dışı profil tek başına proje N/A kararı değildir.', '',
             f'Aşağıda Bölüm 1/2/3/4/6/7/16 için {len(rows)} yaprak madde **adayı** listelenir. Başlık, alt bent, tablo ve koşul yaprakları ayrıca ayrıştırılacak. Tam indeks, kaynak konumu/digest ve kapsam dışı bölümler özel kanıt klasöründeki `normative-clause-index.json` içindedir. Otomatik çıkarılan maddelerin durumu `indexed_not_interpreted`; bu dosya bütün hükümlerin tek tek mühendislik incelemesinin yapıldığını söylemez.', '',
             '| Madde adayı | Kaynak: DOCX / paragraf | Uygulama | Kabul/test |',
             '|---|---|---|---|']
    for b in rows:
        lines.append(f"| TBDY {b['clause']} | {b['member']} / {b['paragraph']} | missing | Kaynak/koşul/formül yorumu ve bağımsız sınır testi bekliyor |")
    lines += ['', '## TS 500 ve tamamlayıcı standartlar için çözülmemiş yapraklar', '',
              'Tam yetkili nüsha olmadan madde numarası veya sayısal katsayı tahmin edilmedi. Aşağıdaki aileler `unmapped_source_missing`; her biri yetkili madde/algoritma/koşul/test bağlantısına ayrılmadan destekli olamaz.', '',
              '| Aile | Kaynak | Eksik kabul |', '|---|---|---|']
    for family in ['Malzeme dayanımı ve tasarım katsayıları', 'Yük birleşimi ve güvenlik', 'Tek/çift donatılı ve tablalı eğilme', 'Eksenel yük / iki eksenli eğilme / narinlik', 'Kesme / burulma / sürtünme kesmesi', 'Döşeme kalınlığı / zımbalama / detaylandırma', 'Temel / merdiven dayanım ve detayları', 'Kenetlenme / bindirme / kanca / donatı aralıkları', 'Sehim / çatlak / uzun süre etkileri']:
        lines.append(f'| {family} | TS 500 baskı/tadil seti | Tam metin, yaprak madde ve bağımsız test eksik |')
    lines += ['| Kullanım/sabit/kar/rüzgâr yükleri ve hareketli yük azaltması | TS 498 baskı/tadil seti | Tam metin ve projeye uygulanabilirlik eksik |',
              '| Donatı çeliği sınıfı/özellikleri ve ürün kabulü | TS 708 baskı/tadil seti | Tam metin ve malzeme kaynağı eksik |', '',
              '## Negatif kabul kapıları', '',
              '- Kaynak yalnız katalog/arama snippet ise formül veya limit kodlanmaz.',
              '- Alt bent ve tablo koşulu çözülmeden üst maddeye tek global limit atanmaz.',
              '- A1/B1 tespiti, yöntem seçimi ve yöntem geçerliliği ayrı kayıttır.',
              '- Zemin etüt PDF yokluğu tek başına yapısal hesabı engellemez; zorunlu geoteknik veri/kapsam eksikliği uygunluğa çevrilmez.',
              '- Yetersiz mod, çözülemeyen temel teması, boş donatı ve eksik son eleman kapsamı PASS olamaz.', '',
              'Kanıt kökü: `C:\\Users\\hsyn\\Desktop\\hsyncad\\incelemeler\\statik-rapor-uygulama-2026-11-05\\asama-01\\standards`. `standards-source-manifest.json`, `normative-clause-index.json`, TSE ham katalog HTML ve HTTP/run logları burada. Ürün runtime bu dosyalara bağımlı değildir.', '']
    (docs / 'CODE_COVERAGE.md').write_text('\n'.join(lines), encoding='utf-8')
    summary = {'members': len(members), 'indexedBlocks': len(all_blocks), 'rcLeafCandidates': len(rows),
               'catalogRecords': len(manifest['catalogRecords']), 'ruleUseApproved': False}
    print(json.dumps(summary, ensure_ascii=False))
    return manifest, result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--evidence', required=True, type=pathlib.Path)
    parser.add_argument('--docs', required=True, type=pathlib.Path)
    arguments = parser.parse_args()
    build(arguments.evidence, arguments.docs)
