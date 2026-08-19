// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOCUMENT ACCESS LEASE SÖZLEŞMESİ
// ============================================================================

export interface DocumentAccessLease {
  url: string;
  expiresAt: string; // ISO 8601 string
  versionId?: string;
  isLocal: boolean;
  fileId: string;
}

/**
 * Bir erişim kiralama süresinin dolup dolmadığını veya dolmak üzere olduğunu kontrol eder
 * @param lease Erişim kiralama nesnesi
 * @param bufferSeconds Kalan süre güvenlik tamponu (varsayılan: 60 saniye)
 */
export function isAccessLeaseExpiring(
  lease: DocumentAccessLease | null | undefined,
  bufferSeconds: number = 60
): boolean {
  if (!lease || !lease.expiresAt) return true;
  const expiryTime = new Date(lease.expiresAt).getTime();
  const now = Date.now();
  return expiryTime - now <= bufferSeconds * 1000;
}

/**
 * İstemci tarafından yeni / taze bir Signed URL erişim kiralaması alır
 */
export async function refreshDocumentAccessLease(fileId: string): Promise<DocumentAccessLease> {
  const res = await fetch(`/api/dokumantasyon/files/${fileId}/access`, {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erişim yenileme başarısız (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    url: data.accessUrl,
    expiresAt: data.expiresAt,
    isLocal: Boolean(data.isLocal),
    fileId,
  };
}
