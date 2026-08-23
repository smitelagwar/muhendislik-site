import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(root, "node_modules", "dxf-viewer");
const packageJsonPath = path.join(packageRoot, "package.json");
const MARKER = "MUHENDISLIK_DXF_STAGE1";

if (!fs.existsSync(packageJsonPath)) {
  throw new Error("dxf-viewer paketi bulunamadı; npm install tamamlandıktan sonra patch çalıştırılmalıdır.");
}

const dependencyPackage = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
if (dependencyPackage.version !== "1.0.48") {
  throw new Error(`DXF Stage 1 patch yalnız dxf-viewer 1.0.48 için doğrulandı; bulunan sürüm: ${dependencyPackage.version}`);
}

function patchFile(relativePath, operations) {
  const filePath = path.join(packageRoot, relativePath);
  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes(MARKER)) return false;

  for (const operation of operations) {
    const { find, replace, label } = operation;
    if (!source.includes(find)) {
      throw new Error(`${relativePath}: '${label}' patch noktası bulunamadı.`);
    }
    source = source.replace(find, replace);
  }

  source = `// ${MARKER}: source color + lineweight semantics + coincident-geometry preservation\n${source}`;
  fs.writeFileSync(filePath, source, "utf8");
  return true;
}

let changed = 0;

changed += Number(patchFile("src/parser/DxfParser.js", [
  {
    label: "layer lineweight parser",
    find: `                case 420: // TrueColor Color\n                    layer.color = curr.value;\n                    curr = scanner.next();\n                    break;`,
    replace: `                case 370: // lineweight: 1/100 mm; -3 DEFAULT, -2 BYLAYER, -1 BYBLOCK\n                    layer.lineweight = curr.value;\n                    curr = scanner.next();\n                    break;\n                case 420: // TrueColor Color\n                    layer.color = curr.value;\n                    curr = scanner.next();\n                    break;`
  }
]));

changed += Number(patchFile("src/BatchingKey.js", [
  {
    label: "batch key constructor",
    find: `    constructor(layerName, blockName, geometryType, color, lineType) {\n        this.layerName = layerName ?? null\n        this.blockName = blockName ?? null\n        this.geometryType = geometryType ?? null\n        this.color = color\n        this.lineType = lineType ?? null\n    }`,
    replace: `    constructor(layerName, blockName, geometryType, color, lineType, lineweight = 0) {\n        this.layerName = layerName ?? null\n        this.blockName = blockName ?? null\n        this.geometryType = geometryType ?? null\n        this.color = color\n        this.lineType = lineType ?? null\n        this.lineweight = lineweight ?? 0\n    }`
  },
  {
    label: "batch key comparator",
    find: `        return CompareValues(this.lineType, other.lineType)`,
    replace: `        c = CompareValues(this.lineType, other.lineType)\n        if (c !== 0) {\n            return c\n        }\n        return CompareValues(this.lineweight, other.lineweight)`
  }
]));

changed += Number(patchFile("src/MaterialKey.js", [
  {
    label: "material key constructor",
    find: `    constructor(instanceType, geometryType, color, lineType) {\n        this.instanceType = instanceType\n        this.geometryType = geometryType ?? null\n        this.color = color\n        this.lineType = lineType ?? null\n    }`,
    replace: `    constructor(instanceType, geometryType, color, lineType, lineweight = 0) {\n        this.instanceType = instanceType\n        this.geometryType = geometryType ?? null\n        this.color = color\n        this.lineType = lineType ?? null\n        this.lineweight = lineweight ?? 0\n    }`
  },
  {
    label: "material key comparator",
    find: `        return CompareValues(this.lineType, other.lineType)`,
    replace: `        c = CompareValues(this.lineType, other.lineType)\n        if (c !== 0) {\n            return c\n        }\n        return CompareValues(this.lineweight, other.lineweight)`
  }
]));

