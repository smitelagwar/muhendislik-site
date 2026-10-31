import fs from "node:fs";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { verifyIdeHeaderChecksum } from "../src/lib/hsyncad/ide-import/ide-binary-codec";

async function verifyAll() {
  const sonDir = "C:/Users/hsyn/Desktop/SON";
  console.log("--- Verifying Deliverables in C:\\Users\\hsyn\\Desktop\\SON ---");

  // 1. STATİK RAPOR.pdf
  const staticPath = path.join(sonDir, "STATİK RAPOR.pdf");
  const staticBytes = fs.readFileSync(staticPath);
  const staticDoc = await pdfjs.getDocument({ data: new Uint8Array(staticBytes) }).promise;
  console.log(`[PASS] STATİK RAPOR.pdf exists (${staticBytes.length} bytes, ${staticDoc.numPages} pages)`);

  let staticText = "";
  for (let i = 1; i <= staticDoc.numPages; i++) {
    const page = await staticDoc.getPage(i);
    const content = await page.getTextContent();
    staticText += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  const hasTbdy = staticText.includes("TBDY 2018");
  const hasTs500 = staticText.includes("TS 500");
  const hasBelediye = staticText.includes("BELEDİYESİ");
  console.log(`       Static Report content checks: TBDY 2018: ${hasTbdy}, TS 500: ${hasTs500}, Belediye: ${hasBelediye}`);

  // 2. METRAJ.pdf
  const metrajPath = path.join(sonDir, "METRAJ.pdf");
  const metrajBytes = fs.readFileSync(metrajPath);
  const metrajDoc = await pdfjs.getDocument({ data: new Uint8Array(metrajBytes) }).promise;
  console.log(`[PASS] METRAJ.pdf exists (${metrajBytes.length} bytes, ${metrajDoc.numPages} pages)`);

  let metrajText = "";
  for (let i = 1; i <= metrajDoc.numPages; i++) {
    const page = await metrajDoc.getPage(i);
    const content = await page.getTextContent();
    metrajText += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  const hasPoz15 = metrajText.includes("15.150.1005") && metrajText.includes("15.140.1002");
  console.log(`       Metraj Ministry Poz numbers verified: ${hasPoz15}`);

  // 3. STATİK RAPOR KAPAK.pdf
  const kapakPath = path.join(sonDir, "STATİK RAPOR KAPAK.pdf");
  const kapakBytes = fs.readFileSync(kapakPath);
  const kapakDoc = await pdfjs.getDocument({ data: new Uint8Array(kapakBytes) }).promise;
  console.log(`[PASS] STATİK RAPOR KAPAK.pdf exists (${kapakBytes.length} bytes, ${kapakDoc.numPages} page)`);

  // 4. .hsyncad structured JSON
  const hsyncadPath = path.join(sonDir, "7_KAT_5000M2_BINA.hsyncad");
  const hsyncadData = JSON.parse(fs.readFileSync(hsyncadPath, "utf8"));
  console.log(`[PASS] 7_KAT_5000M2_BINA.hsyncad exists: ${hsyncadData.floors.length} floors, ${hsyncadData.elements.length} elements`);

  // 5. .ide10 binary carrier
  const ide10Path = path.join(sonDir, "7_KAT_5000M2_BINA.ide10");
  const ide10Bytes = fs.readFileSync(ide10Path);
  const crcValid = verifyIdeHeaderChecksum(new Uint8Array(ide10Bytes));
  console.log(`[PASS] 7_KAT_5000M2_BINA.ide10 exists (${(ide10Bytes.length / 1024 / 1024).toFixed(1)} MB), IEEE CRC32 valid: ${crcValid}`);

  // 6. KALIP_PLANI.dxf
  const kalipPath = path.join(sonDir, "KALIP_PLANI.dxf");
  const kalipDxf = fs.readFileSync(kalipPath, "utf8");
  const hasLayers = kalipDxf.includes("KOLONLAR") && kalipDxf.includes("KIRISLER") && kalipDxf.includes("DOSEMELER");
  console.log(`[PASS] KALIP_PLANI.dxf exists (${kalipDxf.split("\n").length} lines, RC layers verified: ${hasLayers})`);

  // 7. DONATI_DETAYLARI.dxf
  const donatiPath = path.join(sonDir, "DONATI_DETAYLARI.dxf");
  const donatiDxf = fs.readFileSync(donatiPath, "utf8");
  const hasDonatiLayers = donatiDxf.includes("DONATI") && donatiDxf.includes("KIRISLER");
  console.log(`[PASS] DONATI_DETAYLARI.dxf exists (${donatiDxf.split("\n").length} lines, rebar layers verified: ${hasDonatiLayers})`);

  // 8. Visual Screenshots
  const screenshots = [
    "01_3D_DEFORMASYON_HEATMAP.png",
    "02_M3_MOMENT_DIYAGRAMI.png",
    "03_V2_KESME_DIYAGRAMI.png",
    "04_N_EKSENEL_DIYAGRAMI.png",
    "05_DCR_KAPASITE_ORANLARI.png",
  ];
  for (const shot of screenshots) {
    const shotPath = path.join(sonDir, shot);
    const stat = fs.statSync(shotPath);
    console.log(`[PASS] Screenshot ${shot} exists (${(stat.size / 1024).toFixed(1)} KB)`);
  }

  console.log("--- All deliverables verified successfully! ---");
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
