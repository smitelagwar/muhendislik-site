"""Local P12–P14 evidence and preservation audit; no engineering acceptance."""
from collections import Counter
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(4*1024*1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def write(path, value):
    path.write_bytes((json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode('utf8'))


def signatures(path):
    return Counter(re.sub(r'\(\d+,\d+\):', ':', line) for line in path.read_text(encoding='utf8').splitlines() if 'error TS' in line)


def main(root, evidence):
    baseline = read(evidence/'baseline.json')
    prior = read(evidence/'prior-verification-snapshot.json')['files']
    initial = read(evidence.parent/'asama-00/baseline.json')
    for name, digest in baseline['files'].items():
        assert sha(root/name) == digest, f'Uncoordinated prior source edit: {name}'
    for name, digest in prior.items():
        assert sha(root/name) == digest, f'Prior verification source changed: {name}'
    frozen = read(evidence/'verification-input-snapshot.json')['files']
    for name, digest in frozen.items():
        assert sha(root/name) == digest, f'Source changed after final verification started: {name}'
    for item in initial['dirtyFiles']:
        if item['path'] == 'AGENTS.md':
            assert sha(evidence.parent/'asama-00/user-files/AGENTS.md') == item['sha256']
            # The user updated CLI instructions during this work; preserve that update.
            assert sha(root/'AGENTS.md') == '55fd08724728eafa9fcb37f3ee97bea456549bbbab2f33cdc7e87305011df773'
        else:
            assert sha(root/item['path']) == item['sha256'], item['path']
    for item in initial['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    git = lambda *args: subprocess.run(['git', *args], cwd=root, capture_output=True, text=True, check=True, timeout=30).stdout.strip()
    assert git('rev-parse', 'HEAD') == baseline['head'] == git('rev-parse', 'main')
    assert git('branch', '--show-current') == baseline['branch']
    subprocess.run(['git', 'diff', '--check'], cwd=root, check=True, timeout=30)
    expected = [('final-domain', 0), ('final-lint-02', 0), ('final-app-types-02', 0), ('final-general-types', 2), ('review-regressions-after', 0)]
    checks = []
    for name, code in expected:
        result = read(evidence/name/'result.json')
        assert result['exitCode'] == code and result['terminationReason'] is None, name
        checks.append(dict(result, evidencePath=str(evidence/name/'result.json'), status='failed_existing_debt' if name == 'final-general-types' else 'passed'))
    domain = (evidence/'final-domain/stdout.log').read_text(encoding='utf8')
    assert re.search(r'fail 0\b', domain) and re.search(r'skipped 0\b', domain)
    count = int(re.search(r'pass (\d+)\b', domain)[1])
    assert count > 147
    general = signatures(evidence/'final-general-types/stdout.log')
    previous = signatures(evidence.parent/'asama-11/general-types-final-02/stdout.log')
    assert general == previous and sum(general.values()) == 552
    write(evidence/'general-tsc-delta.json', dict(baselineCount=552, currentCount=552, added=[], removed=[], passed=False))
    assert not (evidence/'final-lint-02/stdout.log').read_text(encoding='utf8').strip()
    assert count == 201
    review = (evidence/'review-regressions-after/stdout.log').read_text(encoding='utf8')
    assert re.search(r'pass 11\b', review) and re.search(r'fail 0\b', review) and re.search(r'skipped 0\b', review)
    assert '23.7' in review and '26.7' in review
    mesh_line = next(line for line in domain.splitlines() if 'P12 actual FE mesh evidence ' in line)
    mesh = json.loads(mesh_line.split('P12 actual FE mesh evidence ', 1)[1])
    assert mesh['maxShellResultantDelta32to64'] < .01 and mesh['navierRelativeErrors'][-1] < .01
    write(evidence/'slab-convergence.json', mesh)
    for page in read(evidence/'source-manifest.json'):
        assert page['visuallyReviewed'] is True
        assert sha(Path(page['sourcePath'])) == page['sourceSha256']
        assert sha(evidence/f"{page['name']}-{page['index']}.png") == page['imageSha256']
    files = {}
    for folder in ['src/lib/hsyncad/structural', 'tests/hsyncad-structural', 'scripts/hsyncad']:
        for path in (root/folder).rglob('*'):
            if path.is_file():
                name = path.relative_to(root).as_posix()
                if name not in baseline['files']:
                    files[name] = sha(path)
    write(evidence/'final-source-snapshot.json', dict(files=files))
    for name in ['P12_SLAB_DESIGN.md', 'P13_FOUNDATION_DESIGN.md', 'P14_STAIR_DESIGN.md']:
        assert (root/'docs/hsyncad/statik-rapor'/name).is_file(), name
    result = dict(originalSourcesPreserved=len(initial['originalSources']), initialDirtyFilesUnchanged=4, userUpdatedAgentsPreserved=True,
                  previousSourcesUnchanged=len(prior), turnBaselineSourcesUnchanged=len(baseline['files']), newSourceFilesVerified=len(files), domainTests=count,
                  regressionBaseline=147, addedTests=count-147, generalTypeScript=552, newTypeSignatures=0,
                  headUnchanged=True, engineeringAcceptance=False, nativeAcceptance=False,
                  requestedAgentModels=['gpt-6-luna']*3, requestedReasoningEfforts=['high']*3,
                  fullPlanAcceptance=False, finalVerifiedTsSources=len(frozen), coordinatorTests=11,
                  slabResultantConvergence=mesh['maxShellResultantDelta32to64'], slabNavierDeflectionError=mesh['navierRelativeErrors'][-1],
                  nextStage='P15', waitingForUser=True, verification=checks)
    write(evidence/'preservation-and-closure.json', result)
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    main(args.repo.resolve(), args.evidence.resolve())
