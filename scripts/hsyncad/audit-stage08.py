"""P08 closure verifies actual jobs, frozen inputs and preservation before advancing state."""
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


def write(p, value):
    p.write_bytes((json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode('utf-8'))


def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as stream:
        for part in iter(lambda: stream.read(4*1024*1024), b''):
            h.update(part)
    return h.hexdigest()


def signatures(p):
    return Counter(re.sub(r'\(\d+,\d+\):', ':', s) for s in p.read_text(encoding='utf-8').splitlines() if 'error TS' in s)


def main(root, evidence):
    docs = root/'docs/hsyncad/statik-rapor'
    initial = read(evidence.parent/'asama-00/baseline.json')
    previous = read(evidence/'baseline.json')['sourceHashes']
    previous.update(read(evidence.parent/'asama-04/preservation-and-closure.json')['files'])
    allowed = {'src/lib/hsyncad/structural/project-schema.ts', 'src/components/hsyncad/project-analysis-settings.tsx'}
    changed = []
    for filename, digest in previous.items():
        current = sha(root/filename)
        if current != digest:
            assert filename in allowed, filename
            changed.append({'path': filename, 'before': digest, 'after': current})
    assert {c['path'] for c in changed} == allowed
    for item in initial['dirtyFiles']:
        assert sha(root/item['path']) == item['sha256'], item['path']
    for item in initial['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    expected = [('domain-final-07', 0), ('lint-07', 0), ('app-types-06', 0), ('final-types-07', 2),
                ('build-02', 0), ('browser-02', 0), ('create-examples-final', 0),
                ('cli-closure-ready', 0), ('cli-closure-basement', 0), ('cli-closure-repeat', 0),
                ('cli-closure-missing', 2), ('cli-closure-bounded', 2), ('cli-closure-overwrite', 1),
                ('source-extract', 0), ('source-extract-additional', 0), ('source-extract-coupling', 0)]
    checks = []
    for name, code in expected:
        result = read(evidence/name/'result.json')
        assert result['exitCode'] == code and result['terminationReason'] is None, name
        checks.append(dict(result, scope=name, expectedExitCode=code, evidencePath=str(evidence/name/'result.json'),
                           status='failed_existing_debt' if name == 'final-types-07' else 'expected_result'))
    output = (evidence/'domain-final-07/stdout.log').read_text(encoding='utf-8')
    assert re.search(r'pass 85\b', output) and re.search(r'fail 0\b', output) and re.search(r'skipped 0\b', output)
    assert '4 passed' in (evidence/'browser-02/stdout.log').read_text(encoding='utf-8')
    assert not (evidence/'lint-07/stdout.log').read_text(encoding='utf-8').strip()
    before = signatures(evidence.parent/'asama-07/closure-final-tsc/stdout.log')
    current = signatures(evidence/'final-types-07/stdout.log')
    assert before == current and sum(current.values()) == 552
    delta = {'baselineCount': 552, 'currentCount': 552, 'newSignatures': [], 'removedSignatures': [], 'generalTypecheckPassed': False}
    write(evidence/'general-tsc-delta.json', delta)
    examples = evidence/'examples-final'
    assert (examples/'ready-output.json').read_bytes() == (examples/'repeat-output.json').read_bytes()
    for name, status in [('ready', 'checks_ready'), ('basement', 'checks_ready'), ('missing', 'incomplete'), ('bounded', 'nonconverged')]:
        packet = read(examples/f'{name}-output.json')
        assert packet['inputSha256'] == sha(examples/f'{name}-input.json')
        assert packet['result']['status'] == status and packet['engineeringAcceptance'] is False
    ready = read(examples/'ready-output.json')['result']
    assert ready['wholeBuildingApproved'] is False and len(ready['iterations']) == 2
    first, final = ready['iterations']
    assert first['used']['X']['R'] == 6 and abs(final['used']['X']['R']-4.8) < 1e-10
    assert final['rawBaseShear']['X'] > first['rawBaseShear']['X']
    assert final['rawMaxDisplacement']['X'] > first['rawMaxDisplacement']['X']
    basement = read(examples/'basement-output.json')['result']
    assert basement['classification']['basement']['rigid'] is True
    assert all(c['agreed'] for c in basement['periodComparison']['correspondence'])
    for d in ['X', 'Y']:
        region = basement['directional'][d]['regional']
        assert not region['unresolved'] and region['upperBetaAppliedToBasement'] is False
        assert basement['directional'][d]['lowerModal']['baseShearKn'] > 0
        assert any(s['part'] == 'basement' for s in region['shells'])
        assert all(s['coincidentPhysicalTuple'] is False for s in region['shells'])
    manifest = read(evidence/'source-manifest.json')
    assert manifest['pdfPages'] == 416 and sha(Path(manifest['sourcePath'])) == manifest['sha256']
    assert len(manifest['visuallyReviewedPdfPageIndices']) == 24 and manifest['amendmentSetVerified'] is False
    for i, digest in manifest['imageHashes'].items():
        assert sha(evidence/f'source-page-{i}.png') == digest
    browser_files = {str(p.relative_to(evidence)): sha(p) for p in (evidence/'browser-02-artifacts').rglob('*') if p.is_file()}
    assert any('P08-reviews-mobile.png' in p for p in browser_files)
    write(evidence/'browser-artifact-hashes.json', browser_files)
    git = lambda *args: subprocess.run(['git', *args], cwd=root, check=True, capture_output=True, text=True, timeout=30).stdout.strip()
    assert git('rev-parse', 'HEAD') == initial['head'] == git('rev-parse', 'main')
    assert git('branch', '--show-current') == 'internal-hsyncad-statik-rapor'
    subprocess.run(['git', 'diff', '--check'], cwd=root, check=True, timeout=30)
    files = [str(p.relative_to(root)).replace('\\', '/') for p in (root/'src/lib/hsyncad/structural').glob('global-*.ts')]
    files += ['src/lib/hsyncad/structural/'+name+'.ts' for name in ['building-classification', 'system-selection', 'project-schema']]
    files += [str(p.relative_to(root)).replace('\\', '/') for p in (root/'tests/hsyncad-structural').glob('global-*.ts')]
    files += ['src/components/hsyncad/project-analysis-settings.tsx', 'tests/hsyncad/global-reviews.spec.ts', 'playwright.hsyncad-global.config.ts']
    files += ['scripts/hsyncad/'+name for name in ['export-global-review.ts', 'create-p08-examples.ts', 'audit-stage08.py']]
    hashes = {name: sha(root/name) for name in sorted(set(files))}
    write(evidence/'final-source-snapshot.json', {'files': hashes})
    tasks = read(docs/'TASKS.json')
    task = next(t for t in tasks['tasks'] if t['id'] == 'P08')
    task.update(title='Sistem sınıfları, bodrum ve global TBDY kontrolleri', status='complete',
                acceptance='passed_for_explicit_global_control_and_regional_force_profile',
                changedFiles=files+['docs/hsyncad/statik-rapor/P08_GLOBAL_CONTROLS.md'], verification=checks, evidencePaths=[str(evidence)],
                blocker='Native üç proje, tam normatif/tadil kabulü, özel aktarım modelleri, eleman etkileşim tasarımı ve UI/nihai PDF entegrasyonu açık.',
                nextAction='P09 kiriş tasarım temeli yalnız sonraki devam komutuyla.')
    task['attempts'] = [dict(read(p), evidencePath=str(p)) for p in sorted(evidence.glob('*/result.json')) if p.parent.name not in dict(expected)]
    tasks.update(updatedAt=datetime.now(timezone.utc).isoformat(), currentStage='P08', nextStage='P09', waitingForUser=True, overallAcceptance=False)
    tasks['verificationSourceHashes'].update(hashes)
    write(docs/'TASKS.json', tasks)
    result = {'originalSourcesPreserved': len(initial['originalSources']), 'initialDirtyFilesPreserved': len(initial['dirtyFiles']),
              'previousSourcesUnchanged': len(previous)-len(changed), 'intentionalP03Extension': changed, 'sourceFilesVerified': len(hashes),
              'headUnchanged': True, 'domainTests': 85, 'browserTests': 4, 'generalTypeScript': delta,
              'deterministicCliBytes': True, 'nativeAcceptance': False, 'engineeringAcceptance': False,
              'phase08Acceptance': task['acceptance'], 'nextStage': 'P09', 'waitingForUser': True}
    write(evidence/'preservation-and-closure.json', result)
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    main(args.repo.resolve(), args.evidence.resolve())
