"use client";

import type {
  AcApDocManager,
  AcApOpenDatabaseOptions,
} from "@mlightcad/cad-simple-viewer";

export const CAD_UPSTREAM_WORKER_URLS = {
  mtextRender: "/cad-upstream/mtext-renderer-worker.js",
  dwgParser: "/cad-upstream/libredwg-parser-worker.js",
} as const;

export const CAD_UPSTREAM_SUPPORTED_EXTENSIONS = new Set([".dxf", ".dwg"]);

export type CadUpstreamTheme = "light" | "dark";

export type CadUpstreamErrorCode =
  | "unsupported-extension"
  | "worker-unavailable"
  | "source-fetch-failed"
  | "source-empty"
  | "open-timeout"
  | "open-failed"
  | "adapter-destroyed";

export class CadUpstreamAdapterError extends Error {
  constructor(
    public readonly code: CadUpstreamErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "CadUpstreamAdapterError";
  }
}

export interface CadUpstreamCreateOptions {
  container: HTMLElement;
  busyIndicatorHost?: HTMLElement;
  theme?: CadUpstreamTheme;
  useMainThreadDraw?: boolean;
}

export interface CadUpstreamOpenOptions {
  accessUrl: string;
  displayName: string;
  extension: string;
  signal?: AbortSignal;
  databaseOptions?: AcApOpenDatabaseOptions;
}

type CadSimpleViewerModule = typeof import("@mlightcad/cad-simple-viewer");

let viewerModulePromise: Promise<CadSimpleViewerModule> | null = null;
let libreDwgRegistrationPromise: Promise<void> | null = null;

function normalizeExtension(extension: string): string {
  const normalized = extension.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith(".") ? normalized : `.${normalized}`;
}

async function loadViewerModule(): Promise<CadSimpleViewerModule> {
  if (!viewerModulePromise) {
    viewerModulePromise = import("@mlightcad/cad-simple-viewer").catch((error) => {
      viewerModulePromise = null;
      throw error;
    });
  }
  return viewerModulePromise;
}

async function registerLibreDwgConverter(): Promise<void> {
  if (!libreDwgRegistrationPromise) {
    libreDwgRegistrationPromise = Promise.all([
      import("@mlightcad/data-model"),
      import("@mlightcad/libredwg-converter"),
    ])
      .then(([dataModel, libreDwg]) => {
        const converter = new libreDwg.AcDbLibreDwgConverter({
          convertByEntityType: false,
          useWorker: true,
          parserWorkerUrl: CAD_UPSTREAM_WORKER_URLS.dwgParser,
        });
        dataModel.AcDbDatabaseConverterManager.instance.register(
          dataModel.AcDbFileType.DWG,
          converter
        );
      })
      .catch((error) => {
        libreDwgRegistrationPromise = null;
        throw error;
      });
  }
  return libreDwgRegistrationPromise;
}

async function fetchCadSource(
  accessUrl: string,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  const response = await fetch(accessUrl, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new CadUpstreamAdapterError(
      "source-fetch-failed",
      `CAD kaynağı alınamadı (HTTP ${response.status}).`
    );
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0) {
    throw new CadUpstreamAdapterError("source-empty", "CAD dosyası boş.");
  }
  return bytes;
}

export class CadUpstreamAdapter {
  private destroyed = false;

  private constructor(
    private readonly manager: AcApDocManager,
    private readonly Viewer: CadSimpleViewerModule
  ) {}

  static async create(options: CadUpstreamCreateOptions): Promise<CadUpstreamAdapter> {
    const Viewer = await loadViewerModule();
    await registerLibreDwgConverter();

    const workersReachable = await Viewer.AcApDocManager.checkWebworkerReadiness(
      CAD_UPSTREAM_WORKER_URLS
    );
    if (!workersReachable) {
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD DWG/MTEXT worker dosyalarına erişilemiyor."
      );
    }

    Viewer.acedApplyUiTheme(options.theme ?? "dark", options.busyIndicatorHost ?? options.container);

    const manager = Viewer.AcApDocManager.createInstance({
      container: options.container,
      busyIndicatorHost: options.busyIndicatorHost ?? options.container,
      autoResize: true,
      webworkerFileUrls: CAD_UPSTREAM_WORKER_URLS,
      checkWorkersOnInit: true,
      useMainThreadDraw: options.useMainThreadDraw ?? false,
    });

    if (!manager) {
      throw new CadUpstreamAdapterError("open-failed", "MLightCAD document manager başlatılamadı.");
    }

    if (!(await manager.areWorkersReady())) {
      await manager.destroy();
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD worker readiness kontrolü başarısız."
      );
    }

    return new CadUpstreamAdapter(manager, Viewer);
  }

  async open(options: CadUpstreamOpenOptions): Promise<void> {
    if (this.destroyed) {
      throw new CadUpstreamAdapterError("adapter-destroyed", "CAD adapter kapatıldı.");
    }

    const extension = normalizeExtension(options.extension);
    if (!CAD_UPSTREAM_SUPPORTED_EXTENSIONS.has(extension)) {
      throw new CadUpstreamAdapterError(
        "unsupported-extension",
        `Desteklenmeyen CAD uzantısı: ${extension || options.extension}`
      );
    }

    if (!(await this.manager.areWorkersReady())) {
      throw new CadUpstreamAdapterError(
        "worker-unavailable",
        "MLightCAD worker dosyaları çizim açılmadan önce doğrulanamadı."
      );
    }

    const bytes = await fetchCadSource(options.accessUrl, options.signal);
    const openOptions: AcApOpenDatabaseOptions = {
      minimumChunkSize: 1000,
      progressiveRendering: true,
      ...(options.databaseOptions ?? {}),
    };

    const success = await this.manager.openDocument(
      options.displayName,
      bytes,
      openOptions
    );

    if (!success) {
      throw new CadUpstreamAdapterError(
        "open-failed",
        `MLightCAD dosyayı açamadı: ${options.displayName}`
      );
    }
  }

  applyTheme(theme: CadUpstreamTheme, host: HTMLElement): void {
    if (this.destroyed) return;
    this.Viewer.acedApplyUiTheme(theme, host);
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    await this.manager.destroy();
  }
}
