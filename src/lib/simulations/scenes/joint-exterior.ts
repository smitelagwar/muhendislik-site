import type {
  ArcSegment3Mm,
  AssumptionNote,
  ConcreteVolumePart,
  DetailModel,
  DetailPart,
  DetailZoneSummary,
  DimensionMarkerMm,
  LineSegment3Mm,
  PathSegment3Mm,
  Point3Mm,
  RebarPathPart,
  StirrupZoneId,
} from "../core/types";

export interface ExteriorJointSceneSpec {
  version: 1;
  slug: "kolon-kiris-birlesimi";
  presetId: "d1-dis-birlesim";
  title: string;
  subtitle: string;
  columnWidthMm: number;
  columnDepthMm: number;
  columnConcreteHeightMm: number;
  columnDowelLengthMm: number;
  beamWidthMm: number;
  beamHeightMm: number;
  beamStubLengthMm: number;
  jointBottomZMm: number;
  jointTopZMm: number;
  clearCoverMm: number;
  columnBarDiameterMm: number;
  beamBarDiameterMm: number;
  stirrupDiameterMm: number;
  stirrupBendRadiusMm: number;
  stirrupHookLengthMm: number;
  anchorageBendRadiusMm: number;
  topAnchorageVerticalTailMm: number;
  bottomAnchorageVerticalTailMm: number;
  zones: ReadonlyArray<{
    id: Extract<
      StirrupZoneId,
      "alt-sarilma" | "birlesim-cekirdegi" | "ust-sarilma" | "kiris-sarilma"
    >;
    label: string;
    zStartMm: number;
    zEndMm: number;
    spacingMm: number;
    colorHex: string;
    description: string;
  }>;
  assumptions: ReadonlyArray<AssumptionNote>;
}

export const D1_EXTERIOR_JOINT_SPEC: ExteriorJointSceneSpec = {
  version: 1,
  slug: "kolon-kiris-birlesimi",
  presetId: "d1-dis-birlesim",
  title: "D1 Eğitim Örneği — Kolon–Kiriş Dış Birleşimi Donatı Detayı",
  subtitle:
    "400×400 mm dış kolon + 300×500 mm çerçeve kirişi, düğüm çekirdeği etriyeleri ve 90° kiriş ankraj kancaları",
  columnWidthMm: 400,
  columnDepthMm: 400,
  columnConcreteHeightMm: 3000,
  columnDowelLengthMm: 600,
  beamWidthMm: 300,
  beamHeightMm: 500,
  beamStubLengthMm: 1600,
  jointBottomZMm: 1250,
  jointTopZMm: 1750,
  clearCoverMm: 30,
  columnBarDiameterMm: 20,
  beamBarDiameterMm: 16,
  stirrupDiameterMm: 10,
  stirrupBendRadiusMm: 20,
  stirrupHookLengthMm: 85,
  anchorageBendRadiusMm: 32,
  topAnchorageVerticalTailMm: 320,
  bottomAnchorageVerticalTailMm: 300,
  zones: [
    {
      id: "alt-sarilma",
      label: "Alt Kolon Sarılma Bölgesi",
      zStartMm: 0,
      zEndMm: 1250,
      spacingMm: 100,
      colorHex: "#06b6d4",
      description:
        "Z = 0–1250 mm alt kolon sarılma bölgesi (Ø10/100 mm, 12 etriye)",
    },
    {
      id: "birlesim-cekirdegi",
      label: "Düğüm Çekirdeği Bölgesi",
      zStartMm: 1250,
      zEndMm: 1750,
      spacingMm: 100,
      colorHex: "#22c55e",
      description:
        "Z = 1250–1750 mm kolon–kiriş dış birleşim çekirdeği (Ø10/100 mm, 5 sürekli kolon etriyesi)",
    },
    {
      id: "ust-sarilma",
      label: "Üst Kolon Sarılma Bölgesi",
      zStartMm: 1750,
      zEndMm: 3000,
      spacingMm: 100,
      colorHex: "#06b6d4",
      description:
        "Z = 1750–3000 mm üst kolon sarılma bölgesi (Ø10/100 mm, 12 etriye)",
    },
    {
      id: "kiris-sarilma",
      label: "Kiriş Mesnet Sarılma Bölgesi",
      zStartMm: 200,
      zEndMm: 1800,
      spacingMm: 100,
      colorHex: "#ec4899",
      description:
        "X = 200–1800 mm kolon yüzünden başlayan kiriş sarılma ve açıklık etriyeleri (12 adet Ø10)",
    },
  ],
  assumptions: [
    {
      id: "dis-birlesim-geometri-kabulu",
      label: "Dış Birleşim Kesit Oranı ve Çakışmasız Yerleşim (Öğretim Varsayımı)",
      description:
        "Dış kolon 400×400 mm, birleşime saplanan çerçeve kirişi 300×500 mm seçilmiştir. Kiriş genişliği (300 mm) kolon genişliğinden (400 mm) dar olduğundan, kiriş boyuna donatıları (Y = -96, 0, +96 mm) kolon boyuna donatılarının (Y = ±145 mm) içinden kasıtsız çakışma olmadan düğüm çekirdeğine girer.",
      isTeachingAssumption: true,
    },
    {
      id: "ankraj-kanca-ve-bukum-kabulu",
      label: "Kiriş 90° Ankraj Kancaları ve Düşey Uç Boyları (Öğretim Varsayımı)",
      description:
        "Kiriş üst donatıları (3Ø16, Z = 1696 mm) kolon dış yüzüne yakın X = -125 mm düzleminde r = 32 mm bükümle 90° aşağı (320 mm düşey kol); alt donatıları (3Ø16, Z = 1304 mm) X = -95 mm düzleminde 90° yukarı (300 mm düşey kol) düğüm çekirdeği içine kenetlenmiştir.",
      isTeachingAssumption: true,
    },
    {
      id: "dugum-cekirdegi-etriye-surekliligi",
      label: "Düğüm Çekirdeğinde Kolon Etriyesi Sürekliliği (Öğretim Varsayımı)",
      description:
        "Z = 1250–1750 mm birleşim çekirdeği boyunca kolon enine donatıları kesilmemiş; Z = 1300, 1400, 1500, 1600 ve 1700 mm kotlarında 5 adet Ø10/100 mm kapalı kolon etriyesi düğüm çekirdeğini saracak biçimde sürdürülmüştür.",
      isTeachingAssumption: true,
    },
  ],
};

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

