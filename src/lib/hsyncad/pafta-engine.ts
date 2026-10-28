import type { CadModel, ColumnElement, WallElement, BeamElement } from "./model";
import { distance } from "./geometry";
import { runStructuralAnalysis } from "./analysis";
import { REBAR_WEIGHTS } from "./detailing";

export type SheetFormat = "A0" | "A1" | "A2" | "Roll-90x150" | "Roll-90x210" | "Custom";

export interface SheetDimensions {
  format: SheetFormat;
  widthMm: number;
  heightMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
}

export const SHEET_SIZES: Record<SheetFormat, SheetDimensions> = {
  A0: {
    format: "A0",
    widthMm: 1189,
    heightMm: 841,
    marginLeftMm: 25,
    marginRightMm: 10,
    marginTopMm: 10,
    marginBottomMm: 10,
  },
  A1: {
    format: "A1",
    widthMm: 841,
    heightMm: 594,
    marginLeftMm: 25,
    marginRightMm: 10,
    marginTopMm: 10,
    marginBottomMm: 10,
  },
  A2: {
    format: "A2",
    widthMm: 594,
    heightMm: 420,
    marginLeftMm: 25,
    marginRightMm: 10,
    marginTopMm: 10,
    marginBottomMm: 10,
  },
  "Roll-90x150": {
    format: "Roll-90x150",
    widthMm: 1500,
    heightMm: 900,
    marginLeftMm: 25,
    marginRightMm: 10,
    marginTopMm: 10,
    marginBottomMm: 10,
  },
  "Roll-90x210": {
    format: "Roll-90x210",
    widthMm: 2100,
    heightMm: 900,
    marginLeftMm: 25,
    marginRightMm: 10,
    marginTopMm: 10,
    marginBottomMm: 10,
  },
  Custom: {
    format: "Custom",
    widthMm: 1600,
    heightMm: 900,
    marginLeftMm: 25,
    marginRightMm: 10,
    marginTopMm: 10,
    marginBottomMm: 10,
  },
};

export interface ProjectMetadata {
  projectName: string;
  projectNo: string;
  sheetNo: string;
  sheetTitle: string;
  buildingType: string;
  totalFloors: number;
  totalAreaM2: number;
  city: string;
  district: string;
  neighborhood: string;
  parcel: string;
  block: string;
  owner: string;
  engineerName: string;
  engineerChamberNo: string;
  engineerLicence: string;
  inspectorCompany: string;
  inspectorNo: string;
  drawer: string;
  checker: string;
  consultant: string;
  date: string;
  revision: string;
  concreteGrade: string;
  steelGrade: string;
  scales: string;
}

export const DEFAULT_PROJECT_METADATA: ProjectMetadata = {
  projectName: "7 KATLI TİCARET VE OFİS PLAZASI",
  projectNo: "2026/ST-048",
  sheetNo: "S-100",
  sheetTitle: "KOLON VE PERDE APLİKASYON PLANI",
  buildingType: "Betonarme Karkas (Perdeli-Çerçeveli)",
  totalFloors: 7,
  totalAreaM2: 10752,
  city: "İSTANBUL",
  district: "KADIKÖY",
  neighborhood: "FENERBAHÇE",
  parcel: "14",
  block: "2084",
  owner: "SÜHEYLA KARA VE HİSSEDARLARI",
  engineerName: "HÜSEYİN AVNİ ÖZER (İnş. Müh.)",
  engineerChamberNo: "İMO: 84219",
  engineerLicence: "BTB: 34-9214",
  inspectorCompany: "BATI MARMARA YAPI DENETİM LTD. ŞTİ.",
  inspectorNo: "YD-2481",
  drawer: "NİZAMETTİN SAMED ÖZER",
  checker: "HÜSEYİN AVNİ ÖZER",
  consultant: "PROF. DR. İ. METİN",
  date: "28.10.2026",
  revision: "0",
  concreteGrade: "C35/45",
  steelGrade: "B420C",
  scales: "1/50 - 1/25 - 1/20",
};

export interface ColumnScheduleRow {
  colNo: string;
  type: "column" | "wall";
  sectionDimensions: string;
  longitudinalRebar: string;
  stirrupRebar: string;
  tieCountText: string;
  confinementHeightCm: number;
  totalHeightCm: number;
  floorNames: string[];
}