changed += Number(patchFile("src/DxfScene.js", [
  {
    label: "default lineweight",
    find: `        this.isMetric = (this.vars.get("MEASUREMENT") ?? 1) == 1\n\n        if(dxf.tables && dxf.tables.layer) {`,
    replace: `        this.isMetric = (this.vars.get("MEASUREMENT") ?? 1) == 1\n        const rawDefaultLineweight = Number(this.vars.get("LWDEFAULT") ?? 25)\n        this.defaultLineweight = Number.isFinite(rawDefaultLineweight) && rawDefaultLineweight >= 0 ?\n            rawDefaultLineweight : 25\n\n        if(dxf.tables && dxf.tables.layer) {`
  },
  {
    label: "layer lineweight normalization",
    find: `                layer.displayName = ParseSpecialChars(layer.name)\n                this.layers.set(layer.name, layer)`,
    replace: `                layer.displayName = ParseSpecialChars(layer.name)\n                layer.lineweight = this._ResolveLayerLineweight(layer)\n                this.layers.set(layer.name, layer)`
  },
  {
    label: "entity lineweight capture",
    find: `    _ProcessDxfEntity(entity, blockCtx = null) {\n        let renderEntities`,
    replace: `    _ProcessDxfEntity(entity, blockCtx = null) {\n        const sourceLineweight = this._GetEntityLineweight(entity, blockCtx)\n        let renderEntities`
  },
  {
    label: "render entity lineweight propagation",
    find: `        for (const renderEntity of renderEntities) {\n            this._ProcessEntity(renderEntity, blockCtx)\n        }`,
    replace: `        for (const renderEntity of renderEntities) {\n            if ((renderEntity.type === Entity.Type.LINE_SEGMENTS ||\n                 renderEntity.type === Entity.Type.POLYLINE) &&\n                (renderEntity.lineweight === null || renderEntity.lineweight === undefined)) {\n                renderEntity.lineweight = sourceLineweight\n            }\n            this._ProcessEntity(renderEntity, blockCtx)\n        }`
  },
  {
    label: "line segment batch lineweight",
    find: `        const key = new BatchingKey(entity.layer, blockCtx?.name,\n                                    BatchingKey.GeometryType.LINES, entity.color, entity.lineType)`,
    replace: `        const key = new BatchingKey(entity.layer, blockCtx?.name,\n                                    BatchingKey.GeometryType.LINES, entity.color, entity.lineType,\n                                    entity.lineweight)`
  },
  {
    label: "short polyline batch lineweight",
    find: `            const key = new BatchingKey(entity.layer, blockCtx?.name,\n                                        BatchingKey.GeometryType.LINES, entity.color,\n                                        entity.lineType)`,
    replace: `            const key = new BatchingKey(entity.layer, blockCtx?.name,\n                                        BatchingKey.GeometryType.LINES, entity.color,\n                                        entity.lineType, entity.lineweight)`
  },
  {
    label: "indexed polyline batch lineweight",
    find: `        const key = new BatchingKey(entity.layer, blockCtx?.name,\n                                    BatchingKey.GeometryType.INDEXED_LINES,\n                                    entity.color, entity.lineType)`,
    replace: `        const key = new BatchingKey(entity.layer, blockCtx?.name,\n                                    BatchingKey.GeometryType.INDEXED_LINES,\n                                    entity.color, entity.lineType, entity.lineweight)`
  },
  {
    label: "insert lineweight",
    find: `        const layer = this._GetEntityLayer(entity, null)\n        const color = this._GetEntityColor(entity, null)\n        const lineType = this._GetLineType(entity, null, null)\n        //XXX apply extrusion direction`,
    replace: `        const layer = this._GetEntityLayer(entity, null)\n        const color = this._GetEntityColor(entity, null)\n        const lineType = this._GetLineType(entity, null, null)\n        const lineweight = this._GetEntityLineweight(entity, null)\n        //XXX apply extrusion direction`
  },
  {
    label: "flatten insert lineweight argument",
    find: `                this._FlattenBatch(batch, layer, color, lineType, transform)`,
    replace: `                this._FlattenBatch(batch, layer, color, lineType, lineweight, transform)`
  },
  {
    label: "instanced block lineweight key",
    find: `            const key = new BatchingKey(layer, entity.name, BatchingKey.GeometryType.BLOCK_INSTANCE,\n                                        color, lineType)`,
    replace: `            const key = new BatchingKey(layer, entity.name, BatchingKey.GeometryType.BLOCK_INSTANCE,\n                                        color, lineType, lineweight)`
  },
  {
    label: "flatten signature and lineweight resolution",
    find: `    _FlattenBatch(blockBatch, layerName, blockColor, blockLineType, transform) {\n        /* INSERT layer (if specified) takes precedence over layer specified in block definition.\n         * Use layer from block definition only if no layer in INSERT.\n         */\n        layerName ??= blockBatch.key.layerName\n        const layer = layerName ? this.layers.get(layerName) : null\n        let color, lineType = 0\n        if (blockBatch.key.color === ColorCode.BY_BLOCK) {\n            color = blockColor\n        } else if (blockBatch.key.color === ColorCode.BY_LAYER) {\n            color = layer?.color ?? 0\n        } else {\n            color = blockBatch.key.color\n        }\n        //XXX line type\n        const key = new BatchingKey(layerName, null, blockBatch.key.geometryType, color, lineType)`,
    replace: `    _FlattenBatch(blockBatch, layerName, blockColor, blockLineType, blockLineweight, transform) {\n        /* INSERT layer (if specified) takes precedence over layer specified in block definition.\n         * Use layer from block definition only if no layer in INSERT.\n         */\n        layerName ??= blockBatch.key.layerName\n        const layer = layerName ? this.layers.get(layerName) : null\n        let color, lineType = 0\n        if (blockBatch.key.color === ColorCode.BY_BLOCK) {\n            color = blockColor\n        } else if (blockBatch.key.color === ColorCode.BY_LAYER) {\n            color = layer?.color ?? 0\n        } else {\n            color = blockBatch.key.color\n        }\n        let lineweight = blockBatch.key.lineweight\n        if (lineweight === LineweightCode.BY_BLOCK) {\n            lineweight = blockLineweight\n        } else if (lineweight === LineweightCode.BY_LAYER) {\n            lineweight = layer?.lineweight ?? this.defaultLineweight\n        } else if (lineweight === LineweightCode.DEFAULT || lineweight == null) {\n            lineweight = this.defaultLineweight\n        }\n        //XXX line type\n        const key = new BatchingKey(layerName, null, blockBatch.key.geometryType, color, lineType,\n                                    lineweight)`
  },
  {
    label: "lineweight resolver methods",
    find: `    /** @return {?string} Layer name, null for block entity. */\n    _GetEntityLayer(entity, blockCtx = null) {`,
    replace: `    _ResolveLayerLineweight(layer) {\n        const value = Number(layer?.lineweight)\n        return Number.isFinite(value) && value >= 0 ? value : this.defaultLineweight\n    }\n\n    _GetEntityLineweight(entity, blockCtx = null) {\n        let lineweight = Number(entity?.lineweight ?? LineweightCode.BY_LAYER)\n        if (!Number.isFinite(lineweight)) {\n            lineweight = LineweightCode.BY_LAYER\n        }\n\n        if (lineweight === LineweightCode.BY_BLOCK && blockCtx?.lineweight != null) {\n            return blockCtx.lineweight\n        }\n        if (lineweight === LineweightCode.BY_LAYER) {\n            if (entity?.hasOwnProperty("layer")) {\n                const layer = this.layers.get(entity.layer)\n                if (layer) return this._ResolveLayerLineweight(layer)\n            }\n            if (blockCtx) return LineweightCode.BY_LAYER\n            return this.defaultLineweight\n        }\n        if (lineweight === LineweightCode.BY_BLOCK) {\n            return blockCtx ? LineweightCode.BY_BLOCK : this.defaultLineweight\n        }\n        if (lineweight === LineweightCode.DEFAULT || lineweight < 0) {\n            return this.defaultLineweight\n        }\n        return lineweight\n    }\n\n    /** @return {?string} Layer name, null for block entity. */\n    _GetEntityLayer(entity, blockCtx = null) {`
  },
  {
    label: "nested block lineweight context",
    find: `            const nestedCtx = blockCtx.NestedBlockContext(block, entity)\n            if (block.data.entities) {`,
    replace: `            const nestedCtx = blockCtx.NestedBlockContext(block, entity)\n            nestedCtx.lineweight = this._GetEntityLineweight(entity, blockCtx)\n            if (block.data.entities) {`
  },
  {
    label: "scene default lineweight serialization",
    find: `            bounds: this.bounds,\n            hasMissingChars: this.hasMissingChars\n        }`,
    replace: `            bounds: this.bounds,\n            hasMissingChars: this.hasMissingChars,\n            defaultLineweight: this.defaultLineweight\n        }`
  },
  {
    label: "layer lineweight serialization",
    find: `                name: layer.name,\n                displayName: layer.displayName,\n                color: layer.color\n            })`,
    replace: `                name: layer.name,\n                displayName: layer.displayName,\n                color: layer.color,\n                lineweight: this._ResolveLayerLineweight(layer)\n            })`
  },
  {
    label: "entity lineweight property",
    find: `    constructor({type, vertices, indices = null, layer = null, color, lineType = 0, shape = false}) {\n        this.type = type\n        this.vertices = vertices\n        this.indices = indices\n        this.layer = layer\n        this.color = color\n        this.lineType = lineType\n        this.shape = shape\n    }`,
    replace: `    constructor({type, vertices, indices = null, layer = null, color, lineType = 0,\n                 lineweight = null, shape = false}) {\n        this.type = type\n        this.vertices = vertices\n        this.indices = indices\n        this.layer = layer\n        this.color = color\n        this.lineType = lineType\n        this.lineweight = lineweight\n        this.shape = shape\n    }`
  },
  {
    label: "lineweight codes",
    find: `export const ColorCode = Object.freeze({\n    BY_LAYER: -1,\n    BY_BLOCK: -2\n})`,
    replace: `export const ColorCode = Object.freeze({\n    BY_LAYER: -1,\n    BY_BLOCK: -2\n})\n\n/** DXF group 370 special lineweight values. */\nexport const LineweightCode = Object.freeze({\n    BY_BLOCK: -1,\n    BY_LAYER: -2,\n    DEFAULT: -3\n})`
  }
]));

