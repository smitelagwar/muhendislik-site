import { DEPREM_ROLLOUT_ARTICLES } from "../src/lib/deprem-rollout";
import { TS500_ARTICLES } from "../src/lib/ts500-content";
import {
  DEPREM_TECHNICAL_VISUAL_MIN_ASSET_COUNT,
  DEPREM_TECHNICAL_VISUAL_ROLLOUT,
  DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT,
} from "../src/lib/deprem-visual-rollout";

const strict = process.argv.includes("--strict");
const fail = (message: string) => {
  console.error(`FAIL — ${message}`);
  process.exitCode = 1;
};
const pass = (message: string) => console.log(`PASS — ${message}`);

const allTopicSlugs = [
  ...DEPREM_ROLLOUT_ARTICLES.map((item) => item.slug),
  ...TS500_ARTICLES.map((item) => item.slug),
];
const uniqueTopicSlugs = new Set(allTopicSlugs);

if (uniqueTopicSlugs.size !== DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT) {
  fail(`Konu envanteri ${DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT} yerine ${uniqueTopicSlugs.size}`);
} else {
  pass(`Konu envanteri: ${uniqueTopicSlugs.size}/${DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT}`);
}

if (allTopicSlugs.length !== uniqueTopicSlugs.size) {
  fail("Rollout + TS500 birleşiminde duplicate slug bulundu");
} else {
  pass("Konu slug'ları benzersiz");
}

const rolloutSlugs = new Set<string>();
let completedAssets = 0;
for (const item of DEPREM_TECHNICAL_VISUAL_ROLLOUT) {
  if (!uniqueTopicSlugs.has(item.slug)) fail(`Rollout manifestinde bilinmeyen slug: ${item.slug}`);
  if (rolloutSlugs.has(item.slug)) fail(`Rollout manifestinde duplicate slug: ${item.slug}`);
  rolloutSlugs.add(item.slug);

  const assetSet = new Set(item.assets);
  if (item.assets.length < 2 || assetSet.size < 2) {
    fail(`${item.slug}: en az iki farklı asset zorunlu`);
  }
  if (!assetSet.has("cover.svg") || !assetSet.has("diagram.svg")) {
    fail(`${item.slug}: cover.svg + diagram.svg kontratı eksik`);
  }
  if (item.status === "complete") completedAssets += item.assets.length;
}

const completedTopics = DEPREM_TECHNICAL_VISUAL_ROLLOUT.filter((item) => item.status === "complete").length;
pass(`Yeni teknik tasarım rollout: ${completedTopics}/${DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT} konu, ${completedAssets}/${DEPREM_TECHNICAL_VISUAL_MIN_ASSET_COUNT} minimum asset`);

if (strict) {
  if (completedTopics !== DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT) {
    fail(`Strict mod: ${DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT - completedTopics} konu henüz tamamlanmadı`);
  }
  if (completedAssets < DEPREM_TECHNICAL_VISUAL_MIN_ASSET_COUNT) {
    fail(`Strict mod: minimum ${DEPREM_TECHNICAL_VISUAL_MIN_ASSET_COUNT} asset sağlanmadı`);
  }
} else {
  pass("Fazlı mod aktif; yalnız tamamlandı olarak işaretlenen konular zorunlu kapıya tabi");
}

if (process.exitCode) process.exit(process.exitCode);
console.log("\nDEPREM TECHNICAL VISUAL ROLLOUT: PASS");
