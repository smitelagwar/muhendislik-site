#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const files = {
  button: "src/components/dokumantasyon/preview/cad-ribbon/cad-ribbon-button.tsx",
  split: "src/components/dokumantasyon/preview/cad-ribbon/cad-split-tool-button.tsx",
  popover: "src/components/dokumantasyon/preview/cad-ribbon/cad-tool-popover.tsx",
  shortcuts: "src/components/dokumantasyon/preview/cad-review-shortcuts.ts",
  color: "src/components/dokumantasyon/preview/cad-ribbon/cad-color-control.tsx",
  lineWidth: "src/components/dokumantasyon/preview/cad-ribbon/cad-line-width-control.tsx",
  lineStyle: "src/components/dokumantasyon/preview/cad-ribbon/cad-line-style-control.tsx",
  unit: "src/components/dokumantasyon/preview/cad-ribbon/cad-unit-control.tsx",
  snap: "src/components/dokumantasyon/preview/cad-snap-settings-panel.tsx",
  desktop: "src/components/dokumantasyon/preview/cad-studio-ribbon-desktop.tsx",
  wrapper: "src/components/dokumantasyon/preview/cad-studio-ribbon.tsx",
  recovery: "src/components/dokumantasyon/preview/cad-blank-canvas-recovery.tsx",
  freehand: "src/lib/dokumantasyon/cad-review/freehand-controller.ts",
  viewer: "src/components/dokumantasyon/preview/cad-upstream-viewer.tsx",
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const checks = [];
const check = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail });
const hasAll = (text, needles) => needles.every((needle) => text.includes(needle));

check(
  "Ribbon arrow/Home/End keyboard navigation",
  hasAll(source.button, ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", 'key === "Home"', 'key === "End"', 'closest<HTMLElement>(\'[role="toolbar"]\')'])
);
check(
  "Ribbon navigation only targets enabled shared buttons",
  source.button.includes('[data-cad-ribbon-button="true"]:not([disabled])') && source.button.includes("button.offsetParent !== null")
);
check(
  "Split tool exposes separate accessible controls",
  source.split.includes('role="group"') && (source.split.match(/<CadRibbonButton/g) ?? []).length >= 2 && source.split.includes("data-cad-split-caret") && source.split.includes("ayarlarını aç")
);
check(
  "Popover scopes CAD shortcuts locally",
  hasAll(source.popover, ['data-cad-shortcut-scope="local"', "shouldContainCadShortcut", "onEscapeKeyDown", "event.stopPropagation()"])
);
check(
  "Global shortcuts respect local UI and defaultPrevented",
  hasAll(source.shortcuts, ["e.defaultPrevented", "isCadShortcutLocalScope", "isCadDeleteProtectedTarget", "onFit?:", "onPan?:"])
);
check(
  "Delete/Backspace protects interactive UI",
  source.shortcuts.includes('button, a[href]') && source.shortcuts.includes('role="menuitem"') && source.shortcuts.includes("e.preventDefault();\n      handlers.onDelete?.()")
);
check(
  "Undo/redo/search keyboard contracts preserved",
  hasAll(source.shortcuts, ['key === "z"', 'key === "y"', 'e.key === "/"', "handlers.onUndo", "handlers.onRedo", "handlers.onSearch"])
);
check(
  "Color selector uses named RadioGroup semantics",
  hasAll(source.color, ['role="radiogroup"', 'role="radio"', "aria-checked={selected}", "color.name", "color.hex"])
);
check(
  "Line width selector uses RadioGroup semantics",
  hasAll(source.lineWidth, ['role="radiogroup"', 'role="radio"', "aria-checked={value === option.value}"])
);
check(
  "Line style selector uses RadioGroup semantics",
  hasAll(source.lineStyle, ['role="radiogroup"', 'role="radio"', "aria-checked={value === option.value}"])
);
check(
  "Unit selectors use RadioGroup semantics",
  (source.unit.match(/role="radiogroup"/g) ?? []).length >= 4 && (source.unit.match(/role="radio"/g) ?? []).length >= 4 && source.unit.includes("aria-checked")
);
check(
  "Snap modes keep checkbox semantics",
  hasAll(source.snap, ['role="switch"', 'role="checkbox"', "aria-checked={active}", "aria-checked={settings.enabled}"])
);
check(
  "Save status has text and accessible label",
  hasAll(source.desktop, ["cad-save-status", "aria-label=", "Kaydediliyor", "Kaydedildi"])
);
check(
  "Freehand preserves coalesced samples, max points and RDP",
  hasAll(source.freehand, ["getCoalescedEvents", "maxPoints = 5000", "simplifyPointsRdp", "filterClosePoints"])
);
check(
  "Freehand draft rendering is RAF-batched",
  hasAll(source.freehand, ["requestAnimationFrame", "cancelAnimationFrame", "scheduleDraftRefresh", "draftFrameId"])
);
check(
  "Blank-canvas recovery uses real readiness diagnostics",
  hasAll(source.recovery, ["getRenderReadinessSnapshot", "entityCount", "hasFiniteBounds", "snapshot.viewport", "cameraValid", "webglContextLost"])
);
check(
  "Blank-canvas recovery checks hidden layers",
  hasAll(source.recovery, ["getLayers", "allLayersHidden", "showAllLayers"])
);
check(
  "Blank-canvas recovery exposes required CTA",
  hasAll(source.recovery, ["Çizim yüklendi ancak görünüm dışında olabilir.", "Ekrana Sığdır", 'role="status"', 'aria-live="polite"'])
);
check(
  "Responsive/desktop wrapper mounts recovery without touching renderer",
  hasAll(source.wrapper, ["CadDesktopStudioRibbon", "CadResponsiveRibbon", "CadBlankCanvasRecovery", "props.onFitView"])
);

const startupDependencyContract = /\}, \[\s*accessUrl,\s*displayName,\s*effectiveTimeoutMs,\s*extension,\s*fileId,\s*retryKey,\s*onReady,\s*onViewerFailure,\s*\]\);/m;
check(
  "Renderer startup effect is isolated from menu/style/unit UI state",
  startupDependencyContract.test(source.viewer) && !/retryKey,[\s\S]{0,160}(markupStyle|measurementUnitSettings|activePanelTab|layerPanelOpen|snapPanelOpen|exportDialogOpen)/m.test(source.viewer)
);
check(
  "Existing T/A/P/F canvas shortcuts remain wired",
  hasAll(source.viewer, ['event.key === "t"', 'event.key === "a"', 'event.key === "p"', 'event.key === "f"', "zoomToFit"])
);

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.name}${item.detail ? ` — ${item.detail}` : ""}`);
}
console.log(`\nStage 8 gate: ${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length > 0) process.exit(1);
