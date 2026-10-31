import type { IdeProject } from "./ide-import";

export const MAX_IDE_BYTES = 250 * 1024 * 1024;

/** Worker owns the transferred bytes and is terminated on success, error or cancellation. */
export function readIdeFile(file: File, signal: AbortSignal, onProgress: (message: string) => void): Promise<IdeProject> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IDE_BYTES) { reject(new Error("IDE dosyası en fazla 250 MB olabilir.")); return; }
    if (signal.aborted) { reject(new DOMException("İptal edildi", "AbortError")); return; }
    const worker = new Worker(new URL("./ide-reader.worker.ts", import.meta.url));
    let done = false;
    const finish = (error?: Error, project?: IdeProject) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      signal.removeEventListener("abort", abort);
      if (error) reject(error); else resolve(project!);
    };
    const abort = () => finish(new DOMException("İptal edildi", "AbortError"));
    const timer = setTimeout(() => finish(new Error("Proje okuma süresi aşıldı. Dosyayı yeniden seçebilirsiniz.")), 120_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ phase?: string; project?: IdeProject; error?: string }>) => {
      if (event.data.error) finish(new Error(event.data.error));
      else if (event.data.project) finish(undefined, event.data.project);
      else if (event.data.phase) onProgress(event.data.phase);
    };
    worker.onerror = () => finish(new Error("IDE okuyucusu başlatılamadı. Sayfayı yenileyip tekrar deneyin."));
    onProgress("Dosya hazırlanıyor…");
    void file.arrayBuffer().then(buffer => {
      if (!done) worker.postMessage({ buffer, filename: file.name }, [buffer]);
    }, error => finish(error instanceof Error ? error : new Error("Dosya okunamadı.")));
  });
}

const CACHE_VERSION = "hsyncad.ide-view.v5";
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_VERSION, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("projects");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function rememberIdeProject(project: IdeProject, sourceFile?: File): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("projects", "readwrite");
      tx.objectStore("projects").put(project, "last");
      if (sourceFile) tx.objectStore("projects").put(sourceFile, "source"); else tx.objectStore("projects").delete("source");
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function restoreIdeProject(): Promise<{ project: IdeProject; sourceFile?: File } | undefined> {
  const db = await database();
  try {
    return await new Promise<{ project: IdeProject; sourceFile?: File } | undefined>((resolve, reject) => {
      const tx = db.transaction("projects"), files = tx.objectStore("projects");
      const project = files.get("last"), source = files.get("source");
      tx.oncomplete = () => resolve(project.result ? { project: project.result, sourceFile: source.result instanceof File ? source.result : undefined } : undefined);
      tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
