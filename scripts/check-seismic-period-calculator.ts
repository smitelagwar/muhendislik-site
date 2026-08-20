import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  calculateDesignSpectrumParameters,
  calculateEmpiricalPeriod,
  calculateF1,
  calculateFs,
  calculateHorizontalElasticSpectrum,
  calculateShearWallCt,
  calculateShearWallEquivalentArea,
  calculateShearWallPeriodParameters,
  createSpectrumPoints,
  findSpectrumCrossCheckMismatches,
  parseTdthReportText,
  parseTurkishNumber,
  type SoilClass,
} from "../src/lib/engineering/tbdy2018";

const approximately = (actual: number, expected: number, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `Beklenen ${expected}, alınan ${actual}`);

const fsTable: Record<Exclude<SoilClass, "ZF">, number[]> = {
  ZA: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
  ZB: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
  ZC: [1.3, 1.3, 1.2, 1.2, 1.2, 1.2],
  ZD: [1.6, 1.4, 1.2, 1.1, 1, 1],
  ZE: [2.4, 1.7, 1.3, 1.1, 0.9, 0.8],
};
const f1Table: Record<Exclude<SoilClass, "ZF">, number[]> = {
  ZA: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
  ZB: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
  ZC: [1.5, 1.5, 1.5, 1.5, 1.5, 1.4],
  ZD: [2.4, 2.2, 2, 1.9, 1.8, 1.7],
  ZE: [4.2, 3.3, 2.8, 2.4, 2.2, 2],
};

// 3.1 Golden test — TBDY 2018, only reinforced-concrete frame.
const period = calculateEmpiricalPeriod(0.1, 15);
approximately(period, 0.7621991222, 0.001);
approximately(1.4 * period, 1.0670787711, 0.001);

const parameters = calculateDesignSpectrumParameters("ZC", 0.85, 0.25);
assert.ok(parameters, "ZC için spektrum parametreleri hesaplanmalıdır.");
approximately(parameters.fs, 1.2, 0.001);
approximately(parameters.f1, 1.5, 0.001);
approximately(parameters.sds, 1.02, 0.001);
approximately(parameters.sd1, 0.375, 0.001);
approximately(parameters.ta, 0.0735294118, 0.001);
approximately(parameters.tb, 0.3676470588, 0.001);
const saeAtPeriod = calculateHorizontalElasticSpectrum(period, parameters);
approximately(saeAtPeriod, 0.4920, 0.001);

// 3.2 The former ASCE-like outputs cannot silently return.
assert.ok(Math.abs(period - 0.632) > 0.001, "Eski periyot katsayısı geri dönmemelidir.");
assert.ok(Math.abs(parameters.sds - 1.275) > 0.001, "Eski sabit Fs geri dönmemelidir.");
assert.ok(Math.abs(parameters.sd1 - 0.4) > 0.001, "Eski sabit F1 geri dönmemelidir.");

// 3.3–3.4 Full Fs/F1 table nodes plus upper/lower behavior.
const fsBreakpoints = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
const f1Breakpoints = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
for (const soilClass of Object.keys(fsTable) as Array<Exclude<SoilClass, "ZF">>) {
  fsBreakpoints.forEach((point, index) => approximately(calculateFs(soilClass, point)!, fsTable[soilClass][index]));
  f1Breakpoints.forEach((point, index) => approximately(calculateF1(soilClass, point)!, f1Table[soilClass][index]));
  approximately(calculateFs(soilClass, 0.1)!, fsTable[soilClass][0]);
  approximately(calculateFs(soilClass, 1.75)!, fsTable[soilClass][5]);
  approximately(calculateF1(soilClass, 0.05)!, f1Table[soilClass][0]);
  approximately(calculateF1(soilClass, 0.8)!, f1Table[soilClass][5]);
}
approximately(calculateFs("ZD", 0.375)!, 1.5);
approximately(calculateFs("ZC", 0.625)!, 1.25);
approximately(calculateFs("ZE", 0.875)!, 1.2);
approximately(calculateF1("ZD", 0.15)!, 2.3);
approximately(calculateF1("ZE", 0.25)!, 3.05);
approximately(calculateF1("ZC", 0.55)!, 1.45);

