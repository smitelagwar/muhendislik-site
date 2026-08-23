// ============================================================================
// /dokumantasyon/dosya/[fileId] — DÖKÜMANTASYON DOCUMENT STUDIO SAYFASI
// ============================================================================

import { notFound } from "next/navigation";
import { getAdminFileAccess } from "@/lib/dokumantasyon/file-access";
import { markFileOpened } from "@/lib/dokumantasyon/files";
import { DocumentStudioShell } from "@/components/dokumantasyon/studio/document-studio-shell";

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

  return (
    <DocumentStudioShell
      file={accessData.file}
      accessUrl={accessData.accessUrl}
      previewKind={accessData.previewKind}
      expiresAt={accessData.expiresAt}
      isLocal={accessData.isLocal}
    />
  );
}
