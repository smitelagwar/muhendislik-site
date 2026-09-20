// ============================================================================
// DWG/DXF MOTOR V2 — DURABLE PREPARATION SERVICE & STORAGE (G11)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md
// Gereksinimler: R18, R19, R20, R27, R43, R47 | Alt kabul: C07, C08, C09, C10

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { parseDwgToCanonical } from "../decode/dwg-adapter";
import { parseDxfToCanonical } from "../decode/dxf-adapter";
import { compileCanonicalToScene, type CompiledSceneOutput } from "../compile/scene-compiler";

export type CadV2JobStatus = "queued" | "running" | "ready" | "degraded" | "failed" | "cancelled";

export interface CadV2Job {
  jobId: string;
  fileId: string;
  sourceVersionKey: string;
  clientRequestId: string;
  status: CadV2JobStatus;
  phase: "source" | "decode" | "normalize" | "compile" | "publish" | "done";
  progress?: number | null;
  sceneId?: string | null;
  fence: number;
  attempt: number;
  createdAt: number;
  updatedAt: number;
  error?: string | null;
}

export interface CadV2ViewSession {
  viewSessionId: string;
  fileId: string;
  jobId?: string | null;
  sceneId?: string | null;
  expiresAt: number;
  createdAt: number;
}

export interface PrepareRequest {
  fileId: string;
  expectedSourceVersionKey?: string | null;
  clientRequestId: string;
  sourceBuffer?: Buffer | Uint8Array;
  fileName?: string;
}

export interface PrepareResponse {
  viewSessionId: string;
  status: "ready" | "preparing";
  jobId?: string;
  sceneId?: string;
  sourceVersionKey: string;
}

export class CadV2DurableService {
  private static instance: CadV2DurableService | null = null;

  // Bellek / yerel repository (test ve yerel ortam için izole)
  private jobs = new Map<string, CadV2Job>();
  private viewSessions = new Map<string, CadV2ViewSession>();
  private clientRequestMap = new Map<string, { jobId: string; viewSessionId: string }>();
  private readyScenes = new Map<string, CompiledSceneOutput>(); // sceneId -> output
  private fileSceneMap = new Map<string, string>(); // fileId/sourceVersionKey -> sceneId
  private sceneFileMap = new Map<string, string>(); // sceneId -> fileId

