// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AUTODESK PLATFORM SERVICES (APS) CAD SERVİSİ
// ============================================================================

export type CadProvider = "aps" | "mock" | "disabled";

export interface CadPreviewStatus {
  provider: CadProvider;
  isAvailable: boolean;
  status: "ready" | "translating" | "failed" | "not_started" | "unconfigured";
  urn?: string;
  viewerToken?: string;
  errorMessage?: string;
}

// Bellek içi token önbelleği (APS 2-legged Token Cache)
let internalTokenCache: { token: string; expiresAt: number } | null = null;
let viewerTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Aktif CAD önizleme sağlayıcısını döndürür
 */
export function getCadProvider(): CadProvider {
  const envProvider = process.env.DOK_CAD_PREVIEW_PROVIDER?.toLowerCase();
  if (envProvider === "aps") return "aps";
  if (envProvider === "disabled") return "disabled";
  return "mock"; // Varsayılan olarak güvenli mock/entegrasyona hazır mod
}

/**
 * APS kimlik bilgilerinin tam yapılandırılıp yapılandırılmadığını kontrol eder
 */
export function isApsConfigured(): boolean {
  return !!(
    process.env.APS_CLIENT_ID &&
    process.env.APS_CLIENT_SECRET
  );
}

/**
 * Autodesk OAuth v2 — Sunucu (Internal) 2-Legged Token Alır
 */
export async function getApsInternalToken(): Promise<string | null> {
  if (!isApsConfigured()) return null;

  const now = Date.now();
  if (internalTokenCache && internalTokenCache.expiresAt > now + 60 * 1000) {
    return internalTokenCache.token;
  }

  const clientId = process.env.APS_CLIENT_ID!;
  const clientSecret = process.env.APS_CLIENT_SECRET!;

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "data:read data:write bucket:create bucket:read",
    });

    const res = await fetch("https://developer.api.autodesk.com/authentication/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      console.warn("APS OAuth v2 internal token hatası:", await res.text());
      return null;
    }

    const data = await res.json();
    internalTokenCache = {
      token: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };

    return data.access_token;
  } catch (err) {
    console.error("APS token alma hatası:", err);
    return null;
  }
}

/**
 * Autodesk OAuth v2 — İstemci (Viewer Read-Only) Token Alır
 */
export async function getApsViewerToken(): Promise<string | null> {
  if (!isApsConfigured()) return null;

  const now = Date.now();
  if (viewerTokenCache && viewerTokenCache.expiresAt > now + 60 * 1000) {
    return viewerTokenCache.token;
  }

  const clientId = process.env.APS_CLIENT_ID!;
  const clientSecret = process.env.APS_CLIENT_SECRET!;

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "viewables:read",
    });

    const res = await fetch("https://developer.api.autodesk.com/authentication/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    viewerTokenCache = {
      token: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };

    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Bir DWG/DXF dosyasının CAD önizleme durumunu çözümler
 */
export async function resolveCadPreviewStatus(fileId: string, extension: string): Promise<CadPreviewStatus> {
  const provider = getCadProvider();

  if (provider === "disabled") {
    return {
      provider: "disabled",
      isAvailable: false,
      status: "unconfigured",
      errorMessage: "CAD önizleme servisi sistem yöneticisi tarafından devre dışı bırakılmıştır.",
    };
  }

  if (provider === "mock" || !isApsConfigured()) {
    return {
      provider: "mock",
      isAvailable: true,
      status: "ready",
      urn: Buffer.from(`urn:adsk.objects:os.object:dok_cad_bucket/${fileId}${extension}`).toString("base64url"),
      viewerToken: "mock_aps_client_token_for_cad_viewer",
    };
  }

  // Canlı APS Entegrasyonu
  const viewerToken = await getApsViewerToken();
  if (!viewerToken) {
    return {
      provider: "aps",
      isAvailable: false,
      status: "failed",
      errorMessage: "Autodesk Platform Services ile bağlantı kurulamadı.",
    };
  }

  const urn = Buffer.from(`urn:adsk.objects:os.object:dok_cad_bucket/${fileId}${extension}`).toString("base64url");

  return {
    provider: "aps",
    isAvailable: true,
    status: "ready",
    urn,
    viewerToken,
  };
}
