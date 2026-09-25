// ============================================================================
// DWG/DXF MOTOR V2 — TEKİL SAHNE KİMLİĞİ VE PARMAK İZİ ÜRETİCİSİ (P03)
// ============================================================================
// Sözleşme: Fidelity v3 Planı P03, motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md

import * as crypto from "node:crypto";
import {
  CAD_V2_SCHEMA_VERSION,
  CAD_V2_COMPILER_REVISION,
  CAD_V2_RENDER_ABI,
  CAD_V2_QUALITY_PROFILE,
  CAD_V2_FONT_DIGEST,
  CAD_V2_DECODER_VERSIONS,
} from "../version";

export interface SceneIdentityParams {
  fileId: string;
  sourceSha256: string;
  authoritativeRevision: string;
  tenantScope?: string;
  decoderVersions?: Record<string, string>;
  compilerRevision?: string;
  schemaVersion?: number;
  renderAbi?: string;
  qualityProfile?: string;
  fontDigest?: string;
}

export interface SceneIdentityResult {
  sceneId: string;
  exactCacheKey: string;
  canonicalFingerprint: string;
}

/**
 * Kesin kaynak revizyonunun geçerliliğini doğrular.
 * Gevşek :latest, wildcard veya boşluk içeren değerleri reddeder.
 */
export function validateAuthoritativeRevision(revision: string): void {
  if (!revision || typeof revision !== "string") {
    throw new Error("Authoritative revision string zorunludur.");
  }
  const trimmed = revision.trim();
  if (!trimmed) {
    throw new Error("Authoritative revision boş olamaz.");
  }
  if (trimmed.toLowerCase() === "latest" || trimmed.toLowerCase().endsWith(":latest")) {
    throw new Error("Gevşek revision ':latest' kesin sahne kimliği için geçersizdir.");
  }
}

/**
 * Hem CLI derleyicisi hem de Durable Service tarafından kullanılan tekil ve deterministik sahne kimliği üreticisi.
 */
export function computeSceneIdentity(params: SceneIdentityParams): SceneIdentityResult {
  if (!params.fileId || typeof params.fileId !== "string" || !params.fileId.trim()) {
    throw new Error("fileId zorunludur ve boş olamaz.");
  }
  if (!params.sourceSha256 || typeof params.sourceSha256 !== "string" || !params.sourceSha256.trim()) {
    throw new Error("sourceSha256 zorunludur ve boş olamaz.");
  }
  validateAuthoritativeRevision(params.authoritativeRevision);

  const tenant = (params.tenantScope || "global").trim();
  const fileId = params.fileId.trim();
  const revision = params.authoritativeRevision.trim();
  const sha = params.sourceSha256.trim().toLowerCase();
  const compilerRev = params.compilerRevision || CAD_V2_COMPILER_REVISION;
  const schemaVer = params.schemaVersion ?? CAD_V2_SCHEMA_VERSION;
  const renderAbi = params.renderAbi || CAD_V2_RENDER_ABI;
  const quality = params.qualityProfile || CAD_V2_QUALITY_PROFILE;
  const fontDigest = params.fontDigest || CAD_V2_FONT_DIGEST;
  const decoders = params.decoderVersions || CAD_V2_DECODER_VERSIONS;

  const sortedDecoderEntries = Object.keys(decoders)
    .sort()
    .map((k) => `${k}=${decoders[k]}`)
    .join(";");

  const canonicalFingerprint = [
    `tenant=${tenant}`,
    `fileId=${fileId}`,
    `revision=${revision}`,
    `sha256=${sha}`,
    `compiler=${compilerRev}`,
    `schema=${schemaVer}`,
    `renderAbi=${renderAbi}`,
    `quality=${quality}`,
    `fontDigest=${fontDigest}`,
    `decoders=${sortedDecoderEntries}`,
  ].join("|");

  const hash = crypto.createHash("sha256").update(canonicalFingerprint, "utf-8").digest("hex");
  const sceneId = `scene_${hash.slice(0, 24)}`;
  const exactCacheKey = `${tenant}:${fileId}:${revision}:${sha.slice(0, 16)}`;

  return {
    sceneId,
    exactCacheKey,
    canonicalFingerprint,
  };
}
