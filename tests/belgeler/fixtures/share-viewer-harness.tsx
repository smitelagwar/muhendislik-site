import React from "react";
import { createRoot } from "react-dom/client";
import { BelgeShareViewer } from "../../../src/components/belge-paylasim/belge-share-viewer";
import { getSharedBrowserPdfWorker, loadBrowserPdfJs } from "../../../src/lib/pdfjs-client";

// Browser-only fault/ownership instrumentation. It is never imported by product code.
async function start() {
  const pdfjs = await loadBrowserPdfJs();
  if (!pdfjs) throw new Error("PDF.js unavailable");
  const sharedWorker = await getSharedBrowserPdfWorker(pdfjs) as { destroy(): void };
  const stats = { tasks: 0, documents: 0, renders: 0, maximumRenders: 0, destroyed: 0, workerDestroyed: 0, pendingPages: 0, pixelPeak: 0 };
  const fault = { renderOnce: false, pageDelayMs: 0 };
  const originalWorkerDestroy = sharedWorker.destroy.bind(sharedWorker);
  sharedWorker.destroy = () => { stats.workerDestroyed += 1; originalWorkerDestroy(); };
  window.pdfjsLib = { ...pdfjs, getDocument(parameters) {
    const task = pdfjs.getDocument(parameters);
    stats.tasks += 1;
    let released = false;
    let loaded = false;
    const release = () => {
      if (released) return;
      released = true;
      stats.tasks -= 1;
      if (loaded) stats.documents -= 1;
      stats.destroyed += 1;
    };
    const promise = task.promise.then((document) => {
      loaded = true;
      stats.documents += 1;
      const getPage = document.getPage.bind(document);
      const wrappedPages = new WeakSet<object>();
      document.getPage = async (number) => {
        stats.pendingPages += 1;
        try {
          if (fault.pageDelayMs) await new Promise((resolve) => setTimeout(resolve, fault.pageDelayMs));
          const page = await getPage(number);
          if (!wrappedPages.has(page)) {
            wrappedPages.add(page);
            const render = page.render.bind(page);
            page.render = (context) => {
              if (fault.renderOnce) {
                fault.renderOnce = false;
                return { cancel() {}, promise: Promise.reject(new Error("injected render failure")) } as ReturnType<typeof render>;
              }
              stats.renders += 1;
              stats.maximumRenders = Math.max(stats.maximumRenders, stats.renders);
              const canvas = context.canvas;
              if (canvas) stats.pixelPeak = Math.max(stats.pixelPeak, canvas.width * canvas.height);
              const rendering = render(context);
              return { cancel: () => rendering.cancel(), promise: rendering.promise.finally(() => { stats.renders -= 1; }) } as ReturnType<typeof render>;
            };
          }
          return page;
        } finally { stats.pendingPages -= 1; }
      };
      return document;
    }, (error) => { release(); throw error; });
    return { promise, async destroy() { try { await task.destroy(); } finally { release(); } } } as typeof task;
  } };
  const root = createRoot(document.getElementById("root")!);
  let serial = 0;
  const harness = {
    stats, fault,
    mount(token = "two") { root.render(<BelgeShareViewer key={++serial} viewToken={token} documentTitle="Sentetik karma boyutlu belge" initialExpiresAt="2026-10-30T12:00:00Z" />); },
    update(token: string) { root.render(<BelgeShareViewer key={serial} viewToken={token} documentTitle="Sentetik karma boyutlu belge" initialExpiresAt="2026-10-30T12:00:00Z" />); },
    unmount() { root.render(null); },
    sameWorker: async () => sharedWorker === await getSharedBrowserPdfWorker(pdfjs),
  };
  Object.assign(window, { viewerHarness: harness });
}
void start();
