import { expect, type Locator, type Page } from "@playwright/test";

export type ExpectedFocusRect = {
  pageNumber: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Önizlemede kullanılan üretilmiş PDF'yi, ürünün mapper'ından bağımsız ölçer. */
export async function readGeneratedFocusRects(page: Page, fields: readonly string[]) {
  const url = await page.getByRole("link", { name: "PDF'yi yeni sekmede aç", exact: true }).first().getAttribute("href");
  expect(url).toMatch(/^blob:/);
  return page.evaluate(async ({ url, fields }) => {
    const pdfjs = (window as unknown as { pdfjsLib: typeof import("pdfjs-dist") }).pdfjsLib;
    const bytes = new Uint8Array(await (await fetch(url!)).arrayBuffer());
    const task = pdfjs.getDocument({ data: bytes });
    try {
      const pdf = await task.promise;
      const rects: Record<string, ExpectedFocusRect> = {};
      for (let number = 1; number <= pdf.numPages; number++) {
        const pdfPage = await pdf.getPage(number);
        const viewport = pdfPage.getViewport({ scale: 1 });
        for (const annotation of await pdfPage.getAnnotations({ intent: "display" })) {
          if (annotation.subtype !== "Widget" || !fields.includes(annotation.fieldName)) continue;
          if (rects[annotation.fieldName]) throw new Error(`Çakışan oracle alanı: ${annotation.fieldName}`);
          const [x1, y1] = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
          const [x2, y2] = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
          rects[annotation.fieldName] = {
            pageNumber: number,
            left: Math.min(x1, x2) / viewport.width,
            top: Math.min(y1, y2) / viewport.height,
            width: Math.abs(x2 - x1) / viewport.width,
            height: Math.abs(y2 - y1) / viewport.height,
          };
        }
      }
      return rects;
    } finally {
      await task.destroy();
    }
  }, { url, fields: [...fields] });
}

export async function expectFocusRect(studio: Locator, key: string, rect: ExpectedFocusRect) {
  const highlight = studio.getByTestId("belge-field-focus-highlight");
  await expect(highlight).toHaveCount(1);
  await expect(highlight).toHaveAttribute("data-field-key", key);
  await expect(highlight).toHaveAttribute("data-page", String(rect.pageNumber));
  await expect.poll(async () => {
    const frame = await studio.locator(".belge-preview-frame").first().boundingBox();
    const box = await highlight.boundingBox();
    if (!frame || !box) return Number.POSITIVE_INFINITY;
    return Math.max(
      Math.abs(box.x - frame.x - frame.width * rect.left),
      Math.abs(box.y - frame.y - frame.height * rect.top),
      Math.abs(box.width - frame.width * rect.width),
      Math.abs(box.height - frame.height * rect.height),
    );
  }, { timeout: 8_000 }).toBeLessThanOrEqual(2);
}

/** ESM namespace'i değiştirmeden gerçek PDF.js çağrılarına test gecikmesi/hatası ekler. */
export async function installFocusProbe(page: Page, options: {
  annotationFailures?: number;
  firstAnnotationDelay?: number;
  omitFirstField?: string;
} = {}) {
  await page.addInitScript((options) => {
    type PdfJs = typeof import("pdfjs-dist");
    const state = {
      annotationCalls: 0, documentLoads: 0, drawCalls: 0, holdRenderUntil: 0,
      renderStarted: 0, renderFinished: 0,
    };
    Object.assign(window, { __focusProbe: state });
    let library: PdfJs | undefined;
    Object.defineProperty(window, "pdfjsLib", {
      configurable: true,
      get: () => library,
      set: (native: PdfJs) => {
        library = {
          ...native,
          getDocument: (...args: Parameters<PdfJs["getDocument"]>) => {
            state.documentLoads++;
            const task = native.getDocument(...args);
            const promise = task.promise.then((pdf) => {
              const pages = new Map<number, Awaited<ReturnType<typeof pdf.getPage>>>();
              return new Proxy(pdf, {
                get(target, key) {
                  if (key === "getPage") return async (number: number) => {
                    if (pages.has(number)) return pages.get(number)!;
                    const pdfPage = await target.getPage(number);
                    const proxy = new Proxy(pdfPage, {
                      get(target, key) {
                        if (key === "getAnnotations") return async (...args: Parameters<typeof target.getAnnotations>) => {
                          const call = ++state.annotationCalls;
                          if (call === 1 && options.firstAnnotationDelay) {
                            await new Promise((resolve) => setTimeout(resolve, options.firstAnnotationDelay));
                          }
                          if (call <= (options.annotationFailures ?? 0)) throw new Error("Kontrollü annotation hatası");
                          const annotations = await target.getAnnotations(...args);
                          return call === 1 && options.omitFirstField
                            ? annotations.filter((annotation) => annotation.fieldName !== options.omitFirstField)
                            : annotations;
                        };
                        if (key === "render") return (...args: Parameters<typeof target.render>) => {
                          const renderTask = target.render(...args);
                          const delay = Math.max(0, state.holdRenderUntil - Date.now());
                          if (!delay) return renderTask;
                          state.renderStarted++;
                          const promise = renderTask.promise.then(async () => {
                            await new Promise((resolve) => setTimeout(resolve, delay));
                            state.renderFinished++;
                          });
                          return new Proxy(renderTask, { get(target, key) {
                            if (key === "promise") return promise;
                            const value = Reflect.get(target, key, target);
                            return typeof value === "function" ? value.bind(target) : value;
                          } });
                        };
                        const value = Reflect.get(target, key, target);
                        return typeof value === "function" ? value.bind(target) : value;
                      },
                    });
                    pages.set(number, proxy);
                    return proxy;
                  };
                  const value = Reflect.get(target, key, target);
                  return typeof value === "function" ? value.bind(target) : value;
                },
              });
            });
            return new Proxy(task, { get(target, key) {
              if (key === "promise") return promise;
              const value = Reflect.get(target, key, target);
              return typeof value === "function" ? value.bind(target) : value;
            } });
          },
        };
      },
    });
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args: unknown[]) {
      state.drawCalls++;
      Reflect.apply(drawImage, this, args);
    };
  }, options);
}
