// ============================================================================
// /dokumantasyon/dosya/[fileId] — DÖKÜMANTASYON DOSYA ÖNİZLEME SAYFASI
// ============================================================================

import { notFound } from "next/navigation";
import { getAdminFileAccess } from "@/lib/dokumantasyon/file-access";
import { getDokumantasyonSession } from "@/lib/dokumantasyon/auth";
import { DokumantasyonLoginForm } from "@/components/dokumantasyon/login-form";
import { DokumantasyonAdminShell } from "@/components/dokumantasyon/admin-shell";
import { FilePreviewShell } from "@/components/dokumantasyon/preview/file-preview-shell";

export const dynamic = "force-dynamic";

interface FilePageProps {
  params: Promise<{ fileId: string }>;
}

export default async function DokumantasyonFilePage({ params }: FilePageProps) {
  const session = await getDokumantasyonSession();
  if (!session) {
    return <DokumantasyonLoginForm />;
  }

  const { fileId } = await params;

  if (!fileId) {
    notFound();
  }

  try {
    const accessData = await getAdminFileAccess(fileId);

    return (
      <DokumantasyonAdminShell username={session.username}>
        <div className="mx-auto w-full py-2">
          <FilePreviewShell
            file={accessData.file}
            accessUrl={accessData.accessUrl}
            previewKind={accessData.previewKind}
            expiresAt={accessData.expiresAt}
            isLocal={accessData.isLocal}
          />
        </div>
      </DokumantasyonAdminShell>
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      notFound();
    }
    console.error("Önizleme sayfası yükleme hatası:", err);
    notFound();
  }
}
