import type {
  ArcSegment3Mm,
  ColumnPresetId,
  ColumnSceneSpec,
  ConcreteVolumePart,
  DetailModel,
  DetailPart,
  DetailZoneSummary,
  DimensionMarkerMm,
  LineSegment3Mm,
  PathSegment3Mm,
  Point3Mm,
  RebarPathPart,
} from "../core/types";

const BASE_ZONES: ColumnSceneSpec["zones"] = [
  {
    id: "alt-sarilma",
    label: "Alt Sarılma Bölgesi",
    zStartMm: 0,
    zEndMm: 600,
    spacingMm: 100,
    colorHex: "#06b6d4",
    description: "0–600 mm arası Ø10/100 mm sıklaştırma bölgesi (6 etriye)",
  },
  {
    id: "orta-bolge",
    label: "Orta Bölge",
    zStartMm: 600,
    zEndMm: 2100,
    spacingMm: 150,
    colorHex: "#eab308",
    description: "600–2100 mm arası Ø10/150 mm orta bölge (10 etriye)",
  },
  {
    id: "ust-sarilma",
    label: "Üst Sarılma Bölgesi",
    zStartMm: 2100,
    zEndMm: 2700,
    spacingMm: 100,
    colorHex: "#06b6d4",
    description: "2100–2700 mm arası Ø10/100 mm sıklaştırma bölgesi (6 etriye)",
  },
  {
    id: "dugum-bolgesi",
    label: "Üst Düğüm / Birleşim Bölgesi",
    zStartMm: 2700,
    zEndMm: 3200,
    spacingMm: 100,
    colorHex: "#22c55e",
    description: "2700–3200 mm arası Ø10/100 mm üst bölge (5 etriye)",
  },
];

export const C1_COLUMN_SPEC: ColumnSceneSpec = {
  version: 1,
  slug: "kolon-detayi",
  presetId: "c1-referans",
  title: "C1 Eğitim Örneği — 300×300 mm Betonarme Kolon",
  subtitle: "4Ø20 köşe boyuna donatı, Ø10 kancalı etriyeler (27 adet) ve 1080 mm üst filiz",
  sectionWidthMm: 300,
  sectionDepthMm: 300,
  concreteHeightMm: 3200,
  dowelLapLengthMm: 1080,
  totalBarHeightMm: 4280,
  clearCoverMm: 30,
  longitudinalDiameterMm: 20,
  longitudinalCount: 4,
  stirrupDiameterMm: 10,
  stirrupBendRadiusMm: 20,
  stirrupHookLengthMm: 85,
  includeCrossties: false,
  crosstieDiameterMm: 10,
  zones: BASE_ZONES,
  assumptions: [
    {
      id: "kaynak-veri",
      label: "Görsel Kaynak Verisi (C1 Örneği)",
      description:
        "300×300 mm beton kesiti, 4Ø20 boyuna donatı, Ø10 etriyeler, 600/1500/600/500 mm bölgesel yükseklikler ve 1080 mm üst filiz uzantısı (toplam 4280 mm boy) eğitim referansından alınmıştır.",
      isTeachingAssumption: false,
    },
    {
      id: "paspayi-ve-bukum-varsayimi",
      label: "Net Pas Payı ve Mandrel Büküm Yarıçapı (Öğretim Varsayımı)",
      description:
        "Net beton örtüsü (beton dış yüzü ile etriye dış yüzü arası) c = 30 mm; Ø10 etriye eksen büküm yarıçapı r = 20 mm ve 135° deprem kancası düz uç boyu 85 mm olarak öğretim varsayımıyla tanımlanmıştır.",
      isTeachingAssumption: true,
    },
    {
      id: "etriye-ofset-varsayimi",
      label: "Etriye Yerleşim Ofseti (Öğretim Varsayımı)",
      description:
        "Dört bölgede etriye merkez kotları yarım aralık (s/2) ofsetiyle üretilir: [50..550], [675..2025], [2150..2650], [2750..3150] mm. Sınırda çift etriye oluşmadan 6 + 10 + 6 + 5 = 27 etriye elde edilir.",
      isTeachingAssumption: true,
    },
  ],
};

