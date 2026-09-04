// ============================================================================
// /dokumantasyon/dosya/[fileId] — DÖKÜMANTASYON DOCUMENT STUDIO SAYFASI
// ============================================================================

import { notFound } from "next/navigation";
import { getAdminFileAccess } from "@/lib/dokumantasyon/file-access";
import { getFile, markFileOpened } from "@/lib/dokumantasyon/files";
import { findReadyDwgDxfDerivativeForFile } from "@/lib/dokumantasyon/dwg/server";
import { DocumentStudioShell } from "@/components/dokumantasyon/studio/document-studio-shell";
import type { DwgFastPreviewHint } from "@/components/dokumantasyon/preview/cad-runtime-orchestrator";

export const dynamic = "force-dynamic";

interface FilePageProps {
  params: Promise<{ fileId: string }>;
}

export default async function DokumantasyonFilePage({ params }: FilePageProps) {
  const { fileId } = await params;

  if (!fileId) {
    notFound();
  }

  let accessData: Awaited<ReturnType<typeof getAdminFileAccess>>;
  try {
    accessData = await getAdminFileAccess(fileId);
    // Bu yalnız gerçek preview route açılışında çalışır; viewer render/scroll'unda çağrılmaz.
    await markFileOpened(fileId).catch((error) => {
      console.warn("Son açılanlar güncellemesi tamamlanamadı:", error);
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      notFound();
    }
    console.error("Önizleme sayfası yükleme hatası:", err);
    notFound();
  }

  // Stage 6: Resolve DWG fast-cache derivative availability on the server to prevent
  // unnecessary client-side 204 MISS round-trips when derivative does not exist.
  let dwgFastPreviewHint: DwgFastPreviewHint | undefined = undefined;
  if (accessData.file.extension.toLowerCase() === ".dwg") {
    try {
      const dokFile = await getFile(fileId);
      if (dokFile && !dokFile.deleted_at) {
        const readyDerivative = await findReadyDwgDxfDerivativeForFile(dokFile);
        if (readyDerivative) {
          const parsedSize = readyDerivative.dxf_size_bytes != null ? Number(readyDerivative.dxf_size_bytes) : null;
          dwgFastPreviewHint = {
            ready: true,
            sizeBytes: Number.isFinite(parsedSize) ? parsedSize : null,
            decision: readyDerivative.validation_decision === "WARN" ? "WARN" : "PASS",
          };
        } else {
          dwgFastPreviewHint = { ready: false };
        }
      }
    } catch (err) {
      console.warn("[page] DWG fast-cache availability check failed on server:", err);
    }
  }

  return (
    <DocumentStudioShell
      file={accessData.file}
      accessUrl={accessData.accessUrl}
      previewKind={accessData.previewKind}
      expiresAt={accessData.expiresAt}
      isLocal={accessData.isLocal}
      dwgFastPreviewHint={dwgFastPreviewHint}
    />
  );
}
