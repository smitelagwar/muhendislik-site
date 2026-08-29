import { readFileSync, writeFileSync } from "node:fs";

const path = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
let source = readFileSync(path, "utf8");

if (!source.includes("enforceCadMouseBindings(): void")) {
  throw new Error(
    "Stage 9 final merge lost main's enforceCadMouseBindings implementation."
  );
}

const before = `  private restorePanMode(): void {\n    if (!this.manager.curView) return;\n    this.manager.curView.mode = this.Viewer.AcEdViewMode.PAN;\n    this.manager.curView.selectionSet?.clear();\n  }`;
const after = `  private restorePanMode(): void {\n    if (!this.manager.curView) return;\n    this.manager.curView.mode = this.Viewer.AcEdViewMode.PAN;\n    this.manager.curView.selectionSet?.clear();\n    // PAN mode changes upstream OrbitControls mouse mappings. Restore the\n    // desktop read-only contract afterwards without touching touch gestures.\n    this.enforceCadMouseBindings();\n  }`;

if (source.includes(before)) {
  source = source.replace(before, after);
} else if (!source.includes(after)) {
  throw new Error("Stage 9 restorePanMode repair anchor is missing.");
}

writeFileSync(path, source, "utf8");
console.log(
  "Stage 9 desktop mouse binding repair applied/idempotent; touch bindings remain upstream-controlled."
);
