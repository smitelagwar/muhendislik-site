import { jsPDF } from "jspdf";
import { PDF_SERIF_BOLD_BASE64, PDF_SERIF_REGULAR_BASE64 } from "@/lib/calculations/pdf-fonts.generated";
import { formatM2Fiyat, formatSayi, formatTL, formatYuzde } from "@/lib/calculations/core";
import {
  QUICK_QUANTITY_FOUNDATION_OPTIONS,
  QUICK_QUANTITY_PLAN_OPTIONS,
  QUICK_QUANTITY_RETAINING_OPTIONS,
  QUICK_QUANTITY_SEISMIC_OPTIONS,
  QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,
  QUICK_QUANTITY_SOIL_OPTIONS,
  QUICK_QUANTITY_SPAN_OPTIONS,
  QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,
} from "./presets";
import type { QuickQuantityPdfSnapshot } from "./types";

const FONT_FAMILY = "IBMPlexSerif";

function normalizeText(value: string) {
  return value
    .replace(/\r?\n/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function registerPdfFonts(pdf: jsPDF) {
  const fontRegistry = pdf as jsPDF & { __quickQuantityFontsReady?: boolean };
  if (fontRegistry.__quickQuantityFontsReady) {
    return;
  }

  pdf.addFileToVFS("IBMPlexSerif-Regular.ttf", PDF_SERIF_REGULAR_BASE64);
  pdf.addFont("IBMPlexSerif-Regular.ttf", FONT_FAMILY, "normal");
  pdf.addFileToVFS("IBMPlexSerif-Bold.ttf", PDF_SERIF_BOLD_BASE64);
  pdf.addFont("IBMPlexSerif-Bold.ttf", FONT_FAMILY, "bold");
  fontRegistry.__quickQuantityFontsReady = true;
}

function createDocument() {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  registerPdfFonts(pdf);
  pdf.setFont(FONT_FAMILY, "normal");
  return pdf;
}

function drawSectionTitle(pdf: jsPDF, title: string, y: number) {
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(12);
  pdf.text(normalizeText(title), 14, y);
  pdf.setFont(FONT_FAMILY, "normal");
}

function drawWrappedLines(
  pdf: jsPDF,
  lines: string[],
  startY: number,
  width = 182,
  lineHeight = 5
) {
  let y = startY;
  pdf.setFontSize(9);

  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(normalizeText(line), width);
    pdf.text(wrapped, 14, y);
    y += wrapped.length * lineHeight;
  }

  return y;
}

function getOptionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T
): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

export function buildQuickQuantityPdfSnapshot(
  snapshot: QuickQuantityPdfSnapshot
): QuickQuantityPdfSnapshot {
  return snapshot;
}

