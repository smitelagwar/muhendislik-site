import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
const viewerPath = "src/components/dokumantasyon/preview/cad-upstream-viewer.tsx";

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Stage 9 repair anchor missing: ${label}`);
  }
  return source.replace(needle, replacement);
}

let adapter = readFileSync(adapterPath, "utf8");

// Stage 9 release safety: keep MLightCAD parser/render prototypes native.
// The post-Stage-8 enhancement bundle monkey-patches DXF entity parsing, font
// loading and hatch materials. In production-mode Chromium this can leave
// manager.openDocument() permanently inside parse-convert. Stage 8's proven
// adapter path did not require those global mutations. Preserve only the
// measurement display flags; all CAD Preview V2 + review gates below remain the
// release authority for compatibility and visual regressions.
const enhancementStart =
  "async function initializeCadEngineEnhancements(Viewer: CadSimpleViewerModule): Promise<void> {\n";
const normalizeStart = "function normalizeExtension(extension: string): string {\n";
const enhancementIndex = adapter.indexOf(enhancementStart);
if (enhancementIndex !== -1) {
  const normalizeIndex = adapter.indexOf(normalizeStart, enhancementIndex);
  if (normalizeIndex === -1) {
    throw new Error("Stage 9 repair anchor missing: normalizeExtension after enhancements");
  }
  const safeEnhancement =
    "async function initializeCadEngineEnhancements(Viewer: CadSimpleViewerModule): Promise<void> {\n" +
    "  if (engineEnhancementsInitialized) return;\n" +
    "  engineEnhancementsInitialized = true;\n\n" +
    "  if (Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS) {\n" +
    "    Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS.showUnits = false;\n" +
    "    Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS.showApproximate = false;\n" +
    "  }\n" +
    "}\n\n";
  adapter = adapter.slice(0, enhancementIndex) + safeEnhancement + adapter.slice(normalizeIndex);
}

if (!adapter.includes('export type CadBackgroundColorOption = "autocad" | "black" | "white";')) {
  adapter = replaceRequired(
    adapter,
    'export type CadUpstreamDisplayMode = "source" | "monochrome";\n',
    'export type CadUpstreamDisplayMode = "source" | "monochrome";\n\n' +
      'export type CadBackgroundColorOption = "autocad" | "black" | "white";\n\n' +
      'export const CAD_BACKGROUND_COLORS: Record<\n' +
      '  CadBackgroundColorOption,\n' +
      '  { hex: string; numeric: number; label: string }\n' +
      '> = {\n' +
      '  autocad: { hex: "#212830", numeric: 0x212830, label: "AutoCAD" },\n' +
      '  black: { hex: "#000000", numeric: 0x000000, label: "Siyah" },\n' +
      '  white: { hex: "#ffffff", numeric: 0xffffff, label: "Beyaz" },\n' +
      '};\n',
    "adapter background color types"
  );
}

if (!adapter.includes('private backgroundColorOption: CadBackgroundColorOption = "autocad";')) {
  adapter = replaceRequired(
    adapter,
    '  private displayTheme: CadUpstreamTheme = "dark";\n',
    '  private displayTheme: CadUpstreamTheme = "dark";\n' +
      '  private backgroundColorOption: CadBackgroundColorOption = "autocad";\n',
    "adapter background color field"
  );
}

if (!adapter.includes("private container: HTMLElement | null = null;")) {
  adapter = replaceRequired(
    adapter,
    "  private lineWeightVisible = false;\n",
    "  private lineWeightVisible = false;\n  private container: HTMLElement | null = null;\n",
    "adapter container field"
  );
}

if (!adapter.includes("adapter.container = options.container;")) {
  adapter = replaceRequired(
    adapter,
    '    adapter.displayTheme = options.theme ?? "dark";\n    return adapter;\n',
    '    adapter.displayTheme = options.theme ?? "dark";\n' +
      '    adapter.container = options.container;\n' +
      '    options.container.style.backgroundColor = CAD_BACKGROUND_COLORS.autocad.hex;\n' +
      '    (options.container as unknown as { __cadAdapter?: CadUpstreamAdapter }).__cadAdapter = adapter;\n' +
      '    if (options.container.parentElement) {\n' +
      '      (options.container.parentElement as unknown as { __cadAdapter?: CadUpstreamAdapter }).__cadAdapter = adapter;\n' +
      '    }\n' +
      '    return adapter;\n',
    "adapter container assignment"
  );
}

if (!adapter.includes("getBackgroundColor(): CadBackgroundColorOption")) {
  adapter = replaceRequired(
    adapter,
    '  projectWorldPoint(point: CadSnapPoint): CadSnapPoint | null {\n',
    '  getBackgroundColor(): CadBackgroundColorOption {\n' +
      '    return this.backgroundColorOption;\n' +
      '  }\n\n' +
      '  setBackgroundColor(option: CadBackgroundColorOption): void {\n' +
      '    if (this.destroyed) return;\n' +
      '    this.backgroundColorOption = option;\n' +
      '    const config = CAD_BACKGROUND_COLORS[option] ?? CAD_BACKGROUND_COLORS.autocad;\n\n' +
      '    if (this.container) {\n' +
      '      this.container.style.backgroundColor = config.hex;\n' +
      '    }\n\n' +
      '    const curView = this.manager.curView as unknown as {\n' +
      '      applyCanvasBackground?: (color: number) => void;\n' +
      '      isDirty?: boolean;\n' +
      '    } | undefined;\n\n' +
      '    if (curView && typeof curView.applyCanvasBackground === "function") {\n' +
      '      curView.applyCanvasBackground(config.numeric);\n' +
      '      curView.isDirty = true;\n' +
      '    }\n' +
      '  }\n\n' +
      '  isMeasurementUnitsEnabled(): boolean {\n' +
      '    return Boolean(this.Viewer.MEASUREMENT_LENGTH_FORMAT_OPTIONS?.showUnits);\n' +
      '  }\n\n' +
      '  projectWorldPoint(point: CadSnapPoint): CadSnapPoint | null {\n',
    "adapter background methods"
  );
}

if (!adapter.includes("this.configureMobileGestureGuard();\n    this.setBackgroundColor(this.backgroundColorOption);")) {
  adapter = replaceRequired(
    adapter,
    "    this.configureMobileGestureGuard();\n    this.applyDisplayMode();\n",
    "    this.configureMobileGestureGuard();\n    this.setBackgroundColor(this.backgroundColorOption);\n    this.applyDisplayMode();\n",
    "adapter open background application"
  );
}

writeFileSync(adapterPath, adapter, "utf8");

let viewer = readFileSync(viewerPath, "utf8");

if (!viewer.includes("type CadBackgroundColorOption")) {
  viewer = replaceRequired(
    viewer,
    "  CadUpstreamAdapter,\n  CadUpstreamAdapterError,\n",
    "  CadUpstreamAdapter,\n  CadUpstreamAdapterError,\n  CAD_BACKGROUND_COLORS,\n  type CadBackgroundColorOption,\n",
    "viewer background imports"
  );
}

if (!viewer.includes('const backgroundColorRef = useRef<CadBackgroundColorOption>("autocad");')) {
  viewer = replaceRequired(
    viewer,
    "  const lineWeightVisibleRef = useRef(false);\n",
    '  const lineWeightVisibleRef = useRef(false);\n  const backgroundColorRef = useRef<CadBackgroundColorOption>("autocad");\n',
    "viewer background ref"
  );
}

if (!viewer.includes('useState<CadBackgroundColorOption>("autocad")')) {
  viewer = replaceRequired(
    viewer,
    "  const [lineWeightVisible, setLineWeightVisible] = useState(false);\n",
    '  const [lineWeightVisible, setLineWeightVisible] = useState(false);\n' +
      '  const [backgroundColor, setBackgroundColor] =\n' +
      '    useState<CadBackgroundColorOption>("autocad");\n',
    "viewer background state"
  );
}

if (!viewer.includes("const selectBackgroundColor = (color: CadBackgroundColorOption)")) {
  viewer = replaceRequired(
    viewer,
    "  const handleSnapSettingsChange = (next: CadSnapSettings) => {\n",
    '  const selectBackgroundColor = (color: CadBackgroundColorOption) => {\n' +
      '    backgroundColorRef.current = color;\n' +
      '    setBackgroundColor(color);\n' +
      '    adapterRef.current?.setBackgroundColor(color);\n' +
      '  };\n\n' +
      '  const handleSnapSettingsChange = (next: CadSnapSettings) => {\n',
    "viewer background handler"
  );
}

if (!viewer.includes("backgroundColor={backgroundColor}")) {
  viewer = replaceRequired(
    viewer,
    "        lineWeightVisible={lineWeightVisible}\n        onSelectDisplayMode={selectDisplayMode}\n        onToggleLineWeight={() => void toggleLineWeight()}\n",
    "        lineWeightVisible={lineWeightVisible}\n" +
      "        backgroundColor={backgroundColor}\n" +
      "        onSelectDisplayMode={selectDisplayMode}\n" +
      "        onToggleLineWeight={() => void toggleLineWeight()}\n" +
      "        onSelectBackgroundColor={selectBackgroundColor}\n",
    "viewer display control props"
  );
}

writeFileSync(viewerPath, viewer, "utf8");
console.log("Stage 9 merge repair applied/idempotent.");
