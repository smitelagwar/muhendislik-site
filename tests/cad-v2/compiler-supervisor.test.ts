import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CompilerSupervisor } from "../../services/cad-v2-compiler/src/supervisor";

const FAKE_CHILD_SOURCE = `
const fs = require("node:fs");
const path = require("node:path");
const [inputPath, outputPath, sourceVersionKey, fileId] = process.argv.slice(2);
if (inputPath === "slow") {
  fs.appendFileSync(outputPath, "started\\n", "utf8");
  fs.mkdirSync(path.join(path.dirname(outputPath), ".cad-v2-compiler-" + path.basename(outputPath) + "-" + process.pid + "-orphan"));
  setTimeout(() => {}, 60_000);
} else if (inputPath === "crash") {
  fs.appendFileSync(outputPath, "crashed\\n", "utf8");
  process.exit(23);
} else if (inputPath === "kill") {
  fs.appendFileSync(outputPath, "killed\\n", "utf8");
  process.exit(137);
} else {
  fs.writeFileSync(outputPath, JSON.stringify({ inputPath, outputPath, sourceVersionKey, fileId, execArgv: process.execArgv }), "utf8");
}
`;

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error(`condition not reached within ${timeoutMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(`test watchdog expired after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cad-v2-supervisor-"));
  try {
    const childScriptPath = path.join(root, "fake-child.cjs");
    fs.writeFileSync(childScriptPath, FAKE_CHILD_SOURCE, "utf8");
    const supervisor = new CompilerSupervisor({
      childScriptPath,
      timeoutMs: 350,
      maxOldSpaceMiB: 128,
    });

    const successOutputPath = path.join(root, "child-result.json");
    const inheritedExecArgv = process.execArgv;
    process.execArgv = [...inheritedExecArgv, "--max-old-space-size", "512"];
    const successPromise = supervisor.enqueue({
      id: "source-revision-forwarding",
      inputPath: "bounded-input.dxf",
      outputPath: successOutputPath,
      sourceVersionKey: "revision-authoritative-17",
      fileId: "file-authoritative-17",
    });
    process.execArgv = inheritedExecArgv;
    const success = await withTimeout(successPromise, 10_000);
    assert.deepEqual(success, { success: true, outputPath: successOutputPath });
    const childResult = JSON.parse(fs.readFileSync(successOutputPath, "utf8"));
    assert.equal(childResult.sourceVersionKey, "revision-authoritative-17");
    assert.equal(childResult.fileId, "file-authoritative-17", "durable file identity reaches isolated child");
    assert.ok(childResult.execArgv.includes("--max-old-space-size=128"), "configured heap ceiling reaches child process");
    assert.equal(childResult.execArgv.includes("512"), false,
      "the value for an inherited separated heap flag is removed with the overridden flag");

    const timeoutAttemptsPath = path.join(root, "timeout-attempts.txt");
    const timedOut = await withTimeout(supervisor.enqueue({
      id: "bounded-timeout",
      inputPath: "slow",
      outputPath: timeoutAttemptsPath,
      sourceVersionKey: "revision-timeout",
    }), 10_000);
    assert.deepEqual(timedOut, { success: false, error: "TIMEOUT_AFTER_RETRIES" });
    assert.equal(fs.readFileSync(timeoutAttemptsPath, "utf8").trim().split(/\r?\n/).length, 2,
      "timed-out child is killed and retry count is bounded to two attempts");
    assert.equal(fs.readdirSync(root).filter((name) => name.startsWith(`.cad-v2-compiler-${path.basename(timeoutAttemptsPath)}-`)).length, 0,
      "each killed attempt is fully closed and its private staging is removed before retry/return");

    const crashAttemptsPath = path.join(root, "crash-attempts.txt");
    const crashed = await withTimeout(supervisor.enqueue({
      id: "bounded-crash",
      inputPath: "crash",
      outputPath: crashAttemptsPath,
      sourceVersionKey: "revision-crash",
    }), 10_000);
    assert.deepEqual(crashed, { success: false, error: "CHILD_EXIT_CODE_23" });
    assert.equal(fs.readFileSync(crashAttemptsPath, "utf8").trim().split(/\r?\n/).length, 2,
      "crashed child is retried at most once");

    const killAttemptsPath = path.join(root, "exit-137-attempts.txt");
    const killed = await withTimeout(supervisor.enqueue({
      id: "bounded-exit-137",
      inputPath: "kill",
      outputPath: killAttemptsPath,
      sourceVersionKey: "revision-killed",
    }), 10_000);
    assert.deepEqual(killed, { success: false, error: "CHILD_EXIT_CODE_137" });
    assert.equal(fs.readFileSync(killAttemptsPath, "utf8").trim().split(/\r?\n/).length, 2,
      "abrupt exit code 137 is bounded to one retry");

    const cancelAttemptsPath = path.join(root, "cancel-attempts.txt");
    const controller = new AbortController();
    const cancelledPromise = supervisor.enqueue({
      id: "cancel-running-child",
      inputPath: "slow",
      outputPath: cancelAttemptsPath,
      sourceVersionKey: "revision-cancel",
      signal: controller.signal,
    });
    await waitFor(() => fs.existsSync(cancelAttemptsPath) && fs.readFileSync(cancelAttemptsPath, "utf8").includes("started"), 5_000);
    controller.abort();
    const cancelled = await withTimeout(cancelledPromise, 5_000);
    assert.deepEqual(cancelled, { success: false, error: "CHILD_CANCELLED" });
    assert.equal(fs.readFileSync(cancelAttemptsPath, "utf8").trim().split(/\r?\n/).length, 1,
      "cancelled child is killed without retry");
    assert.equal(fs.readdirSync(root).filter((name) => name.startsWith(`.cad-v2-compiler-${path.basename(cancelAttemptsPath)}-`)).length, 0,
      "cancelled child is closed and staging is removed before return");

    console.log("compiler supervisor revision, heap bound, timeout, crash, exit-137, and cancellation PASS");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
