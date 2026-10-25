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

export interface BeamSceneSpec {
  version: 1;
  slug: "kiris-detayi";
  presetId: "k1-referans";
  title: string;
  subtitle: string;
  clearSpanLengthMm: number;
  supportWidthMm: number;
  beamWidthBMm: number;
  beamHeightHMm: number;
  clearCoverMm: number;
  bottomBarDiameterMm: number;
  bottomBarCount: 3;
  topHangerBarDiameterMm: number;
  topHangerBarCount: 2;
  topSupportExtraBarDiameterMm: number;
  topSupportExtraLengthMm: number;
  stirrupDiameterMm: number;
  stirrupBendRadiusMm: number;
  stirrupHookLengthMm: number;
  zones: ReadonlyArray<{
    id: Extract<
      StirrupZoneId,
      "sol-mesnet-sarilma" | "aciklik-bolgesi" | "sag-mesnet-sarilma"
    >;
    label: string;
    xStartMm: number;
    xEndMm: number;
    spacingMm: number;
    colorHex: string;
    description: string;
  }>;
  assumptions: ReadonlyArray<AssumptionNote>;
}

export const K1_BEAM_SPEC: BeamSceneSpec = {
  version: 1,
  slug: "kiris-detayi",
  presetId: "k1-referans",
  title: "K1 Eğitim Örneği — 300×500 mm Çerçeve Kirişi",
  subtitle:
    "4000 mm net açıklık, 3Ø16 alt donatı, 2Ø14 üst montaj + mesnet ilave donatıları ve bölgesel Ø10 etriyeler",
  clearSpanLengthMm: 4000,
  supportWidthMm: 400,
  beamWidthBMm: 300,
  beamHeightHMm: 500,
  clearCoverMm: 30,
  bottomBarDiameterMm: 16,
  bottomBarCount: 3,
  topHangerBarDiameterMm: 14,
  topHangerBarCount: 2,
  topSupportExtraBarDiameterMm: 16,
  topSupportExtraLengthMm: 1100,
  stirrupDiameterMm: 10,
  stirrupBendRadiusMm: 20,
  stirrupHookLengthMm: 80,
  zones: [
    {
      id: "sol-mesnet-sarilma",
      label: "Sol Mesnet Sarılma Bölgesi",
      xStartMm: 0,
      xEndMm: 1000,
      spacingMm: 100,
      colorHex: "#06b6d4",
      description:
        "X = 0–1000 mm sol mesnet sarılma bölgesi (2h = 1000 mm, Ø10/100 mm, 10 etriye)",
    },
    {
      id: "aciklik-bolgesi",
      label: "Orta Açıklık Bölgesi",
      xStartMm: 1000,
      xEndMm: 3000,
      spacingMm: 150,
      colorHex: "#eab308",
      description:
        "X = 1000–3000 mm orta açıklık bölgesi (Ø10/150 mm, 13 etriye)",
    },
    {
      id: "sag-mesnet-sarilma",
      label: "Sağ Mesnet Sarılma Bölgesi",
      xStartMm: 3000,
      xEndMm: 4000,
      spacingMm: 100,
      colorHex: "#22c55e",
      description:
        "X = 3000–4000 mm sağ mesnet sarılma bölgesi (2h = 1000 mm, Ø10/100 mm, 10 etriye)",
    },
  ],
  assumptions: [
    {
      id: "yukleme-ve-moment-kabulu",
      label: "Yükleme Kabulü ve Çekme Bölgeleri (Öğretim Varsayımı)",
      description:
        "Bu K1 örneğinde düşey yayılı yük ve çerçeve mesnet sürekliliği kabulü altında orta açıklıkta alt liflerin, sol ve sağ mesnet komşuluğunda ise üst liflerin çekme etkisinde olduğu varsayılmıştır. Çekme bölgesi her kirişte veya konsolda daima alttadır genellemesi yapılmaz; moment diyagramının işaretine göre değişir.",
      isTeachingAssumption: true,
    },
    {
      id: "mesnet-sarilma-uzunlugu",
      label: "Mesnet Sarılma Bölgesi ve Etriye Yerleşimi (Öğretim Varsayımı)",
      description:
        "Mesnet yüzünden itibaren kiriş yüksekliğinin iki katı (2h = 2×500 = 1000 mm) sarılma bölgesi olarak alınmış; sol ve sağ sarılma bölgelerinde 10'ar adet Ø10/100 mm, orta açıklıkta (1000–3000 mm) 13 adet Ø10/150 mm olmak üzere toplam 33 etriye üretilmiştir.",
      isTeachingAssumption: true,
    },
    {
      id: "uc-mesnet-ve-ankraj",
      label: "Uç Mesnet Temsili ve 90° Ankraj Kancaları (Öğretim Varsayımı)",
      description:
        "Sol (X = -400..0 mm) ve sağ (X = 4000..4400 mm) uçlarda mesnet bağlamını göstermek üzere temsilî mesnet yastıkları ve boyuna donatıların mesnet çekirdeği içine dönen 90° ankraj bükümleri modellenmiştir.",
      isTeachingAssumption: true,
    },
  ],
};

