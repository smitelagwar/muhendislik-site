import fs from "fs/promises";
import path from "path";
import { get } from "@vercel/blob";
import { ensureDatabaseTables, getDb } from "../db";
import { getLocalStorageDir, readLocalDb } from "../local-store";
import {
  assertDurableDokumantasyonRuntime,
  getBlobCommandOptions,
  hasDatabaseUrl,
  isExplicitLocalDokMode,
} from "../runtime-mode";
import type { DokDwgDxfDerivative, DokFile } from "../types";
import { DWG_DXF_CONVERTER_SIGNATURE } from "./signature";
import {
  getDwgDxfConverterSignatureHash,
  getDwgDxfSourceVersionKey,
} from "./derivative-cache";

export async function findReadyDwgDxfDerivativeForFile(
  file: DokFile,
  converterSignature: string = DWG_DXF_CONVERTER_SIGNATURE
): Promise<DokDwgDxfDerivative | null> {
  const sourceVersionKey = getDwgDxfSourceVersionKey(file);
  const signatureHash = getDwgDxfConverterSignatureHash(converterSignature);

  if (!hasDatabaseUrl()) {
    if (!isExplicitLocalDokMode()) assertDurableDokumantasyonRuntime(true);
    const derivative = readLocalDb().dwg_dxf_derivatives?.find(
      (item) =>
        item.file_id === file.id &&
        item.source_version_key === sourceVersionKey &&
        item.converter_signature_sha256 === signatureHash &&
        item.status === "ready" &&
        (item.validation_decision === "PASS" || item.validation_decision === "WARN") &&
        Boolean(item.dxf_blob_pathname)
    );
    return derivative ? { ...derivative } : null;
  }

  assertDurableDokumantasyonRuntime(true);
  const sql = getDb();
  await ensureDatabaseTables(sql);
  const rows = await sql`
    SELECT * FROM dok_dwg_dxf_derivatives
    WHERE file_id = ${file.id}
      AND source_version_key = ${sourceVersionKey}
      AND converter_signature_sha256 = ${signatureHash}
      AND status = 'ready'
      AND validation_decision IN ('PASS', 'WARN')
      AND dxf_blob_pathname IS NOT NULL
    ORDER BY completed_at DESC NULLS LAST, updated_at DESC
    LIMIT 1;
  `;
  return (rows[0] as DokDwgDxfDerivative | undefined) || null;
}

export async function readReadyDwgDxfDerivativeBytes(
  derivative: DokDwgDxfDerivative
): Promise<Uint8Array> {
  if (
    derivative.status !== "ready" ||
    (derivative.validation_decision !== "PASS" && derivative.validation_decision !== "WARN") ||
    !derivative.dxf_blob_pathname
  ) {
    throw new Error("DWG_DXF_DERIVATIVE_NOT_READY");
  }

  if (!hasDatabaseUrl()) {
    if (!isExplicitLocalDokMode()) assertDurableDokumantasyonRuntime(true);
    const diskPath = path.join(
      getLocalStorageDir(),
      ...derivative.dxf_blob_pathname.split("/")
    );
    return new Uint8Array(await fs.readFile(diskPath));
  }

  assertDurableDokumantasyonRuntime(true);
  const blob = await get(derivative.dxf_blob_pathname, {
    access: "private",
    ...getBlobCommandOptions(),
  });
  if (!blob?.stream) throw new Error("DWG_DXF_DERIVATIVE_BLOB_MISSING");
  return new Uint8Array(await new Response(blob.stream).arrayBuffer());
}
