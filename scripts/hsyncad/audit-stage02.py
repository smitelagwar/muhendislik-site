"""P02 kaynak koruma, son kaynak parmak izi ve rapor kapısını denetler."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def audit(root, evidence):
    initial = read(evidence.parent/'asama-00/baseline.json')
    stage = read(evidence/'baseline.json')
    allowed = {item['path'] for item in stage['files']}
    unchanged = 0
    changed = []
    for item in initial['trackedFiles']:
        if sha(root/item['path']) == item['sha256']:
            unchanged += 1
        else:
            assert item['path'] in allowed, item['path']
            changed.append(item['path'])
    for item in initial['dirtyFiles']:
        assert sha(root/item['path']) == item['sha256'], item['path']
    for item in initial['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    for item in stage['files']:
        assert sha(evidence/'before'/item['path']) == item['sha256'], item['path']
    snapshot = read(evidence/'final-source-snapshot.json')
    for filename, checksum in snapshot['files'].items():
        assert sha(root/filename) == checksum, filename
    docs = root/'docs/hsyncad/statik-rapor'
    tasks = read(docs/'TASKS.json')
    assert tasks['overallAcceptance'] is False
    p01, p02 = [next(t for t in tasks['tasks'] if t['id'] == key) for key in ['P01', 'P02']]
    assert p01['acceptance'] == 'not_passed'
    assert p02['status'] == 'complete' and tasks['waitingForUser']
    assert tasks['nextStage'] == 'P03'
    for filename in ['src/lib/hsyncad/quantities.ts', 'src/lib/hsyncad/reports.ts', 'scripts/verify-metraj-idecad.mjs']:
        text = (root/filename).read_text(encoding='utf-8')
        for forbidden in ['CERTIFIED_METRAJ_REFERENCE', 'isCertifiedReferenceModel', 'E-İMZALIDIR', 'Resmi Onay Belgesidir']:
            assert forbidden not in text, (filename, forbidden)
    pdf_qa = read(evidence/'pdf-examples-final/pdf-qa.json')
    assert len(pdf_qa) == 2 and all(not f['outsidePageGlyphs'] for f in pdf_qa)
    for job, expected in [('report-integrity-closure', 0), ('geometry-regression', 0), ('modal-integrity', 0),
                          ('build-verified', 0), ('browser-verified', 0), ('lint-closure', 0),
                          ('pdf-qa-final', 0), ('general-tsc-closure', 2)]:
        result = read(evidence/job/'result.json')
        assert result['exitCode'] == expected and result['terminationReason'] is None, job
    delta = read(evidence/'general-tsc-closure-delta.json')
    assert delta['newSignatures'] == []
    git = lambda *args: subprocess.run(['git', *args], cwd=root, check=True, timeout=30, capture_output=True, text=True).stdout.strip()
    assert git('rev-parse', 'HEAD') == initial['head'] == git('rev-parse', 'main')
    assert git('branch', '--show-current') == 'internal-hsyncad-statik-rapor'
    subprocess.run(['git', 'diff', '--check'], cwd=root, check=True, timeout=30)
    return {'originalSourcesPreserved': len(initial['originalSources']),
            'initialDirtyFilesPreserved': len(initial['dirtyFiles']),
            'initialTrackedFilesUnchanged': unchanged, 'authorizedTrackedChanges': changed,
            'beforeSnapshotsVerified': len(stage['files']), 'finalSourceFilesVerified': len(snapshot['files']),
            'generalTypeScript': delta, 'stage02IntegrityAcceptance': True,
            'engineeringAcceptance': False, 'headUnchanged': True, 'nextStage': 'P03', 'waitingForUser': True}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', required=True, type=Path)
    parser.add_argument('--evidence', required=True, type=Path)
    args = parser.parse_args()
    result = audit(args.repo, args.evidence)
    output = args.evidence/'preservation-and-closure.json'
    output.write_bytes((json.dumps(result, ensure_ascii=False, indent=2)+'\n').encode('utf-8'))
    print(json.dumps(result, ensure_ascii=False))
