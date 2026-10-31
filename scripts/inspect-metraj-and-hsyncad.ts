import fs from "node:fs";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

async function inspect() {
  const sonDir = "C:\\Users\\hsyn\\Desktop\\SON";

  console.log("=== INSPECTING METRAJ.pdf TEXT ===");
  const metrajBytes = fs.readFileSync(path.join(sonDir, "METRAJ.pdf"));
  const metrajDoc = await pdfjs.getDocument({ data: new Uint8Array(metrajBytes) }).promise;
  for (let i = 1; i <= metrajDoc.numPages; i++) {
    const page = await metrajDoc.getPage(i);
    const content = await page.getTextContent();
    const str = content.items.map((it: any) => it.str).join(" ");
    console.log(`\n--- PAGE ${i} ---`);
    console.log(str.slice(0, 500));
  }

  console.log("\n=== INSPECTING 7_KAT_5000M2_BINA.hsyncad JSON ===");
  const hsyncadContent = fs.readFileSync(path.join(sonDir, "7_KAT_5000M2_BINA.hsyncad"), "utf8");
  const model = JSON.parse(hsyncadContent);
  console.log("Root keys:", Object.keys(model));
  console.log("Materials:", JSON.stringify(model.materials, null, 2));
  console.log("Junctions key present?", "junctions" in model);
  if ("junctions" in model) {
    console.log("Junctions value:", model.junctions);
  }
  console.log("Drafting present?", "drafting" in model);
  console.log("Foundation elements?", model.elements.filter((e: any) => e.type === "foundation").length);
  console.log("Slab elements?", model.elements.filter((e: any) => e.type === "slab").length);
  console.log("Sample slab element:", JSON.stringify(model.elements.find((e: any) => e.type === "slab"), null, 2));
}

inspect().catch(console.error);
