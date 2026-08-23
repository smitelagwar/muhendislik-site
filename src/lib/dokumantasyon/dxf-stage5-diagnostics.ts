import type { DxfEncodingResolution } from "./dxf-encoding";
import type { DxfFidelityAudit } from "./dxf-fidelity-audit";
import type { DxfReleaseHardeningAudit } from "./dxf-release-hardening";
import type { DxfStage3Audit } from "./dxf-stage3-fidelity";
import type { DxfStage4Audit, DxfStage4ViewerValidation } from "./dxf-stage4-fidelity";

export type DxfDiagnosticSeverity = "info" | "warning" | "blocking";
export type DxfDiagnosticCategory =
  | "encoding"
  | "structure"
  | "block"
  | "text"
  | "dimension"
  | "layer"
  | "geometry"
  | "viewport"
  | "renderer";

export interface DxfDiagnosticItem {
  id: string;
  severity: DxfDiagnosticSeverity;
  category: DxfDiagnosticCategory;
  title: string;
  detail: string;
  count?: number;
  evidence?: string[];
}

export interface DxfStage5DiagnosticsReport {
  status: "clean" | "warning" | "blocked";
  blockingCount: number;
  warningCount: number;
  infoCount: number;
  modelSpaceGeometryCount: number;
  paperSpaceGeometryCount: number;
  activeLayerCount: number;
  offLayerCount: number;
  frozenLayerCount: number;
  items: DxfDiagnosticItem[];
}

interface BuildDxfStage5DiagnosticsInput {
  encoding: DxfEncodingResolution;
  audit: DxfFidelityAudit;
  stage3: DxfStage3Audit;
  stage4: DxfStage4Audit;
  releaseHardening?: DxfReleaseHardeningAudit | null;
  stage2BlockingIssues?: string[];
  stage3BlockingIssues?: string[];
  stage4BlockingIssues?: string[];
  releaseHardeningBlockingIssues?: string[];
  viewerValidation?: DxfStage4ViewerValidation | null;
  rendererWarnings?: string[];
}

function add(items: DxfDiagnosticItem[], item: DxfDiagnosticItem) {
  if (!items.some((current) => current.id === item.id)) items.push(item);
}

function joinEvidence(values: string[], limit = 6): string[] | undefined {
  if (values.length === 0) return undefined;
  if (values.length <= limit) return values;
  return [...values.slice(0, limit), `+${values.length - limit} daha`];
}

