"""P07 actual evidence, intentional P06 refactor delta, and original-source protection."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess


def read(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def write(p, data):
    p.write_bytes((json.dumps(data, ensure_ascii=False, indent=2)+'\n').encode('utf-8'))


def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as stream:
        for b in iter(lambda: stream.read(4*1024*1024), b''):
            h.update(b)
    return h.hexdigest()


def main(root, evidence):
    docs = root/'docs/hsyncad/statik-rapor'
    tasks = read(docs/'TASKS.json')
    initial = read(evidence.parent/'asama-00/baseline.json')
    previous = read(evidence/'baseline.json')['sourceHashes']
    previous.update(read(evidence.parent/'asama-04/preservation-and-closure.json')['files'])
    allowed = {'src/lib/hsyncad/structural/sparse-spd.ts', 'src/lib/hsyncad/structural/linear-structure.ts'}
    changed = []
    for filename, digest in previous.items():
        current = sha(root/filename)
        if current != digest:
            assert filename in allowed, filename
            changed.append({'path': filename, 'before': digest, 'after': current})
    assert {f['path'] for f in changed} == allowed
    for item in initial['dirtyFiles']:
        assert sha(root/item['path']) == item['sha256'], item['path']
    for item in initial['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    expected_jobs = [('closure-domain', 0), ('closure-final-lint', 0), ('closure-final-tsc', 2),
                     ('closure-final-app-tsc', 0), ('building-modal-benchmark', 0),
                     ('building-response-benchmark', 0), ('browser-dynamic-final', 0),
                     ('tdmd-fetch', 0), ('source-extract-02', 0), ('source-extract-additional', 0),
                     ('create-examples', 0), ('cli-ready', 0), ('cli-repeat', 0),
                     ('cli-blocked', 2), ('cli-overwrite', 1)]
    checks = []
    for name, expected in expected_jobs:
        r = read(evidence/name/'result.json')
        assert r['exitCode'] == expected and r['terminationReason'] is None, name
        checks.append(dict(r, scope=name, expectedExitCode=expected,
                           status='failed_existing_debt' if name == 'closure-final-tsc' else 'expected_result',
                           evidencePath=str(evidence/name/'result.json')))
    output = (evidence/'closure-domain/stdout.log').read_text(encoding='utf-8')
    assert re.search(r'pass 57\b', output) and re.search(r'fail 0\b', output) and re.search(r'skipped 0\b', output)
    def signatures(p):
        return Counter(re.sub(r'\(\d+,\d+\):', ':', line) for line in p.read_text(encoding='utf-8').splitlines() if 'error TS' in line)
    before = signatures(evidence.parent/'asama-06/closure-tsc-final/stdout.log')
    current = signatures(evidence/'closure-final-tsc/stdout.log')
    assert sum(before.values()) == sum(current.values()) == 552 and before == current
    delta = {'baselineCount': 552, 'currentCount': 552, 'newSignatures': [], 'removedSignatures': [], 'generalTypecheckPassed': False}
    write(evidence/'general-tsc-delta.json', delta)
    for name in ['building-modal-benchmark.json', 'building-response-benchmark.json']:
        r = read(evidence/name)
        assert r['pass'] and r['nodes'] == 792 and r['shells'] == 525, name
    browser = read(evidence/'browser-dynamic-final.json')
    assert browser['large']['status'] == 'solved' and browser['large']['elapsedMs'] < 180000
    assert browser['large']['coverage']['X'] > .97 and browser['large']['coverage']['Y'] > .97
    assert browser['ticks'] > 5 and browser['cancelledWithoutResult'] and browser['invalidStatus'] == 'invalid_input'
    assert all(m['relativeResidual'] <= 1e-7 for m in browser['large']['modes'])
    examples = evidence/'examples'
    assert (examples/'ready-output.json').read_bytes() == (examples/'repeat-output.json').read_bytes()
    ready = read(examples/'ready-output.json')
    assert ready['inputSha256'] == sha(examples/'ready-input.json')
    assert ready['result']['status'] == 'solved' and ready['engineeringAcceptance'] is False
    assert read(examples/'blocked-output.json')['result']['status'] != 'solved'
    source = read(evidence/'source-manifest.json')
    assert source['pages'] == 416 and sha(evidence/'TBDY_TDMD.pdf') == source['sha256']
    assert len(source['visuallyReviewedPdfPageIndices']) == 14 and source['amendmentSetVerified'] is False
    for page, digest in source['imageHashes'].items():
        assert sha(evidence/f'source-page-{page}.png') == digest
    git = lambda *args: subprocess.run(['git', *args], cwd=root, check=True, timeout=30, capture_output=True, text=True).stdout.strip()
    assert git('rev-parse', 'HEAD') == initial['head'] == git('rev-parse', 'main')
    assert git('branch', '--show-current') == 'internal-hsyncad-statik-rapor'
    subprocess.run(['git', 'diff', '--check'], cwd=root, check=True, timeout=30)
    files = ['src/lib/hsyncad/structural/'+n+'.ts' for n in ['sparse-spd', 'linear-structure', 'structural-system',
             'modal-eigen', 'modal-structure', 'rigid-diaphragm', 'design-spectrum', 'modal-combination', 'response-spectrum',
             'dynamic-analysis-sets', 'dynamic-worker']]
    files += ['tests/hsyncad-structural/'+n for n in ['modal-fixtures.ts', 'modal-eigen.test.ts',
              'spectrum-combination.test.ts', 'dynamic-pipeline.test.ts']]
    files += ['scripts/hsyncad/'+n for n in ['p07-fixtures.ts', 'benchmark-p07.ts', 'benchmark-p07-response.ts',
              'verify-p07-worker.mjs', 'export-dynamic-analysis.ts', 'create-p07-evidence.ts', 'audit-stage07.py']]
    hashes = {name: sha(root/name) for name in files}
    write(evidence/'final-source-snapshot.json', {'files': hashes})
    task = next(t for t in tasks['tasks'] if t['id'] == 'P07')
    task.update(title='Gerçek modal/spektrum analizi ve kombinasyonlar', status='complete',
                acceptance='passed_for_explicit_modal_spectrum_and_analysis_set_profile',
                changedFiles=files+['docs/hsyncad/statik-rapor/P07_DYNAMIC_ANALYSIS.md'], verification=checks,
                evidencePaths=[str(evidence)],
                blocker='Native üç proje kabulü, mevzuat değişiklik seti, P08 uygulanabilirlik/bölgesel tasarım kararları ve istatistiksel kuvvet etkileşim kabulü açık.',
                nextAction='P08 karar grafiği ve global TBDY kontrolleri yalnız sonraki devam komutuyla.')
    task['attempts'] = [dict(read(p), evidencePath=str(p)) for p in sorted(evidence.glob('*/result.json')) if p.parent.name not in dict(expected_jobs)]
    tasks.update(updatedAt=datetime.now(timezone.utc).isoformat(), currentStage='P07', nextStage='P08', waitingForUser=True, overallAcceptance=False)
    tasks['verificationSourceHashes'].update(hashes)
    write(docs/'TASKS.json', tasks)
    result = {'originalSourcesPreserved': len(initial['originalSources']), 'initialDirtyFilesPreserved': len(initial['dirtyFiles']),
              'previousSourcesUnchanged': len(previous)-len(changed), 'intentionalP06Refactor': changed, 'sourceFilesVerified': len(hashes),
              'headUnchanged': True, 'domainTests': 57, 'generalTypeScript': delta, 'deterministicCliBytes': True,
              'nativeAcceptance': False, 'engineeringAcceptance': False, 'phase07Acceptance': task['acceptance'],
              'nextStage': 'P08', 'waitingForUser': True}
    write(evidence/'preservation-and-closure.json', result)
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    main(args.repo, args.evidence)