export interface RebarScheduleItem {
  pos: number;
  element: string;
  diameterMm: number;
  count: number;
  lengthCm: number;
  shapeText: string;
  totalLengthM: number;
  unitWeightKgM: number;
  totalWeightKg: number;
}

export interface TbdyAnalysisParams {
  soilClass: string;
  dts: number;
  bks: number;
  I: number;
  R: number;
  D: number;
  Ss: number;
  S1: number;
  Sds: number;
  Sd1: number;
  Ta: number;
  Tb: number;
}

export interface PaftaSheetData {
  id: string;
  type: "foundation" | "column_app" | "formwork" | "beam_details" | "rebar_schedule" | "master_set";
  sheetNo: string;
  title: string;
  scaleText: string;
  dimensions: SheetDimensions;
  metadata: ProjectMetadata;
  analysisParams: TbdyAnalysisParams;
  columnSchedule: ColumnScheduleRow[];
  rebarSchedule: RebarScheduleItem[];
  notes: string[];
  concreteCovers: { element: string; coverMm: number }[];
  viewports: {
    id: string;
    title: string;
    scaleText: string;
    scaleRatio: number; // e.g. 1/50 = 0.02
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
  }[];
}

/**
 * Standard Concrete Covers (Net Beton Örtüleri / Paspayları) per TS 500 & TBDY 2018
 */
export const STANDARD_CONCRETE_COVERS = [
  { element: "Radye ve Sürekli Temeller (Grobetonlu)", coverMm: 50 },
  { element: "Temeller (Grobetonsuz Doğrudan Zemin)", coverMm: 75 },
  { element: "Kolonlar ve Perdeler", coverMm: 30 },
  { element: "Kirişler (Alt, Üst ve Yan Yüzeyler)", coverMm: 25 },
  { element: "Döşemeler ve Merdiven Kolları", coverMm: 20 },
  { element: "Dış Hava Şartlarına Açık Elemanlar", coverMm: 35 },
];

/**
 * Standard Structural General Notes (TS 500 / TBDY 2018 Engineering Submission Standard)
 */
export const STANDARD_ENGINEERING_NOTES = [
  "1. Betonarme projeleri TBDY 2018 (Türkiye Bina Deprem Yönetmeliği) ve TS 500 (Betonarme Yapıların Tasarım ve Yapım Kuralları) şartlarına uygun olarak hazırlanmıştır.",
  "2. Taşıyıcı elemanlarda C35/45 hazır beton ve B420C nervürlü donatı çeliği kullanılacaktır. Şantiyede beton numuneleri 7 ve 28 günlük periyotlarla kırılacaktır.",
  "3. Donatı bindirme boyu en az 1.5 * lb (kenetlenme boyu) olacak, kolon boyuna donatı bindirmeleri tercihen kat orta bölgesinde yapılacaktır.",
  "4. Kolon ve perde uç bölgelerinde deprem sarılma bölgesi etriyeleri s <= min(bk/3, 150mm, 8*phi) aralıkla sıklaştırılacaktır. Etriyeler 135 derece kancalı ve 10*phi kıvrım boyunda bükülecektir.",
  "5. Kiriş sarılma bölgelerinde (mesnet yüzünden itibaren 2h mesafede) etriye adımı en fazla h/4 veya 100 mm olacaktır. Pilye kıvrımları 45 derecedir.",
  "6. Temel altı zemin taşıma emniyet gerilmesi q_em = 320 kN/m2 (3.20 kg/cm2), zemin yatak katsayısı ks = 40000 kN/m3 alınmıştır.",
  "7. Radye temel altında 10 cm C16 grobeton, 2 kat polimer bitümlü su yalıtım membranı ve 5 cm koruyucu şap betonu uygulanacaktır.",
  "8. Tesisat delikleri kiriş gövdesinde mesnet yüzünden en az h mesafede ve tarafsız eksen civarında açılacak, kiriş donatıları kesinlikle kesilmeyecektir.",
  "9. Kalıp söküm süreleri: Düşey kalıplar (kolon, perde) 3 gün; Kiriş altı ve döşeme kalıpları en az 14 gün (hava sıcaklığına bağlı) bırakılacak ve emniyet dikmeleri korunacaktır.",
];

/**
 * Builds the comprehensive Column & Shear Wall Schedule (Kolon Donatı Tablosu)
 * matching the real Süheyla Kara project structure.
 */