function makeArcYZ(
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
    plane: "yz",
    role,
  };
}

function makeArcXZ(
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
    plane: "xz",
    role,
  };
}

function buildColumnStirrupSegmentsXY(options: {
  stirrupHalfX: number;
  stirrupHalfY: number;
  bendRadiusMm: number;
  hookLengthMm: number;
  zMm: number;
}): PathSegment3Mm[] {
  const {
    stirrupHalfX: sx,
    stirrupHalfY: sy,
    bendRadiusMm: r,
    hookLengthMm,
    zMm,
  } = options;

  const cx = sx - r;
  const cy = sy - r;
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
    makeLine({ x: -cx, y: -sy, z: zMm }, { x: cx, y: -sy, z: zMm }, "leg"),
    makeArcXY({ x: cx, y: -cy, z: zMm }, r, -Math.PI / 2, 0, "bend"),
    makeLine({ x: sx, y: -cy, z: zMm }, { x: sx, y: cy, z: zMm }, "leg"),
    makeArcXY({ x: cx, y: cy, z: zMm }, r, 0, Math.PI / 2, "hook-bend"),
    makeLine({ x: cx, y: sy, z: zMm }, { x: -cx, y: sy, z: zMm }, "leg"),
    makeArcXY({ x: -cx, y: cy, z: zMm }, r, Math.PI / 2, Math.PI, "bend"),
    makeLine({ x: -sx, y: cy, z: zMm }, { x: -sx, y: -cy, z: zMm }, "leg"),
    makeArcXY(
      { x: -cx, y: -cy, z: zMm },
      r,
      Math.PI,
      (3 * Math.PI) / 2,
      "bend",
    ),
    makeLine(hook1Start, hook1End, "hook"),
    makeLine(hook2Start, hook2End, "hook"),
  ];
}