// 3.5 ZF deliberately has no table-based spectrum.
assert.equal(calculateFs("ZF", 0.85), null);
assert.equal(calculateF1("ZF", 0.25), null);
assert.equal(calculateDesignSpectrumParameters("ZF", 0.85, 0.25), null);

// 3.6 Every spectrum branch and each breakpoint remains continuous.
approximately(calculateHorizontalElasticSpectrum(0, parameters), 0.408);
approximately(calculateHorizontalElasticSpectrum(parameters.ta / 2, parameters), parameters.sds * 0.7);
approximately(calculateHorizontalElasticSpectrum(parameters.ta, parameters), parameters.sds);
approximately(calculateHorizontalElasticSpectrum((parameters.ta + parameters.tb) / 2, parameters), parameters.sds);
approximately(calculateHorizontalElasticSpectrum(parameters.tb, parameters), parameters.sds);
approximately(parameters.sd1 / parameters.tb, parameters.sds);
approximately(calculateHorizontalElasticSpectrum((parameters.tb + parameters.tl) / 2, parameters), parameters.sd1 / ((parameters.tb + parameters.tl) / 2));
approximately(calculateHorizontalElasticSpectrum(parameters.tl, parameters), parameters.sd1 / parameters.tl);
approximately(calculateHorizontalElasticSpectrum(parameters.tl, parameters), (parameters.sd1 * parameters.tl) / (parameters.tl * parameters.tl));
approximately(calculateHorizontalElasticSpectrum(7, parameters), (parameters.sd1 * parameters.tl) / 49);

// 3.7 Chart points are derived from the same spectrum function and retain exact markers.
const points = createSpectrumPoints(parameters, 7, 120, [period]);
for (const marker of [parameters.ta, parameters.tb, parameters.tl, period]) {
  const point = points.find((candidate) => candidate.period === marker);
  assert.ok(point, `Grafik ${marker} s tam noktasını içermelidir.`);
  approximately(point.acceleration, calculateHorizontalElasticSpectrum(marker, parameters));
}
for (const point of points.filter((_, index) => index % 31 === 0)) {
  approximately(point.acceleration, calculateHorizontalElasticSpectrum(point.period, parameters));
}

// 3.8 TBDY 4.28a–b: Ct cap and equivalent-area cap branches.
approximately(calculateShearWallCt(1), 0.07);
approximately(calculateShearWallCt(4), 0.05);
const rawAreaBelowTotal = calculateShearWallEquivalentArea([{ areaM2: 1, lengthM: 3 }], 15);
approximately(rawAreaBelowTotal, 0.24);
const rawAreaAboveTotal = calculateShearWallEquivalentArea([{ areaM2: 4, lengthM: 15 }], 15);
approximately(rawAreaAboveTotal, 4);
const wallParameters = calculateShearWallPeriodParameters([{ areaM2: 4, lengthM: 15 }], 15);
assert.ok(wallParameters, "Geçerli perde verileriyle parametreler hesaplanmalıdır.");
approximately(wallParameters.uncappedEquivalentAreaM2, 4.8);
approximately(wallParameters.totalWallAreaM2, 4);
approximately(wallParameters.equivalentAreaM2, 4);
approximately(wallParameters.ct, 0.05);
approximately(wallParameters.periodS, calculateEmpiricalPeriod(0.05, 15));

// 3.9 Turkish numeric parser does not silently coerce invalid input to zero.
for (const [input, expected] of [["0.85", 0.85], ["0,85", 0.85], ["15", 15], ["15.0", 15], ["15,0", 15]] as const) {
  assert.equal(parseTurkishNumber(input), expected);
}
for (const input of ["--", "1,2,3", "abc", "NaN", "Infinity", ""]) {
  assert.equal(parseTurkishNumber(input), null, `${input} geçersiz kalmalıdır.`);
}