  private storageDir: string;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || path.resolve(process.cwd(), ".data/cad-v2-scenes");
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch {
        // Tolerans
      }
    }
    this.indexExistingScenes();
  }

  private indexExistingScenes(): void {
    if (!fs.existsSync(this.storageDir)) return;
    try {
      const entries = fs.readdirSync(this.storageDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const sceneId = entry.name;
        const manifestPath = path.join(this.storageDir, sceneId, "manifest.json");
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
            if (manifest.sceneId) {
              if (manifest.sourceVersionKey) {
                this.fileSceneMap.set(manifest.sourceVersionKey, manifest.sceneId);
                const fileIdPart = manifest.sourceVersionKey.split("_")[0];
                if (fileIdPart) {
                  this.fileSceneMap.set(`${fileIdPart}:latest`, manifest.sceneId);
                  this.fileSceneMap.set(fileIdPart, manifest.sceneId);
                  this.sceneFileMap.set(manifest.sceneId, fileIdPart);
                }
              }
              if (manifest.sourceSha256) {
                this.fileSceneMap.set(`sha256:${manifest.sourceSha256}`, manifest.sceneId);
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  public static getInstance(): CadV2DurableService {
    if (!this.instance) {
      this.instance = new CadV2DurableService();
    }
    return this.instance;
  }

  /**
   * 1. POST /prepare (Idempotent hazırlama isteği) (R18, C07)
   */
  public async prepare(req: PrepareRequest): Promise<PrepareResponse> {
    if (!req.clientRequestId) {
      throw new Error("clientRequestId (UUID) zorunludur.");
    }
    if (!req.fileId) {
      throw new Error("fileId zorunludur.");
    }

    const sessionTtlMs = 180_000; // 180s view session TTL (31 sözleşmesi)

    // Idempotent tekrar kontrolü: Aynı clientRequestId geldiyse var olanı dön
    if (this.clientRequestMap.has(req.clientRequestId)) {
      const existing = this.clientRequestMap.get(req.clientRequestId)!;
      const job = this.jobs.get(existing.jobId);
      const session = this.viewSessions.get(existing.viewSessionId);

      if (job && session) {
        session.expiresAt = Date.now() + sessionTtlMs;
        if (job.status === "ready" && job.sceneId) {
          return {
            viewSessionId: session.viewSessionId,
            status: "ready",
            sceneId: job.sceneId,
            sourceVersionKey: job.sourceVersionKey,
          };
        }
        return {
          viewSessionId: session.viewSessionId,
          status: "preparing",
          jobId: job.jobId,
          sourceVersionKey: job.sourceVersionKey,
        };
      }
    }

    const versionKey = req.expectedSourceVersionKey || `v_${Date.now()}`;
    const cacheKey = `${req.fileId}:${versionKey}`;

    // Zaten hazır derlenmiş sahne var mı? (Bellek veya disk indeksi)
    const existingSceneId =
      this.fileSceneMap.get(cacheKey) ||
      this.fileSceneMap.get(versionKey) ||
      this.fileSceneMap.get(`${req.fileId}:latest`) ||
      this.fileSceneMap.get(req.fileId);

    if (existingSceneId && this.getManifest(existingSceneId)) {
      this.sceneFileMap.set(existingSceneId, req.fileId);
      const viewSessionId = `vs_${crypto.randomUUID()}`;
      this.viewSessions.set(viewSessionId, {
        viewSessionId,
        fileId: req.fileId,
        sceneId: existingSceneId,
        expiresAt: Date.now() + sessionTtlMs,
        createdAt: Date.now(),
      });
      return {
        viewSessionId,
        status: "ready",
        sceneId: existingSceneId,
        sourceVersionKey: versionKey,
      };
    }

    // Yeni iş ve oturum oluştur
    const jobId = `job_${crypto.randomUUID()}`;
    const viewSessionId = `vs_${crypto.randomUUID()}`;

    const newJob: CadV2Job = {
      jobId,
      fileId: req.fileId,
      sourceVersionKey: versionKey,
      clientRequestId: req.clientRequestId,
      status: "running",
      phase: "source",
      fence: 1,
      attempt: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(jobId, newJob);
    this.viewSessions.set(viewSessionId, {
      viewSessionId,
      fileId: req.fileId,
      jobId,
      expiresAt: Date.now() + sessionTtlMs,
      createdAt: Date.now(),
    });

    this.clientRequestMap.set(req.clientRequestId, { jobId, viewSessionId });

    // Arka planda veya doğrudan derlemeyi yürüt
    if (req.sourceBuffer) {
      await this.executeJobSync(newJob, req.sourceBuffer, req.fileName || "drawing.dwg");
      if (newJob.status === "ready" && newJob.sceneId) {
        return {
          viewSessionId,
          status: "ready",
          sceneId: newJob.sceneId,
          sourceVersionKey: versionKey,
        };
      }
    }

    return {
      viewSessionId,
      status: "preparing",
      jobId,
      sourceVersionKey: versionKey,
    };
  }

  /**
   * İşi yürütür (source -> decode -> compile -> atomic publish)
   */
  public async executeJobSync(job: CadV2Job, buffer: Buffer | Uint8Array, fileName: string): Promise<void> {
    try {
      job.status = "running";
      job.phase = "decode";
      job.updatedAt = Date.now();

      const isDxf = fileName.toLowerCase().endsWith(".dxf");
      const canonical = isDxf
        ? await parseDxfToCanonical(buffer, {
            sourceVersionKey: job.sourceVersionKey,
            sourceSha256: crypto.createHash("sha256").update(buffer).digest("hex"),
          })
        : await parseDwgToCanonical(buffer, {
            sourceVersionKey: job.sourceVersionKey,
            sourceSha256: crypto.createHash("sha256").update(buffer).digest("hex"),
          });

      job.phase = "compile";
      job.updatedAt = Date.now();
      const compiled = compileCanonicalToScene(canonical);

      // Atomik publish kontrolü: Fencing token eşleşmeli
      if (job.fence !== 1) {
        throw new Error("Fencing token ihlali: İş iptal edilmiş veya süresi geçmiş.");
      }

      job.phase = "publish";
      const sceneId = compiled.manifest.sceneId;

      // Disk / RAM staging
      this.readyScenes.set(sceneId, compiled);
      const cacheKey = `${job.fileId}:${job.sourceVersionKey}`;
      this.fileSceneMap.set(cacheKey, sceneId);
      this.fileSceneMap.set(job.sourceVersionKey, sceneId);
      this.fileSceneMap.set(`${job.fileId}:latest`, sceneId);
      this.fileSceneMap.set(job.fileId, sceneId);
      this.sceneFileMap.set(sceneId, job.fileId);

      // Diske kalıcı olarak yaz
      try {
        const sceneDir = path.join(this.storageDir, sceneId);
        if (!fs.existsSync(sceneDir)) {
          fs.mkdirSync(sceneDir, { recursive: true });
        }
        fs.writeFileSync(path.join(sceneDir, "manifest.json"), JSON.stringify(compiled.manifest, null, 2), "utf-8");
        for (const [chunkId, chunkBytes] of Array.from(compiled.chunks.entries())) {
          fs.writeFileSync(path.join(sceneDir, `${chunkId}.bin`), chunkBytes);
        }
      } catch (saveErr) {
        console.warn("[CadV2DurableService] Sahne diske kaydedilemedi (RAM kullanılacak):", saveErr);
      }

      job.status = "ready";
      job.sceneId = sceneId;
      job.phase = "done";
      job.progress = 100;
      job.updatedAt = Date.now();
    } catch (err: any) {
      job.status = "failed";
      job.error = err?.message || String(err);
      job.updatedAt = Date.now();
    }
  }

  /**
   * Sahne kimliğine bağlı dosya kimliğini döner
   */
  public getFileIdForScene(sceneId: string): string | null {
    return this.sceneFileMap.get(sceneId) || null;
  }

  /**
   * 2. GET /jobs/[jobId]
   */
  public getJob(jobId: string): CadV2Job | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * 3. POST /view-sessions/[viewSessionId]/heartbeat (31 sözleşmesi, 180s TTL) (R18, C08)
   */
  public heartbeatViewSession(viewSessionId: string): { viewSessionId: string; expiresAt: number; serverTime: number } {
    const session = this.viewSessions.get(viewSessionId);
    if (!session) {
      throw new Error("VIEW_SESSION_EXPIRED: Oturum bulunamadı veya süresi doldu.");
    }
    const now = Date.now();
    session.expiresAt = now + 180_000;
    return {
      viewSessionId,
      expiresAt: session.expiresAt,
      serverTime: now,
    };
  }

  /**
   * 4. DELETE /view-sessions/[viewSessionId] (R27, C08)
   */
  public deleteViewSession(viewSessionId: string): boolean {
    const session = this.viewSessions.get(viewSessionId);
    if (!session) return false;

    this.viewSessions.delete(viewSessionId);

    // İlgili işin başka izleyicisi kalmadıysa (unobserved job) fence artır ve iptal et
    if (session.jobId) {
      const otherObservers = Array.from(this.viewSessions.values()).some(
        (s) => s.jobId === session.jobId
      );
      if (!otherObservers) {
        const job = this.jobs.get(session.jobId);
        if (job && (job.status === "queued" || job.status === "running")) {
          job.fence++;
          job.status = "cancelled";
          job.updatedAt = Date.now();
        }
      }
    }

    return true;
  }

  /**
   * 5. GET /scenes/[sceneId]/manifest (R17, C01)
   */
  public getManifest(sceneId: string): any | null {
    const scene = this.readyScenes.get(sceneId);
    if (scene) return scene.manifest;

    // Diskte ara
    const manifestPath = path.join(this.storageDir, sceneId, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      try {
        return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 6. GET /scenes/[sceneId]/chunks/[chunkId] (R17, R21, C03)
   */
  public getChunk(sceneId: string, chunkId: string): Uint8Array | null {
    const scene = this.readyScenes.get(sceneId);
    if (scene && scene.chunks.has(chunkId)) {
      return scene.chunks.get(chunkId)!;
    }

    // Diskte ara
    const chunkPath = path.join(this.storageDir, sceneId, `${chunkId}.bin`);
    if (fs.existsSync(chunkPath)) {
      try {
        return new Uint8Array(fs.readFileSync(chunkPath));
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 7. GET /scenes/[sceneId]/metadata/[metadataId] (Plan 25, B21)
   */
  public async getSceneMetadata(sceneId: string, metadataId: string): Promise<any | null> {
    const scene = this.readyScenes.get(sceneId);
    if (scene) {
      const metaPage = scene.manifest.metadataPages?.find((m: any) => m.metadataId === metadataId);
      if (metaPage) {
        return {
          metadataId,
          sceneId,
          layoutId: metaPage.layoutId,
          layers: scene.manifest.layers || {},
          schemaVersion: scene.manifest.schemaVersion,
        };
      }
    }

    const metaPath = path.join(this.storageDir, sceneId, `meta_${metadataId}.json`);
    if (fs.existsSync(metaPath)) {
      try {
        return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 8. GET /scenes/[sceneId]/indexes/[indexId] (Plan 25, B21)
   */
  public async getSceneIndex(sceneId: string, indexId: string): Promise<any | null> {
    const scene = this.readyScenes.get(sceneId);
    if (scene) {
      const idxPage = scene.manifest.indexPages?.find((i: any) => i.indexId === indexId);
      if (idxPage) {
        return idxPage;
      }
    }

    const idxPath = path.join(this.storageDir, sceneId, `index_${indexId}.json`);
    if (fs.existsSync(idxPath)) {
      try {
        return JSON.parse(fs.readFileSync(idxPath, "utf-8"));
      } catch {
        return null;
      }
    }
    return null;
  }
}