export function buildColumnSchedule(model: CadModel): ColumnScheduleRow[] {
  const rows: ColumnScheduleRow[] = [];
  const floorNames = model.floors.map(f => f.name);

  // Group columns by name / position
  const columns = model.elements.filter(e => e.type === "column") as ColumnElement[];
  const walls = model.elements.filter(e => e.type === "wall") as WallElement[];

  const colMap = new Map<string, ColumnElement>();
  for (const c of columns) {
    if (!colMap.has(c.name)) colMap.set(c.name, c);
  }

  for (const [name, col] of colMap.entries()) {
    const wCm = Math.round(col.width * 100);
    const dCm = Math.round(col.depth * 100);
    const sectionArea = wCm * dCm;

    // Minimum longitudinal rebar ratio per TBDY 2018 §7.3.2 (min 1% of gross area)
    const minAsCm2 = sectionArea * 0.01;
    // Φ16 = 2.01 cm2, Φ14 = 1.54 cm2, Φ18 = 2.54 cm2, Φ20 = 3.14 cm2
    let barDia = 16;
    let barCount = Math.max(8, Math.ceil(minAsCm2 / 2.01));
    if (barCount % 2 !== 0) barCount += 1;
    if (sectionArea >= 3000) {
      barDia = 20;
      barCount = Math.max(12, Math.ceil(minAsCm2 / 3.14));
      if (barCount % 2 !== 0) barCount += 1;
    } else if (sectionArea >= 2000) {
      barDia = 18;
      barCount = Math.max(10, Math.ceil(minAsCm2 / 2.54));
      if (barCount % 2 !== 0) barCount += 1;
    }

    const confH = Math.max(50, Math.round((col.height || 3) * 100 / 6), wCm, dCm);

    rows.push({
      colNo: name,
      type: "column",
      sectionDimensions: `${wCm}/${dCm}`,
      longitudinalRebar: `${barCount}Φ${barDia}`,
      stirrupRebar: `Φ8/10-15 (Sar: 10, Orta: 15 cm)`,
      tieCountText: wCm > 40 || dCm > 40 ? "Çift Etriye + 2 Çiroz" : "1 Etriye + 1 Çiroz",
      confinementHeightCm: confH,
      totalHeightCm: Math.round((col.height || 3) * 100),
      floorNames,
    });
  }

  // Shear Walls (Perdeler)
  const wallMap = new Map<string, WallElement>();
  for (const w of walls) {
    if (!wallMap.has(w.name)) wallMap.set(w.name, w);
  }

  for (const [name, wall] of wallMap.entries()) {
    const lengthM = distance(wall.start, wall.end);
    const lenCm = Math.round(lengthM * 100);
    const thickCm = Math.round(wall.thickness * 100);

    // Shear wall rebar per TBDY 2018 §7.6
    // End zone length = 0.2 * Lw
    const endZoneLenCm = Math.max(thickCm * 2, Math.round(lenCm * 0.2));
    const webRebar = "2xΦ12/20 (Çift Sıra Gövde Donatısı)";
    const endRebar = "8Φ16 (Her Uç Bölgesinde)";
    const ties = "Φ8/15 Etriye + 4 adet/m² Çiroz";

    rows.push({
      colNo: name,
      type: "wall",
      sectionDimensions: `${thickCm}/${lenCm}`,
      longitudinalRebar: `${endRebar} + ${webRebar}`,
      stirrupRebar: ties,
      tieCountText: `Uç Bölgesi L=${endZoneLenCm}cm`,
      confinementHeightCm: endZoneLenCm,
      totalHeightCm: 300,
      floorNames,
    });
  }

  return rows;
}

/**
 * Builds the comprehensive Project Rebar Takeoff Schedule (Donatı Metraj ve Büküm Listesi)
 * calculating total steel weights, lengths, bar marks, and bending shapes.
 */
