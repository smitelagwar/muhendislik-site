import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { ensureDatabaseTables, getDb } from "../db";
import { getLocalStorageDir, readLocalDb, writeLocalDb } from "../local-store";
import {
  assertDurableDokumantasyonRuntime,
  getBlobCommandOptions,
  hasDatabaseUrl,
  isExplicitLocalDokMode,
} from "../runtime-mode";
import type { DokDwgDxfDerivative, DokFile } from "../types";
import { DWG_DXF_CONVERTER_SIGNATURE } from "./signature";
import type { DwgDiagnostic, DwgFidelityValidation } from "./types";

const DERIVATIVE_LOCK_MS = 15 * 60_000;

export interface ClaimDwgDxfDerivativeInput {
  file: DokFile;
  sourceSha256: string;
  dwgVersion: string | null;
  converterSignature?: string;
  retry?: boolean;
}

export interface CompleteDwgDxfDerivativeInput {
  id: string;
  dxfBytes: Uint8Array;
  validation: DwgFidelityValidation;
  conversionMs: number;
  validationMs: number;
  diagnostics: DwgDiagnostic[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function getDwgDxfSourceVersionKey(file: DokFile): string {
  return `${file.blob_pathname}:${file.current_version_number || 1}:${String(file.size_bytes)}`;
}

export function getDwgDxfConverterSignatureHash(signature: string = DWG_DXF_CONVERTER_SIGNATURE): string {
  return sha256(signature);
}

function derivativeBlobPath(sourceSha256: string, signatureSha256: string): string {
  return `dok_derivatives/dwg-dxf/${sourceSha256}/${signatureSha256}.dxf`;
}

async function getDerivativeById(id: string): Promise<DokDwgDxfDerivative | null> {
  if (!hasDatabaseUrl()) {
    const item = readLocalDb().dwg_dxf_derivatives?.find((derivative) => derivative.id === id);
    return item ? { ...item } : null;
  }
  const sql = getDb();
  await ensureDatabaseTables(sql);
  const rows = await sql`SELECT * FROM dok_dwg_dxf_derivatives WHERE id = ${id} LIMIT 1;`;
  return (rows[0] as DokDwgDxfDerivative | undefined) || null;
}

export async function findReadyDwgDxfDerivativeByHash(
  sourceSha256: string,
  converterSignature: string = DWG_DXF_CONVERTER_SIGNATURE
): Promise<DokDwgDxfDerivative | null> {
  const signatureHash = getDwgDxfConverterSignatureHash(converterSignature);
  if (!hasDatabaseUrl()) {
    const item = readLocalDb().dwg_dxf_derivatives?.find(
      (derivative) =>
        derivative.source_sha256 === sourceSha256 &&
        derivative.converter_signature_sha256 === signatureHash &&
        derivative.status === "ready" &&
        (derivative.validation_decision === "PASS" || derivative.validation_decision === "WARN") &&
        derivative.dxf_blob_pathname
    );
    return item ? { ...item } : null;
  }

  const sql = getDb();
  await ensureDatabaseTables(sql);
  const rows = await sql`
    SELECT * FROM dok_dwg_dxf_derivatives
    WHERE source_sha256 = ${sourceSha256}
      AND converter_signature_sha256 = ${signatureHash}
      AND status = 'ready'
      AND validation_decision IN ('PASS', 'WARN')
      AND dxf_blob_pathname IS NOT NULL
    ORDER BY completed_at DESC NULLS LAST, updated_at DESC
    LIMIT 1;
  `;
  return (rows[0] as DokDwgDxfDerivative | undefined) || null;
}

export async function claimDwgDxfDerivative(
  input: ClaimDwgDxfDerivativeInput
): Promise<{ derivative: DokDwgDxfDerivative; claimed: boolean }> {
  const converterSignature = input.converterSignature ?? DWG_DXF_CONVERTER_SIGNATURE;
  const signatureHash = getDwgDxfConverterSignatureHash(converterSignature);
  const sourceVersionKey = getDwgDxfSourceVersionKey(input.file);
  const retry = input.retry === true;
  const now = nowIso();

  if (!hasDatabaseUrl()) {
    if (!isExplicitLocalDokMode()) assertDurableDokumantasyonRuntime(true);
    const db = readLocalDb();
    db.dwg_dxf_derivatives ??= [];
    let derivative = db.dwg_dxf_derivatives.find(
      (item) =>
        item.file_id === input.file.id &&
        item.source_version_key === sourceVersionKey &&
        item.converter_signature_sha256 === signatureHash
    );

    if (!derivative) {
      derivative = {
        id: crypto.randomUUID(),
        file_id: input.file.id,
        source_version_key: sourceVersionKey,
        source_sha256: input.sourceSha256,
        converter_signature: converterSignature,
        converter_signature_sha256: signatureHash,
        dwg_version: input.dwgVersion,
        status: "pending",
        validation_decision: null,
        dxf_blob_pathname: null,
        dxf_blob_url: null,
        dxf_sha256: null,
        dxf_size_bytes: null,
        conversion_ms: null,
        validation_ms: null,
        diagnostics_json: [],
        validation_json: null,
        error_code: null,
        error_message: null,
        lock_expires_at: null,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
      };
      db.dwg_dxf_derivatives.push(derivative);
    }

    const stale =
      (derivative.status === "converting" || derivative.status === "validating") &&
      (!derivative.lock_expires_at || Date.parse(derivative.lock_expires_at) <= Date.now());
    const canClaim = derivative.status === "pending" || stale || (retry && derivative.status === "failed");
    if (canClaim) {
      Object.assign(derivative, {
        source_sha256: input.sourceSha256,
        converter_signature: converterSignature,
        converter_signature_sha256: signatureHash,
        dwg_version: input.dwgVersion,
        status: "converting" as const,
        validation_decision: null,
        error_code: null,
        error_message: null,
        started_at: now,
        completed_at: null,
        lock_expires_at: new Date(Date.now() + DERIVATIVE_LOCK_MS).toISOString(),
        updated_at: now,
      });
    }
    writeLocalDb(db);
    return { derivative: { ...derivative }, claimed: canClaim };
  }

  assertDurableDokumantasyonRuntime(true);
  const sql = getDb();
  await ensureDatabaseTables(sql);
  await sql`
    INSERT INTO dok_dwg_dxf_derivatives (
      id, file_id, source_version_key, source_sha256,
      converter_signature, converter_signature_sha256, dwg_version, status
    ) VALUES (
      ${crypto.randomUUID()}, ${input.file.id}, ${sourceVersionKey}, ${input.sourceSha256},
      ${converterSignature}, ${signatureHash}, ${input.dwgVersion}, 'pending'
    )
    ON CONFLICT (file_id, source_version_key, converter_signature_sha256) DO NOTHING;
  `;

  const claimedRows = await sql`
    UPDATE dok_dwg_dxf_derivatives
    SET source_sha256 = ${input.sourceSha256},
        converter_signature = ${converterSignature},
        dwg_version = ${input.dwgVersion},
        status = 'converting', validation_decision = NULL,
        error_code = NULL, error_message = NULL,
        started_at = NOW(), completed_at = NULL,
        lock_expires_at = NOW() + INTERVAL '15 minutes', updated_at = NOW()
    WHERE file_id = ${input.file.id}
      AND source_version_key = ${sourceVersionKey}
      AND converter_signature_sha256 = ${signatureHash}
      AND (
        status = 'pending'
        OR (status IN ('converting', 'validating') AND (lock_expires_at IS NULL OR lock_expires_at <= NOW()))
        OR (${retry} = TRUE AND status = 'failed')
      )
    RETURNING *;
  `;
  if (claimedRows[0]) return { derivative: claimedRows[0] as DokDwgDxfDerivative, claimed: true };

  const rows = await sql`
    SELECT * FROM dok_dwg_dxf_derivatives
    WHERE file_id = ${input.file.id}
      AND source_version_key = ${sourceVersionKey}
      AND converter_signature_sha256 = ${signatureHash}
    LIMIT 1;
  `;
  if (!rows[0]) throw new Error("DWG_DXF_DERIVATIVE_NOT_FOUND");
  return { derivative: rows[0] as DokDwgDxfDerivative, claimed: false };
}

export async function markDwgDxfDerivativeValidating(
  id: string,
  conversionMs: number,
  diagnostics: DwgDiagnostic[]
): Promise<DokDwgDxfDerivative> {
  const diagnosticsJson = JSON.stringify(diagnostics);
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const derivative = db.dwg_dxf_derivatives?.find((item) => item.id === id);
    if (!derivative) throw new Error("DWG_DXF_DERIVATIVE_NOT_FOUND");
    derivative.status = "validating";
    derivative.conversion_ms = Math.max(0, Math.round(conversionMs));
    derivative.diagnostics_json = diagnostics;
    derivative.lock_expires_at = new Date(Date.now() + DERIVATIVE_LOCK_MS).toISOString();
    derivative.updated_at = nowIso();
    writeLocalDb(db);
    return { ...derivative };
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_dwg_dxf_derivatives
    SET status = 'validating', conversion_ms = ${Math.max(0, Math.round(conversionMs))},
        diagnostics_json = CAST(${diagnosticsJson} AS jsonb),
        lock_expires_at = NOW() + INTERVAL '15 minutes', updated_at = NOW()
    WHERE id = ${id} AND status = 'converting'
    RETURNING *;
  `;
  if (!rows[0]) throw new Error("DWG_DXF_DERIVATIVE_STATE_CONFLICT");
  return rows[0] as DokDwgDxfDerivative;
}

async function persistDxf(
  derivative: DokDwgDxfDerivative,
  dxfBytes: Uint8Array
): Promise<{ pathname: string; url: string; dxfSha256: string }> {
  const pathname = derivativeBlobPath(
    derivative.source_sha256,
    derivative.converter_signature_sha256
  );
  const dxfSha256 = sha256(dxfBytes);

  if (!hasDatabaseUrl()) {
    const storageDir = getLocalStorageDir();
    const localPath = path.join(storageDir, ...pathname.split("/"));
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, dxfBytes);
    return { pathname, url: `local:${pathname}`, dxfSha256 };
  }

  assertDurableDokumantasyonRuntime(true);
  const blob = await put(pathname, Buffer.from(dxfBytes), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/dxf",
    ...getBlobCommandOptions(),
  });
  return { pathname: blob.pathname, url: blob.url, dxfSha256 };
}

export async function failDwgDxfDerivative(
  id: string,
  errorCode: string,
  errorMessage: string,
  validation?: DwgFidelityValidation
): Promise<DokDwgDxfDerivative> {
  const validationJson = validation ? JSON.stringify(validation) : null;
  const validationDecision = validation?.decision ?? null;
  const safeMessage = errorMessage.replace(/\s+/g, " ").trim().slice(0, 1000);

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const derivative = db.dwg_dxf_derivatives?.find((item) => item.id === id);
    if (!derivative) throw new Error("DWG_DXF_DERIVATIVE_NOT_FOUND");
    derivative.status = "failed";
    derivative.validation_decision = validationDecision;
    derivative.validation_json = validation ?? null;
    derivative.error_code = errorCode.slice(0, 96);
    derivative.error_message = safeMessage;
    derivative.lock_expires_at = null;
    derivative.completed_at = nowIso();
    derivative.updated_at = nowIso();
    writeLocalDb(db);
    return { ...derivative };
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_dwg_dxf_derivatives
    SET status = 'failed', validation_decision = ${validationDecision},
        validation_json = CASE WHEN ${validationJson}::text IS NULL THEN NULL ELSE CAST(${validationJson} AS jsonb) END,
        error_code = ${errorCode.slice(0, 96)}, error_message = ${safeMessage},
        lock_expires_at = NULL, completed_at = NOW(), updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  if (!rows[0]) throw new Error("DWG_DXF_DERIVATIVE_NOT_FOUND");
  return rows[0] as DokDwgDxfDerivative;
}

export async function completeDwgDxfDerivative(
  input: CompleteDwgDxfDerivativeInput
): Promise<DokDwgDxfDerivative> {
  if (input.validation.decision === "REJECT") {
    return failDwgDxfDerivative(
      input.id,
      "FIDELITY_REJECTED",
      input.validation.issues.map((issue) => issue.code).join(", ") || "Fidelity validation rejected the derivative.",
      input.validation
    );
  }

  const derivative = await getDerivativeById(input.id);
  if (!derivative) throw new Error("DWG_DXF_DERIVATIVE_NOT_FOUND");
  if (derivative.status !== "validating") throw new Error("DWG_DXF_DERIVATIVE_STATE_CONFLICT");

  const stored = await persistDxf(derivative, input.dxfBytes);
  const validationJson = JSON.stringify(input.validation);
  const diagnosticsJson = JSON.stringify(input.diagnostics);
  const validationMs = Math.max(0, Math.round(input.validationMs));
  const conversionMs = Math.max(0, Math.round(input.conversionMs));

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.dwg_dxf_derivatives?.find((candidate) => candidate.id === input.id);
    if (!item) throw new Error("DWG_DXF_DERIVATIVE_NOT_FOUND");
    Object.assign(item, {
      status: "ready" as const,
      validation_decision: input.validation.decision,
      dxf_blob_pathname: stored.pathname,
      dxf_blob_url: stored.url,
      dxf_sha256: stored.dxfSha256,
      dxf_size_bytes: input.dxfBytes.byteLength,
      conversion_ms: conversionMs,
      validation_ms: validationMs,
      diagnostics_json: input.diagnostics,
      validation_json: input.validation,
      error_code: null,
      error_message: null,
      lock_expires_at: null,
      completed_at: nowIso(),
      updated_at: nowIso(),
    });
    writeLocalDb(db);
    return { ...item };
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_dwg_dxf_derivatives
    SET status = 'ready', validation_decision = ${input.validation.decision},
        dxf_blob_pathname = ${stored.pathname}, dxf_blob_url = ${stored.url},
        dxf_sha256 = ${stored.dxfSha256}, dxf_size_bytes = ${input.dxfBytes.byteLength},
        conversion_ms = ${conversionMs}, validation_ms = ${validationMs},
        diagnostics_json = CAST(${diagnosticsJson} AS jsonb),
        validation_json = CAST(${validationJson} AS jsonb),
        error_code = NULL, error_message = NULL,
        lock_expires_at = NULL, completed_at = NOW(), updated_at = NOW()
    WHERE id = ${input.id} AND status = 'validating'
    RETURNING *;
  `;
  if (!rows[0]) throw new Error("DWG_DXF_DERIVATIVE_STATE_CONFLICT");
  return rows[0] as DokDwgDxfDerivative;
}