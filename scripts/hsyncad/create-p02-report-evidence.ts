import fs from "node:fs";
import path from "node:path";
import { generateStaticReportPDF } from "../../src/lib/hsyncad/reports";
import { smallSlab, manyColumns, preliminaryRecords } from "../../tests/hsyncad-structural/report-fixtures";

async function main() {
  const output = process.argv[2];
  if (!output || !path.isAbsolute(output)) throw new Error("Mutlak yeni çıktı klasörü gerekli.");
  fs.mkdirSync(output);
  const model = manyColumns(100, "Çığ Şölen - P02 bağımsız inceleme");
  const analysis = preliminaryRecords(model);
  analysis.members["column-99"].pass = false;
  fs.writeFileSync(path.join(output, "p02-failed-static.pdf"), await generateStaticReportPDF(model, analysis));
  fs.writeFileSync(path.join(output, "p02-missing-static.pdf"), await generateStaticReportPDF(smallSlab()));
  fs.writeFileSync(path.join(output, "manifest.json"), JSON.stringify({
    kind: "synthetic_renderer_evidence", engineeringOracle: false, count: 2,
    failedSubject: "column-99", missingDataExample: true,
  }, null, 2));
  console.log("İki sentetik inceleme PDF'si yazıldı; kurum veya gerçek proje kabul raporu değildir.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