changed += Number(patchFile("src/DxfViewer.js", [
  {
    label: "lineweight code import",
    find: `import {ColorCode, DxfScene} from "./DxfScene.js"`,
    replace: `import {ColorCode, DxfScene, LineweightCode} from "./DxfScene.js"`
  },
  {
    label: "color mode state",
    find: `        options = this.options\n\n        this.clearColor = this.options.clearColor.getHex()`,
    replace: `        options = this.options\n        this.colorMode = options.colorMode ?? "source"\n\n        this.clearColor = this.options.clearColor.getHex()`
  },
  {
    label: "layer lineweight load",
    find: `        for (const layer of scene.layers) {\n            this.layers.set(layer.name, new Layer(layer.name, layer.displayName, layer.color))\n        }\n        this.defaultLayer = this.layers.get("0") ?? new Layer("0", "0", 0)`,
    replace: `        this.defaultLineweight = scene.defaultLineweight ?? 25\n        for (const layer of scene.layers) {\n            this.layers.set(layer.name, new Layer(layer.name, layer.displayName, layer.color,\n                                                  layer.lineweight ?? this.defaultLineweight))\n        }\n        this.defaultLayer = this.layers.get("0") ??\n            new Layer("0", "0", 0, this.defaultLineweight)`
  },
  {
    label: "render style runtime API",
    find: `    Render() {\n        this._EnsureRenderer()\n        this.renderer.render(this.scene, this.camera)\n    }\n\n    /** @return {Iterable<{name:String, color:number}>} List of layer names. */`,
    replace: `    Render() {\n        this._EnsureRenderer()\n        this.renderer.render(this.scene, this.camera)\n    }\n\n    SetColorMode(mode) {\n        if (mode !== "source" && mode !== "monochrome") {\n            throw new Error(\`Unsupported DXF color mode: \${mode}\`)\n        }\n        if (this.colorMode === mode) return\n        this.colorMode = mode\n        this.materials.each(entry => {\n            if (entry.material?.uniforms?.color && Number.isFinite(entry.key.color)) {\n                entry.material.uniforms.color.value.setHex(this._TransformColor(entry.key.color))\n            }\n        })\n        this.Render()\n    }\n\n    GetColorMode() {\n        return this.colorMode\n    }\n\n    GetRenderStyleCapabilities() {\n        return {\n            sourceColors: true,\n            monochrome: true,\n            lineweightMetadata: true,\n            lineweightRasterization: false\n        }\n    }\n\n    /** @return {Iterable<{name:String, color:number, lineweight:number}>} List of layer names. */`
  },
  {
    label: "layers return lineweight",
    find: `                name: lyr.name,\n                displayName: lyr.displayName,\n                color: this._TransformColor(lyr.color)\n            })`,
    replace: `                name: lyr.name,\n                displayName: lyr.displayName,\n                color: this._TransformColor(lyr.color),\n                lineweight: lyr.lineweight\n            })`
  },
  {
    label: "simple color material lineweight key",
    find: `    _GetSimpleColorMaterial(color, instanceType = InstanceType.NONE) {\n        const key = new MaterialKey(instanceType, null, color, 0)`,
    replace: `    _GetSimpleColorMaterial(color, instanceType = InstanceType.NONE, lineweight = 0) {\n        const key = new MaterialKey(instanceType, null, color, 0, lineweight)`
  },
  {
    label: "simple color material transform location",
    find: `            material: this._CreateSimpleColorMaterialInstance(color, instanceType)`,
    replace: `            material: this._CreateSimpleColorMaterialInstance(this._TransformColor(color), instanceType)`
  },
  {
    label: "simple point raw color key",
    find: `    _GetSimplePointMaterial(color, instanceType = InstanceType.NONE) {\n        const key = new MaterialKey(instanceType, BatchingKey.GeometryType.POINTS, color, 0)`,
    replace: `    _GetSimplePointMaterial(color, instanceType = InstanceType.NONE, lineweight = 0) {\n        const key = new MaterialKey(instanceType, BatchingKey.GeometryType.POINTS, color, 0, lineweight)`
  },
  {
    label: "simple point material transform location",
    find: `            material: this._CreateSimplePointMaterialInstance(color, this.options.pointSize,\n                                                              instanceType)`,
    replace: `            material: this._CreateSimplePointMaterialInstance(this._TransformColor(color),\n                                                              this.options.pointSize, instanceType)`
  },
  {
    label: "color transform source and monochrome modes",
    find: `    _TransformColor(color) {\n        if (!this.options.colorCorrection && !this.options.blackWhiteInversion) {\n            return color\n        }`,
    replace: `    _TransformColor(color) {\n        if (this.colorMode === "source") {\n            return color\n        }\n        if (this.colorMode === "monochrome") {\n            return Luminance(this.clearColor) > 0.5 ? 0x000000 : 0xffffff\n        }\n        if (!this.options.colorCorrection && !this.options.blackWhiteInversion) {\n            return color\n        }`
  },
  {
    label: "default source color mode",
    find: `    /** Correct entities colors to ensure that they are always visible with the current background\n     * color.\n     */\n    colorCorrection: false,`,
    replace: `    /** Render exact resolved DXF colors unless monochrome is explicitly selected. */\n    colorMode: "source",\n    /** Legacy contrast correction, used only outside source/monochrome modes. */\n    colorCorrection: false,`
  },
  {
    label: "batch material raw source color and lineweight",
    find: `        const material = materialFactory.call(this.viewer, this.viewer._TransformColor(color),\n                                              instanceBatch?.GetInstanceType() ?? InstanceType.NONE)`,
    replace: `        const lineweight = instanceBatch ?\n            instanceBatch._GetInstanceLineweight(this) : (this.key.lineweight ?? this.viewer.defaultLineweight)\n        const material = materialFactory.call(this.viewer, color,\n                                              instanceBatch?.GetInstanceType() ?? InstanceType.NONE,\n                                              lineweight)`
  },
  {
    label: "object lineweight metadata",
    find: `            obj._dxfViewerLayer = layer\n            return obj`,
    replace: `            obj._dxfViewerLayer = layer\n            obj.userData.dxfLineweight = lineweight\n            return obj`
  },
  {
    label: "block lineweight resolver",
    find: `    _GetInstanceColor(blockBatch) {\n        const defColor = blockBatch.key.color\n        if (defColor === ColorCode.BY_BLOCK) {\n            return this.key.color\n        } else if (defColor === ColorCode.BY_LAYER) {\n            if (blockBatch.layer) {\n                return blockBatch.layer.color\n            }\n            return this.layer ? this.layer.color : 0\n        }\n        return defColor\n    }`,
    replace: `    _GetInstanceColor(blockBatch) {\n        const defColor = blockBatch.key.color\n        if (defColor === ColorCode.BY_BLOCK) {\n            return this.key.color\n        } else if (defColor === ColorCode.BY_LAYER) {\n            if (blockBatch.layer) {\n                return blockBatch.layer.color\n            }\n            return this.layer ? this.layer.color : 0\n        }\n        return defColor\n    }\n\n    _GetInstanceLineweight(blockBatch) {\n        const value = blockBatch.key.lineweight\n        if (value === LineweightCode.BY_BLOCK) {\n            return this.key.lineweight ?? this.viewer.defaultLineweight\n        }\n        if (value === LineweightCode.BY_LAYER) {\n            if (blockBatch.layer) return blockBatch.layer.lineweight\n            return this.layer ? this.layer.lineweight : this.viewer.defaultLineweight\n        }\n        if (value === LineweightCode.DEFAULT || value == null || value < 0) {\n            return this.viewer.defaultLineweight\n        }\n        return value\n    }`
  },
  {
    label: "viewer layer class lineweight",
    find: `class Layer {\n    constructor(name, displayName, color) {\n        this.name = name\n        this.displayName = displayName\n        this.color = color\n        this.objects = []\n    }`,
    replace: `class Layer {\n    constructor(name, displayName, color, lineweight = 25) {\n        this.name = name\n        this.displayName = displayName\n        this.color = color\n        this.lineweight = lineweight\n        this.objects = []\n    }`
  }
]));

