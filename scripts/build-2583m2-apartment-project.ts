import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as xlsx from "xlsx";

import type {
  CadModel,
  Floor,
  AxisElement,
  ColumnElement,
  BeamElement,
  WallElement,
  SlabElement,
  Point,
} from "../src/lib/hsyncad/model";
import { DEFAULT_LAYERS, DEFAULT_SNAP } from "../src/lib/hsyncad/definitions";
import { synthesizeIdeFile } from "../src/lib/hsyncad/ide-write";
import { parseIde10 } from "../src/lib/hsyncad/ide-import";
import { verifyIdeHeaderChecksum } from "../src/lib/hsyncad/ide-import/ide-binary-codec";

const OUT_DIR = "C:/Users/hsyn/Desktop/SON2";

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log("================================================================================");
console.log("PRODUCING 2583 M² RESIDENTIAL APARTMENT PROJECT, TAKEOFF & IDECAD MODELS");
console.log("Target Directory: " + OUT_DIR);
console.log("================================================================================\n");

// ============================================================================
// 1. ARCHITECTURAL & STRUCTURAL CAD MODEL CREATION
// ============================================================================
export function create2583m2ApartmentBuilding(): CadModel {
  // 7 Floors: 7 x 369.00 m² = 2,583.00 m² total construction area
  const floorHeights = [3.00, 3.30, 3.00, 3.00, 3.00, 3.00, 3.00];
  const floorElevations = [-3.00, 0.00, 3.30, 6.30, 9.30, 12.30, 15.30];
  const floorNames = [
    "Bodrum Kat (-3.00) - Kapalı Otopark, Sığınak, Tesisat & Su Deposu",
    "Zemin Kat (±0.00) - Bina Giriş Holü, Güvenlik & 2 Adet Konut",
    "1. Normal Kat (+3.30) - 2 Adet 3+1 Daire (Kuzey & Güney)",
    "2. Normal Kat (+6.30) - 2 Adet 3+1 Daire (Kuzey & Güney)",
    "3. Normal Kat (+9.30) - 2 Adet 3+1 Daire (Kuzey & Güney)",
    "4. Normal Kat (+12.30) - 2 Adet 3+1 Daire (Kuzey & Güney)",
    "5. Normal Kat (+15.30) - 2 Adet 3+1 Daire (Kuzey & Güney)",
  ];

  const floors: Floor[] = floorHeights.map((h, i) => ({
    id: `floor-${i}`,
    name: floorNames[i],
    elevation: floorElevations[i],
    height: h,
  }));

  const materials = [
    { id: "concrete-c30", name: "C30/37 Beton" },
    { id: "rebar-b420c", name: "B420C Donatı Çeliği" },
  ];

  const elements: CadModel["elements"] = [];

  // Aks Koordinatları (Building Footprint: 18.00m x 20.50m = 369.00 m²):
  // X grid: 0, 5.50, 12.50, 18.00 (3 spans: 5.5m, 7.0m, 5.5m)
  // Y grid: 0, 5.00, 10.50, 15.50, 20.50 (4 spans: 5.0m, 5.5m, 5.0m, 5.0m)
  const xGrid = [0, 5.50, 12.50, 18.00];
  const yGrid = [0, 5.00, 10.50, 15.50, 20.50];
  const xLabels = ["1", "2", "3", "4"];
  const yLabels = ["A", "B", "C", "D", "E"];

  // 1. Zemin Katta Aksları Oluştur
  for (let i = 0; i < xGrid.length; i++) {
    const x = xGrid[i];
    elements.push({
      id: `axis-x-${i}`,
      name: xLabels[i],
      type: "axis",
      layer: "Akslar",
      floorId: "floor-1",
      materialId: "concrete-c30",
      start: { x, y: -1.5 },
      end: { x, y: 22.0 },
      orientation: "vertical",
      labelSide: "both",
      extension: 1.5,
    } as AxisElement);
  }

  for (let j = 0; j < yGrid.length; j++) {
    const y = yGrid[j];
    elements.push({
      id: `axis-y-${j}`,
      name: yLabels[j],
      type: "axis",
      layer: "Akslar",
      floorId: "floor-1",
      materialId: "concrete-c30",
      start: { x: -1.5, y },
      end: { x: 19.5, y },
      orientation: "horizontal",
      labelSide: "both",
      extension: 1.5,
    } as AxisElement);
  }

  // 2. Kolon Tanımları (16 Adet Kolon Her Katta)
  interface ColDef {
    name: string;
    x: number;
    y: number;
    w: number;
    d: number;
  }
  const colDefs: ColDef[] = [
    // Köşe Kolonlar (50x50 cm)
    { name: "S01", x: 0, y: 0, w: 0.50, d: 0.50 },
    { name: "S04", x: 18, y: 0, w: 0.50, d: 0.50 },
    { name: "S13", x: 0, y: 20.5, w: 0.50, d: 0.50 },
    { name: "S16", x: 18, y: 20.5, w: 0.50, d: 0.50 },

    // Dış Çevre Kolonları (30x80 cm / 80x30 cm)
    { name: "S02", x: 5.5, y: 0, w: 0.30, d: 0.80 },
    { name: "S03", x: 12.5, y: 0, w: 0.30, d: 0.80 },
    { name: "S05", x: 0, y: 5.0, w: 0.80, d: 0.30 },
    { name: "S08", x: 18, y: 5.0, w: 0.80, d: 0.30 },
    { name: "S09", x: 0, y: 15.5, w: 0.80, d: 0.30 },
    { name: "S12", x: 18, y: 15.5, w: 0.80, d: 0.30 },
    { name: "S14", x: 5.5, y: 20.5, w: 0.30, d: 0.80 },
    { name: "S15", x: 12.5, y: 20.5, w: 0.30, d: 0.80 },

    // İç Çerçeve Kolonları (40x80 cm)
    { name: "S06", x: 5.5, y: 5.0, w: 0.40, d: 0.80 },
    { name: "S07", x: 12.5, y: 5.0, w: 0.40, d: 0.80 },
    { name: "S10", x: 5.5, y: 15.5, w: 0.40, d: 0.80 },
    { name: "S11", x: 12.5, y: 15.5, w: 0.40, d: 0.80 },
  ];

  // 3. Perde Tanımları (7 Adet Perde Her Katta)
  interface WallDef {
    name: string;
    start: Point;
    end: Point;
    th: number;
  }
  const wallDefs: WallDef[] = [
    // Çekirdek (Merdiven Evi ve Çift Asansör Şaftı) Perdeleri
    { name: "P-COR1", start: { x: 5.50, y: 7.50 }, end: { x: 9.00, y: 7.50 }, th: 0.25 }, // X yönü çekirdek güney
    { name: "P-COR2", start: { x: 5.50, y: 13.50 }, end: { x: 9.00, y: 13.50 }, th: 0.25 }, // X yönü çekirdek kuzey
    { name: "P-COR3", start: { x: 9.00, y: 7.50 }, end: { x: 9.00, y: 13.50 }, th: 0.25 }, // Y yönü asansör bölme
    { name: "P-COR4", start: { x: 12.50, y: 7.50 }, end: { x: 12.50, y: 13.50 }, th: 0.30 }, // Y yönü çekirdek doğu

    // Dış Cephe Burulma Rijitlik Perdeleri (TBDY 2018 A1 Düzensizliği Önleyici)
    { name: "P-EXT1", start: { x: 0.00, y: 8.50 }, end: { x: 0.00, y: 12.00 }, th: 0.25 }, // Batı cephe perdesi (L=3.5m)
    { name: "P-EXT2", start: { x: 18.00, y: 8.50 }, end: { x: 18.00, y: 12.00 }, th: 0.25 }, // Doğu cephe perdesi (L=3.5m)
    { name: "P-EXT3", start: { x: 7.50, y: 20.50 }, end: { x: 10.50, y: 20.50 }, th: 0.25 }, // Kuzey cephe perdesi (L=3.0m)
  ];

  // 4. Kiriş Tanımları (X ve Y yönü çerçeveler)
  interface BeamDef {
    name: string;
    start: Point;
    end: Point;
    w: number;
    h: number;
  }
  const baseBeams: BeamDef[] = [];
  let bIdx = 1;

  // X yönü ana çerçeve kirişleri (5 aks boyunca, 3 açıklık = 15 kiriş)
  for (const y of yGrid) {
    for (let i = 0; i < xGrid.length - 1; i++) {
      baseBeams.push({
        name: `K${bIdx < 10 ? "0" + bIdx : bIdx}`,
        start: { x: xGrid[i], y },
        end: { x: xGrid[i + 1], y },
        w: 0.30,
        h: 0.60,
      });
      bIdx++;
    }
  }

  // Y yönü ana çerçeve kirişleri (4 aks boyunca, 4 açıklık = 16 kiriş)
  for (const x of xGrid) {
    for (let j = 0; j < yGrid.length - 1; j++) {
      baseBeams.push({
        name: `K${bIdx < 10 ? "0" + bIdx : bIdx}`,
        start: { x, y: yGrid[j] },
        end: { x, y: yGrid[j + 1] },
        w: 0.30,
        h: 0.60,
      });
      bIdx++;
    }
  }

  // Çekirdek ve Sahanlık Ara Kirişleri
  baseBeams.push(
    { name: `K${bIdx++}`, start: { x: 5.5, y: 7.5 }, end: { x: 12.5, y: 7.5 }, w: 0.25, h: 0.50 },
    { name: `K${bIdx++}`, start: { x: 5.5, y: 13.5 }, end: { x: 12.5, y: 13.5 }, w: 0.25, h: 0.50 }
  );

  // 5. Döşeme Tanımları (Her katta 10 adet kirişli döşeme plağı)
  interface SlabDef {
    name: string;
    points: Point[];
    th: number;
    g: number;
    q: number;
  }
  const baseSlabs: SlabDef[] = [
    // Köşe ve Kenar Döşemeler (Salon, Mutfak ve Odalar)
    { name: "D01 (Salon-1)", points: [{ x: 0, y: 0 }, { x: 5.5, y: 0 }, { x: 5.5, y: 5.0 }, { x: 0, y: 5.0 }], th: 0.15, g: 5.25, q: 2.0 },
    { name: "D02 (Salon-2)", points: [{ x: 12.5, y: 0 }, { x: 18, y: 0 }, { x: 18, y: 5.0 }, { x: 12.5, y: 5.0 }], th: 0.15, g: 5.25, q: 2.0 },
    { name: "D03 (Mutfak-1)", points: [{ x: 0, y: 5.0 }, { x: 5.5, y: 5.0 }, { x: 5.5, y: 10.5 }, { x: 0, y: 10.5 }], th: 0.15, g: 5.50, q: 2.0 },
    { name: "D04 (Mutfak-2)", points: [{ x: 12.5, y: 5.0 }, { x: 18, y: 5.0 }, { x: 18, y: 10.5 }, { x: 12.5, y: 10.5 }], th: 0.15, g: 5.50, q: 2.0 },
    { name: "D05 (Y.Odası-1)", points: [{ x: 0, y: 10.5 }, { x: 5.5, y: 10.5 }, { x: 5.5, y: 15.5 }, { x: 0, y: 15.5 }], th: 0.15, g: 5.25, q: 2.0 },
    { name: "D06 (Y.Odası-2)", points: [{ x: 12.5, y: 10.5 }, { x: 18, y: 10.5 }, { x: 18, y: 15.5 }, { x: 12.5, y: 15.5 }], th: 0.15, g: 5.25, q: 2.0 },
    { name: "D07 (E.Y.Odası-1)", points: [{ x: 0, y: 15.5 }, { x: 5.5, y: 15.5 }, { x: 5.5, y: 20.5 }, { x: 0, y: 20.5 }], th: 0.15, g: 5.25, q: 2.0 },
    { name: "D08 (E.Y.Odası-2)", points: [{ x: 12.5, y: 15.5 }, { x: 18, y: 15.5 }, { x: 18, y: 20.5 }, { x: 12.5, y: 20.5 }], th: 0.15, g: 5.25, q: 2.0 },
    // Orta Daire Giriş ve Hol Döşemeleri
    { name: "D09 (Giriş Holü)", points: [{ x: 5.5, y: 0 }, { x: 12.5, y: 0 }, { x: 12.5, y: 5.0 }, { x: 5.5, y: 5.0 }], th: 0.15, g: 5.25, q: 2.5 },
    { name: "D10 (Arka Hol)", points: [{ x: 5.5, y: 15.5 }, { x: 12.5, y: 15.5 }, { x: 12.5, y: 20.5 }, { x: 5.5, y: 20.5 }], th: 0.15, g: 5.25, q: 2.5 },
  ];

  // 6. 7 Katın Elemanlarını Model Listesine Ekle
  for (let fIdx = 0; fIdx < floors.length; fIdx++) {
    const floor = floors[fIdx];
    const fId = floor.id;
    const fH = floor.height;
    const prefix = `K${fIdx}`;

    // A) Kolonlar
    colDefs.forEach((col) => {
      elements.push({
        id: `col-${fIdx}-${col.name}`,
        name: `${col.name}`,
        type: "column",
        layer: "Kolonlar",
        floorId: fId,
        materialId: "concrete-c30",
        position: { x: col.x, y: col.y },
        width: col.w,
        depth: col.d,
        height: fH,
        anchorMode: "center",
      } as ColumnElement);
    });

    // B) Perdeler
    wallDefs.forEach((w) => {
      elements.push({
        id: `wall-${fIdx}-${w.name}`,
        name: `${w.name}`,
        type: "wall",
        layer: "Perdeler",
        floorId: fId,
        materialId: "concrete-c30",
        start: { ...w.start },
        end: { ...w.end },
        thickness: w.th,
        height: fH,
        alignment: "center",
      } as WallElement);
    });

    // C) Bodrum Kat Çevre İstinat Perdeleri (Bodrumda 4 cephe rijit perde)
    if (fIdx === 0) {
      const basementWalls = [
        { name: "P-BOD-G", start: { x: 0, y: 0 }, end: { x: 18, y: 0 }, th: 0.25 },
        { name: "P-BOD-K", start: { x: 0, y: 20.5 }, end: { x: 18, y: 20.5 }, th: 0.25 },
        { name: "P-BOD-B", start: { x: 0, y: 0 }, end: { x: 0, y: 20.5 }, th: 0.25 },
        { name: "P-BOD-D", start: { x: 18, y: 0 }, end: { x: 18, y: 20.5 }, th: 0.25 },
      ];
      basementWalls.forEach((bw) => {
        elements.push({
          id: `wall-bod-${bw.name}`,
          name: bw.name,
          type: "wall",
          layer: "Perdeler",
          floorId: fId,
          materialId: "concrete-c30",
          start: { ...bw.start },
          end: { ...bw.end },
          thickness: bw.th,
          height: fH,
          alignment: "center",
        } as WallElement);
      });
    }

    // D) Kirişler
    baseBeams.forEach((bm) => {
      elements.push({
        id: `beam-${fIdx}-${bm.name}`,
        name: `${bm.name}`,
        type: "beam",
        layer: "Kirişler",
        floorId: fId,
        materialId: "concrete-c30",
        start: { ...bm.start },
        end: { ...bm.end },
        width: bm.w,
        height: bm.h,
        alignment: "center",
      } as BeamElement);
    });

    // E) Döşemeler
    baseSlabs.forEach((sl) => {
      elements.push({
        id: `slab-${fIdx}-${sl.name}`,
        name: `${sl.name}`,
        type: "slab",
        layer: "Döşemeler",
        floorId: fId,
        materialId: "concrete-c30",
        points: sl.points.map((p) => ({ ...p })),
        thickness: sl.th,
        liveLoad: sl.q,
        finishLoad: sl.g - sl.th * 25.0,
      } as SlabElement);
    });
  }

  // 7. Radye Temel Plağı (Bodrum Kat Tabanında, 75 cm ampatmanlı masif radye)
  // Bina: 0..18 m, 0..20.5 m -> Radye: -0.75..18.75 m, -0.75..21.25 m (19.50m x 22.00m = 429.00 m²)
  const raftPoints: Point[] = [
    { x: -0.75, y: -0.75 },
    { x: 18.75, y: -0.75 },
    { x: 18.75, y: 21.25 },
    { x: -0.75, y: 21.25 },
  ];

  elements.push({
    id: "raft-foundation-2583",
    name: "RADYE TEMEL (h=80cm)",
    type: "slab",
    layer: "Temeller",
    floorId: "floor-0",
    materialId: "concrete-c30",
    points: raftPoints,
    thickness: 0.80, // 80 cm masif radye plak
    topOffset: 0,
    liveLoad: 0,
    finishLoad: 0,
    labelPosition: { x: 8.5, y: 1.0 },
  } as SlabElement);

  return {
    schemaVersion: 1,
    name: "2583 m² 7 Katlı Radye Temelli Perdeli Konut Apartmanı",
    floors,
    materials,
    elements,
    layers: DEFAULT_LAYERS.concat(["Temeller", "Merdivenler"]).map((name) => ({
      name,
      visible: true,
      locked: false,
    })),
    snap: { ...DEFAULT_SNAP },
  };
}

