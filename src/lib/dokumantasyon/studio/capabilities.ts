// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOCUMENT STUDIO CAPABILITY REGISTRY
// ============================================================================

import { PreviewKind } from "../preview-capabilities";

export interface DocumentStudioCapability {
  viewer: boolean;
  textSelection: boolean;
  search: boolean;
  annotate: boolean;
  measure: boolean;
  trueContentEdit: boolean;
  pageEdit: boolean;
  versionedSave: boolean;
  publicPreview: boolean;
  downloadOriginal: boolean;
  requiresExternalProvider?: "apryse" | "aps";
}

/**
 * Dosya türüne ve ortam değişkenlerine göre stüdyo yeteneklerini belirler
 */
export function getStudioCapabilities(
  extension: string,
  previewKind: PreviewKind
): DocumentStudioCapability {
  const ext = extension.toLowerCase().replace(".", "");

  if (previewKind === "pdf" || ext === "pdf") {
    const hasApryseLicense = Boolean(process.env.APRYSE_LICENSE_KEY);
    const isTrueEditEnabled = process.env.DOK_PDF_TRUE_EDIT_ENABLED === "true" && hasApryseLicense;

    return {
      viewer: true,
      textSelection: true,
      search: true,
      annotate: hasApryseLicense,
      measure: hasApryseLicense,
      trueContentEdit: isTrueEditEnabled,
      pageEdit: hasApryseLicense,
      versionedSave: true,
      publicPreview: true,
      downloadOriginal: true,
      requiresExternalProvider: "apryse",
    };
  }

  if (previewKind === "cad" || ext === "dwg" || ext === "dxf") {
    const isApsConfigured = Boolean(process.env.APS_CLIENT_ID && process.env.APS_CLIENT_SECRET);
    const allowMock = process.env.DOK_ALLOW_CAD_MOCK === "true" && process.env.NODE_ENV !== "production";

    return {
      viewer: isApsConfigured || allowMock,
      textSelection: false,
      search: false,
      annotate: false,
      measure: isApsConfigured,
      trueContentEdit: false,
      pageEdit: false,
      versionedSave: false,
      publicPreview: true,
      downloadOriginal: true,
      requiresExternalProvider: "aps",
    };
  }

  if (previewKind === "image") {
    return {
      viewer: true,
      textSelection: false,
      search: false,
      annotate: false,
      measure: false,
      trueContentEdit: false,
      pageEdit: false,
      versionedSave: false,
      publicPreview: true,
      downloadOriginal: true,
    };
  }

  if (previewKind === "text" || previewKind === "markdown") {
    return {
      viewer: true,
      textSelection: true,
      search: true,
      annotate: false,
      measure: false,
      trueContentEdit: true,
      pageEdit: false,
      versionedSave: true,
      publicPreview: true,
      downloadOriginal: true,
    };
  }

  // Desteklenmeyen veya genel format
  return {
    viewer: false,
    textSelection: false,
    search: false,
    annotate: false,
    measure: false,
    trueContentEdit: false,
    pageEdit: false,
    versionedSave: false,
    publicPreview: false,
    downloadOriginal: true,
  };
}
