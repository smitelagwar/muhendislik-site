import type { CadModel, ColumnElement, BeamElement, WallElement, SlabElement, AxisElement } from "./model";
import { elementFootprint } from "./geometry";
import type { PaftaSheetData } from "./pafta-engine";

/**
 * Generates an AutoCAD ASCII DXF (AC1009 / Release 12 / 2000 compatible)
 * for a complete, professional engineering sheet (Pafta).
 * Coordinates are written in Millimetres (1:1 paper space scale).
 */
export function exportPaftaToDxf(sheet: PaftaSheetData, model: CadModel): string {
  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(typeof value === "number" ? Number(value.toFixed(4)).toString() : value.toString());
  };

  // 1. HEADER SECTION
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009");
  add(9, "$INSUNITS");
  add(70, 4); // 4 = Millimetres
  add(0, "ENDSEC");

  // 2. TABLES SECTION
  add(0, "SECTION");
  add(2, "TABLES");

  add(0, "TABLE");
  add(2, "LAYER");
  add(70, 12);

  const defineLayer = (name: string, color: number) => {
    add(0, "LAYER");
    add(2, name);
    add(70, 0);
    add(62, color);
    add(6, "CONTINUOUS");
  };

  defineLayer("0", 7);
  defineLayer("SINIR_CIZGILERI", 5); // Blue
  defineLayer("ANTET", 7);           // White
  defineLayer("TABLOLAR", 4);        // Cyan
  defineLayer("AKSLAR", 1);          // Red
  defineLayer("KOLONLAR", 5);        // Blue
  defineLayer("PERDELER", 4);        // Cyan
  defineLayer("KIRISLER", 6);        // Magenta
  defineLayer("TEMELLER", 8);        // Gray
  defineLayer("DOSEMELER", 3);       // Green
  defineLayer("DONATI", 1);          // Red
  defineLayer("OLCU", 2);            // Yellow
  defineLayer("YAZILAR", 7);         // White

  add(0, "ENDTAB");
  add(0, "ENDSEC");

  // 3. BLOCKS SECTION
  add(0, "SECTION");
  add(2, "BLOCKS");
  add(0, "ENDSEC");

  // 4. ENTITIES SECTION
  add(0, "SECTION");
  add(2, "ENTITIES");

  const writeLine = (layer: string, x1: number, y1: number, x2: number, y2: number) => {
    add(0, "LINE");
    add(8, layer);
    add(10, x1);
    add(20, y1);
    add(30, 0);
    add(11, x2);
    add(21, y2);
    add(31, 0);
  };

  const writeRect = (layer: string, x: number, y: number, w: number, h: number) => {
    writeLine(layer, x, y, x + w, y);
    writeLine(layer, x + w, y, x + w, y + h);
    writeLine(layer, x + w, y + h, x, y + h);
    writeLine(layer, x, y + h, x, y);
  };

  const writeCircle = (layer: string, cx: number, cy: number, radius: number) => {
    add(0, "CIRCLE");
    add(8, layer);
    add(10, cx);
    add(20, cy);
    add(30, 0);
    add(40, radius);
  };

  const writeText = (
    layer: string,
    text: string,
    x: number,
    y: number,
    height: number,
    rotationDeg = 0
  ) => {
    if (!text) return;
    add(0, "TEXT");
    add(8, layer);
    add(10, x);
    add(20, y);
    add(30, 0);
    add(40, height);
    add(1, text);
    if (rotationDeg !== 0) {
      add(50, rotationDeg);
    }
  };

  const { widthMm: W, heightMm: H, marginLeftMm: ml, marginRightMm: mr, marginTopMm: mt, marginBottomMm: mb } = sheet.dimensions;

  // ----------------------------------------------------
  // A. SHEET BORDERS & MARGINS (Double Frame Standard)
  // ----------------------------------------------------
  // Outer paper cut border
  writeRect("SINIR_CIZGILERI", 0, 0, W, H);
  // Inner margin border (25mm left binding margin, 10mm top/right/bottom)
  const innerX = ml;
  const innerY = mb;
  const innerW = W - ml - mr;
  const innerH = H - mt - mb;
  writeRect("SINIR_CIZGILERI", innerX, innerY, innerW, innerH);
  // Secondary thin border 1.5mm inside
  writeRect("SINIR_CIZGILERI", innerX + 1.5, innerY + 1.5, innerW - 3, innerH - 3);

  // Sheet folding tick marks (every 210mm from right edge per DIN/TSE)
  for (let fx = W - 210; fx > ml; fx -= 210) {
    writeLine("SINIR_CIZGILERI", fx, 0, fx, 5);
    writeLine("SINIR_CIZGILERI", fx, H - 5, fx, H);
  }

  // ----------------------------------------------------
  // B. MUNICIPAL & ENGINEERING TITLE BLOCK (ANTET)
  // ----------------------------------------------------
  const antetW = 380;
  const antetH = 220;
  const antetX = W - mr - antetW;
  const antetY = mb;

  writeRect("ANTET", antetX, antetY, antetW, antetH);
  // Header section
  writeLine("ANTET", antetX, antetY + antetH - 25, antetX + antetW, antetY + antetH - 25);
  writeText("ANTET", "T.C. İSTANBUL VALİLİĞİ / ÇEVRE ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ İL MÜDÜRLÜĞÜ", antetX + 15, antetY + antetH - 12, 4);
  writeText("ANTET", "STATİK BETONARME UYGULAMA VE DEPREM GÜVENLİK PROJESİ", antetX + 45, antetY + antetH - 20, 5);

  // Horizontal divisions
  writeLine("ANTET", antetX, antetY + 145, antetX + antetW, antetY + 145);
  writeLine("ANTET", antetX, antetY + 105, antetX + antetW, antetY + 105);
  writeLine("ANTET", antetX, antetY + 65, antetX + antetW, antetY + 65);
  writeLine("ANTET", antetX, antetY + 35, antetX + antetW, antetY + 35);

  // Vertical divisions
  writeLine("ANTET", antetX + 190, antetY + 35, antetX + 190, antetY + 145);
  writeLine("ANTET", antetX + 95, antetY, antetX + 95, antetY + 35);
  writeLine("ANTET", antetX + 190, antetY, antetX + 190, antetY + 35);
  writeLine("ANTET", antetX + 285, antetY, antetX + 285, antetY + 35);

  // Project Info
  const m = sheet.metadata;
  writeText("ANTET", "PROJE ADI:", antetX + 6, antetY + 182, 3.5);
  writeText("ANTET", m.projectName, antetX + 6, antetY + 172, 5.5);
  writeText("ANTET", `YAPI TİPİ: ${m.buildingType}  |  KAT ADEDİ: ${m.totalFloors}  |  TOPLAM İNŞAAT ALANI: ${m.totalAreaM2} m²`, antetX + 6, antetY + 155, 3.5);

  // Owner & Location
  writeText("ANTET", "YAPI SAHİBİ:", antetX + 6, antetY + 135, 3.5);
  writeText("ANTET", m.owner, antetX + 6, antetY + 125, 4.5);
  writeText("ANTET", `İL / İLÇE: ${m.city} / ${m.district}`, antetX + 6, antetY + 115, 3.5);
  writeText("ANTET", `ADA / PARSEL: ${m.block} / ${m.parcel} (${m.neighborhood} Mah.)`, antetX + 6, antetY + 107, 3.5);

  // Engineer Info
  writeText("ANTET", "PROJE MÜELLİFİ (İNŞAAT MÜH.):", antetX + 196, antetY + 135, 3.5);
  writeText("ANTET", m.engineerName, antetX + 196, antetY + 125, 4.5);
  writeText("ANTET", `${m.engineerChamberNo}  |  ${m.engineerLicence}`, antetX + 196, antetY + 115, 3.5);

  // Inspection & Design Team
  writeText("ANTET", "YAPI DENETİM KURULUŞU:", antetX + 6, antetY + 95, 3.5);
  writeText("ANTET", m.inspectorCompany, antetX + 6, antetY + 85, 4.0);
  writeText("ANTET", `DENETİM İZİN BELGE NO: ${m.inspectorNo}`, antetX + 6, antetY + 75, 3.2);

  writeText("ANTET", `ÇİZEN: ${m.drawer}`, antetX + 196, antetY + 95, 3.5);
  writeText("ANTET", `KONTROL: ${m.checker}`, antetX + 196, antetY + 85, 3.5);
  writeText("ANTET", `DANIŞMAN: ${m.consultant}`, antetX + 196, antetY + 75, 3.5);

  // Sheet Title & Numbers
  writeText("ANTET", "PAFTA ADI:", antetX + 6, antetY + 55, 3.2);
  writeText("ANTET", sheet.title, antetX + 6, antetY + 44, 5.0);

  writeText("ANTET", "TARİH", antetX + 6, antetY + 26, 3.0);
  writeText("ANTET", m.date, antetX + 6, antetY + 14, 4.0);

  writeText("ANTET", "ÖLÇEK", antetX + 101, antetY + 26, 3.0);
  writeText("ANTET", sheet.scaleText, antetX + 101, antetY + 14, 4.0);

  writeText("ANTET", "REVİZYON", antetX + 196, antetY + 26, 3.0);
  writeText("ANTET", m.revision, antetX + 196, antetY + 14, 4.5);

  writeText("ANTET", "PAFTA NO", antetX + 291, antetY + 26, 3.2);
  writeText("ANTET", sheet.sheetNo, antetX + 291, antetY + 12, 7.5);

  // ----------------------------------------------------
  // C. TBDY 2018 EARTHQUAKE & SOIL PARAMETER CARD
  // ----------------------------------------------------
  const pCardW = 380;
  const pCardH = 110;
  const pCardX = antetX;
  const pCardY = antetY + antetH + 10;

  writeRect("TABLOLAR", pCardX, pCardY, pCardW, pCardH);
  writeLine("TABLOLAR", pCardX, pCardY + pCardH - 18, pCardX + pCardW, pCardY + pCardH - 18);
  writeText("TABLOLAR", "DEPREM VE ZEMİN HESAP PARAMETRELERİ (TBDY 2018 / TS 500)", pCardX + 12, pCardY + pCardH - 12, 4.0);

  const ap = sheet.analysisParams;
  const colW1 = 190;
  writeLine("TABLOLAR", pCardX + colW1, pCardY, pCardX + colW1, pCardY + pCardH - 18);

  // Left Column: Seismic parameters
  writeText("TABLOLAR", `Yerel Zemin Sınıfı: ${ap.soilClass}`, pCardX + 8, pCardY + 76, 3.3);
  writeText("TABLOLAR", `Deprem Tasarım Sınıfı: DTS = ${ap.dts}`, pCardX + 8, pCardY + 63, 3.3);
  writeText("TABLOLAR", `Bina Kullanım Sınıfı / Önem Kat.: BKS=${ap.bks}, I=${ap.I}`, pCardX + 8, pCardY + 50, 3.3);
  writeText("TABLOLAR", `Taşıyıcı Sistem Davranış Katsayısı: R = ${ap.R}`, pCardX + 8, pCardY + 37, 3.3);
  writeText("TABLOLAR", `Dayanım Fazlalığı Katsayısı: D = ${ap.D}`, pCardX + 8, pCardY + 24, 3.3);
  writeText("TABLOLAR", `Spektral İvme Katsayıları: Ss=${ap.Ss}, S1=${ap.S1}`, pCardX + 8, pCardY + 11, 3.3);

  // Right Column: Site response & materials
  writeText("TABLOLAR", `Tasarım Spektral İvmesi: SDS=${ap.Sds.toFixed(3)}, SD1=${ap.Sd1.toFixed(3)}`, pCardX + colW1 + 8, pCardY + 76, 3.3);
  writeText("TABLOLAR", `Karakteristik Periyotlar: TA=${ap.Ta.toFixed(2)}s, TB=${ap.Tb.toFixed(2)}s`, pCardX + colW1 + 8, pCardY + 63, 3.3);
  writeText("TABLOLAR", `Beton Sınıfı: ${m.concreteGrade} (fck = 35 MPa)`, pCardX + colW1 + 8, pCardY + 50, 3.3);
  writeText("TABLOLAR", `Donatı Çeliği: ${m.steelGrade} (fyk = 420 MPa)`, pCardX + colW1 + 8, pCardY + 37, 3.3);
  writeText("TABLOLAR", `Zemin Emniyet Gerilmesi: q_em = 320 kN/m²`, pCardX + colW1 + 8, pCardY + 24, 3.3);
  writeText("TABLOLAR", `Zemin Yatak Katsayısı: ks = 40.000 kN/m³`, pCardX + colW1 + 8, pCardY + 11, 3.3);

  // ----------------------------------------------------
  // D. CONCRETE COVERS & GENERAL STRUCTURAL NOTES TABLE
  // ----------------------------------------------------
  const notesW = 380;
  const notesH = 190;
  const notesX = antetX;
  const notesY = pCardY + pCardH + 10;

  writeRect("TABLOLAR", notesX, notesY, notesW, notesH);
  writeLine("TABLOLAR", notesX, notesY + notesH - 18, notesX + notesW, notesY + notesH - 18);
  writeText("TABLOLAR", "NET BETON ÖRTÜLERİ (PASPAYI) VE GENEL UYGULAMA NOTLARI", notesX + 10, notesY + notesH - 12, 3.8);

  // Concrete covers mini table
  let curY = notesY + notesH - 30;
  for (const c of sheet.concreteCovers.slice(0, 5)) {
    writeText("TABLOLAR", `• ${c.element}:`, notesX + 8, curY, 3.0);
    writeText("TABLOLAR", `${c.coverMm} mm`, notesX + 310, curY, 3.2);
    curY -= 11;
  }

  writeLine("TABLOLAR", notesX, curY - 2, notesX + notesW, curY - 2);
  curY -= 14;

  for (const note of sheet.notes.slice(0, 5)) {
    // Truncate long note for DXF
    const cleanNote = note.length > 70 ? note.slice(0, 67) + "..." : note;
    writeText("YAZILAR", cleanNote, notesX + 8, curY, 2.7);
    curY -= 11;
  }

  // ----------------------------------------------------
  // E. COLUMN & WALL REBAR SCHEDULE TABLE (KOLON DONATI TABLOSU)
  // ----------------------------------------------------
  if (sheet.columnSchedule && sheet.columnSchedule.length > 0) {
    const tableW = 420;
    const tableH = Math.min(380, H - mt - mb - 20);
    const tableX = innerX + (W > 1800 ? 1160 : 780);
    const tableY = mb + 10;

    writeRect("TABLOLAR", tableX, tableY, tableW, tableH);
    writeLine("TABLOLAR", tableX, tableY + tableH - 22, tableX + tableW, tableY + tableH - 22);
    writeText("TABLOLAR", "KOLON VE PERDE DONATI TABLOSU (TÜM KATLAR)", tableX + 30, tableY + tableH - 15, 4.2);

    // Table Header row
    const rowH = 14;
    let rY = tableY + tableH - 22;
    writeLine("TABLOLAR", tableX, rY - rowH, tableX + tableW, rY - rowH);
    writeText("TABLOLAR", "Eleman", tableX + 6, rY - 10, 3.2);
    writeText("TABLOLAR", "Kesit (cm)", tableX + 50, rY - 10, 3.2);
    writeText("TABLOLAR", "Boyuna Donatı", tableX + 115, rY - 10, 3.2);
    writeText("TABLOLAR", "Etriye / Sarılma", tableX + 215, rY - 10, 3.2);
    writeText("TABLOLAR", "Çiroz / Uç Bölgesi", tableX + 310, rY - 10, 3.2);

    // Column dividers
    writeLine("TABLOLAR", tableX + 45, tableY, tableX + 45, rY);
    writeLine("TABLOLAR", tableX + 110, tableY, tableX + 110, rY);
    writeLine("TABLOLAR", tableX + 210, tableY, tableX + 210, rY);
    writeLine("TABLOLAR", tableX + 305, tableY, tableX + 305, rY);

    rY -= rowH;
    for (const col of sheet.columnSchedule.slice(0, 22)) {
      writeLine("TABLOLAR", tableX, rY - rowH, tableX + tableW, rY - rowH);
      writeText("YAZILAR", col.colNo, tableX + 6, rY - 10, 3.0);
      writeText("YAZILAR", col.sectionDimensions, tableX + 52, rY - 10, 3.0);
      writeText("YAZILAR", col.longitudinalRebar.slice(0, 18), tableX + 114, rY - 10, 2.8);
      writeText("YAZILAR", col.stirrupRebar.slice(0, 18), tableX + 214, rY - 10, 2.7);
      writeText("YAZILAR", col.tieCountText.slice(0, 18), tableX + 309, rY - 10, 2.6);
      rY -= rowH;
      if (rY < tableY + rowH) break;
    }
  }

  // ----------------------------------------------------
  // F. PLAN VIEWPORT (1/50 SCALE STRUCTURAL DRAWING)
  // ----------------------------------------------------
  // Primary plan drawing placed in viewport area:
  // In 1/50 scale: 1 meter in real world = 20 mm on paper.
  const vpX = innerX + 15;
  const vpY = mb + 15;
  const vpW = W > 1800 ? 1100 : (sheet.type === "rebar_schedule" ? 750 : 720);
  const vpH = H - mt - mb - 30;

  // Viewport scale frame
  writeRect("OLCU", vpX, vpY, vpW, vpH);
  // Viewport Title banner at top
  writeRect("ANTET", vpX, vpY + vpH - 24, vpW, 24);
  const vpTitle = sheet.viewports[0]?.title || `${sheet.title} (ÖLÇEK: 1/50)`;
  writeText("ANTET", vpTitle, vpX + 20, vpY + vpH - 16, 5.0);
  writeText("ANTET", "ÖLÇEK: 1/50", vpX + vpW - 120, vpY + vpH - 16, 4.5);

  // North Arrow Indicator in top right of viewport
  const naX = vpX + vpW - 40;
  const naY = vpY + vpH - 55;
  writeCircle("ANTET", naX, naY, 15);
  writeLine("ANTET", naX, naY - 15, naX, naY + 15);
  writeLine("ANTET", naX - 15, naY, naX + 15, naY);
  writeText("ANTET", "K", naX - 3, naY + 18, 5.0);

  // Compute model bounding box to centre plan inside viewport
  let minMx = Infinity, maxMx = -Infinity, minMy = Infinity, maxMy = -Infinity;
  for (const el of model.elements) {
    if (el.type === "axis") {
      const ax = el as AxisElement;
      minMx = Math.min(minMx, ax.start.x, ax.end.x);
      maxMx = Math.max(maxMx, ax.start.x, ax.end.x);
      minMy = Math.min(minMy, ax.start.y, ax.end.y);
      maxMy = Math.max(maxMy, ax.start.y, ax.end.y);
    } else if (el.type === "column") {
      const c = el as ColumnElement;
      minMx = Math.min(minMx, c.position.x);
      maxMx = Math.max(maxMx, c.position.x);
      minMy = Math.min(minMy, c.position.y);
      maxMy = Math.max(maxMy, c.position.y);
    }
  }

  if (minMx === Infinity) {
    minMx = 0; maxMx = 48; minMy = 0; maxMy = 32;
  }

  const modelW = Math.max(10, maxMx - minMx);
  const modelH = Math.max(10, maxMy - minMy);

  // Scale: 1/50 = 20 mm/m, but fit inside viewport dimensions with 40mm padding
  const availW = vpW - 80;
  const availH = vpH - 90;
  const planScale = Math.min(20, availW / modelW, availH / modelH); // mm per meter

  const offsetX = vpX + 40 + (availW - modelW * planScale) / 2 - minMx * planScale;
  const offsetY = vpY + 40 + (availH - modelH * planScale) / 2 - minMy * planScale;

  const toPaperX = (mx: number) => offsetX + mx * planScale;
  const toPaperY = (my: number) => offsetY + my * planScale;

  // Draw Continuous Axes (AKSLAR layer)
  const axes = model.elements.filter(e => e.type === "axis") as AxisElement[];
  for (const ax of axes) {
    const p1x = toPaperX(ax.start.x);
    const p1y = toPaperY(ax.start.y);
    const p2x = toPaperX(ax.end.x);
    const p2y = toPaperY(ax.end.y);
    writeLine("AKSLAR", p1x, p1y, p2x, p2y);

    // Axis Bubble & Label
    const angle = Math.atan2(p2y - p1y, p2x - p1x);
    const bubbleR = 5.0; // 5 mm bubble
    const bx = p2x + Math.cos(angle) * (bubbleR + 2);
    const by = p2y + Math.sin(angle) * (bubbleR + 2);
    writeCircle("AKSLAR", bx, by, bubbleR);
    writeText("AKSLAR", ax.name, bx - 2.5, by - 2.5, 3.8);
  }

  // Draw Columns (KOLONLAR layer)
  const columns = model.elements.filter(e => e.type === "column") as ColumnElement[];
  for (const col of columns) {
    const footprint = elementFootprint(col);
    for (let i = 0; i < footprint.length; i++) {
      const p1 = footprint[i];
      const p2 = footprint[(i + 1) % footprint.length];
      writeLine("KOLONLAR", toPaperX(p1.x), toPaperY(p1.y), toPaperX(p2.x), toPaperY(p2.y));
    }
    // Column Name label
    writeText("YAZILAR", col.name, toPaperX(col.position.x) - 4, toPaperY(col.position.y) - 2, 3.0);
  }

  // Draw Shear Walls (PERDELER layer)
  const walls = model.elements.filter(e => e.type === "wall") as WallElement[];
  for (const wall of walls) {
    const footprint = elementFootprint(wall);
    for (let i = 0; i < footprint.length; i++) {
      const p1 = footprint[i];
      const p2 = footprint[(i + 1) % footprint.length];
      writeLine("PERDELER", toPaperX(p1.x), toPaperY(p1.y), toPaperX(p2.x), toPaperY(p2.y));
    }
    const mx = (wall.start.x + wall.end.x) / 2;
    const my = (wall.start.y + wall.end.y) / 2;
    writeText("YAZILAR", wall.name, toPaperX(mx) - 5, toPaperY(my) - 2, 3.2);
  }

  // Draw Beams (KIRISLER layer)
  const beams = model.elements.filter(e => e.type === "beam") as BeamElement[];
  for (const beam of beams) {
    const footprint = elementFootprint(beam);
    for (let i = 0; i < footprint.length; i++) {
      const p1 = footprint[i];
      const p2 = footprint[(i + 1) % footprint.length];
      writeLine("KIRISLER", toPaperX(p1.x), toPaperY(p1.y), toPaperX(p2.x), toPaperY(p2.y));
    }
    const mx = (beam.start.x + beam.end.x) / 2;
    const my = (beam.start.y + beam.end.y) / 2;
    const beamTag = `${beam.name} ${(beam.width * 100).toFixed(0)}/${(beam.height * 100).toFixed(0)}`;
    writeText("YAZILAR", beamTag, toPaperX(mx) - 6, toPaperY(my) + 1, 2.5);
  }

  // Draw Slabs (DOSEMELER layer)
  const slabs = model.elements.filter(e => e.type === "slab") as SlabElement[];
  for (const slab of slabs) {
    if (slab.points && slab.points.length >= 3) {
      for (let i = 0; i < slab.points.length; i++) {
        const p1 = slab.points[i];
        const p2 = slab.points[(i + 1) % slab.points.length];
        writeLine("DOSEMELER", toPaperX(p1.x), toPaperY(p1.y), toPaperX(p2.x), toPaperY(p2.y));
      }
      const lp = slab.labelPosition ?? slab.points[0];
      const slabTag = `${slab.name} (h=${(slab.thickness * 100).toFixed(0)}cm)`;
      writeText("DOSEMELER", slabTag, toPaperX(lp.x) + 4, toPaperY(lp.y) + 4, 3.0);
    }
  }

  // ----------------------------------------------------
  // G. REBAR SCHEDULE LISTING (IF SHEET IS DONATI METRAJI)
  // ----------------------------------------------------
  if (sheet.type === "rebar_schedule" && sheet.rebarSchedule.length > 0) {
    const schedX = vpX + 15;
    let schedY = vpY + vpH - 50;
    const schedW = vpW - 30;

    writeRect("TABLOLAR", schedX, vpY + 20, schedW, vpH - 60);
    writeText("TABLOLAR", "DONATI METRAJ LİSTESİ VE BÜKÜM ŞEMALARI", schedX + 20, schedY, 4.5);
    schedY -= 20;

    writeLine("TABLOLAR", schedX, schedY, schedX + schedW, schedY);
    writeText("TABLOLAR", "Poz", schedX + 8, schedY - 10, 3.5);
    writeText("TABLOLAR", "Eleman", schedX + 40, schedY - 10, 3.5);
    writeText("TABLOLAR", "Çap (mm)", schedX + 220, schedY - 10, 3.5);
    writeText("TABLOLAR", "Adet", schedX + 290, schedY - 10, 3.5);
    writeText("TABLOLAR", "Boy (cm)", schedX + 350, schedY - 10, 3.5);
    writeText("TABLOLAR", "Büküm Şekli", schedX + 430, schedY - 10, 3.5);
    writeText("TABLOLAR", "Toplam (m)", schedX + 570, schedY - 10, 3.5);
    writeText("TABLOLAR", "Ağırlık (kg)", schedX + 660, schedY - 10, 3.5);

    schedY -= 15;
    for (const item of sheet.rebarSchedule) {
      writeLine("TABLOLAR", schedX, schedY, schedX + schedW, schedY);
      writeText("YAZILAR", String(item.pos), schedX + 8, schedY - 10, 3.2);
      writeText("YAZILAR", item.element, schedX + 40, schedY - 10, 3.0);
      writeText("YAZILAR", `Φ${item.diameterMm}`, schedX + 225, schedY - 10, 3.2);
      writeText("YAZILAR", String(item.count), schedX + 295, schedY - 10, 3.2);
      writeText("YAZILAR", String(item.lengthCm), schedX + 355, schedY - 10, 3.2);
      writeText("YAZILAR", item.shapeText, schedX + 430, schedY - 10, 2.8);
      writeText("YAZILAR", item.totalLengthM.toLocaleString("tr-TR"), schedX + 570, schedY - 10, 3.0);
      writeText("YAZILAR", item.totalWeightKg.toLocaleString("tr-TR"), schedX + 660, schedY - 10, 3.2);
      schedY -= 14;
      if (schedY < vpY + 30) break;
    }
  }

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join("\r\n");
}