changed += Number(patchFile("src/index.d.ts", [
  {
    label: "color mode option type",
    find: `    colorCorrection?: boolean,\n    blackWhiteInversion?: boolean,`,
    replace: `    colorMode?: "source" | "monochrome",\n    colorCorrection?: boolean,\n    blackWhiteInversion?: boolean,`
  },
  {
    label: "layer info lineweight",
    find: `export type LayerInfo = {\n    name: string,\n    displayName: string,\n    color: number\n}`,
    replace: `export type LayerInfo = {\n    name: string,\n    displayName: string,\n    color: number,\n    lineweight: number\n}`
  },
  {
    label: "runtime color mode methods",
    find: `    Render(): void\n    SetSize(width: number, height: number): void`,
    replace: `    Render(): void\n    SetColorMode(mode: "source" | "monochrome"): void\n    GetColorMode(): "source" | "monochrome"\n    GetRenderStyleCapabilities(): {\n        sourceColors: boolean,\n        monochrome: boolean,\n        lineweightMetadata: boolean,\n        lineweightRasterization: boolean\n    }\n    SetSize(width: number, height: number): void`
  }
]));

console.log(`dxf-viewer Stage 1 patch hazır (${changed} dosya güncellendi, sürüm ${dependencyPackage.version}).`);
