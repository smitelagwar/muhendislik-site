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
import { compactSceneManifestForTransport } from "../protocol/manifest-index-pages";
import { FontLayoutEngine } from "../text/font-layout-engine";
import { computeSceneIdentity, validateAuthoritativeRevision } from "./scene-identity";
import { getBlobCommandOptions, getDatabaseUrl, hasBlobAccessConfiguration, isVercelDeployment } from "@/lib/dokumantasyon/runtime-mode";
import { CadV2DurableRepository, type CadV2SceneObjectRecord } from "../db/repository";
import {
  CAD_V2_COMPILER_REVISION,
  CAD_V2_QUALITY_PROFILE,
  CAD_V2_RENDER_ABI,
  CAD_V2_SCHEMA_VERSION,
} from "../version";

export type CadV2JobStatus = "queued" | "running" | "ready" | "degraded" | "failed" | "cancelled";

export interface CadV2Job {
  jobId: string;
  fileId: string;
  shareLinkId?: string | null;
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
  shareLinkId?: string | null;
  jobId?: string | null;
  sceneId?: string | null;
  expiresAt: number;
  createdAt: number;
}

export interface PrepareRequest {
  fileId: string;
  shareLinkId?: string | null;
  expectedSourceVersionKey?: string | null;
  clientRequestId: string;
  sourceBuffer?: Buffer | Uint8Array;
  fileName?: string;
  deferCompilation?: boolean;
}

export interface CadV2ExecutionOptions {
  persistFailure?: boolean;
  throwOnFailure?: boolean;
  workerOwnerId?: string | null;
  shouldContinue?: () => Promise<boolean> | boolean;
  compileWithChild?: (input: {
    buffer: Uint8Array;
    fileName: string;
    sourceVersionKey: string;
    fileId: string;
    sceneId: string;
  }) => Promise<CompiledSceneOutput>;
}

export interface PrepareResponse {
  viewSessionId: string;
  status: "ready" | "preparing";
  jobId?: string;
  sceneId?: string;
  sourceVersionKey: string;
}

export interface CadV2BlobStorageAdapter {
  isConfigured(): boolean;
  put(pathname: string, body: string | Uint8Array, options?: Record<string, unknown>): Promise<void>;
  get(pathname: string): Promise<Uint8Array | null>;
}

const CAD_V2_PUBLISH_LEASE_TTL_MS = 10 * 60_000;
const CAD_V2_SCENE_ARTIFACT_VERIFY_CONCURRENCY = 8;

export function hasCadV2DurableBlobConfiguration(): boolean {
  return hasBlobAccessConfiguration();
}

export function isValidCadV2StorageId(id: string): boolean {
  if (typeof id !== "string" || !id) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(id) && !id.includes("..");
}

export class CadV2DurableService {
  private static instance: CadV2DurableService | null = null;

  // Bellek / yerel repository (test ve yerel ortam için izole)
  private jobs = new Map<string, CadV2Job>();
  private viewSessions = new Map<string, CadV2ViewSession>();
  private clientRequestMap = new Map<string, { jobId: string; viewSessionId: string; fontDigest: string }>();
  private readyScenes = new Map<string, CompiledSceneOutput>(); // sceneId -> output
  private fileSceneMap = new Map<string, string>(); // fileId/sourceVersionKey -> sceneId
  private sceneFileMap = new Map<string, string>(); // sceneId -> fileId
  private verifiedSceneArtifactManifests = new WeakSet<object>();
  private sceneArtifactVerificationInFlight = new Map<string, Promise<boolean>>();
  private verifiedInMemorySceneManifests = new WeakSet<object>();
  private manifestChunkIdsByManifest = new WeakMap<object, Set<string>>();
  private parsedManifestByPath = new Map<string, { mtimeMs: number; ctimeMs: number; size: number; manifest: Record<string, any> }>();
  private manifestSha256ByObject = new WeakMap<object, string>();

  private storageDir: string;
  private blobStorageAdapter?: CadV2BlobStorageAdapter;
  private repository: CadV2DurableRepository | null;

  constructor(
    storageDir?: string,
    blobStorageAdapter?: CadV2BlobStorageAdapter,
    repository?: CadV2DurableRepository | null
  ) {
    this.blobStorageAdapter = blobStorageAdapter;
    this.repository = repository === undefined
      ? (getDatabaseUrl() ? CadV2DurableRepository.fromNeon() : null)
      : repository;
    if (isVercelDeployment() && !this.repository) {
      throw new Error("CAD_V2_DATABASE_NOT_CONFIGURED: kalıcı scene/job/session repository kullanılamıyor.");
    }
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

  private isBlobStorageConfigured(): boolean {
    return this.blobStorageAdapter?.isConfigured() ?? hasCadV2DurableBlobConfiguration();
  }

  private async putBlobObject(
    pathname: string,
    body: string | Uint8Array,
    options: Record<string, unknown>
  ): Promise<void> {
    if (this.blobStorageAdapter) {
      await this.blobStorageAdapter.put(pathname, body, options);
      return;
    }

    const { put } = await import("@vercel/blob");
    await put(
      pathname,
      typeof body === "string" ? body : Buffer.from(body),
      options as unknown as Parameters<typeof put>[2]
    );
  }

  private async getBlobObject(pathname: string): Promise<Uint8Array | null> {
    if (this.blobStorageAdapter) {
      return this.blobStorageAdapter.get(pathname);
    }

    const { get } = await import("@vercel/blob");
    const { getBlobCommandOptions } = await import("@/lib/dokumantasyon/runtime-mode");
    const blobRes = await get(pathname, {
      access: "private",
      ...getBlobCommandOptions(),
    });
    if (!blobRes?.stream) return null;
    return new Uint8Array(await new Response(blobRes.stream).arrayBuffer());
  }

  private publishLocalSceneGeneration(
    stagingDir: string,
    finalSceneDir: string,
    generation: string,
    manifest: CompiledSceneOutput["manifest"]
  ): void {
    const objectsDir = path.join(finalSceneDir, "objects");
    fs.mkdirSync(objectsDir, { recursive: true });
    const temporaryObjectsDir = fs.mkdtempSync(path.join(objectsDir, `.${generation}-`));
    const finalObjectsDir = path.join(objectsDir, generation);

    try {
      for (const entry of fs.readdirSync(stagingDir)) {
        if (entry === "manifest.json") continue;
        fs.copyFileSync(path.join(stagingDir, entry), path.join(temporaryObjectsDir, entry));
      }
      fs.renameSync(temporaryObjectsDir, finalObjectsDir);

      const manifestTempPath = path.join(finalSceneDir, `.manifest-${generation}.tmp`);
      fs.writeFileSync(manifestTempPath, JSON.stringify(manifest, null, 2), "utf-8");
      fs.renameSync(manifestTempPath, path.join(finalSceneDir, "manifest.json"));
    } catch (error) {
      try { fs.rmSync(temporaryObjectsDir, { recursive: true, force: true }); } catch {}
      try { fs.rmSync(path.join(finalSceneDir, `.manifest-${generation}.tmp`), { force: true }); } catch {}
      throw error;
    }
  }

  private async verifyUploadedBlobObjectSet(
    objectPrefix: string,
    objects: Array<CadV2SceneObjectRecord & { bytes: Buffer }>,
  ): Promise<boolean> {
    const expected = new Map(objects.map((object) => [object.blobPath, object]));
    if (this.blobStorageAdapter) {
      for (const object of objects) {
        const bytes = await this.blobStorageAdapter.get(object.blobPath);
        if (!bytes || bytes.byteLength !== object.byteLength ||
            crypto.createHash("sha256").update(bytes).digest("hex") !== object.sha256) return false;
      }
      return true;
    }

    const { list } = await import("@vercel/blob");
    let cursor: string | undefined;
    const seen = new Set<string>();
    do {
      const result = await list({
        prefix: `${objectPrefix}/`,
        limit: 1000,
        ...(cursor ? { cursor } : {}),
        ...getBlobCommandOptions(),
      });
      for (const blob of result.blobs) {
        const object = expected.get(blob.pathname);
        if (!object || object.byteLength !== blob.size || seen.has(blob.pathname)) return false;
        seen.add(blob.pathname);
      }
      if (!result.hasMore) break;
      if (!result.cursor || result.cursor === cursor) return false;
      cursor = result.cursor;
    } while (true);
    return seen.size === expected.size && [...expected.keys()].every((pathname) => seen.has(pathname));
  }

  private async getSceneArtifactBytes(
    sceneId: string,
    fileName: string,
    manifest?: Record<string, any> | null
  ): Promise<Uint8Array | null> {
    if (!isValidCadV2StorageId(sceneId) || !isValidCadV2StorageId(fileName)) return null;
    const sceneManifest = manifest || await this.getManifestAsync(sceneId);
    if (!sceneManifest) return null;
    if (this.repository) {
      const object = await this.repository.getReadySceneObject(sceneId, fileName);
      if (!object || !this.isBlobStorageConfigured()) return null;
      try {
        const bytes = await this.getBlobObject(object.blobPath);
        if (!bytes || bytes.byteLength !== object.byteLength) return null;
        if (crypto.createHash("sha256").update(bytes).digest("hex") !== object.sha256) return null;
        return bytes;
      } catch (error) {
        console.warn(`[CadV2DurableService] Durable object fetch failed (${fileName}):`, error);
        return null;
      }
    }
    const generation =
      typeof sceneManifest?.storageGeneration === "string" && isValidCadV2StorageId(sceneManifest.storageGeneration)
        ? sceneManifest.storageGeneration
        : null;

    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];
    for (const dir of candidateDirs) {
      const artifactPath = generation
        ? path.join(dir, sceneId, "objects", generation, fileName)
        : path.join(dir, sceneId, fileName);
      if (fs.existsSync(artifactPath)) {
        try { return new Uint8Array(fs.readFileSync(artifactPath)); } catch {}
      }
    }

    if (!this.isBlobStorageConfigured()) return null;
    const objectPath = generation
      ? `cad-v2/scenes/${sceneId}/objects/${generation}/${fileName}`
      : `cad-v2/scenes/${sceneId}/${fileName}`;
    try {
      const bytes = await this.getBlobObject(objectPath);
      if (!bytes) return null;
      try {
        const cacheDir = path.join(this.storageDir, sceneId, ...(generation ? ["objects", generation] : []));
        fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(path.join(cacheDir, fileName), Buffer.from(bytes));
      } catch {}
      return bytes;
    } catch (error) {
      console.warn(`[CadV2DurableService] Blob artifact fetch failed (${fileName}):`, error);
      return null;
    }
  }