export function buildDxfStage5DiagnosticsReport({
  encoding,
  audit,
  stage3,
  stage4,
  releaseHardening = null,
  stage2BlockingIssues = [],
  stage3BlockingIssues = [],
  stage4BlockingIssues = [],
  releaseHardeningBlockingIssues = [],
  viewerValidation = null,
  rendererWarnings = [],
}: BuildDxfStage5DiagnosticsInput): DxfStage5DiagnosticsReport {
  const items: DxfDiagnosticItem[] = [];

  add(items, {
    id: "encoding",
    severity: encoding.warnings.length > 0 ? "warning" : "info",
    category: "encoding",
    title: `Kaynak encoding: ${encoding.encoding}`,
    detail: encoding.codePage
      ? `${encoding.codePage} bilgisi kullanılarak çözümlendi (${encoding.source}).`
      : `Encoding ${encoding.source} üzerinden belirlendi.`,
    evidence: joinEvidence(encoding.warnings),
  });

  const blockedUnsupportedCount = releaseHardening?.blockedUnsupportedEntityCount ?? 0;
  if (blockedUnsupportedCount > 0) {
    add(items, {
      id: "unsupported-entities",
      severity: "blocking",
      category: "structure",
      title: `${blockedUnsupportedCount} görünür/erişilebilir desteklenmeyen entity`,
      detail: "Bu entity'ler model-space görünümünde veya gerçekten kullanılan BLOCK zincirinde yer alıyor. Sessiz bilgi kaybını önlemek için render durdurulur.",
      count: blockedUnsupportedCount,
      evidence: joinEvidence(releaseHardening?.blockedUnsupportedTypes ?? []),
    });
  } else if (audit.unsupportedEntityCount > 0) {
    add(items, {
      id: "unsupported-entities-suppressed",
      severity: releaseHardening ? "info" : "warning",
      category: "structure",
      title: `${audit.unsupportedEntityCount} renderer dışı entity kaynakta mevcut`,
      detail: releaseHardening
        ? "Bu kayıtlar görünür model yolu dışında (ör. paper-space, hidden/off layer veya erişilmeyen BLOCK) kaldığı için model görünümünü bloke etmiyor."
        : "Bu entity tipleri mevcut renderer'ın doğrudan işleme listesinde değil; çizimde bilgi kaybı olabilir.",
      count: audit.unsupportedEntityCount,
      evidence: joinEvidence(audit.unsupportedTypes),
    });
  }

  const blockedMissingBlockCount = releaseHardening?.blockedMissingBlockReferenceCount ?? 0;
  if (blockedMissingBlockCount > 0) {
    add(items, {
      id: "missing-blocks",
      severity: "blocking",
      category: "block",
      title: `${blockedMissingBlockCount} görünür/erişilebilir çözülemeyen BLOCK`,
      detail: "INSERT gerçekten kullanılan çizim yolunda ancak karşılık gelen BLOCK tanımı dosyada yok. Eksik geometri başarı olarak gösterilmez.",
      count: blockedMissingBlockCount,
      evidence: joinEvidence(releaseHardening?.blockedMissingBlockReferences ?? []),
    });
  } else if (audit.missingBlockReferenceCount > 0) {
    add(items, {
      id: "missing-blocks-suppressed",
      severity: releaseHardening ? "info" : "warning",
      category: "block",
      title: `${audit.missingBlockReferenceCount} çözülemeyen BLOCK referansı kaynakta mevcut`,
      detail: releaseHardening
        ? "Eksik referans görünür/erişilebilir model yolunda olmadığı için bu model görünümünü bloke etmiyor."
        : "INSERT kaydı var ancak karşılık gelen BLOCK tanımı dosyada bulunamadı.",
      count: audit.missingBlockReferenceCount,
      evidence: joinEvidence(audit.missingBlockReferences),
    });
  }

  if ((releaseHardening?.unsafeOcsEntityCount ?? 0) > 0) {
    add(items, {
      id: "ocs-hardening",
      severity: "blocking",
      category: "geometry",
      title: `${releaseHardening?.unsafeOcsEntityCount ?? 0} non-default OCS/extrusion entity`,
      detail: "Upstream renderer arbitrary OCS dönüşümünü tam uygulamıyor. +Z dışındaki extrusion yönleri entity bazında doğrulanmadan render edilmez.",
      count: releaseHardening?.unsafeOcsEntityCount ?? 0,
      evidence: joinEvidence(releaseHardening?.unsafeOcsTypes ?? []),
    });
  }

  if (audit.arrayInsertCount > 0 || audit.blockCycleCount > 0) {
    add(items, {
      id: "block-render-risk",
      severity: "blocking",
      category: "block",
      title: "BLOCK/INSERT güvenilirlik sınırı aşıldı",
      detail: "MINSERT/grid veya recursive block zinciri mevcut renderer tarafından güvenilir biçimde üretilemiyor.",
      count: audit.arrayInsertCount + audit.blockCycleCount,
      evidence: joinEvidence([
        ...(audit.arrayInsertCount > 0 ? [`${audit.arrayInsertCount} grid/array INSERT`] : []),
        ...audit.blockCycles,
      ]),
    });
  }

  if (stage3.shxStyleCount > 0 || stage3.missingTextStyleReferenceCount > 0 || stage3.nonPositiveTextHeightCount > 0) {
    add(items, {
      id: "text-style-risk",
      severity: "warning",
      category: "text",
      title: "Yazı stili fallback kullanıyor",
      detail: "SHX veya eksik/uygunsuz text style nedeniyle metin görünür tutulur ancak tipografi CAD ile birebir olmayabilir.",
      count: stage3.shxStyleCount + stage3.missingTextStyleReferenceCount + stage3.nonPositiveTextHeightCount,
      evidence: joinEvidence([...stage3.shxStyles, ...stage3.missingTextStyles]),
    });
  }

  if (stage3.stackedFractionCount > 0) {
    add(items, {
      id: "mtext-fraction",
      severity: "warning",
      category: "text",
      title: `${stage3.stackedFractionCount} MTEXT kesir fallback'i`,
      detail: "Stacked fraction içeriği kaybolmaması için geçici render kopyasında düz metne dönüştürülür.",
      count: stage3.stackedFractionCount,
    });
  }

  if (stage3.unsupportedDimensionWithoutBlockCount > 0 || stage3.malformedSupportedDimensionCount > 0) {
    add(items, {
      id: "dimension-blocking",
      severity: "blocking",
      category: "dimension",
      title: "Ölçü geometrisi eksik render edilebilir",
      detail: "Native sentezlenemeyen block'suz ölçü veya zorunlu noktaları eksik linear/aligned dimension bulundu.",
      count: stage3.unsupportedDimensionWithoutBlockCount + stage3.malformedSupportedDimensionCount,
      evidence: joinEvidence(stage3.unsupportedDimensionTypes),
    });
  } else if (stage3.unsupportedDimensionCount > 0 || stage3.missingDimensionStyleReferenceCount > 0) {
    add(items, {
      id: "dimension-warning",
      severity: "warning",
      category: "dimension",
      title: "Ölçü stili/renderer fallback'i kullanılıyor",
      detail: "Bazı ölçüler hazır dimension block üzerinden veya eksik DIMSTYLE referansıyla gösteriliyor.",
      count: stage3.unsupportedDimensionCount + stage3.missingDimensionStyleReferenceCount,
      evidence: joinEvidence([...stage3.unsupportedDimensionTypes, ...stage3.missingDimensionStyles]),
    });
  }

  if (stage4.offLayerCount > 0 || stage4.frozenLayerCount > 0) {
    add(items, {
      id: "hidden-layers",
      severity: "info",
      category: "layer",
      title: `${stage4.offLayerCount + stage4.frozenLayerCount} kapalı/dondurulmuş layer`,
      detail: "Bu layer'lar model görünümünden ve FitView bounds hesabından çıkarılır.",
      count: stage4.offLayerCount + stage4.frozenLayerCount,
      evidence: joinEvidence([...stage4.offLayers, ...stage4.frozenLayers]),
    });
  }

  if (stage4.missingLayerReferenceCount > 0) {
    add(items, {
      id: "missing-layers",
      severity: "warning",
      category: "layer",
      title: `${stage4.missingLayerReferenceCount} tanımsız layer referansı`,
      detail: "Entity bir layer adına bağlı ancak LAYER tablosunda karşılığı bulunamadı.",
      count: stage4.missingLayerReferenceCount,
      evidence: joinEvidence(stage4.missingLayerReferences),
    });
  }

  if (stage4.invalidWidthPolylineCount > 0) {
    add(items, {
      id: "polyline-width-invalid",
      severity: "warning",
      category: "geometry",
      title: `${stage4.invalidWidthPolylineCount} geçersiz polyline width kaydı`,
      detail: "Negatif veya bozuk width değeri nedeniyle physical width mesh uygulanmadı; kaynak centerline korunur.",
      count: stage4.invalidWidthPolylineCount,
    });
  }

  const riskySplineCount = stage4.fitPointOnlySplineCount + stage4.weightedSplineCount +
    stage4.closedOrPeriodicSplineCount + stage4.nonDefaultOcsSplineCount + stage4.malformedSplineCount;
  if (riskySplineCount > 0) {
    add(items, {
      id: "spline-blocking",
      severity: "blocking",
      category: "geometry",
      title: `${riskySplineCount} SPLINE güvenilirlik riski`,
      detail: "Fit-point-only, rational/weighted, closed/periodic, OCS veya malformed SPLINE mevcut engine ile güvenilir değil.",
      count: riskySplineCount,
    });
  }

  const riskyHatchCount = stage4.gradientHatchCount + stage4.emptyBoundaryHatchCount + stage4.unsupportedHatchEdgeTypeCount;
  if (riskyHatchCount > 0) {
    add(items, {
      id: "hatch-blocking",
      severity: "blocking",
      category: "geometry",
      title: `${riskyHatchCount} HATCH güvenilirlik riski`,
      detail: "Gradient, boş boundary veya desteklenmeyen edge tipi nedeniyle hatch eksik üretilebilir.",
      count: riskyHatchCount,
    });
  }

  if (stage4.paperSpaceGeometryCount > 0) {
    add(items, {
      id: "paper-space",
      severity: "info",
      category: "viewport",
      title: `${stage4.paperSpaceGeometryCount} paper-space entity gizlendi`,
      detail: "Bu görüntüleyici model-space odaklıdır; layout/paper-space geometrisi model FitView hesabına dahil edilmez.",
      count: stage4.paperSpaceGeometryCount,
    });
  }

  for (const [index, issue] of [
    ...stage2BlockingIssues,
    ...stage3BlockingIssues,
    ...stage4BlockingIssues,
    ...releaseHardeningBlockingIssues,
  ].entries()) {
    add(items, {
      id: `compatibility-${index}-${issue}`,
      severity: "blocking",
      category: "renderer",
      title: "Renderer uyumluluk kapısı",
      detail: issue,
    });
  }

  for (const [index, issue] of (viewerValidation?.blockingIssues ?? []).entries()) {
    add(items, {
      id: `viewport-blocking-${index}-${issue}`,
      severity: "blocking",
      category: "viewport",
      title: "Viewport doğrulaması başarısız",
      detail: issue,
    });
  }
  for (const [index, warning] of (viewerValidation?.warnings ?? []).entries()) {
    add(items, {
      id: `viewport-warning-${index}-${warning}`,
      severity: "warning",
      category: "viewport",
      title: "Viewport doğrulama uyarısı",
      detail: warning,
    });
  }
  for (const [index, warning] of rendererWarnings.entries()) {
    add(items, {
      id: `renderer-warning-${index}-${warning}`,
      severity: "warning",
      category: "renderer",
      title: "Renderer uyarısı",
      detail: warning,
    });
  }

  const severityOrder: Record<DxfDiagnosticSeverity, number> = { blocking: 0, warning: 1, info: 2 };
  items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.category.localeCompare(b.category));

  const blockingCount = items.filter((item) => item.severity === "blocking").length;
  const warningCount = items.filter((item) => item.severity === "warning").length;
  const infoCount = items.filter((item) => item.severity === "info").length;

  return {
    status: blockingCount > 0 ? "blocked" : warningCount > 0 ? "warning" : "clean",
    blockingCount,
    warningCount,
    infoCount,
    modelSpaceGeometryCount: stage4.modelSpaceGeometryCount,
    paperSpaceGeometryCount: stage4.paperSpaceGeometryCount,
    activeLayerCount: stage4.activeLayerCount,
    offLayerCount: stage4.offLayerCount,
    frozenLayerCount: stage4.frozenLayerCount,
    items,
  };
}