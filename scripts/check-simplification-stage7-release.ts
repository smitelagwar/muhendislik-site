import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  BINA_ASAMALARI_ROOT_URL,
  getAllIndexedBinaNodes,
} from "../src/lib/bina-asamalari";
import {
  getAllBinaGuidePaths,
  getBinaGuideBySlugPath,
} from "../src/lib/bina-asamalari-content";
import {
  BOTTOM_NAV_ITEMS,
  MOBILE_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
} from "../src/lib/navigation-config";
import { isUserVisibleSiteSection } from "../src/lib/site-sections";

const ROOT = process.cwd();
const checks: string[] = [];

function source(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function pass(label: string) {
  checks.push(label);
  console.log(`✓ ${label}`);
}

function expectExactIds(
  label: string,
  actual: Array<{ id: string }>,
  expected: string[],
) {
  assert.deepEqual(
    actual.map((item) => item.id),
    expected,
    `${label} sırası/sözleşmesi değişti.`,
  );
  pass(label);
}

console.log("============================================================");
console.log("SADELEŞTİRME AŞAMA 7 — STATİK RELEASE GATE");
console.log("============================================================");

// 1) İçerik kaybı: production'da 85 statik Bina rehberi vardı.
// Final tek-kaynak ağında da tam 85 benzersiz erişilebilir rehber korunmalı.
const indexedNodes = getAllIndexedBinaNodes().filter((node) => node.slugPath);
const guidePaths = getAllBinaGuidePaths();
const indexedPaths = indexedNodes.map((node) => node.slugPath);

assert.equal(indexedNodes.length, 85, "Canonical Bina rehber düğümü sayısı 85 olmalı.");
assert.equal(guidePaths.length, 85, "Erişilebilir Bina rehber sayısı 85 olmalı.");
assert.equal(new Set(indexedPaths).size, 85, "Bina rehber slug'ları benzersiz olmalı.");
assert.equal(new Set(guidePaths).size, 85, "Guide path listesi benzersiz olmalı.");
assert.deepEqual(
  [...guidePaths].sort(),
  [...indexedPaths].sort(),
  "Veri ağındaki her canonical rehber, içerik katmanında birebir erişilebilir olmalı.",
);
for (const slugPath of guidePaths) {
  assert.ok(getBinaGuideBySlugPath(slugPath), `Rehber çözümlenemedi: ${slugPath}`);
}
assert.equal(BINA_ASAMALARI_ROOT_URL, "/rehber");
pass("85/85 Bina rehberi içerik kaybı olmadan canonical /rehber ağına bağlı");

// 2) Eski kullanıcı yüzeyleri gerçekten yok.
const retiredPaths = [
  "src/app/konu-haritasi/page.tsx",
  "src/app/kaydedilenler/page.tsx",
  "src/app/kategori/bina-asamalari/page.tsx",
  "src/components/BinaConstructionTimeline.tsx",
  "src/components/BinaConstructionTimelineVisual.tsx",
  "src/components/bookmark-button.tsx",
  "src/components/reading-list.tsx",
  "src/components/kaydedilenler/saved-items-client.tsx",
  "src/components/home-scroll-logo.tsx",
  "src/components/home-workflow-band.tsx",
];
for (const retiredPath of retiredPaths) {
  assert.equal(exists(retiredPath), false, `Kaldırılmış yüzey geri dönmüş: ${retiredPath}`);
}
assert.ok(exists("src/app/rehber/[...slug]/page.tsx"), "Canonical rehber route'u eksik.");
pass("Kaldırılmış kullanıcı yüzeyleri ve dekoratif runtime katmanları geri dönmemiş");

// 3) Eski Bina çocuk URL'leri canonical rehbere kalıcı yönlenmeli.
const nextConfig = source("next.config.ts");
assert.match(nextConfig, /source:\s*["']\\?\/kategori\/bina-asamalari\/:path\+["']/);
assert.match(nextConfig, /destination:\s*["']\\?\/rehber\/:path\+["']/);
const redirectWindow = nextConfig.slice(
  nextConfig.indexOf('source: "/kategori/bina-asamalari/:path+"'),
  nextConfig.indexOf('source: "/kategori/bina-asamalari/:path+"') + 220,
);
assert.match(redirectWindow, /permanent:\s*true/);
pass("Eski Bina çocuk URL'leri permanent redirect ile /rehber'e taşınıyor");

// 4) Kritik navigasyon matrisi.
expectExactIds("Desktop primary nav", PRIMARY_NAV_ITEMS, [
  "home",
  "deprem-yonetmelik",
  "hesaplamalar",
  "araclar",
  "belgeler",
  "dokumantasyon",
]);
expectExactIds("Mobil drawer nav", MOBILE_NAV_ITEMS, [
  "home",
  "deprem-yonetmelik",
  "hesaplamalar",
  "araclar",
  "belgeler",
  "dokumantasyon",
  "iletisim",
]);
expectExactIds("Mobil bottom-bar link tabanı", BOTTOM_NAV_ITEMS, [
  "home",
  "araclar",
  "belgeler",
  "dokumantasyon",
]);

const bottomNav = source("src/components/bottom-nav.tsx");
assert.ok(
  bottomNav.includes('{ id: "search", label: "Ara", action: "search"'),
  "Mobil bottom bar Ara aksiyonu eksik.",
);
assert.ok(
  bottomNav.includes("...BOTTOM_NAV_ITEMS.slice(1)"),
  "Mobil bottom bar Ara ikinci sıraya yerleştirilmemiş.",
);
for (const label of ["Konu Haritası", "Bina Aşamaları", "Kaydedilenler"]) {
  assert.equal(
    PRIMARY_NAV_ITEMS.some((item) => item.label === label),
    false,
    `Desktop nav'da kaldırılmış etiket var: ${label}`,
  );
  assert.equal(
    MOBILE_NAV_ITEMS.some((item) => item.label === label),
    false,
    `Mobil nav'da kaldırılmış etiket var: ${label}`,
  );
}
pass("Kritik mobil/desktop navigasyon matrisi final bilgi mimarisiyle eşleşiyor");

// 5) Yapı/Şantiye/Bina Aşamaları veri tanımları korunabilir ama public kategori olamaz.
for (const sectionId of ["bina-asamalari", "yapi-tasarimi", "santiye"] as const) {
  assert.equal(
    isUserVisibleSiteSection(sectionId),
    false,
    `Kaldırılmış ana kategori tekrar kullanıcıya açılmış: ${sectionId}`,
  );
}
const categoryPage = source("src/app/kategori/[slug]/page.tsx");
assert.ok(
  categoryPage.includes("!isUserVisibleSiteSection(section.id)"),
  "Dinamik kategori route'unda hidden-section 404 guard eksik.",
);
pass("Yapı / Şantiye / Bina Aşamaları public kategori yüzeyi kapalı");

// 6) Rehber discoverability: arama ve sitemap canonical rehber kaynağını tüketmeli.
const searchIndex = source("src/lib/search-index.ts");
const sitemap = source("src/app/sitemap.ts");
assert.ok(searchIndex.includes("getAllBinaGuidePaths"), "Arama index'i rehberleri tüketmiyor.");
assert.ok(searchIndex.includes("BINA_ASAMALARI_ROOT_URL"), "Arama index'i canonical rehber root'unu kullanmıyor.");
assert.ok(sitemap.includes("getAllBinaGuidePaths"), "Sitemap rehberleri tüketmiyor.");
assert.ok(sitemap.includes("BINA_ASAMALARI_ROOT_URL"), "Sitemap canonical rehber root'unu kullanmıyor.");
pass("85 rehber arama index'i ve sitemap üzerinden discoverable");

// 7) Stage 6/7 test zinciri ve paket bütünlüğü.
const pkg = JSON.parse(source("package.json")) as {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const lock = JSON.parse(source("package-lock.json")) as {
  packages?: Record<string, {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>;
};
assert.deepEqual(
  lock.packages?.[""]?.dependencies ?? {},
  pkg.dependencies ?? {},
  "package-lock runtime dependencies package.json ile eşleşmiyor.",
);
assert.deepEqual(
  lock.packages?.[""]?.devDependencies ?? {},
  pkg.devDependencies ?? {},
  "package-lock devDependencies package.json ile eşleşmiyor.",
);
assert.ok(pkg.scripts?.["check:simplification-stage6"], "Stage 6 kabul komutu eksik.");
assert.ok(pkg.scripts?.["check:simplification-stage7"], "Stage 7 release komutu eksik.");
assert.ok(pkg.scripts?.["check:simplification-stage7:clean"], "Clean Stage 7 release komutu eksik.");
assert.ok(exists("tests/site-audit/simplification-stage6.spec.ts"), "Stage 6 browser spec'i eksik.");

const vercelConfig = JSON.parse(source("vercel.json")) as {
  git?: { deploymentEnabled?: Record<string, boolean> };
};
assert.equal(
  vercelConfig.git?.deploymentEnabled?.["internal-site-release-gate-20260924"],
  false,
  "Release-check branch Vercel otomatik deployment'tan kapalı olmalı.",
);
assert.ok(
  exists(".github/workflows/site-simplification-release-gate.yml"),
  "Stage 7 GitHub Actions release workflow'u eksik.",
);
const releaseWorkflow = source(".github/workflows/site-simplification-release-gate.yml");
assert.ok(
  releaseWorkflow.includes("internal-site-release-gate-20260924"),
  "Release workflow doğru branch'i dinlemiyor.",
);
assert.ok(
  releaseWorkflow.includes("npm run check:simplification-stage7"),
  "Release workflow Stage 7 gate'i çalıştırmıyor.",
);
pass("Package/lock bütünlüğü, deploysuz release branch'i ve Stage 6 + Stage 7 CI zinciri kayıtlı");

console.log("============================================================");
console.log(`AŞAMA 7 STATİK GATE: ${checks.length}/${checks.length} kontrol geçti.`);
console.log("============================================================");
