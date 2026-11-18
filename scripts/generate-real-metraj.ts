/** Eski komut adı korunur; yalnız açık kaynak/hedef ile TASLAK PDF üretir. */
import fs from "node:fs";
import path from "node:path";
import { validateModel } from "../src/lib/hsyncad/model";
import { calculateFullTakeoff } from "../src/lib/hsyncad/quantities";
import { generateQuantityReportPDF } from "../src/lib/hsyncad/reports";
async function run() {
  const input = process.argv[2], output = process.argv[3];
  if (!input || !output || !/\.pdf$/i.test(output) || path.resolve(input) === path.resolve(output)) throw new Error("Kullanım: node --import tsx scripts/generate-real-metraj.ts <proje.hsyncad> <yeni-taslak.pdf>");
  const model = validateModel(JSON.parse(fs.readFileSync(input, "utf8")));
  const takeoff = calculateFullTakeoff(model);
  const bytes = await generateQuantityReportPDF(model, takeoff);
  fs.writeFileSync(output, bytes, { flag: "wx" });
  console.log("Taslak inceleme PDF yazıldı. Gerçek kesim listesi ve net kalıp kabulü eksik.", output);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