// 3.10 TDTH Smart Paste fixtures: standard, decimal comma, case, PDF spacing, partial and secondary-only text.
const fixtures = [
  { text: "Ss = 0.860\nS1 = 0.229\nDD-2\nYerel Zemin Sınıfı: ZD", ss: 0.86, s1: 0.229, level: "DD-2", soil: "ZD" },
  { text: "Ss=0,860\nS1=0,229\nDD – 2\nYerel Zemin Sınıfı ZC", ss: 0.86, s1: 0.229, level: "DD-2", soil: "ZC" },
  { text: "SS = 0.860\nS_1 = 0.229\nDD-3\nYerel Zemin Sınıfı: ZE", ss: 0.86, s1: 0.229, level: "DD-3", soil: "ZE" },
  { text: "S S = 0,860\nS 1 = 0,229\nDD - 1\nYerel Zemin Sınıfı: ZA", ss: 0.86, s1: 0.229, level: "DD-1", soil: "ZA" },
  { text: "Ss = 0.860\nS1 = 0.229\nDD-4\nYerel Zemin Sınıfı: ZB", ss: 0.86, s1: 0.229, level: "DD-4", soil: "ZB" },
  { text: "Ss = 0.860\nS1 = 0.229\nDD-2", ss: 0.86, s1: 0.229, level: "DD-2", soil: undefined },
] as const;
for (const fixture of fixtures) {
  const parsed = parseTdthReportText(fixture.text);
  assert.equal(parsed.ss, fixture.ss);
  assert.equal(parsed.s1, fixture.s1);
  assert.equal(parsed.earthquakeLevel, fixture.level);
  assert.equal(parsed.soilClass, fixture.soil);
}
const secondaryOnly = parseTdthReportText("SDS = 0.994\nSD1 = 0.430\nTA = 0.086\nTB = 0.430\nDD-2");
assert.equal(secondaryOnly.ss, undefined);
assert.equal(secondaryOnly.s1, undefined);
assert.equal(secondaryOnly.reportedSpectrum.sds, 0.994);
assert.equal(secondaryOnly.reportedSpectrum.sd1, 0.43);
assert.ok(secondaryOnly.warnings.some((warning) => warning.startsWith("Ss")));
assert.ok(secondaryOnly.warnings.some((warning) => warning.startsWith("S1")));

const parsedParameters = calculateDesignSpectrumParameters("ZD", 0.86, 0.229);
assert.ok(parsedParameters, "Parser ile bulunan birincil değerlerden spektrum tekrar hesaplanmalıdır.");
assert.deepEqual(findSpectrumCrossCheckMismatches({ sds: parsedParameters.sds, sd1: parsedParameters.sd1 }, parsedParameters), []);
assert.equal(findSpectrumCrossCheckMismatches({ sds: 9 }, parsedParameters)[0]?.field, "sds");

// 3.11 Security regression: pasted report text cannot leave the browser or become HTML.
const componentSource = readFileSync(path.join(process.cwd(), "src", "components", "seismic-period-calculator.tsx"), "utf8");
const parserSource = readFileSync(path.join(process.cwd(), "src", "lib", "engineering", "tbdy2018", "parsers", "tdth-report-text.ts"), "utf8");
const calculationSource = [componentSource, parserSource, readFileSync(path.join(process.cwd(), "src", "lib", "engineering", "tbdy2018", "constants.ts"), "utf8")].join("\n");
assert.doesNotMatch(componentSource, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|axios|dangerouslySetInnerHTML|innerHTML/);
assert.doesNotMatch(parserSource, /innerHTML|dangerouslySetInnerHTML/);
assert.doesNotMatch(calculationSource, /0\.0724|0\.0488|0\.0731|x:\s*0\.8/);

console.log("Deprem periyot hesaplayıcı golden, regresyon ve güvenlik kontrolleri geçti.");
