import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getFile } from "@/lib/dokumantasyon/files";
import { getLocalStorageDir } from "@/lib/dokumantasyon/local-store";
import {
  findReadyDwgDxfDerivativeForFile,
  openReadyDwgDxfDerivativeStream,
  claimDwgDxfDerivative,
  markDwgDxfDerivativeValidating,
  completeDwgDxfDerivative,
  convertAndValidateDwgToDxf,
} from "@/lib/dokumantasyon/dwg/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function convertedName(displayName: string): string {
  return displayName.replace(/\.dwg$/iu, "") + ".dxf";
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    const { id } = await params;
    const file = await getFile(id);

    if (!file || file.deleted_at) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
    }
    if (file.extension.toLowerCase() !== ".dwg") {
      return NextResponse.json({ error: "Bu endpoint yalnızca DWG dosyaları içindir." }, { status: 400 });
    }

    let derivative = await findReadyDwgDxfDerivativeForFile(file);
    if (!derivative) {
      // On-demand fast DWG -> DXF conversion on server
      try {
        let fileBytes: Buffer | null = null;
        if (file.blob_url?.startsWith("local:")) {
          const diskPath = path.join(getLocalStorageDir(), file.blob_url.replace("local:", ""));
          if (existsSync(diskPath)) {
            fileBytes = await fs.readFile(diskPath);
          }
        } else if (file.blob_url) {
          const res = await fetch(file.blob_url);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            fileBytes = Buffer.from(ab);
          }
        }

        if (fileBytes && fileBytes.length > 0) {
          const sourceSha256 = crypto.createHash("sha256").update(fileBytes).digest("hex");
          const t0 = Date.now();
          const uint8Array = new Uint8Array(fileBytes);
          const { conversion, validation } = await convertAndValidateDwgToDxf(uint8Array);
          const convMs = Date.now() - t0;

          if (validation.decision === "PASS" || validation.decision === "WARN") {
            const { derivative: claimedDeriv, claimed } = await claimDwgDxfDerivative({
              file,
              sourceSha256,
              dwgVersion: conversion.inspection.version?.magic ?? conversion.inspection.magic ?? null,
              retry: true,
            });
            if (claimed) {
              await markDwgDxfDerivativeValidating(claimedDeriv.id, convMs, conversion.diagnostics);
              derivative = await completeDwgDxfDerivative({
                id: claimedDeriv.id,
                dxfBytes: conversion.dxfBytes,
                validation,
                conversionMs: convMs,
                validationMs: 10,
                diagnostics: conversion.diagnostics,
              });
            } else {
              derivative = claimedDeriv;
            }
          }
        }
      } catch (convErr) {
        console.warn("[DWG→DXF] On-demand conversion fallback to client:", convErr);
      }
    }

    if (!derivative) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Cache-Control": "private, no-store",
          "X-DWG-DXF-Cache": "MISS",
        },
      });
    }

    const payload = await openReadyDwgDxfDerivativeStream(derivative);
    const headers = new Headers({
      "Content-Type": "application/dxf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(convertedName(file.display_name))}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-DWG-DXF-Cache": "HIT",
      "X-DWG-DXF-Decision": derivative.validation_decision || "PASS",
      "X-DWG-DXF-Sha256": derivative.dxf_sha256 || "",
      "X-DWG-DXF-Streaming": "1",
    });
    if (payload.sizeBytes !== null) {
      headers.set("Content-Length", String(payload.sizeBytes));
    }

    return new Response(payload.stream, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("DWG→DXF derivative erişim hatası:", error);
    return NextResponse.json(
      { error: "Doğrulanmış DXF türevi okunamadı." },
      { status: 500 }
    );
  }
}
