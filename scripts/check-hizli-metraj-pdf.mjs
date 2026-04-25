import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import * as quickQuantityModule from "../src/lib/calculations/modules/hizli-metraj/index.ts";
import * as reportingModule from "../src/lib/calculations/reporting.ts";

const quickQuantityApi = quickQuantityModule.default ?? quickQuantityModule;
const reportingApi = reportingModule.default ?? reportingModule;
const { calculateQuickQuantity, validateQuickQuantityInput } = quickQuantityApi;
const { buildQuickQuantityPdfSnapshot, createQuickQuantityPdfDocument } = reportingApi;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function nearlyEqual(left, right, epsilon = 1e-9) {
  return Math.abs(left - right) <= epsilon;
}

function inspectPdf(pdfPath) {
  const script = `
import json
import sys
from pypdf import PdfReader

reader = PdfReader(sys.argv[1])
text = "\\n".join((page.extract_text() or "") for page in reader.pages)
payload = {
  "pageCount": len(reader.pages),
  "text": text,
}
print(json.dumps(payload, ensure_ascii=False))
`;

  const result = spawnSync("python", ["-X", "utf8", "-", pdfPath], {
    input: script,
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "PDF inspection failed.");
  }

  return JSON.parse(result.stdout);
}

const unsupportedMessage =
  "Seçilen resmî sınıf bu v1 metraj aracında desteklenmiyor. Resmî Birim Maliyet aracına geçerek toplam yaklaşık maliyeti inceleyin.";

const villaInput = {
  katAlaniM2: 220,
  normalKatSayisi: 2,
  bodrumKatSayisi: 0,
  bodrumKatAlaniM2: null,
  yapiArketipi: "villa-bungalov",
  tasiyiciSistem: "cerceve",
  dosemeSistemi: "kirisli",
  temelTipi: "radye",
  zeminSinifi: "ZC",
  depremTalebi: "orta",
  planKompaktligi: "standart",
  bodrumCevrePerdesi: "yok",
  tipikAciklik: "standart",
  resmiSinif: null,
};

const apartmentInput = {
  katAlaniM2: 220,
  normalKatSayisi: 2,
  bodrumKatSayisi: 0,
  bodrumKatAlaniM2: null,
  yapiArketipi: "apartman-4-7-kat",
  tasiyiciSistem: "cercevePerde",
  dosemeSistemi: "kirisli",
  temelTipi: "radye",
  zeminSinifi: "ZC",
  depremTalebi: "orta",
  planKompaktligi: "standart",
  bodrumCevrePerdesi: "yok",
  tipikAciklik: "standart",
  resmiSinif: null,
};

const basementlessApartmentInput = {
  katAlaniM2: 450,
  normalKatSayisi: 5,
  bodrumKatSayisi: 0,
  bodrumKatAlaniM2: null,
  yapiArketipi: "apartman-4-7-kat",
  tasiyiciSistem: "cercevePerde",
  dosemeSistemi: "kirisli",
  temelTipi: "radye",
  zeminSinifi: "ZC",
  depremTalebi: "orta",
  planKompaktligi: "standart",
  bodrumCevrePerdesi: "yok",
  tipikAciklik: "standart",
  resmiSinif: null,
};

const basementApartmentInput = {
  ...basementlessApartmentInput,
  bodrumKatSayisi: 1,
  bodrumKatAlaniM2: 450,
  bodrumCevrePerdesi: "tam",
};

const soilBaseInput = {
  katAlaniM2: 450,
  normalKatSayisi: 5,
  bodrumKatSayisi: 1,
  bodrumKatAlaniM2: 450,
  yapiArketipi: "apartman-4-7-kat",
  tasiyiciSistem: "cercevePerde",
  dosemeSistemi: "kirisli",
  temelTipi: "radye",
  zeminSinifi: "ZC",
  depremTalebi: "orta",
  planKompaktligi: "standart",
  bodrumCevrePerdesi: "tam",
  tipikAciklik: "standart",
  resmiSinif: null,
};

const slabBaseInput = {
  katAlaniM2: 650,
  normalKatSayisi: 12,
  bodrumKatSayisi: 2,
  bodrumKatAlaniM2: 650,
  yapiArketipi: "apartman-11-17-kat",
  tasiyiciSistem: "perdeAgirlikli",
  dosemeSistemi: "kirisli",
  temelTipi: "radye",
  zeminSinifi: "ZC",
  depremTalebi: "yuksek",
  planKompaktligi: "standart",
  bodrumCevrePerdesi: "tam",
  tipikAciklik: "standart",
  resmiSinif: null,
};

const pdfInput = basementApartmentInput;
const fixedDate = "25 Nisan 2026";
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "quick-quantity-pdf-"));