export function computeBeamStirrupPositionsXMm(
  xStartMm: number,
  xEndMm: number,
  spacingMm: number,
): number[] {
  const positions: number[] = [];
  if (spacingMm === 150) {
    // 1000..3000 mm aralığında simetrik 13 etriye: 1100, 1250, ..., 2900 mm
    for (let x = xStartMm + 100; x <= xEndMm - 100 + 1e-6; x += spacingMm) {
      positions.push(Number(x.toFixed(2)));
    }
    return positions;
  }
  const firstX = xStartMm + spacingMm / 2;
  for (let x = firstX; x < xEndMm - 1e-6; x += spacingMm) {
    positions.push(Number(x.toFixed(2)));
  }
  return positions;
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

/**
 * Kiriş düşey enkesitinde (Y-Z düzlemi, sabit X kotunda) köşe bükümlü ve 135° kancalı etriye halkası üretir.
 */
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

  const hook1Start: Point3Mm = { x: xMm, y: yRight + r * hookDir, z: zTop - r * hookDir };
  const hook1End: Point3Mm = {
    x: xMm,
    y: hook1Start.y - hookVecLen,
    z: hook1Start.z - hookVecLen,
  };

  const hook2Start: Point3Mm = { x: xMm, y: yRight - r * hookDir, z: zTop + r * hookDir };
  const hook2End: Point3Mm = {
    x: xMm,
    y: hook2Start.y - hookVecLen,
    z: hook2Start.z - hookVecLen,
  };

  return [
    // Alt yatay kol
    makeLine({ x: xMm, y: yLeft, z: stirrupBottomZ }, { x: xMm, y: yRight, z: stirrupBottomZ }, "leg"),
    // Sağ-alt köşe yayı
    makeArcYZ({ x: xMm, y: yRight, z: zBot }, r, -Math.PI / 2, 0, "bend"),
    // Sağ düşey kol
    makeLine({ x: xMm, y: stirrupHalfY, z: zBot }, { x: xMm, y: stirrupHalfY, z: zTop }, "leg"),
    // Sağ-üst köşe yayı (kanca bölgesi)
    makeArcYZ({ x: xMm, y: yRight, z: zTop }, r, 0, (3 * Math.PI) / 4, "hook-bend"),
    // Üst yatay kol
    makeLine({ x: xMm, y: yRight, z: stirrupTopZ }, { x: xMm, y: yLeft, z: stirrupTopZ }, "leg"),
    // Sol-üst köşe yayı
    makeArcYZ({ x: xMm, y: yLeft, z: zTop }, r, Math.PI / 2, Math.PI, "bend"),
    // Sol düşey kol
    makeLine({ x: xMm, y: -stirrupHalfY, z: zTop }, { x: xMm, y: -stirrupHalfY, z: zBot }, "leg"),
    // Sol-alt köşe yayı
    makeArcYZ({ x: xMm, y: yLeft, z: zBot }, r, Math.PI, (3 * Math.PI) / 2, "bend"),
    // 135° deprem kanca uçları (üst sağ köşeden çekirdek içine)
    makeLine(hook1Start, hook1End, "hook"),
    makeLine(hook2Start, hook2End, "hook"),
  ];
}