export const C1_CROSSTIE_TEACHING_SPEC: ColumnSceneSpec = {
  version: 1,
  slug: "kolon-detayi",
  presetId: "c1-cirozlu-ogretim",
  title: "Çirozlu Öğretim Önayarı — 400×400 mm Betonarme Kolon",
  subtitle: "8Ø20 boyuna donatı, Ø10 kancalı çevre etriyesi ve X/Y çirozları (27 kotta)",
  sectionWidthMm: 400,
  sectionDepthMm: 400,
  concreteHeightMm: 3200,
  dowelLapLengthMm: 1080,
  totalBarHeightMm: 4280,
  clearCoverMm: 30,
  longitudinalDiameterMm: 20,
  longitudinalCount: 8,
  stirrupDiameterMm: 10,
  stirrupBendRadiusMm: 20,
  stirrupHookLengthMm: 95,
  includeCrossties: true,
  crosstieDiameterMm: 10,
  zones: BASE_ZONES,
  assumptions: [
    {
      id: "ciroz-ogretim-onayari",
      label: "Ayrı Çirozlu Öğretim Önayarı",
      description:
        "C1 referans görselinde çiroz yer almadığı için hayalî çiroz C1'e eklenmemiştir. Kenar ortası boyuna donatıları ve karşılıklı çiroz bağlantısını göstermek için bu 400×400 mm (8Ø20) ikinci öğretim önayarı tanımlanmıştır.",
      isTeachingAssumption: true,
    },
    {
      id: "paspayi-ve-bukum-varsayimi",
      label: "Net Pas Payı ve Kanca Düzeni (Öğretim Varsayımı)",
      description:
        "Net pas payı c = 30 mm, etriye köşe büküm yarıçapı r = 20 mm, 135° kanca uç boyu 95 mm olarak açık öğretim varsayımıyla modellenmiştir.",
      isTeachingAssumption: true,
    },
    {
      id: "etriye-ofset-varsayimi",
      label: "Etriye ve Çiroz Kotları (Öğretim Varsayımı)",
      description:
        "C1 ile karşılaştırılabilir olması için aynı 27 etriye kotunda (6+10+6+5) çevre etriyesi ve her kotta X/Y doğrultulu çiroz çifti yerleştirilmiştir.",
      isTeachingAssumption: true,
    },
  ],
};

export const COLUMN_PRESET_SPECS: Readonly<
  Record<Extract<ColumnPresetId, "c1-referans" | "c1-cirozlu-ogretim">, ColumnSceneSpec>
> = {
  "c1-referans": C1_COLUMN_SPEC,
  "c1-cirozlu-ogretim": C1_CROSSTIE_TEACHING_SPEC,
};

export function getColumnSceneSpec(
  presetId: ColumnPresetId = "c1-referans",
): ColumnSceneSpec {
  if (presetId === "c1-cirozlu-ogretim") {
    return C1_CROSSTIE_TEACHING_SPEC;
  }
  return C1_COLUMN_SPEC;
}

export interface ColumnParameterExperimentInput {
  presetId: Extract<ColumnPresetId, "c1-referans" | "c1-cirozlu-ogretim">;
  sectionWidthMm: number;
  sectionDepthMm: number;
  longitudinalDiameterMm: number;
  confinementSpacingMm: number;
  middleSpacingMm: number;
}

export interface ColumnParameterValidationResult {
  valid: boolean;
  reason: string | null;
  normalizedParams: ColumnParameterExperimentInput | null;
  spec: ColumnSceneSpec | null;
}

export const COLUMN_PARAMETER_LIMITS = {
  sectionWidthMm: { min: 250, max: 600 },
  sectionDepthMm: { min: 250, max: 600 },
  longitudinalDiameterMm: { min: 12, max: 32 },
  confinementSpacingMm: { min: 75, max: 200 },
  middleSpacingMm: { min: 75, max: 200 },
  minClearBarGapMm: 45,
  maxTotalPartsBudget: 400,
} as const;

export function getDefaultColumnExperimentInput(
  presetId: ColumnPresetId = "c1-referans",
): ColumnParameterExperimentInput {
  const base = getColumnSceneSpec(presetId);
  return {
    presetId:
      presetId === "c1-cirozlu-ogretim" ? "c1-cirozlu-ogretim" : "c1-referans",
    sectionWidthMm: base.sectionWidthMm,
    sectionDepthMm: base.sectionDepthMm,
    longitudinalDiameterMm: base.longitudinalDiameterMm,
    confinementSpacingMm: base.zones[0]?.spacingMm ?? 100,
    middleSpacingMm: base.zones[1]?.spacingMm ?? 150,
  };
}

/**
 * Aşama 10 — Yalnız kolon için sınırlı parametre denemesi doğrulaması ve spec üreticisi:
 * - Kesit boyutu: 250–600 mm
 * - Boyuna donatı çapı: 12–32 mm
 * - Bölgesel etriye aralığı: 75–200 mm
 * - Hacim/örtü/çubuk yerleşimi (köşe ve ara çubuklar arası net boşluk) ve geometri bütçesi kontrolü.
 * - Donatı adedi (4 veya 8) ve kolon boyu / zonal uzunluklar önayara bağlı kalır.
 */
