import { getShareByViewToken } from "@/lib/belge-paylasim/service-core";
import { isValidShareToken } from "@/lib/belge-paylasim/tokens";
import { createRequestCorrelationId, logShareRequestFailure } from "@/lib/belge-paylasim/http";
import { BelgeShareViewer } from "@/components/belge-paylasim/belge-share-viewer";
import { ShareAccessState } from "@/components/belge-paylasim/share-access-state";

export const dynamic = "force-dynamic";

const DOCUMENT_TITLES: Record<string, string> = {
  "beton-dokum-tutanagi": "Beton Döküm Tutanağı",
  "santiye-sefi-taahhutnamesi": "Şantiye Şefi İşe Başlama Taahhütnamesi",
  "santiye-sefi-istifa-dilekcesi": "Şantiye Şefliği İstifa Dilekçesi",
  "insaat-ruhsati-dilekcesi": "İnşaat Ruhsatı Başvuru Dilekçesi",
  "santiye-sefi-sozlesmesi": "Şantiye Şefliği Hizmet Sözleşmesi",
};

async function readShareState(token: string) {
  const startedAt = performance.now();
  try {
    return await getShareByViewToken(token);
  } catch {
    logShareRequestFailure(createRequestCorrelationId(), "service", startedAt);
    return null;
  }
}

export default async function BelgeViewerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidShareToken(token)) return <ShareAccessState state="invalid" />;

  const result = await readShareState(token);
  if (!result) return <ShareAccessState state="unavailable" />;
  if (result.status !== "ok") return <ShareAccessState state={result.status} />;

  return <BelgeShareViewer
    viewToken={token}
    documentTitle={DOCUMENT_TITLES[result.record.documentId] || "Paylaşılan PDF Belgesi"}
    initialExpiresAt={result.record.expiresAt.toISOString()}
  />;
}
