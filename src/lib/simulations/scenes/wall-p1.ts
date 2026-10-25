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

export interface ShearWallSceneSpec {
  version: 1;
  slug: "perde-detayi";
  presetId: "p1-perde";
  title: string;
  subtitle: string;
  wallLengthXMm: number;
  wallThicknessYMm: number;
  wallConcreteHeightZMm: number;
  wallDowelLengthZMm: number;
  boundaryLengthXMm: number;
  clearCoverMm: number;
  boundaryLongitudinalDiaMm: number;
  webVerticalDiaMm: number;
  webHorizontalDiaMm: number;
  boundaryStirrupDiaMm: number;
  crosstieDiaMm: number;
  assumptions: ReadonlyArray<AssumptionNote>;
}

export const P1_SHEAR_WALL_SPEC: ShearWallSceneSpec = {
  version: 1,
  slug: "perde-detayi",
  presetId: "p1-perde",
  title: "P1 Eğitim Örneği — 2400×300 mm İki Yüzlü Betonarme Perde Duvar",
  subtitle:
    "Ön ve arka iki yüz gövde donatı ağları (düşey Ø12 + yatay Ø12 U-kancalı), sol/sağ 450×300 mm sargılı perde uç bölgeleri (6Ø20 + 6Ø20) ve yüzler arası Ø10 çirozlar",
  wallLengthXMm: 2400,
  wallThicknessYMm: 300,
  wallConcreteHeightZMm: 3000,
  wallDowelLengthZMm: 600,
  boundaryLengthXMm: 450,
  clearCoverMm: 30,
  boundaryLongitudinalDiaMm: 20,
  webVerticalDiaMm: 12,
  webHorizontalDiaMm: 12,
  boundaryStirrupDiaMm: 10,
  crosstieDiaMm: 10,
  assumptions: [
    {
      id: "perde-olcu-genelleme-uyarisi",
      label: "Örnek Boyutların Eğitim Amaçlı Seçimi (Bütün Perdeler Bu Ölçüyle Yapılmaz)",
      description:
        "Bu P1 sahnesindeki 2400×300 mm perde boyutu ve 450×300 mm uç bölgesi uzunluğu yalnızca 3B/2B okumayı netleştirmek için seçilmiş bir eğitim örneğidir. Bütün betonarme perdelerin bu ölçü, uç bölgesi uzunluğu veya donatı oranıyla yapılacağı izlenimi çıkarılmamalıdır; gerçek perde boyutları ve kritik perde yüksekliği bina hesabına ve yönetmelik koşullarına göre belirlenir.",
      isTeachingAssumption: true,
    },
    {
      id: "iki-yuz-donati-agi-kabulu",
      label: "Ön ve Arka İki Yüz Gövde Donatı Ağları (Çift Sıra Düzen)",
      description:
        "Perde gövdesinde tek sıra donatı bulunmaz: ön yüzde (Y = -114 mm yatay, Y = -102 mm düşey) ve arka yüzde (Y = +114 mm yatay, Y = +102 mm düşey) olmak üzere iki ayrı donatı ağı yer alır. Yatay gövde çubukları perde uç bölgelerini dıştan U-biçiminde sararak 90° bükümle diğer yüze kenetlenir.",
      isTeachingAssumption: true,
    },
    {
      id: "uc-bolge-ve-baglayici-cirozlar",
      label: "Perde Uç Bölgeleri ve Yüzler Arası Bağlayıcı Çirozlar (Öğretim Varsayımı)",
      description:
        "Sol (-1200..-750 mm) ve sağ (+750..+1200 mm) perde uç bölgelerinde 6'şar adet Ø20 boyuna çubuk ve Ø10 kapalı uç etriyeleri; orta gövdede ise ön ve arka yüz ağlarını birbirine bağlayan 135°/90° kancalı Ø10 bağlayıcı çirozlar tanımlanmıştır.",
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

function buildBoundaryStirrupSegmentsXY(options: {
  xMinMm: number;
  xMaxMm: number;
  yMinMm: number;
  yMaxMm: number;
  bendRadiusMm: number;
  hookLengthMm: number;
  zMm: number;
}): PathSegment3Mm[] {
  const {
    xMinMm,
    xMaxMm,
    yMinMm,
    yMaxMm,
    bendRadiusMm: r,
    hookLengthMm,
    zMm,
  } = options;

  const xL = xMinMm + r;
  const xR = xMaxMm - r;
  const yB = yMinMm + r;
  const yT = yMaxMm - r;
  const diag = Math.SQRT1_2;

  const hook1Start: Point3Mm = {
    x: xR + r * diag,
    y: yT + r * diag,
    z: zMm + 2,
  };
  const hook1End: Point3Mm = {
    x: Number((hook1Start.x - hookLengthMm * diag).toFixed(2)),
    y: Number((hook1Start.y - hookLengthMm * diag).toFixed(2)),
    z: zMm + 2,
  };

  const hook2Start: Point3Mm = {
    x: xR + r * diag,
    y: yT + r * diag,
    z: zMm - 2,
  };
  const hook2End: Point3Mm = {
    x: Number((hook2Start.x - hookLengthMm * 0.78).toFixed(2)),
    y: Number((hook2Start.y - hookLengthMm * 0.56).toFixed(2)),
    z: zMm - 2,
  };

  return [
    makeLine({ x: xL, y: yMinMm, z:Z(zMm) }, { x: xR, y: yMinMm, z: Z(zMm) }, "leg"),
    makeArcXY({ x: xR, y: yB, z: Z(zMm) }, r, -Math.PI / 2, 0, "bend"),
    makeLine({ x: xMaxMm, y: yB, z: Z(zMm) }, { x: xMaxMm, y: yT, z: Z(zMm) }, "leg"),
    makeArcXY({ x: xR, y: yT, z: Z(zMm) }, r, 0, Math.PI / 2, "hook-bend"),
    makeLine({ x: xR, y: yMaxMm, z: Z(zMm) }, { x: xL, y: yMaxMm, z: Z(zMm) }, "leg"),
    makeArcXY({ x: xL, y: yT, z: Z(zMm) }, r, Math.PI / 2, Math.PI, "bend"),
    makeLine({ x: xMinMm, y: yT, z: Z(zMm) }, { x: xMinMm, y: yB, z: Z(zMm) }, "leg"),
    makeArcXY(
      { x: xL, y: yB, z: Z(zMm) },
      r,
      Math.PI,
      (3 * Math.PI) / 2,
      "bend",
    ),
    makeLine(hook1Start, hook1End, "hook"),
    makeLine(hook2Start, hook2End, "hook"),
  ];
}

function Z(v: number): number {
  return v;
}

/**
 * Perde yüzündeki yatay gövde donatısı: Boydan boya uzanır ve sol/sağ uçlarda 90° bükülerek perde kalınlığı içine döner.
 */
function buildWebHorizontalBarSegmentsXY(params: {
  xHalfSpanMm: number;
  yFaceMm: number;
  yReturnEndMm: number;
  bendRadiusMm: number;
  zMm: number;
  face: "front" | "back";
}): PathSegment3Mm[] {
  const {
    xHalfSpanMm,
    yFaceMm,
    yReturnEndMm,
    bendRadiusMm: r,
    zMm,
    face,
  } = params;

  const xLeftCenter = -xHalfSpanMm + r;
  const xRightCenter = xHalfSpanMm - r;
  const dirY = face === "front" ? 1 : -1;
  const yArcCenter = yFaceMm + dirY * r;

  return [
    makeLine(
      { x: -xHalfSpanMm, y: yReturnEndMm, z: zMm },
      { x: -xHalfSpanMm, y: yArcCenter, z: zMm },
      "hook",
    ),
    makeArcXY(
      { x: xLeftCenter, y: yArcCenter, z: zMm },
      r,
      Math.PI,
      face === "front" ? (3 * Math.PI) / 2 : Math.PI / 2,
      "hook-bend",
    ),
    makeLine(
      { x: xLeftCenter, y: yFaceMm, z: zMm },
      { x: xRightCenter, y: yFaceMm, z: zMm },
      "leg",
    ),
    makeArcXY(
      { x: xRightCenter, y: yArcCenter, z: zMm },
      r,
      face === "front" ? -Math.PI / 2 : Math.PI / 2,
      0,
      "hook-bend",
    ),
    makeLine(
      { x: xHalfSpanMm, y: yArcCenter, z: zMm },
      { x: xHalfSpanMm, y: yReturnEndMm, z: zMm },
      "hook",
    ),
  ];
}

/**
 * Ön ve arka yüz donatı ağlarını Y doğrultusunda birbirine bağlayan 135°/90° kancalı perde çirozu.
 */
function buildWallCrosstieSegmentsXY(params: {
  xMm: number;
  yFrontMm: number;
  yBackMm: number;
  zMm: number;
  bendRadiusMm: number;
}): PathSegment3Mm[] {
  const { xMm, yFrontMm, yBackMm, zMm, bendRadiusMm: r } = params;
  return [
    // Ön yüzde 135° deprem kancası
    makeLine(
      { x: xMm + 48, y: yFrontMm + 36, z: zMm },
      { x: xMm + r, y: yFrontMm, z: zMm },
      "hook",
    ),
    makeArcXY({ x: xMm + r, y: yFrontMm + r, z: zMm }, r, -Math.PI / 2, Math.PI, "hook-bend"),
    // Perde kalınlığı boyunca (ön yüzden arka yüze) ana çiroz gövdesi
    makeLine(
      { x: xMm, y: yFrontMm + r, z: zMm },
      { x: xMm, y: yBackMm - r, z: zMm },
      "leg",
    ),
    makeArcXY({ x: xMm + r, y: yBackMm - r, z: zMm }, r, Math.PI, Math.PI / 2, "hook-bend"),
    // Arka yüzde kanca ucu
    makeLine(
      { x: xMm + r, y: yBackMm, z: zMm },
      { x: xMm + 52, y: yBackMm - 18, z: zMm },
      "hook",
    ),
  ];
}

export function buildShearWallDetailModel(
  spec: ShearWallSceneSpec = P1_SHEAR_WALL_SPEC,
): DetailModel {
  const halfLenX = spec.wallLengthXMm / 2; // 1200 mm
  const halfThickY = spec.wallThicknessYMm / 2; // 150 mm
  const totalBarTopZ = spec.wallConcreteHeightZMm + spec.wallDowelLengthZMm; // 3600 mm

  // İki yüz konumları:
  // Ön yüz (Y < 0) ve Arka yüz (Y > 0) açıkça ayrılır; tek sıra donatı izlenimi kesinlikle oluşmaz.
  const yFrontHorizontal = -(halfThickY - spec.clearCoverMm - spec.webHorizontalDiaMm / 2); // -114 mm
  const yBackHorizontal = halfThickY - spec.clearCoverMm - spec.webHorizontalDiaMm / 2; // +114 mm
  const yFrontVertical = yFrontHorizontal + spec.webHorizontalDiaMm / 2 + spec.webVerticalDiaMm / 2; // -102 mm
  const yBackVertical = yBackHorizontal - (spec.webHorizontalDiaMm / 2 + spec.webVerticalDiaMm / 2); // +102 mm

  const yBoundaryBar = halfThickY - (spec.clearCoverMm + spec.boundaryStirrupDiaMm + spec.boundaryLongitudinalDiaMm / 2); // 100 mm -> Y = ±100 mm

  // 1) Beton Parçası: Boşluksuz Perde Duvar Gövdesi (2400×300×3000 mm)
  const concreteParts: ConcreteVolumePart[] = [
    {
      kind: "concrete",
      id: "concrete-column-body",
      label: `Boşluksuz Betonarme Perde Gövdesi (${spec.wallLengthXMm}×${spec.wallThicknessYMm} mm · H=${spec.wallConcreteHeightZMm} mm)`,
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: 0,
        y: 0,
        z: spec.wallConcreteHeightZMm / 2,
      },
      sizeMm: {
        widthX: spec.wallLengthXMm,
        depthY: spec.wallThicknessYMm,
        heightZ: spec.wallConcreteHeightZMm,
      },
      summary: {
        whatIsIt: `${spec.wallLengthXMm} mm uzunluğunda, ${spec.wallThicknessYMm} mm kalınlığında ve ${spec.wallConcreteHeightZMm} mm kat yüksekliğinde boşluksuz betonarme perde duvar gövdesi.`,
        whereInExample: `Sol uç bölgesi (X = -1200..-750 mm), orta perde gövdesi (X = -750..+750 mm) ve sağ uç bölgesi (X = +750..+1200 mm) olarak üç yapısal bölgeden oluşur.`,
        role: "Deprem ve rüzgâr gibi yatay yükler altında binaya yüksek yatay rijitlik, kesme dayanımı ve eğilme kapasitesi kazandırır.",
        fieldNote:
          "Bu 2400×300 mm boyutları yalnızca eğitim örneğidir; gerçek perde uzunluk, kalınlık ve uç bölgesi sınırları proje hesabına göre değişir.",
      },
    },
  ];

  // 2) Sol ve Sağ Perde Uç Bölgesi Boyuna Donatıları ("dowel" katmanı — 6Ø20 sol + 6Ø20 sağ = 12Ø20, Ön ve Arka yüzde 3'er çubuk)
  const leftBoundaryX = [-1145, -975, -805];
  const rightBoundaryX = [805, 975, 1145];
  const boundaryFaces: ReadonlyArray<{ faceId: "front" | "back"; faceLabel: string; yMm: number }> = [
    { faceId: "front", faceLabel: "Ön Yüz", yMm: -yBoundaryBar },
    { faceId: "back", faceLabel: "Arka Yüz", yMm: yBoundaryBar },
  ];

  const boundaryLongitudinalParts: RebarPathPart[] = [];
  let boundaryBarIndex = 0;

  for (const side of [
    { sideId: "left", sideLabel: "Sol Perde Uç Bölgesi", xs: leftBoundaryX, zoneId: "sol-uc-bolge" as const },
    { sideId: "right", sideLabel: "Sağ Perde Uç Bölgesi", xs: rightBoundaryX, zoneId: "sag-uc-bolge" as const },
  ]) {
    for (const face of boundaryFaces) {
      for (const xMm of side.xs) {
        boundaryBarIndex += 1;
        boundaryLongitudinalParts.push({
          kind: "rebar",
          id: `wall-boundary-bar-${boundaryBarIndex}-${side.sideId}-${face.faceId}-x${Math.abs(xMm)}`,
          label: `${side.sideLabel} Boyuna Donatısı #${boundaryBarIndex} (Ø${spec.boundaryLongitudinalDiaMm} — ${face.faceLabel}, X=${xMm} mm)`,
          category: "dowel",
          layerId: "dowel",
          diameterMm: spec.boundaryLongitudinalDiaMm,
          zoneId: side.zoneId,
          bendRadiusMm: 40,
          colorHex: "#f59e0b",
          segments: [
            makeLine(
              { x: xMm, y: face.yMm, z: 0 },
              { x: xMm, y: face.yMm, z: totalBarTopZ },
              "leg",
            ),
          ],
          summary: {
            whatIsIt: `${side.sideLabel} içinde ${face.faceLabel} (Y = ${face.yMm} mm) sırasına yerleştirilen Ø${spec.boundaryLongitudinalDiaMm} mm düşey uç bölgesi donatısı.`,
            whereInExample: `X = ${xMm} mm, Y = ${face.yMm} mm konumunda Z = 0..${totalBarTopZ} mm boyunca (600 mm üst kat filiz uzantısıyla) yükselir.`,
            role: "Perdenin kendi düzlemi içindeki tersinir deprem devrilme momentlerinden kaynaklanan uç çekme ve basınç kuvvetlerini karşılar.",
          },
        });
      }
    }
  }

  // 3) Perde Gövdesi Ön Yüz ve Arka Yüz Düşey + Yatay Ağ Donatıları ("longitudinal" katmanı)
  // Düşey gövde donatıları: X = -500, -250, 0, +250, +500 mm (5 ön yüz Y=-102 mm + 5 arka yüz Y=+102 mm = 10Ø12)
  const webVerticalXCoords = [-500, -250, 0, 250, 500];
  const webVerticalParts: RebarPathPart[] = [];
  let webVertIndex = 0;

  for (const face of [
    { faceId: "front" as const, faceLabel: "Ön Yüz (Y=-102 mm)", yMm: yFrontVertical, colorHex: "#38bdf8" },
    { faceId: "back" as const, faceLabel: "Arka Yüz (Y=+102 mm)", yMm: yBackVertical, colorHex: "#60a5fa" },
  ]) {
    for (const xMm of webVerticalXCoords) {
      webVertIndex += 1;
      webVerticalParts.push({
        kind: "rebar",
        id: `wall-web-vert-${webVertIndex}-${face.faceId}-x${xMm}`,
        label: `Gövde Düşey Donatısı #${webVertIndex} (Ø${spec.webVerticalDiaMm} — ${face.faceLabel}, X=${xMm} mm)`,
        category: "longitudinal",
        layerId: "longitudinal",
        diameterMm: spec.webVerticalDiaMm,
        zoneId: "perde-govde",
        bendRadiusMm: 24,
        colorHex: face.colorHex,
        segments: [
          makeLine(
            { x: xMm, y: face.yMm, z: 0 },
            { x: xMm, y: face.yMm, z: totalBarTopZ },
            "leg",
          ),
        ],
        summary: {
          whatIsIt: `Perde orta gövdesinde ${face.faceLabel} düzleminde yer alan Ø${spec.webVerticalDiaMm} mm düşey gövde donatısı.`,
          whereInExample: `Orta gövdede X = ${xMm} mm, Y = ${face.yMm} mm konumunda bulunur; karşısında diğer yüzdeki eşleniği yer alır (çift sıra gövde ağı).`,
          role: "Gövdede kayma-eğilme etkileşimini karşılar, rötre/sıcaklık çatlaklarını sınırlar ve yatay gövde çubuklarına mesnet oluşturur.",
        },
      });
    }
  }

  // Yatay gövde donatıları: 10 kotta (Z = 200, 500, ..., 2900 mm) Ön yüz (Y=-114 mm) ve Arka yüz (Y=+114 mm) U-kancalı çubuklar (20Ø12)
  const webElevationsZ = [200, 500, 800, 1100, 1400, 1700, 2000, 2300, 2600, 2900];
  const webHorizontalParts: RebarPathPart[] = [];
  let webHorizIndex = 0;

  for (const zMm of webElevationsZ) {
    for (const face of [
      {
        faceId: "front" as const,
        faceLabel: "Ön Yüz (Y=-114 mm)",
        yFaceMm: yFrontHorizontal,
        yReturnEndMm: 60,
        colorHex: "#94a3b8",
      },
      {
        faceId: "back" as const,
        faceLabel: "Arka Yüz (Y=+114 mm)",
        yFaceMm: yBackHorizontal,
        yReturnEndMm: -60,
        colorHex: "#cbd5e1",
      },
    ]) {
      webHorizIndex += 1;
      webHorizontalParts.push({
        kind: "rebar",
        id: `wall-web-horiz-${webHorizIndex}-${face.faceId}-z${zMm}`,
        label: `Gövde Yatay Donatısı #${webHorizIndex} (Ø${spec.webHorizontalDiaMm} — ${face.faceLabel}, Z=${zMm} mm)`,
        category: "longitudinal",
        layerId: "longitudinal",
        diameterMm: spec.webHorizontalDiaMm,
        zoneId: "perde-govde",
        elevationZMm: zMm,
        bendRadiusMm: 24,
        hookAngleDeg: 90,
        hookLengthMm: 150,
        colorHex: face.colorHex,
        segments: buildWebHorizontalBarSegmentsXY({
          xHalfSpanMm: halfLenX - spec.clearCoverMm - spec.webHorizontalDiaMm / 2, // 1164 mm
          yFaceMm: face.yFaceMm,
          yReturnEndMm: face.yReturnEndMm,
          bendRadiusMm: 24,
          zMm,
          face: face.faceId,
        }),
        summary: {
          whatIsIt: `Perde boyunca ${face.faceLabel} düzleminde uzanan ve uç bölgeleri dıştan U-kancayla saran Ø${spec.webHorizontalDiaMm} mm yatay gövde donatısı.`,
          whereInExample: `Z = ${zMm} mm kotunda, Y = ${face.yFaceMm} mm yüzünde X = -1164..+1164 mm boyunca uzanır ve iki uçta 90° bükülerek uç bölge çekirdeğine kenetlenir.`,
          role: "Perde gövdesindeki yatay kesme kuvvetlerini (diyagonal çekme gerilmelerini) doğrudan karşılar.",
        },
      });
    }
  }

  // 4) Sol ve Sağ Perde Uç Bölgesi Kapalı Sargı Etriyeleri ("stirrup" katmanı — 14 sol + 14 sağ = 28 adet Ø10)
  const boundaryStirrupElevationsZ = [
    100, 300, 500, 700, 900, 1100, 1300, 1500, 1700, 1900, 2100, 2300, 2500,
    2750,
  ];
  const boundaryStirrupParts: RebarPathPart[] = [];
  let stirrupIndex = 0;

  for (const side of [
    {
      sideId: "left",
      zoneId: "sol-uc-bolge" as const,
      label: "Sol Perde Uç Bölgesi",
      xMinMm: -1165,
      xMaxMm: -785,
      colorHex: "#06b6d4",
    },
    {
      sideId: "right",
      zoneId: "sag-uc-bolge" as const,
      label: "Sağ Perde Uç Bölgesi",
      xMinMm: 785,
      xMaxMm: 1165,
      colorHex: "#22c55e",
    },
  ]) {
    for (const zMm of boundaryStirrupElevationsZ) {
      stirrupIndex += 1;
      boundaryStirrupParts.push({
        kind: "rebar",
        id: `wall-boundary-stirrup-${stirrupIndex}-${side.sideId}-z${zMm}`,
        label: `${side.label} Kapalı Uç Etriyesi #${stirrupIndex} (Z=${zMm} mm)`,
        category: "stirrup",
        layerId: "stirrup",
        diameterMm: spec.boundaryStirrupDiaMm,
        zoneId: side.zoneId,
        elevationZMm: zMm,
        bendRadiusMm: 20,
        hookAngleDeg: 135,
        hookLengthMm: 85,
        colorHex: side.colorHex,
        segments: buildBoundaryStirrupSegmentsXY({
          xMinMm: side.xMinMm,
          xMaxMm: side.xMaxMm,
          yMinMm: -115,
          yMaxMm: 115,
          bendRadiusMm: 20,
          hookLengthMm: 85,
          zMm,
        }),
        summary: {
          whatIsIt: `${side.label} içindeki 6Ø20 boyuna çubuğu ön ve arka yüzleriyle birlikte kuşatan Ø${spec.boundaryStirrupDiaMm} mm kapalı uç bölgesi etriyesi.`,
          whereInExample: `${side.label} içinde Z = ${zMm} mm kotunda (X = ${side.xMinMm}..${side.xMaxMm} mm, Y = -115..+115 mm).`,
          role: "Yüksek basınç zorlaması altındaki perde uç bölgesi çekirdek betonunu sararak ezilmeyi ve boyuna donatı burkulmasını önler.",
        },
      });
    }
  }

  // 5) Ön ve Arka Yüzleri Birbirine Bağlayan Gövde & Uç Bölgesi Çirozları ("crosstie" katmanı — 20 adet Ø10)
  const crosstieElevationsZ = [300, 900, 1500, 2100, 2750];
  const crosstieXCoords = [-975, -250, 250, 975];
  const crosstieParts: RebarPathPart[] = [];
  let crosstieIndex = 0;

  for (const zMm of crosstieElevationsZ) {
    for (const xMm of crosstieXCoords) {
      crosstieIndex += 1;
      const inBoundary = Math.abs(xMm) > 750;
      crosstieParts.push({
        kind: "rebar",
        id: `wall-crosstie-${crosstieIndex}-x${xMm}-z${zMm}`,
        label: `Perde Yüzler Arası Bağlayıcı Çiroz #${crosstieIndex} (X=${xMm} mm, Z=${zMm} mm)`,
        category: "crosstie",
        layerId: "crosstie",
        diameterMm: spec.crosstieDiaMm,
        zoneId: inBoundary
          ? xMm < 0
            ? "sol-uc-bolge"
            : "sag-uc-bolge"
          : "perde-govde",
        elevationZMm: zMm,
        bendRadiusMm: 18,
        hookAngleDeg: 135,
        hookLengthMm: 65,
        colorHex: "#ec4899",
        segments: buildWallCrosstieSegmentsXY({
          xMm,
          yFrontMm: yFrontHorizontal,
          yBackMm: yBackHorizontal,
          zMm,
          bendRadiusMm: 18,
        }),
        summary: {
          whatIsIt: `Perdenin ön yüz (Y = ${yFrontHorizontal} mm) ve arka yüz (Y = +${yBackHorizontal} mm) donatı ağlarını kalınlık doğrultusunda birbirine bağlayan Ø${spec.crosstieDiaMm} mm bağlayıcı çiroz.`,
          whereInExample: `X = ${xMm} mm, Z = ${zMm} mm düğüm noktasında iki yüz ağını birbirine kenetler.`,
          role: "İki yüzdeki donatı ağlarının birlikte çalışmasını sağlar, beton dökümünde ağ aralığını korur ve ince perde gövdesinde yanal burkulmayı engeller.",
        },
      });
    }
  }

  const zoneSummaries: DetailZoneSummary[] = [
    {
      id: "sol-uc-bolge",
      label: "Sol Perde Uç Bölgesi",
      zStartMm: 0,
      zEndMm: spec.wallConcreteHeightZMm,
      lengthMm: spec.boundaryLengthXMm,
      spacingMm: 200,
      stirrupCount: 14,
      crosstieCount: 5,
      colorHex: "#06b6d4",
      description:
        "X = -1200..-750 mm (450×300 mm) sol uç bölgesi: 6Ø20 boyuna çubuk + 14 adet Ø10 kapalı uç etriyesi",
    },
    {
      id: "perde-govde",
      label: "İki Yüzlü Perde Gövdesi",
      zStartMm: 0,
      zEndMm: spec.wallConcreteHeightZMm,
      lengthMm: spec.wallLengthXMm - spec.boundaryLengthXMm * 2,
      spacingMm: 250,
      stirrupCount: 0,
      crosstieCount: 10,
      colorHex: "#38bdf8",
      description:
        "X = -750..+750 mm (1500×300 mm) orta gövde: Ön ve arka iki yüzde 10Ø12 düşey + 20Ø12 yatay ağ ve 10 adet bağlayıcı çiroz",
    },
    {
      id: "sag-uc-bolge",
      label: "Sağ Perde Uç Bölgesi",
      zStartMm: 0,
      zEndMm: spec.wallConcreteHeightZMm,
      lengthMm: spec.boundaryLengthXMm,
      spacingMm: 200,
      stirrupCount: 14,
      crosstieCount: 5,
      colorHex: "#22c55e",
      description:
        "X = +750..+1200 mm (450×300 mm) sağ uç bölgesi: 6Ø20 boyuna çubuk + 14 adet Ø10 kapalı uç etriyesi",
    },
  ];

  const dimensionMarkers: DimensionMarkerMm[] = [
    {
      id: "dim-wall-length-x",
      label: `Perde Uzunluğu Lw = ${spec.wallLengthXMm} mm`,
      valueMm: spec.wallLengthXMm,
      unit: "mm",
      startMm: { x: -halfLenX, y: -halfThickY - 75, z: 0 },
      endMm: { x: halfLenX, y: -halfThickY - 75, z: 0 },
      colorHex: "#a855f7",
    },
    {
      id: "dim-wall-left-boundary",
      label: `Sol Uç Bölge: ${spec.boundaryLengthXMm} mm`,
      valueMm: spec.boundaryLengthXMm,
      unit: "mm",
      startMm: { x: -halfLenX, y: -halfThickY - 45, z: spec.wallConcreteHeightZMm + 40 },
      endMm: {
        x: -halfLenX + spec.boundaryLengthXMm,
        y: -halfThickY - 45,
        z: spec.wallConcreteHeightZMm + 40,
      },
      colorHex: "#06b6d4",
    },
    {
      id: "dim-wall-right-boundary",
      label: `Sağ Uç Bölge: ${spec.boundaryLengthXMm} mm`,
      valueMm: spec.boundaryLengthXMm,
      unit: "mm",
      startMm: {
        x: halfLenX - spec.boundaryLengthXMm,
        y: -halfThickY - 45,
        z: spec.wallConcreteHeightZMm + 40,
      },
      endMm: { x: halfLenX, y: -halfThickY - 45, z: spec.wallConcreteHeightZMm + 40 },
      colorHex: "#22c55e",
    },
  ];

  const longitudinalParts: RebarPathPart[] = [
    ...webVerticalParts,
    ...webHorizontalParts,
  ];
  const parts: DetailPart[] = [
    ...concreteParts,
    ...longitudinalParts,
    ...boundaryLongitudinalParts,
    ...boundaryStirrupParts,
    ...crosstieParts,
  ];

  return {
    specVersion: 1,
    slug: "perde-detayi",
    presetId: "p1-perde",
    primaryAxis: "z",
    title: spec.title,
    subtitle: spec.subtitle,
    boundsMm: {
      min: {
        x: -halfLenX - 80,
        y: -halfThickY - 80,
        z: 0,
      },
      max: {
        x: halfLenX + 80,
        y: halfThickY + 80,
        z: totalBarTopZ,
      },
    },
    concreteBoundsMm: {
      min: { x: -halfLenX, y: -halfThickY, z: 0 },
      max: {
        x: halfLenX,
        y: halfThickY,
        z: spec.wallConcreteHeightZMm,
      },
    },
    dimensionsMm: {
      widthX: spec.wallLengthXMm,
      depthY: spec.wallThicknessYMm,
      concreteHeightZ: spec.wallConcreteHeightZMm,
      dowelLengthZ: spec.wallDowelLengthZMm,
      totalHeightZ: totalBarTopZ,
      clearCover: spec.clearCoverMm,
      stirrupAxisOffsetFromFaceMm: Math.abs(yFrontHorizontal),
      cornerBarCenterOffsetFromFaceMm: Math.abs(yFrontVertical),
    },
    parts,
    zones: zoneSummaries,
    dimensionMarkers,
    counts: {
      totalParts: parts.length,
      concreteParts: concreteParts.length,
      longitudinalBars: longitudinalParts.length,
      stirrups: boundaryStirrupParts.length,
      dowels: boundaryLongitudinalParts.length,
      crossties: crosstieParts.length,
    },
    assumptions: spec.assumptions,
  };
}
