// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — İSTEMCİ MUTATION SONUÇ SÖZLEŞMESİ
// ============================================================================

export type DokMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; retryable?: boolean };

function fallbackMessage(status: number): string {
  if (status === 401) return "Oturumunuz sona erdi. Lütfen yeniden giriş yapın.";
  if (status === 403) return "Bu işlem için yetkiniz yok.";
  if (status === 404) return "İşlem yapılacak öğe bulunamadı.";
  if (status === 409) return "Bu işlem mevcut durumla çakışıyor. Listeyi yenileyip tekrar deneyin.";
  if (status === 413) return "İstek veya dosya boyutu izin verilen sınırı aşıyor.";
  if (status === 429) return "Çok fazla istek gönderildi. Lütfen kısa süre sonra tekrar deneyin.";
  if (status >= 500) return "Sunucu işlemi tamamlayamadı. Lütfen tekrar deneyin.";
  return "İşlem tamamlanamadı.";
}

export async function requestDokMutation<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<DokMutationResult<T>> {
  try {
    const response = await fetch(input, init);
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;

    if (response.ok) {
      return { ok: true, data: body as T };
    }

    const message = typeof body?.error === "string" ? body.error : fallbackMessage(response.status);
    const code = typeof body?.code === "string" ? body.code : `HTTP_${response.status}`;
    return {
      ok: false,
      code,
      message,
      retryable: response.status === 429 || response.status >= 500,
    };
  } catch {
    return {
      ok: false,
      code: "NETWORK_ERROR",
      message: navigator.onLine
        ? "Ağ bağlantısı kurulamadı. Lütfen tekrar deneyin."
        : "Çevrimdışısınız. Bağlantınızı kontrol edip tekrar deneyin.",
      retryable: true,
    };
  }
}
