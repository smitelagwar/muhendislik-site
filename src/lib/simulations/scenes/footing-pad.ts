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

export interface PadFootingSceneSpec {
  version: 1;
  slug: "tekil-temel";
  presetId: "t1-tekil-temel";
  title: string;
  subtitle: string;
  footingWidthXMm: number;
  footingDepthYMm: number;
  footingHeightZMm: number;
  leanConcreteThicknessZMm: number;
  leanConcreteOverhangMm: number;
  columnWidthXMm: number;
  columnDepthYMm: number;
  columnStubHeightZMm: number;
  clearCoverBottomMm: number;
  clearCoverSideMm: number;
  meshBarDiameterMm: number;
  meshSpacingMm: number;
  meshHookHeightZMm: number;
  dowelBarDiameterMm: number;
  dowelFootLengthMm: number;
  dowelBendRadiusMm: number;
  dowelTopElevationZMm: number;
  stirrupDiameterMm: number;
  assumptions: ReadonlyArray<AssumptionNote>;
}

export const T1_PAD_FOOTING_SPEC: PadFootingSceneSpec = {
  version: 1,
  slug: "tekil-temel",
  presetId: "t1-tekil-temel",
  title: "T1 Eğitim Örneği — 1800×1800×500 mm Tekil Temel ve Kolon Filizi",
  subtitle:
    "Gerçek yükseklik farklı X/Y alt donatı ızgarası (9Ø16 + 9Ø16), L-bükümlü kolon filizleri (8Ø20), paspayı takozları ve grobeton",
  footingWidthXMm: 1800,
  footingDepthYMm: 1800,
  footingHeightZMm: 500,
  leanConcreteThicknessZMm: 100,
  leanConcreteOverhangMm: 100,
  columnWidthXMm: 400,
  columnDepthYMm: 400,
  columnStubHeightZMm: 700,
  clearCoverBottomMm: 50,
  clearCoverSideMm: 50,
  meshBarDiameterMm: 16,
  meshSpacingMm: 200,
  meshHookHeightZMm: 140,
  dowelBarDiameterMm: 20,
  dowelFootLengthMm: 320,
  dowelBendRadiusMm: 40,
  dowelTopElevationZMm: 1350,
  stirrupDiameterMm: 10,
  assumptions: [
    {
      id: "izgara-kot-farki-kabulu",
      label: "Alt X ve Y Donatı Katmanlarının Gerçek Kot Farkı (Öğretim Varsayımı)",
      description:
        "Net temel alt pas payı c = 50 mm (paspayı takozlarıyla sağlanır) alınmıştır. Alt X doğrultusu çubuk ekseni Z_x = 50 + 16/2 = 58 mm kotunda; onun üzerine dik oturan alt Y doğrultusu çubuk ekseni ise bir çubuk çapı yukarıda Z_y = 50 + 16 + 16/2 = 74 mm kotundadır (ΔZ = 16 mm gerçek yükseklik farkı).",
      isTeachingAssumption: true,
    },
    {
      id: "filiz-bukum-ve-ayak-kabulu",
      label: "Kolon Filizi 90° Yay Bükümü ve Yatay Ayak Boyu (Öğretim Varsayımı)",
      description:
        "Kolon filizleri (8Ø20) alt Y ızgarasının (üst yüzü Z = 82 mm) üzerine Z = 92 mm eksen kotunda oturur; köşede düz çizgiyle sahte kırılma yerine r = 40 mm gerçek 90° büküm yayı (arc) ve dışa doğru 320 mm yatay filiz ayağı ile modellenmiştir.",
      isTeachingAssumption: true,
    },
    {
      id: "grobeton-ve-takoz-baglami",
      label: "Temsilî Grobeton ve Paspayı Takozları (Bağlam Gösterimi)",
      description:
        "Z = -100..0 mm arasındaki 100 mm kalınlıklı grobeton tabakası ve Z = 0..50 mm paspayı takozları yalnız uygulama ve bağlam gösterimidir; zemin taşıma gücü veya zımbalama hesabı bu sahnenin kapsamı dışındadır.",
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

/**
 * Tekil temel ve radye temel sahnelerinde ortak kullanılan ortogonal ızgara koordinat üreticisi.
 */
export function computeFootingGridCoordinatesMm(
  spanMm: number,
  clearCoverSideMm: number,
  spacingMm: number,
): number[] {
  const usableSpan = spanMm - clearCoverSideMm * 2;
  const intervalCount = Math.max(1, Math.floor(usableSpan / spacingMm));
  const actualSpan = intervalCount * spacingMm;
  const startCoord = -actualSpan / 2;
  const coords: number[] = [];
  for (let i = 0; i <= intervalCount; i++) {
    coords.push(Number((startCoord + i * spacingMm).toFixed(2)));
  }
  return coords;
}

/**
 * X doğrultusunda uzanan ve iki ucunda 90° yukarı dönen temel ızgara çubuğu segmentleri.
 */
function buildMeshBarXSegments(params: {
  halfSpanXMm: number;
  yMm: number;
  zAxisMm: number;
  bendRadiusMm: number;
  hookHeightZMm: number;
}): PathSegment3Mm[] {
  const {
    halfSpanXMm,
    yMm,
    zAxisMm,
    bendRadiusMm: r,
    hookHeightZMm,
  } = params;

  const xLeftCenter = -halfSpanXMm + r;
  const xRightCenter = halfSpanXMm - r;
  const zArcCenter = zAxisMm + r;
  const zHookTop = zArcCenter + hookHeightZMm;

  return [
    makeLine(
      { x: -halfSpanXMm, y: yMm, z: zHookTop },
      { x: -halfSpanXMm, y: yMm, z: zArcCenter },
      "hook",
    ),
    makeArcXZ(
      { x: xLeftCenter, y: yMm, z: zArcCenter },
      r,
      Math.PI,
      (3 * Math.PI) / 2,
      "hook-bend",
    ),
    makeLine(
      { x: xLeftCenter, y: yMm, z: zAxisMm },
      { x: xRightCenter, y: yMm, z: zAxisMm },
      "leg",
    ),
    makeArcXZ(
      { x: xRightCenter, y: yMm, z: zArcCenter },
      r,
      -Math.PI / 2,
      0,
      "hook-bend",
    ),
    makeLine(
      { x: halfSpanXMm, y: yMm, z: zArcCenter },
      { x: halfSpanXMm, y: yMm, z: zHookTop },
      "hook",
    ),
  ];
}

/**
 * Y doğrultusunda uzanan ve iki ucunda 90° yukarı dönen temel ızgara çubuğu segmentleri.
 */
function buildMeshBarYSegments(params: {
  halfSpanYMm: number;
  xMm: number;
  zAxisMm: number;
  bendRadiusMm: number;
  hookHeightZMm: number;
}): PathSegment3Mm[] {
  const {
    halfSpanYMm,
    xMm,
    zAxisMm,
    bendRadiusMm: r,
    hookHeightZMm,
  } = params;

  const yFrontCenter = -halfSpanYMm + r;
  const yBackCenter = halfSpanYMm - r;
  const zArcCenter = zAxisMm + r;
  const zHookTop = zArcCenter + hookHeightZMm;

  return [
    makeLine(
      { x: xMm, y: -halfSpanYMm, z: zHookTop },
      { x: xMm, y: -halfSpanYMm, z: zArcCenter },
      "hook",
    ),
    makeArcYZ(
      { x: xMm, y: yFrontCenter, z: zArcCenter },
      r,
      Math.PI,
      (3 * Math.PI) / 2,
      "hook-bend",
    ),
    makeLine(
      { x: xMm, y: yFrontCenter, z: zAxisMm },
      { x: xMm, y: yBackCenter, z: zAxisMm },
      "leg",
    ),
    makeArcYZ(
      { x: xMm, y: yBackCenter, z: zArcCenter },
      r,
      -Math.PI / 2,
      0,
      "hook-bend",
    ),
    makeLine(
      { x: xMm, y: halfSpanYMm, z: zArcCenter },
      { x: xMm, y: halfSpanYMm, z: zHookTop },
      "hook",
    ),
  ];
}

/**
 * Kolon filizi için alt ızgara üzerine oturan 90° yay bükümlü yatay ayak + düşey filiz gövdesi üretir.
 * Düz çizgiyle sahte kırılma yapılmaz; gerçek ArcSegment3Mm kullanılır.
 */
function buildColumnDowelWithFootSegments(params: {
  xMm: number;
  yMm: number;
  zFootAxisMm: number;
  zTopMm: number;
  bendRadiusMm: number;
  footLengthMm: number;
  footPlane: "xz" | "yz";
  footDir: 1 | -1;
}): PathSegment3Mm[] {
  const {
    xMm,
    yMm,
    zFootAxisMm,
    zTopMm,
    bendRadiusMm: r,
    footLengthMm,
    footPlane,
    footDir,
  } = params;

  const zArcCenter = zFootAxisMm + r;

  if (footPlane === "xz") {
    const xArcCenter = xMm + footDir * r;
    const xFootTip = xArcCenter + footDir * footLengthMm;
    return [
      // Yatay filiz ayağı (alt ızgara üstünde dışa doğru uzanır)
      makeLine(
        { x: xFootTip, y: yMm, z: zFootAxisMm },
        { x: xArcCenter, y: yMm, z: zFootAxisMm },
        "hook",
      ),
      // Gerçek 90° büküm yayı (X-Z düzleminde)
      makeArcXZ(
        { x: xArcCenter, y: yMm, z: zArcCenter },
        r,
        footDir > 0 ? Math.PI : -Math.PI / 2,
        footDir > 0 ? (3 * Math.PI) / 2 : 0,
        "hook-bend",
      ),
      // Düşey kolon filizi gövdesi
      makeLine(
        { x: xMm, y: yMm, z: zArcCenter },
        { x: xMm, y: yMm, z: zTopMm },
        "leg",
      ),
    ];
  }

  const yArcCenter = yMm + footDir * r;
  const yFootTip = yArcCenter + footDir * footLengthMm;
  return [
    makeLine(
      { x: xMm, y: yFootTip, z: zFootAxisMm },
      { x: xMm, y: yArcCenter, z: zFootAxisMm },
      "hook",
    ),
    makeArcYZ(
      { x: xMm, y: yArcCenter, z: zArcCenter },
      r,
      footDir > 0 ? Math.PI : -Math.PI / 2,
      footDir > 0 ? (3 * Math.PI) / 2 : 0,
      "hook-bend",
    ),
    makeLine(
      { x: xMm, y: yMm, z: zArcCenter },
      { x: xMm, y: yMm, z: zTopMm },
      "leg",
    ),
  ];
}

function buildDowelStirrupSegmentsXY(options: {
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

export function buildPadFootingDetailModel(
  spec: PadFootingSceneSpec = T1_PAD_FOOTING_SPEC,
): DetailModel {
  const halfFootingX = spec.footingWidthXMm / 2; // 900 mm
  const halfFootingY = spec.footingDepthYMm / 2; // 900 mm
  const meshHalfSpanX = halfFootingX - spec.clearCoverSideMm; // 850 mm
  const meshHalfSpanY = halfFootingY - spec.clearCoverSideMm; // 850 mm

  // Alt X ve Y donatı katmanlarının gerçek Z eksen kotları:
  // Alt X (altta): c_bottom + d/2 = 50 + 8 = 58 mm
  // Alt Y (üstte): c_bottom + d + d/2 = 50 + 16 + 8 = 74 mm (ΔZ = 16 mm gerçek kot farkı)
  const bottomMeshXZMm = spec.clearCoverBottomMm + spec.meshBarDiameterMm / 2; // 58 mm
  const bottomMeshYZMm =
    spec.clearCoverBottomMm +
    spec.meshBarDiameterMm +
    spec.meshBarDiameterMm / 2; // 74 mm
  const dowelFootAxisZMm =
    spec.clearCoverBottomMm +
    spec.meshBarDiameterMm * 2 +
    spec.dowelBarDiameterMm / 2; // 92 mm

  const colHalfX = spec.columnWidthXMm / 2; // 200 mm
  const colStirrupHalf = colHalfX - (30 + spec.stirrupDiameterMm / 2); // 165 mm
  const colBarCoord = colHalfX - 55; // 145 mm

  // 1) Beton Parçaları: Tekil Temel Gövdesi + Kolon Boyun Kısmı + Temsilî Grobeton + 4 Paspayı Takozu
  const spacerCoords: ReadonlyArray<{ id: string; x: number; y: number }> = [
    { id: "sw", x: -560, y: -560 },
    { id: "se", x: 560, y: -560 },
    { id: "ne", x: 560, y: 560 },
    { id: "nw", x: -560, y: 560 },
  ];

  const concreteParts: ConcreteVolumePart[] = [
    {
      kind: "concrete",
      id: "concrete-footing-body",
      label: `Tekil Temel Beton Gövdesi (${spec.footingWidthXMm}×${spec.footingDepthYMm}×${spec.footingHeightZMm} mm)`,
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: 0,
        y: 0,
        z: spec.footingHeightZMm / 2,
      },
      sizeMm: {
        widthX: spec.footingWidthXMm,
        depthY: spec.footingDepthYMm,
        heightZ: spec.footingHeightZMm,
      },
      summary: {
        whatIsIt: `${spec.footingWidthXMm}×${spec.footingDepthYMm} mm planda kare ve ${spec.footingHeightZMm} mm yüksekliğinde betonarme tekil temel plağı.`,
        whereInExample: `X = -${halfFootingX}..+${halfFootingX} mm, Y = -${halfFootingY}..+${halfFootingY} mm ve Z = 0..${spec.footingHeightZMm} mm hacminde grobeton üstüne oturur.`,
        role: "Kolondan gelen düşey yük ve devrilme momentlerini daha geniş bir taban alanına yayar; alt X/Y donatı ızgarasını ve filiz ankrajlarını c = 50 mm örtüyle korur.",
      },
    },
    {
      kind: "concrete",
      id: "concrete-column-body",
      label: `Kolon Boyun Gövdesi (${spec.columnWidthXMm}×${spec.columnDepthYMm} mm · Z=500..1200 mm)`,
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: 0,
        y: 0,
        z: spec.footingHeightZMm + spec.columnStubHeightZMm / 2,
      },
      sizeMm: {
        widthX: spec.columnWidthXMm,
        depthY: spec.columnDepthYMm,
        heightZ: spec.columnStubHeightZMm,
      },
      summary: {
        whatIsIt: `Temel üst yüzünden (Z = ${spec.footingHeightZMm} mm) yükselen ${spec.columnWidthXMm}×${spec.columnDepthYMm} mm kesitli betonarme kolon boyun bölgesi.`,
        whereInExample: `Temel merkezinde X = -200..+200 mm, Y = -200..+200 mm ve Z = ${spec.footingHeightZMm}..${spec.footingHeightZMm + spec.columnStubHeightZMm} mm aralığındadır.`,
        role: "Üst yapı kolon yüklerini tekil temele aktarır ve temel içinden çıkan 8Ø20 filizleri sarar.",
      },
    },
    {
      kind: "concrete",
      id: "concrete-lean-layer",
      label: `Temsilî Grobeton Tabakası (${spec.footingWidthXMm + spec.leanConcreteOverhangMm * 2}×${spec.footingDepthYMm + spec.leanConcreteOverhangMm * 2}×${spec.leanConcreteThicknessZMm} mm)`,
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: 0,
        y: 0,
        z: -spec.leanConcreteThicknessZMm / 2,
      },
      sizeMm: {
        widthX: spec.footingWidthXMm + spec.leanConcreteOverhangMm * 2,
        depthY: spec.footingDepthYMm + spec.leanConcreteOverhangMm * 2,
        heightZ: spec.leanConcreteThicknessZMm,
      },
      summary: {
        whatIsIt: `Temel tabanının altında Z = -${spec.leanConcreteThicknessZMm}..0 mm kotunda yer alan ${spec.leanConcreteThicknessZMm} mm kalınlıklı temsilî grobeton tabakası.`,
        whereInExample: `Temel tabanından her yönde ${spec.leanConcreteOverhangMm} mm taşarak 2000×2000 mm temiz uygulama yüzeyi oluşturur.`,
        role: "Yalnız bağlam gösterimidir: temel kalıbı ve paspayı takozları için düzgün, temiz bir tesviye yüzeyi sağlar; yapısal eğilme donatısı taşımaz.",
      },
    },
    ...spacerCoords.map((sp, idx): ConcreteVolumePart => ({
      kind: "concrete",
      id: `concrete-spacer-${idx + 1}-${sp.id}`,
      label: `Alt Paspayı Takozu #${idx + 1} (c = ${spec.clearCoverBottomMm} mm — ${sp.id.toUpperCase()})`,
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: sp.x,
        y: sp.y,
        z: spec.clearCoverBottomMm / 2,
      },
      sizeMm: {
        widthX: 90,
        depthY: 90,
        heightZ: spec.clearCoverBottomMm,
      },
      summary: {
        whatIsIt: `Grobeton üst yüzü (Z = 0 mm) ile alt X donatı katmanı (alt yüzü Z = ${spec.clearCoverBottomMm} mm) arasına yerleştirilen ${spec.clearCoverBottomMm} mm yüksekliğinde beton paspayı takozu.`,
        whereInExample: `Planda (X = ${sp.x} mm, Y = ${sp.y} mm) konumunda, Z = 0..${spec.clearCoverBottomMm} mm aralığındadır.`,
        role: "Temel alt ızgarasının beton dökümü sırasında grobetona değmesini önler ve net c = 50 mm pas payını garanti eder.",
      },
    })),
  ];

  // 2) Alt X Doğrultusu Izgara Donatıları ("longitudinal" katmanı — Z = 58 mm, 9Ø16)
  const gridCoords = computeFootingGridCoordinatesMm(
    spec.footingWidthXMm,
    spec.clearCoverSideMm,
    spec.meshSpacingMm,
  );

  const bottomMeshXParts: RebarPathPart[] = gridCoords.map((yMm, idx) => ({
    kind: "rebar",
    id: `footing-mesh-x-${idx + 1}`,
    label: `Temel Alt X Izgara Donatısı #${idx + 1} (Ø${spec.meshBarDiameterMm} — Y=${yMm} mm, Z=${bottomMeshXZMm} mm)`,
    category: "longitudinal",
    layerId: "longitudinal",
    diameterMm: spec.meshBarDiameterMm,
    zoneId: "temel-izgara",
    elevationZMm: bottomMeshXZMm,
    bendRadiusMm: 32,
    hookAngleDeg: 90,
    hookLengthMm: spec.meshHookHeightZMm,
    colorHex: "#38bdf8",
    segments: buildMeshBarXSegments({
      halfSpanXMm: meshHalfSpanX,
      yMm,
      zAxisMm: bottomMeshXZMm,
      bendRadiusMm: 32,
      hookHeightZMm: spec.meshHookHeightZMm,
    }),
    summary: {
      whatIsIt: `Tekil temel tabanında X doğrultusunda uzanan ve uçlarda 90° yukarı kancalanan Ø${spec.meshBarDiameterMm} mm alt ızgara çubuğu.`,
      whereInExample: `Y = ${yMm} mm aksında, Z = ${bottomMeshXZMm} mm eksen kotunda (paspayı takozlarının hemen üstünde, alt katman olarak) yer alır.`,
      role: "Zemin gerilmelerinden dolayı temel konsollarında oluşan pozitif eğilme çekme kuvvetlerini X doğrultusunda karşılar.",
    },
  }));

  // 3) Alt Y Doğrultusu Izgara Donatıları ("crosstie" katmanı — Z = 74 mm, 9Ø16)
  // Böylece Alt X (Z=58 mm) ve Alt Y (Z=74 mm) katmanları hem ayrı izole edilebilir hem de 16 mm kot farkı net görülür!
  const bottomMeshYParts: RebarPathPart[] = gridCoords.map((xMm, idx) => ({
    kind: "rebar",
    id: `footing-mesh-y-${idx + 1}`,
    label: `Temel Alt Y Izgara Donatısı #${idx + 1} (Ø${spec.meshBarDiameterMm} — X=${xMm} mm, Z=${bottomMeshYZMm} mm)`,
    category: "crosstie",
    layerId: "crosstie",
    diameterMm: spec.meshBarDiameterMm,
    zoneId: "temel-izgara",
    elevationZMm: bottomMeshYZMm,
    bendRadiusMm: 32,
    hookAngleDeg: 90,
    hookLengthMm: spec.meshHookHeightZMm,
    colorHex: "#ec4899",
    segments: buildMeshBarYSegments({
      halfSpanYMm: meshHalfSpanY,
      xMm,
      zAxisMm: bottomMeshYZMm,
      bendRadiusMm: 32,
      hookHeightZMm: spec.meshHookHeightZMm,
    }),
    summary: {
      whatIsIt: `Tekil temel tabanında Y doğrultusunda uzanan ve alt X çubuklarının üzerinde yer alan Ø${spec.meshBarDiameterMm} mm üst ızgara katmanı çubuğu.`,
      whereInExample: `X = ${xMm} mm aksında, Z = ${bottomMeshYZMm} mm eksen kotunda (alt X katmanından ΔZ = ${spec.meshBarDiameterMm} mm daha yukarıda) yer alır.`,
      role: "İki yönlü eğilme çalışan tekil temelde Y doğrultusundaki çekme kuvvetlerini taşır; X çubuklarıyla iç içe geçmeden gerçek üst kotta oturur.",
    },
  }));

  // 4) Kolon Filizleri (8Ø20 — 90° yay bükümlü ve 320 mm yatay ayaklı, "dowel" katmanı)
  const dowelConfigs: ReadonlyArray<{
    suffix: string;
    label: string;
    x: number;
    y: number;
    footPlane: "xz" | "yz";
    footDir: 1 | -1;
  }> = [
    {
      suffix: "sw",
      label: "Sol-Ön Köşe",
      x: -colBarCoord,
      y: -colBarCoord,
      footPlane: "xz",
      footDir: -1,
    },
    {
      suffix: "se",
      label: "Sağ-Ön Köşe",
      x: colBarCoord,
      y: -colBarCoord,
      footPlane: "xz",
      footDir: 1,
    },
    {
      suffix: "ne",
      label: "Sağ-Arka Köşe",
      x: colBarCoord,
      y: colBarCoord,
      footPlane: "xz",
      footDir: 1,
    },
    {
      suffix: "nw",
      label: "Sol-Arka Köşe",
      x: -colBarCoord,
      y: colBarCoord,
      footPlane: "xz",
      footDir: -1,
    },
    {
      suffix: "w-mid",
      label: "Sol Kenar Ortası",
      x: -colBarCoord,
      y: 0,
      footPlane: "xz",
      footDir: -1,
    },
    {
      suffix: "e-mid",
      label: "Sağ Kenar Ortası",
      x: colBarCoord,
      y: 0,
      footPlane: "xz",
      footDir: 1,
    },
    {
      suffix: "s-mid",
      label: "Ön Kenar Ortası",
      x: 0,
      y: -colBarCoord,
      footPlane: "yz",
      footDir: -1,
    },
    {
      suffix: "n-mid",
      label: "Arka Kenar Ortası",
      x: 0,
      y: colBarCoord,
      footPlane: "yz",
      footDir: 1,
    },
  ];

  const dowelParts: RebarPathPart[] = dowelConfigs.map((cfg, idx) => ({
    kind: "rebar",
    id: `footing-dowel-bar-${idx + 1}-${cfg.suffix}`,
    label: `Kolon Filizi & 90° Ayak #${idx + 1} (Ø${spec.dowelBarDiameterMm} — ${cfg.label})`,
    category: "dowel",
    layerId: "dowel",
    diameterMm: spec.dowelBarDiameterMm,
    zoneId: "filiz-sarilma",
    elevationZMm: dowelFootAxisZMm,
    bendRadiusMm: spec.dowelBendRadiusMm,
    hookAngleDeg: 90,
    hookLengthMm: spec.dowelFootLengthMm,
    colorHex: "#f59e0b",
    segments: buildColumnDowelWithFootSegments({
      xMm: cfg.x,
      yMm: cfg.y,
      zFootAxisMm: dowelFootAxisZMm,
      zTopMm: spec.dowelTopElevationZMm,
      bendRadiusMm: spec.dowelBendRadiusMm,
      footLengthMm: spec.dowelFootLengthMm,
      footPlane: cfg.footPlane,
      footDir: cfg.footDir,
    }),
    summary: {
      whatIsIt: `Temel alt ızgarası üzerine Z = ${dowelFootAxisZMm} mm kotunda oturan, r = ${spec.dowelBendRadiusMm} mm 90° büküm yaylı ve ${spec.dowelFootLengthMm} mm yatay ayaklı Ø${spec.dowelBarDiameterMm} mm kolon filizi.`,
      whereInExample: `Kolon kesitinde (X = ${cfg.x} mm, Y = ${cfg.y} mm) konumundan Z = ${spec.dowelTopElevationZMm} mm kotuna yükselir; yatay ayağı temel içine dışa doğru açılır.`,
      role: "Üst yapı kolon boyuna donatılarının temele kenetlenmesini ve kolon taban momentinin temel plağına aktarılmasını sağlar.",
      fieldNote:
        "Filiz bükümü düz çizgiyle keskin köşe yapılmaz; mandrel yarıçapıyla (r = 40 mm) bükülerek alt ızgara üstüne bağlanır.",
    },
  }));

  // 5) Temel İçi ve Kolon Boyun Bölgesi Filiz Sarılma Etriyeleri ("stirrup" katmanı — 9 adet Ø10)
  const stirrupElevations = [180, 310, 440, 560, 660, 760, 860, 960, 1060];
  const stirrupParts: RebarPathPart[] = stirrupElevations.map((zMm, idx) => {
    const inFooting = zMm < spec.footingHeightZMm;
    return {
      kind: "rebar",
      id: `footing-stirrup-${idx + 1}-z${zMm}`,
      label: inFooting
        ? `Temel İçi Filiz Kılavuz Etriyesi #${idx + 1} (Z=${zMm} mm)`
        : `Kolon Boyun Sarılma Etriyesi #${idx + 1} (Z=${zMm} mm)`,
      category: "stirrup",
      layerId: "stirrup",
      diameterMm: spec.stirrupDiameterMm,
      zoneId: "filiz-sarilma",
      elevationZMm: zMm,
      bendRadiusMm: 20,
      hookAngleDeg: 135,
      hookLengthMm: 85,
      colorHex: inFooting ? "#22c55e" : "#06b6d4",
      segments: buildDowelStirrupSegmentsXY({
        stirrupHalfX: colStirrupHalf,
        stirrupHalfY: colStirrupHalf,
        bendRadiusMm: 20,
        hookLengthMm: 85,
        zMm,
      }),
      summary: {
        whatIsIt: inFooting
          ? `Temel betonu içinde (Z = ${zMm} mm) kolon filizlerinin konumunu koruyan Ø${spec.stirrupDiameterMm} mm kapalı kılavuz/sarılma etriyesi.`
          : `Temel üst yüzünden başlayan kolon boyun sarılma bölgesinde (Z = ${zMm} mm) yer alan Ø${spec.stirrupDiameterMm} mm sıklaştırma etriyesi.`,
        whereInExample: `Z = ${zMm} mm kotunda 8Ø20 kolon filizini dıştan sarar.`,
        role: inFooting
          ? "Beton dökümü sırasında filizlerin kaymasını önler ve temel içi ankraj çekirdeğini kuşatır."
          : "Kolon taban plastik mafsal bölgesinde çekirdek betonunu sarar ve kesme kuvvetini karşılar.",
      },
    };
  });

  const zoneSummaries: DetailZoneSummary[] = [
    {
      id: "temel-izgara",
      label: "Temel Alt X/Y Izgara Bölgesi",
      zStartMm: 0,
      zEndMm: spec.footingHeightZMm,
      lengthMm: spec.footingHeightZMm,
      spacingMm: spec.meshSpacingMm,
      stirrupCount: 3,
      crosstieCount: bottomMeshYParts.length,
      colorHex: "#38bdf8",
      description:
        "Z = 0–500 mm tekil temel plağı: Alt X (Z=58 mm, 9Ø16) + Alt Y (Z=74 mm, 9Ø16) ızgarası ve 3 adet temel içi filiz etriyesi",
    },
    {
      id: "filiz-sarilma",
      label: "Kolon Boyun & Filiz Sarılma Bölgesi",
      zStartMm: spec.footingHeightZMm,
      zEndMm: spec.footingHeightZMm + spec.columnStubHeightZMm,
      lengthMm: spec.columnStubHeightZMm,
      spacingMm: 100,
      stirrupCount: 6,
      crosstieCount: 0,
      colorHex: "#06b6d4",
      description:
        "Z = 500–1200 mm kolon boyun sarılma bölgesi (6 adet Ø10/100 etriye) ve Z = 1350 mm kotuna uzanan 8Ø20 filizler",
    },
  ];

  const dimensionMarkers: DimensionMarkerMm[] = [
    {
      id: "dim-footing-width-x",
      label: `Temel Genişliği Lx = ${spec.footingWidthXMm} mm`,
      valueMm: spec.footingWidthXMm,
      unit: "mm",
      startMm: { x: -halfFootingX, y: -halfFootingY - 80, z: 0 },
      endMm: { x: halfFootingX, y: -halfFootingY - 80, z: 0 },
      colorHex: "#a855f7",
    },
    {
      id: "dim-footing-height-z",
      label: `Temel Yüksekliği H = ${spec.footingHeightZMm} mm`,
      valueMm: spec.footingHeightZMm,
      unit: "mm",
      startMm: { x: -halfFootingX - 80, y: 0, z: 0 },
      endMm: { x: -halfFootingX - 80, y: 0, z: spec.footingHeightZMm },
      colorHex: "#38bdf8",
    },
    {
      id: "dim-mesh-delta-z",
      label: `Alt X/Y Kot Farkı: Zx=${bottomMeshXZMm} / Zy=${bottomMeshYZMm} mm`,
      valueMm: bottomMeshYZMm - bottomMeshXZMm,
      unit: "mm",
      startMm: { x: halfFootingX + 60, y: 0, z: bottomMeshXZMm },
      endMm: { x: halfFootingX + 60, y: 0, z: bottomMeshYZMm },
      colorHex: "#ec4899",
    },
  ];

  const parts: DetailPart[] = [
    ...concreteParts,
    ...bottomMeshXParts,
    ...bottomMeshYParts,
    ...dowelParts,
    ...stirrupParts,
  ];

  return {
    specVersion: 1,
    slug: "tekil-temel",
    presetId: "t1-tekil-temel",
    primaryAxis: "z",
    title: spec.title,
    subtitle: spec.subtitle,
    boundsMm: {
      min: {
        x: -(halfFootingX + spec.leanConcreteOverhangMm),
        y: -(halfFootingY + spec.leanConcreteOverhangMm),
        z: -spec.leanConcreteThicknessZMm,
      },
      max: {
        x: halfFootingX + spec.leanConcreteOverhangMm,
        y: halfFootingY + spec.leanConcreteOverhangMm,
        z: spec.dowelTopElevationZMm,
      },
    },
    concreteBoundsMm: {
      min: {
        x: -halfFootingX,
        y: -halfFootingY,
        z: 0,
      },
      max: {
        x: halfFootingX,
        y: halfFootingY,
        z: spec.footingHeightZMm + spec.columnStubHeightZMm,
      },
    },
    dimensionsMm: {
      widthX: spec.footingWidthXMm,
      depthY: spec.footingDepthYMm,
      concreteHeightZ: spec.footingHeightZMm + spec.columnStubHeightZMm,
      dowelLengthZ:
        spec.dowelTopElevationZMm -
        (spec.footingHeightZMm + spec.columnStubHeightZMm),
      totalHeightZ: spec.dowelTopElevationZMm,
      clearCover: spec.clearCoverBottomMm,
      stirrupAxisOffsetFromFaceMm: bottomMeshXZMm,
      cornerBarCenterOffsetFromFaceMm: bottomMeshYZMm,
    },
    parts,
    zones: zoneSummaries,
    dimensionMarkers,
    counts: {
      totalParts: parts.length,
      concreteParts: concreteParts.length,
      longitudinalBars: bottomMeshXParts.length,
      stirrups: stirrupParts.length,
      dowels: dowelParts.length,
      crossties: bottomMeshYParts.length,
    },
    assumptions: spec.assumptions,
  };
}