function buildBeamStirrupSegmentsYZ(params: {
  xMm: number;
  stirrupHalfY: number;
  stirrupBottomZ: number;
  stirrupTopZ: number;
  bendRadiusMm: number;
  hookLengthMm: number;
}): PathSegment3Mm[] {
  const {
    xMm,
    stirrupHalfY,
    stirrupBottomZ,
    stirrupTopZ,
    bendRadiusMm: r,
    hookLengthMm,
  } = params;

  const yLeft = -stirrupHalfY + r;
  const yRight = stirrupHalfY - r;
  const zBot = stirrupBottomZ + r;
  const zTop = stirrupTopZ - r;

  const hookDir = Math.SQRT1_2;
  const hookVecLen = hookLengthMm * hookDir;

  const hook1Start: Point3Mm = {
    x: xMm,
    y: yRight + r * hookDir,
    z: zTop - r * hookDir,
  };
  const hook1End: Point3Mm = {
    x: xMm,
    y: hook1Start.y - hookVecLen,
    z: hook1Start.z - hookVecLen,
  };

  const hook2Start: Point3Mm = {
    x: xMm,
    y: yRight - r * hookDir,
    z: zTop + r * hookDir,
  };
  const hook2End: Point3Mm = {
    x: xMm,
    y: hook2Start.y - hookVecLen,
    z: hook2Start.z - hookVecLen,
  };

  return [
    makeLine(
      { x: xMm, y: yLeft, z: stirrupBottomZ },
      { x: xMm, y: yRight, z: stirrupBottomZ },
      "leg",
    ),
    makeArcYZ({ x: xMm, y: yRight, z: zBot }, r, -Math.PI / 2, 0, "bend"),
    makeLine(
      { x: xMm, y: stirrupHalfY, z: zBot },
      { x: xMm, y: stirrupHalfY, z: zTop },
      "leg",
    ),
    makeArcYZ(
      { x: xMm, y: yRight, z: zTop },
      r,
      0,
      (3 * Math.PI) / 4,
      "hook-bend",
    ),
    makeLine(
      { x: xMm, y: yRight, z: stirrupTopZ },
      { x: xMm, y: yLeft, z: stirrupTopZ },
      "leg",
    ),
    makeArcYZ(
      { x: xMm, y: yLeft, z: zTop },
      r,
      Math.PI / 2,
      Math.PI,
      "bend",
    ),
    makeLine(
      { x: xMm, y: -stirrupHalfY, z: zTop },
      { x: xMm, y: -stirrupHalfY, z: zBot },
      "leg",
    ),
    makeArcYZ(
      { x: xMm, y: yLeft, z: zBot },
      r,
      Math.PI,
      (3 * Math.PI) / 2,
      "bend",
    ),
    makeLine(hook1Start, hook1End, "hook"),
    makeLine(hook2Start, hook2End, "hook"),
  ];
}

/**
 * Dış kolon çekirdeğine saplanan kiriş boyuna donatısı için
 * yatay gövde + 90° büküm yayı + düşey ankraj kolu segmentlerini üretir.
 */
function buildExteriorJointAnchoredBeamBarSegments(params: {
  xAnchorVerticalPlaneMm: number;
  xBeamEndMm: number;
  yMm: number;
  zHorizontalMm: number;
  bendDirZ: 1 | -1;
  bendRadiusMm: number;
  verticalTailLengthMm: number;
}): PathSegment3Mm[] {
  const {
    xAnchorVerticalPlaneMm,
    xBeamEndMm,
    yMm,
    zHorizontalMm,
    bendDirZ,
    bendRadiusMm: r,
    verticalTailLengthMm,
  } = params;

  const arcCenterX = xAnchorVerticalPlaneMm + r;
  const arcCenterZ = zHorizontalMm + bendDirZ * r;
  const verticalEndZ = arcCenterZ + bendDirZ * verticalTailLengthMm;

  return [
    // Düğüm çekirdeği içindeki 90° düşey ankraj kolu
    makeLine(
      { x: xAnchorVerticalPlaneMm, y: yMm, z: verticalEndZ },
      { x: xAnchorVerticalPlaneMm, y: yMm, z: arcCenterZ },
      "hook",
    ),
    // 90° büküm yayı (X-Z düzleminde)
    makeArcXZ(
      { x: arcCenterX, y: yMm, z: arcCenterZ },
      r,
      Math.PI,
      bendDirZ < 0 ? Math.PI / 2 : (3 * Math.PI) / 2,
      "hook-bend",
    ),
    // Kiriş açıklığına uzanan ana yatay kol
    makeLine(
      { x: arcCenterX, y: yMm, z: zHorizontalMm },
      { x: xBeamEndMm, y: yMm, z: zHorizontalMm },
      "leg",
    ),
  ];
}