/**
 * Boyuna çubuk için iki uç mesnette 90° bükümlü ankraj kancası içeren yol üretir.
 */
function buildAnchoredBeamBarSegments(params: {
  xLeftAnchor: number;
  xRightAnchor: number;
  yMm: number;
  zMm: number;
  bendDirZ: 1 | -1;
  bendRadiusMm: number;
  hookVerticalLenMm: number;
}): PathSegment3Mm[] {
  const {
    xLeftAnchor,
    xRightAnchor,
    yMm,
    zMm,
    bendDirZ,
    bendRadiusMm: r,
    hookVerticalLenMm,
  } = params;

  const leftCenterZ = zMm + bendDirZ * r;
  const rightCenterZ = zMm + bendDirZ * r;
  const leftHookEndZ = leftCenterZ + bendDirZ * hookVerticalLenMm;
  const rightHookEndZ = rightCenterZ + bendDirZ * hookVerticalLenMm;

  return [
    // Sol 90° ankraj düşey kolu
    makeLine(
      { x: xLeftAnchor, y: yMm, z: leftHookEndZ },
      { x: xLeftAnchor, y: yMm, z: leftCenterZ },
      "hook",
    ),
    // Sol 90° büküm yayı (XZ düzlemi)
    makeArcXZ(
      { x: xLeftAnchor + r, y: yMm, z: leftCenterZ },
      r,
      Math.PI,
      bendDirZ > 0 ? (3 * Math.PI) / 2 : Math.PI / 2,
      "hook-bend",
    ),
    // Ana yatay açıklık gövdesi
    makeLine(
      { x: xLeftAnchor + r, y: yMm, z: zMm },
      { x: xRightAnchor - r, y: yMm, z: zMm },
      "leg",
    ),
    // Sağ 90° büküm yayı (XZ düzlemi)
    makeArcXZ(
      { x: xRightAnchor - r, y: yMm, z: rightCenterZ },
      r,
      bendDirZ > 0 ? -Math.PI / 2 : Math.PI / 2,
      0,
      "hook-bend",
    ),
    // Sağ 90° ankraj düşey kolu
    makeLine(
      { x: xRightAnchor, y: yMm, z: rightCenterZ },
      { x: xRightAnchor, y: yMm, z: rightHookEndZ },
      "hook",
    ),
  ];
}