  private async readSceneArtifactBytesForVerification(
    sceneId: string,
    fileName: string,
    manifest: Record<string, any>,
  ): Promise<Uint8Array | null> {
    const generation = typeof manifest.storageGeneration === "string" ? manifest.storageGeneration : null;
    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];
    for (const dir of candidateDirs) {
      const artifactPath = generation
        ? path.join(dir, sceneId, "objects", generation, fileName)
        : path.join(dir, sceneId, fileName);
      try {
        return await fs.promises.readFile(artifactPath);
      } catch {
        // Continue through the same local cache roots as getSceneArtifactBytes.
      }
    }

    if (!this.isBlobStorageConfigured()) return null;
    const objectPath = generation
      ? `cad-v2/scenes/${sceneId}/objects/${generation}/${fileName}`
      : `cad-v2/scenes/${sceneId}/${fileName}`;
    try {
      const bytes = await this.getBlobObject(objectPath);
      if (!bytes) return null;
      try {
        const cacheDir = path.join(this.storageDir, sceneId, ...(generation ? ["objects", generation] : []));
        await fs.promises.mkdir(cacheDir, { recursive: true });
        await fs.promises.writeFile(path.join(cacheDir, fileName), Buffer.from(bytes));
      } catch {}
      return bytes;
    } catch (error) {
      console.warn(`[CadV2DurableService] Blob artifact verification read failed (${fileName}):`, error);
      return null;
    }
  }

  private async hasCompleteSceneArtifacts(manifest: Record<string, any>): Promise<boolean> {
    if (!manifest || !isValidCadV2StorageId(manifest.sceneId) || !Array.isArray(manifest.chunks) || !Array.isArray(manifest.indexPages)) return false;
    if (this.verifiedSceneArtifactManifests.has(manifest)) return true;
    const verificationKey = `${manifest.sceneId}:${String(manifest.storageGeneration ?? "legacy")}:${this.getManifestSha256(manifest)}`;
    const existingVerification = this.sceneArtifactVerificationInFlight.get(verificationKey);
    if (existingVerification) {
      const complete = await existingVerification;
      if (complete) this.verifiedSceneArtifactManifests.add(manifest);
      return complete;
    }

    const verification = this.verifyCompleteSceneArtifacts(manifest);
    this.sceneArtifactVerificationInFlight.set(verificationKey, verification);
    try {
      const complete = await verification;
      if (complete) this.verifiedSceneArtifactManifests.add(manifest);
      return complete;
    } finally {
      if (this.sceneArtifactVerificationInFlight.get(verificationKey) === verification) {
        this.sceneArtifactVerificationInFlight.delete(verificationKey);
      }
    }
  }

  private async verifyCompleteSceneArtifacts(manifest: Record<string, any>): Promise<boolean> {
    const flatChunks = new Map<string, Record<string, any>>();
    for (const chunk of manifest.chunks) {
      if (!chunk || !isValidCadV2StorageId(chunk.chunkId) || flatChunks.has(chunk.chunkId)) return false;
      flatChunks.set(chunk.chunkId, chunk);
    }
    const indexChunks = new Map<string, Record<string, any>>();
    for (const page of manifest.indexPages || []) {
      if (!page || !isValidCadV2StorageId(page.indexId)) return false;
      const bytes = await this.readSceneArtifactBytesForVerification(manifest.sceneId, `index_${page.indexId}.json`, manifest);
      if (!bytes || bytes.byteLength !== page.byteLength) return false;
      if (crypto.createHash("sha256").update(bytes).digest("hex") !== page.sha256) return false;
      let payload: any;
      try { payload = JSON.parse(Buffer.from(bytes).toString("utf8")); } catch { return false; }
      if (payload?.indexId !== page.indexId || !Array.isArray(payload.layoutIds) || !Array.isArray(payload.chunks)) return false;
      if (!Array.isArray(page.layoutIds) || payload.layoutIds.length !== page.layoutIds.length ||
          payload.layoutIds.some((layoutId: unknown, index: number) => layoutId !== page.layoutIds[index])) return false;
      const payloadIds = payload.chunks.map((chunk: any) => chunk?.chunkId);
      const allowedIds = Array.isArray(page.chunkIds) ? page.chunkIds : (Array.isArray(page.chunks) ? page.chunks.map((chunk: any) => chunk?.chunkId) : payloadIds);
      if (payloadIds.length !== allowedIds.length || payloadIds.some((id: unknown, index: number) => id !== allowedIds[index])) return false;
      for (const chunk of payload.chunks) {
        if (!chunk || !isValidCadV2StorageId(chunk.chunkId) || indexChunks.has(chunk.chunkId)) return false;
        indexChunks.set(chunk.chunkId, chunk);
      }
    }
    if (flatChunks.size > 0 && (flatChunks.size !== indexChunks.size || [...flatChunks.keys()].some((id) => !indexChunks.has(id)))) return false;
    if ([...indexChunks.keys()].some((id) => !flatChunks.has(id) && flatChunks.size > 0)) return false;
    if (manifest.indexPages.length > 0 && indexChunks.size === 0 && manifest.chunks.length > 0) return false;

    const artifacts: Array<{ fileName: string; byteLength: number; sha256: string }> = [];
    for (const chunk of indexChunks.values()) {
      if (!isValidCadV2StorageId(chunk.chunkId) || !Number.isSafeInteger(chunk.byteLength) || chunk.byteLength <= 0 ||
          typeof chunk.sha256 !== "string") return false;
      artifacts.push({ fileName: `${chunk.chunkId}.bin`, byteLength: chunk.byteLength, sha256: chunk.sha256 });
    }
    for (const page of manifest.metadataPages || []) {
      if (!page || !isValidCadV2StorageId(page.metadataId) || !Number.isSafeInteger(page.byteLength) || page.byteLength < 0 ||
          typeof page.sha256 !== "string") return false;
      artifacts.push({ fileName: `meta_${page.metadataId}.json`, byteLength: page.byteLength, sha256: page.sha256 });
    }

    let nextArtifactIndex = 0;
    let complete = true;
    const verifyNextArtifact = async () => {
      while (complete) {
        const artifactIndex = nextArtifactIndex++;
        if (artifactIndex >= artifacts.length) return;
        const artifact = artifacts[artifactIndex]!;
        const bytes = await this.readSceneArtifactBytesForVerification(manifest.sceneId, artifact.fileName, manifest);
        if (!bytes || bytes.byteLength !== artifact.byteLength ||
            crypto.createHash("sha256").update(bytes).digest("hex") !== artifact.sha256) {
          complete = false;
          return;
        }
      }
    };
    await Promise.all(Array.from(
      { length: Math.min(CAD_V2_SCENE_ARTIFACT_VERIFY_CONCURRENCY, artifacts.length) },
      () => verifyNextArtifact(),
    ));
    return complete;
  }

  private hasCompleteInMemorySceneArtifacts(manifest: Record<string, any>): boolean {
    const scene = this.readyScenes.get(manifest?.sceneId);
    if (!scene || scene.manifest.storageGeneration !== manifest.storageGeneration ||
        !Array.isArray(manifest.indexPages) || !Array.isArray(manifest.metadataPages)) return false;
    if (this.verifiedInMemorySceneManifests.has(manifest)) return true;
    const indexedChunkIds = new Set<string>();
    for (const page of manifest.indexPages) {
      if (!page || typeof page.indexId !== "string" || !scene.indexFiles?.has(page.indexId)) return false;
      const chunkIds = Array.isArray(page.chunkIds)
        ? page.chunkIds
        : Array.isArray(page.chunks) ? page.chunks.map((chunk: any) => chunk?.chunkId) : null;
      if (!chunkIds) return false;
      for (const chunkId of chunkIds) {
        if (typeof chunkId !== "string" || indexedChunkIds.has(chunkId)) return false;
        indexedChunkIds.add(chunkId);
      }
    }
    const flatChunkIds = new Set<string>((manifest.chunks || []).map((chunk: any) => String(chunk?.chunkId)));
    if (flatChunkIds.size > 0 &&
        (flatChunkIds.size !== indexedChunkIds.size || [...flatChunkIds].some((id) => !indexedChunkIds.has(id)))) return false;
    if (indexedChunkIds.size !== scene.chunks.size || [...indexedChunkIds].some((id) => !scene.chunks.has(id))) return false;

    const metadataIds = new Set(manifest.metadataPages.map((page: any) => page?.metadataId));
    const complete = metadataIds.size === scene.metadataFiles?.size &&
      [...metadataIds].every((id) => typeof id === "string" && scene.metadataFiles?.has(id));
    if (complete) this.verifiedInMemorySceneManifests.add(manifest);
    return complete;
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
                const exactCacheKey = `global:${fileIdPart}:${manifest.sourceVersionKey}:${manifest.dependencyDigest || ""}`;
                this.fileSceneMap.set(exactCacheKey, manifest.sceneId);
                this.sceneFileMap.set(manifest.sceneId, fileIdPart);
              }
              if (manifest.sourceSha256) {
                this.fileSceneMap.set(`sha256:${manifest.sourceSha256}:${manifest.dependencyDigest || ""}`, manifest.sceneId);
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  public static getInstance(): CadV2DurableService {
    const globalScope = globalThis as unknown as { __cadV2DurableServiceInstance?: CadV2DurableService };
    if (!globalScope.__cadV2DurableServiceInstance) {
      globalScope.__cadV2DurableServiceInstance = new CadV2DurableService();
    }
    this.instance = globalScope.__cadV2DurableServiceInstance;
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
    const fontDigest = FontLayoutEngine.getFontDigest();

    // Local process-local mode keeps the legacy fast idempotence path. Durable
    // mode resolves the same request through PostgreSQL below.
    if (!this.repository && this.clientRequestMap.has(req.clientRequestId)) {
      const existing = this.clientRequestMap.get(req.clientRequestId)!;
      const job = this.jobs.get(existing.jobId);
      const session = this.viewSessions.get(existing.viewSessionId);

      if (
        job && session && job.fileId === req.fileId && job.sourceVersionKey === versionKey &&
        session.shareLinkId === (req.shareLinkId || null) && existing.fontDigest === fontDigest
      ) {
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
    const cacheKey = `${tenant}:${req.fileId}:${versionKey}:${fontDigest}`;
    let identityFingerprint = `${tenant}:${req.fileId}:${versionKey}:${sourceSha}:font=${fontDigest}`;
    let candidateSceneId = this.repository ? undefined : this.fileSceneMap.get(cacheKey);
    let identitySceneId: string | undefined;
    if (sourceSha) {
      try {
        const idResult = computeSceneIdentity({
          fileId: req.fileId,
          sourceSha256: sourceSha,
          authoritativeRevision: versionKey,
          tenantScope: tenant,
          fontDigest,
        });
        identitySceneId = idResult.sceneId;
        candidateSceneId ||= identitySceneId;
        identityFingerprint = idResult.canonicalFingerprint;
      } catch {}
    }
    const artifactKey = crypto.createHash("sha256").update(identityFingerprint, "utf8").digest("hex");

    if (candidateSceneId) {
      const existingManifest = await this.getManifestAsync(candidateSceneId);
      if (
        existingManifest &&
        existingManifest.sourceVersionKey === versionKey &&
        (!sourceSha || existingManifest.sourceSha256 === sourceSha) &&
        (this.hasCompleteInMemorySceneArtifacts(existingManifest) || await this.hasCompleteSceneArtifacts(existingManifest))
      ) {
        this.fileSceneMap.set(cacheKey, candidateSceneId);
        this.sceneFileMap.set(candidateSceneId, req.fileId);
        const viewSessionId = `vs_${crypto.randomUUID()}`;
        const session: CadV2ViewSession = {
          viewSessionId,
          fileId: req.fileId,
          shareLinkId: req.shareLinkId || null,
          sceneId: candidateSceneId,
          expiresAt: Date.now() + sessionTtlMs,
          createdAt: Date.now(),
        };
        if (this.repository) {
          const now = Date.now();
          const readyJob: CadV2Job = {
            jobId: `job_${crypto.randomUUID()}`,
            fileId: req.fileId,
            shareLinkId: req.shareLinkId || null,
            sourceVersionKey: versionKey,
            clientRequestId: req.clientRequestId,
            status: "ready",
            phase: "done",
            progress: 100,
            sceneId: candidateSceneId,
            fence: 1,
            attempt: 1,
            createdAt: now,
            updatedAt: now,
          };
          const persisted = await this.repository.createPreparedRecords({
            job: readyJob,
            session: { ...session, jobId: readyJob.jobId },
            artifactKey,
            sourceSha256: sourceSha || null,
          });
          this.jobs.set(persisted.job.jobId, persisted.job);
          this.viewSessions.set(persisted.session.viewSessionId, persisted.session);
          this.clientRequestMap.set(req.clientRequestId, {
            jobId: persisted.job.jobId,
            viewSessionId: persisted.session.viewSessionId,
            fontDigest,
          });
          if (persisted.job.status !== "ready" || !persisted.job.sceneId) {
            return {
              viewSessionId: persisted.session.viewSessionId,
              status: "preparing",
              jobId: persisted.job.jobId,
              sourceVersionKey: versionKey,
            };
          }
          return {
            viewSessionId: persisted.session.viewSessionId,
            status: "ready",
            sceneId: persisted.job.sceneId,
            sourceVersionKey: versionKey,
          };
        }
        this.viewSessions.set(viewSessionId, session);
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

    const deferCompilation = Boolean(req.deferCompilation && this.repository);
    let newJob: CadV2Job = {
      jobId,
      fileId: req.fileId,
      shareLinkId: req.shareLinkId || null,
      sourceVersionKey: versionKey,
      clientRequestId: req.clientRequestId,
      status: deferCompilation ? "queued" : "running",
      phase: "source",
      fence: 1,
      attempt: deferCompilation ? 0 : 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newSession: CadV2ViewSession = {
      viewSessionId,
      fileId: req.fileId,
      shareLinkId: req.shareLinkId || null,
      jobId,
      expiresAt: Date.now() + sessionTtlMs,
      createdAt: Date.now(),
    };

    if (this.repository) {
      const persisted = await this.repository.createPreparedRecords({
        job: newJob,
        session: newSession,
        artifactKey,
        sourceSha256: sourceSha || null,
      });
      newJob = persisted.job;
      this.viewSessions.set(persisted.session.viewSessionId, persisted.session);
      if (!persisted.created) {
        this.jobs.set(newJob.jobId, newJob);
        this.clientRequestMap.set(req.clientRequestId, {
          jobId: newJob.jobId,
          viewSessionId: persisted.session.viewSessionId,
          fontDigest,
        });
        if (newJob.status === "ready" && newJob.sceneId) {
          return {
            viewSessionId: persisted.session.viewSessionId,
            status: "ready",
            sceneId: newJob.sceneId,
            sourceVersionKey: newJob.sourceVersionKey,
          };
        }
        return {
          viewSessionId: persisted.session.viewSessionId,
          status: "preparing",
          jobId: newJob.jobId,
          sourceVersionKey: newJob.sourceVersionKey,
        };
      }
    }

    if (!this.repository) this.viewSessions.set(viewSessionId, newSession);
    this.jobs.set(newJob.jobId, newJob);

    this.clientRequestMap.set(req.clientRequestId, { jobId, viewSessionId, fontDigest });

    // Arka planda veya doğrudan derlemeyi yürüt
    if (req.sourceBuffer && !deferCompilation) {
      await this.executeJobSync(newJob, req.sourceBuffer, req.fileName || "drawing.dwg");
      if (newJob.status === "ready" && newJob.sceneId) {
        if (this.repository) {
          const renewedSession = await this.repository.heartbeatViewSession(viewSessionId, sessionTtlMs);
          if (!renewedSession) {
            throw new Error("VIEW_SESSION_EXPIRED: Senkron hazırlama tamamlandığında kalıcı görüntüleme oturumu yenilenemedi.");
          }
          this.viewSessions.set(viewSessionId, renewedSession);
        } else {
          const completedSession = this.viewSessions.get(viewSessionId);
          if (completedSession) {
            completedSession.sceneId = newJob.sceneId;
            completedSession.expiresAt = Date.now() + sessionTtlMs;
          }
        }
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
  public async executeJobSync(
    job: CadV2Job,
    buffer: Buffer | Uint8Array,
    fileName: string,
    expectedFence = 1,
    options: CadV2ExecutionOptions = {}
  ): Promise<void> {
    if (!buffer || buffer.byteLength === 0) {
      job.status = "failed";
      job.error = "MISSING_SOURCE_BUFFER: Kaynak dosya baytları sağlanamadı.";
      job.updatedAt = Date.now();
      return;
    }
    if ((job.status as CadV2JobStatus) === "cancelled") {
      job.status = "failed";
      job.error = "Fencing token ihlali: İş iptal edilmiş veya süresi geçmiş.";
      job.updatedAt = Date.now();
      return;
    }
    const stagingDir = path.join(this.storageDir, "staging", job.jobId);
    let publishLeaseOwnerId: string | null = null;
    const persistJobProgress = () => this.repository
      ? options.workerOwnerId
        ? this.repository.updateClaimedJob(job, options.workerOwnerId)
        : this.repository.updateJob(job)
      : Promise.resolve(true);
    try {
      if (options.shouldContinue && !(await options.shouldContinue())) {
        throw new Error("CAD_V2_WORKER_LEASE_LOST: worker lease doğrulanamadı.");
      }
      job.status = "running";
      job.phase = "decode";
      job.updatedAt = Date.now();
      if (this.repository && !(await persistJobProgress())) {
        throw new Error("CAD_V2_JOB_FENCED: durable job artık bu fence tarafından sahiplenilmiyor.");
      }

      const sourceSha = crypto.createHash("sha256").update(buffer).digest("hex");
      const fontDigest = FontLayoutEngine.getFontDigest();
      const idResult = computeSceneIdentity({
        fileId: job.fileId,
        sourceSha256: sourceSha,
        authoritativeRevision: job.sourceVersionKey,
        fontDigest,
      });
      const deterministicSceneId = idResult.sceneId;

      let compiled: CompiledSceneOutput;
      if (options.compileWithChild) {
        job.phase = "compile";
        job.updatedAt = Date.now();
        if (this.repository && !(await persistJobProgress())) {
          throw new Error("CAD_V2_JOB_FENCED: supervised compile öncesi durable job fence doğrulanamadı.");
        }
        compiled = await options.compileWithChild({
          buffer: Buffer.from(buffer),
          fileName,
          sourceVersionKey: job.sourceVersionKey,
          fileId: job.fileId,
          sceneId: deterministicSceneId,
        });
      } else {
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
        if (this.repository && !(await persistJobProgress())) {
          throw new Error("CAD_V2_JOB_FENCED: compile öncesi durable job fence doğrulanamadı.");
        }
        compiled = compileCanonicalToScene(canonical, {
          sceneId: deterministicSceneId,
          authoritativeRevision: job.sourceVersionKey,
          fileId: job.fileId,
        });
      }
      if (
        compiled.manifest.sceneId !== deterministicSceneId ||
        compiled.manifest.sourceVersionKey !== job.sourceVersionKey ||
        compiled.manifest.sourceSha256 !== sourceSha ||
        compiled.manifest.dependencyDigest !== fontDigest
      ) {
        throw new Error("CAD_V2_COMPILER_CHILD_IDENTITY_MISMATCH: child manifest job revision/source identity ile eşleşmiyor.");
      }

      if (options.shouldContinue && !(await options.shouldContinue())) {
        throw new Error("CAD_V2_WORKER_LEASE_LOST: compile sonrasında worker lease doğrulanamadı.");
      }

      if (this.repository) {
        const existingScene = await this.repository.getReadyScene(deterministicSceneId);
        if (
          existingScene && existingScene.fileId === job.fileId &&
          existingScene.sourceVersionKey === job.sourceVersionKey && existingScene.sourceSha256 === sourceSha
        ) {
          const existingManifest = await this.getManifestAsync(deterministicSceneId);
          if (existingManifest && await this.hasCompleteSceneArtifacts(existingManifest)) {
            const adopted = await this.repository.completeJobFromReadyScene({
              jobId: job.jobId,
              fence: expectedFence,
              sceneId: deterministicSceneId,
              fileId: job.fileId,
              sourceVersionKey: job.sourceVersionKey,
              sourceSha256: sourceSha,
              workerOwnerId: options.workerOwnerId,
            });
            if (adopted) {
              this.readyScenes.set(deterministicSceneId, { ...compiled, manifest: existingManifest });
              this.fileSceneMap.set(`global:${job.fileId}:${job.sourceVersionKey}:${compiled.manifest.dependencyDigest}`, deterministicSceneId);
              this.sceneFileMap.set(deterministicSceneId, job.fileId);
              job.status = "ready";
              job.sceneId = deterministicSceneId;
              job.phase = "done";
              job.progress = 100;
              job.updatedAt = Date.now();
              return;
            }
          }
        }
      }

      // 1. Staging aşaması: Önce staging klasörünü hazırla
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
      fs.mkdirSync(stagingDir, { recursive: true });

      // Parçaları staging'e yaz ve bütünlüğü doğrula
      const manifestChunksById = new Map(compiled.manifest.chunks.map((chunk) => [chunk.chunkId, chunk]));
      for (const [chunkId, chunkBytes] of Array.from(compiled.chunks.entries())) {
        const chunkPath = path.join(stagingDir, `${chunkId}.bin`);
        fs.writeFileSync(chunkPath, chunkBytes);

        const actualHash = crypto.createHash("sha256").update(chunkBytes).digest("hex");
        const mChunk = manifestChunksById.get(chunkId);
        if (!mChunk || mChunk.sha256 !== actualHash || mChunk.byteLength !== chunkBytes.byteLength) {
          throw new Error(`Staging bütünlük hatası: ${chunkId} karma veya bayt uzunluğu uyuşmuyor.`);
        }
      }

      const manifestChunkIds = new Set(compiled.manifest.chunks.map((chunk) => chunk.chunkId));
      if (
        manifestChunkIds.size !== compiled.chunks.size ||
        Array.from(compiled.chunks.keys()).some((chunkId) => !manifestChunkIds.has(chunkId))
      ) {
        throw new Error("Staging bütünlük hatası: manifest ve derlenen chunk kümeleri uyuşmuyor.");
      }

      const manifestIndexIds = new Set((compiled.manifest.indexPages || []).map((page) => page.indexId));
      const compiledIndexIds = new Set(compiled.indexFiles?.keys() || []);
      if (
        manifestIndexIds.size !== compiledIndexIds.size ||
        Array.from(compiledIndexIds).some((indexId) => !manifestIndexIds.has(indexId))
      ) {
        throw new Error("Staging bütünlük hatası: manifest ve derlenen index kümeleri uyuşmuyor.");
      }
      const indexedChunkIds = new Set<string>();
      for (const [indexId, content] of compiled.indexFiles || []) {
        const page = compiled.manifest.indexPages.find((candidate) => candidate.indexId === indexId);
        const bytes = Buffer.from(content, "utf-8");
        if (
          !page || page.byteLength !== bytes.byteLength ||
          page.sha256 !== crypto.createHash("sha256").update(bytes).digest("hex")
        ) {
          throw new Error(`Staging bütünlük hatası: index_${indexId}.json içeriği manifest ile uyuşmuyor.`);
        }
        let payload: any;
        try { payload = JSON.parse(content); } catch {
          throw new Error(`Staging bütünlük hatası: index_${indexId}.json geçerli JSON değil.`);
        }
        const payloadChunkIds = Array.isArray(payload?.chunks) ? payload.chunks.map((chunk: any) => chunk?.chunkId) : null;
        const declaredChunkIds = Array.isArray(page.chunkIds)
          ? page.chunkIds
          : Array.isArray(page.chunks) ? page.chunks.map((chunk) => chunk.chunkId) : null;
        if (
          payload?.indexId !== indexId || !Array.isArray(payload?.layoutIds) || !Array.isArray(declaredChunkIds) ||
          !payloadChunkIds || payloadChunkIds.length !== declaredChunkIds.length ||
          payloadChunkIds.some((chunkId: unknown, index: number) => chunkId !== declaredChunkIds[index]) ||
          payload.layoutIds.length !== page.layoutIds.length ||
          payload.layoutIds.some((layoutId: unknown, index: number) => layoutId !== page.layoutIds[index])
        ) {
          throw new Error(`Staging bütünlük hatası: index_${indexId}.json chunk/layout seti referansla uyuşmuyor.`);
        }
        for (const chunkId of payloadChunkIds) {
          if (typeof chunkId !== "string" || !manifestChunksById.has(chunkId) || indexedChunkIds.has(chunkId)) {
            throw new Error(`Staging bütünlük hatası: index ${indexId} bilinmeyen veya yinelenen chunk ID içeriyor.`);
          }
          indexedChunkIds.add(chunkId);
        }
      }
      if (indexedChunkIds.size !== manifestChunkIds.size ||
          Array.from(manifestChunkIds).some((chunkId) => !indexedChunkIds.has(chunkId))) {
        throw new Error("Staging bütünlük hatası: immutable index sayfaları manifestteki chunk kümesini tam kapsamıyor.");
      }

      const manifestMetadataIds = new Set((compiled.manifest.metadataPages || []).map((page) => page.metadataId));
      const compiledMetadataIds = new Set(compiled.metadataFiles?.keys() || []);
      if (
        manifestMetadataIds.size !== compiledMetadataIds.size ||
        Array.from(compiledMetadataIds).some((metadataId) => !manifestMetadataIds.has(metadataId))
      ) {
        throw new Error("Staging bütünlük hatası: manifest ve derlenen metadata kümeleri uyuşmuyor.");
      }
      for (const [metadataId, content] of compiled.metadataFiles || []) {
        const page = compiled.manifest.metadataPages.find((candidate) => candidate.metadataId === metadataId);
        const bytes = Buffer.from(content, "utf-8");
        if (
          !page || page.byteLength !== bytes.byteLength ||
          page.sha256 !== crypto.createHash("sha256").update(bytes).digest("hex")
        ) {
          throw new Error(`Staging bütünlük hatası: meta_${metadataId}.json içeriği manifest ile uyuşmuyor.`);
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

      // 2. Atomik publish öncesi kontrol: Fencing token veya iptal denetimi
      if (options.shouldContinue && !(await options.shouldContinue())) {
        throw new Error("CAD_V2_WORKER_LEASE_LOST: publish öncesinde worker lease doğrulanamadı.");
      }
      if (job.fence !== expectedFence || (job.status as CadV2JobStatus) === "cancelled") {
        try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}
        throw new Error("Fencing token ihlali: İş iptal edilmiş veya süresi geçmiş.");
      }

      job.phase = "publish";
      job.updatedAt = Date.now();
      if (this.repository && !(await persistJobProgress())) {
        throw new Error("CAD_V2_JOB_FENCED: publish öncesi durable job fence doğrulanamadı.");
      }
      const sceneId = compiled.manifest.sceneId;
      const finalSceneDir = path.join(this.storageDir, sceneId);
      const storageGeneration = `g_${crypto.randomUUID().replace(/-/g, "")}`;
      const publishedManifest = compactSceneManifestForTransport({
        ...compiled.manifest,
        storageGeneration,
      }) as CompiledSceneOutput["manifest"];
      const publishedManifestJson = JSON.stringify(publishedManifest);
      const publishedManifestBytes = Buffer.byteLength(publishedManifestJson, "utf8");
      if (publishedManifestBytes > publishedManifest.limits.maxManifestBytes) {
        throw new Error(`CAD_V2_MANIFEST_TOO_LARGE: transport manifest exceeds ${publishedManifest.limits.maxManifestBytes} bytes (${publishedManifestBytes}).`);
      }
      fs.writeFileSync(path.join(stagingDir, "manifest.json"), JSON.stringify(publishedManifest, null, 2), "utf-8");

      const blobConfigured = this.isBlobStorageConfigured();
      if (isVercelDeployment() && !blobConfigured) {
        throw new Error("CAD_V2_BLOB_NOT_CONFIGURED: kalıcı özel Blob deposu kullanılamıyor.");
      }
      if (this.repository && !blobConfigured) {
        throw new Error("CAD_V2_BLOB_NOT_CONFIGURED: durable repository ile local scene storage fallback kullanılamaz.");
      }

      const objectPrefix = `cad-v2/scenes/${sceneId}/objects/${storageGeneration}`;
      const stagedEntries = fs.readdirSync(stagingDir).filter((entry) => entry !== "manifest.json");
      const manifestBytes = Buffer.from(publishedManifestJson, "utf8");
      const durableObjects: Array<CadV2SceneObjectRecord & { bytes: Buffer }> = stagedEntries.map((entry) => {
        const bytes = fs.readFileSync(path.join(stagingDir, entry));
        const objectType = entry.endsWith(".bin") ? "chunk" : entry.startsWith("index_") ? "index" : "metadata";
        return {
          objectId: entry,
          objectType: objectType as "chunk" | "index" | "metadata",
          byteLength: bytes.byteLength,
          sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
          blobPath: `${objectPrefix}/${entry}`,
          bytes,
        };
      });
      durableObjects.push({
        objectId: "manifest.json",
        objectType: "manifest" as const,
        byteLength: manifestBytes.byteLength,
        sha256: crypto.createHash("sha256").update(manifestBytes).digest("hex"),
        blobPath: `${objectPrefix}/manifest.json`,
        bytes: manifestBytes,
      });

      if (blobConfigured) {
        const opts = {
          access: "private" as const,
          addRandomSuffix: false,
          allowOverwrite: true,
          ...(this.blobStorageAdapter ? {} : getBlobCommandOptions()),
        };
        if (this.repository) {
          publishLeaseOwnerId = `publisher_${crypto.randomUUID().replace(/-/g, "")}`;
          const acquired = await this.repository.beginPublishLease({
            jobId: job.jobId,
            fence: expectedFence,
            sceneId,
            storageGeneration,
            ownerId: publishLeaseOwnerId,
            ttlMs: CAD_V2_PUBLISH_LEASE_TTL_MS,
          });
          if (!acquired) throw new Error("CAD_V2_PUBLISH_LEASE_FENCED: generation yazımı için lease alınamadı.");
        }
        const renewPublishLease = async () => {
          if (!this.repository || !publishLeaseOwnerId) return;
          const renewed = await this.repository.renewPublishLease({
            jobId: job.jobId,
            fence: expectedFence,
            sceneId,
            storageGeneration,
            ownerId: publishLeaseOwnerId,
            ttlMs: CAD_V2_PUBLISH_LEASE_TTL_MS,
          });
          if (!renewed) throw new Error("CAD_V2_PUBLISH_LEASE_FENCED: immutable nesne yüklemesi durduruldu.");
        };
        for (const object of durableObjects) {
          if (object.objectType === "manifest") continue;
          await renewPublishLease();
          await this.putBlobObject(object.blobPath, object.bytes, opts);
        }

        // An immutable manifest belongs to the same generation. The fixed path
        // remains a compatibility alias and is still written last.
        await renewPublishLease();
        await this.putBlobObject(`${objectPrefix}/manifest.json`, manifestBytes, opts);
        if (!(await this.verifyUploadedBlobObjectSet(objectPrefix, durableObjects))) {
          throw new Error("CAD_V2_BLOB_OBJECT_SET_INCOMPLETE: immutable object listing does not match the complete staged generation.");
        }

        // Publish the fixed compatibility pointer only after every immutable
        // object, including the generation manifest, has been stored.
        await renewPublishLease();
        await this.putBlobObject(
          `cad-v2/scenes/${sceneId}/manifest.json`,
          JSON.stringify(publishedManifest),
          opts
        );
      }

      if (this.repository) {
        if (options.shouldContinue && !(await options.shouldContinue())) {
          throw new Error("CAD_V2_WORKER_LEASE_LOST: READY commit öncesinde worker lease doğrulanamadı.");
        }
        const identity = computeSceneIdentity({
          fileId: job.fileId,
          sourceSha256: sourceSha,
          authoritativeRevision: job.sourceVersionKey,
          tenantScope: "global",
          fontDigest: compiled.manifest.dependencyDigest,
        });
        const committed = await this.repository.publishSceneAndCompleteJob({
          jobId: job.jobId,
          fence: expectedFence,
          workerOwnerId: options.workerOwnerId,
          leaseOwnerId: publishLeaseOwnerId!,
          sceneId,
          fileId: job.fileId,
          sourceVersionKey: job.sourceVersionKey,
          sourceSha256: sourceSha,
          artifactKey: crypto.createHash("sha256").update(identity.canonicalFingerprint, "utf8").digest("hex"),
          tenantScope: "global",
          storageGeneration,
          compilerRevision: CAD_V2_COMPILER_REVISION,
          schemaVersion: CAD_V2_SCHEMA_VERSION,
          renderAbi: CAD_V2_RENDER_ABI,
          qualityProfile: CAD_V2_QUALITY_PROFILE,
          fontDigest: compiled.manifest.dependencyDigest,
          manifestSha256: crypto.createHash("sha256").update(manifestBytes).digest("hex"),
          manifestBlobPath: `${objectPrefix}/manifest.json`,
          objects: durableObjects.map(({ bytes: _bytes, ...object }) => object),
        });
        if (!committed) {
          throw new Error("CAD_V2_DURABLE_PUBLISH_INCOMPLETE: DB READY pointer nesne kümesini veya job fence'ini onaylamadı.");
        }
      }

      try {
        this.publishLocalSceneGeneration(stagingDir, finalSceneDir, storageGeneration, publishedManifest);
      } catch (localPublishError) {
        if (!blobConfigured) throw localPublishError;
        console.warn("[CadV2DurableService] Blob yayını başarılı, yerel cache yazımı atlandı:", localPublishError);
      }
      try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}

      // Yalnızca atomik publish başarılı olduktan sonra bellek haritalarını güncelle
      this.readyScenes.set(sceneId, { ...compiled, manifest: publishedManifest });
      const cacheKey = `global:${job.fileId}:${job.sourceVersionKey}:${publishedManifest.dependencyDigest}`;
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
      if (this.repository && options.persistFailure !== false) {
        try { await persistJobProgress(); }
        catch (persistError) { console.error("[CadV2DurableService] Job failure state could not be persisted:", persistError); }
      }
      if (options.throwOnFailure) throw err instanceof Error ? err : new Error(String(err));
    }
  }

  /**
   * Sahne kimliğine bağlı dosya kimliğini döner
   */
  public getFileIdForScene(sceneId: string): string | null {
    return this.sceneFileMap.get(sceneId) || null;
  }

  public async getFileIdForSceneAsync(sceneId: string): Promise<string | null> {
    if (this.repository) return this.repository.getFileIdForReadyScene(sceneId);
    return this.getFileIdForScene(sceneId);
  }

  /**
   * 2. GET /jobs/[jobId]
   */
  public getJob(jobId: string): CadV2Job | null {
    return this.jobs.get(jobId) || null;
  }

  public async getJobAsync(jobId: string): Promise<CadV2Job | null> {
    if (this.repository) return this.repository.getJob(jobId);
    return this.getJob(jobId);
  }

  public failJob(jobId: string, reason: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    job.status = "failed";
    job.error = reason;
    job.updatedAt = Date.now();
    return true;
  }

  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    job.fence++;
    job.status = "cancelled";
    job.updatedAt = Date.now();
    return true;
  }

  /**
   * 3. POST /view-sessions/[viewSessionId]/heartbeat (31 sözleşmesi, 180s TTL) (R18, C08)
   */
  public heartbeatViewSession(viewSessionId: string): { viewSessionId: string; expiresAt: number; serverTime: number } {
    const session = this.viewSessions.get(viewSessionId);
    const now = Date.now();
    if (!session || session.expiresAt <= now) {
      if (session) {
        this.viewSessions.delete(viewSessionId);
      }
      throw new Error("VIEW_SESSION_EXPIRED: Oturum bulunamadı veya süresi doldu.");
    }
    session.expiresAt = now + 180_000;
    return {
      viewSessionId,
      expiresAt: session.expiresAt,
      serverTime: now,
    };
  }

  public async heartbeatViewSessionAsync(viewSessionId: string): Promise<{ viewSessionId: string; expiresAt: number; serverTime: number }> {
    if (!this.repository) return this.heartbeatViewSession(viewSessionId);
    const now = Date.now();
    const session = await this.repository.heartbeatViewSession(viewSessionId);
    if (!session) throw new Error("VIEW_SESSION_EXPIRED: Oturum bulunamadı veya süresi doldu.");
    return { viewSessionId, expiresAt: session.expiresAt, serverTime: now };
  }

  public getViewSession(viewSessionId: string): CadV2ViewSession | null {
    const session = this.viewSessions.get(viewSessionId);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      this.viewSessions.delete(viewSessionId);
      return null;
    }
    return session;
  }

  public async getViewSessionAsync(viewSessionId: string): Promise<CadV2ViewSession | null> {
    if (this.repository) return this.repository.getViewSession(viewSessionId);
    return this.getViewSession(viewSessionId);
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

  public async deleteViewSessionAsync(viewSessionId: string): Promise<boolean> {
    if (this.repository) return this.repository.deleteViewSession(viewSessionId);
    return this.deleteViewSession(viewSessionId);
  }

  /**
   * 5. GET /scenes/[sceneId]/manifest (R17, C01)
   */
  public getManifest(sceneId: string): any | null {
    if (!isValidCadV2StorageId(sceneId)) return null;
    const scene = this.readyScenes.get(sceneId);
    if (scene) return scene.manifest;

    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];

    for (const dir of candidateDirs) {
      const manifestPath = path.resolve(dir, sceneId, "manifest.json");
      try {
        const stat = fs.statSync(manifestPath);
        if (!stat.isFile()) continue;
        const cached = this.parsedManifestByPath.get(manifestPath);
        if (cached && cached.mtimeMs === stat.mtimeMs && cached.ctimeMs === stat.ctimeMs && cached.size === stat.size) {
          this.parsedManifestByPath.delete(manifestPath);
          this.parsedManifestByPath.set(manifestPath, cached);
          return cached.manifest;
        }

        const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        if (!parsed || typeof parsed !== "object" || parsed.sceneId !== sceneId) continue;
        this.parsedManifestByPath.delete(manifestPath);
        this.parsedManifestByPath.set(manifestPath, {
          mtimeMs: stat.mtimeMs,
          ctimeMs: stat.ctimeMs,
          size: stat.size,
          manifest: parsed,
        });
        while (this.parsedManifestByPath.size > 8) {
          const oldest = this.parsedManifestByPath.keys().next().value as string | undefined;
          if (oldest === undefined) break;
          this.parsedManifestByPath.delete(oldest);
        }
        return parsed;
      } catch {
        continue;
      }
    }
    return null;
  }

  private getManifestSha256(manifest: Record<string, any>): string {
    const cached = this.manifestSha256ByObject.get(manifest);
    if (cached) return cached;
    const bytes = Buffer.from(JSON.stringify(manifest), "utf8");
    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    this.manifestSha256ByObject.set(manifest, sha256);
    return sha256;
  }
  public async getManifestAsync(sceneId: string): Promise<any | null> {
    if (this.repository) {
      const durableScene = await this.repository.getReadyScene(sceneId);
      if (!durableScene || !isValidCadV2StorageId(sceneId) || !this.isBlobStorageConfigured()) return null;
      const local = this.getManifest(sceneId);
      if (local && local.storageGeneration === durableScene.storageGeneration) {
        if (this.getManifestSha256(local) === durableScene.manifestSha256) {
          if (this.hasCompleteInMemorySceneArtifacts(local) || await this.hasCompleteSceneArtifacts(local)) return local;
          return null;
        }
      }
      try {
        const bytes = await this.getBlobObject(durableScene.manifestBlobPath);
        if (!bytes || crypto.createHash("sha256").update(bytes).digest("hex") !== durableScene.manifestSha256) return null;
        const parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));
        if (
          parsed.sceneId !== durableScene.sceneId ||
          parsed.sourceVersionKey !== durableScene.sourceVersionKey ||
          parsed.sourceSha256 !== durableScene.sourceSha256 ||
          parsed.storageGeneration !== durableScene.storageGeneration ||
          parsed.compilerVersion !== durableScene.compilerRevision ||
          parsed.schemaVersion !== durableScene.schemaVersion ||
          parsed.renderAbi !== durableScene.renderAbi ||
          parsed.qualityProfile !== durableScene.qualityProfile ||
          parsed.dependencyDigest !== durableScene.fontDigest
        ) return null;
        if (!(this.hasCompleteInMemorySceneArtifacts(parsed) || await this.hasCompleteSceneArtifacts(parsed))) return null;
        try {
          const sceneDir = path.join(this.storageDir, sceneId);
          fs.mkdirSync(sceneDir, { recursive: true });
          fs.writeFileSync(path.join(sceneDir, "manifest.json"), Buffer.from(bytes));
        } catch {}
        return parsed;
      } catch (err) {
        console.warn("[CadV2DurableService] Durable manifest read failed:", err);
        return null;
      }
    }

    const local = this.getManifest(sceneId);
    if (local) {
      if (this.hasCompleteInMemorySceneArtifacts(local)) return local;
      return await this.hasCompleteSceneArtifacts(local) ? local : null;
    }

    if (this.isBlobStorageConfigured()) {
      try {
        const blobBytes = await this.getBlobObject(`cad-v2/scenes/${sceneId}/manifest.json`);
        if (blobBytes) {
          const text = Buffer.from(blobBytes).toString("utf-8");
          const parsed = JSON.parse(text);
          if (
            !(typeof parsed.storageGeneration === "string" && isValidCadV2StorageId(parsed.storageGeneration)) &&
            !(await this.hasCompleteSceneArtifacts(parsed))
          ) {
            return null;
          }
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
    if (!isValidCadV2StorageId(sceneId) || !isValidCadV2StorageId(chunkId)) return null;
    const scene = this.readyScenes.get(sceneId);
    if (scene && scene.chunks.has(chunkId)) {
      return scene.chunks.get(chunkId)!;
    }

    const manifest = this.getManifest(sceneId);
    const generation =
      typeof manifest?.storageGeneration === "string" && isValidCadV2StorageId(manifest.storageGeneration)
        ? manifest.storageGeneration
        : null;
    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];

    for (const dir of candidateDirs) {
      const chunkPath = generation
        ? path.join(dir, sceneId, "objects", generation, `${chunkId}.bin`)
        : path.join(dir, sceneId, `${chunkId}.bin`);
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
    if (!isValidCadV2StorageId(sceneId) || !isValidCadV2StorageId(chunkId)) return null;
    const manifest = await this.getManifestAsync(sceneId);
    if (!manifest || !this.getAllowedManifestChunkIds(manifest).has(chunkId)) return null;
    if (this.repository) {
      return this.getSceneArtifactBytes(sceneId, `${chunkId}.bin`, manifest);
    }
    const local = this.getChunk(sceneId, chunkId);
    if (local) return local;
    return this.getSceneArtifactBytes(sceneId, `${chunkId}.bin`, manifest);
  }

  private getAllowedManifestChunkIds(manifest: Record<string, any>): Set<string> {
    const cached = this.manifestChunkIdsByManifest.get(manifest);
    if (cached) return cached;

    const chunkIds = new Set<string>();
    for (const chunk of Array.isArray(manifest.chunks) ? manifest.chunks : []) {
      if (typeof chunk?.chunkId === "string") chunkIds.add(chunk.chunkId);
    }
    for (const page of Array.isArray(manifest.indexPages) ? manifest.indexPages : []) {
      if (Array.isArray(page?.chunkIds)) {
        for (const chunkId of page.chunkIds) {
          if (typeof chunkId === "string") chunkIds.add(chunkId);
        }
      } else if (Array.isArray(page?.chunks)) {
        for (const chunk of page.chunks) {
          if (typeof chunk?.chunkId === "string") chunkIds.add(chunk.chunkId);
        }
      }
    }

    this.manifestChunkIdsByManifest.set(manifest, chunkIds);
    return chunkIds;
  }
  public async getSceneMetadata(sceneId: string, metadataId: string): Promise<any | null> {
    if (!isValidCadV2StorageId(sceneId) || !isValidCadV2StorageId(metadataId)) return null;
    if (this.repository) {
      const manifest = await this.getManifestAsync(sceneId);
      if (!manifest?.metadataPages?.some((page: any) => page.metadataId === metadataId)) return null;
      const bytes = await this.getSceneArtifactBytes(sceneId, `meta_${metadataId}.json`, manifest);
      if (!bytes) return null;
      try { return JSON.parse(Buffer.from(bytes).toString("utf8")); } catch { return null; }
    }
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
      const manifest = this.getManifest(sceneId);
      const generation =
        typeof manifest?.storageGeneration === "string" && isValidCadV2StorageId(manifest.storageGeneration)
          ? manifest.storageGeneration
          : null;
      const metaPath = generation
        ? path.join(dir, sceneId, "objects", generation, `meta_${metadataId}.json`)
        : path.join(dir, sceneId, `meta_${metadataId}.json`);
      if (fs.existsSync(metaPath)) {
        try {
          return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        } catch {
          continue;
        }
      }
    }

    const metadataBytes = await this.getSceneArtifactBytes(sceneId, `meta_${metadataId}.json`);
    if (metadataBytes) {
      try { return JSON.parse(Buffer.from(metadataBytes).toString("utf-8")); } catch {}
    }
    return null;
  }

  /**
   * 8. GET /scenes/[sceneId]/indexes/[indexId] (Plan 25, B21)
   */
  public async getSceneIndex(sceneId: string, indexId: string): Promise<any | null> {
    if (!isValidCadV2StorageId(sceneId) || !isValidCadV2StorageId(indexId)) return null;
    if (this.repository) {
      const manifest = await this.getManifestAsync(sceneId);
      if (!manifest?.indexPages?.some((page: any) => page.indexId === indexId)) return null;
      const bytes = await this.getSceneArtifactBytes(sceneId, `index_${indexId}.json`, manifest);
      if (!bytes) return null;
      try { return JSON.parse(Buffer.from(bytes).toString("utf8")); } catch { return null; }
    }
    const scene = this.readyScenes.get(sceneId);
    if (scene) {
      const idxPage = scene.manifest.indexPages?.find((i: any) => i.indexId === indexId);
      if (idxPage) {
        const content = scene.indexFiles?.get(indexId);
        if (!content) return null;
        try { return JSON.parse(content); } catch { return null; }
      }
    }

    const candidateDirs = [
      this.storageDir,
      path.join(os.tmpdir(), "cad-v2-scenes"),
      path.resolve(process.cwd(), ".data/cad-v2-scenes"),
    ];

    for (const dir of candidateDirs) {
      const manifest = this.getManifest(sceneId);
      const generation =
        typeof manifest?.storageGeneration === "string" && isValidCadV2StorageId(manifest.storageGeneration)
          ? manifest.storageGeneration
          : null;
      const idxPath = generation
        ? path.join(dir, sceneId, "objects", generation, `index_${indexId}.json`)
        : path.join(dir, sceneId, `index_${indexId}.json`);
      if (fs.existsSync(idxPath)) {
        try {
          return JSON.parse(fs.readFileSync(idxPath, "utf-8"));
        } catch {
          continue;
        }
      }
    }
    const indexBytes = await this.getSceneArtifactBytes(sceneId, `index_${indexId}.json`);
    if (indexBytes) {
      try { return JSON.parse(Buffer.from(indexBytes).toString("utf-8")); } catch {}
    }
    return null;
  }
}
