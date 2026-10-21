import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { CAD_V2_COMPILER_REVISION, CAD_V2_PIPELINE_REVISION, CAD_V2_RENDER_ABI } from "../../src/lib/cad-v2/version";

type Fixture = { id: string; relativePath: string; format: "DWG" | "DXF"; magic: string; sizeBytes: number; sha256: string };

function countBy<T>(values: T[], getKey: (value: T) => string) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = getKey(value) || "<unknown>";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  const sourceId = process.argv[2];
  if (!sourceId) throw new Error("Usage: tsx scripts/cad-v2/run-l06-browser-census.ts <R001|R002|R003|R004>");
  const repoRoot = process.cwd();
  const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "tests/cad-v2/fixtures-manifest.json"), "utf8")) as { realCorpus: Fixture[] };
  const fixture = manifest.realCorpus.find((item) => item.id === sourceId);
  if (!fixture) throw new Error(`Unknown corpus fixture: ${sourceId}`);
  const sourcePath = path.resolve(repoRoot, fixture.relativePath);
  const bytes = fs.readFileSync(sourcePath);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== fixture.sizeBytes || sha256 !== fixture.sha256) {
    throw new Error(`${sourceId} source identity differs from fixtures-manifest.json`);
  }
  const parseStartedAt = performance.now();
  const canonical = fixture.format === "DXF"
    ? await parseDxfToCanonical(bytes, { sourceVersionKey: `l06_${sourceId}`, sourceSha256: sha256 })
    : await parseDwgToCanonical(bytes, { sourceVersionKey: `l06_${sourceId}`, sourceSha256: sha256 });
  const parseMs = Number((performance.now() - parseStartedAt).toFixed(1));
  const compileStartedAt = performance.now();
  const compiled = compileCanonicalToScene(canonical, { sceneId: `l06_${sourceId.toLowerCase()}_browser_census` });
  const compileMs = Number((performance.now() - compileStartedAt).toFixed(1));

  const byLayout: Record<string, Record<string, number>> = {
    Model: countBy(canonical.modelSpaceEntities, (entity) => entity.type),
  };
  for (const [layoutId, entities] of Object.entries(canonical.paperSpaceEntities ?? {})) {
    byLayout[layoutId] = countBy(entities, (entity) => entity.type);
  }
  const allDiagnostics = canonical.diagnostics ?? [];
  const resourceDiagnostics = allDiagnostics.filter((diagnostic) => /FONT|RESOURCE|DEPENDENCY|XREF|IMAGE|SHAPE/i.test(diagnostic.code));
  const output = {
    schemaVersion: 1,
    evidenceKind: "candidate browser/compiler census; not an AutoCAD oracle",
    source: {
      id: fixture.id,
      path: fixture.relativePath,
      format: fixture.format,
      magic: bytes.subarray(0, 6).toString("ascii"),
      bytes: bytes.byteLength,
      sha256,
    },
    candidate: {
      compilerVersion: CAD_V2_COMPILER_REVISION,
      pipelineVersion: CAD_V2_PIPELINE_REVISION,
      renderAbi: CAD_V2_RENDER_ABI,
    },
    runtime: { parseMs, compileMs },
    canonical: {
      acadVersion: canonical.acadVersion,
      codepage: canonical.codepage,
      units: canonical.units,
      measurement: canonical.measurement,
      modelEntityCount: canonical.modelSpaceEntities.length,
      entityCountsByLayout: byLayout,
      layerCount: Object.keys(canonical.layers).length,
      blockDefinitionCount: Object.keys(canonical.blocks).length,
      textStyles: Object.values(canonical.textStyles).map((style) => ({
        name: style.name,
        fontFileName: style.fontFileName,
        bigFontFileName: style.bigFontFileName ?? null,
        isShapeFile: Boolean(style.isShapeFile),
      })),
      layouts: Object.values(canonical.layouts).map((layout) => ({
        id: layout.id,
        name: layout.name,
        isModelSpace: layout.isModelSpace,
        bbox: layout.bbox,
        viewportIds: layout.viewportIds,
      })),
      viewports: Object.values(canonical.viewports).map((viewport) => ({
        id: viewport.id,
        layoutId: viewport.layoutId,
        center: viewport.center,
        width: viewport.width,
        height: viewport.height,
        viewCenter: viewport.viewCenter,
        viewHeight: viewport.viewHeight,
        perspective: Boolean(viewport.perspective),
        frozenLayerCount: viewport.frozenLayers.length,
        clipPolygonPointCount: viewport.clipPolygon?.length ?? 0,
      })),
      diagnosticCountsBySeverityAndCode: countBy(allDiagnostics, (diagnostic) => `${diagnostic.severity}:${diagnostic.code}`),
      resourceWarnings: countBy(resourceDiagnostics, (diagnostic) => `${diagnostic.severity}:${diagnostic.code}`),
    },
    compiled: {
      schemaVersion: compiled.manifest.schemaVersion,
      renderAbi: compiled.manifest.renderAbi,
      qualityStatus: compiled.manifest.qualityStatus,
      diagnosticsSummary: compiled.manifest.diagnosticsSummary,
      layouts: compiled.manifest.layouts,
      chunkCount: compiled.manifest.chunks.length,
      maximumChunkBytes: Math.max(...compiled.manifest.chunks.map((chunk) => chunk.byteLength)),
      totalChunkBytes: compiled.manifest.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0),
    },
    nativeOracle: { status: "NOT_RUN", reason: "AutoCAD LT GUI oracle is gated by acadlt.exe Authenticode HashMismatch; exact FAIL-404 source is also absent." },
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
