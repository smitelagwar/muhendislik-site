// ============================================================================
// CAD V2 COMPILER SERVICE — SUPERVISOR (G11, D09)
// ============================================================================
// Bir anda bir compiler işi çalıştırır, 300s timeout ve en fazla 2 retry uygular.

import { fork, ChildProcess } from "node:child_process";
import * as path from "node:path";

export interface CompileJobTask {
  id: string;
  inputPath: string;
  outputPath: string;
  sourceVersionKey: string;
  attempt?: number;
}

export class CompilerSupervisor {
  private currentProcess: ChildProcess | null = null;
  private queue: CompileJobTask[] = [];
  private isProcessing = false;
  private timeoutMs = 300_000; // 300 saniye (D09)

  public enqueue(task: CompileJobTask): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    return new Promise((resolve) => {
      const wrappedTask = {
        ...task,
        attempt: task.attempt || 1,
        _resolve: resolve,
      };
      this.queue.push(wrappedTask as any);
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const task: any = this.queue.shift();
    let isFinished = false;

    const childScript = path.resolve(import.meta.dirname || process.cwd(), "compiler-child.js");

    const child = fork(childScript, [task.inputPath, task.outputPath], {
      stdio: "pipe",
    });
    this.currentProcess = child;

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        console.warn(`[Supervisor] İş zaman aşımına uğradı (300s): ${task.id}`);
        try {
          child.kill("SIGKILL");
        } catch {
          // Ignore
        }
        if (task.attempt < 2) {
          console.log(`[Supervisor] Tekrar deneniyor (attempt ${task.attempt + 1}): ${task.id}`);
          this.enqueue({ ...task, attempt: task.attempt + 1 }).then(task._resolve);
        } else {
          task._resolve({ success: false, error: "TIMEOUT_AFTER_RETRIES" });
        }
        this.currentProcess = null;
        this.isProcessing = false;
        this.processNext();
      }
    }, this.timeoutMs);

    child.on("exit", (code) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      this.currentProcess = null;
      this.isProcessing = false;

      if (code === 0) {
        task._resolve({ success: true, outputPath: task.outputPath });
      } else {
        if (task.attempt < 2) {
          console.log(`[Supervisor] Başarısız iş tekrar deneniyor: ${task.id}`);
          this.enqueue({ ...task, attempt: task.attempt + 1 }).then(task._resolve);
        } else {
          task._resolve({ success: false, error: `CHILD_EXIT_CODE_${code}` });
        }
      }
      this.processNext();
    });

    child.on("error", (err) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      this.currentProcess = null;
      this.isProcessing = false;
      task._resolve({ success: false, error: err.message });
      this.processNext();
    });
  }
}
