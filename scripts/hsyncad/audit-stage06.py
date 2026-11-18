"""Close P06 only after actual numerical, browser, type and preservation checks."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone


def read(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def write(p, value):
    p.write_bytes((json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode('utf-8'))


def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda: f.read(4*1024*1024), b''):
            h.update(b)
    return h.hexdigest()


def main(root, evidence):
    docs = root/'docs/hsyncad/statik-rapor'
    tasks = read(docs/'TASKS.json')
    initial = read(evidence.parent/'asama-00/baseline.json')
    old_hashes = dict(tasks['verificationSourceHashes'])
    old_hashes.update(read(evidence.parent/'asama-04/preservation-and-closure.json')['files'])
    # A repeated audit still verifies current sources, while original sources remain immutable.
    for filename, value in old_hashes.items():
        assert sha(root/filename) == value, filename
    for item in initial['dirtyFiles']:
        assert sha(root/item['path']) == item['sha256'], item['path']
    for item in initial['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    jobs = [('closure-tests-refined', 0), ('closure-lint-final', 0), ('closure-tsc-final', 2),
            ('application-tsc', 0), ('mixed-building-benchmark', 0), ('browser-worker-final', 0)]
    verified = []
    for name, expected in jobs:
        result = read(evidence/name/'result.json')
        assert result['exitCode'] == expected and result['terminationReason'] is None, name
        verified.append(dict(result, scope=name, expectedExitCode=expected,
                             status='pass' if expected == 0 else 'failed_existing_debt',
                             evidencePath=str(evidence/name/'result.json')))
    test_output = (evidence/'closure-tests-refined/stdout.log').read_text(encoding='utf-8')
    assert re.search(r'pass 32\b', test_output) and re.search(r'fail 0\b', test_output)
    def signatures(p):
        return [re.sub(r'\(\d+,\d+\):', ':', line) for line in p.read_text(encoding='utf-8').splitlines() if 'error TS' in line]
    before = signatures(evidence.parent/'asama-05/general-tsc-verified/stdout.log')
    current = signatures(evidence/'closure-tsc-final/stdout.log')
    new = sorted(set(current)-set(before))
    assert len(before) == len(current) == 552 and not new, new
    delta = {'baselineCount': len(before), 'currentCount': len(current), 'newSignatures': new,
             'removedSignatures': sorted(set(before)-set(current)), 'generalTypecheckPassed': False}
    write(evidence/'general-tsc-delta.json', delta)
    benchmark = read(evidence/'mixed-building-benchmark.json')
    browser = read(evidence/'browser-worker-final.json')
    assert benchmark['pass'] and benchmark['shells'] == 1176 and benchmark['nodes'] == 1600
    assert browser['first']['status'] == 'solved' and browser['first']['elapsedMs'] < 120000
    assert browser['ticks'] > 5 and browser['cancelledWithoutResult'] and browser['invalidStatus'] == 'invalid_input'
    assert max(map(abs, browser['first']['balance'])) < 1e-4
    git = lambda *args: subprocess.run(['git', *args], cwd=root, check=True, capture_output=True,
                                      text=True, timeout=30).stdout.strip()
    assert git('rev-parse', 'HEAD') == initial['head'] == git('rev-parse', 'main')
    assert git('branch', '--show-current') == 'internal-hsyncad-statik-rapor'
    subprocess.run(['git', 'diff', '--check'], cwd=root, check=True, timeout=30)
    files = ['src/lib/hsyncad/structural/'+name+'.ts' for name in
             ['sparse-spd', 'frame-element', 'frame-linear', 'shell-rect', 'linear-structure',
              'section-properties', 'mesh-rect-panel', 'solver-worker']]
    files += ['tests/hsyncad-structural/'+name+'.test.ts' for name in
              ['sparse-spd', 'frame-linear', 'shell-foundation', 'mesh-rect-panel']]
    files += ['scripts/hsyncad/'+name for name in
              ['p06-fixtures.ts', 'benchmark-p06.ts', 'verify-p06-worker.mjs', 'audit-stage06.py']]
    hashes = {name: sha(root/name) for name in files}
    write(evidence/'final-source-snapshot.json', {'files': hashes})
    task = next(t for t in tasks['tasks'] if t['id'] == 'P06')
    task.update(title='Bağımsız sayısal çözüm altyapısını doğrula', status='complete',
                acceptance='passed_for_explicit_linear_frame_rectangular_shell_and_winkler_profile',
                changedFiles=files+['docs/hsyncad/statik-rapor/P06_NUMERICAL_BACKEND.md'],
                verification=verified, evidencePaths=[str(evidence)],
                blocker='Native/standart kapıları açık; genel warped/poligon shell, modal analiz ve uygulama adaptörü kabul edilmedi.',
                nextAction='P07 gerçek modal/spektrum analizi yalnız sonraki kullanıcı devam komutuyla; eski motor kullanılmaz.')
    tasks.update(updatedAt=datetime.now(timezone.utc).isoformat(), currentStage='P06', nextStage='P07',
                 waitingForUser=True, overallAcceptance=False)
    tasks['verificationSourceHashes'].update(hashes)
    write(docs/'TASKS.json', tasks)
    result = {'originalSourcesPreserved': len(initial['originalSources']),
              'initialDirtyFilesPreserved': len(initial['dirtyFiles']),
              'previousVerifiedSourcesUnchanged': len(old_hashes), 'sourceFilesVerified': len(hashes),
              'headUnchanged': True, 'domainTests': 32, 'generalTypeScript': delta,
              'numericProfileAcceptance': task['acceptance'], 'engineeringAcceptance': False,
              'nativeAcceptance': False, 'nextStage': 'P07', 'waitingForUser': True}
    write(evidence/'preservation-and-closure.json', result)
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    main(args.repo, args.evidence)
