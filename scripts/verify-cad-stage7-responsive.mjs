import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = process.cwd();
const layoutPath = resolve(root, "src/lib/dokumantasyon/cad-review/responsive-layout.ts");
const wrapperPath = resolve(root, "src/components/dokumantasyon/preview/cad-studio-ribbon.tsx");
const desktopPath = resolve(root, "src/components/dokumantasyon/preview/cad-studio-ribbon-desktop.tsx");
const responsivePath = resolve(root, "src/components/dokumantasyon/preview/cad-responsive-ribbon.tsx");
const overflowPath = resolve(root, "src/components/dokumantasyon/preview/cad-responsive-overflow.tsx");
const buttonPath = resolve(root, "src/components/dokumantasyon/preview/cad-ribbon/cad-ribbon-button.tsx");
const groupPath = resolve(root, "src/components/dokumantasyon/preview/cad-ribbon/cad-ribbon-group.tsx");
const popoverPath = resolve(root, "src/components/dokumantasyon/preview/cad-ribbon/cad-tool-popover.tsx");
const areaPath = resolve(root, "src/components/dokumantasyon/preview/cad-area-overlay.tsx");
const exportDialogPath = resolve(root, "src/components/dokumantasyon/preview/cad-export-dialog.tsx");

const [wrapper, desktop, responsive, overflow, button, group, popover, area, exportDialog] = await Promise.all([
  readFile(wrapperPath, "utf8"),
  readFile(desktopPath, "utf8"),
  readFile(responsivePath, "utf8"),
  readFile(overflowPath, "utf8"),
  readFile(buttonPath, "utf8"),
  readFile(groupPath, "utf8"),
  readFile(popoverPath, "utf8"),
  readFile(areaPath, "utf8"),
  readFile(exportDialogPath, "utf8"),
]);

const layout = await import(pathToFileURL(layoutPath).href);
const expected = [
  [375, 667, "mobile-dock", false],
  [390, 844, "mobile-dock", false],
  [768, 1024, "tablet-ribbon", false],
  [1024, 768, "tablet-ribbon", false],
  [1280, 800, "desktop-ribbon", true],
  [1440, 900, "desktop-ribbon", false],
];

assert.deepEqual(
  layout.CAD_STAGE7_VIEWPORT_MATRIX.map(({ width, height }) => [width, height]),
  expected.map(([width, height]) => [width, height]),
  "Ana plandaki Stage 7 viewport matrisi değişmiş"
);

for (const [width, height, surface, compact] of expected) {
  const result = layout.resolveCadResponsiveLayout(width);
  assert.equal(result.surface, surface, `${width}x${height}: yanlış responsive yüzey`);
  assert.equal(result.compactDesktop, compact, `${width}x${height}: compact desktop yanlış`);
  assert.ok(result.minTouchTargetPx >= 44, `${width}x${height}: touch target < 44px`);
  const usableCanvasHeight = height - result.reservedTopChromePx - result.overlayBottomChromePx;
  assert.ok(usableCanvasHeight >= height * 0.75, `${width}x${height}: canvas alanı anlamsız derecede küçülüyor`);
}

assert.equal(layout.clampCadFloatingMenuCoordinate(-50, 375, 64, 8), 72);
assert.equal(layout.clampCadFloatingMenuCoordinate(900, 375, 64, 8), 303);
assert.equal(layout.clampCadFloatingMenuCoordinate(180, 375, 64, 8), 180);

for (const token of [
  'data-cad-responsive-surface="desktop-ribbon"',
  "min-[1100px]:block",
  "<CadDesktopStudioRibbon",
  "<CadResponsiveRibbon",
]) {
  assert.ok(wrapper.includes(token), `Desktop wrapper contract eksik: ${token}`);
}

for (const token of [
  'data-testid="cad-tablet-ribbon"',
  'data-cad-responsive-surface="tablet-ribbon"',
  'data-testid="cad-mobile-dock"',
  'data-cad-responsive-surface="mobile-dock"',
  "md:flex min-[1100px]:hidden",
  "md:hidden",
  "absolute bottom-2",
]) {
  assert.ok(responsive.includes(token), `Responsive ribbon contract eksik: ${token}`);
}

