"""P09 gerçek işler ve dosya koruması doğrulanmadan aşama ilerletilmez."""
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
    for filename, digest in previous.items():
        assert sha(root/filename) == digest, filename
    for item in initial['dirtyFiles']:
        assert sha(root/item['path']) == item['sha256'], item['path']
    for item in initial['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    expected = [('domain-01-06', 0), ('lint-final-06', 0), ('app-types-06', 0), ('general-types-06', 2),
                ('ts500-fetch', 0), ('source-extract', 0), ('create-examples-final', 0),
                ('cli-last-ready', 0), ('cli-last-higher', 0), ('cli-last-twelve', 0), ('cli-last-repeat', 0),
                ('cli-last-missing', 2), ('cli-last-failed', 2), ('cli-last-budget', 2), ('cli-last-overwrite', 1)]
    checks = []
    for name, code in expected:
        result = read(evidence/name/'result.json')
        assert result['exitCode'] == code and result['terminationReason'] is None, name
        checks.append(dict(result, scope=name, expectedExitCode=code, evidencePath=str(evidence/name/'result.json'),
                           status='failed_existing_debt' if name == 'general-types-06' else 'expected_result'))
    output = (evidence/'domain-01-06/stdout.log').read_text(encoding='utf-8')
    assert re.search(r'pass 104\b', output) and re.search(r'fail 0\b', output) and re.search(r'skipped 0\b', output)
    assert not (evidence/'lint-final-06/stdout.log').read_text(encoding='utf-8').strip()
    before = signatures(evidence.parent/'asama-08/final-types-07/stdout.log')
    current = signatures(evidence/'general-types-06/stdout.log')
    assert before == current and sum(current.values()) == 552
    delta = {'baselineCount': 552, 'currentCount': 552, 'newSignatures': [], 'removedSignatures': [], 'generalTypecheckPassed': False}
    write(evidence/'general-tsc-delta.json', delta)
    examples = evidence/'examples-final'
    assert (examples/'last-ready-output.json').read_bytes() == (examples/'last-repeat-output.json').read_bytes()
    for name, status in [('ready', 'design_ready'), ('higher', 'design_ready'), ('missing', 'incomplete'), ('failed', 'failed'), ('budget', 'budget_exhausted')]:
        packet = read(examples/f'last-{name}-output.json')
        assert packet['inputSha256'] == sha(examples/f'{name}-input.json')
        assert packet['result']['results'][0]['status'] == status
        assert packet['engineeringAcceptance'] is False and packet['result']['engineeringAcceptance'] is False
    ready = read(examples/'last-ready-output.json')['result']['results'][0]
    higher = read(examples/'last-higher-output.json')['result']['results'][0]
    assert ready['wholeBuildingApproved'] is False and higher['wholeBuildingApproved'] is False
    assert ready['selected']['critical']['Mknm'] < higher['selected']['critical']['Mknm']
    assert ready['selected']['steelAreaMm2'] < higher['selected']['steelAreaMm2']
    assert higher['prunedByEquilibrium'] > 0
    for result in [ready, higher]:
        assert all(c['status'] == 'pass' for c in result['checks'])
        assert all(f['passed'] for f in result['selected']['forceChecks'])
        assert result['selected']['physicalTupleFromModalMaxima'] is False
        assert result['selected']['stirrups']['cutLengthMm'] is None
        assert all(a['left']['passed'] and a['right']['passed'] for a in result['selected']['anchors'])
    twelve = read(examples/'last-twelve-output.json')
    assert twelve['inputSha256'] == sha(examples/'twelve-input.json')
    assert twelve['result']['inputCount'] == twelve['result']['outputCount'] == len(twelve['result']['results']) == 12
    assert all(r['status'] == 'design_ready' for r in twelve['result']['results'])
    manifests = read(evidence/'source-manifest.json')
    assert sum(len(s['visuallyReviewedPdfPageIndices']) for s in manifests) == 31
    assert [s['pages'] for s in manifests] == [81, 416]
    for source in manifests:
        assert sha(Path(source['path'])) == source['sha256'] and source['amendmentSetVerified'] is False
        for i, digest in source['imageHashes'].items():
            assert sha(evidence/f"{source['name']}-{i}.png") == digest
    git = lambda *args: subprocess.run(['git', *args], cwd=root, check=True, capture_output=True, text=True, timeout=30).stdout.strip()
    assert git('rev-parse', 'HEAD') == initial['head'] == git('rev-parse', 'main')
    assert git('branch', '--show-current') == 'internal-hsyncad-statik-rapor'
    subprocess.run(['git', 'diff', '--check'], cwd=root, check=True, timeout=30)
    files = [str(p.relative_to(root)).replace('\\', '/') for p in (root/'src/lib/hsyncad/structural').glob('*beam*.ts')]
    files += [str(p.relative_to(root)).replace('\\', '/') for p in (root/'tests/hsyncad-structural').glob('beam-*.ts')]
    files += ['scripts/hsyncad/'+name for name in ['export-beam-design.ts', 'create-p09-examples.ts', 'audit-stage09.py']]
    hashes = {name: sha(root/name) for name in sorted(set(files))}
    write(evidence/'final-source-snapshot.json', {'files': hashes})
    tasks = read(docs/'TASKS.json')
    task = next(t for t in tasks['tasks'] if t['id'] == 'P09')
    task.update(title='Kiriş ve bant/bağ kirişi tasarım temeli', status='complete',
                acceptance='passed_for_explicit_deterministic_uniform_rc_beam_design_profile',
                changedFiles=files+['docs/hsyncad/statik-rapor/P09_BEAM_DESIGN.md'], verification=checks, evidencePaths=[str(evidence)],
                blocker='Genel yük/çokparça kiriş, servis N-T/iki eksen, gerçek bindirme/askı yerleşimi, CQC etkileşim, native/tam normatif kabul ve UI/PDF/imalat açık; özel bant/bağ P12/P11 kapsamındadır.',
                nextAction='P10 kolon ve birleşim tasarımı yalnız sonraki devam komutuyla.')
    task['attempts'] = [dict(read(p), evidencePath=str(p)) for p in sorted(evidence.glob('*/result.json')) if p.parent.name not in dict(expected)]
    tasks.update(updatedAt=datetime.now(timezone.utc).isoformat(), currentStage='P09', nextStage='P10', waitingForUser=True, overallAcceptance=False)
    tasks['verificationSourceHashes'].update(hashes)
    write(docs/'TASKS.json', tasks)
    result = {'originalSourcesPreserved': len(initial['originalSources']), 'initialDirtyFilesPreserved': len(initial['dirtyFiles']),
              'previousSourcesUnchanged': len(previous), 'sourceFilesVerified': len(hashes), 'headUnchanged': True,
              'domainTests': 104, 'newBeamTests': 19, 'generalTypeScript': delta, 'deterministicCliBytes': True,
              'allTwelveBeamsProcessed': True, 'nativeAcceptance': False, 'engineeringAcceptance': False,
              'phase09Acceptance': task['acceptance'], 'nextStage': 'P10', 'waitingForUser': True}
    write(evidence/'preservation-and-closure.json', result)
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    main(args.repo.resolve(), args.evidence.resolve())