export function validateAndBuildCustomColumnSpec(
  rawInput: Partial<ColumnParameterExperimentInput>,
): ColumnParameterValidationResult {
  const presetId: Extract<ColumnPresetId, "c1-referans" | "c1-cirozlu-ogretim"> =
    rawInput.presetId === "c1-cirozlu-ogretim"
      ? "c1-cirozlu-ogretim"
      : "c1-referans";
  const baseSpec = getColumnSceneSpec(presetId);

  const sectionWidthMm = Number(rawInput.sectionWidthMm);
  const sectionDepthMm = Number(rawInput.sectionDepthMm);
  const longitudinalDiameterMm = Number(rawInput.longitudinalDiameterMm);
  const confinementSpacingMm = Number(rawInput.confinementSpacingMm);
  const middleSpacingMm = Number(rawInput.middleSpacingMm);

  if (
    !Number.isFinite(sectionWidthMm) ||
    !Number.isFinite(sectionDepthMm) ||
    !Number.isFinite(longitudinalDiameterMm) ||
    !Number.isFinite(confinementSpacingMm) ||
    !Number.isFinite(middleSpacingMm)
  ) {
    return {
      valid: false,
      reason: "Tüm parametreler sonlu sayısal değer olmalıdır (NaN veya sonsuz kabul edilmez).",
      normalizedParams: null,
      spec: null,
    };
  }

  const w = Math.round(sectionWidthMm);
  const d = Math.round(sectionDepthMm);
  const barDia = Math.round(longitudinalDiameterMm);
  const sConf = Math.round(confinementSpacingMm);
  const sMid = Math.round(middleSpacingMm);

  if (
    w < COLUMN_PARAMETER_LIMITS.sectionWidthMm.min ||
    w > COLUMN_PARAMETER_LIMITS.sectionWidthMm.max ||
    d < COLUMN_PARAMETER_LIMITS.sectionDepthMm.min ||
    d > COLUMN_PARAMETER_LIMITS.sectionDepthMm.max
  ) {
    return {
      valid: false,
      reason: `Kesit genişliği ve derinliği ürün/geometri sınırları içinde (250–600 mm) olmalıdır (girilen: ${w}×${d} mm).`,
      normalizedParams: null,
      spec: null,
    };
  }

  if (
    barDia < COLUMN_PARAMETER_LIMITS.longitudinalDiameterMm.min ||
    barDia > COLUMN_PARAMETER_LIMITS.longitudinalDiameterMm.max
  ) {
    return {
      valid: false,
      reason: `Boyuna donatı çapı ürün/geometri sınırları içinde (12–32 mm) olmalıdır (girilen: Ø${barDia} mm).`,
      normalizedParams: null,
      spec: null,
    };
  }

  if (
    sConf < COLUMN_PARAMETER_LIMITS.confinementSpacingMm.min ||
    sConf > COLUMN_PARAMETER_LIMITS.confinementSpacingMm.max ||
    sMid < COLUMN_PARAMETER_LIMITS.middleSpacingMm.min ||
    sMid > COLUMN_PARAMETER_LIMITS.middleSpacingMm.max
  ) {
    return {
      valid: false,
      reason: `Bölgesel etriye aralıkları ürün/geometri sınırları içinde (75–200 mm) olmalıdır (girilen: sarılma=${sConf} mm, orta=${sMid} mm).`,
      normalizedParams: null,
      spec: null,
    };
  }

  if (sConf > sMid) {
    return {
      valid: false,
      reason: `Alt/üst sarılma bölgesi etriye aralığı (${sConf} mm), orta bölge etriye aralığından (${sMid} mm) büyük olamaz.`,
      normalizedParams: null,
      spec: null,
    };
  }

  // Hacim / örtü / çubuk yerleşimi kontrolü
  const cornerCenterOffset =
    baseSpec.clearCoverMm + baseSpec.stirrupDiameterMm + barDia / 2;
  const spanBetweenCornerCentersX = w - 2 * cornerCenterOffset;
  const spanBetweenCornerCentersY = d - 2 * cornerCenterOffset;
  const barsPerSide = baseSpec.longitudinalCount === 8 ? 3 : 2;
  const intervalsPerSide = barsPerSide - 1;
  const centerToCenterX = spanBetweenCornerCentersX / intervalsPerSide;
  const centerToCenterY = spanBetweenCornerCentersY / intervalsPerSide;
  const clearGapX = centerToCenterX - barDia;
  const clearGapY = centerToCenterY - barDia;

  if (
    clearGapX < COLUMN_PARAMETER_LIMITS.minClearBarGapMm ||
    clearGapY < COLUMN_PARAMETER_LIMITS.minClearBarGapMm
  ) {
    return {
      valid: false,
      reason: `Seçilen ${w}×${d} mm kesit ve ${baseSpec.longitudinalCount}Ø${barDia} yerleşiminde boyuna çubuklar arası net temiz açıklık (${Math.round(Math.min(clearGapX, clearGapY))} mm) minimum geometri sınırının (${COLUMN_PARAMETER_LIMITS.minClearBarGapMm} mm) altına düşüyor.`,
      normalizedParams: null,
      spec: null,
    };
  }

  // Geometri bütçesi ön kontrolü
  const nextZones = baseSpec.zones.map((z) => {
    const spacingMm = z.id === "orta-bolge" ? sMid : sConf;
    const elevs = computeZoneStirrupElevationsMm(z.zStartMm, z.zEndMm, spacingMm);
    return {
      ...z,
      spacingMm,
      description: `${z.zStartMm}–${z.zEndMm} mm arası Ø${baseSpec.stirrupDiameterMm}/${spacingMm} mm (${elevs.length} etriye)`,
    };
  });

  const totalStirrups = nextZones.reduce(
    (acc, z) =>
      acc + computeZoneStirrupElevationsMm(z.zStartMm, z.zEndMm, z.spacingMm).length,
    0,
  );
  const totalCrossties = baseSpec.includeCrossties ? totalStirrups * 2 : 0;
  const estimatedParts =
    1 + baseSpec.longitudinalCount * 2 + totalStirrups + totalCrossties;

  if (estimatedParts > COLUMN_PARAMETER_LIMITS.maxTotalPartsBudget) {
    return {
      valid: false,
      reason: `Üretilecek toplam parça sayısı (${estimatedParts}) sahne bütçe sınırını (${COLUMN_PARAMETER_LIMITS.maxTotalPartsBudget}) aşıyor.`,
      normalizedParams: null,
      spec: null,
    };
  }

  const normalizedParams: ColumnParameterExperimentInput = {
    presetId,
    sectionWidthMm: w,
    sectionDepthMm: d,
    longitudinalDiameterMm: barDia,
    confinementSpacingMm: sConf,
    middleSpacingMm: sMid,
  };

  const isDefault =
    w === baseSpec.sectionWidthMm &&
    d === baseSpec.sectionDepthMm &&
    barDia === baseSpec.longitudinalDiameterMm &&
    sConf === 100 &&
    sMid === 150;

  const customSpec: ColumnSceneSpec = {
    ...baseSpec,
    title: isDefault
      ? baseSpec.title
      : `${presetId === "c1-cirozlu-ogretim" ? "Çirozlu Kolon Deneyi" : "C1 Kolon Deneyi"} — ${w}×${d} mm (${baseSpec.longitudinalCount}Ø${barDia})`,
    subtitle: `${baseSpec.longitudinalCount}Ø${barDia} boyuna donatı, Ø${baseSpec.stirrupDiameterMm}/${sConf}–${sMid} mm etriye (${totalStirrups} adet) ve ${baseSpec.dowelLapLengthMm} mm üst filiz`,
    sectionWidthMm: w,
    sectionDepthMm: d,
    longitudinalDiameterMm: barDia,
    zones: nextZones,
  };

  return {
    valid: true,
    reason: null,
    normalizedParams,
    spec: customSpec,
  };
}

