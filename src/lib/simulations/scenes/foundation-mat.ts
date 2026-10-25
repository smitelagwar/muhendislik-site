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
} from "../core/types";
import { computeFootingGridCoordinatesMm } from "./footing-pad";

export interface MatFoundationSceneSpec {
  version: 1;
  slug: "radye-temel";
  presetId: "r1-radye-temel";
  title: string;
  subtitle: string;
  matWidthXMm: number;
  matDepthYMm: number;
  matHeightZMm: number;
  leanConcreteThicknessZMm: number;
  leanConcreteOverhangMm: number;
  columnWidthXMm: number;
  columnDepthYMm: number;
  columnStubHeightZMm: number;
  clearCoverBottomMm: number;
  clearCoverTopMm: number;
  clearCoverSideMm: number;
  meshBarDiameterMm: number;
  meshSpacingMm: number;
  meshEdgeHookHeightZMm: number;
  chairBarDiameterMm: number;
  dowelBarDiameterMm: number;
  dowelFootLengthMm: number;
  dowelBendRadiusMm: number;
  dowelTopElevationZMm: number;
  stirrupDiameterMm: number;
  assumptions: ReadonlyArray<AssumptionNote>;
}

export const R1_MAT_FOUNDATION_SPEC: MatFoundationSceneSpec = {
  version: 1,
  slug: "radye-temel",
  presetId: "r1-radye-temel",
  title: "R1 Eğitim Örneği — 2200×2200×600 mm Radye Temel, Sehpa ve Kolon Filizi",
  subtitle:
    "Alt iki yönlü ızgara (11Ø16 + 11Ø16), üst iki yönlü ızgara (11Ø16 + 11Ø16), 9Ø14 sehpa donatısı ve 8Ø20 L-bükümlü kolon filizi",
  matWidthXMm: 2200,
  matDepthYMm: 2200,
  matHeightZMm: 600,
  leanConcreteThicknessZMm: 100,
  leanConcreteOverhangMm: 100,
  columnWidthXMm: 450,
  columnDepthYMm: 450,
  columnStubHeightZMm: 600,
  clearCoverBottomMm: 50,
  clearCoverTopMm: 50,
  clearCoverSideMm: 50,
  meshBarDiameterMm: 16,
  meshSpacingMm: 200,
  meshEdgeHookHeightZMm: 160,
  chairBarDiameterMm: 14,
  dowelBarDiameterMm: 20,
  dowelFootLengthMm: 340,
  dowelBendRadiusMm: 40,
  dowelTopElevationZMm: 1350,
  stirrupDiameterMm: 10,
  assumptions: [
    {
      id: "radye-alt-ust-izgara-kotlari",
      label: "Radye Alt ve Üst İki Yönlü Izgara Eksen Kotları (Öğretim Varsayımı)",
      description:
        "Alt ve üst net pas payı c = 50 mm alınmıştır. Alt X çubuk ekseni Z = 50 + 16/2 = 58 mm, alt Y çubuk ekseni Z = 50 + 16 + 16/2 = 74 mm kotundadır. Üst ızgarada en dışta üst X çubuk ekseni Z = 600 - 50 - 16/2 = 542 mm, onun hemen altında üst Y çubuk ekseni Z = 600 - 50 - 16 - 16/2 = 526 mm kotundadır.",
      isTeachingAssumption: true,
    },
    {
      id: "radye-sehpa-ve-parca-siniri",
      label: "Sehpa Donatıları ve Sınırlı Boyutlu Radye Parçası (Öğretim Varsayımı)",
      description:
        "Bu sahne tüm bina radyesini veya zemin gerilmesi tasarımını değil, bir kolon çevresindeki 2200×2200×600 mm sınırlı radye temel parçasını temsil eder. 9 adet Ø14 sehpa (chair) donatısı alt ızgara (Z = 82 mm) üzerine basarak üst ızgarayı (Z = 518 mm alt yüz) beton dökümü sırasında kotunda taşır.",
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

function createBottomMeshBarAlongX(params: {
  xMinMm: number;
  xMaxMm: number;
  yMm: number;
  zAxisMm: number;
  hookHeightZMm: number;
}): PathSegment3Mm[] {
  const { xMinMm, xMaxMm, yMm, zAxisMm, hookHeightZMm } = params;
  const r = 24;
  return [
    makeLine(
      { x: xMinMm, y: yMm, z: zAxisMm + hookHeightZMm },
      { x: xMinMm, y: yMm, z: zAxisMm + r },
      "hook",
    ),
    makeArcXZ(
      { x: xMinMm + r, y: yMm, z: zAxisMm + r },
      r,
      Math.PI,
      Math.PI * 1.5,
      "bend",
    ),
    makeLine(
      { x: xMinMm + r, y: yMm, z: zAxisMm },
      { x: xMaxMm - r, y: yMm, z: zAxisMm },
      "leg",
    ),
    makeArcXZ(
      { x: xMaxMm - r, y: yMm, z: zAxisMm + r },
      r,
      Math.PI * 1.5,
      Math.PI * 2,
      "bend",
    ),
    makeLine(
      { x: xMaxMm, y: yMm, z: zAxisMm + r },
      { x: xMaxMm, y: yMm, z: zAxisMm + hookHeightZMm },
      "hook",
    ),
  ];
}

function createBottomMeshBarAlongY(params: {
  yMinMm: number;
  yMaxMm: number;
  xMm: number;
  zAxisMm: number;
  hookHeightZMm: number;
}): PathSegment3Mm[] {
  const { yMinMm, yMaxMm, xMm, zAxisMm, hookHeightZMm } = params;
  const r = 24;
  return [
    makeLine(
      { x: xMm, y: yMinMm, z: zAxisMm + hookHeightZMm },
      { x: xMm, y: yMinMm, z: zAxisMm + r },
      "hook",
    ),
    makeArcYZ(
      { x: xMm, y: yMinMm + r, z: zAxisMm + r },
      r,
      Math.PI,
      Math.PI * 1.5,
      "bend",
    ),
    makeLine(
      { x: xMm, y: yMinMm + r, z: zAxisMm },
      { x: xMm, y: yMaxMm - r, z: zAxisMm },
      "leg",
    ),
    makeArcYZ(
      { x: xMm, y: yMaxMm - r, z: zAxisMm + r },
      r,
      Math.PI * 1.5,
      Math.PI * 2,
      "bend",
    ),
    makeLine(
      { x: xMm, y: yMaxMm, z: zAxisMm + r },
      { x: xMm, y: yMaxMm, z: zAxisMm + hookHeightZMm },
      "hook",
    ),
  ];
}

function createTopMeshBarAlongX(params: {
  xMinMm: number;
  xMaxMm: number;
  yMm: number;
  zAxisMm: number;
  hookDropZMm: number;
}): PathSegment3Mm[] {
  const { xMinMm, xMaxMm, yMm, zAxisMm, hookDropZMm } = params;
  const r = 24;
  return [
    makeLine(
      { x: xMinMm, y: yMm, z: zAxisMm - hookDropZMm },
      { x: xMinMm, y: yMm, z: zAxisMm - r },
      "hook",
    ),
    makeArcXZ(
      { x: xMinMm + r, y: yMm, z: zAxisMm - r },
      r,
      Math.PI,
      Math.PI * 0.5,
      "bend",
    ),
    makeLine(
      { x: xMinMm + r, y: yMm, z: zAxisMm },
      { x: xMaxMm - r, y: yMm, z: zAxisMm },
      "leg",
    ),
    makeArcXZ(
      { x: xMaxMm - r, y: yMm, z: zAxisMm - r },
      r,
      Math.PI * 0.5,
      0,
      "bend",
    ),
    makeLine(
      { x: xMaxMm, y: yMm, z: zAxisMm - r },
      { x: xMaxMm, y: yMm, z: zAxisMm - hookDropZMm },
      "hook",
    ),
  ];
}

function createTopMeshBarAlongY(params: {
  yMinMm: number;
  yMaxMm: number;
  xMm: number;
  zAxisMm: number;
  hookDropZMm: number;
}): PathSegment3Mm[] {
  const { yMinMm, yMaxMm, xMm, zAxisMm, hookDropZMm } = params;
  const r = 24;
  return [
    makeLine(
      { x: xMm, y: yMinMm, z: zAxisMm - hookDropZMm },
      { x: xMm, y: yMinMm, z: zAxisMm - r },
      "hook",
    ),
    makeArcYZ(
      { x: xMm, y: yMinMm + r, z: zAxisMm - r },
      r,
      Math.PI,
      Math.PI * 0.5,
      "bend",
    ),
    makeLine(
      { x: xMm, y: yMinMm + r, z: zAxisMm },
      { x: xMm, y: yMaxMm - r, z: zAxisMm },
      "leg",
    ),
    makeArcYZ(
      { x: xMm, y: yMaxMm - r, z: zAxisMm - r },
      r,
      Math.PI * 0.5,
      0,
      "bend",
    ),
    makeLine(
      { x: xMm, y: yMaxMm, z: zAxisMm - r },
      { x: xMm, y: yMaxMm, z: zAxisMm - hookDropZMm },
      "hook",
    ),
  ];
}

/**
 * Radye sehpa (chair) donatısı:
 * Alt ızgara üst kotuna (zBottomFootMm = 89 mm) basan iki yatay ayak,
 * iki düşey/eğimli dikme ve üst ızgara Y çubuklarını alttan taşıyan üst tabla (zTopDeckMm = 511 mm).
 */
function createMatChairSegments(params: {
  centerXMm: number;
  centerYMm: number;
  zBottomFootMm: number;
  zTopDeckMm: number;
  topDeckSpanXMm: number;
  footLengthXMm: number;
}): PathSegment3Mm[] {
  const {
    centerXMm,
    centerYMm,
    zBottomFootMm,
    zTopDeckMm,
    topDeckSpanXMm,
    footLengthXMm,
  } = params;
  const halfDeck = topDeckSpanXMm / 2;
  const r = 22;

  const xLeftOuter = centerXMm - halfDeck - footLengthXMm;
  const xLeftPost = centerXMm - halfDeck;
  const xRightPost = centerXMm + halfDeck;
  const xRightOuter = centerXMm + halfDeck + footLengthXMm;

  return [
    // Sol alt yatay ayak
    makeLine(
      { x: xLeftOuter, y: centerYMm, z: zBottomFootMm },
      { x: xLeftPost - r, y: centerYMm, z: zBottomFootMm },
      "hook",
    ),
    makeArcXZ(
      { x: xLeftPost - r, y: centerYMm, z: zBottomFootMm + r },
      r,
      Math.PI * 1.5,
      Math.PI * 2,
      "bend",
    ),
    // Sol dikme
    makeLine(
      { x: xLeftPost, y: centerYMm, z: zBottomFootMm + r },
      { x: xLeftPost, y: centerYMm, z: zTopDeckMm - r },
      "leg",
    ),
    makeArcXZ(
      { x: xLeftPost + r, y: centerYMm, z: zTopDeckMm - r },
      r,
      Math.PI,
      Math.PI * 0.5,
      "bend",
    ),
    // Üst taşıyıcı tabla
    makeLine(
      { x: xLeftPost + r, y: centerYMm, z: zTopDeckMm },
      { x: xRightPost - r, y: centerYMm, z: zTopDeckMm },
      "leg",
    ),
    makeArcXZ(
      { x: xRightPost - r, y: centerYMm, z: zTopDeckMm - r },
      r,
      Math.PI * 0.5,
      0,
      "bend",
    ),
    // Sağ dikme
    makeLine(
      { x: xRightPost, y: centerYMm, z: zTopDeckMm - r },
      { x: xRightPost, y: centerYMm, z: zBottomFootMm + r },
      "leg",
    ),
    makeArcXZ(
      { x: xRightPost + r, y: centerYMm, z: zBottomFootMm + r },
      r,
      Math.PI,
      Math.PI * 1.5,
      "bend",
    ),
    // Sağ alt yatay ayak
    makeLine(
      { x: xRightPost + r, y: centerYMm, z: zBottomFootMm },
      { x: xRightOuter, y: centerYMm, z: zBottomFootMm },
      "hook",
    ),
  ];
}

function createColumnDowelWithBendSegments(params: {
  xMm: number;
  yMm: number;
  zFootAxisMm: number;
  zTopMm: number;
  bendRadiusMm: number;
  footLengthMm: number;
  footDirection: "+x" | "-x" | "+y" | "-y";
}): PathSegment3Mm[] {
  const {
    xMm,
    yMm,
    zFootAxisMm,
    zTopMm,
    bendRadiusMm: r,
    footLengthMm,
    footDirection,
  } = params;

  const verticalBottomZ = zFootAxisMm + r;
  const verticalLeg = makeLine(
    { x: xMm, y: yMm, z: zTopMm },
    { x: xMm, y: yMm, z: verticalBottomZ },
    "leg",
  );

  if (footDirection === "+x") {
    return [
      verticalLeg,
      makeArcXZ(
        { x: xMm + r, y: yMm, z: verticalBottomZ },
        r,
        Math.PI,
        Math.PI * 1.5,
        "bend",
      ),
      makeLine(
        { x: xMm + r, y: yMm, z: zFootAxisMm },
        { x: xMm + footLengthMm, y: yMm, z: zFootAxisMm },
        "hook",
      ),
    ];
  }

  if (footDirection === "-x") {
    return [
      verticalLeg,
      makeArcXZ(
        { x: xMm - r, y: yMm, z: verticalBottomZ },
        r,
        0,
        -Math.PI * 0.5,
        "bend",
      ),
      makeLine(
        { x: xMm - r, y: yMm, z: zFootAxisMm },
        { x: xMm - footLengthMm, y: yMm, z: zFootAxisMm },
        "hook",
      ),
    ];
  }

  if (footDirection === "+y") {
    return [
      verticalLeg,
      makeArcYZ(
        { x: xMm, y: yMm + r, z: verticalBottomZ },
        r,
        Math.PI,
        Math.PI * 1.5,
        "bend",
      ),
      makeLine(
        { x: xMm, y: yMm + r, z: zFootAxisMm },
        { x: xMm, y: yMm + footLengthMm, z: zFootAxisMm },
        "hook",
      ),
    ];
  }

  return [
    verticalLeg,
    makeArcYZ(
      { x: xMm, y: yMm - r, z: verticalBottomZ },
      r,
      0,
      -Math.PI * 0.5,
      "bend",
    ),
    makeLine(
      { x: xMm, y: yMm - r, z: zFootAxisMm },
      { x: xMm, y: yMm - footLengthMm, z: zFootAxisMm },
      "hook",
    ),
  ];
}

function createHorizontalStirrupLoop(params: {
  halfWidthXMm: number;
  halfDepthYMm: number;
  zMm: number;
  bendRadiusMm: number;
  hookLengthMm: number;
}): PathSegment3Mm[] {
  const { halfWidthXMm, halfDepthYMm, zMm, bendRadiusMm, hookLengthMm } = params;
  const r = Math.min(bendRadiusMm, 20);
  const cxRight = halfWidthXMm - r;
  const cxLeft = -halfWidthXMm + r;
  const cyFront = halfDepthYMm - r;
  const cyBack = -halfDepthYMm + r;

  const segments: PathSegment3Mm[] = [
    makeLine(
      { x: cxLeft, y: -halfDepthYMm, z: zMm },
      { x: cxRight, y: -halfDepthYMm, z: zMm },
      "leg",
    ),
    makeArcXY(
      { x: cxRight, y: cyBack, z: zMm },
      r,
      -Math.PI / 2,
      0,
      "bend",
    ),
    makeLine(
      { x: halfWidthXMm, y: cyBack, z: zMm },
      { x: halfWidthXMm, y: cyFront, z: zMm },
      "leg",
    ),
    makeArcXY(
      { x: cxRight, y: cyFront, z: zMm },
      r,
      0,
      Math.PI / 2,
      "bend",
    ),
    makeLine(
      { x: cxRight, y: halfDepthYMm, z: zMm },
      { x: cxLeft, y: halfDepthYMm, z: zMm },
      "leg",
    ),
    makeArcXY(
      { x: cxLeft, y: cyFront, z: zMm },
      r,
      Math.PI / 2,
      Math.PI,
      "bend",
    ),
    makeLine(
      { x: -halfWidthXMm, y: cyFront, z: zMm },
      { x: -halfWidthXMm, y: cyBack, z: zMm },
      "leg",
    ),
    makeArcXY(
      { x: cxLeft, y: cyBack, z: zMm },
      r,
      Math.PI,
      (3 * Math.PI) / 2,
      "bend",
    ),
  ];

  const diag = Math.SQRT1_2 * hookLengthMm;
  const hookCorner = {
    x: cxRight + r * Math.SQRT1_2,
    y: cyFront + r * Math.SQRT1_2,
    z: zMm,
  };
  segments.push(
    makeLine(
      hookCorner,
      {
        x: hookCorner.x - diag,
        y: hookCorner.y - diag,
        z: zMm - 10,
      },
      "hook",
    ),
  );
  return segments;
}

export function buildMatFoundationDetailModel(
  spec: MatFoundationSceneSpec = R1_MAT_FOUNDATION_SPEC,
): DetailModel {
  const parts: DetailPart[] = [];

  const halfMatX = spec.matWidthXMm / 2; // 1100 mm
  const halfMatY = spec.matDepthYMm / 2; // 1100 mm
  const matH = spec.matHeightZMm; // 600 mm
  const colTopZ = matH + spec.columnStubHeightZMm; // 1200 mm

  // 1. Radye temel beton plağı, merkez kolon boynu ve grobeton tabakası
  const matConcretePart: ConcreteVolumePart = {
    kind: "concrete",
    id: "concrete-footing-body",
    label: `Radye Temel Beton Plağı (${spec.matWidthXMm}×${spec.matDepthYMm}×${matH} mm)`,
    category: "concrete",
    layerId: "concrete",
    centerMm: { x: 0, y: 0, z: matH / 2 },
    sizeMm: {
      widthX: spec.matWidthXMm,
      depthY: spec.matDepthYMm,
      heightZ: matH,
    },
    summary: {
      whatIsIt: `${spec.matWidthXMm}×${spec.matDepthYMm} mm planda ve ${matH} mm kalınlığında sınırlı boyutlu betonarme radye temel parçası.`,
      whereInExample: `Z = 0..${matH} mm kotları arasında; alt/üst iki yönlü ızgaraları, sehpaları ve kolon filizi ankrajlarını sarar.`,
      role: "Üstyapı kolon yüklerini geniş yüzeysel temel plağına aktarır; hem açıklık hem kolon altı eğilme etkileri için alt ve üst iki yönlü donatı ağı içerir.",
      fieldNote:
        "Betonu gizleyerek alt ızgara (Z=58/74 mm), üst ızgara (Z=526/542 mm), sehpalar ve kolon filizi ayaklarının kademeli yerleşimini inceleyebilirsiniz.",
    },
  };

  const columnNeckPart: ConcreteVolumePart = {
    kind: "concrete",
    id: "concrete-column-body",
    label: `Merkez Kolon Boyun Bölgesi (${spec.columnWidthXMm}×${spec.columnDepthYMm}×${spec.columnStubHeightZMm} mm)`,
    category: "concrete",
    layerId: "concrete",
    centerMm: { x: 0, y: 0, z: matH + spec.columnStubHeightZMm / 2 },
    sizeMm: {
      widthX: spec.columnWidthXMm,
      depthY: spec.columnDepthYMm,
      heightZ: spec.columnStubHeightZMm,
    },
    summary: {
      whatIsIt: `Radye temel üst yüzünden (Z = ${matH} mm) yükselen ${spec.columnWidthXMm}×${spec.columnDepthYMm} mm kesitli kolon başlangıç bölgesi.`,
      whereInExample: `Planda merkezde (X = 0, Y = 0), düşeyde Z = ${matH}..${colTopZ} mm arasında.`,
      role: "Kolon filizlerinin üst kat kolon boyuna donatılarıyla bindirmeli ek yaptığı sargılı boyun bölgesini oluşturur.",
    },
  };

  const leanWidthX = spec.matWidthXMm + 2 * spec.leanConcreteOverhangMm;
  const leanDepthY = spec.matDepthYMm + 2 * spec.leanConcreteOverhangMm;
  const leanConcretePart: ConcreteVolumePart = {
    kind: "concrete",
    id: "concrete-lean-layer",
    label: `Temsilî Grobeton Tabakası (${leanWidthX}×${leanDepthY}×${spec.leanConcreteThicknessZMm} mm)`,
    category: "concrete",
    layerId: "concrete",
    centerMm: { x: 0, y: 0, z: -spec.leanConcreteThicknessZMm / 2 },
    sizeMm: {
      widthX: leanWidthX,
      depthY: leanDepthY,
      heightZ: spec.leanConcreteThicknessZMm,
    },
    summary: {
      whatIsIt: `Radye temel tabanının altında yer alan ${spec.leanConcreteThicknessZMm} mm kalınlığında temsilî grobeton (tesviye betonu) katmanı.`,
      whereInExample: `Z = -${spec.leanConcreteThicknessZMm}..0 mm kotları arasında.`,
      role: "Alt ızgara paspayı takozlarının oturacağı temiz ve düzgün uygulama yüzeyini sağlar (yalnız bağlam gösterimi).",
    },
  };

  parts.push(matConcretePart, columnNeckPart, leanConcretePart);

  // 2. Tekil temeldeki `computeFootingGridCoordinatesMm` üreticisini yeniden kullanarak 11×11 ızgara koordinatları
  const gridCoordsMm = computeFootingGridCoordinatesMm(
    spec.matWidthXMm, // 2200 mm -> [-1000, -800, -600, -400, -200, 0, 200, 400, 600, 800, 1000] (11 adet)
    spec.clearCoverSideMm,
    spec.meshSpacingMm,
  );

  const barMinCoord = -halfMatX + spec.clearCoverSideMm; // -1050 mm
  const barMaxCoord = halfMatX - spec.clearCoverSideMm; // +1050 mm

  // Kotlar:
  // Alt X: Z = 50 + 8 = 58 mm
  // Alt Y: Z = 50 + 16 + 8 = 74 mm
  // Üst X (en üst dış sıra): Z = 600 - 50 - 8 = 542 mm
  // Üst Y (üst iç sıra): Z = 600 - 50 - 16 - 8 = 526 mm
  const zBottomMeshXMm = spec.clearCoverBottomMm + spec.meshBarDiameterMm / 2; // 58 mm
  const zBottomMeshYMm =
    spec.clearCoverBottomMm + spec.meshBarDiameterMm + spec.meshBarDiameterMm / 2; // 74 mm
  const zTopMeshXMm = matH - spec.clearCoverTopMm - spec.meshBarDiameterMm / 2; // 542 mm
  const zTopMeshYMm =
    matH - spec.clearCoverTopMm - spec.meshBarDiameterMm - spec.meshBarDiameterMm / 2; // 526 mm

  // 2A. Alt İki Yönlü Izgara (X ve Y çubukları — `longitudinal` katmanı)
  gridCoordsMm.forEach((yMm, idx) => {
    parts.push({
      kind: "rebar",
      id: `mat-bottom-x-${idx + 1}`,
      label: `Radye Alt X Izgara Donatısı #${idx + 1} (Ø${spec.meshBarDiameterMm} · Y=${yMm} mm, Z=${zBottomMeshXMm} mm)`,
      category: "longitudinal",
      layerId: "longitudinal",
      diameterMm: spec.meshBarDiameterMm,
      zoneId: "radye-alt-izgara",
      elevationZMm: zBottomMeshXMm,
      colorHex: "#38bdf8",
      segments: createBottomMeshBarAlongX({
        xMinMm: barMinCoord,
        xMaxMm: barMaxCoord,
        yMm,
        zAxisMm: zBottomMeshXMm,
        hookHeightZMm: spec.meshEdgeHookHeightZMm,
      }),
      summary: {
        whatIsIt: `Radye alt donatı ağının X doğrultusundaki en alt sıra Ø${spec.meshBarDiameterMm} çubuğu (#${idx + 1}/${gridCoordsMm.length}).`,
        whereInExample: `Y = ${yMm} mm aksında, Z = ${zBottomMeshXMm} mm eksen kotunda (net alt pas payı c = ${spec.clearCoverBottomMm} mm).`,
        role: "Radye plağının kolon altı ve kenar bölgelerindeki alt yüz çekme gerilmelerini X doğrultusunda karşılar.",
      },
    });
  });

  gridCoordsMm.forEach((xMm, idx) => {
    parts.push({
      kind: "rebar",
      id: `mat-bottom-y-${idx + 1}`,
      label: `Radye Alt Y Izgara Donatısı #${idx + 1} (Ø${spec.meshBarDiameterMm} · X=${xMm} mm, Z=${zBottomMeshYMm} mm)`,
      category: "longitudinal",
      layerId: "longitudinal",
      diameterMm: spec.meshBarDiameterMm,
      zoneId: "radye-alt-izgara",
      elevationZMm: zBottomMeshYMm,
      colorHex: "#0ea5e9",
      segments: createBottomMeshBarAlongY({
        yMinMm: barMinCoord,
        yMaxMm: barMaxCoord,
        xMm,
        zAxisMm: zBottomMeshYMm,
        hookHeightZMm: spec.meshEdgeHookHeightZMm,
      }),
      summary: {
        whatIsIt: `Radye alt donatı ağının Y doğrultusundaki ikinci sıra Ø${spec.meshBarDiameterMm} çubuğu (#${idx + 1}/${gridCoordsMm.length}).`,
        whereInExample: `X = ${xMm} mm aksında, alt X sırasının bir çubuk çapı üzerinde Z = ${zBottomMeshYMm} mm eksen kotunda.`,
        role: "Alt X çubuklarıyla dik kesişerek radye alt iki yönlü hasır ağını tamamlar.",
      },
    });
  });

  // 2B. Üst İki Yönlü Izgara (X ve Y çubukları — `crosstie` katmanı ile ayrı açılıp kapatılabilir)
  gridCoordsMm.forEach((yMm, idx) => {
    parts.push({
      kind: "rebar",
      id: `mat-top-x-${idx + 1}`,
      label: `Radye Üst X Izgara Donatısı #${idx + 1} (Ø${spec.meshBarDiameterMm} · Y=${yMm} mm, Z=${zTopMeshXMm} mm)`,
      category: "crosstie",
      layerId: "crosstie",
      diameterMm: spec.meshBarDiameterMm,
      zoneId: "radye-ust-izgara",
      elevationZMm: zTopMeshXMm,
      colorHex: "#ec4899",
      segments: createTopMeshBarAlongX({
        xMinMm: barMinCoord,
        xMaxMm: barMaxCoord,
        yMm,
        zAxisMm: zTopMeshXMm,
        hookDropZMm: spec.meshEdgeHookHeightZMm,
      }),
      summary: {
        whatIsIt: `Radye üst donatı ağının X doğrultusundaki en üst sıra Ø${spec.meshBarDiameterMm} çubuğu (#${idx + 1}/${gridCoordsMm.length}).`,
        whereInExample: `Y = ${yMm} mm aksında, Z = ${zTopMeshXMm} mm eksen kotunda (radye üst yüzünden c = ${spec.clearCoverTopMm} mm aşağıda).`,
        role: "Radye plağının açıklık bölgelerinde zemin itkisiyle oluşan üst yüz çekme etkilerini ve rötre/sıcaklık etkilerini X doğrultusunda karşılar.",
      },
    });
  });

  gridCoordsMm.forEach((xMm, idx) => {
    parts.push({
      kind: "rebar",
      id: `mat-top-y-${idx + 1}`,
      label: `Radye Üst Y Izgara Donatısı #${idx + 1} (Ø${spec.meshBarDiameterMm} · X=${xMm} mm, Z=${zTopMeshYMm} mm)`,
      category: "crosstie",
      layerId: "crosstie",
      diameterMm: spec.meshBarDiameterMm,
      zoneId: "radye-ust-izgara",
      elevationZMm: zTopMeshYMm,
      colorHex: "#f472b6",
      segments: createTopMeshBarAlongY({
        yMinMm: barMinCoord,
        yMaxMm: barMaxCoord,
        xMm,
        zAxisMm: zTopMeshYMm,
        hookDropZMm: spec.meshEdgeHookHeightZMm,
      }),
      summary: {
        whatIsIt: `Radye üst donatı ağının Y doğrultusundaki alt sıra Ø${spec.meshBarDiameterMm} çubuğu (#${idx + 1}/${gridCoordsMm.length}).`,
        whereInExample: `X = ${xMm} mm aksında, üst X sırasının hemen altında Z = ${zTopMeshYMm} mm eksen kotunda; sehpa tablalarının üzerine oturur.`,
        role: "Sehpa donatılarının üzerine doğrudan oturarak hem kendini hem de üzerindeki üst X sırasını Z = 526/542 mm kotunda taşır.",
      },
    });
  });

  // 3. Sehpa (Chair) Donatıları (3×3 = 9 adet Ø14 sehpa — `stirrup` katmanı içinde)
  const chairGridCoordsMm = [-650, 0, 650] as const;
  const zChairBottomFootMm =
    zBottomMeshYMm + spec.meshBarDiameterMm / 2 + spec.chairBarDiameterMm / 2; // 74 + 8 + 7 = 89 mm
  const zChairTopDeckMm =
    zTopMeshYMm - spec.meshBarDiameterMm / 2 - spec.chairBarDiameterMm / 2; // 526 - 8 - 7 = 511 mm

  let chairSeq = 0;
  for (const cy of chairGridCoordsMm) {
    for (const cx of chairGridCoordsMm) {
      chairSeq += 1;
      parts.push({
        kind: "rebar",
        id: `mat-chair-${chairSeq}-x${cx}-y${cy}`,
        label: `Radye Sehpa Donatısı #${chairSeq} (Ø${spec.chairBarDiameterMm} · X=${cx}, Y=${cy} mm)`,
        category: "stirrup",
        layerId: "stirrup",
        diameterMm: spec.chairBarDiameterMm,
        zoneId: "radye-sehpa-ve-filiz",
        elevationZMm: Math.round((zChairBottomFootMm + zChairTopDeckMm) / 2),
        colorHex: "#eab308",
        segments: createMatChairSegments({
          centerXMm: cx,
          centerYMm: cy,
          zBottomFootMm: zChairBottomFootMm,
          zTopDeckMm: zChairTopDeckMm,
          topDeckSpanXMm: 260,
          footLengthXMm: 110,
        }),
        summary: {
          whatIsIt: `Alt ızgara (Z = ${zChairBottomFootMm} mm) ile üst ızgara (Z = ${zChairTopDeckMm} mm) arasında çalışan Ø${spec.chairBarDiameterMm} bükümlü sehpa (chair) donatısı.`,
          whereInExample: `Planda (X = ${cx} mm, Y = ${cy} mm) noktasında; alt ızgara üzerine basar ve üst Y ızgarasını alttan taşır.`,
          role: "Üst radye donatı ağının beton dökümü ve işçilik sırasında aşağı çökmesini önleyerek tasarım kotunda kalmasını sağlar.",
        },
      });
    }
  }

  // 4. Merkez Kolon Filizi Grubu (8Ø20 L-bükümlü kolon filizi — `dowel` katmanı)
  const colClearCoverMm = 40;
  const colStirrupOffset = colClearCoverMm + spec.stirrupDiameterMm / 2; // 45 mm
  const colHalfStirrupX = spec.columnWidthXMm / 2 - colStirrupOffset; // 225 - 45 = 180 mm
  const colHalfStirrupY = spec.columnDepthYMm / 2 - colStirrupOffset; // 180 mm
  const colBarOffset =
    colClearCoverMm + spec.stirrupDiameterMm + spec.dowelBarDiameterMm / 2; // 40 + 10 + 10 = 60 mm
  const colCornerCoord = spec.columnWidthXMm / 2 - colBarOffset; // 225 - 60 = 165 mm
  const zDowelFootAxisMm =
    zBottomMeshYMm + spec.meshBarDiameterMm / 2 + spec.dowelBarDiameterMm / 2; // 74 + 8 + 10 = 92 mm

  const dowelDefinitions: ReadonlyArray<{
    suffix: string;
    labelPos: string;
    xMm: number;
    yMm: number;
    footDirection: "+x" | "-x" | "+y" | "-y";
  }> = [
    {
      suffix: "sw",
      labelPos: "Sol-Ön Köşe",
      xMm: -colCornerCoord,
      yMm: -colCornerCoord,
      footDirection: "-x",
    },
    {
      suffix: "se",
      labelPos: "Sağ-Ön Köşe",
      xMm: colCornerCoord,
      yMm: -colCornerCoord,
      footDirection: "+x",
    },
    {
      suffix: "ne",
      labelPos: "Sağ-Arka Köşe",
      xMm: colCornerCoord,
      yMm: colCornerCoord,
      footDirection: "+x",
    },
    {
      suffix: "nw",
      labelPos: "Sol-Arka Köşe",
      xMm: -colCornerCoord,
      yMm: colCornerCoord,
      footDirection: "-x",
    },
    {
      suffix: "s-mid",
      labelPos: "Ön Kenar Orta",
      xMm: 0,
      yMm: -colCornerCoord,
      footDirection: "-y",
    },
    {
      suffix: "e-mid",
      labelPos: "Sağ Kenar Orta",
      xMm: colCornerCoord,
      yMm: 0,
      footDirection: "+x",
    },
    {
      suffix: "n-mid",
      labelPos: "Arka Kenar Orta",
      xMm: 0,
      yMm: colCornerCoord,
      footDirection: "+y",
    },
    {
      suffix: "w-mid",
      labelPos: "Sol Kenar Orta",
      xMm: -colCornerCoord,
      yMm: 0,
      footDirection: "-x",
    },
  ];

  dowelDefinitions.forEach((def, index) => {
    parts.push({
      kind: "rebar",
      id: `mat-dowel-bar-${index + 1}-${def.suffix}`,
      label: `Radye Kolon Filizi #${index + 1} (${def.labelPos} · Ø${spec.dowelBarDiameterMm})`,
      category: "dowel",
      layerId: "dowel",
      diameterMm: spec.dowelBarDiameterMm,
      zoneId: "radye-sehpa-ve-filiz",
      bendRadiusMm: spec.dowelBendRadiusMm,
      hookAngleDeg: 90,
      hookLengthMm: spec.dowelFootLengthMm,
      colorHex: "#f59e0b",
      segments: createColumnDowelWithBendSegments({
        xMm: def.xMm,
        yMm: def.yMm,
        zFootAxisMm: zDowelFootAxisMm,
        zTopMm: spec.dowelTopElevationZMm,
        bendRadiusMm: spec.dowelBendRadiusMm,
        footLengthMm: spec.dowelFootLengthMm,
        footDirection: def.footDirection,
      }),
      summary: {
        whatIsIt: `Radye temel alt ızgarası üzerine Z = ${zDowelFootAxisMm} mm kotunda oturan, r = ${spec.dowelBendRadiusMm} mm 90° yay bükümlü ve ${spec.dowelFootLengthMm} mm yatay ayaklı Ø${spec.dowelBarDiameterMm} kolon filizi.`,
        whereInExample: `Merkez kolon çevresinde (${def.labelPos}: X = ${def.xMm} mm, Y = ${def.yMm} mm), Z = ${zDowelFootAxisMm}..${spec.dowelTopElevationZMm} mm arasında.`,
        role: "Üst kat kolon boyuna donatılarını radye temel içine kenetler ve eksenel/moment kuvvetlerini temel plağına aktarır.",
      },
    });
  });

  // 5. Radye İçi Filiz Kılavuz Etriyeleri + Kolon Boyun Etriyeleri (10 adet)
  const stirrupElevationsMm = [
    180, 340, 500, 650, 750, 850, 950, 1050, 1150,
  ] as const;

  stirrupElevationsMm.forEach((zMm, idx) => {
    const insideMat = zMm <= matH;
    parts.push({
      kind: "rebar",
      id: `mat-column-stirrup-${idx + 1}-z${zMm}`,
      label: `${insideMat ? "Radye İçi Filiz Kılavuz Etriyesi" : "Kolon Boyun Sarılma Etriyesi"} #${idx + 1} (Z=${zMm} mm)`,
      category: "stirrup",
      layerId: "stirrup",
      diameterMm: spec.stirrupDiameterMm,
      zoneId: "radye-sehpa-ve-filiz",
      elevationZMm: zMm,
      bendRadiusMm: 20,
      hookAngleDeg: 135,
      hookLengthMm: 85,
      colorHex: insideMat ? "#22c55e" : "#06b6d4",
      segments: createHorizontalStirrupLoop({
        halfWidthXMm: colHalfStirrupX,
        halfDepthYMm: colHalfStirrupY,
        zMm,
        bendRadiusMm: 20,
        hookLengthMm: 85,
      }),
      summary: {
        whatIsIt: `8Ø${spec.dowelBarDiameterMm} kolon filizini Z = ${zMm} mm kotunda saran Ø${spec.stirrupDiameterMm} kapalı etriye.`,
        whereInExample: `Z = ${zMm} mm kotunda (${insideMat ? "radye plağı içinde" : "kolon boyun bölgesinde"}).`,
        role: insideMat
          ? "Beton dökümü sırasında kolon filizlerinin plandaki tasarım konumunu korur."
          : "Radye üst yüzünden çıkan kolon boyun bölgesinde sarılma sürekliliğini sağlar.",
      },
    });
  });

  const zones: DetailZoneSummary[] = [
    {
      id: "radye-alt-izgara",
      label: `Radye Alt İki Yönlü Izgara (${gridCoordsMm.length}Ø${spec.meshBarDiameterMm} X + ${gridCoordsMm.length}Ø${spec.meshBarDiameterMm} Y)`,
      zStartMm: 0,
      zEndMm: 240,
      lengthMm: 240,
      spacingMm: spec.meshSpacingMm,
      stirrupCount: 0,
      crosstieCount: 0,
      colorHex: "#38bdf8",
      description: `Alt X sırası Z = ${zBottomMeshXMm} mm ve alt Y sırası Z = ${zBottomMeshYMm} mm eksen kotlarında iki yönlü radye alt donatı ağı.`,
    },
    {
      id: "radye-ust-izgara",
      label: `Radye Üst İki Yönlü Izgara (${gridCoordsMm.length}Ø${spec.meshBarDiameterMm} X + ${gridCoordsMm.length}Ø${spec.meshBarDiameterMm} Y)`,
      zStartMm: 360,
      zEndMm: matH,
      lengthMm: 240,
      spacingMm: spec.meshSpacingMm,
      stirrupCount: 0,
      crosstieCount: gridCoordsMm.length * 2,
      colorHex: "#ec4899",
      description: `Üst Y sırası Z = ${zTopMeshYMm} mm ve üst X sırası Z = ${zTopMeshXMm} mm eksen kotlarında iki yönlü radye üst donatı ağı.`,
    },
    {
      id: "radye-sehpa-ve-filiz",
      label: `Sehpa Donatıları (${chairSeq}Ø${spec.chairBarDiameterMm}) ve Kolon Filiz Grubu (8Ø${spec.dowelBarDiameterMm})`,
      zStartMm: zBottomMeshYMm,
      zEndMm: spec.dowelTopElevationZMm,
      lengthMm: spec.dowelTopElevationZMm - zBottomMeshYMm,
      spacingMm: 100,
      stirrupCount: chairSeq + stirrupElevationsMm.length,
      crosstieCount: 0,
      colorHex: "#eab308",
      description: `Üst donatı ağını taşıyan ${chairSeq} adet Ø${spec.chairBarDiameterMm} sehpa donatısı ile merkez kolonun 8Ø${spec.dowelBarDiameterMm} L-bükümlü filizleri ve kılavuz etriyeleri.`,
    },
  ];

  const dimensionMarkers: DimensionMarkerMm[] = [
    {
      id: "dim-mat-width-x",
      label: `Radye Parçası Genişliği B = ${spec.matWidthXMm} mm`,
      valueMm: spec.matWidthXMm,
      unit: "mm",
      startMm: { x: -halfMatX, y: -halfMatY - 120, z: 0 },
      endMm: { x: halfMatX, y: -halfMatY - 120, z: 0 },
      colorHex: "#a855f7",
    },
    {
      id: "dim-mat-height-z",
      label: `Radye Plak Kalınlığı H = ${matH} mm`,
      valueMm: matH,
      unit: "mm",
      startMm: { x: halfMatX + 120, y: 0, z: 0 },
      endMm: { x: halfMatX + 120, y: 0, z: matH },
      colorHex: "#38bdf8",
    },
    {
      id: "dim-mat-chair-height",
      label: `Sehpa Yüksekliği (${zChairBottomFootMm}..${zChairTopDeckMm} mm)`,
      valueMm: zChairTopDeckMm - zChairBottomFootMm,
      unit: "mm",
      startMm: { x: -halfMatX - 120, y: 0, z: zChairBottomFootMm },
      endMm: { x: -halfMatX - 120, y: 0, z: zChairTopDeckMm },
      colorHex: "#eab308",
    },
  ];

  const concreteParts = parts.filter((p) => p.kind === "concrete").length;
  const longitudinalBars = parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.layerId === "longitudinal",
  ).length;
  const stirrups = parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.layerId === "stirrup",
  ).length;
  const dowels = parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.layerId === "dowel",
  ).length;
  const crossties = parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.layerId === "crosstie",
  ).length;

  return {
    specVersion: 1,
    slug: "radye-temel",
    presetId: spec.presetId,
    primaryAxis: "z",
    title: spec.title,
    subtitle: spec.subtitle,
    boundsMm: {
      min: {
        x: -leanWidthX / 2,
        y: -leanDepthY / 2,
        z: -spec.leanConcreteThicknessZMm,
      },
      max: {
        x: leanWidthX / 2,
        y: leanDepthY / 2,
        z: spec.dowelTopElevationZMm,
      },
    },
    concreteBoundsMm: {
      min: { x: -halfMatX, y: -halfMatY, z: 0 },
      max: { x: halfMatX, y: halfMatY, z: colTopZ },
    },
    dimensionsMm: {
      widthX: spec.matWidthXMm,
      depthY: spec.matDepthYMm,
      concreteHeightZ: matH,
      dowelLengthZ: spec.dowelTopElevationZMm - matH,
      totalHeightZ: spec.dowelTopElevationZMm,
      clearCover: spec.clearCoverBottomMm,
      stirrupAxisOffsetFromFaceMm: zBottomMeshXMm,
      cornerBarCenterOffsetFromFaceMm: zTopMeshXMm,
    },
    parts,
    zones,
    dimensionMarkers,
    counts: {
      totalParts: parts.length,
      concreteParts,
      longitudinalBars,
      stirrups,
      dowels,
      crossties,
    },
    assumptions: spec.assumptions,
  };
}