export function buildRebarSchedule(model: CadModel): RebarScheduleItem[] {
  const items: RebarScheduleItem[] = [];
  let pos = 1;

  const floorCount = Math.max(1, model.floors.length);

  // 1. Column Longitudinal Bars
  const columns = model.elements.filter(e => e.type === "column") as ColumnElement[];
  const colCount = Math.max(1, columns.length);
  const avgColH = 3.6; // story height + lap length

  items.push({
    pos: pos++,
    element: "Kolon Boyuna Donatısı",
    diameterMm: 16,
    count: colCount * 8 * floorCount,
    lengthCm: Math.round(avgColH * 100),
    shapeText: "Düz + 90° Gönye (L-kıvrım)",
    totalLengthM: Math.round(colCount * 8 * floorCount * avgColH),
    unitWeightKgM: REBAR_WEIGHTS[16] || 1.578,
    totalWeightKg: Math.round(colCount * 8 * floorCount * avgColH * 1.578),
  });

  // 2. Column Stirrups
  items.push({
    pos: pos++,
    element: "Kolon Etriyesi (Sarılma + Orta)",
    diameterMm: 8,
    count: colCount * 28 * floorCount,
    lengthCm: 160,
    shapeText: "135° Kancalı Kapalı Etriye",
    totalLengthM: Math.round(colCount * 28 * floorCount * 1.6),
    unitWeightKgM: REBAR_WEIGHTS[8] || 0.395,
    totalWeightKg: Math.round(colCount * 28 * floorCount * 1.6 * 0.395),
  });

  // 3. Column Ties (Çirozlar)
  items.push({
    pos: pos++,
    element: "Kolon / Perde Çirozu",
    diameterMm: 8,
    count: colCount * 18 * floorCount,
    lengthCm: 55,
    shapeText: "Çift Kancalı Çiroz (135° / 90°)",
    totalLengthM: Math.round(colCount * 18 * floorCount * 0.55),
    unitWeightKgM: REBAR_WEIGHTS[8] || 0.395,
    totalWeightKg: Math.round(colCount * 18 * floorCount * 0.55 * 0.395),
  });

  // 4. Shear Wall End & Web Bars
  const walls = model.elements.filter(e => e.type === "wall") as WallElement[];
  const wallCount = Math.max(1, walls.length);
  items.push({
    pos: pos++,
    element: "Perde Uç Bölgesi Boyuna Donatısı",
    diameterMm: 18,
    count: wallCount * 16 * floorCount,
    lengthCm: 420,
    shapeText: "Düz Boyuna Çubuk",
    totalLengthM: Math.round(wallCount * 16 * floorCount * 4.2),
    unitWeightKgM: REBAR_WEIGHTS[18] || 1.998,
    totalWeightKg: Math.round(wallCount * 16 * floorCount * 4.2 * 1.998),
  });

  items.push({
    pos: pos++,
    element: "Perde Gövde Donatısı (Yatay & Düşey Çift Sıra)",
    diameterMm: 12,
    count: wallCount * 36 * floorCount,
    lengthCm: 600,
    shapeText: "Gövde Hasır Donatısı / Düz",
    totalLengthM: Math.round(wallCount * 36 * floorCount * 6.0),
    unitWeightKgM: REBAR_WEIGHTS[12] || 0.888,
    totalWeightKg: Math.round(wallCount * 36 * floorCount * 6.0 * 0.888),
  });

  // 5. Beams (Kiriş Montaj, Düz ve Mesnet İlaveleri)
  const beams = model.elements.filter(e => e.type === "beam") as BeamElement[];
  const beamCount = Math.max(1, beams.length);
  let totalBeamSpanM = 0;
  for (const b of beams) totalBeamSpanM += distance(b.start, b.end);
  if (totalBeamSpanM === 0) totalBeamSpanM = beamCount * 7.0;

  items.push({
    pos: pos++,
    element: "Kiriş Montaj Donatısı (Üst)",
    diameterMm: 14,
    count: beamCount * 3 * floorCount,
    lengthCm: 850,
    shapeText: "Düz + Uç Kancaları",
    totalLengthM: Math.round(beamCount * 3 * floorCount * 8.5),
    unitWeightKgM: REBAR_WEIGHTS[14] || 1.208,
    totalWeightKg: Math.round(beamCount * 3 * floorCount * 8.5 * 1.208),
  });

  items.push({
    pos: pos++,
    element: "Kiriş Düz Donatısı (Alt)",
    diameterMm: 16,
    count: beamCount * 4 * floorCount,
    lengthCm: 850,
    shapeText: "Düz + Uç Kancaları",
    totalLengthM: Math.round(beamCount * 4 * floorCount * 8.5),
    unitWeightKgM: REBAR_WEIGHTS[16] || 1.578,
    totalWeightKg: Math.round(beamCount * 4 * floorCount * 8.5 * 1.578),
  });

  items.push({
    pos: pos++,
    element: "Kiriş Mesnet İlave Donatısı",
    diameterMm: 16,
    count: beamCount * 4 * floorCount,
    lengthCm: 280,
    shapeText: "Mesnet L/4 İlave Çubuğu",
    totalLengthM: Math.round(beamCount * 4 * floorCount * 2.8),
    unitWeightKgM: REBAR_WEIGHTS[16] || 1.578,
    totalWeightKg: Math.round(beamCount * 4 * floorCount * 2.8 * 1.578),
  });

  items.push({
    pos: pos++,
    element: "Kiriş Sarılma ve Gövde Etriyesi",
    diameterMm: 8,
    count: beamCount * 42 * floorCount,
    lengthCm: 145,
    shapeText: "135° Kancalı Kiriş Etriyesi",
    totalLengthM: Math.round(beamCount * 42 * floorCount * 1.45),
    unitWeightKgM: REBAR_WEIGHTS[8] || 0.395,
    totalWeightKg: Math.round(beamCount * 42 * floorCount * 1.45 * 0.395),
  });

  // 6. Raft Foundation Rebar Mesh (Radye Temel Alt ve Üst Hasırları)
  items.push({
    pos: pos++,
    element: "Radye Temel Alt Donatısı (X & Y)",
    diameterMm: 18,
    count: 380,
    lengthCm: 1200,
    shapeText: "Φ18/15 Çift Yönlü Düz Ağ",
    totalLengthM: 380 * 12,
    unitWeightKgM: REBAR_WEIGHTS[18] || 1.998,
    totalWeightKg: Math.round(380 * 12 * 1.998),
  });

  items.push({
    pos: pos++,
    element: "Radye Temel Üst Donatısı (X & Y)",
    diameterMm: 18,
    count: 380,
    lengthCm: 1200,
    shapeText: "Φ18/15 Çift Yönlü Düz Ağ",
    totalLengthM: 380 * 12,
    unitWeightKgM: REBAR_WEIGHTS[18] || 1.998,
    totalWeightKg: Math.round(380 * 12 * 1.998),
  });

  items.push({
    pos: pos++,
    element: "Radye Sehpa ve İlave Donatısı",
    diameterMm: 14,
    count: 450,
    lengthCm: 220,
    shapeText: "Z-Sehpa (1 Adet/m²)",
    totalLengthM: 450 * 2.2,
    unitWeightKgM: REBAR_WEIGHTS[14] || 1.208,
    totalWeightKg: Math.round(450 * 2.2 * 1.208),
  });

  return items;
}

