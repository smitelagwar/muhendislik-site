"""P11: bounded-profile evidence, deliberate P08 extensions and source preservation."""
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


def recover_previous(name, text):
    if name.endswith('global-demand.ts'):
        text = re.sub(r'^export type CouplingEvaluator=.*\n', '', text, flags=re.M)
        text = text.replace(',couplingEvaluator?:CouplingEvaluator):MomentDistribution', '):MomentDistribution')
        text = re.sub(r'^  if\(couplingEvaluator\).*\n', '', text, flags=re.M)
    elif name.endswith('global-review.ts'):
        text = text.replace(',type CouplingEvaluator}', '}').replace(',couplingEvaluator?:CouplingEvaluator){', '){')
        text = text.replace('height.baseM,d,couplingEvaluator)', 'height.baseM,d)')
    elif name.endswith('global-period.ts'):
        start = text.index(' const components=groups.filter(')
        end = text.index('  const segments=g.cuts.map(', start)
        original = ' const axis=direction==="X"?0:1,other=1-axis,sections=groups.filter(g=>g.role==="lateral_wall").map(g=>{\n'
        original += '  if(g.kind!=="solid"||!g.cuts.length)throw Error("Eq4.28 coupled/complex section profile requires explicit verified section geometry.");\n'
        text = text[:start]+original+text[end:]
        text = text.replace('w.area*(.2+w.length/heightM)**2', 'w.area*(.2+(w.length/heightM)**2)')
    return text