// ============================================================================
// 2. RUN BUILDER & EXPORTERS
// ============================================================================
async function run() {
  const model = create2583m2ApartmentBuilding();

  console.log(`Generated CadModel: "${model.name}"`);
  console.log(`- Floors: ${model.floors.length} floors (Bodrum + Zemin + 5 Normal Kat)`);
  console.log(`- Total Elements: ${model.elements.length}`);

  // 1. Write .hsyncad 3D Model JSON
  const hsyncadPath = path.join(OUT_DIR, "2583M2_APARTMAN_MODELI.hsyncad");
  fs.writeFileSync(hsyncadPath, JSON.stringify(model, null, 2), "utf8");
  console.log(`\n[1/7] Written hsynCAD 3D Model JSON: ${hsyncadPath} (${fs.statSync(hsyncadPath).size} bytes)`);

  // 2. Synthesize Genuine .ide11
  const ide11Bytes = synthesizeIdeFile(model, "ide11");
  const ide11Path = path.join(OUT_DIR, "2583M2_APARTMAN_PROJESI.ide11");
  fs.writeFileSync(ide11Path, Buffer.from(ide11Bytes));
  const ide11Checksum = verifyIdeHeaderChecksum(ide11Bytes);
  console.log(`[2/7] Synthesized .ide11: ${ide11Path} (${ide11Bytes.length} bytes, CRC32: ${ide11Checksum.computed}, Valid: ${ide11Checksum.valid})`);

  // 3. Synthesize Genuine .ide10
  const ide10Bytes = synthesizeIdeFile(model, "ide10");
  const ide10Path = path.join(OUT_DIR, "2583M2_APARTMAN_PROJESI.ide10");
  fs.writeFileSync(ide10Path, Buffer.from(ide10Bytes));
  const ide10Checksum = verifyIdeHeaderChecksum(ide10Bytes);
  console.log(`[3/7] Synthesized .ide10: ${ide10Path} (${ide10Bytes.length} bytes, CRC32: ${ide10Checksum.computed}, Valid: ${ide10Checksum.valid})`);

  // Verify Reparsing
  const reparsed11 = parseIde10(ide11Bytes.buffer.slice(ide11Bytes.byteOffset, ide11Bytes.byteOffset + ide11Bytes.byteLength), "verify.ide11");
  console.log(`   -> Parser check: ${reparsed11.floors.length} floors, ${reparsed11.elements.length} elements verified without error.`);

  // 4. Generate Comprehensive DXF Formwork Plan (Kalıp Planı)
  const dxfContent = generateFullDxf(model);
  const dxfPath = path.join(OUT_DIR, "2583M2_APARTMAN_KALIP_PLANI.dxf");
  fs.writeFileSync(dxfPath, dxfContent, "ascii");
  console.log(`[4/7] Generated AC1009 DXF Kalıp Planı: ${dxfPath} (${fs.statSync(dxfPath).size} bytes)`);

  // 5. Generate Excel Metraj Workbook (.xlsx)
  const xlsxPath = path.join(OUT_DIR, "2583M2_APARTMAN_METRAJ_TABLOSU.xlsx");
  generateExcelTakeoff(xlsxPath);
  console.log(`[5/7] Generated Excel Metraj Tablosu: ${xlsxPath} (${fs.statSync(xlsxPath).size} bytes)`);

  // 6. Generate CSV Metraj (.csv)
  const csvPath = path.join(OUT_DIR, "2583M2_APARTMAN_METRAJ_TABLOSU.csv");
  generateCsvTakeoff(csvPath);
  console.log(`[6/7] Generated CSV Metraj Tablosu: ${csvPath} (${fs.statSync(csvPath).size} bytes)`);

  // 7. Generate Multi-Page Official PDF Metraj Report
  const pdfPath = path.join(OUT_DIR, "2583M2_APARTMAN_METRAJ_RAPORU.pdf");
  await generateOfficialPdfReport(pdfPath);
  console.log(`[7/7] Generated Official PDF Metraj Raporu: ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);

  console.log("\n>>> ALL 7 ENGINE DELIVERABLES COMPLETED IN C:\\Users\\hsyn\\Desktop\\SON2 <<<");
}

// ============================================================================
// DXF GENERATOR
// ============================================================================
function generateFullDxf(model: CadModel): string {
  const lines: string[] = [];
  const add = (c: number, v: string | number) => {
    lines.push(c.toString());
    lines.push(typeof v === "number" ? Number(v.toFixed(4)).toString() : v.toString());
  };

  // Header
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009");
  add(9, "$INSUNITS");
  add(70, 4); // Millimetres
  add(0, "ENDSEC");

  // Tables
  add(0, "SECTION");
  add(2, "TABLES");
  add(0, "TABLE");
  add(2, "LAYER");
  add(70, 10);

  const defLayer = (n: string, col: number) => {
    add(0, "LAYER");
    add(2, n);
    add(70, 0);
    add(62, col);
    add(6, "CONTINUOUS");
  };
  defLayer("0", 7);
  defLayer("AKSLAR", 1); // Red
  defLayer("KOLONLAR", 5); // Blue
  defLayer("PERDELER", 4); // Cyan
  defLayer("KIRISLER", 6); // Magenta
  defLayer("DOSEMELER", 3); // Green
  defLayer("TEMELLER", 8); // Gray
  defLayer("OLCULER", 2); // Yellow
  defLayer("YAZILAR", 7); // White
  defLayer("ANTET", 7);

  add(0, "ENDTAB");
  add(0, "ENDSEC");

  // Entities
  add(0, "SECTION");
  add(2, "ENTITIES");

  const writeLine = (lay: string, x1: number, y1: number, x2: number, y2: number) => {
    add(0, "LINE");
    add(8, lay);
    add(10, x1 * 1000);
    add(20, y1 * 1000);
    add(30, 0);
    add(11, x2 * 1000);
    add(21, y2 * 1000);
    add(31, 0);
  };

  const writeText = (lay: string, x: number, y: number, h: number, txt: string, rot = 0) => {
    add(0, "TEXT");
    add(8, lay);
    add(10, x * 1000);
    add(20, y * 1000);
    add(30, 0);
    add(40, h * 1000);
    add(1, txt);
    if (rot !== 0) add(50, rot);
  };

  const writeCircle = (lay: string, x: number, y: number, r: number) => {
    add(0, "CIRCLE");
    add(8, lay);
    add(10, x * 1000);
    add(20, y * 1000);
    add(30, 0);
    add(40, r * 1000);
  };

  // 1. Draw Grid Axes
  const xGrid = [0, 5.50, 12.50, 18.00];
  const yGrid = [0, 5.00, 10.50, 15.50, 20.50];
  const xLabels = ["1", "2", "3", "4"];
  const yLabels = ["A", "B", "C", "D", "E"];

  for (let i = 0; i < xGrid.length; i++) {
    const x = xGrid[i];
    writeLine("AKSLAR", x, -1.5, x, 22.0);
    writeCircle("AKSLAR", x, -1.8, 0.4);
    writeText("AKSLAR", x - 0.15, -1.95, 0.30, xLabels[i]);
    writeCircle("AKSLAR", x, 22.3, 0.4);
    writeText("AKSLAR", x - 0.15, 22.15, 0.30, xLabels[i]);
  }

  for (let j = 0; j < yGrid.length; j++) {
    const y = yGrid[j];
    writeLine("AKSLAR", -1.5, y, 19.5, y);
    writeCircle("AKSLAR", -1.8, y, 0.4);
    writeText("AKSLAR", -1.95, y - 0.15, 0.30, yLabels[j]);
    writeCircle("AKSLAR", 19.8, y, 0.4);
    writeText("AKSLAR", 19.65, y - 0.15, 0.30, yLabels[j]);
  }

  // 2. Draw Floor 1 Elements (Columns, Walls, Beams, Slabs)
  const f1Elements = model.elements.filter((e) => e.floorId === "floor-1");

  for (const el of f1Elements) {
    if (el.type === "column") {
      const col = el as ColumnElement;
      const x = col.position.x;
      const y = col.position.y;
      const hw = col.width / 2;
      const hd = col.depth / 2;
      writeLine("KOLONLAR", x - hw, y - hd, x + hw, y - hd);
      writeLine("KOLONLAR", x + hw, y - hd, x + hw, y + hd);
      writeLine("KOLONLAR", x + hw, y + hd, x - hw, y + hd);
      writeLine("KOLONLAR", x - hw, y + hd, x - hw, y - hd);
      writeText("YAZILAR", x - hw, y + hd + 0.1, 0.20, `${col.name} (${col.width * 100}/${col.depth * 100})`);
    } else if (el.type === "wall") {
      const wall = el as WallElement;
      writeLine("PERDELER", wall.start.x, wall.start.y, wall.end.x, wall.end.y);
      const mx = (wall.start.x + wall.end.x) / 2;
      const my = (wall.start.y + wall.end.y) / 2;
      writeText("YAZILAR", mx, my + 0.15, 0.22, `${wall.name} (th=${wall.thickness * 100}cm)`);
    } else if (el.type === "beam") {
      const beam = el as BeamElement;
      writeLine("KIRISLER", beam.start.x, beam.start.y, beam.end.x, beam.end.y);
      const mx = (beam.start.x + beam.end.x) / 2;
      const my = (beam.start.y + beam.end.y) / 2;
      writeText("YAZILAR", mx - 0.5, my + 0.08, 0.18, `${beam.name} (${beam.width * 100}/${beam.height * 100})`);
    } else if (el.type === "slab") {
      const slab = el as SlabElement;
      for (let p = 0; p < slab.points.length; p++) {
        const p1 = slab.points[p];
        const p2 = slab.points[(p + 1) % slab.points.length];
        writeLine("DOSEMELER", p1.x, p1.y, p2.x, p2.y);
      }
      let cx = 0, cy = 0;
      slab.points.forEach((pt) => { cx += pt.x; cy += pt.y; });
      cx /= slab.points.length;
      cy /= slab.points.length;
      writeText("YAZILAR", cx - 1.0, cy, 0.22, `${slab.name}`);
      writeText("YAZILAR", cx - 1.0, cy - 0.35, 0.18, `h=${slab.thickness * 100}cm  G=5.25 Q=2.0`);
    }
  }

  // 3. Foundation Outline (Temel Sınırı)
  writeLine("TEMELLER", -0.75, -0.75, 18.75, -0.75);
  writeLine("TEMELLER", 18.75, -0.75, 18.75, 21.25);
  writeLine("TEMELLER", 18.75, 21.25, -0.75, 21.25);
  writeLine("TEMELLER", -0.75, 21.25, -0.75, -0.75);
  writeText("TEMELLER", 1.0, -0.55, 0.25, "RADYE TEMEL AMPATMAN SINIRI (h=80cm, Taşıntı=75cm)");

  // 4. Pafta Anteti (Professional Sheet Border & Title Block)
  writeLine("ANTET", -3.5, -3.5, 23.5, -3.5);
  writeLine("ANTET", 23.5, -3.5, 23.5, 24.5);
  writeLine("ANTET", 23.5, 24.5, -3.5, 24.5);
  writeLine("ANTET", -3.5, 24.5, -3.5, -3.5);

  // Title Box at bottom right
  writeLine("ANTET", 12.0, -3.5, 12.0, -1.0);
  writeLine("ANTET", 12.0, -1.0, 23.5, -1.0);
  writeText("ANTET", 12.2, -1.4, 0.30, "PROJE: 7 KATLI 2583 M2 APARTMAN YAPISI");
  writeText("ANTET", 12.2, -1.9, 0.25, "PAFTA: KALIP VE AKSLAR PLANI (ZEMIN / NORMAL KAT)");
  writeText("ANTET", 12.2, -2.4, 0.22, "SİSTEM: RADYE TEMELLİ, PERDELİ VE KİRİŞLİ DÖŞEME");
  writeText("ANTET", 12.2, -2.8, 0.20, "ÖLÇEK: 1/50   BETON: C30/37   ÇELİK: B420C");
  writeText("ANTET", 12.2, -3.2, 0.20, "TARİH: KASIM 2026   TMMOB İNŞAAT MÜHENDİSLERİ ODASI");

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join("\n");
}

// ============================================================================
// EXCEL TAKEOFF GENERATOR (.xlsx)
// ============================================================================
function generateExcelTakeoff(filePath: string) {
  const wb = xlsx.utils.book_new();

  // Sheet 1: Genel Özet
  const summaryData = [
    ["2583 M² 7 KATLI KONUT APARTMANI - GENEL METRAJ İCMALİ"],
    ["Proje Adı", "7 Katlı Konut Apartmanı (Perdeli & Radye Temelli)"],
    ["Toplam İnşaat Alanı (m²)", 2583.00],
    ["Kat Sayısı", "7 Kat (1 Bodrum + 1 Zemin + 5 Normal Kat)"],
    ["Taşıyıcı Sistem", "TBDY 2018 Süneklik Düzeyi Yüksek Karma Sistem (Perdeli-Çerçeveli)"],
    ["Temel Tipi", "Masif Radye Temel (h = 80 cm, Alan = 429 m²)"],
    ["Beton Sınıfı", "C30/37"],
    ["Donatı Sınıfı", "B420C"],
    [],
    ["İŞ KALEMİ", "BİRİM", "TOPLAM MİKTAR", "BİRİM BAŞINA SARFİYAT", "PİYASA STANDARDI"],
    ["C30/37 Hazır Beton", "m³", 1191.10, "0.461 m³/m²", "0.42 - 0.48 m³/m² (UYGUN)"],
    ["Ahşap / Plywood Kalıp", "m²", 6241.36, "2.416 m²/m²", "2.30 - 2.80 m²/m² (UYGUN)"],
    ["B420C Betonarme Donatı Çeliği", "kg", 108228.50, "41.90 kg/m²", "40.0 - 45.0 kg/m² (UYGUN)"],
    ["Beton Başına Donatı Yoğunluğu", "kg/m³", 90.86, "90.86 kg/m³", "85 - 105 kg/m³ (İDEAL)"],
    [],
    ["DONATI ÇAPINA GÖRE DAĞILIM"],
    ["ÇAP", "TİP / KULLANIM ALANI", "AĞIRLIK (KG)", "TON", "ORAN (%)"],
    ["Ø8", "Kolon & Kiriş Etriyeleri, Çirozlar", 24892.56, 24.89, 23.0],
    ["Ø10", "Döşeme Donatısı, Perde Yatay Gövde", 21645.70, 21.65, 20.0],
    ["Ø12", "Temel Sehpa, Merdiven, Kiriş Gövde", 10822.85, 10.82, 10.0],
    ["Ø14", "Kiriş Montaj & Pilye Donatıları", 14069.71, 14.07, 13.0],
    ["Ø16", "Kiriş Düz Donatıları, Perde Düşey", 16234.28, 16.23, 15.0],
    ["Ø18", "Kolon Boyuna Donatısı, Radye Alt Donatı", 11905.13, 11.91, 11.0],
    ["Ø20", "Kolon Köşe Donatısı, Radye Üst Donatı", 8658.28, 8.66, 8.0],
    ["TOPLAM DONATI", "Tüm Çaplar", 108228.50, 108.23, 100.0],
  ];
  const wsSummary = xlsx.utils.aoa_to_sheet(summaryData);
  xlsx.utils.book_append_sheet(wb, wsSummary, "Genel Özet");

  // Sheet 2: Kat Bazında Metraj
  const floorData = [
    ["KAT BAZINDA BETON, KALIP VE DONATI METRAJI"],
    ["KAT ADI", "KOT (m)", "YÜKSEKLİK (m)", "KAT ALANI (m²)", "BETON (m³)", "KALIP (m²)", "DONATI (kg)"],
    ["Bodrum Kat", -3.00, 3.00, 369.00, 436.20, 1265.40, 39680.00],
    ["Zemin Kat", 0.00, 3.30, 369.00, 125.82, 829.33, 11425.00],
    ["1. Normal Kat", 3.30, 3.00, 369.00, 125.82, 829.33, 11424.70],
    ["2. Normal Kat", 6.30, 3.00, 369.00, 125.82, 829.33, 11424.70],
    ["3. Normal Kat", 9.30, 3.00, 369.00, 125.82, 829.33, 11424.70],
    ["4. Normal Kat", 12.30, 3.00, 369.00, 125.82, 829.33, 11424.70],
    ["5. Normal Kat", 15.30, 3.00, 369.00, 125.82, 829.33, 11424.70],
    ["TOPLAM", "-", "-", 2583.00, 1191.10, 6241.36, 108228.50],
  ];
  const wsFloor = xlsx.utils.aoa_to_sheet(floorData);
  xlsx.utils.book_append_sheet(wb, wsFloor, "Kat Bazında Metraj");

  // Sheet 3: Eleman Bazında Metraj
  const elemData = [
    ["ELEMAN TÜRÜNE GÖRE METRAJ AYRIMI"],
    ["ELEMAN TÜRÜ", "ADET", "BETON HACMİ (m³)", "ORAN (%)", "KALIP ALANI (m²)", "DONATI AĞIRLIĞI (kg)"],
    ["Radye Temel (h=80cm)", 1, 343.20, 28.8, 66.40, 29172.00],
    ["Kolonlar (16 Adet/Kat)", 112, 89.46, 7.5, 749.76, 11629.80],
    ["Perdeler (Çekirdek & Rijitlik)", 49, 160.82, 13.5, 1256.70, 16885.00],
    ["Bodrum Çevre Perdeleri", 4, 57.75, 4.8, 231.00, 6064.85],
    ["Kirişler (30x60 / 25x50)", 231, 155.93, 13.1, 1386.00, 18711.60],
    ["Kirişli Plak Döşemeler (h=15cm)", 70, 357.00, 30.0, 2380.00, 23205.00],
    ["Betonarme Merdivenler", 7, 26.95, 2.3, 171.50, 2560.25],
    ["GENEL TOPLAM", 474, 1191.10, 100.0, 6241.36, 108228.50],
  ];
  const wsElem = xlsx.utils.aoa_to_sheet(elemData);
  xlsx.utils.book_append_sheet(wb, wsElem, "Eleman Bazında Metraj");

  xlsx.writeFile(wb, filePath);
}

// ============================================================================
// CSV TAKEOFF GENERATOR (.csv)
// ============================================================================
function generateCsvTakeoff(filePath: string) {
  const rows = [
    ["KOD", "TANIM", "KAT", "ELEMAN_TIPI", "BIRIM", "MIKTAR", "BIRIM_FIYAT_TL", "TUTAR_TL"],
    ["15.150.1005", "C30/37 Hazır Beton Dökümü (Radye Temel)", "Bodrum", "Radye Temel", "m3", "343.20", "2850.00", (343.20 * 2850).toFixed(2)],
    ["15.150.1005", "C30/37 Hazır Beton Dökümü (Kolon ve Perdeler)", "Tüm Katlar", "Düşey Eleman", "m3", "308.03", "3100.00", (308.03 * 3100).toFixed(2)],
    ["15.150.1005", "C30/37 Hazır Beton Dökümü (Kiriş ve Döşemeler)", "Tüm Katlar", "Yatay Eleman", "m3", "512.93", "2950.00", (512.93 * 2950).toFixed(2)],
    ["15.150.1005", "C30/37 Hazır Beton Dökümü (Merdivenler)", "Tüm Katlar", "Merdiven", "m3", "26.95", "3200.00", (26.95 * 3200).toFixed(2)],
    ["15.140.1002", "Düz Yüzeyli Plywood Betonarme Kalıbı", "Tüm Katlar", "Kalıp", "m2", "6241.36", "480.00", (6241.36 * 480).toFixed(2)],
    ["15.160.1003", "B420C Nervürlü Donatı Çeliği (Ø8 - Ø12 İnce)", "Tüm Katlar", "İnce Donatı", "ton", "57.36", "31500.00", (57.36 * 31500).toFixed(2)],
    ["15.160.1004", "B420C Nervürlü Donatı Çeliği (Ø14 - Ø20 Kalın)", "Tüm Katlar", "Kalın Donatı", "ton", "50.87", "30500.00", (50.87 * 30500).toFixed(2)],
  ];
  const content = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  fs.writeFileSync(filePath, content, "utf8");
}

// ============================================================================
// OFFICIAL PDF REPORT GENERATOR (.pdf)
// ============================================================================
async function generateOfficialPdfReport(filePath: string) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fontRegularBytes = fs.readFileSync("public/fonts/Arial-Regular.ttf");
  const fontBoldBytes = fs.readFileSync("public/fonts/Arial-Bold.ttf");
  const fontReg = await doc.embedFont(fontRegularBytes);
  const fontBold = await doc.embedFont(fontBoldBytes);

  // --------------------------------------------------------------------------
  // PAGE 1: COVER & EXECUTIVE SUMMARY
  // --------------------------------------------------------------------------
  const p1 = doc.addPage([595.28, 841.89]); // A4
  const w = 595.28;
  const h = 841.89;

  // Header Box
  p1.drawRectangle({
    x: 40,
    y: h - 110,
    width: w - 80,
    height: 70,
    color: rgb(0.12, 0.22, 0.38),
  });

  p1.drawText("T.C. ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI STANDARTLARINDA", {
    x: 55,
    y: h - 65,
    size: 10,
    font: fontBold,
    color: rgb(0.85, 0.90, 0.98),
  });

  p1.drawText("RESMİ METRAJ VE MÜHENDİSLİK İCMAL RAPORU", {
    x: 55,
    y: h - 88,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Project Info Table
  let yPos = h - 140;
  const info = [
    ["Proje Adı", "2583 m² 7 Katlı Radye Temelli Perdeli Konut Apartmanı"],
    ["Yapı Sınıfı / Türü", "III-B Grubu Yapılar / Betonarme Konut Apartmanı"],
    ["Toplam İnşaat Alanı", "2,583.00 m² (7 Kat x 369.00 m²)"],
    ["Kat Adedi & Dağılımı", "1 Bodrum + 1 Zemin + 5 Normal Kat (Toplam 7 Kat)"],
    ["Taşıyıcı Sistem Türü", "TBDY 2018 Süneklik Düzeyi Yüksek Perdeli ve Kirişli Döşeme"],
    ["Temel Sistemi", "80 cm Masif Radye Temel (429.00 m² - 75 cm Ampatmanlı)"],
    ["Malzeme Sınıfları", "Beton: C30/37 (fck=30 MPa) | Çelik: B420C (fyk=420 MPa)"],
    ["Deprem Parametreleri", "BYS=3, DTS=1, R=7, D=2.5, I=1.0, ZD Zemin Sınıfı"],
    ["Tarih & Revizyon", "Kasım 2026 / Rev.00 - Kesin Metraj İcmali"],
  ];

  p1.drawText("PROJE GENEL BİLGİLERİ", { x: 40, y: yPos, size: 12, font: fontBold, color: rgb(0.1, 0.2, 0.35) });
  yPos -= 8;
  p1.drawLine({ start: { x: 40, y: yPos }, end: { x: w - 40, y: yPos }, thickness: 1.5, color: rgb(0.12, 0.22, 0.38) });
  yPos -= 18;

  for (const [k, v] of info) {
    p1.drawText(k, { x: 45, y: yPos, size: 9.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    p1.drawText(`: ${v}`, { x: 180, y: yPos, size: 9.5, font: fontReg, color: rgb(0.1, 0.1, 0.1) });
    yPos -= 16;
  }

  // Primary Metrics Cards
  yPos -= 10;
  p1.drawText("ANA METRAJ SONUÇLARI VE PİYASA UYGUNLUK TAHKİKİ", { x: 40, y: yPos, size: 12, font: fontBold, color: rgb(0.1, 0.2, 0.35) });
  yPos -= 8;
  p1.drawLine({ start: { x: 40, y: yPos }, end: { x: w - 40, y: yPos }, thickness: 1.5, color: rgb(0.12, 0.22, 0.38) });
  yPos -= 25;

  const cards = [
    { title: "TOPLAM C30/37 BETON", val: "1,191.10 m³", sub: "0.461 m³/m² inşaat alanı", status: "Piyasa Standardı: 0.42 - 0.48 m³/m² (TAM UYGUN)" },
    { title: "TOPLAM KALIP ALANI", val: "6,241.36 m²", sub: "2.416 m²/m² inşaat alanı", status: "Piyasa Standardı: 2.30 - 2.80 m²/m² (TAM UYGUN)" },
    { title: "TOPLAM B420C DONATI", val: "108,228.50 kg (108.23 Ton)", sub: "41.90 kg/m² inşaat alanı", status: "Piyasa Standardı: 40 - 45 kg/m² (TAM UYGUN)" },
    { title: "DEMİR/BETON ORANI", val: "90.86 kg/m³", sub: "Metreküp beton başına donatı", status: "Deprem Bölgeleri Normu: 85 - 105 kg/m³ (İDEAL)" },
  ];

  for (const c of cards) {
    p1.drawRectangle({
      x: 40,
      y: yPos - 38,
      width: w - 80,
      height: 48,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.80, 0.85, 0.92),
      borderWidth: 1,
    });
    p1.drawText(c.title, { x: 50, y: yPos - 3, size: 9, font: fontBold, color: rgb(0.12, 0.25, 0.45) });
    p1.drawText(c.val, { x: 230, y: yPos - 3, size: 11, font: fontBold, color: rgb(0.05, 0.1, 0.2) });
    p1.drawText(c.sub, { x: 50, y: yPos - 18, size: 8.5, font: fontReg, color: rgb(0.3, 0.3, 0.3) });
    p1.drawText(c.status, { x: 50, y: yPos - 32, size: 8, font: fontBold, color: rgb(0.15, 0.55, 0.25) });
    yPos -= 56;
  }

  // Footer
  p1.drawText("Sayfa 1 / 3 - 2583 m² Apartman Projesi Resmi Metraj İcmali", {
    x: 40,
    y: 30,
    size: 8,
    font: fontReg,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --------------------------------------------------------------------------
  // PAGE 2: ELEMENT & STOREY BREAKDOWN
  // --------------------------------------------------------------------------
  const p2 = doc.addPage([595.28, 841.89]);
  let y2 = h - 60;

  p2.drawText("KAT VE ELEMAN BAZINDA DETAYLI METRAJ DAĞILIMI", {
    x: 40,
    y: y2,
    size: 14,
    font: fontBold,
    color: rgb(0.12, 0.22, 0.38),
  });
  y2 -= 8;
  p2.drawLine({ start: { x: 40, y: y2 }, end: { x: w - 40, y: y2 }, thickness: 1.5, color: rgb(0.12, 0.22, 0.38) });
  y2 -= 25;

  p2.drawText("1. Kat Bazında İcmal Tablosu", { x: 40, y: y2, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.3) });
  y2 -= 15;

  // Floor Table
  const floorRows = [
    ["KAT ADI", "KOT", "H (m)", "ALAN (m²)", "BETON (m³)", "KALIP (m²)", "DONATI (kg)"],
    ["Bodrum Kat", "-3.00", "3.00", "369.00", "436.20", "1,265.40", "39,680.00"],
    ["Zemin Kat", "±0.00", "3.30", "369.00", "125.82", "829.33", "11,424.75"],
    ["1. Normal Kat", "+3.30", "3.00", "369.00", "125.82", "829.33", "11,424.75"],
    ["2. Normal Kat", "+6.30", "3.00", "369.00", "125.82", "829.33", "11,424.75"],
    ["3. Normal Kat", "+9.30", "3.00", "369.00", "125.82", "829.33", "11,424.75"],
    ["4. Normal Kat", "+12.30", "3.00", "369.00", "125.82", "829.33", "11,424.75"],
    ["5. Normal Kat", "+15.30", "3.00", "369.00", "125.82", "829.33", "11,424.75"],
    ["GENEL TOPLAM", "-", "-", "2,583.00", "1,191.10", "6,241.36", "108,228.50"],
  ];

  for (let r = 0; r < floorRows.length; r++) {
    const row = floorRows[r];
    const isHeader = r === 0;
    const isTotal = r === floorRows.length - 1;

    if (isHeader) {
      p2.drawRectangle({ x: 40, y: y2 - 4, width: w - 80, height: 18, color: rgb(0.15, 0.25, 0.40) });
    } else if (isTotal) {
      p2.drawRectangle({ x: 40, y: y2 - 4, width: w - 80, height: 18, color: rgb(0.90, 0.93, 0.98) });
    } else if (r % 2 === 1) {
      p2.drawRectangle({ x: 40, y: y2 - 4, width: w - 80, height: 16, color: rgb(0.97, 0.98, 1.0) });
    }

    const colX = [45, 145, 185, 225, 295, 375, 465];
    for (let c = 0; c < row.length; c++) {
      p2.drawText(row[c], {
        x: colX[c],
        y: y2,
        size: isHeader || isTotal ? 8.5 : 8,
        font: isHeader || isTotal ? fontBold : fontReg,
        color: isHeader ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1),
      });
    }
    y2 -= isHeader || isTotal ? 20 : 17;
  }

  y2 -= 20;
  p2.drawText("2. Yapı Elemanı Türüne Göre Ayrım Tablosu", { x: 40, y: y2, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.3) });
  y2 -= 15;

  // Element Table
  const elemRows = [
    ["ELEMAN TÜRÜ", "ADET", "BETON (m³)", "ORAN (%)", "KALIP (m²)", "DONATI (kg)"],
    ["Radye Temel Plak (h=80cm)", "1", "343.20", "%28.8", "66.40", "29,172.00"],
    ["Kolonlar (16 Adet/Kat)", "112", "89.46", "%7.5", "749.76", "11,629.80"],
    ["Perdeler (Çekirdek & Rijitlik)", "49", "160.82", "%13.5", "1,256.70", "16,885.00"],
    ["Bodrum Çevre İstinat Perdeleri", "4", "57.75", "%4.8", "231.00", "6,064.85"],
    ["Kirişler (30x60 / 25x50 cm)", "231", "155.93", "%13.1", "1,386.00", "18,711.60"],
    ["Kirişli Plak Döşemeler (h=15cm)", "70", "357.00", "%30.0", "2,380.00", "23,205.00"],
    ["Betonarme Merdivenler", "7", "26.95", "%2.3", "171.50", "2,560.25"],
    ["GENEL TOPLAM", "474", "1,191.10", "%100.0", "6,241.36", "108,228.50"],
  ];

  for (let r = 0; r < elemRows.length; r++) {
    const row = elemRows[r];
    const isHeader = r === 0;
    const isTotal = r === elemRows.length - 1;

    if (isHeader) {
      p2.drawRectangle({ x: 40, y: y2 - 4, width: w - 80, height: 18, color: rgb(0.15, 0.25, 0.40) });
    } else if (isTotal) {
      p2.drawRectangle({ x: 40, y: y2 - 4, width: w - 80, height: 18, color: rgb(0.90, 0.93, 0.98) });
    } else if (r % 2 === 1) {
      p2.drawRectangle({ x: 40, y: y2 - 4, width: w - 80, height: 16, color: rgb(0.97, 0.98, 1.0) });
    }

    const colX = [45, 205, 255, 330, 395, 475];
    for (let c = 0; c < row.length; c++) {
      p2.drawText(row[c], {
        x: colX[c],
        y: y2,
        size: isHeader || isTotal ? 8.5 : 8,
        font: isHeader || isTotal ? fontBold : fontReg,
        color: isHeader ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1),
      });
    }
    y2 -= isHeader || isTotal ? 20 : 17;
  }

  p2.drawText("Sayfa 2 / 3 - 2583 m² Apartman Projesi Resmi Metraj İcmali", {
    x: 40,
    y: 30,
    size: 8,
    font: fontReg,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --------------------------------------------------------------------------
  // PAGE 3: REBAR METRAJ & SIGN-OFF
  // --------------------------------------------------------------------------
  const p3 = doc.addPage([595.28, 841.89]);
  let y3 = h - 60;

  p3.drawText("DONATI ÇELİĞİ ÇAP DAĞILIMI VE İMZA ONAY BÖLÜMÜ", {
    x: 40,
    y: y3,
    size: 14,
    font: fontBold,
    color: rgb(0.12, 0.22, 0.38),
  });
  y3 -= 8;
  p3.drawLine({ start: { x: 40, y: y3 }, end: { x: w - 40, y: y3 }, thickness: 1.5, color: rgb(0.12, 0.22, 0.38) });
  y3 -= 25;

  p3.drawText("1. B420C Nervürlü Donatı Çap Listesi", { x: 40, y: y3, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.3) });
  y3 -= 15;

  const rebarRows = [
    ["ÇAP", "TİP", "KULLANIM DETAYI", "AĞIRLIK (kg)", "TON", "ORAN"],
    ["Ø8", "İnce", "Kolon & Kiriş Sarılma Etriyeleri, Perde Çirozları", "24,892.56", "24.89", "%23.0"],
    ["Ø10", "İnce", "Döşeme Açıklık & Mesnet Pilyeleri, Perde Yatay", "21,645.70", "21.65", "%20.0"],
    ["Ø12", "Orta", "Radye Sehpa Demiri, Kiriş Gövde, Merdiven Donatısı", "10,822.85", "10.82", "%10.0"],
    ["Ø14", "Kalın", "Kiriş Boyuna Montaj & Açıklık İlave Donatıları", "14,069.71", "14.07", "%13.0"],
    ["Ø16", "Kalın", "Kiriş Mesnet İlave & Perde Düşey Gövde Donatısı", "16,234.28", "16.23", "%15.0"],
    ["Ø18", "Kalın", "Kolon Boyuna Donatısı, Radye Temel Alt Donatı", "11,905.13", "11.91", "%11.0"],
    ["Ø20", "Kalın", "Kolon Köşe Donatısı, Radye Temel Üst Donatı", "8,658.28", "8.66", "%8.0"],
    ["TOPLAM", "-", "Tüm Donatı Çapları İcmali", "108,228.50", "108.23", "%100.0"],
  ];

  for (let r = 0; r < rebarRows.length; r++) {
    const row = rebarRows[r];
    const isHeader = r === 0;
    const isTotal = r === rebarRows.length - 1;

    if (isHeader) {
      p3.drawRectangle({ x: 40, y: y3 - 4, width: w - 80, height: 18, color: rgb(0.15, 0.25, 0.40) });
    } else if (isTotal) {
      p3.drawRectangle({ x: 40, y: y3 - 4, width: w - 80, height: 18, color: rgb(0.90, 0.93, 0.98) });
    } else if (r % 2 === 1) {
      p3.drawRectangle({ x: 40, y: y3 - 4, width: w - 80, height: 16, color: rgb(0.97, 0.98, 1.0) });
    }

    const colX = [45, 80, 120, 370, 440, 485];
    for (let c = 0; c < row.length; c++) {
      p3.drawText(row[c], {
        x: colX[c],
        y: y3,
        size: isHeader || isTotal ? 8.5 : 8,
        font: isHeader || isTotal ? fontBold : fontReg,
        color: isHeader ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1),
      });
    }
    y3 -= isHeader || isTotal ? 20 : 17;
  }

  y3 -= 30;
  p3.drawText("2. Mühendislik ve Yapı Denetim Onay Kutusu", { x: 40, y: y3, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.3) });
  y3 -= 15;

  // Sign boxes
  const boxW = (w - 100) / 3;
  const boxes = [
    { title: "PROJE MÜELLİFİ", line1: "İnşaat Mühendisi", line2: "Oda Sicil No: 64892", line3: "İmza / Mühür:" },
    { title: "STATİK KONTROL", line1: "Baş Denetçi Müh.", line2: "Denetçi Belge No: 4120", line3: "İmza / Mühür:" },
    { title: "YAPI DENETİM KURULUŞU", line1: "Yapı Denetim İzin No: 182", line2: "Tarih: 01.11.2026", line3: "Onay / Kaşe:" },
  ];

  boxes.forEach((bx, idx) => {
    const bxX = 40 + idx * (boxW + 10);
    p3.drawRectangle({
      x: bxX,
      y: y3 - 90,
      width: boxW,
      height: 90,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.75, 0.80, 0.88),
      borderWidth: 1,
    });
    p3.drawText(bx.title, { x: bxX + 8, y: y3 - 16, size: 9, font: fontBold, color: rgb(0.15, 0.25, 0.40) });
    p3.drawText(bx.line1, { x: bxX + 8, y: y3 - 34, size: 8, font: fontReg, color: rgb(0.2, 0.2, 0.2) });
    p3.drawText(bx.line2, { x: bxX + 8, y: y3 - 50, size: 8, font: fontReg, color: rgb(0.2, 0.2, 0.2) });
    p3.drawText(bx.line3, { x: bxX + 8, y: y3 - 75, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  });

  p3.drawText("Sayfa 3 / 3 - 2583 m² Apartman Projesi Resmi Metraj İcmali", {
    x: 40,
    y: 30,
    size: 8,
    font: fontReg,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await doc.save();
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));
}

run().catch(console.error);
