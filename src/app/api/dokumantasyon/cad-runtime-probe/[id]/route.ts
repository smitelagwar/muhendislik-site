import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { decodeDxfBytes, detectDxfEncoding } from "@/lib/dokumantasyon/dxf-encoding";
import { auditDxfText } from "@/lib/dokumantasyon/dxf-fidelity-audit";
import { normalizeDxfLayersForInteractiveControl } from "@/lib/dokumantasyon/dxf-layer-runtime";
import { auditDxfReleaseHardening } from "@/lib/dokumantasyon/dxf-release-hardening";
import { auditDxfStage3, normalizeDxfTextForStage3Rendering } from "@/lib/dokumantasyon/dxf-stage3-fidelity";
import { auditDxfStage4, normalizeDxfForStage4Rendering } from "@/lib/dokumantasyon/dxf-stage4-fidelity";
import { auditDxfTextRenderSource } from "@/lib/dokumantasyon/dxf-text-render-audit";
import { getFile } from "@/lib/dokumantasyon/files";
import { getBlobCommandOptions } from "@/lib/dokumantasyon/runtime-mode";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PROBE_BYTES = 32 * 1024 * 1024;

interface RouteParams {
  params: Promise<{ id: string }>;
}

function elapsed(started: number): number {
  return Math.round((performance.now() - started) * 10) / 10;
}

function timed<T>(fn: () => T): { value: T; ms: number } {
  const started = performance.now();
  const value = fn();
  return { value, ms: elapsed(started) };
}

export async function GET(_request: Request, { params }: RouteParams) {
  // Ephemeral diagnostic route: never reachable from production deployments.
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { id } = await params;
  const file = await getFile(id);
  if (!file || file.deleted_at) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const extension = file.extension.trim().toLowerCase();
  const sizeBytes = Number(file.size_bytes);
  const result: Record<string, unknown> = { id, extension, sizeBytes };

  const blobStarted = performance.now();
  const blob = await get(file.blob_pathname, {
    access: "private",
    ...getBlobCommandOptions(),
  });
  result.blobOpenMs = elapsed(blobStarted);
  result.blobStatus = blob?.statusCode ?? null;
  result.hasStream = Boolean(blob?.stream);

  if (!blob?.stream || extension !== ".dxf" || !Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_PROBE_BYTES) {
    result.deepProbe = false;
    result.deepProbeReason = extension !== ".dxf" ? "NOT_DXF" : sizeBytes > MAX_PROBE_BYTES ? "SIZE_CAP" : "NO_STREAM";
    return NextResponse.json(result);
  }

  const readStarted = performance.now();
  const arrayBuffer = await new Response(blob.stream).arrayBuffer();
  result.blobReadMs = elapsed(readStarted);
  result.actualBytes = arrayBuffer.byteLength;

  const bytes = new Uint8Array(arrayBuffer);
  const encodingTimed = timed(() => detectDxfEncoding(bytes));
  const encoding = encodingTimed.value;
  result.encodingMs = encodingTimed.ms;
  result.encoding = encoding.encoding;
  result.binary = encoding.isBinary;
  if (encoding.isBinary) return NextResponse.json(result);

  const decodeTimed = timed(() => decodeDxfBytes(bytes, encoding.encoding));
  const source = decodeTimed.value;
  result.decodeMs = decodeTimed.ms;

  const audit2 = timed(() => auditDxfText(source));
  result.auditStage2Ms = audit2.ms;
  result.entities = audit2.value.entityCount;

  const audit3 = timed(() => auditDxfStage3(source));
  result.auditStage3Ms = audit3.ms;

  const audit4 = timed(() => auditDxfStage4(source));
  result.auditStage4Ms = audit4.ms;

  const release = timed(() => auditDxfReleaseHardening(source));
  result.releaseAuditMs = release.ms;

  const textAudit = timed(() => auditDxfTextRenderSource(source));
  result.textAuditMs = textAudit.ms;

  const normalize3 = timed(() => normalizeDxfTextForStage3Rendering(source));
  result.normalizeStage3Ms = normalize3.ms;

  const normalize4 = timed(() => normalizeDxfForStage4Rendering(normalize3.value.text));
  result.normalizeStage4Ms = normalize4.ms;

  const normalizeLayers = timed(() => normalizeDxfLayersForInteractiveControl(normalize4.value.text));
  result.normalizeLayersMs = normalizeLayers.ms;
  result.normalizedChars = normalizeLayers.value.text.length;
  result.deepProbe = true;

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