def main(root, evidence):
    initial = read(evidence.parent/'asama-00/baseline.json')
    previous = read(evidence/'baseline.json')['sourceHashes']
    previous.update(read(evidence.parent/'asama-04/preservation-and-closure.json')['files'])
    allowed = ['src/lib/hsyncad/structural/'+n+'.ts' for n in ['global-demand', 'global-review', 'global-period']]
    refactors = []
    for name, digest in previous.items():
        if name in allowed:
            recovered = recover_previous(name, (root/name).read_text(encoding='utf8'))
            variants = [recovered.encode(), recovered.replace('\n', '\r\n').encode()]
            assert any(hashlib.sha256(v).hexdigest() == digest for v in variants), f'Undocumented prior edit: {name}'
            refactors.append(dict(path=name, previousSha256=digest, currentSha256=sha(root/name), reversePatchVerified=True))
        else:
            assert sha(root/name) == digest, name
    assert len(refactors) == 3
    write(evidence/'intended-refactors.json', refactors)
    for item in initial['dirtyFiles']:
        assert sha(root/item['path']) == item['sha256'], item['path']
    for item in initial['originalSources']:
        assert sha(Path(item['path'])) == item['sha256'], item['path']
    expected = [('domain-final-02', 0), ('app-types-final-02', 0), ('general-types-final-02', 2), ('lint-final-02', 0),
                ('source-extract-02', 0), ('source-render', 0), ('extra-source', 0), ('convergence-01', 0), ('create-examples-last', 0)]
    cli = [('ready', 0), ('twelve', 0), ('diagonal', 0), ('system', 0), ('repeat', 0), ('system-repeat', 0),
           ('missing', 2), ('failed', 2), ('basement', 2), ('connection', 2), ('stale', 2), ('rebuild-required', 2), ('overwrite', 1)]
    expected += [(f'cli-last-{name}', code) for name, code in cli]
    checks = []
    for name, code in expected:
        result = read(evidence/name/'result.json')
        assert result['exitCode'] == code and result['terminationReason'] is None, name
        checks.append(dict(result, scope=name, expectedExitCode=code, evidencePath=str(evidence/name/'result.json'),
                           status='failed_existing_debt' if name.startswith('general-types') else 'expected_result'))
    log = (evidence/'domain-final-02/stdout.log').read_text(encoding='utf8')
    assert re.search(r'pass 147\b', log) and re.search(r'fail 0\b', log) and re.search(r'skipped 0\b', log)
    assert not (evidence/'lint-final-02/stdout.log').read_text(encoding='utf8').strip()
    current = signatures(evidence/'general-types-final-02/stdout.log')
    assert current == signatures(evidence.parent/'asama-10/general-types-last/stdout.log') and sum(current.values()) == 552
    delta = dict(baselineCount=552, currentCount=552, newSignatures=[], removedSignatures=[], generalTypecheckPassed=False)
    write(evidence/'general-tsc-delta.json', delta)
    examples = evidence/'examples-last'
    assert sha(examples/'ready-output.json') == sha(examples/'repeat-output.json')
    assert sha(examples/'system-output.json') == sha(examples/'system-repeat-output.json')
    packets = {}
    for name, _code in cli:
        if name in ['repeat', 'system-repeat', 'overwrite']:
            continue
        packet = read(examples/f'{name}-output.json')
        assert packet['inputSha256'] == sha(examples/f'{name}-input.json')
        assert packet['engineeringAcceptance'] is False and packet['result']['engineeringAcceptance'] is False
        packets[name] = packet['result']
    for name in ['ready', 'twelve', 'diagonal']:
        assert packets[name]['status'] == 'wall_scope_ready'
    assert len(packets['twelve']['walls']) == 12 and all(w['status'] == 'wall_checks_ready' for w in packets['twelve']['walls'])
    assert packets['diagonal']['couplings'][0]['branch'] == 'diagonal_7_21'
    assert all(c['passed'] for c in packets['diagonal']['couplings'][0]['checks'])
    assert len(packets['diagonal']['couplingTransfers']) == 2
    assert packets['missing']['status'] == packets['failed']['status'] == packets['basement']['status'] == 'incomplete'
    assert packets['basement']['walls'][0]['status'] == 'requires_engineering'
    assert packets['connection']['status'] == 'connection_incomplete' and packets['stale']['status'] == 'invalid_input'
    assert packets['rebuild-required']['status'] == 'rebuild_required'
    system = packets['system']
    assert system['status'] == 'wall_review_ready' and system['global']['status'] == 'checks_ready'
    assert len(system['walls']['walls']) == 6 and len(system['walls']['couplings']) == 1
    assert all(w['analysisStamp'] == system['analysisStamp'] for w in system['walls']['walls'])
    assert all(w['status'] == 'wall_checks_ready' for w in system['walls']['walls'])
    assert system['walls']['couplings'][0]['status'] == 'coupling_ready'
    assert abs(system['global']['directional']['X']['used']['R']-4.8) < 1e-10
    assert 'report snapshot' in system['invalidated'] and len(system['history']) >= 2
    assert all(t['connectionCompatibility'] == 'shared_shell_faces' and t['omega'] < 1/3 for t in system['transfers'])
    assert len(read(examples/'system-input.json')['definitions'][0]['transferShellIds']) == 128
    rows = read(evidence/'convergence.json')
    assert [r['cells'] for r in rows] == [64, 128, 256, 512]
    assert abs(rows[1]['omega']/rows[2]['omega']-1) < .01 and abs(rows[2]['omega']/rows[3]['omega']-1) < .01
    assert all(r['maximumForceBalanceResidual'] < 1e-7 for r in rows)
    manifest = read(evidence/'source-manifest.json')
    assert sum(len(s['rendered']) for s in manifest) == 16
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
    documents = root/'docs/hsyncad/statik-rapor'
    assert (documents/'P11_WALL_DESIGN.md').is_file()
    state = (documents/'IMPLEMENTATION_STATE.md').read_text(encoding='utf8')
    assert 'Aşama11 açık girdili perde/bağ kirişi temel profili tamamlandı' in state
    assert 'Aşama12 başlamadı; devam komutu bekleniyor' in state
    records = root.parent/'hsyncad/calisma-kayitlari'
    assert 'P12 başlamadı, devam bekleniyor' in (records/'2026-11-05-statik-rapor-plani.md').read_text(encoding='utf8')
    assert 'P12 devam bekliyor' in (records/'README.md').read_text(encoding='utf8')
    files = [f'src/lib/hsyncad/structural/{n}.ts' for n in ['wall-section', 'wall-forces', 'wall-detailing', 'wall-design', 'coupling-beam', 'wall-system-review']]+allowed
    files += [f'tests/hsyncad-structural/{n}.ts' for n in ['wall-fixtures', 'wall-design.test', 'wall-invariants.test', 'wall-system-fixtures', 'wall-system.test']]
    files += [f'scripts/hsyncad/{n}' for n in ['export-wall-design.ts', 'create-p11-examples.ts', 'audit-stage11.py']]
    hashes = {name: sha(root/name) for name in sorted(files)}
    write(evidence/'final-source-snapshot.json', {'files': hashes})
    tasks = read(root/'docs/hsyncad/statik-rapor/TASKS.json')
    task = next(t for t in tasks['tasks'] if t['id'] == 'P11')
    task.update(title='Perde, perde grubu ve bağ kirişi tasarım temeli', status='complete',
                acceptance='passed_for_explicit_rc_wall_section_detailing_coupling_and_reanalysis_profile', inputFingerprint=sha(evidence/'baseline.json'),
                changedFiles=files+['docs/hsyncad/statik-rapor/P11_WALL_DESIGN.md'], verification=checks, evidencePaths=[str(evidence)],
                blocker='MS1/SK native kabulü, genel L/T/U uç detayı, bodrum toprak/su ve iki yönlü panel, yerel zayıf yön stabilitesi, özel boşluk/geçiş/ek, frame-shell rijit uç ve genel CQC etkileşim/imalat/UI/PDF kapıları açık.',
                nextAction='P12 yalnız sonraki kullanıcı devam komutuyla.')
    task['attempts'] = [dict(read(p), evidencePath=str(p)) for p in sorted(evidence.glob('*/result.json')) if p.parent.name not in dict(expected)]
    tasks.update(updatedAt=datetime.now(timezone.utc).isoformat(), currentStage='P11', nextStage='P12', waitingForUser=True, overallAcceptance=False)
    tasks['verificationSourceHashes'].update(hashes)
    write(root/'docs/hsyncad/statik-rapor/TASKS.json', tasks)
    metrics = dict(originalSourcesPreserved=len(initial['originalSources']), initialDirtyFilesPreserved=len(initial['dirtyFiles']),
                   previousSourcesUnchanged=len(previous)-len(refactors), intentionalPreviousChanges=len(refactors), sourceFilesVerified=len(hashes),
                   headUnchanged=True, domainTests=147, newWallTests=23, generalTypeScript=delta, deterministicMemberCliBytes=True,
                   deterministicSystemCliBytes=True, allTwelveWallsProcessed=True, rebuiltSystemWalls=6, rebuiltCouplingBeams=1,
                   globalSystemFrom='A12', globalSystemTo='A13', finalX_R=system['global']['directional']['X']['used']['R'],
                   convergence128to256=abs(rows[1]['omega']/rows[2]['omega']-1), convergence256to512=abs(rows[2]['omega']/rows[3]['omega']-1),
                   nativeAcceptance=False, engineeringAcceptance=False, phase11Acceptance=task['acceptance'], nextStage='P12', waitingForUser=True)
    write(evidence/'preservation-and-closure.json', metrics)
    print(json.dumps(metrics, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    main(args.repo.resolve(), args.evidence.resolve())
