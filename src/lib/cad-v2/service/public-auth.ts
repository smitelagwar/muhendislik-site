// ============================================================================
// DWG/DXF MOTOR V2 — PUBLIC SHARE ACCESS AUTHENTICATION HELPER (G14)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md (Satır 41–59),
// 19_GEMINI_ADIM_ADIM_UYGULAMA.md (G14)
// Mevcut public token yetkisine bağlı V2 manifest/chunk/job erişim sınırlandırması.

import { getPublicShareInfo, verifyShareAccessJwt } from "../../dokumantasyon/public-share";
import { cookies } from "next/headers";

export interface PublicShareAuthResult {
  ok: boolean;
  error?: string;
  statusCode?: number;
  linkId?: string;
  fileIds?: string[];
}

export async function verifyPublicShareAccess(
  token: string,
  targetFileId?: string
): Promise<PublicShareAuthResult> {
  if (!token) {
    return { ok: false, error: "Paylaşım token'ı eksik.", statusCode: 401 };
  }

  const shareInfo = await getPublicShareInfo(token);
  if (shareInfo.status !== "ok" || !shareInfo.link || !shareInfo.items) {
    const statusCode = shareInfo.status === "revoked" || shareInfo.status === "expired" ? 410 : 403;
    return {
      ok: false,
      error: shareInfo.errorMessage || "Paylaşım bağlantısı geçersiz veya süresi dolmuş.",
      statusCode,
    };
  }

  const link = shareInfo.link;

  // Şifre Koruması Kontrolü
  if (link.password_hash) {
    try {
      const cookieStore = await cookies();
      const cookieJwt = cookieStore.get(`dok_share_${link.id}`)?.value;
      const isAuthorized = await verifyShareAccessJwt(cookieJwt, link.id);
      if (!isAuthorized) {
        return { ok: false, error: "Bu paylaşım için şifre doğrulaması gereklidir.", statusCode: 401 };
      }
    } catch {
      // Çerez veya header okuma hatası durumunda
      return { ok: false, error: "Yetki doğrulaması başarısız.", statusCode: 401 };
    }
  }

  const validFileIds = shareInfo.items.map((i) => i.file_id || i.id);

  if (targetFileId && !validFileIds.includes(targetFileId)) {
    return { ok: false, error: "Bu dosya bu paylaşıma dahil değil.", statusCode: 403 };
  }

  return { ok: true, linkId: link.id, fileIds: validFileIds };
}
