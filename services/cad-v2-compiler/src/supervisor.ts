// ============================================================================
// CAD V2 COMPILER SERVICE — SUPERVISOR (G11, D09)
// ============================================================================
// Bir anda bir compiler işi çalıştırır, 300s timeout ve en fazla 2 retry uygular.

import { fork, ChildProcess } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export interface CompileJobTask {
  id: string;
  inputPath: string;
  outputPath: string;
  sourceVersionKey: string;
  fileId?: string;
  signal?: AbortSignal;
  attempt?: number;
  /** Maximum compiler-child starts for this task; durable queues can own retries instead. */
  maxAttempts?: number;
}

export interface CompilerSupervisorOptions {
  timeoutMs?: number;
  /** Applies a Node heap ceiling; deployment RSS/container limits remain host-owned. */
  maxOldSpaceMiB?: number;
  /** Allows controlled process tests and alternate service entry layouts. */
  childScriptPath?: string;
}

interface QueuedCompileJobTask extends CompileJobTask {
  attempt: number;
  maxAttempts: number;
  resolve: (result: { success: boolean; outputPath?: string; error?: string }) => void;
}

export class CompilerSupervisor {
  private currentProcess: ChildProcess | null = null;
  private queue: QueuedCompileJobTask[] = [];
  private isProcessing = false;
  private readonly timeoutMs: number;
  private readonly maxOldSpaceMiB?: number;
  private readonly childScriptPath: string;

  public constructor(options: CompilerSupervisorOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 300_000; // 300 saniye (D09)
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new Error("CompilerSupervisor timeoutMs pozitif tam sayı olmalıdır.");
    }
    if (options.maxOldSpaceMiB !== undefined) {
      if (!Number.isSafeInteger(options.maxOldSpaceMiB) || options.maxOldSpaceMiB < 128) {
        throw new Error("CompilerSupervisor maxOldSpaceMiB en az 128 MiB pozitif tam sayı olmalıdır.");
      }
      this.maxOldSpaceMiB = options.maxOldSpaceMiB;
    }
    this.childScriptPath = options.childScriptPath ??
      path.resolve(import.meta.dirname || process.cwd(), "compiler-child-entry.js");
  }

  public enqueue(task: CompileJobTask): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    return new Promise((resolve) => {
      if (task.signal?.aborted) {
        resolve({ success: false, error: "CHILD_CANCELLED" });
        return;
      }
      const maxAttempts = task.maxAttempts ?? 2;
      const attempt = task.attempt ?? 1;
      if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 2 ||
        !Number.isSafeInteger(attempt) || attempt < 1 || attempt > maxAttempts) {
        resolve({ success: false, error: "CHILD_ATTEMPT_LIMIT_INVALID" });
        return;
      }
      this.queue.push({ ...task, attempt, maxAttempts, resolve });
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing) return;
    let task: QueuedCompileJobTask | undefined;
    while (!task && this.queue.length > 0) {
      const next = this.queue.shift()!;
      if (next.signal?.aborted) next.resolve({ success: false, error: "CHILD_CANCELLED" });
      else task = next;
    }
    if (!task) return;
    this.isProcessing = true;

    const execArgv: string[] = [];
    for (let index = 0; index < process.execArgv.length; index += 1) {
      const arg = process.execArgv[index];
      if (arg === "--max-old-space-size") {
        index += 1;
      } else if (!arg.startsWith("--max-old-space-size=")) {
        execArgv.push(arg);
      }
    }
    if (this.maxOldSpaceMiB !== undefined) execArgv.push(`--max-old-space-size=${this.maxOldSpaceMiB}`);
    const child = fork(this.childScriptPath, [task.inputPath, task.outputPath, task.sourceVersionKey, task.fileId || ""], {
      stdio: "pipe",
      execArgv,
    });
    this.currentProcess = child;
    let isSettled = false;
    let timedOut = false;
    let cancelled = false;

    const cleanupAttemptStaging = () => {
      if (!child.pid) return;
      const resolvedOutputPath = path.resolve(task.outputPath);
      const parentDir = path.dirname(resolvedOutputPath);
      const stagingPrefix = `.cad-v2-compiler-${path.basename(resolvedOutputPath)}-${child.pid}-`;
      try {
        for (const entry of fs.readdirSync(parentDir, { withFileTypes: true })) {
          if (entry.isDirectory() && entry.name.startsWith(stagingPrefix)) {
            fs.rmSync(path.join(parentDir, entry.name), { recursive: true, force: true });
          }
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn(`[Supervisor] Attempt staging temizlenemedi (${task.id}):`, error);
        }
      }
    };

    const timer = setTimeout(() => {
      if (isSettled) return;
      timedOut = true;
      console.warn(`[Supervisor] İş zaman aşımına uğradı (${this.timeoutMs}ms): ${task.id}`);
      try {
        child.kill("SIGKILL");
      } catch (error) {
        console.warn(`[Supervisor] Child kill isteği başarısız oldu (${task.id}); close bekleniyor:`, error);
      }
    }, this.timeoutMs);

    const cancelChild = () => {
      if (isSettled || cancelled) return;
      cancelled = true;
      try {
        child.kill("SIGKILL");
      } catch (error) {
        console.warn(`[Supervisor] İptal edilen child kill isteği başarısız oldu (${task.id}); close bekleniyor:`, error);
      }
    };
    task.signal?.addEventListener("abort", cancelChild, { once: true });
    if (task.signal?.aborted) cancelChild();

    const finish = (code: number | null, signal: NodeJS.Signals | null, spawnError?: Error) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      task.signal?.removeEventListener("abort", cancelChild);
      cleanupAttemptStaging();
      this.currentProcess = null;
      this.isProcessing = false;

      if (cancelled) {
        task.resolve({ success: false, error: "CHILD_CANCELLED" });
      } else if (timedOut) {
        if (task.attempt < task.maxAttempts) {
          console.log(`[Supervisor] Tekrar deneniyor (attempt ${task.attempt + 1}): ${task.id}`);
          this.enqueue({
            id: task.id,
            inputPath: task.inputPath,
            outputPath: task.outputPath,
            sourceVersionKey: task.sourceVersionKey,
            fileId: task.fileId,
            signal: task.signal,
            attempt: task.attempt + 1,
            maxAttempts: task.maxAttempts,
          }).then(task.resolve);
        } else {
          task.resolve({ success: false, error: "TIMEOUT_AFTER_RETRIES" });
        }
      } else if (spawnError) {
        task.resolve({ success: false, error: `CHILD_SPAWN_ERROR_${spawnError.message}` });
      } else if (code === 0) {
        task.resolve({ success: true, outputPath: task.outputPath });
      } else if (task.attempt < task.maxAttempts) {
        console.log(`[Supervisor] Başarısız iş tekrar deneniyor: ${task.id}`);
        this.enqueue({
          id: task.id,
          inputPath: task.inputPath,
          outputPath: task.outputPath,
          sourceVersionKey: task.sourceVersionKey,
            fileId: task.fileId,
            signal: task.signal,
          attempt: task.attempt + 1,
          maxAttempts: task.maxAttempts,
        }).then(task.resolve);
      } else {
        const failure = signal ? `CHILD_SIGNAL_${signal}` : `CHILD_EXIT_CODE_${code ?? "UNKNOWN"}`;
        task.resolve({ success: false, error: failure });
      }
      this.processNext();
    };

    child.once("close", (code, signal) => finish(code, signal));
    child.once("error", (error) => finish(null, null, error));
  }
}
