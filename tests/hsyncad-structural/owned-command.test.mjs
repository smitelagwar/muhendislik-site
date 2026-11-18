import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const runner = path.resolve('scripts/hsyncad/run-owned-command.mjs');
function execute(code, timeoutMs = 5_000, overrides = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'hsyncad-owned-'));
  const job = { executable: process.execPath, args: ['-e', code], cwd: process.cwd(),
    timeoutMs, outputDir: path.join(dir, 'logs'), ...overrides };
  const jobPath = path.join(dir, 'job.json');
  writeFileSync(jobPath, JSON.stringify(job));
  const run = spawnSync(process.execPath, [runner, jobPath], { encoding: 'utf8', timeout: 20_000, windowsHide: true });
  assert.equal(run.error, undefined, run.stderr);
  return { run, dir, job };
}
test('gerçek çıkış kodu ile stdout ve stderr ayrı saklanır', () => {
  const { run, job } = execute('console.log("çıktı"); console.error("hata"); process.exitCode=7');
  assert.equal(run.status, 7);
  const result = JSON.parse(readFileSync(path.join(job.outputDir, 'result.json'), 'utf8'));
  assert.equal(result.exitCode, 7);
  assert.equal(result.terminationReason, null);
  assert.match(readFileSync(result.stdoutPath, 'utf8'), /çıktı/);
  assert.match(readFileSync(result.stderrPath, 'utf8'), /hata/);
});
test('başarılı komut sıfır koduyla kaydedilir', () => {
  assert.equal(execute('console.log("ok")').run.status, 0);
});
test('timeout yalnız sahip olunan çocuk ağacını durdurur', () => {
  const code = `const {spawn}=require('node:child_process');
    const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
    console.log(child.pid); setInterval(()=>{},1000);`;
  const { run, job } = execute(code, 1_000);
  assert.equal(run.status, 124, run.stderr);
  const result = JSON.parse(readFileSync(path.join(job.outputDir, 'result.json'), 'utf8'));
  assert.equal(result.terminationReason, 'timeout');
  assert.equal(result.cleanup.exitCode, 0);
  const grandchild = Number(readFileSync(result.stdoutPath, 'utf8').trim());
  assert.ok(grandchild > 0);
  assert.throws(() => process.kill(grandchild, 0), { code: 'ESRCH' });
});
test('olmayan executable başarı sayılmaz', () => {
  const { run, job } = execute('', 5_000, { executable: path.join(os.tmpdir(), 'hsyncad-absent-executable.exe') });
  assert.equal(run.status, 1);
  assert.match(JSON.parse(readFileSync(path.join(job.outputDir, 'result.json'), 'utf8')).spawnError, /ENOENT/);
});
test('geçersiz süre komut başlatmadan reddedilir', () => {
  const { run } = execute('process.exit(0)', 0);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /timeoutMs/);
});
test('iptal olayı sahip olunan süreci durdurur ve 130 kaydeder', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'hsyncad-cancel-'));
  const job = { executable: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'],
    cwd: process.cwd(), timeoutMs: 5_000, outputDir: path.join(dir, 'logs') };
  // OS/terminal teslimi yerine açık SIGINT işleyicisinin sözleşmesi sınanır.
  const code = `import {runOwnedCommand} from ${JSON.stringify(pathToFileURL(runner).href)};
    setTimeout(()=>process.emit('SIGINT'),500);
    const result=await runOwnedCommand(${JSON.stringify(job)}); process.exitCode=result.exitCode;`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', code],
    { encoding: 'utf8', timeout: 15_000, windowsHide: true });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 130, run.stderr);
  const result = JSON.parse(readFileSync(path.join(job.outputDir, 'result.json'), 'utf8'));
  assert.equal(result.terminationReason, 'cancelled');
  assert.equal(result.cleanup.exitCode, 0);
  assert.throws(() => process.kill(result.pid, 0), { code: 'ESRCH' });
});