function makeLine(
  start: Point3Mm,
  end: Point3Mm,
  role: LineSegment3Mm["role"] = "leg",
): LineSegment3Mm {
  return {
    kind: "line",
    start,
    end,
    role,
  };
}

function makeArcXY(
  center: Point3Mm,
  radiusMm: number,
  startAngleRad: number,
  endAngleRad: number,
  role: ArcSegment3Mm["role"] = "bend",
): ArcSegment3Mm {
  return {
    kind: "arc",
    center,
    radiusMm,
    startAngleRad,
    endAngleRad,
    plane: "xy",
    role,
  };
}

export function computeZoneStirrupElevationsMm(
  zStartMm: number,
  zEndMm: number,
  spacingMm: number,
): number[] {
  const elevations: number[] = [];
  const firstZ = zStartMm + spacingMm / 2;
  for (let z = firstZ; z < zEndMm + 1e-6; z += spacingMm) {
    if (z <= zEndMm - spacingMm / 2 + 1e-6) {
      elevations.push(Math.round(z * 100) / 100);
    }
  }
  return elevations;
}

/**
 * Etriye halkasını düz kollar + 4 köşe yay segmenti + sağ-üst köşede 135° deprem kancaları ile üretir.
 */
function buildStirrupLoopSegments(options: {
  stirrupHalfX: number;
  stirrupHalfY: number;
  bendRadiusMm: number;
  hookLengthMm: number;
  zMm: number;
}): PathSegment3Mm[] {
  const { stirrupHalfX: sx, stirrupHalfY: sy, bendRadiusMm: r, hookLengthMm, zMm } = options;

  const cx = sx - r;
  const cy = sy - r;

  // Köşe yay merkezleri
  const cSW: Point3Mm = { x: -cx, y: -cy, z: zMm };
  const cSE: Point3Mm = { x: cx, y: -cy, z: zMm };
  const cNE: Point3Mm = { x: cx, y: cy, z: zMm };
  const cNW: Point3Mm = { x: -cx, y: cy, z: zMm };

  // 135° içe bakan kanca kolları (sağ-üst NE köşesinden çekirdek içine -X, -Y yönünde)
  const diag = Math.SQRT1_2;
  const hook1Start: Point3Mm = {
    x: cx + r * diag,
    y: cy + r * diag,
    z: zMm + 2,
  };
  const hook1End: Point3Mm = {
    x: Number((hook1Start.x - hookLengthMm * diag).toFixed(2)),
    y: Number((hook1Start.y - hookLengthMm * diag).toFixed(2)),
    z: zMm + 2,
  };

  const hook2Start: Point3Mm = {
    x: cx + r * diag,
    y: cy + r * diag,
    z: zMm - 2,
  };
  const hook2End: Point3Mm = {
    x: Number((hook2Start.x - hookLengthMm * 0.78).toFixed(2)),
    y: Number((hook2Start.y - hookLengthMm * 0.56).toFixed(2)),
    z: zMm - 2,
  };

  return [
    // Ön kenar (-Y)
    makeLine({ x: -cx, y: -sy, z: zMm }, { x: cx, y: -sy, z: zMm }, "leg"),
    // Sağ-Ön (SE) 90° köşe bükümü: -90° -> 0°
    makeArcXY(cSE, r, -Math.PI / 2, 0, "bend"),
    // Sağ kenar (+X)
    makeLine({ x: sx, y: -cy, z: zMm }, { x: sx, y: cy, z: zMm }, "leg"),
    // Sağ-Arka (NE) köşe bükümü: 0° -> 90°
    makeArcXY(cNE, r, 0, Math.PI / 2, "bend"),
    // Arka kenar (+Y)
    makeLine({ x: cx, y: sy, z: zMm }, { x: -cx, y: sy, z: zMm }, "leg"),
    // Sol-Arka (NW) köşe bükümü: 90° -> 180°
    makeArcXY(cNW, r, Math.PI / 2, Math.PI, "bend"),
    // Sol kenar (-X)
    makeLine({ x: -sx, y: cy, z: zMm }, { x: -sx, y: -cy, z: zMm }, "leg"),
    // Sol-Ön (SW) köşe bükümü: 180° -> 270°
    makeArcXY(cSW, r, Math.PI, (3 * Math.PI) / 2, "bend"),
    // Kanca büküm yayı (135° dönüş temsili)
    makeArcXY(cNE, r * 0.9, Math.PI / 6, (3 * Math.PI) / 4, "hook-bend"),
    // 135° deprem kancası uçları (çekirdek içine doğru)
    makeLine(hook1Start, hook1End, "hook"),
    makeLine(hook2Start, hook2End, "hook"),
  ];
}