/**
 * Creates the complete multi-sheet pafta suite for the project,
 * identical in quality and layout to real Turkish structural submissions (like Süheyla Kara project).
 */
export function generateProjectPaftas(
  model: CadModel,
  format: SheetFormat = "Roll-90x210",
  customMetadata?: Partial<ProjectMetadata>
): PaftaSheetData[] {
  const dim = SHEET_SIZES[format] || SHEET_SIZES["Roll-90x210"];
  const meta: ProjectMetadata = {
    ...DEFAULT_PROJECT_METADATA,
    projectName: model.name || DEFAULT_PROJECT_METADATA.projectName,
    totalFloors: model.floors.length || 7,
    ...customMetadata,
  };

  const analysisRes = runStructuralAnalysis(model);
  const analysisParams: TbdyAnalysisParams = {
    soilClass: "ZB (Kaya / Çok Sıkı)",
    dts: 1,
    bks: 3,
    I: analysisRes.settings.importance || 1.0,
    R: analysisRes.settings.r || 8.0,
    D: 2.5,
    Ss: 1.25,
    S1: 0.35,
    Sds: analysisRes.settings.sds || 1.0,
    Sd1: analysisRes.settings.sd1 || 0.4,
    Ta: 0.08,
    Tb: 0.40,
  };
  const columnSchedule = buildColumnSchedule(model);
  const rebarSchedule = buildRebarSchedule(model);

  const sheets: PaftaSheetData[] = [];

  // ==========================================
  // SHEET 1 (S-100): MASTER STATİK PAFTA (SÜHEYLA KARA TİPİ)
  // Contains: Kolon Aplikasyon Planı (1/50) + Kolon Donatı Tablosu + Perde Detayları + Antet + Deprem Parametreleri
  // ==========================================
  sheets.push({
    id: "pafta-s100",
    type: "master_set",
    sheetNo: "S-100",
    title: "KOLON VE PERDE APLİKASYON PLANI",
    scaleText: "1/50 - 1/20",
    dimensions: dim,
    metadata: {
      ...meta,
      sheetNo: "S-100",
      sheetTitle: "KOLON VE PERDE APLİKASYON PLANI",
      scales: "1/50 - 1/20",
    },
    analysisParams,
    columnSchedule,
    rebarSchedule,
    notes: STANDARD_ENGINEERING_NOTES,
    concreteCovers: STANDARD_CONCRETE_COVERS,
    viewports: [
      {
        id: "vp-plan",
        title: "ZEMİN KAT KOLON VE PERDE APLİKASYON PLANI",
        scaleText: "ÖLÇEK: 1/50",
        scaleRatio: 1 / 50,
        xMm: dim.marginLeftMm + 10,
        yMm: dim.marginBottomMm + 10,
        widthMm: dim.widthMm * 0.58,
        heightMm: dim.heightMm - dim.marginTopMm - dim.marginBottomMm - 20,
      },
      {
        id: "vp-col-table",
        title: "KOLON VE PERDE DONATI TABLOSU",
        scaleText: "TABLO",
        scaleRatio: 1,
        xMm: dim.marginLeftMm + dim.widthMm * 0.59,
        yMm: dim.marginBottomMm + 240,
        widthMm: dim.widthMm * 0.36,
        heightMm: dim.heightMm - dim.marginTopMm - 260,
      },
      {
        id: "vp-antet",
        title: "MÜHENDİSLİK VE DEPREM ANTETİ",
        scaleText: "ANTET",
        scaleRatio: 1,
        xMm: dim.marginLeftMm + dim.widthMm * 0.59,
        yMm: dim.marginBottomMm + 10,
        widthMm: dim.widthMm * 0.36,
        heightMm: 220,
      },
    ],
  });

  // ==========================================
  // SHEET 2 (S-01): RADYE TEMEL APLİKASYON VE DONATI PLANI
  // ==========================================
  sheets.push({
    id: "pafta-s01",
    type: "foundation",
    sheetNo: "S-01",
    title: "RADYE TEMEL APLİKASYON VE DONATI PLANI",
    scaleText: "1/50 - 1/25",
    dimensions: SHEET_SIZES["A0"],
    metadata: {
      ...meta,
      sheetNo: "S-01",
      sheetTitle: "RADYE TEMEL APLİKASYON VE DONATI PLANI",
      scales: "1/50 - 1/25",
    },
    analysisParams,
    columnSchedule: columnSchedule.slice(0, 8),
    rebarSchedule: rebarSchedule.filter(r => r.element.includes("Temel")),
    notes: STANDARD_ENGINEERING_NOTES,
    concreteCovers: STANDARD_CONCRETE_COVERS,
    viewports: [
      {
        id: "vp-foundation-plan",
        title: "RADYE TEMEL DONATI VE AMBATMAN PLANI (h=80cm)",
        scaleText: "ÖLÇEK: 1/50",
        scaleRatio: 1 / 50,
        xMm: 35,
        yMm: 20,
        widthMm: 720,
        heightMm: 780,
      },
      {
        id: "vp-foundation-details",
        title: "TEMEL KESİTİ VE İZOLASYON DETAYI",
        scaleText: "ÖLÇEK: 1/25",
        scaleRatio: 1 / 25,
        xMm: 770,
        yMm: 250,
        widthMm: 380,
        heightMm: 550,
      },
      {
        id: "vp-foundation-antet",
        title: "ANTET",
        scaleText: "1/1",
        scaleRatio: 1,
        xMm: 770,
        yMm: 20,
        widthMm: 380,
        heightMm: 215,
      },
    ],
  });

  // ==========================================
  // SHEET 3 (S-02): KAT KALIP VE DONATI PLANI (1/50)
  // ==========================================
  sheets.push({
    id: "pafta-s02",
    type: "formwork",
    sheetNo: "S-02",
    title: "NORMAL KAT KALIP VE DONATI PLANI",
    scaleText: "1/50",
    dimensions: SHEET_SIZES["A0"],
    metadata: {
      ...meta,
      sheetNo: "S-02",
      sheetTitle: "NORMAL KAT KALIP VE DONATI PLANI",
      scales: "1/50",
    },
    analysisParams,
    columnSchedule: [],
    rebarSchedule: rebarSchedule.filter(r => r.element.includes("Kiriş")),
    notes: STANDARD_ENGINEERING_NOTES,
    concreteCovers: STANDARD_CONCRETE_COVERS,
    viewports: [
      {
        id: "vp-formwork-plan",
        title: "1. KAT KALIP PLANI VE KİRİŞ YERLEŞİMİ",
        scaleText: "ÖLÇEK: 1/50",
        scaleRatio: 1 / 50,
        xMm: 35,
        yMm: 20,
        widthMm: 740,
        heightMm: 780,
      },
      {
        id: "vp-formwork-notes",
        title: "DÖŞEME VE KİRİŞ YÜK ANALİZİ",
        scaleText: "TABLO",
        scaleRatio: 1,
        xMm: 790,
        yMm: 250,
        widthMm: 360,
        heightMm: 550,
      },
      {
        id: "vp-formwork-antet",
        title: "ANTET",
        scaleText: "1/1",
        scaleRatio: 1,
        xMm: 790,
        yMm: 20,
        widthMm: 360,
        heightMm: 215,
      },
    ],
  });

  // ==========================================
  // SHEET 4 (S-03): KİRİŞ DONATI AÇILIMLARI VE KESİTLERİ (1/25 - 1/20)
  // ==========================================
  sheets.push({
    id: "pafta-s03",
    type: "beam_details",
    sheetNo: "S-03",
    title: "KİRİŞ BOYUNA AÇILIMLARI VE KESİTLERİ",
    scaleText: "1/25 - 1/20",
    dimensions: SHEET_SIZES["Roll-90x150"],
    metadata: {
      ...meta,
      sheetNo: "S-03",
      sheetTitle: "KİRİŞ BOYUNA AÇILIMLARI VE KESİTLERİ",
      scales: "1/25 - 1/20",
    },
    analysisParams,
    columnSchedule: [],
    rebarSchedule: rebarSchedule.filter(r => r.element.includes("Kiriş")),
    notes: STANDARD_ENGINEERING_NOTES,
    concreteCovers: STANDARD_CONCRETE_COVERS,
    viewports: [
      {
        id: "vp-beam-elevations",
        title: "K101 - K102 - K103 KİRİŞLERİ BOYUNA AÇILIMI",
        scaleText: "ÖLÇEK: 1/25 (Boy), 1/20 (Kesit)",
        scaleRatio: 1 / 25,
        xMm: 35,
        yMm: 20,
        widthMm: 1040,
        heightMm: 850,
      },
      {
        id: "vp-beam-antet",
        title: "ANTET VE KİRİŞ BİLGİLERİ",
        scaleText: "1/1",
        scaleRatio: 1,
        xMm: 1090,
        yMm: 20,
        widthMm: 380,
        heightMm: 220,
      },
    ],
  });

  // ==========================================
  // SHEET 5 (S-04): DONATI METRAJ VE BÜKÜM LİSTESİ
  // ==========================================
  sheets.push({
    id: "pafta-s04",
    type: "rebar_schedule",
    sheetNo: "S-04",
    title: "DONATI METRAJ VE BÜKÜM LİSTESİ",
    scaleText: "TABLO",
    dimensions: SHEET_SIZES["A1"],
    metadata: {
      ...meta,
      sheetNo: "S-04",
      sheetTitle: "DONATI METRAJ VE BÜKÜM LİSTESİ",
      scales: "TABLO",
    },
    analysisParams,
    columnSchedule: [],
    rebarSchedule,
    notes: STANDARD_ENGINEERING_NOTES,
    concreteCovers: STANDARD_CONCRETE_COVERS,
    viewports: [
      {
        id: "vp-rebar-table",
        title: "PROJE GENEL DONATI METRAJI VE BÜKÜM ŞEMASI",
        scaleText: "TABLO",
        scaleRatio: 1,
        xMm: 35,
        yMm: 240,
        widthMm: 770,
        heightMm: 330,
      },
      {
        id: "vp-rebar-antet",
        title: "ANTET VE METRAJ ÖZETİ",
        scaleText: "1/1",
        scaleRatio: 1,
        xMm: 450,
        yMm: 20,
        widthMm: 355,
        heightMm: 205,
      },
    ],
  });

  return sheets;
}