export function buildExteriorJointDetailModel(
  spec: ExteriorJointSceneSpec = D1_EXTERIOR_JOINT_SPEC,
): DetailModel {
  const colHalfX = spec.columnWidthMm / 2; // 200 mm
  const colHalfY = spec.columnDepthMm / 2; // 200 mm
  const beamHalfY = spec.beamWidthMm / 2; // 150 mm

  const stirrupAxisOffsetFromFaceMm =
    spec.clearCoverMm + spec.stirrupDiameterMm / 2; // 35 mm
  const cornerBarCenterOffsetFromFaceMm =
    spec.clearCoverMm +
    spec.stirrupDiameterMm +
    spec.columnBarDiameterMm / 2 +
    5; // 55 mm -> ±145 mm

  const colStirrupHalfX = colHalfX - stirrupAxisOffsetFromFaceMm; // 165 mm
  const colStirrupHalfY = colHalfY - stirrupAxisOffsetFromFaceMm; // 165 mm
  const colBarCoord = colHalfX - cornerBarCenterOffsetFromFaceMm; // 145 mm

  const beamStirrupHalfY = beamHalfY - stirrupAxisOffsetFromFaceMm; // 115 mm
  const beamStirrupBottomZ = spec.jointBottomZMm + stirrupAxisOffsetFromFaceMm; // 1285 mm
  const beamStirrupTopZ = spec.jointTopZMm - stirrupAxisOffsetFromFaceMm; // 1715 mm

  const beamTopBarZ =
    spec.jointTopZMm -
    (spec.clearCoverMm + spec.stirrupDiameterMm + spec.beamBarDiameterMm / 2 + 6); // 1696 mm
  const beamBottomBarZ =
    spec.jointBottomZMm +
    (spec.clearCoverMm + spec.stirrupDiameterMm + spec.beamBarDiameterMm / 2 + 6); // 1304 mm

  const beamStartFaceX = colHalfX; // 200 mm (kolon iç yüzü)
  const beamEndX = beamStartFaceX + spec.beamStubLengthMm; // 1800 mm

  // 1) Beton Parçaları: Dış Kolon Gövdesi + Saplanan Kiriş Gövdesi
  const concreteParts: ConcreteVolumePart[] = [
    {
      kind: "concrete",
      id: "concrete-column-body",
      label: `Dış Kolon Beton Gövdesi (${spec.columnWidthMm}×${spec.columnDepthMm} mm · H=${spec.columnConcreteHeightMm} mm)`,
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: 0,
        y: 0,
        z: spec.columnConcreteHeightMm / 2,
      },
      sizeMm: {
        widthX: spec.columnWidthMm,
        depthY: spec.columnDepthMm,
        heightZ: spec.columnConcreteHeightMm,
      },
      summary: {
        whatIsIt: `${spec.columnWidthMm}×${spec.columnDepthMm} mm kare kesitli ve ${spec.columnConcreteHeightMm} mm yüksekliğinde dış çerçeve kolonu.`,
        whereInExample: `X = -${colHalfX}..+${colHalfX} mm, Y = -${colHalfY}..+${colHalfY} mm ve Z = 0..${spec.columnConcreteHeightMm} mm hacmindedir; Z = ${spec.jointBottomZMm}..${spec.jointTopZMm} mm arası düğüm çekirdeğidir.`,
        role: "Düşey eksenel yükleri, çerçeve eğilme momentlerini ve düğüm çekirdeği kesme kuvvetlerini taşır.",
      },
    },
    {
      kind: "concrete",
      id: "concrete-joint-beam",
      label: `Saplanan Çerçeve Kirişi Gövdesi (${spec.beamWidthMm}×${spec.beamHeightMm} mm · L=${spec.beamStubLengthMm} mm)`,
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: beamStartFaceX + spec.beamStubLengthMm / 2,
        y: 0,
        z: (spec.jointBottomZMm + spec.jointTopZMm) / 2,
      },
      sizeMm: {
        widthX: spec.beamStubLengthMm,
        depthY: spec.beamWidthMm,
        heightZ: spec.beamHeightMm,
      },
      summary: {
        whatIsIt: `Dış kolona sadece +X yönünden saplanan ${spec.beamWidthMm}×${spec.beamHeightMm} mm kesitli çerçeve kirişi uzantısı.`,
        whereInExample: `Kolon iç yüzünden (X = ${beamStartFaceX} mm) X = ${beamEndX} mm kotuna uzanır; Z = ${spec.jointBottomZMm}..${spec.jointTopZMm} mm yüksekliğindedir.`,
        role: "Kiriş uç momentini ve kesme kuvvetini Z = 1250–1750 mm düğüm çekirdeğine aktarır.",
      },
    },
  ];

  // 2) Kolon Boyuna Donatıları (8Ø20 — 4 köşe + 4 kenar ortası, Y = ±145 mm ve X = ±145 mm)
  const columnBarPositions: ReadonlyArray<{
    suffix: string;
    label: string;
    x: number;
    y: number;
  }> = [
    { suffix: "sw", label: "Sol-Ön Köşe", x: -colBarCoord, y: -colBarCoord },
    { suffix: "se", label: "Sağ-Ön Köşe", x: colBarCoord, y: -colBarCoord },
    { suffix: "ne", label: "Sağ-Arka Köşe", x: colBarCoord, y: colBarCoord },
    { suffix: "nw", label: "Sol-Arka Köşe", x: -colBarCoord, y: colBarCoord },
    { suffix: "s-mid", label: "Ön Kenar Ortası", x: 0, y: -colBarCoord },
    { suffix: "n-mid", label: "Arka Kenar Ortası", x: 0, y: colBarCoord },
    { suffix: "w-mid", label: "Dış Yüz Ortası", x: -colBarCoord, y: 0 },
    { suffix: "e-mid", label: "Kiriş Yüzü Ortası", x: colBarCoord, y: 48 },
  ];

  const longitudinalParts: RebarPathPart[] = columnBarPositions.map(
    (pos, idx) => ({
      kind: "rebar",
      id: `joint-col-bar-${idx + 1}-${pos.suffix}`,
      label: `Kolon Boyuna Donatısı #${idx + 1} (Ø${spec.columnBarDiameterMm} — ${pos.label})`,
      category: "longitudinal",
      layerId: "longitudinal",
      diameterMm: spec.columnBarDiameterMm,
      bendRadiusMm: 40,
      colorHex: "#cbd5e1",
      segments: [
        makeLine(
          { x: pos.x, y: pos.y, z: 0 },
          {
            x: pos.x,
            y: pos.y,
            z: spec.columnConcreteHeightMm + spec.columnDowelLengthMm,
          },
          "leg",
        ),
      ],
      summary: {
        whatIsIt: `Dış kolonda Z = 0..${spec.columnConcreteHeightMm + spec.columnDowelLengthMm} mm boyunca kesintisiz yükselen Ø${spec.columnBarDiameterMm} mm düşey boyuna taşıyıcı çubuk.`,
        whereInExample: `Kolon kesitinde (X = ${pos.x} mm, Y = ${pos.y} mm) konumunda, düğüm çekirdeği içinden geçerek üst kat filiz bölgesine uzanır.`,
        role: "Kolon eksenel yükünü ve çerçeve düğüm momentlerini alt kattan üst kata sürekli olarak aktarır.",
      },
    }),
  );

  // 3) Kiriş Boyuna Donatıları ve 90° Dış Birleşim Ankraj Kancaları ("dowel" katmanında izole edilebilir)
  // Y = -96, 0, +96 mm düzlemleri kolon boyuna çubuklarıyla (Y = ±145, Y = +48, X = -145) çakışmaz!
  const beamYPlanes = [-96, 0, 96];
  const beamYLabels = ["Ön Köşe", "Orta Eksen", "Arka Köşe"];

  const topAnchoredBeamBars: RebarPathPart[] = beamYPlanes.map((yMm, idx) => ({
    kind: "rebar",
    id: `joint-beam-top-bar-${idx + 1}`,
    label: `Kiriş Üst Donatısı & 90° Ankraj #${idx + 1} (Ø${spec.beamBarDiameterMm} — ${beamYLabels[idx]})`,
    category: "dowel",
    layerId: "dowel",
    diameterMm: spec.beamBarDiameterMm,
    elevationZMm: beamTopBarZ,
    bendRadiusMm: spec.anchorageBendRadiusMm,
    hookAngleDeg: 90,
    hookLengthMm: spec.topAnchorageVerticalTailMm,
    colorHex: "#f59e0b",
    segments: buildExteriorJointAnchoredBeamBarSegments({
      xAnchorVerticalPlaneMm: -125,
      xBeamEndMm: beamEndX - 40,
      yMm,
      zHorizontalMm: beamTopBarZ,
      bendDirZ: -1,
      bendRadiusMm: spec.anchorageBendRadiusMm,
      verticalTailLengthMm: spec.topAnchorageVerticalTailMm,
    }),
    summary: {
      whatIsIt: `Kiriş üst yüzünden düğüm çekirdeğine giren ve kolon dış yüzüne yakın bölgede 90° aşağı bükülen Ø${spec.beamBarDiameterMm} mm kiriş üst ankraj donatısı.`,
      whereInExample: `Z = ${beamTopBarZ} mm üst kotta, Y = ${yMm} mm ekseninde kirişten kolona girer; X = -125 mm düzleminde 90° aşağı dönerek Z = ${beamTopBarZ - spec.anchorageBendRadiusMm - spec.topAnchorageVerticalTailMm} mm kotuna kadar uzanır.`,
      role: "Dış birleşimde negatif eğilme momentinden doğan üst çekme kuvvetini kolon çekirdeği içine kenetler; kanca ucu dışa değil düğüm çekirdeği içine döner.",
      fieldNote:
        "Dış birleşimlerde kiriş boyuna donatılarının kolon dış yüzünden dışarı taşması veya kancasız bırakılması kenetlenme kaybına yol açar; 90° kanca kolon çekirdeği içinde kalmalıdır.",
    },
  }));

  const bottomAnchoredBeamBars: RebarPathPart[] = beamYPlanes.map(
    (yMm, idx) => ({
      kind: "rebar",
      id: `joint-beam-bottom-bar-${idx + 1}`,
      label: `Kiriş Alt Donatısı & 90° Ankraj #${idx + 1} (Ø${spec.beamBarDiameterMm} — ${beamYLabels[idx]})`,
      category: "dowel",
      layerId: "dowel",
      diameterMm: spec.beamBarDiameterMm,
      elevationZMm: beamBottomBarZ,
      bendRadiusMm: spec.anchorageBendRadiusMm,
      hookAngleDeg: 90,
      hookLengthMm: spec.bottomAnchorageVerticalTailMm,
      colorHex: "#38bdf8",
      segments: buildExteriorJointAnchoredBeamBarSegments({
        xAnchorVerticalPlaneMm: -95,
        xBeamEndMm: beamEndX - 40,
        yMm,
        zHorizontalMm: beamBottomBarZ,
        bendDirZ: 1,
        bendRadiusMm: spec.anchorageBendRadiusMm,
        verticalTailLengthMm: spec.bottomAnchorageVerticalTailMm,
      }),
      summary: {
        whatIsIt: `Kiriş alt yüzünden düğüm çekirdeğine giren ve çekirdek içinde 90° yukarı bükülen Ø${spec.beamBarDiameterMm} mm kiriş alt ankraj donatısı.`,
        whereInExample: `Z = ${beamBottomBarZ} mm alt kotta, Y = ${yMm} mm ekseninde kirişten kolona girer; X = -95 mm düzleminde 90° yukarı dönerek Z = ${beamBottomBarZ + spec.anchorageBendRadiusMm + spec.bottomAnchorageVerticalTailMm} mm kotuna kadar uzanır.`,
        role: "Tersinir deprem yükleri altında alt liflerde oluşabilecek çekme kuvvetlerini düğüm çekirdeğine güvenle aktarır ve üst kancalarla çakışmamak için X = -95 mm iç kademesinde yer alır.",
      },
    }),
  );

  const anchoredBeamBars: RebarPathPart[] = [
    ...topAnchoredBeamBars,
    ...bottomAnchoredBeamBars,
  ];

  // 4) Kolon Etriyeleri: Alt Sarılma (12) + Düğüm Çekirdeği (5) + Üst Sarılma (12) = 29 adet ("stirrup" katmanı)
  const lowerElevations = [
    75, 175, 275, 375, 475, 575, 675, 775, 875, 975, 1075, 1175,
  ];
  const jointCoreElevations = [1300, 1400, 1500, 1600, 1700];
  const upperElevations = [
    1825, 1925, 2025, 2125, 2225, 2325, 2425, 2525, 2625, 2725, 2825, 2925,
  ];

  const columnStirrupGroups: ReadonlyArray<{
    zoneId: "alt-sarilma" | "birlesim-cekirdegi" | "ust-sarilma";
    zoneLabel: string;
    colorHex: string;
    elevations: number[];
  }> = [
    {
      zoneId: "alt-sarilma",
      zoneLabel: "Alt Kolon Sarılma Bölgesi",
      colorHex: "#06b6d4",
      elevations: lowerElevations,
    },
    {
      zoneId: "birlesim-cekirdegi",
      zoneLabel: "Düğüm Çekirdeği Bölgesi",
      colorHex: "#22c55e",
      elevations: jointCoreElevations,
    },
    {
      zoneId: "ust-sarilma",
      zoneLabel: "Üst Kolon Sarılma Bölgesi",
      colorHex: "#06b6d4",
      elevations: upperElevations,
    },
  ];

  const columnStirrupParts: RebarPathPart[] = [];
  let colStirrupCounter = 0;

  for (const grp of columnStirrupGroups) {
    for (const zMm of grp.elevations) {
      colStirrupCounter += 1;
      const isJointCore = grp.zoneId === "birlesim-cekirdegi";
      columnStirrupParts.push({
        kind: "rebar",
        id: `joint-col-stirrup-${colStirrupCounter}-${grp.zoneId}-z${zMm}`,
        label: isJointCore
          ? `Düğüm Çekirdeği Kolon Etriyesi #${colStirrupCounter} (Z=${zMm} mm)`
          : `Kolon Etriyesi #${colStirrupCounter} (${grp.zoneLabel} — Z=${zMm} mm)`,
        category: "stirrup",
        layerId: "stirrup",
        diameterMm: spec.stirrupDiameterMm,
        zoneId: grp.zoneId,
        elevationZMm: zMm,
        bendRadiusMm: spec.stirrupBendRadiusMm,
        hookAngleDeg: 135,
        hookLengthMm: spec.stirrupHookLengthMm,
        colorHex: grp.colorHex,
        segments: buildColumnStirrupSegmentsXY({
          stirrupHalfX: colStirrupHalfX,
          stirrupHalfY: colStirrupHalfY,
          bendRadiusMm: spec.stirrupBendRadiusMm,
          hookLengthMm: spec.stirrupHookLengthMm,
          zMm,
        }),
        summary: {
          whatIsIt: isJointCore
            ? `Kolon–kiriş dış birleşim çekirdeği (Z = 1250–1750 mm) içinde kesintisiz devam eden Ø${spec.stirrupDiameterMm} mm kapalı kolon etriyesi.`
            : `Kolon sarılma bölgesinde Z = ${zMm} mm kotunda yer alan Ø${spec.stirrupDiameterMm} mm kapalı etriye.`,
          whereInExample: `${grp.zoneLabel} içinde Z = ${zMm} mm kotunda (s = 100 mm sıklaştırma düzeni).`,
          role: isJointCore
            ? "Düğüm çekirdeğinde oluşan yüksek diyagonal çekme/kesme kuvvetlerini karşılar ve kiriş 90° ankraj kancalarının dışa açılmasını engeller."
            : "Birleşim komşuluğundaki kolon sarılma bölgesinde çekirdek betonunu sarar ve boyuna donatı burkulmasını önler.",
        },
      });
    }
  }

  // 5) Kiriş Mesnet Sarılma Etriyeleri ("crosstie" katmanında izole edilebilir: 12 adet Ø10)
  const beamStirrupXPositions = [
    250, 350, 450, 550, 650, 750, 850, 950, 1100, 1250, 1450, 1650,
  ];

  const beamStirrupParts: RebarPathPart[] = beamStirrupXPositions.map(
    (xMm, idx) => ({
      kind: "rebar",
      id: `joint-beam-stirrup-${idx + 1}-x${xMm}`,
      label: `Kiriş Sarılma Etriyesi #${idx + 1} (X=${xMm} mm)`,
      category: "crosstie",
      layerId: "crosstie",
      diameterMm: spec.stirrupDiameterMm,
      zoneId: "kiris-sarilma",
      elevationZMm: 1500,
      bendRadiusMm: spec.stirrupBendRadiusMm,
      hookAngleDeg: 135,
      hookLengthMm: 80,
      colorHex: "#ec4899",
      segments: buildBeamStirrupSegmentsYZ({
        xMm,
        stirrupHalfY: beamStirrupHalfY,
        stirrupBottomZ: beamStirrupBottomZ,
        stirrupTopZ: beamStirrupTopZ,
        bendRadiusMm: spec.stirrupBendRadiusMm,
        hookLengthMm: 80,
      }),
      summary: {
        whatIsIt: `Kolon yüzünden (X = 200 mm) itibaren kiriş sarılma bölgesini saran Ø${spec.stirrupDiameterMm} mm düşey kiriş etriyesi.`,
        whereInExample: `Saplanan kiriş üzerinde X = ${xMm} mm konumunda (ilk etriye kolon yüzünden 50 mm mesafede).`,
        role: "Kiriş mesnet plastik mafsal bölgesinde kesme kuvvetini taşır ve üst/alt kiriş donatılarını sarar.",
      },
    }),
  );

  const zoneSummaries: DetailZoneSummary[] = [
    {
      id: "alt-sarilma",
      label: "Alt Kolon Sarılma Bölgesi",
      zStartMm: 0,
      zEndMm: 1250,
      lengthMm: 1250,
      spacingMm: 100,
      stirrupCount: lowerElevations.length,
      crosstieCount: 0,
      colorHex: "#06b6d4",
      description: "Z = 0–1250 mm alt kolon sıklaştırma bölgesi (12 etriye)",
    },
    {
      id: "birlesim-cekirdegi",
      label: "Düğüm Çekirdeği Bölgesi",
      zStartMm: 1250,
      zEndMm: 1750,
      lengthMm: 500,
      spacingMm: 100,
      stirrupCount: jointCoreElevations.length,
      crosstieCount: 0,
      colorHex: "#22c55e",
      description:
        "Z = 1250–1750 mm birleşim çekirdeği (5 sürekli kolon etriyesi + 90° kiriş ankrajları)",
    },
    {
      id: "ust-sarilma",
      label: "Üst Kolon Sarılma Bölgesi",
      zStartMm: 1750,
      zEndMm: 3000,
      lengthMm: 1250,
      spacingMm: 100,
      stirrupCount: upperElevations.length,
      crosstieCount: 0,
      colorHex: "#06b6d4",
      description: "Z = 1750–3000 mm üst kolon sıklaştırma bölgesi (12 etriye)",
    },
    {
      id: "kiris-sarilma",
      label: "Kiriş Sarılma Etriyeleri",
      zStartMm: 1250,
      zEndMm: 1750,
      lengthMm: 1600,
      spacingMm: 100,
      stirrupCount: 0,
      crosstieCount: beamStirrupParts.length,
      colorHex: "#ec4899",
      description:
        "X = 200–1800 mm saplanan kiriş sarılma bölgesi (12 adet Ø10 kiriş etriyesi)",
    },
  ];

  const dimensionMarkers: DimensionMarkerMm[] = [
    {
      id: "dim-joint-column-height",
      label: `Kolon Boyu H = ${spec.columnConcreteHeightMm} mm`,
      valueMm: spec.columnConcreteHeightMm,
      unit: "mm",
      startMm: { x: -colHalfX - 95, y: 0, z: 0 },
      endMm: { x: -colHalfX - 95, y: 0, z: spec.columnConcreteHeightMm },
      colorHex: "#a855f7",
    },
    {
      id: "dim-joint-core-height",
      label: "Düğüm Çekirdeği: 500 mm (5×Ø10/100)",
      valueMm: 500,
      unit: "mm",
      startMm: { x: -colHalfX - 55, y: 0, z: spec.jointBottomZMm },
      endMm: { x: -colHalfX - 55, y: 0, z: spec.jointTopZMm },
      colorHex: "#22c55e",
    },
    {
      id: "dim-joint-beam-stub",
      label: `Saplanan Kiriş: ${spec.beamStubLengthMm} mm (300×500)`,
      valueMm: spec.beamStubLengthMm,
      unit: "mm",
      startMm: { x: beamStartFaceX, y: -beamHalfY - 60, z: spec.jointTopZMm + 45 },
      endMm: { x: beamEndX, y: -beamHalfY - 60, z: spec.jointTopZMm + 45 },
      colorHex: "#ec4899",
    },
  ];

  const parts: DetailPart[] = [
    ...concreteParts,
    ...longitudinalParts,
    ...anchoredBeamBars,
    ...columnStirrupParts,
    ...beamStirrupParts,
  ];

  return {
    specVersion: 1,
    slug: "kolon-kiris-birlesimi",
    presetId: "d1-dis-birlesim",
    primaryAxis: "z",
    title: spec.title,
    subtitle: spec.subtitle,
    boundsMm: {
      min: {
        x: -colHalfX - 110,
        y: -colHalfY - 80,
        z: 0,
      },
      max: {
        x: beamEndX,
        y: colHalfY + 80,
        z: spec.columnConcreteHeightMm + spec.columnDowelLengthMm,
      },
    },
    concreteBoundsMm: {
      min: { x: -colHalfX, y: -colHalfY, z: 0 },
      max: {
        x: beamEndX,
        y: colHalfY,
        z: spec.columnConcreteHeightMm,
      },
    },
    dimensionsMm: {
      widthX: spec.columnWidthMm,
      depthY: spec.columnDepthMm,
      concreteHeightZ: spec.columnConcreteHeightMm,
      dowelLengthZ: spec.columnDowelLengthMm,
      totalHeightZ: spec.columnConcreteHeightMm + spec.columnDowelLengthMm,
      clearCover: spec.clearCoverMm,
      stirrupAxisOffsetFromFaceMm,
      cornerBarCenterOffsetFromFaceMm,
    },
    parts,
    zones: zoneSummaries,
    dimensionMarkers,
    counts: {
      totalParts: parts.length,
      concreteParts: concreteParts.length,
      longitudinalBars: longitudinalParts.length,
      stirrups: columnStirrupParts.length,
      dowels: anchoredBeamBars.length,
      crossties: beamStirrupParts.length,
    },
    assumptions: spec.assumptions,
  };
}
