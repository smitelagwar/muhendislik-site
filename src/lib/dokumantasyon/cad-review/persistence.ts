import type { CadReviewDocument } from "./schema";

export type SaveState =
  | { status: "clean"; savedAt?: string }
  | { status: "dirty" }
  | { status: "saving" }
  | { status: "error"; message: string };

export interface CadReviewServerSnapshot {
  schemaVersion: 1;
  serverRevisionId: string;
  revision: number;
  document: CadReviewDocument;
}

export interface CadReviewPersistenceHost {
  fileId: string;
  getDocument: () => CadReviewDocument;
  applyServerDocument: (document: CadReviewDocument, serverRevisionId: string) => void;
  acknowledgeServerSave: (document: CadReviewDocument, serverRevisionId: string) => void;
  saveLocal: (document: CadReviewDocument) => void;
  fetchImpl?: typeof fetch;
  debounceMs?: number;
}

export class CadReviewPersistenceCoordinator {
  private state: SaveState = { status: "dirty" };
  private listeners = new Set<(state: SaveState) => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  private pending = false;
  private disposed = false;
  private hydrated = false;
  private revisionBlocked = false;
  private changeVersion = 0;
  private serverRevisionId: string | null = null;
  private expectedRevision = 0;
  private latestSnapshot: CadReviewDocument | null = null;
  private readonly debounceMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly host: CadReviewPersistenceHost) {
    this.debounceMs = host.debounceMs ?? 600;
    this.fetchImpl = host.fetchImpl ?? fetch;
  }

  getState(): SaveState {
    return this.state;
  }

  subscribe(listener: (state: SaveState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async hydrate(): Promise<void> {
    if (this.disposed || this.hydrated) return;
    this.hydrated = true;
    const hydrateStartVersion = this.changeVersion;
    const localAtStart = this.clone(this.host.getDocument());
    this.host.saveLocal(localAtStart);

    try {
      const response = await this.fetchImpl(`/api/dokumantasyon/files/${this.host.fileId}/review`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Review GET başarısız (${response.status}).`);
      const payload = (await response.json()) as Partial<CadReviewServerSnapshot> & {
        document?: CadReviewDocument;
      };
      if (!payload.document || !payload.serverRevisionId) {
        throw new Error("Review sunucu yanıtı eksik.");
      }

      this.serverRevisionId = payload.serverRevisionId;
      this.expectedRevision = payload.revision ?? payload.document.revision ?? 0;
      const serverDoc = this.clone(payload.document);
      (serverDoc as CadReviewDocument & { serverRevisionId?: string }).serverRevisionId = payload.serverRevisionId;
      const changedDuringHydrate = this.changeVersion !== hydrateStartVersion;
      const local = changedDuringHydrate ? this.clone(this.host.getDocument()) : localAtStart;

      if (serverDoc.items.length > 0) {
        if (changedDuringHydrate) {
          this.revisionBlocked = true;
          this.setState({
            status: "error",
            message: "Sunucu review verisi yüklenirken yeni yerel değişiklik oluştu. Yerel kurtarma korundu; veri kaybını önlemek için yeniden yükleyin.",
          });
          return;
        }
        this.revisionBlocked = false;
        this.host.applyServerDocument(serverDoc, payload.serverRevisionId);
        this.host.saveLocal(serverDoc);
        this.latestSnapshot = serverDoc;
        this.setState({ status: "clean", savedAt: serverDoc.updatedAt });
        return;
      }

      let localRevisionId = (local as CadReviewDocument & { serverRevisionId?: string }).serverRevisionId;
      if (changedDuringHydrate && local.items.length > 0 && !localRevisionId) {
        localRevisionId = payload.serverRevisionId;
        (local as CadReviewDocument & { serverRevisionId?: string }).serverRevisionId = payload.serverRevisionId;
        this.host.saveLocal(local);
      }

      if (local.items.length > 0) {
        if (localRevisionId === payload.serverRevisionId) {
          this.revisionBlocked = false;
          this.latestSnapshot = local;
          this.setState({ status: "dirty" });
          await this.flushNow();
        } else {
          this.revisionBlocked = true;
          this.setState({
            status: "error",
            message: "Yerel kurtarma verisi korundu; kaynak revizyonu doğrulanamadığı için sunucuya otomatik yazılmadı. Yeni revizyonu yeniden yükleyin.",
          });
        }
        return;
      }

      this.revisionBlocked = false;
      this.host.applyServerDocument(serverDoc, payload.serverRevisionId);
      this.host.saveLocal(serverDoc);
      this.latestSnapshot = serverDoc;
      this.setState({ status: "clean", savedAt: serverDoc.updatedAt });
    } catch (error) {
      this.setState({
        status: "error",
        message:
          error instanceof Error
            ? `Yerel kurtarma kullanılabilir. ${error.message}`
            : "Yerel kurtarma kullanılabilir; sunucu senkronu başarısız.",
      });
    }
  }

  markDocumentChanged(): void {
    if (this.disposed) return;
    this.changeVersion += 1;
    const snapshot = this.clone(this.host.getDocument());
    this.latestSnapshot = snapshot;
    this.host.saveLocal(snapshot);
    this.pending = true;
    if (this.revisionBlocked) {
      this.setState({
        status: "error",
        message: "Kaynak revizyonu uyuşmuyor. Değişiklikler yalnız yerel kurtarmada tutuluyor; sunucuya yazılmadı.",
      });
      return;
    }
    this.setState({ status: "dirty" });
    this.schedule();
  }

  retry(): void {
    if (this.disposed) return;
    this.latestSnapshot = this.clone(this.host.getDocument());
    this.pending = true;
    if (this.revisionBlocked) {
      this.setState({
        status: "error",
        message: "Revizyon çatışması yeniden yüklenmeden tekrar denenemez; yerel kurtarma korunuyor.",
      });
      return;
    }
    this.setState({ status: "dirty" });
    void this.flushNow();
  }

  async flushNow(): Promise<void> {
    if (this.disposed || this.revisionBlocked) return;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.inFlight) {
      this.pending = true;
      return;
    }
    if (!this.latestSnapshot) this.latestSnapshot = this.clone(this.host.getDocument());
    if (!this.serverRevisionId) {
      if (!this.hydrated) await this.hydrate();
      if (!this.serverRevisionId || this.revisionBlocked) return;
    }

    const snapshot = this.clone(this.latestSnapshot);
    const saveStartVersion = this.changeVersion;
    this.pending = false;
    this.inFlight = true;
    this.setState({ status: "saving" });

    try {
      const response = await this.fetchImpl(`/api/dokumantasyon/files/${this.host.fileId}/review`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: 1,
          serverRevisionId: this.serverRevisionId,
          expectedRevision: this.expectedRevision,
          items: snapshot.items,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 409) {
        this.revisionBlocked = true;
        throw new Error(body?.error || "Kaynak veya review revizyonu değişti (409 Conflict). Yeniden yükleyin.");
      }
      if (!response.ok || !body?.document) {
        throw new Error(body?.error || `Review PATCH başarısız (${response.status}).`);
      }

      const saved = this.clone(body.document as CadReviewDocument);
      this.serverRevisionId = body.serverRevisionId || this.serverRevisionId;
      this.expectedRevision = body.revision ?? saved.revision;
      (saved as CadReviewDocument & { serverRevisionId?: string }).serverRevisionId = this.serverRevisionId;
      this.host.acknowledgeServerSave(saved, this.serverRevisionId!);
      this.host.saveLocal(
        this.changeVersion === saveStartVersion ? saved : this.clone(this.host.getDocument())
      );

      if (this.changeVersion === saveStartVersion) {
        this.latestSnapshot = saved;
        this.pending = false;
        this.setState({ status: "clean", savedAt: body.savedAt || saved.updatedAt });
      } else {
        this.pending = true;
        this.setState({ status: "dirty" });
      }
    } catch (error) {
      this.pending = true;
      this.setState({
        status: "error",
        message: error instanceof Error ? error.message : "Sunucuya kaydetme başarısız; yerel kurtarma korundu.",
      });
    } finally {
      this.inFlight = false;
      if (this.pending && !this.revisionBlocked && this.state.status !== "error") this.schedule(0);
    }
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.listeners.clear();
  }

  private schedule(delay = this.debounceMs): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flushNow();
    }, delay);
  }

  private setState(state: SaveState): void {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }

  private clone(document: Readonly<CadReviewDocument>): CadReviewDocument {
    return {
      ...document,
      items: document.items.map((item) => ({ ...item, style: { ...item.style } })) as CadReviewDocument["items"],
    };
  }
}
