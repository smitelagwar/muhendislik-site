/** Açık kaynak üzerinden kısmi metraj tanısı; proje eşdeğerliği testi değildir. */
import fs from "node:fs";
import { validateModel } from "../src/lib/hsyncad/model";
import { calculateFullTakeoff } from "../src/lib/hsyncad/quantities";
try {
  const input=process.argv[2]; if(!input) throw new Error("Kullanım: node --import tsx scripts/test-system-takeoff.ts <proje.hsyncad>");
  const model=validateModel(JSON.parse(fs.readFileSync(input,"utf8")));
  console.log(JSON.stringify(calculateFullTakeoff(model),null,2));
} catch(error) { console.error(error); process.exitCode=1; }
