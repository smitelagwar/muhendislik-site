import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const ribbonDir = path.join(ROOT, "src/components/dokumantasyon/preview/cad-ribbon");
const ribbonFile = path.join(ROOT, "src/components/dokumantasyon/preview/cad-studio-ribbon.tsx");

function read(relative: string) {
  return fs.readFileSync(path.join(ribbonDir, relative), "utf8");
}

test.describe("CAD Stage 2 — Ribbon temel bileşenleri ve görsel sistem", () => {
  test("ortak ribbon bileşenleri ayrı dosyalarda bulunur", () => {
    for (const file of [
      "cad-ribbon-group.tsx",
      "cad-ribbon-button.tsx",
      "cad-split-tool-button.tsx",
      "cad-tool-popover.tsx",
      "cad-color-control.tsx",
      "cad-line-width-control.tsx",
      "cad-line-style-control.tsx",
      "cad-unit-control.tsx",
      "cad-ribbon-overflow.tsx",
      "icons/line-weight-icon.tsx",
      "icons/area-icon.tsx",
    ]) {
      expect(fs.existsSync(path.join(ribbonDir, file)), file).toBe(true);
    }
  });

  test("cad-studio-ribbon orkestratör kalır ve doğrudan Button/Trigger altyapısını çoğaltmaz", () => {
    const source = fs.readFileSync(ribbonFile, "utf8");
    const lineCount = source.split(/\r?\n/).length;

    expect(lineCount).toBeLessThan(700);
    expect(source).toContain('from "./cad-ribbon"');
    expect(source).not.toContain('from "@/components/ui/button"');
    expect(source).not.toContain("DropdownMenuTrigger");
    expect(source).not.toContain("DropdownMenuContent");
  });

  test("desktop ölçü standardı ve tek active-state dili merkezidir", () => {
    const button = read("cad-ribbon-button.tsx");
    const group = read("cad-ribbon-group.tsx");
    const split = read("cad-split-tool-button.tsx");
    const source = fs.readFileSync(ribbonFile, "utf8");

    expect(button).toContain('"relative inline-flex h-9 min-h-9');
    expect(button).toContain('iconOnly ? "w-9 px-0"');
    expect(group).toContain('"flex h-11');
    expect(split).toContain('"min-w-6 w-6');
    expect(split).toContain('data-cad-split-caret="true"');

    expect(button).toContain("CAD_RIBBON_BUTTON_ACTIVE");
    expect(source).not.toContain("bg-blue-600");
    expect(source).not.toContain("bg-amber-600");
    expect(source).not.toContain("bg-rose-600");
    expect(source).toContain('className="relative z-20 flex h-14');
  });

  test("split main/caret bağımsız test contract'ını korur", () => {
    const split = read("cad-split-tool-button.tsx");
    const source = fs.readFileSync(ribbonFile, "utf8");

    expect(split).toContain("onClick={onActivate}");
    expect(split).toContain("data-cad-split-caret");
    expect(split).toContain("menuTestId");

    for (const id of [
      "cad-tool-pin-style-trigger",
      "cad-tool-stroke-style-trigger",
      "cad-tool-shapes-dropdown",
      "cad-tool-callout-style-trigger",
      "cad-tool-text-style-trigger",
    ]) {
      expect(source).toContain(`menuTestId="${id}"`);
    }
  });

  test("popover collision, focus dönüşü ve ghost-click koruması Radix modal menüyle merkezileşir", () => {
    const popover = read("cad-tool-popover.tsx");

    expect(popover).toContain("modal>");
    expect(popover).toContain("collisionPadding={12}");
    expect(popover).toContain("avoidCollisions");
    expect(popover).toContain('sticky="partial"');
    expect(popover).toContain("onPointerDownOutside");
    expect(popover).toContain("originalEvent.preventDefault()");
    expect(popover).toContain("originalEvent.stopPropagation()");
    expect(popover).toContain('"z-[80]');
  });

  test("tooltip hover + keyboard focus ve görünür focus ring standardı vardır", () => {
    const button = read("cad-ribbon-button.tsx");

    expect(button).toContain('role="tooltip"');
    expect(button).toContain("group-hover/cad-tooltip:opacity-100");
    expect(button).toContain("group-focus-within/cad-tooltip:opacity-100");
    expect(button).toContain("focus-visible:ring-2");
    expect(button).toContain("focus-visible:border-ring");
  });
});