try {
  const villaResult = calculateQuickQuantity(villaInput);
  const apartmentResult = calculateQuickQuantity(apartmentInput);
  assert(villaResult, "Villa scenario should produce a result.");
  assert(apartmentResult, "Apartment scenario should produce a result.");
  assert(villaResult.donatiTon > 0, "Villa scenario should produce positive rebar tonnage.");
  assert(
    villaResult.donatiKg / villaResult.toplamInsaatAlaniM2 <
      apartmentResult.donatiKg / apartmentResult.toplamInsaatAlaniM2,
    "Villa preset should have lower rebar intensity than mid-rise apartment preset."
  );
  const basementlessNormalizedResult = calculateQuickQuantity({
    ...apartmentInput,
    bodrumCevrePerdesi: "tam",
  });
  assert(
    basementlessNormalizedResult?.input.bodrumCevrePerdesi === "yok",
    "Basement retaining should normalize to 'yok' when basement count is zero."
  );

  const basementlessApartmentResult = calculateQuickQuantity(basementlessApartmentInput);
  const basementApartmentResult = calculateQuickQuantity(basementApartmentInput);
  assert(basementlessApartmentResult, "Basementless apartment scenario should produce a result.");
  assert(basementApartmentResult, "Basement apartment scenario should produce a result.");
  assert(
    basementApartmentResult.betonM3 > basementlessApartmentResult.betonM3,
    "Adding one basement should increase concrete volume."
  );
  assert(
    basementApartmentResult.donatiTon > basementlessApartmentResult.donatiTon,
    "Adding one basement should increase rebar tonnage."
  );

  const zcResult = calculateQuickQuantity(soilBaseInput);
  const zeResult = calculateQuickQuantity({ ...soilBaseInput, zeminSinifi: "ZE" });
  assert(zcResult, "ZC scenario should produce a result.");
  assert(zeResult, "ZE scenario should produce a result.");
  const zcTemel = zcResult.breakdowns.find((item) => item.id === "temel");
  const zeTemel = zeResult.breakdowns.find((item) => item.id === "temel");
  assert(zcTemel && zeTemel, "Foundation breakdown should exist in soil comparison.");
  assert(
    zeTemel.betonM3 > zcTemel.betonM3 && zeTemel.donatiTon > zcTemel.donatiTon,
    "ZE should only raise foundation-weighted quantities."
  );
  for (const breakdownId of ["kolonPerde", "kirisDoseme", "merdivenCekirdek"]) {
    const zcBreakdown = zcResult.breakdowns.find((item) => item.id === breakdownId);
    const zeBreakdown = zeResult.breakdowns.find((item) => item.id === breakdownId);
    assert(zcBreakdown && zeBreakdown, `${breakdownId} should exist in soil comparison.`);
    assert(
      nearlyEqual(zcBreakdown.betonM3, zeBreakdown.betonM3) &&
        nearlyEqual(zcBreakdown.donatiTon, zeBreakdown.donatiTon) &&
        nearlyEqual(zcBreakdown.kalipM2, zeBreakdown.kalipM2),
      `Soil factor should not blindly scale ${breakdownId}.`
    );
  }

  const kirisliResult = calculateQuickQuantity(slabBaseInput);
  const duzPlakResult = calculateQuickQuantity({ ...slabBaseInput, dosemeSistemi: "duzPlak" });
  assert(kirisliResult, "Kirişli slab scenario should produce a result.");
  assert(duzPlakResult, "Düz plak scenario should produce a result.");
  const kirisliBreakdown = kirisliResult.breakdowns.find((item) => item.id === "kirisDoseme");
  const duzPlakBreakdown = duzPlakResult.breakdowns.find((item) => item.id === "kirisDoseme");
  assert(kirisliBreakdown && duzPlakBreakdown, "Slab breakdown should exist.");
  assert(
    duzPlakBreakdown.donatiTon > kirisliBreakdown.donatiTon,
    "Düz plak should produce higher slab rebar demand than kirişli slab."
  );
  assert(
    duzPlakBreakdown.kalipM2 < kirisliBreakdown.kalipM2,
    "Düz plak should reduce slab formwork demand compared to kirişli slab."
  );

  const lowSeismicResult = calculateQuickQuantity({
    ...slabBaseInput,
    depremTalebi: "dusuk",
    tipikAciklik: "genis",
    tasiyiciSistem: "cercevePerde",
  });
  const highSeismicResult = calculateQuickQuantity({
    ...slabBaseInput,
    depremTalebi: "yuksek",
    tipikAciklik: "genis",
    tasiyiciSistem: "cercevePerde",
  });
  assert(lowSeismicResult && highSeismicResult, "Seismic comparison should produce results.");
  const lowSeismicKolon = lowSeismicResult.breakdowns.find((item) => item.id === "kolonPerde");
  const highSeismicKolon = highSeismicResult.breakdowns.find((item) => item.id === "kolonPerde");
  assert(lowSeismicKolon && highSeismicKolon, "Column-wall breakdown should exist.");
  assert(
    highSeismicKolon.donatiTon > lowSeismicKolon.donatiTon,
    "Higher seismic demand should increase column-wall rebar demand."
  );
  assert(
    highSeismicResult.appliedFactors.filter((item) => item.id.startsWith("deprem-talebi-")).length >= 3,
    "Transparent factor table should list seismic demand effects for each impacted group."
  );

  const compactPlanResult = calculateQuickQuantity({
    ...basementApartmentInput,
    planKompaktligi: "kompakt",
  });
  const irregularPlanResult = calculateQuickQuantity({
    ...basementApartmentInput,
    planKompaktligi: "girintili",
  });
  assert(compactPlanResult && irregularPlanResult, "Plan compactness comparison should produce results.");
  assert(
    irregularPlanResult.geometriOzet.perimeterM > compactPlanResult.geometriOzet.perimeterM,
    "Irregular plan should increase estimated perimeter."
  );
  assert(
    irregularPlanResult.yardimciKabaIsBandi.expectedAmount >
      compactPlanResult.yardimciKabaIsBandi.expectedAmount,
    "Irregular plan should increase auxiliary coarse-work band."
  );

  const noRetainingResult = calculateQuickQuantity({
    ...basementApartmentInput,
    bodrumCevrePerdesi: "yok",
  });
  const fullRetainingResult = calculateQuickQuantity({
    ...basementApartmentInput,
    bodrumCevrePerdesi: "tam",
  });
  assert(noRetainingResult && fullRetainingResult, "Retaining comparison should produce results.");
  assert(
    fullRetainingResult.geometriOzet.basementWallAreaM2 >
      noRetainingResult.geometriOzet.basementWallAreaM2,
    "Full retaining should increase basement wall area estimate."
  );
  assert(
    fullRetainingResult.yardimciKabaIsBandi.expectedAmount >
      noRetainingResult.yardimciKabaIsBandi.expectedAmount,
    "Full retaining should increase auxiliary band."
  );
  const auxiliaryDistributionTotal = fullRetainingResult.yardimciKabaIsDagilimi.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  assert(
    nearlyEqual(
      auxiliaryDistributionTotal,
      fullRetainingResult.yardimciKabaIsBandi.expectedAmount,
      1e-3
    ),
    "Auxiliary cost distribution should reconcile to the expected auxiliary band."
  );

  const unsupportedInput = {
    ...basementApartmentInput,
    resmiSinif: { yil: 2026, grup: "V", sinif: "B" },
  };
  assert(
    validateQuickQuantityInput(unsupportedInput) === unsupportedMessage,
    "Unsupported official selection should return the expected Turkish validation message."
  );
  assert(
    calculateQuickQuantity(unsupportedInput) === null,
    "Unsupported official selection should not produce a fake quantity result."
  );

  const pdfResult = calculateQuickQuantity(pdfInput);
  assert(pdfResult, "PDF scenario should produce a result.");

  const snapshot = buildQuickQuantityPdfSnapshot({
    result: pdfResult,
    formattedDate: fixedDate,
  });
  const pdf = createQuickQuantityPdfDocument(snapshot);
  const pdfPath = path.join(tempDir, "quick-quantity.pdf");
  await fs.writeFile(pdfPath, Buffer.from(pdf.output("arraybuffer")));

  const inspection = inspectPdf(pdfPath);
  const text = inspection.text.replace(/\s+/g, " ").trim();

  assert(inspection.pageCount <= 2, "Quick quantity PDF should fit within two pages.");
  assert(text.includes(fixedDate), "PDF should include the fixed Turkish date.");
  assert(text.includes("Proje Profili"), "PDF should include project profile section.");
  assert(text.includes("Yardımcı Kaba İşler"), "PDF should include auxiliary coarse works section.");
  assert(text.includes("Yardımcı İş Muhasebesi"), "PDF should include auxiliary accounting section.");
  assert(text.includes("Karar Özeti"), "PDF should include engineering decision summary section.");
  assert(text.includes("Poz ve Fiyat Dayanakları"), "PDF should include source section.");
  assert(text.includes("15.150.1006"), "PDF should include concrete position number.");
  assert(text.includes("15.180.1003"), "PDF should include formwork position number.");
  assert(
    text.includes("2026 Mart Ayı Güncel İnşaat Birim Fiyat Listesi"),
    "PDF should include the monthly price snapshot source label."
  );
  assert(text.includes("Kaynak bağlantısı"), "PDF should include source link label.");
  assert(
    /[İŞĞÜÇÖışğüçö]/.test(text),
    "PDF should preserve Turkish characters in extracted text."
  );

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks: {
          villaRebarIntensity: villaResult.donatiKg / villaResult.toplamInsaatAlaniM2,
          apartmentRebarIntensity:
            apartmentResult.donatiKg / apartmentResult.toplamInsaatAlaniM2,
          basementConcreteM3: basementApartmentResult.betonM3,
          basementRebarTon: basementApartmentResult.donatiTon,
          pdfPageCount: inspection.pageCount,
        },
      },
      null,
      2
    )
  );
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
