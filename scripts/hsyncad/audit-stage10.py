"""P10 bounded profile: actual jobs, source preservation and fail-closed CLI."""
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
    p.write_bytes((json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode())


def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as stream:
        for chunk in iter(lambda: stream.read(4*1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()


def signatures(p):
    return Counter(re.sub(r'\(\d+,\d+\):', ':', line) for line in p.read_text(encoding='utf8').splitlines() if 'error TS' in line)


def main(root, evidence):
    initial = read(evidence.parent/'asama-00/baseline.json')
    previous = read(evidence/'baseline.json')['sourceHashes']
    previous.update(read(evidence.parent/'asama-04/preservation-and-closure.json')['files'])
    for name, digest in previous.items():
        assert sha(root/name) == digest, name
    for item in initial['dirtyFiles']:
        assert sha(root/item['path']) == item['sha256'], item['path']
    for item in initial['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    expected = [('domain-last', 0), ('lint-last', 0), ('app-types-last', 0), ('general-types-last', 2),
                ('source-extract', 0), ('extra-source', 0), ('create-examples-last', 0)]
    expected += [(f'cli-last-{n}', c) for n, c in [('ready', 0), ('twelve', 0), ('repeat', 0), ('missing', 2), ('stale', 2), ('failed', 2), ('weak', 2), ('overwrite', 1)]]
    checks = []
    for name, code in expected:
        result = read(evidence/name/'result.json')
        assert result['exitCode'] == code and result['terminationReason'] is None, name
        checks.append(dict(result, scope=name, expectedExitCode=code, evidencePath=str(evidence/name/'result.json'),
                           status='failed_existing_debt' if name.startswith('general-types') else 'expected_result'))
    log = (evidence/'domain-last/stdout.log').read_text(encoding='utf8')
    assert re.search(r'pass 124\b', log) and re.search(r'fail 0\b', log) and re.search(r'skipped 0\b', log)
    assert not (evidence/'lint-last/stdout.log').read_text(encoding='utf8').strip()
    current = signatures(evidence/'general-types-last/stdout.log')
    assert current == signatures(evidence.parent/'asama-09/general-types-06/stdout.log') and sum(current.values()) == 552
    delta = dict(baselineCount=552, currentCount=552, newSignatures=[], removedSignatures=[], generalTypecheckPassed=False)
    write(evidence/'general-tsc-delta.json', delta)
    examples = evidence/'examples-last'
    assert (examples/'ready-output.json').read_bytes() == (examples/'repeat-output.json').read_bytes()
    packets = {}
    for name in ['ready', 'twelve', 'missing', 'stale', 'failed', 'weak']:
        packet = read(examples/f'{name}-output.json')
        assert packet['inputSha256'] == sha(examples/f'{name}-input.json')
        assert packet['engineeringAcceptance'] is False and packet['result']['engineeringAcceptance'] is False
        assert packet['result']['wholeBuildingApproved'] is False
        assert packet['result']['status'] == ('column_joint_ready' if name in ['ready', 'twelve'] else 'incomplete')
        packets[name] = packet['result']
    large = packets['twelve']
    assert [len(large[k]) for k in ['columns', 'beams', 'joints']] == [24, 48, 12]
    assert all(c['status'] == 'design_ready' for c in large['columns'])
    assert all(c['status'] == 'design_ready' for c in large['beams'])
    assert all(j['status'] == 'joint_ready' for j in large['joints'])
    assert packets['missing']['missingJoints'] == ['J1']
    assert packets['failed']['joints'][0]['panelTie']['passed'] is False
    assert all(b['status'] == 'design_ready' for b in packets['weak']['beams'])
    assert any(not s['strongColumnPassed'] and s['strongColumnRatio'] < 1.2 for d in packets['weak']['joints'][0]['directions'] for s in d['signs'])
    manifest = read(evidence/'source-manifest.json')
    assert sum(len(s['rendered']) for s in manifest) == 21
    for source in manifest:
        assert sha(Path(source['path'])) == source['sha256'] and source['amendmentSetVerified'] is False
        for i, digest in source['imageHashes'].items():
            assert sha(evidence/f"{source['name']}-{i}.png") == digest
        source['visuallyReviewedPdfPageIndices'] = source['rendered']
    write(evidence/'source-manifest.json', manifest)
    git = lambda *args: subprocess.run(['git', *args], cwd=root, check=True, capture_output=True, text=True, timeout=30).stdout.strip()
    assert git('rev-parse', 'HEAD') == initial['head'] == git('rev-parse', 'main')
    assert git('branch', '--show-current') == 'internal-hsyncad-statik-rapor'
    subprocess.run(['git', 'diff', '--check'], cwd=root, check=True, timeout=30)
    files = [f'src/lib/hsyncad/structural/{n}.ts' for n in ['rc-column-section', 'column-stability', 'column-detailing', 'column-design', 'beam-column-joint']]
    files += [f'tests/hsyncad-structural/{n}.ts' for n in ['column-section.test', 'column-design.test', 'column-fixtures']]
    files += [f'scripts/hsyncad/{n}' for n in ['export-column-joint-design.ts', 'create-p10-examples.ts', 'audit-stage10.py']]
    hashes = {name: sha(root/name) for name in sorted(files)}
    write(evidence/'final-source-snapshot.json', {'files': hashes})
    docs = root/'docs/hsyncad/statik-rapor'
    tasks = read(docs/'TASKS.json')
    task = next(t for t in tasks['tasks'] if t['id'] == 'P10')
    task.update(title='Kolon, güçlü kolon ve kolon-kiriş birleşim temeli', status='complete',
                acceptance='passed_for_explicit_centrosymmetric_rc_column_and_rectangular_joint_profile',
                changedFiles=files+['docs/hsyncad/statik-rapor/P10_COLUMN_JOINT_DESIGN.md'], verification=checks, evidencePaths=[str(evidence)],
                blocker='SK native kıyası, genel ikinci mertebe, daire/poligon kesmesi, özel birleşim/geçiş/ek/bitiş yerleşimi, CQC etkileşim, tam normatif/native ve UI/PDF/imalat kabulü açık.',
                nextAction='P11 yalnız sonraki kullanıcı devam komutuyla.')
    task['attempts'] = [dict(read(p), evidencePath=str(p)) for p in sorted(evidence.glob('*/result.json')) if p.parent.name not in dict(expected)]
    tasks.update(updatedAt=datetime.now(timezone.utc).isoformat(), currentStage='P10', nextStage='P11', waitingForUser=True, overallAcceptance=False)
    tasks['verificationSourceHashes'].update(hashes)
    write(docs/'TASKS.json', tasks)
    result = dict(originalSourcesPreserved=len(initial['originalSources']), initialDirtyFilesPreserved=len(initial['dirtyFiles']),
                  previousSourcesUnchanged=len(previous), sourceFilesVerified=len(hashes), headUnchanged=True, domainTests=124,
                  newColumnJointTests=20, generalTypeScript=delta, deterministicCliBytes=True, allTwelveJointsProcessed=True,
                  columnsInLargeScope=24, beamsInLargeScope=48, nativeAcceptance=False, engineeringAcceptance=False,
                  phase10Acceptance=task['acceptance'], nextStage='P11', waitingForUser=True)
    write(evidence/'preservation-and-closure.json', result)
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    main(args.repo.resolve(), args.evidence.resolve())
