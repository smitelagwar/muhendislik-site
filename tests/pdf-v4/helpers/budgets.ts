import fs from "node:fs";
import path from "node:path";
import { expect, type TestInfo } from "@playwright/test";

export type Profile = "desktop" | "mobile" | "mobile-throttled";
export type MetricValue = number | string | boolean | null;
export type Metrics = Record<string, MetricValue>;

type BudgetFile = Record<string, Partial<Record<Profile, Record<string, number>>>>;

const budgetPath = path.resolve(__dirname, "../budgets.json");
const budgets: BudgetFile = JSON.parse(fs.readFileSync(budgetPath, "utf8"));

export const MODE: "baseline" | "gate" = process.env.PDF_V4_MODE === "baseline" ? "baseline" : "gate";
export const IS_PRODUCTION_SERVER = process.env.PLAYWRIGHT_PRODUCTION_SERVER === "1";
const OUT_DIR = path.resolve(process.cwd(), "test-results/pdf-v4");

/** Bütçe kapısı dev sunucuda anlamsız (dev derleme 3-10× yavaş). Sessizce geçmek yerine bağır. */
export function assertServerMode(): void {
  if (MODE === "gate" && !IS_PRODUCTION_SERVER) {
    throw new Error(
      "PDF v4 bütçe kapısı production sunucu ister: `npm run build` sonra PLAYWRIGHT_PRODUCTION_SERVER=1 ile çalıştır. " +
        "Yalnızca ölçmek için PDF_V4_MODE=baseline kullan."
    );
  }
}

/**
 * Ölçümü diske yazar (tek satır JSON) ve bütçeyi uygular.
 * Bütçe anahtarı  <metrik>Max  → gerçek ≤ değer ;  <metrik>Min → gerçek ≥ değer.
 * Bütçede olup ölçümde olmayan metrik HATADIR (yazım hatası sessizce geçmesin).
 */
export function recordAndGate(
  testInfo: TestInfo,
  scenario: string,
  profile: Profile,
  fixture: string,
  metrics: Metrics
): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const row = {
    ts: new Date().toISOString(),
    scenario,
    profile,
    fixture,
    project: testInfo.project.name,
    mode: MODE,
    build: IS_PRODUCTION_SERVER ? "prod" : "dev",
    cpu: Number(process.env.PDF_V4_CPU || 1),
    metrics,
  };
  fs.appendFileSync(path.join(OUT_DIR, "results.jsonl"), JSON.stringify(row) + "\n");
  void testInfo.attach(`${scenario}-${fixture}.json`, { body: JSON.stringify(row, null, 2), contentType: "application/json" });

  if (MODE === "baseline") return;
  if (testInfo.project.name === "webkit") return; // WebKit sonuçları yalnızca bilgi (longtask yok, zamanlamalar farklı)
  const b = budgets[scenario]?.[profile];
  if (!b) return; // bu profil için bu senaryoda bütçe tanımlı değil
  for (const [key, limit] of Object.entries(b)) {
    const isMin = key.endsWith("Min");
    const isMax = key.endsWith("Max");
    if (!isMin && !isMax) throw new Error(`budgets.json: "${scenario}.${profile}.${key}" Max/Min ile bitmeli`);
    const name = key.slice(0, -3);
    const actual = metrics[name];
    if (typeof actual !== "number") {
      expect.soft(false, `${scenario}/${fixture}: "${name}" ölçülmedi (bütçe var: ${key}=${limit})`).toBe(true);
      continue;
    }
    expect
      .soft(isMax ? actual <= limit : actual >= limit, `${scenario}/${fixture}/${profile}: ${name}=${actual} ${isMax ? "≤" : "≥"} ${limit} olmalı`)
      .toBe(true);
  }
}