function buildCrosstieSegmentsX(options: {
  longHalfX: number;
  bendRadiusMm: number;
  hookLengthMm: number;
  zMm: number;
}): PathSegment3Mm[] {
  const { longHalfX, bendRadiusMm: r, hookLengthMm, zMm } = options;
  const hookDiag = hookLengthMm * 0.55;
  return [
    makeLine({ x: -longHalfX, y: 0, z: zMm }, { x: longHalfX, y: 0, z: zMm }, "leg"),
    makeArcXY({ x: -longHalfX + r, y: r, z: zMm }, r, Math.PI, (3 * Math.PI) / 2, "hook-bend"),
    makeLine(
      { x: -longHalfX, y: 0, z: zMm },
      { x: -longHalfX + hookDiag, y: hookDiag, z: zMm },
      "hook",
    ),
    makeArcXY({ x: longHalfX - r, y: -r, z: zMm }, r, 0, Math.PI / 2, "hook-bend"),
    makeLine(
      { x: longHalfX, y: 0, z: zMm },
      { x: longHalfX - hookDiag, y: -hookDiag, z: zMm },
      "hook",
    ),
  ];
}

function buildCrosstieSegmentsY(options: {
  longHalfY: number;
  bendRadiusMm: number;
  hookLengthMm: number;
  zMm: number;
}): PathSegment3Mm[] {
  const { longHalfY, bendRadiusMm: r, hookLengthMm, zMm } = options;
  const hookDiag = hookLengthMm * 0.55;
  return [
    makeLine({ x: 0, y: -longHalfY, z: zMm }, { x: 0, y: longHalfY, z: zMm }, "leg"),
    makeArcXY({ x: r, y: -longHalfY + r, z: zMm }, r, -Math.PI / 2, 0, "hook-bend"),
    makeLine(
      { x: 0, y: -longHalfY, z: zMm },
      { x: hookDiag, y: -longHalfY + hookDiag, z: zMm },
      "hook",
    ),
    makeArcXY({ x: -r, y: longHalfY - r, z: zMm }, r, Math.PI / 2, Math.PI, "hook-bend"),
    makeLine(
      { x: 0, y: longHalfY, z: zMm },
      { x: -hookDiag, y: longHalfY - hookDiag, z: zMm },
      "hook",
    ),
  ];
}

