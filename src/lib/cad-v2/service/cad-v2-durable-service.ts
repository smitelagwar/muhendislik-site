// ============================================================================
// DWG/DXF MOTOR V2 — DURABLE PREPARATION SERVICE & STORAGE (G11)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md
// Gereksinimler: R18, R19, R20, R27, R43, R47 | Alt kabul: C07, C08, C09, C10

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as os from "node:os";
import { parseDwgToCanonical } from "../decode/dwg-adapter";
import { parseDxfToCanonical } from "../decode/dxf-adapter";
import { compileCanonicalToScene, type CompiledSceneOutput } from "../compile/scene-compiler";
import { computeSceneIdentity, validateAuthoritativeRevision } from "./scene-identity";

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
    const isVercel = !!process.env.VERCEL;
    const defaultDir =
      process.env.CAD_V2_STORAGE_DIR ||
      (isVercel ? path.join(os.tmpdir(), "cad-v2-scenes") : path.resolve(process.cwd(), ".data/cad-v2-scenes"));
    this.storageDir = storageDir || defaultDir;
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
                const fileIdPart = manifest.sourceVersionKey.split("_")[0] || manifest.sourceVersionKey;
                const exactCacheKey = `global:${fileIdPart}:${manifest.sourceVersionKey}`;
                this.fileSceneMap.set(exactCacheKey, manifest.sceneId);
                this.sceneFileMap.set(manifest.sceneId, fileIdPart);
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

    // Authoritative revizyon belirleme
    const versionKey =
      req.expectedSourceVersionKey ||
      (req.sourceBuffer
        ? `v_${crypto.createHash("sha256").update(req.sourceBuffer).digest("hex").slice(0, 16)}`
        : `v_${Date.now()}`);

    validateAuthoritativeRevision(versionKey);

    // Idempotent tekrar kontrolü: Aynı clientRequestId geldiyse var olanı dön
    if (this.clientRequestMap.has(req.clientRequestId)) {
      const existing = this.clientRequestMap.get(req.clientRequestId)!;
      const job = this.jobs.get(existing.jobId);
      const session = this.viewSessions.get(existing.viewSessionId);

      if (job && session && job.fileId === req.fileId && job.sourceVersionKey === versionKey) {
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

    let sourceSha = "";
    if (req.sourceBuffer) {
      sourceSha = crypto.createHash("sha256").update(req.sourceBuffer).digest("hex");
    }

    const tenant = "global";
    const cacheKey = `${tenant}:${req.fileId}:${versionKey}`;

    let candidateSceneId = this.fileSceneMap.get(cacheKey);
    if (!candidateSceneId && sourceSha) {
      try {
        const idResult = computeSceneIdentity({
          fileId: req.fileId,
          sourceSha256: sourceSha,
          authoritativeRevision: versionKey,
          tenantScope: tenant,
        });
        candidateSceneId = idResult.sceneId;
      } catch {}
    }

    if (candidateSceneId) {
      const existingManifest = await this.getManifestAsync(candidateSceneId);
      if (
        existingManifest &&
        existingManifest.sourceVersionKey === versionKey &&
        (!sourceSha || existingManifest.sourceSha256 === sourceSha)
      ) {
        this.fileSceneMap.set(cacheKey, candidateSceneId);
        this.sceneFileMap.set(candidateSceneId, req.fileId);
        const viewSessionId = `vs_${crypto.randomUUID()}`;
        this.viewSessions.set(viewSessionId, {
          viewSessionId,
          fileId: req.fileId,
          sceneId: candidateSceneId,
          expiresAt: Date.now() + sessionTtlMs,
          createdAt: Date.now(),
        });
        return {
          viewSessionId,
          status: "ready",
          sceneId: candidateSceneId,
          sourceVersionKey: versionKey,
        };
      }
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
    const stagingDir = path.join(this.storageDir, "staging", job.jobId);
    try {
      job.status = "running";
      job.phase = "decode";
      job.updatedAt = Date.now();

      const sourceSha = crypto.createHash("sha256").update(buffer).digest("hex");

      const isDxf = fileName.toLowerCase().endsWith(".dxf");
      const canonical = isDxf
        ? await parseDxfToCanonical(buffer, {
            sourceVersionKey: job.sourceVersionKey,
            sourceSha256: sourceSha,
          })
        : await parseDwgToCanonical(buffer, {
            sourceVersionKey: job.sourceVersionKey,
            sourceSha256: sourceSha,
          });

      job.phase = "compile";
      job.updatedAt = Date.now();

      const idResult = computeSceneIdentity({
        fileId: job.fileId,
        sourceSha256: sourceSha,
        authoritativeRevision: job.sourceVersionKey,
      });
      const deterministicSceneId = idResult.sceneId;

      const compiled = compileCanonicalToScene(canonical, {
        sceneId: deterministicSceneId,
        authoritativeRevision: job.sourceVersionKey,
        fileId: job.fileId,
      });

      // 1. Staging aşaması: Önce staging klasörünü hazırla
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
      fs.mkdirSync(stagingDir, { recursive: true });

      // Parçaları staging'e yaz ve bütünlüğü doğrula
      for (const [chunkId, chunkBytes] of Array.from(compiled.chunks.entries())) {
        const chunkPath = path.join(stagingDir, `${chunkId}.bin`);
        fs.writeFileSync(chunkPath, chunkBytes);

        const actualHash = crypto.createHash("sha256").update(chunkBytes).digest("hex");
        const mChunk = compiled.manifest.chunks.find((c) => c.chunkId === chunkId);
        if (!mChunk || mChunk.sha256 !== actualHash || mChunk.byteLength !== chunkBytes.byteLength) {
          throw new Error(`Staging bütünlük hatası: ${chunkId} karma veya bayt uzunluğu uyuşmuyor.`);
        }
      }

      // Metadata ve index dosyalarını staging'e yaz
      if (compiled.indexFiles) {
        for (const [idxId, idxContent] of Array.from(compiled.indexFiles.entries())) {
          fs.writeFileSync(path.join(stagingDir, `index_${idxId}.json`), idxContent, "utf-8");
        }
      }
      if (compiled.metadataFiles) {
        for (const [metaId, metaContent] of Array.from(compiled.metadataFiles.entries())) {
          fs.writeFileSync(path.join(stagingDir, `meta_${metaId}.json`), metaContent, "utf-8");
        }
      }

      // Manifest'i staging'e yaz
      fs.writeFileSync(
        path.join(stagingDir, "manifest.json"),
        JSON.stringify(compiled.manifest, null, 2),
        "utf-8"
      );

      // 2. Atomik publish öncesi kontrol: Fencing token veya iptal denetimi
      if (job.fence !== 1 || (job.status as CadV2JobStatus) === "cancelled") {
        try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}
        throw new Error("Fencing token ihlali: İş iptal edilmiş veya süresi geçmiş.");
      }

      job.phase = "publish";
      const sceneId = compiled.manifest.sceneId;
      const finalSceneDir = path.join(this.storageDir, sceneId);

      // 3. Atomik publish: Staging dosyalarını nihai sahne klasörüne taşı / kopyala
      if (!fs.existsSync(finalSceneDir)) {
        fs.mkdirSync(finalSceneDir, { recursive: true });
      }
      const stagedEntries = fs.readdirSync(stagingDir);
      for (const entry of stagedEntries) {
        fs.copyFileSync(path.join(stagingDir, entry), path.join(finalSceneDir, entry));
      }
      try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}

      // Vercel Blob kalıcılığı (cross-lambda paylaşım)
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const { put } = await import("@vercel/blob");
          const { getBlobCommandOptions } = await import("@/lib/dokumantasyon/runtime-mode");
          const opts = {
            access: "private" as const,
            addRandomSuffix: false,
            allowOverwrite: true,
            ...getBlobCommandOptions(),
          };
          await put(`cad-v2/scenes/${sceneId}/manifest.json`, JSON.stringify(compiled.manifest), opts);
          const chunkEntries = Array.from(compiled.chunks.entries());
          const BATCH_SIZE = 6;
          for (let i = 0; i < chunkEntries.length; i += BATCH_SIZE) {
            const batch = chunkEntries.slice(i, i + BATCH_SIZE);
            await Promise.all(
              batch.map(([chunkId, chunkBytes]) =>
                put(`cad-v2/scenes/${sceneId}/${chunkId}.bin`, Buffer.from(chunkBytes), opts)
              )
            );
          }
          if (compiled.indexFiles) {
            for (const [idxId, idxContent] of Array.from(compiled.indexFiles.entries())) {
              await put(`cad-v2/scenes/${sceneId}/index_${idxId}.json`, idxContent, opts);
            }
          }
          if (compiled.metadataFiles) {
            for (const [metaId, metaContent] of Array.from(compiled.metadataFiles.entries())) {
              await put(`cad-v2/scenes/${sceneId}/meta_${metaId}.json`, metaContent, opts);
            }
          }
        } catch (bErr) {
          console.warn("[CadV2DurableService] Vercel Blob sahne kayıt uyarısı:", bErr);
        }
      }

      // Yalnızca atomik publish başarılı olduktan sonra bellek haritalarını güncelle
      this.readyScenes.set(sceneId, compiled);
      const cacheKey = `global:${job.fileId}:${job.sourceVersionKey}`;
      this.fileSceneMap.set(cacheKey, sceneId);
      this.sceneFileMap.set(sceneId, job.fileId);

      job.status = "ready";
      job.sceneId = sceneId;
      job.phase = "done";
      job.progress = 100;
      job.updatedAt = Date.now();
    } catch (err: any) {
      try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}
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

    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];

    for (const dir of candidateDirs) {
      const manifestPath = path.join(dir, sceneId, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        } catch {
          continue;
        }
      }
    }
    return null;
  }

  public async getManifestAsync(sceneId: string): Promise<any | null> {
    const local = this.getManifest(sceneId);
    if (local) return local;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { get } = await import("@vercel/blob");
        const { getBlobCommandOptions } = await import("@/lib/dokumantasyon/runtime-mode");
        const blobRes = await get(`cad-v2/scenes/${sceneId}/manifest.json`, {
          access: "private",
          ...getBlobCommandOptions(),
        });
        if (blobRes?.stream) {
          const text = await new Response(blobRes.stream).text();
          const parsed = JSON.parse(text);
          try {
            const sceneDir = path.join(this.storageDir, sceneId);
            if (!fs.existsSync(sceneDir)) fs.mkdirSync(sceneDir, { recursive: true });
            fs.writeFileSync(path.join(sceneDir, "manifest.json"), text, "utf-8");
          } catch {}
          return parsed;
        }
      } catch (err) {
        console.warn(`[CadV2DurableService] Blob manifest fetch hatası:`, err);
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

    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];

    for (const dir of candidateDirs) {
      const chunkPath = path.join(dir, sceneId, `${chunkId}.bin`);
      if (fs.existsSync(chunkPath)) {
        try {
          return new Uint8Array(fs.readFileSync(chunkPath));
        } catch {
          continue;
        }
      }
    }
    return null;
  }

  public async getChunkAsync(sceneId: string, chunkId: string): Promise<Uint8Array | null> {
    const local = this.getChunk(sceneId, chunkId);
    if (local) return local;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { get } = await import("@vercel/blob");
        const { getBlobCommandOptions } = await import("@/lib/dokumantasyon/runtime-mode");
        const blobRes = await get(`cad-v2/scenes/${sceneId}/${chunkId}.bin`, {
          access: "private",
          ...getBlobCommandOptions(),
        });
        if (blobRes?.stream) {
          const buf = await new Response(blobRes.stream).arrayBuffer();
          const u8 = new Uint8Array(buf);
          try {
            const sceneDir = path.join(this.storageDir, sceneId);
            if (!fs.existsSync(sceneDir)) fs.mkdirSync(sceneDir, { recursive: true });
            fs.writeFileSync(path.join(sceneDir, `${chunkId}.bin`), u8);
          } catch {}
          return u8;
        }
      } catch (err) {
        console.warn(`[CadV2DurableService] Blob chunk fetch hatası (${chunkId}):`, err);
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

    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];

    for (const dir of candidateDirs) {
      const metaPath = path.join(dir, sceneId, `meta_${metadataId}.json`);
      if (fs.existsSync(metaPath)) {
        try {
          return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        } catch {
          continue;
        }
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

    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];

    for (const dir of candidateDirs) {
      const idxPath = path.join(dir, sceneId, `index_${indexId}.json`);
      if (fs.existsSync(idxPath)) {
        try {
          return JSON.parse(fs.readFileSync(idxPath, "utf-8"));
        } catch {
          continue;
        }
      }
    }
    return null;
  }
}
