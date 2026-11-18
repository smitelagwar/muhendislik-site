/** Mevcut ön hesap API tanısı; tamamlanmış bina/mevzuat kabulü değildir. */
import fs from "node:fs";
import { validateModel } from "../src/lib/hsyncad/model";
import { runStructuralAnalysis } from "../src/lib/hsyncad/analysis";
import { calculateFullTakeoff } from "../src/lib/hsyncad/quantities";
import { getReportReadiness } from "../src/lib/hsyncad/report-readiness";
try {
  const input=process.argv[2]; if(!input) throw new Error("Kullanım: node --import tsx scripts/test-hsyncad-engine.ts <proje.hsyncad>");
  const model=validateModel(JSON.parse(fs.readFileSync(input,"utf8")));
  const analysis=runStructuralAnalysis(model);
  console.log(JSON.stringify({readiness:getReportReadiness(model,analysis,analysis.designResult),takeoff:calculateFullTakeoff(model),preliminaryAnalysis:{weightKn:analysis.totalWeightKn,baseShearKn:analysis.baseShearKn,periodSec:analysis.periodSec}},null,2));
} catch(error) { console.error(error); process.exitCode=1; }