export function buildColumnDetailModel(
  spec: ColumnSceneSpec = C1_COLUMN_SPEC,
): DetailModel {
  const halfW = spec.sectionWidthMm / 2;
  const halfD = spec.sectionDepthMm / 2;

  const stirrupAxisOffsetFromFaceMm =
    spec.clearCoverMm + spec.stirrupDiameterMm / 2;
  const cornerBarCenterOffsetFromFaceMm =
    spec.clearCoverMm +
    spec.stirrupDiameterMm +
    spec.longitudinalDiameterMm / 2;

  const concretePart: ConcreteVolumePart = {
    kind: "concrete",
    id: "concrete-column-body",
    label: `Kolon Beton Gövdesi (${spec.sectionWidthMm}×${spec.sectionDepthMm}×${spec.concreteHeightMm} mm)`,
    category: "concrete",
    layerId: "concrete",
    centerMm: {
      x: 0,
      y: 0,
      z: spec.concreteHeightMm / 2,
    },
    sizeMm: {
      widthX: spec.sectionWidthMm,
      depthY: spec.sectionDepthMm,
      heightZ: spec.concreteHeightMm,
    },
    summary: {
      whatIsIt: `${spec.sectionWidthMm}×${spec.sectionDepthMm} mm enkesitli ve ${spec.concreteHeightMm} mm yüksekliğinde betonarme kolon gövdesi.`,
      whereInExample: `Z = 0 mm taban kotundan Z = ${spec.concreteHeightMm} mm üst kotuna kadar uzanır; net pas payı örtüsü c = ${spec.clearCoverMm} mm'dir.`,
      role: "Basınç kuvvetlerini taşır, donatı kafesini sararak korozyon ve yangına karşı net beton örtüsü sağlar.",
      fieldNote: "Pas payı beton dış yüzü ile en dış donatı (etriye) dış yüzü arasındaki net mesafedir.",
    },
  };

  const stirrupHalfX = halfW - stirrupAxisOffsetFromFaceMm;
  const stirrupHalfY = halfD - stirrupAxisOffsetFromFaceMm;

  const longHalfX = halfW - cornerBarCenterOffsetFromFaceMm;
  const longHalfY = halfD - cornerBarCenterOffsetFromFaceMm;

  const cornerPositions: Array<{
    idSuffix: string;
    cornerLabel: string;
    x: number;
    y: number;
  }> = [
    { idSuffix: "sw", cornerLabel: "Sol-Ön Köşe", x: -longHalfX, y: -longHalfY },
    { idSuffix: "se", cornerLabel: "Sağ-Ön Köşe", x: longHalfX, y: -longHalfY },
    { idSuffix: "ne", cornerLabel: "Sağ-Arka Köşe", x: longHalfX, y: longHalfY },
    { idSuffix: "nw", cornerLabel: "Sol-Arka Köşe", x: -longHalfX, y: longHalfY },
  ];

  if (spec.longitudinalCount === 8) {
    cornerPositions.push(
      { idSuffix: "s-mid", cornerLabel: "Ön Kenar Ortası", x: 0, y: -longHalfY },
      { idSuffix: "e-mid", cornerLabel: "Sağ Kenar Ortası", x: longHalfX, y: 0 },
      { idSuffix: "n-mid", cornerLabel: "Arka Kenar Ortası", x: 0, y: longHalfY },
      { idSuffix: "w-mid", cornerLabel: "Sol Kenar Ortası", x: -longHalfX, y: 0 },
    );
  }

  const longitudinalParts: RebarPathPart[] = cornerPositions.map((pos, index) => ({
    kind: "rebar",
    id: `longitudinal-bar-${index + 1}-${pos.idSuffix}`,
    label: `Boyuna Donatı #${index + 1} (Ø${spec.longitudinalDiameterMm} — ${pos.cornerLabel})`,
    category: "longitudinal",
    layerId: "longitudinal",
    diameterMm: spec.longitudinalDiameterMm,
    colorHex: "#94a3b8",
    segments: [
      makeLine(
        { x: pos.x, y: pos.y, z: 0 },
        { x: pos.x, y: pos.y, z: spec.concreteHeightMm },
        "leg",
      ),
    ],
    summary: {
      whatIsIt: `Ø${spec.longitudinalDiameterMm} mm çapında düşey boyuna kolon donatısı.`,
      whereInExample: `${pos.cornerLabel} (X=${pos.x} mm, Y=${pos.y} mm), Z=0..${spec.concreteHeightMm} mm gövde içinde.`,
      role: "Kolonda eksenel basınç ve eğilme etkilerini betonla birlikte taşır; etriye ve çirozlar için düşey mesnet oluşturur.",
    },
  }));

  const dowelParts: RebarPathPart[] = cornerPositions.map((pos, index) => ({
    kind: "rebar",
    id: `dowel-bar-${index + 1}-${pos.idSuffix}`,
    label: `Üst Kat Filiz Uzantısı #${index + 1} (Ø${spec.longitudinalDiameterMm} — ${pos.cornerLabel})`,
    category: "dowel",
    layerId: "dowel",
    diameterMm: spec.longitudinalDiameterMm,
    colorHex: "#f59e0b",
    segments: [
      makeLine(
        { x: pos.x, y: pos.y, z: spec.concreteHeightMm },
        { x: pos.x, y: pos.y, z: spec.totalBarHeightMm },
        "leg",
      ),
    ],
    summary: {
      whatIsIt: `Üst kata devam eden ${spec.dowelLapLengthMm} mm uzunluğunda Ø${spec.longitudinalDiameterMm} filiz uzantısı gösterimi.`,
      whereInExample: `Z = ${spec.concreteHeightMm} mm kolon üst yüzünden Z = ${spec.totalBarHeightMm} mm kotuna kadar uzanır (${pos.cornerLabel}).`,
      role: "Üst kat kolon boyuna donatılarıyla süreklilik/bindirme bağlantısını göstermek için bırakılan filiz bölgesidir.",
      fieldNote: "Bu uzunluk görsel kaynaktaki filiz gösterimidir; tek başına yönetmelik bindirme yeterliliği iddiası taşımaz.",
    },
  }));

  const stirrupParts: RebarPathPart[] = [];
  const crosstieParts: RebarPathPart[] = [];
  const zoneSummaries: DetailZoneSummary[] = [];

  let globalStirrupIndex = 0;
  let globalCrosstieIndex = 0;

  for (const zone of spec.zones) {
    const elevations = computeZoneStirrupElevationsMm(
      zone.zStartMm,
      zone.zEndMm,
      zone.spacingMm,
    );

    const zoneCrosstieCount = spec.includeCrossties ? elevations.length * 2 : 0;

    zoneSummaries.push({
      id: zone.id,
      label: zone.label,
      zStartMm: zone.zStartMm,
      zEndMm: zone.zEndMm,
      lengthMm: zone.zEndMm - zone.zStartMm,
      spacingMm: zone.spacingMm,
      stirrupCount: elevations.length,
      crosstieCount: zoneCrosstieCount,
      colorHex: zone.colorHex,
      description: zone.description,
    });

    for (const zMm of elevations) {
      globalStirrupIndex += 1;

      stirrupParts.push({
        kind: "rebar",
        id: `stirrup-${globalStirrupIndex}-${zone.id}-z${zMm}`,
        label: `Etriye #${globalStirrupIndex} (${zone.label} — Z=${zMm} mm)`,
        category: "stirrup",
        layerId: "stirrup",
        diameterMm: spec.stirrupDiameterMm,
        zoneId: zone.id,
        elevationZMm: zMm,
        bendRadiusMm: spec.stirrupBendRadiusMm,
        hookAngleDeg: 135,
        hookLengthMm: spec.stirrupHookLengthMm,
        colorHex: zone.colorHex,
        segments: buildStirrupLoopSegments({
          stirrupHalfX,
          stirrupHalfY,
          bendRadiusMm: spec.stirrupBendRadiusMm,
          hookLengthMm: spec.stirrupHookLengthMm,
          zMm,
        }),
        summary: {
          whatIsIt: `Ø${spec.stirrupDiameterMm} mm çapında, köşe bükümlü ve 135° deprem kancalı kapalı kolon etriyesi.`,
          whereInExample: `${zone.label} içinde Z = ${zMm} mm kotunda (${zone.spacingMm} mm aralıklı düzen).`,
          role: "Kesme kuvvetlerini karşılar, çekirdek betonunu sarar ve boyuna donatıların burkulmasını sınırlar.",
          fieldNote: "Etriye uçları çekirdek betonunun içine doğru 135° bükülerek kancalanır.",
        },
      });

      if (spec.includeCrossties) {
        globalCrosstieIndex += 1;
        crosstieParts.push({
          kind: "rebar",
          id: `crosstie-${globalCrosstieIndex}-x-z${zMm}`,
          label: `Çiroz #${globalCrosstieIndex} (X Doğrultusu — Z=${zMm} mm)`,
          category: "crosstie",
          layerId: "crosstie",
          diameterMm: spec.crosstieDiameterMm,
          zoneId: zone.id,
          elevationZMm: zMm,
          bendRadiusMm: spec.stirrupBendRadiusMm,
          hookAngleDeg: 135,
          hookLengthMm: spec.stirrupHookLengthMm * 0.65,
          colorHex: "#ec4899",
          segments: buildCrosstieSegmentsX({
            longHalfX,
            bendRadiusMm: spec.stirrupBendRadiusMm,
            hookLengthMm: spec.stirrupHookLengthMm,
            zMm: zMm + 4,
          }),
          summary: {
            whatIsIt: `Ø${spec.crosstieDiameterMm} mm çapında X doğrultulu ara bağlantı çirozu (öğretim önayarı).`,
            whereInExample: `${zone.label} içinde Z = ${zMm} mm kotunda sol ve sağ kenar ortası boyuna donatılarını bağlar.`,
            role: "Kenar ortasındaki boyuna donatıların yanal burkulmasını önler ve çekirdek sargı etkisini destekler.",
          },
        });

        globalCrosstieIndex += 1;
        crosstieParts.push({
          kind: "rebar",
          id: `crosstie-${globalCrosstieIndex}-y-z${zMm}`,
          label: `Çiroz #${globalCrosstieIndex} (Y Doğrultusu — Z=${zMm} mm)`,
          category: "crosstie",
          layerId: "crosstie",
          diameterMm: spec.crosstieDiameterMm,
          zoneId: zone.id,
          elevationZMm: zMm,
          bendRadiusMm: spec.stirrupBendRadiusMm,
          hookAngleDeg: 135,
          hookLengthMm: spec.stirrupHookLengthMm * 0.65,
          colorHex: "#ec4899",
          segments: buildCrosstieSegmentsY({
            longHalfY,
            bendRadiusMm: spec.stirrupBendRadiusMm,
            hookLengthMm: spec.stirrupHookLengthMm,
            zMm: zMm - 4,
          }),
          summary: {
            whatIsIt: `Ø${spec.crosstieDiameterMm} mm çapında Y doğrultulu ara bağlantı çirozu (öğretim önayarı).`,
            whereInExample: `${zone.label} içinde Z = ${zMm} mm kotunda ön ve arka kenar ortası boyuna donatılarını bağlar.`,
            role: "Karşılıklı boyuna donatıları kenetleyerek etriye kol açıklığını küçültür.",
          },
        });
      }
    }
  }

  const dimensionMarkers: DimensionMarkerMm[] = [
    {
      id: "dim-concrete-height",
      label: `Kolon Gövde Boyu: ${spec.concreteHeightMm} mm`,
      valueMm: spec.concreteHeightMm,
      unit: "mm",
      startMm: { x: -halfW - 95, y: 0, z: 0 },
      endMm: { x: -halfW - 95, y: 0, z: spec.concreteHeightMm },
      colorHex: "#a855f7",
    },
    {
      id: "dim-dowel-length",
      label: `Filiz Uzantısı: ${spec.dowelLapLengthMm} mm`,
      valueMm: spec.dowelLapLengthMm,
      unit: "mm",
      startMm: { x: -halfW - 95, y: 0, z: spec.concreteHeightMm },
      endMm: { x: -halfW - 95, y: 0, z: spec.totalBarHeightMm },
      colorHex: "#f59e0b",
    },
    {
      id: "dim-section-width",
      label: `Kesit Genişliği: ${spec.sectionWidthMm} mm`,
      valueMm: spec.sectionWidthMm,
      unit: "mm",
      startMm: { x: -halfW, y: -halfD - 70, z: 0 },
      endMm: { x: halfW, y: -halfD - 70, z: 0 },
      colorHex: "#38bdf8",
    },
    ...spec.zones.map((z) => ({
      id: `dim-zone-${z.id}`,
      label: `${z.label}: ${z.zEndMm - z.zStartMm} mm (s=${z.spacingMm} mm)`,
      valueMm: z.zEndMm - z.zStartMm,
      unit: "mm" as const,
      startMm: { x: halfW + 85, y: 0, z: z.zStartMm },
      endMm: { x: halfW + 85, y: 0, z: z.zEndMm },
      colorHex: z.colorHex,
    })),
  ];

  const parts: DetailPart[] = [
    concretePart,
    ...longitudinalParts,
    ...dowelParts,
    ...stirrupParts,
    ...crosstieParts,
  ];

  return {
    specVersion: 1,
    slug: spec.slug,
    presetId: spec.presetId,
    title: spec.title,
    subtitle: spec.subtitle,
    boundsMm: {
      min: { x: -halfW, y: -halfD, z: 0 },
      max: { x: halfW, y: halfD, z: spec.totalBarHeightMm },
    },
    concreteBoundsMm: {
      min: { x: -halfW, y: -halfD, z: 0 },
      max: { x: halfW, y: halfD, z: spec.concreteHeightMm },
    },
    dimensionsMm: {
      widthX: spec.sectionWidthMm,
      depthY: spec.sectionDepthMm,
      concreteHeightZ: spec.concreteHeightMm,
      dowelLengthZ: spec.dowelLapLengthMm,
      totalHeightZ: spec.totalBarHeightMm,
      clearCover: spec.clearCoverMm,
      stirrupAxisOffsetFromFaceMm,
      cornerBarCenterOffsetFromFaceMm,
    },
    parts,
    zones: zoneSummaries,
    dimensionMarkers,
    counts: {
      totalParts: parts.length,
      concreteParts: 1,
      longitudinalBars: longitudinalParts.length,
      stirrups: stirrupParts.length,
      dowels: dowelParts.length,
      crossties: crosstieParts.length,
    },
    assumptions: spec.assumptions,
  };
}