export function createQuickQuantityPdfDocument(snapshot: QuickQuantityPdfSnapshot): jsPDF {
  const pdf = createDocument();
  const { result } = snapshot;
  const tasiyiciSistemLabel = getOptionLabel(
    QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,
    result.input.tasiyiciSistem
  );
  const dosemeSistemiLabel = getOptionLabel(
    QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,
    result.input.dosemeSistemi
  );
  const temelTipiLabel = getOptionLabel(QUICK_QUANTITY_FOUNDATION_OPTIONS, result.input.temelTipi);
  const zeminSinifiLabel = getOptionLabel(QUICK_QUANTITY_SOIL_OPTIONS, result.input.zeminSinifi);
  const depremTalebiLabel = getOptionLabel(
    QUICK_QUANTITY_SEISMIC_OPTIONS,
    result.input.depremTalebi
  );
  const planKompaktligiLabel = getOptionLabel(
    QUICK_QUANTITY_PLAN_OPTIONS,
    result.input.planKompaktligi
  );
  const bodrumPerdesiLabel =
    result.input.bodrumKatSayisi > 0
      ? getOptionLabel(QUICK_QUANTITY_RETAINING_OPTIONS, result.input.bodrumCevrePerdesi)
      : "Bodrum yok";
  const tipikAciklikLabel = getOptionLabel(QUICK_QUANTITY_SPAN_OPTIONS, result.input.tipikAciklik);
  const sahaZorluguLabel =
    result.kararOzetleri.find((item) => item.id === "saha-zorlugu")?.value ?? "Saha özeti yok";
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(15, 23, 42);
  pdf.roundedRect(10, 10, pageWidth - 20, 24, 6, 6, "F");

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text("Hızlı Metraj Hesaplayıcı", 16, 21);
  pdf.setFontSize(9.5);
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.text(normalizeText(result.preset.label), 16, 28);
  pdf.text(normalizeText(snapshot.formattedDate), pageWidth - 16, 21, { align: "right" });

  pdf.setTextColor(15, 23, 42);
  let y = 42;

  drawSectionTitle(pdf, "Özet", y);
  y = drawWrappedLines(
    pdf,
    [
      `Toplam alan: ${formatSayi(result.toplamInsaatAlaniM2, 2)} m²`,
      `Beton: ${formatSayi(result.betonM3, 2)} m³`,
      `Donatı: ${formatSayi(result.donatiTon, 2)} ton`,
      `Kalıp: ${formatSayi(result.kalipM2, 2)} m²`,
      `Doğrudan taşıyıcı maliyet: ${formatTL(result.dogrudanTasiyiciMaliyet)}`,
      `Doğrudan maliyet yoğunluğu: ${formatTL(result.yogunlukOzet.directCostPerM2).replace(" TL", " TL/m²")}`,
      `Genişletilmiş kaba yapı: ${formatTL(result.genisletilmisKabaYapiBandi.expectedAmount)}`,
      `Resmî toplam yaklaşık maliyet: ${formatTL(result.officialResult.resmiToplamMaliyet)}`,
      `Saha zorluğu: ${sahaZorluguLabel}`,
      `Taşıyıcı payı: ${formatYuzde(result.tasiyiciPayi.actual)} (bant ${formatYuzde(
        result.tasiyiciPayi.low
      )} - ${formatYuzde(result.tasiyiciPayi.expected)} - ${formatYuzde(
        result.tasiyiciPayi.high
      )})`,
    ],
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Proje Profili", y);
  y = drawWrappedLines(
    pdf,
    [
      `Taşıyıcı sistem: ${tasiyiciSistemLabel}`,
      `Döşeme sistemi: ${dosemeSistemiLabel}`,
      `Temel tipi: ${temelTipiLabel}`,
      `Zemin sınıfı: ${zeminSinifiLabel}`,
      `Deprem talebi: ${depremTalebiLabel}`,
      `Plan kompaktlığı: ${planKompaktligiLabel}`,
      `Bodrum çevre perdesi: ${bodrumPerdesiLabel}`,
      `Tipik açıklık: ${tipikAciklikLabel}`,
    ],
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Dağılım", y);
  y = drawWrappedLines(
    pdf,
    result.breakdowns.map(
      (item) =>
        `${item.label}: ${formatSayi(item.betonM3, 2)} m³ beton, ${formatSayi(
          item.donatiTon,
          2
        )} ton donatı, ${formatSayi(item.kalipM2, 2)} m² kalıp`
    ),
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Yardımcı Kaba İşler", y);
  y = drawWrappedLines(
    pdf,
    [
      ...result.yardimciMetrajlar.map(
        (item) => `${item.label}: ${formatSayi(item.quantity, item.unit === "m" ? 1 : 2)} ${item.unit}`
      ),
      `Yardımcı kaba iş bandı: ${formatTL(result.yardimciKabaIsBandi.expectedAmount)} (${formatYuzde(
        result.yardimciKabaIsBandi.expected
      )})`,
    ],
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Yardımcı İş Muhasebesi", y);
  y = drawWrappedLines(
    pdf,
    result.yardimciKabaIsDagilimi
      .slice(0, 3)
      .map(
        (item) =>
          `${item.label}: ${formatTL(item.amount)} (${formatYuzde(item.share)})`
      ),
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Karar Özeti", y);
  y = drawWrappedLines(
    pdf,
    result.kararOzetleri
      .slice(0, 4)
      .map((item) => `${item.title}: ${item.value} · ${item.note}`),
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Poz ve Fiyat Dayanakları", y);
  y = drawWrappedLines(
    pdf,
    [
      `${result.priceBook.entries.concreteC30_37.pozNo} · ${result.priceBook.entries.concreteC30_37.label} · ${formatM2Fiyat(
        result.betonBirimFiyat
      ).replace("/m²", "/m³")}`,
      `${result.priceBook.entries.rebar8To12.pozNo} ve ${result.priceBook.entries.rebar14To28.pozNo} · Ağırlıklı donatı birim fiyatı · ${formatTL(
        result.donatiBirimFiyat
      ).replace(" TL", " TL/ton")}`,
      `${result.priceBook.entries.formworkPlywood.pozNo} · ${result.priceBook.entries.formworkPlywood.label} · ${formatTL(
        result.kalipBirimFiyat
      ).replace(" TL", " TL/m²")}`,
      `Resmî sınıf: ${result.officialResult.row.sinifKodu} · ${result.officialResult.row.sinifAdi}`,
    ],
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Notlar", y);
  drawWrappedLines(
    pdf,
    [
      ...result.notes,
      ...result.warnings.map((warning) => warning.message),
      `Kaynak: ${result.priceBook.sourceLabel}`,
      `Kaynak bağlantısı: ${result.priceBook.sourceUrl}`,
      "Bu çıktı ön keşif / ön boyutlandırma içindir; statik proje, uygulama metrajı ve gerçek keşif yerine geçmez.",
    ],
    y + 6
  );

  return pdf;
}

export function openQuickQuantityPdfPreview(snapshot: QuickQuantityPdfSnapshot): void {
  if (typeof window === "undefined") {
    throw new Error("Rapor önizleme yalnızca tarayıcı ortamında açılabilir.");
  }

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    throw new Error("Önizleme penceresi açılamadı. Lütfen pop-up engelleyicisini kontrol edin.");
  }

  const html = generateQuickQuantityHtml(snapshot);
  previewWindow.document.write(html);
  previewWindow.document.close();
}

/**
 * Hızlı metraj raporu için düzenlenebilir HTML şablonu oluşturur.
 */
function generateQuickQuantityHtml(snapshot: QuickQuantityPdfSnapshot): string {
  const { result, formattedDate } = snapshot;
  const tasiyiciSistemLabel = getOptionLabel(QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS, result.input.tasiyiciSistem);
  const dosemeSistemiLabel = getOptionLabel(QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS, result.input.dosemeSistemi);
  const temelTipiLabel = getOptionLabel(QUICK_QUANTITY_FOUNDATION_OPTIONS, result.input.temelTipi);
  const zeminSinifiLabel = getOptionLabel(QUICK_QUANTITY_SOIL_OPTIONS, result.input.zeminSinifi);

  const colors = {
    paper: "#F9F8F4",
    paperBorder: "#D2D8E2",
    officialBlue: "#102C54",
    officialAccent: "#B96A24",
    ink: "#0F172A",
    body: "#334155",
    muted: "#64748B",
  };

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Hızlı Metraj Raporu - ${formattedDate}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;700&display=swap');
    :root {
      --paper-bg: ${colors.paper};
      --paper-border: ${colors.paperBorder};
      --official-blue: ${colors.officialBlue};
      --official-accent: ${colors.officialAccent};
      --ink: ${colors.ink};
      --body: ${colors.body};
      --muted: ${colors.muted};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #F1F5F9;
      font-family: 'IBM Plex Sans', sans-serif;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .paper {
      width: 210mm;
      min-height: 297mm;
      background-color: var(--paper-bg);
      padding: 20mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      position: relative;
      border: 1px solid var(--paper-border);
    }
    .paper::before {
      content: '';
      position: absolute;
      inset: 8mm;
      border: 0.4mm solid var(--paper-border);
      pointer-events: none;
    }
    .toolbar {
      width: 210mm;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      background: white;
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }
    .btn-primary { background: var(--official-blue); color: white; }
    .btn-secondary { background: #E2E8F0; color: var(--body); }
    
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .brand { display: flex; align-items: flex-start; gap: 15px; }
    .logo-mark {
      width: 10mm; height: 14mm;
      border-left: 1mm solid var(--official-blue);
      border-top: 1mm solid var(--official-blue);
      position: relative;
    }
    .logo-mark::after {
      content: 'İB';
      position: absolute; left: 1.5mm; top: 5mm;
      font-weight: 800; font-size: 11px; color: var(--official-blue);
    }
    .brand-text h2 { font-size: 16px; font-weight: 800; color: var(--ink); }
    .brand-text p { font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    
    .date-box {
      border: 1px solid var(--paper-border);
      background: white;
      padding: 5px 15px;
      border-radius: 6px;
      height: fit-content;
      font-size: 10px;
      font-weight: 700;
      color: var(--official-blue);
    }

    .title-area { margin-bottom: 25px; }
    .title-area h1 { font-family: 'IBM Plex Serif', serif; font-size: 26pt; color: var(--official-blue); margin-bottom: 6px; }
    .title-area p { font-size: 11pt; color: var(--body); }

    .grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; margin-bottom: 8mm; }
    .card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px 20px; }
    .card .label { font-size: 9pt; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
    .card .value { font-family: 'IBM Plex Serif', serif; font-size: 18pt; font-weight: 700; color: var(--official-blue); }

    .main-grid { display: grid; grid-template-columns: 105mm 1fr; gap: 6mm; margin-bottom: 8mm; }
    .section-card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; margin-bottom: 6mm; }
    .section-card h3 { font-size: 10pt; font-weight: 700; color: var(--official-blue); border-bottom: 1px solid var(--paper-border); padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; }
    .data-row { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 6px; }
    .data-row .l { color: var(--muted); }
    .data-row .v { font-weight: 700; color: var(--ink); text-align: right; }

    .notes { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; }
    .notes h3 { font-size: 9pt; font-weight: 700; color: var(--official-blue); margin-bottom: 10px; }
    .notes ul { list-style: none; }
    .notes li { font-size: 8.5pt; color: var(--muted); margin-bottom: 5px; position: relative; padding-left: 15px; }
    .notes li::before { content: '•'; position: absolute; left: 0; color: var(--official-accent); }

    [contenteditable="true"]:hover { outline: 1px dashed var(--official-accent); background: rgba(0,0,0,0.02); }
    [contenteditable="true"]:focus { outline: 2px solid var(--official-accent); background: white; }

    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .paper { box-shadow: none; border: none; padding: 15mm; margin: 0; }
      .paper::before { inset: 5mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 10px; height: 10px; background: var(--official-accent); border-radius: 50%;"></div>
      <span style="font-size: 13px; font-weight: 600; color: var(--body);">Düzenlenebilir Metraj Raporu</span>
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-secondary" onclick="window.close()">Kapat</button>
      <button class="btn btn-primary" onclick="window.print()">Yazdır veya PDF Kaydet</button>
    </div>
  </div>

  <div class="paper">
    <div class="header">
      <div class="brand">
        <div class="logo-mark"></div>
        <div class="brand-text">
          <h2 contenteditable="true">İNŞA BLOG</h2>
          <p contenteditable="true">Mühendislik · Yapı · Analiz</p>
        </div>
      </div>
      <div class="date-box" contenteditable="true">${formattedDate}</div>
    </div>

    <div class="title-area">
      <h1 contenteditable="true">Hızlı Metraj Raporu</h1>
      <p contenteditable="true">${result.preset.label}</p>
    </div>

    <div class="grid-4">
      <div class="card">
        <div class="label" contenteditable="true">Beton</div>
        <div class="value" contenteditable="true">${formatSayi(result.betonM3, 2)} m³</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Donatı</div>
        <div class="value" contenteditable="true">${formatSayi(result.donatiTon, 2)} ton</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Kalıp</div>
        <div class="value" contenteditable="true">${formatSayi(result.kalipM2, 2)} m²</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Toplam Maliyet</div>
        <div class="value" contenteditable="true">${formatTL(result.dogrudanTasiyiciMaliyet)}</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="col-left">
        <div class="section-card">
          <h3 contenteditable="true">Proje Profili</h3>
          <div class="data-row"><span class="l" contenteditable="true">Taşıyıcı Sistem</span><span class="v" contenteditable="true">${tasiyiciSistemLabel}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Döşeme Sistemi</span><span class="v" contenteditable="true">${dosemeSistemiLabel}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Temel Tipi</span><span class="v" contenteditable="true">${temelTipiLabel}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Zemin Sınıfı</span><span class="v" contenteditable="true">${zeminSinifiLabel}</span></div>
        </div>
      </div>
      <div class="col-right">
        <div class="section-card">
          <h3 contenteditable="true">Maliyet Özeti</h3>
          <div class="data-row"><span class="l" contenteditable="true">Resmî Yaklaşık Maliyet</span><span class="v" contenteditable="true">${formatTL(result.officialResult.resmiToplamMaliyet)}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Yoğunluk (TL/m²)</span><span class="v" contenteditable="true">${formatTL(result.yogunlukOzet.directCostPerM2)}</span></div>
        </div>
        <div class="section-card">
          <h3 contenteditable="true">Dayanaklar</h3>
          <div class="data-row"><span class="v" style="text-align: left; font-size: 8pt;" contenteditable="true">${result.priceBook.sourceLabel} referans fiyatları baz alınmıştır.</span></div>
        </div>
      </div>
    </div>

    <div class="notes">
      <h3 contenteditable="true">Notlar</h3>
      <ul>
        ${result.notes.slice(0, 3).map(n => `<li contenteditable="true">${n}</li>`).join('')}
        <li contenteditable="true">Bu çıktı ön keşif içindir; statik proje yerine geçmez.</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `;
}

export function downloadQuickQuantityPdf(
  snapshot: QuickQuantityPdfSnapshot,
  filename: string
): void {
  const pdf = createQuickQuantityPdfDocument(snapshot);
  pdf.save(filename);
}

export function printQuickQuantityPdf(snapshot: QuickQuantityPdfSnapshot): void {
  if (typeof window === "undefined") {
    throw new Error("Yazdırma yalnızca tarayıcı ortamında kullanılabilir.");
  }

  const pdf = createQuickQuantityPdfDocument(snapshot);
  const blob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error("Yazdırma penceresi açılamadı.");
  }

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // Tarayıcı PDF görüntüleyicisi baskı denetimini yeni sekmeye bırakabilir.
    }
  };

  window.setTimeout(triggerPrint, 1200);
  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60_000);
}
