import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFWorker, RenderTask } from "pdfjs-dist";
import { getSharedBrowserPdfWorker, loadBrowserPdfJs } from "../pdfjs-client";
import { PDFJS_CMAPS, PDFJS_FONTS, PDFJS_ICCS, PDFJS_WASM } from "../pdfjs-paths";
import { getShareViewerLayout, type ShareViewerFit } from "./viewer-geometry";

export class ShareViewerLoadError extends Error {
  constructor(readonly status: "expired" | "revoked" | "not_found" | "error") {
    super("Belge yüklenemedi.");
  }
}

export interface ShareViewerDependencies {
  fetch: typeof fetch;
  loadPdfJs: typeof loadBrowserPdfJs;
  getWorker: typeof getSharedBrowserPdfWorker;
}

/** Owns one document, never the shared worker. All renders on its canvas settle in order. */
export class ShareViewerSession {
  private readonly controller = new AbortController();
  private loading: PDFDocumentLoadingTask | null = null;
  private document: PDFDocumentProxy | null = null;
  private task: RenderTask | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private generation = 0;
  private closed = false;
  private tail: Promise<void> = Promise.resolve();
  private disposal: Promise<void> | null = null;

  constructor(private readonly dependencies: ShareViewerDependencies = {
    fetch: (...args) => fetch(...args), loadPdfJs: loadBrowserPdfJs, getWorker: getSharedBrowserPdfWorker,
  }) {}

  private assertOpen(): void {
    if (this.closed) throw new DOMException("Viewer disposed", "AbortError");
  }

  async open(url: string): Promise<number> {
    this.assertOpen();
    const response = await this.dependencies.fetch(url, { cache: "no-store", signal: this.controller.signal });
    this.assertOpen();
    if (!response.ok) {
      let code = "";
      if (response.status === 410) {
        const body = await response.json().catch(() => null);
        code = typeof body?.code === "string" ? body.code : "";
      }
      throw new ShareViewerLoadError(response.status === 404 ? "not_found"
        : response.status === 410 ? code === "LINK_REVOKED" ? "revoked" : "expired" : "error");
    }
    const data = new Uint8Array(await response.arrayBuffer());
    this.assertOpen();
    const pdfjs = await this.dependencies.loadPdfJs();
    this.assertOpen();
    if (!pdfjs) throw new ShareViewerLoadError("error");
    const worker = await this.dependencies.getWorker(pdfjs);
    this.assertOpen();
    this.loading = pdfjs.getDocument({
      data, cMapUrl: PDFJS_CMAPS, standardFontDataUrl: PDFJS_FONTS,
      wasmUrl: PDFJS_WASM, iccUrl: PDFJS_ICCS, cMapPacked: true,
      enableXfa: false,
      ...(worker ? { worker: worker as PDFWorker } : {}),
    });
    const document = await this.loading.promise;
    this.assertOpen();
    this.document = document;
    return document.numPages;
  }

  cancelRender(): void {
    this.generation += 1;
    this.task?.cancel();
  }

  render(canvas: HTMLCanvasElement, pageNumber: number, container: { width: number; height: number },
    fit: ShareViewerFit, scale: number, dpr: number) {
    this.cancelRender();
    const generation = this.generation;
    const stale = () => this.closed || generation !== this.generation;
    const work = this.tail.then(async () => {
      if (stale() || !this.document) return null;
      const page = await this.document.getPage(pageNumber);
      if (stale()) return null;
      const base = page.getViewport({ scale: 1 });
      const layout = getShareViewerLayout(base, container, fit, scale, dpr);
      const viewport = page.getViewport({ scale: layout.scale });
      const context = canvas.getContext("2d");
      if (!context) throw new Error("CANVAS_UNAVAILABLE");
      this.canvas = canvas;
      canvas.width = layout.backingWidth;
      canvas.height = layout.backingHeight;
      canvas.style.width = `${layout.width}px`;
      canvas.style.height = `${layout.height}px`;
      const task = page.render({ canvas, canvasContext: context, viewport, annotationMode: 0,
        transform: [layout.backingWidth / layout.width, 0, 0, layout.backingHeight / layout.height, 0, 0] });
      this.task = task;
      try {
        await task.promise;
        return stale() ? null : layout;
      } catch (error) {
        if (stale() || (error instanceof Error && error.name === "RenderingCancelledException")) return null;
        throw error;
      } finally {
        if (this.task === task) this.task = null;
        page.cleanup();
      }
    });
    this.tail = work.then(() => undefined, () => undefined);
    return work;
  }

  dispose(): Promise<void> {
    if (this.disposal) return this.disposal;
    this.closed = true;
    this.controller.abort();
    this.cancelRender();
    this.disposal = (async () => {
      await this.tail;
      try {
        // PDF.js 6.3 exposes document.cleanup + loadingTask.destroy (no
        // PDFDocumentProxy.destroy). The latter destroys its document transport;
        // an explicitly supplied shared worker is not owned by that task.
        try { await this.document?.cleanup(); }
        finally { await this.loading?.destroy(); }
      } finally {
        this.document = null;
        this.loading = null;
        if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
        this.canvas = null;
      }
    })();
    return this.disposal;
  }
}
