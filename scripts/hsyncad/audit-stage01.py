"""P01 kanıt, kaynak koruma ve kapsam bağlarını doğrular; mühendislik kabulü vermez."""
import argparse
import hashlib
import json
from pathlib import Path


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for data in iter(lambda: f.read(4*1024*1024), b''):
            h.update(data)
    return h.hexdigest()


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def audit(root, evidence):
    docs = root/'docs/hsyncad/statik-rapor'
    baseline = read(evidence.parent/'asama-00/baseline.json')
    for group in ['dirtyFiles', 'trackedFiles']:
        for item in baseline[group]:
            assert sha(root/item['path']) == item['sha256'], item['path']
    for item in baseline['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    corpus = read(evidence/'corpus/reference-section-catalog.json')
    sections = corpus['sections']
    assert len({s['id'] for s in sections}) == len(sections) == 515
    assert all(s['bodyHeadingVerified'] and s['plannedStages'] for s in sections)
    ledger = read(docs/'REA_UNKNOWN_LEDGER.json')
    assert [r['id'] for r in ledger['questions']] == [f'R{i}' for i in range(1, 9)]
    assert not ledger['researchAcceptance']
    assert all(r['nextAction'] and r['blockedFeatures'] and r['evidenceRefs'] for r in ledger['questions'])
    manifest = read(evidence/'standards/standards-source-manifest.json')
    for source in manifest['sources']:
        assert sha(Path(source['localPath'])) == source['sha256']
        assert not source['ruleUseApproved']
        for member in source.get('members', []):
            assert sha(Path(member['path'])) == member['sha256']
            assert sha(Path(member['textPath'])) == member['textSha256']
    clauses = read(evidence/'standards/normative-clause-index.json')
    assert clauses['sourceManifestSha256'] == sha(evidence/'standards/standards-source-manifest.json')
    assert all(not e['engineeringAcceptance'] and e['implementationStatus'] == 'missing' for e in clauses['entries'])
    # Kaynağın başındaki içerik dizini yaprak kural kabul edilemez.
    assert all(e['paragraph'] >= 576 for e in clauses['entries'] if e['member'] == 'part 1_tr.docx')
    fieldmap = read(evidence/'rea/native-field-map.json')
    resource = read(evidence/'rea/native-resource-dialogs.json')
    parity = read(evidence/'rea/source-parser-parity.json')
    assert fieldmap['evidenceId'] == resource['evidenceId'] == parity['evidenceId']
    assert all(value == 'pass' for value in parity['checks'].values())
    for filename, checksum in parity['sourceHashes'].items():
        assert sha(Path(parity['repoPath'])/filename) == checksum
    assert sha(Path(parity['artifact']['path'])) == parity['artifact']['sha256']
    assert not fieldmap['nativeAcceptance'] and not resource['decodeErrors']
    assert sum(p['decodedLoadRows'] for p in fieldmap['nativeFieldEvidence']['projects']) == 528
    assert all(p['mappedLoads'] == 0 for p in fieldmap['nativeFieldEvidence']['projects'])
    # Değiştirilen araştırma dosyaları geçersiz UTF-8/U+FFFD ile kapanamaz.
    files = [*docs.glob('*.md'), *docs.glob('*.json'), * (root/'scripts/hsyncad').glob('*.py'),
             *(root/'scripts/hsyncad').glob('*.mjs')]
    for file in files:
        text = file.read_text(encoding='utf-8')
        assert '\ufffd' not in text and '\x00' not in text, file
    return {'originalSourcesPreserved': len(baseline['originalSources']),
            'initialDirtyFilesPreserved': len(baseline['dirtyFiles']),
            'initialTrackedFilesUnchanged': len(baseline['trackedFiles']),
            'referenceSections': len(sections), 'reaQuestions': len(ledger['questions']),
            'reaResources': parity['coverage']['resources'], 'nativeLoadRows': 528,
            'normativeIndexedCandidates': len(clauses['entries']),
            'engineeringAcceptance': False,
            'reason': 'Normative source and native R1-R8 gates remain open.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', required=True, type=Path)
    parser.add_argument('--evidence', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    result = audit(args.repo, args.evidence)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False))
