import { spawn, spawnSync } from 'node:child_process';
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// JSON işi: executable, args, cwd, timeoutMs, outputDir. Ortam içeriği kaydedilmez.
export async function runOwnedCommand(job) {
  if (!job || typeof job.executable !== 'string' || !path.isAbsolute(job.executable)
    || !Array.isArray(job.args) || !job.args.every(value => typeof value === 'string')
    || !path.isAbsolute(job.cwd ?? '') || !path.isAbsolute(job.outputDir ?? '')
    || !Number.isSafeInteger(job.timeoutMs) || job.timeoutMs < 1) {
    throw new Error('Mutlak yollar, metin argümanları ve pozitif timeoutMs gerekir.');
  }
  // Her koşu ayrı klasöre yazar; önceki kanıtın üstüne yazılmaz.
  mkdirSync(job.outputDir, { recursive: false });
  const stdoutPath = path.join(job.outputDir, 'stdout.log');
  const stderrPath = path.join(job.outputDir, 'stderr.log');
  const out = openSync(stdoutPath, 'wx');
  const err = openSync(stderrPath, 'wx');
  const startedAt = new Date().toISOString();
  let child;
  let timer;
  let stopping = false;
  let terminationReason = null;
  let cleanup = null;
  let spawnError = null;
  const stop = reason => {
    if (stopping || !child?.pid || child.exitCode !== null || child.signalCode !== null) return;
    stopping = true;
    terminationReason = reason;
    // PID yalnız bu çağrının hâlâ yaşayan ChildProcess nesnesinden alınır.
    if (process.platform === 'win32') {
      const killer = spawnSync(path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'taskkill.exe'),
        ['/PID', String(child.pid), '/T', '/F'], { timeout: 10_000, windowsHide: true, encoding: 'utf8' });
      cleanup = { method: 'owned-tree-taskkill', exitCode: killer.status, error: killer.error?.message ?? null };
      if (killer.status !== 0) child.kill();
    } else {
      try { process.kill(-child.pid, 'SIGKILL'); cleanup = { method: 'owned-process-group', exitCode: 0 }; }
      catch (error) { cleanup = { method: 'owned-process-group', error: error.message }; child.kill('SIGKILL'); }
    }
  };
  const onInterrupt = () => stop('cancelled');
  try {
    child = spawn(job.executable, job.args, {
      cwd: job.cwd, shell: false, windowsHide: true,
      detached: process.platform !== 'win32', stdio: ['ignore', out, err],
    });
    process.on('SIGINT', onInterrupt);
    process.on('SIGTERM', onInterrupt);
    timer = setTimeout(() => stop('timeout'), job.timeoutMs);
    const outcome = await new Promise(resolve => {
      child.once('error', error => { spawnError = error.message; resolve({ code: null, signal: null }); });
      child.once('exit', (code, signal) => resolve({ code, signal }));
    });
    const exitCode = terminationReason === 'timeout' ? 124
      : terminationReason === 'cancelled' ? 130 : spawnError ? 1 : outcome.code ?? 1;
    const result = {
      executable: job.executable, args: job.args, cwd: job.cwd, timeoutMs: job.timeoutMs,
      pid: child.pid ?? null, startedAt, finishedAt: new Date().toISOString(),
      exitCode, childExitCode: outcome.code, signal: outcome.signal,
      terminationReason, spawnError, cleanup, stdoutPath, stderrPath,
    };
    writeFileSync(path.join(job.outputDir, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
    return result;
  } finally {
    clearTimeout(timer);
    process.off('SIGINT', onInterrupt);
    process.off('SIGTERM', onInterrupt);
    closeSync(out);
    closeSync(err);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  try {
    const result = await runOwnedCommand(JSON.parse(readFileSync(process.argv[2], 'utf8')));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = result.exitCode;
  } catch (error) {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 1;
  }
}