export function buildBeamDetailModel(
  spec: BeamSceneSpec = K1_BEAM_SPEC,
): DetailModel {
  const halfB = spec.beamWidthBMm / 2;
  const stirrupAxisOffsetFromFaceMm =
    spec.clearCoverMm + spec.stirrupDiameterMm / 2;
  const cornerBarCenterOffsetFromFaceMm =
    spec.clearCoverMm +
    spec.stirrupDiameterMm +
    spec.bottomBarDiameterMm / 2;

  const stirrupHalfY = halfB - stirrupAxisOffsetFromFaceMm;
  const stirrupBottomZ = stirrupAxisOffsetFromFaceMm;
  const stirrupTopZ = spec.beamHeightHMm - stirrupAxisOffsetFromFaceMm;

  const barHalfY = halfB - cornerBarCenterOffsetFromFaceMm;
  const bottomBarZ = cornerBarCenterOffsetFromFaceMm;
  const topBarZ = spec.beamHeightHMm - cornerBarCenterOffsetFromFaceMm;

  // Beton parçaları: Kiriş gövdesi + Sol ve Sağ uç mesnet temsilleri
  const concreteParts: ConcreteVolumePart[] = [
    {
      kind: "concrete",
      id: "concrete-beam-body",
      label: `Betonarme Kiriş Gövdesi (${spec.beamWidthBMm}×${spec.beamHeightHMm} mm · L=${spec.clearSpanLengthMm} mm)`,
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: spec.clearSpanLengthMm / 2,
        y: 0,
        z: spec.beamHeightHMm / 2,
      },
      sizeMm: {
        widthX: spec.clearSpanLengthMm,
        depthY: spec.beamWidthBMm,
        heightZ: spec.beamHeightHMm,
      },
      summary: {
        whatIsIt: `${spec.beamWidthBMm}×${spec.beamHeightHMm} mm dikdörtgen kesitli ve ${spec.clearSpanLengthMm} mm net açıklıklı betonarme kiriş gövdesi.`,
        whereInExample: `Sol mesnet yüzünden (X = 0 mm) sağ mesnet yüzüne (X = ${spec.clearSpanLengthMm} mm) uzanır; Z = 0..${spec.beamHeightHMm} mm yüksekliktedir.`,
        role: "Eğilme basınç bölgesindeki basınç gerilmelerini taşır ve donatı kafesini net pas payı (c = 30 mm) ile korur.",
      },
    },
    {
      kind: "concrete",
      id: "concrete-support-left",
      label: "Sol Uç Mesnet Temsili (Kolon / Perde Mesnet Bölgesi)",
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: -spec.supportWidthMm / 2,
        y: 0,
        z: spec.beamHeightHMm / 2,
      },
      sizeMm: {
        widthX: spec.supportWidthMm,
        depthY: spec.beamWidthBMm + 60,
        heightZ: spec.beamHeightHMm + 360,
      },
      summary: {
        whatIsIt: `X = -${spec.supportWidthMm}..0 mm aralığında sol uç mesnet (kolon/perde düğümü) bağlam temsili.`,
        whereInExample: "Kirişin sol ucunda boyuna donatıların 90° ankraj kancalarının kenetlendiği mesnet hacmidir.",
        role: "Kiriş uç kesme kuvvetlerini ve mesnet momentini düşey taşıyıcı elemana aktarır.",
      },
    },
    {
      kind: "concrete",
      id: "concrete-support-right",
      label: "Sağ Uç Mesnet Temsili (Kolon / Perde Mesnet Bölgesi)",
      category: "concrete",
      layerId: "concrete",
      centerMm: {
        x: spec.clearSpanLengthMm + spec.supportWidthMm / 2,
        y: 0,
        z: spec.beamHeightHMm / 2,
      },
      sizeMm: {
        widthX: spec.supportWidthMm,
        depthY: spec.beamWidthBMm + 60,
        heightZ: spec.beamHeightHMm + 360,
      },
      summary: {
        whatIsIt: `X = ${spec.clearSpanLengthMm}..${spec.clearSpanLengthMm + spec.supportWidthMm} mm aralığında sağ uç mesnet bağlam temsili.`,
        whereInExample: "Kirişin sağ ucunda boyuna donatıların 90° ankraj kancalarının kenetlendiği mesnet hacmidir.",
        role: "Kiriş uç kesme kuvvetlerini ve mesnet momentini düşey taşıyıcı elemana aktarır.",
      },
    },
  ];

  // Alt açıklık boyuna donatıları (3Ø16) — açıklıkta pozitif moment çekmesini taşır
  const bottomYOffsets = [-barHalfY, 0, barHalfY];
  const bottomBarLabels = ["Ön Köşe", "Orta Eksen", "Arka Köşe"];

  const bottomLongitudinalParts: RebarPathPart[] = bottomYOffsets.map(
    (yMm, idx) => ({
      kind: "rebar",
      id: `beam-bottom-bar-${idx + 1}`,
      label: `Alt Boyuna Donatı #${idx + 1} (Ø${spec.bottomBarDiameterMm} — ${bottomBarLabels[idx]})`,
      category: "longitudinal",
      layerId: "longitudinal",
      diameterMm: spec.bottomBarDiameterMm,
      elevationZMm: bottomBarZ,
      bendRadiusMm: 32,
      hookAngleDeg: 90,
      hookLengthMm: 180,
      colorHex: "#38bdf8",
      segments: buildAnchoredBeamBarSegments({
        xLeftAnchor: -260,
        xRightAnchor: spec.clearSpanLengthMm + 260,
        yMm,
        zMm: bottomBarZ,
        bendDirZ: 1,
        bendRadiusMm: 32,
        hookVerticalLenMm: 180,
      }),
      summary: {
        whatIsIt: `Kiriş alt yüzünde boydan boya uzanan Ø${spec.bottomBarDiameterMm} mm alt boyuna çekme donatısı.`,
        whereInExample: `Z = ${bottomBarZ} mm alt kotta, Y = ${yMm} mm konumunda sol mesnetten sağ mesnete uzanır ve uçlarda 90° yukarı bükülür.`,
        role: "Bu örneğin düşey yükleme kabulü altında orta açıklıkta oluşan pozitif eğilme momentinin çekme kuvvetlerini karşılar.",
        fieldNote:
          "Çekme her zaman altta değildir; deprem tersinir etkilerinde veya konsollarda çekme yönü değişebilir.",
      },
    }),
  );

  // Üst montaj boyuna donatıları (2Ø14)
  const topYOffsets = [-barHalfY, barHalfY];
  const topBarLabels = ["Üst Ön Köşe", "Üst Arka Köşe"];

  const topHangerParts: RebarPathPart[] = topYOffsets.map((yMm, idx) => ({
    kind: "rebar",
    id: `beam-top-hanger-bar-${idx + 1}`,
    label: `Üst Montaj Donatısı #${idx + 1} (Ø${spec.topHangerBarDiameterMm} — ${topBarLabels[idx]})`,
    category: "longitudinal",
    layerId: "longitudinal",
    diameterMm: spec.topHangerBarDiameterMm,
    elevationZMm: topBarZ,
    bendRadiusMm: 28,
    hookAngleDeg: 90,
    hookLengthMm: 180,
    colorHex: "#94a3b8",
    segments: buildAnchoredBeamBarSegments({
      xLeftAnchor: -260,
      xRightAnchor: spec.clearSpanLengthMm + 260,
      yMm,
      zMm: topBarZ,
      bendDirZ: -1,
      bendRadiusMm: 28,
      hookVerticalLenMm: 180,
    }),
    summary: {
      whatIsIt: `Kiriş üst köşelerinde açıklık boyunca sürekli uzanan Ø${spec.topHangerBarDiameterMm} mm üst montaj ve taşıyıcı donatısı.`,
      whereInExample: `Z = ${topBarZ} mm üst kotta, Y = ${yMm} mm köşesinde boydan boya uzanır; uç mesnetlerde 90° aşağı kancalanır.`,
      role: "Etriye kafesinin üst köşelerini tutar ve mesnet bölgelerindeki negatif eğilme momentinin taşınmasına mesnet ilaveleriyle birlikte katılır.",
    },
  }));

  // Sol ve Sağ Mesnet Üst İlave (Şapka) ve Ankraj Donatıları ("dowel" katmanı altında izole edilebilir)
  const supportExtraParts: RebarPathPart[] = [
    {
      kind: "rebar",
      id: "beam-support-extra-left",
      label: `Sol Mesnet Üst İlave & Ankraj Donatısı (Ø${spec.topSupportExtraBarDiameterMm})`,
      category: "dowel",
      layerId: "dowel",
      diameterMm: spec.topSupportExtraBarDiameterMm,
      elevationZMm: topBarZ - 4,
      bendRadiusMm: 32,
      hookAngleDeg: 90,
      hookLengthMm: 210,
      colorHex: "#f59e0b",
      segments: [
        makeLine(
          { x: -290, y: 0, z: topBarZ - 242 },
          { x: -290, y: 0, z: topBarZ - 32 },
          "hook",
        ),
        makeArcXZ(
          { x: -290 + 32, y: 0, z: topBarZ - 32 },
          32,
          Math.PI / 2,
          Math.PI,
          "hook-bend",
        ),
        makeLine(
          { x: -290 + 32, y: 0, z: topBarZ },
          { x: spec.topSupportExtraLengthMm, y: 0, z: topBarZ },
          "leg",
        ),
      ],
      summary: {
        whatIsIt: `Sol mesnet üst bölgesinde X = -290..${spec.topSupportExtraLengthMm} mm arasında yer alan Ø${spec.topSupportExtraBarDiameterMm} mm mesnet ilave ve ankraj çubuğu.`,
        whereInExample: `Sol mesnet çekirdeğinden başlayıp sol sarılma bölgesi boyunca X = ${spec.topSupportExtraLengthMm} mm kotuna kadar üst orta eksende uzanır.`,
        role: "Çerçeve kirişinin sol mesnedinde oluşan negatif eğilme momentinden kaynaklı üst lif çekme kuvvetlerini karşılar ve mesnet içine 90° kanca ile kenetlenir.",
      },
    },
    {
      kind: "rebar",
      id: "beam-support-extra-right",
      label: `Sağ Mesnet Üst İlave & Ankraj Donatısı (Ø${spec.topSupportExtraBarDiameterMm})`,
      category: "dowel",
      layerId: "dowel",
      diameterMm: spec.topSupportExtraBarDiameterMm,
      elevationZMm: topBarZ - 4,
      bendRadiusMm: 32,
      hookAngleDeg: 90,
      hookLengthMm: 210,
      colorHex: "#f59e0b",
      segments: [
        makeLine(
          {
            x: spec.clearSpanLengthMm - spec.topSupportExtraLengthMm,
            y: 0,
            z: topBarZ,
          },
          { x: spec.clearSpanLengthMm + 290 - 32, y: 0, z: topBarZ },
          "leg",
        ),
        makeArcXZ(
          { x: spec.clearSpanLengthMm + 290 - 32, y: 0, z: topBarZ - 32 },
          32,
          0,
          Math.PI / 2,
          "hook-bend",
        ),
        makeLine(
          { x: spec.clearSpanLengthMm + 290, y: 0, z: topBarZ - 32 },
          { x: spec.clearSpanLengthMm + 290, y: 0, z: topBarZ - 242 },
          "hook",
        ),
      ],
      summary: {
        whatIsIt: `Sağ mesnet üst bölgesinde X = ${spec.clearSpanLengthMm - spec.topSupportExtraLengthMm}..${spec.clearSpanLengthMm + 290} mm arasında yer alan Ø${spec.topSupportExtraBarDiameterMm} mm mesnet ilave ve ankraj çubuğu.`,
        whereInExample: `Sağ sarılma bölgesinden (X = ${spec.clearSpanLengthMm - spec.topSupportExtraLengthMm} mm) sağ mesnet çekirdeğine uzanır.`,
        role: "Çerçeve kirişinin sağ mesnedinde oluşan negatif eğilme momentinden kaynaklı üst lif çekme kuvvetlerini karşılar ve mesnet içine 90° kanca ile kenetlenir.",
      },
    },
  ];

  // Bölgesel Etriyeler (Sol sarılma 10 + Orta açıklık 13 + Sağ sarılma 10 = 33 etriye)
  const stirrupParts: RebarPathPart[] = [];
  const zoneSummaries: DetailZoneSummary[] = [];
  let globalStirrupIndex = 0;

  for (const zone of spec.zones) {
    const xPositions = computeBeamStirrupPositionsXMm(
      zone.xStartMm,
      zone.xEndMm,
      zone.spacingMm,
    );

    zoneSummaries.push({
      id: zone.id,
      label: zone.label,
      zStartMm: zone.xStartMm,
      zEndMm: zone.xEndMm,
      lengthMm: zone.xEndMm - zone.xStartMm,
      spacingMm: zone.spacingMm,
      stirrupCount: xPositions.length,
      crosstieCount: 0,
      colorHex: zone.colorHex,
      description: zone.description,
    });

    for (const xMm of xPositions) {
      globalStirrupIndex += 1;
      stirrupParts.push({
        kind: "rebar",
        id: `beam-stirrup-${globalStirrupIndex}-${zone.id}-x${xMm}`,
        label: `Kiriş Etriyesi #${globalStirrupIndex} (${zone.label} — X=${xMm} mm)`,
        category: "stirrup",
        layerId: "stirrup",
        diameterMm: spec.stirrupDiameterMm,
        zoneId: zone.id,
        elevationZMm: xMm, // Kirişte kesit/konum parametresi X (mm) boyunca tutulur
        bendRadiusMm: spec.stirrupBendRadiusMm,
        hookAngleDeg: 135,
        hookLengthMm: spec.stirrupHookLengthMm,
        colorHex: zone.colorHex,
        segments: buildBeamStirrupSegmentsYZ({
          xMm,
          stirrupHalfY,
          stirrupBottomZ,
          stirrupTopZ,
          bendRadiusMm: spec.stirrupBendRadiusMm,
          hookLengthMm: spec.stirrupHookLengthMm,
        }),
        summary: {
          whatIsIt: `Ø${spec.stirrupDiameterMm} mm çapında, köşe bükümlü ve 135° kancalı düşey kiriş etriyesi.`,
          whereInExample: `${zone.label} içinde X = ${xMm} mm konumunda (${zone.spacingMm} mm aralıklı düzen).`,
          role: "Kirişte kesme kuvvetlerini karşılar, mesnet sarılma bölgelerinde sünekliği artırır ve boyuna donatıları sarar.",
        },
      });
    }
  }

  const dimensionMarkers: DimensionMarkerMm[] = [
    {
      id: "dim-beam-clear-span",
      label: `Net Açıklık L = ${spec.clearSpanLengthMm} mm`,
      valueMm: spec.clearSpanLengthMm,
      unit: "mm",
      startMm: { x: 0, y: -halfB - 90, z: 0 },
      endMm: { x: spec.clearSpanLengthMm, y: -halfB - 90, z: 0 },
      colorHex: "#a855f7",
    },
    {
      id: "dim-beam-left-conf",
      label: "Sol Sarılma: 1000 mm (Ø10/100)",
      valueMm: 1000,
      unit: "mm",
      startMm: { x: 0, y: -halfB - 55, z: spec.beamHeightHMm + 35 },
      endMm: { x: 1000, y: -halfB - 55, z: spec.beamHeightHMm + 35 },
      colorHex: "#06b6d4",
    },
    {
      id: "dim-beam-mid-span",
      label: "Orta Açıklık: 2000 mm (Ø10/150)",
      valueMm: 2000,
      unit: "mm",
      startMm: { x: 1000, y: -halfB - 55, z: spec.beamHeightHMm + 35 },
      endMm: { x: 3000, y: -halfB - 55, z: spec.beamHeightHMm + 35 },
      colorHex: "#eab308",
    },
    {
      id: "dim-beam-right-conf",
      label: "Sağ Sarılma: 1000 mm (Ø10/100)",
      valueMm: 1000,
      unit: "mm",
      startMm: { x: 3000, y: -halfB - 55, z: spec.beamHeightHMm + 35 },
      endMm: { x: 4000, y: -halfB - 55, z: spec.beamHeightHMm + 35 },
      colorHex: "#22c55e",
    },
  ];

  const longitudinalParts = [...bottomLongitudinalParts, ...topHangerParts];
  const parts: DetailPart[] = [
    ...concreteParts,
    ...longitudinalParts,
    ...supportExtraParts,
    ...stirrupParts,
  ];

  return {
    specVersion: 1,
    slug: "kiris-detayi",
    presetId: "k1-referans",
    primaryAxis: "x",
    title: spec.title,
    subtitle: spec.subtitle,
    boundsMm: {
      min: {
        x: -spec.supportWidthMm,
        y: -(halfB + 30),
        z: -180,
      },
      max: {
        x: spec.clearSpanLengthMm + spec.supportWidthMm,
        y: halfB + 30,
        z: spec.beamHeightHMm + 180,
      },
    },
    concreteBoundsMm: {
      min: { x: 0, y: -halfB, z: 0 },
      max: {
        x: spec.clearSpanLengthMm,
        y: halfB,
        z: spec.beamHeightHMm,
      },
    },
    dimensionsMm: {
      widthX: spec.beamWidthBMm,
      depthY: spec.beamHeightHMm,
      concreteHeightZ: spec.clearSpanLengthMm,
      dowelLengthZ: spec.supportWidthMm * 2,
      totalHeightZ: spec.clearSpanLengthMm,
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
      stirrups: stirrupParts.length,
      dowels: supportExtraParts.length,
      crossties: 0,
    },
    assumptions: spec.assumptions,
  };
}