for (const id of [
  "cad-tablet-tool-select",
  "cad-tablet-tool-pan",
  "cad-tablet-tool-fit",
  "cad-tablet-tool-distance",
  "cad-tablet-tool-area",
  "cad-tablet-tool-stroke",
  "cad-tablet-tool-layers",
  "cad-mobile-tool-select",
  "cad-mobile-tool-pan",
  "cad-mobile-tool-distance",
  "cad-mobile-tool-area",
  "cad-mobile-tool-stroke",
]) {
  assert.ok(responsive.includes(`data-testid="${id}"`), `Kritik responsive kontrol eksik: ${id}`);
}

for (const handlerToken of [
  'onClick={() => onSelectTool("select")}',
  "onClick={onPan}",
  "onClick={onStartDistance}",
  "onClick={onStartArea}",
  'onClick={() => onSelectTool("stroke")}',
  "onClick={onToggleLayerPanel}",
  "onClick={onFitView}",
]) {
  assert.ok(responsive.includes(handlerToken), `Sabit responsive kontrol gerçek handler'a bağlı değil: ${handlerToken}`);
}

for (const token of [
  "Daha Fazla",
  "onSelect={onToggleLayerPanel}",
  "onSelect={onToggleSnapPanel}",
  'onSelect={() => onTogglePanelTab("search")}',
  'onSelect={() => onTogglePanelTab("comments")}',
  "onSelect={reviewDxfAction}",
  "onSelect={onDownloadOriginal}",
  "onSelect={onOpenExportDialog}",
  "<CadUnitControl",
  "<CadColorControl",
  "<CadMarkupStyleMenu",
]) {
  assert.ok(overflow.includes(token), `Overflow gerçek işlev contract'ı eksik: ${token}`);
}

for (const legacyId of [
  "cad-tool-select",
  "cad-tool-pan",
  "cad-tool-distance",
  "cad-tool-area",
  "cad-tool-stroke",
  "cad-tool-layers",
  "cad-tool-download-dropdown",
  "cad-save-status",
]) {
  assert.ok(
    desktop.includes(`data-testid="${legacyId}"`) || desktop.includes(`testId="${legacyId}"`),
    `Stage 1-6 masaüstü test ID kaybolmuş: ${legacyId}`
  );
}

assert.ok(responsive.includes("size-11 min-h-11 min-w-11"), "Mobil dock 44x44 touch target taşımıyor");
assert.ok(overflow.includes("min-h-11"), "Overflow touch hedefleri 44px değil");
assert.ok(button.includes("[@media(pointer:coarse)]:h-11"));
assert.ok(button.includes("[@media(pointer:coarse)]:min-w-11"));
assert.ok(button.includes("[@media(min-width:1100px)_and_(max-width:1439px)]:h-8"));
assert.ok(group.includes("[@media(min-width:1100px)_and_(max-width:1439px)]:h-10"));

for (const token of [
  "max-h-[calc(100dvh_-_16px)]",
  "max-w-[calc(100vw_-_16px)]",
  "overflow-y-auto",
  "collisionPadding={8}",
  "avoidCollisions",
]) {
  assert.ok(popover.includes(token), `Popover viewport koruması eksik: ${token}`);
}

for (const token of [
  "max-h-[calc(100dvh_-_16px)]",
  "overflow-y-auto",
  "overscroll-contain",
  "h-11 w-11",
]) {
  assert.ok(exportDialog.includes(token), `Export dialog mobil viewport koruması eksik: ${token}`);
}

assert.ok(area.includes('data-testid="cad-area-result-text"'), "Alan sonucu okunabilirlik hook'u eksik");
assert.ok(area.includes("Alan: {areaLabel}"), "Alan sonucu kaybolmuş");
assert.ok(area.includes('unit === "m2" ? "m²"'), "m² gösterimi kaybolmuş");
assert.ok(area.includes("clamp(72px"), "Alan birim popup yatay viewport clamp eksik");
assert.ok(area.includes("calc(100% - 160px)"), "Alan birim popup dikey viewport clamp eksik");
assert.ok(area.includes('data-cad-viewport-clamped="true"'), "Alan popup clamp contract eksik");
assert.ok(area.includes("min-h-11 w-full"), "Alan birim seçenekleri 44px touch target taşımıyor");
assert.ok(area.includes("left-2 right-2 top-2"), "Mobil alan durum etiketi viewport genişliğine uyarlanmıyor");

assert.ok(responsive.includes("absolute bottom-2"), "Mobil dock canvas yüksekliğini reflow ile küçültmemeli");
assert.ok(!responsive.includes("overflow-x-auto"), "Tablet/mobil araç yüzeyi yatay scroll'a dayanıyor");

console.log("CAD Stage 7 responsive contract: PASS (6/6 viewport matrix)");
