import { readFileSync, writeFileSync } from "node:fs";

const adapterPath = "src/lib/dokumantasyon/cad-upstream/adapter.ts";
let source = readFileSync(adapterPath, "utf8");

const marker = "// Stage 9 DXF converter deadlock bypass";
if (source.includes(marker)) {
  console.log("Stage 9 DXF converter deadlock bypass already applied.");
  process.exit(0);
}

const anchor = `    const { dataModel, mtextRenderer, threeRenderer } = runtime;`;
if (!source.includes(anchor)) {
  throw new Error("Stage 9 DXF converter repair anchor missing; flat-parser repair must run first.");
}

const patch = `${anchor}\n\n    ${marker}\n    // cad-simple-viewer 1.6.2 + data-model 1.14.2 can stall in the native\n    // converter's chunked event flush under the production browser bundle.\n    // Keep MLightCAD as the renderer/parser, but replace only that flush path\n    // with one deterministic parse + one batched event flush.\n    const dxfConverter = dataModel.AcDbDatabaseConverterManager.instance.get(\n      dataModel.AcDbFileType.DXF\n    ) as unknown as {\n      read?: (\n        data: ArrayBuffer,\n        db: InstanceType<typeof dataModel.AcDbDatabase>,\n        options?: {\n          minimumChunkSize?: number;\n          progress?: (\n            percentage: number,\n            stage: string,\n            status: string,\n            stageData?: unknown\n          ) => void | Promise<void>;\n        }\n      ) => Promise<void>;\n      __stage9DeterministicRead?: boolean;\n    };\n\n    if (dxfConverter?.read && !dxfConverter.__stage9DeterministicRead) {\n      dxfConverter.__stage9DeterministicRead = true;\n      dxfConverter.read = async (data, db, readOptions = {}) => {\n        const emit = async (\n          percentage: number,\n          stage: string,\n          status: string,\n          stageData?: unknown\n        ) => {\n          await readOptions.progress?.(percentage, stage, status, stageData);\n        };\n\n        await emit(0, \"START\", \"START\");\n        await emit(1, \"PARSE\", \"START\");\n\n        db.beginEventBatch();\n        let batchOpen = true;\n        try {\n          const filer = dataModel.AcDbDxfFiler.fromBuffer(data, { database: db });\n          const reader = new dataModel.AcDbDxfDocumentReader(db, {\n            entityBatchSize: Math.max(1, readOptions.minimumChunkSize ?? 256),\n            totalBytes: data.byteLength,\n            onProgress: async (ratio) => {\n              const pct = Math.max(2, Math.min(17, 1 + Math.floor(ratio * 16)));\n              await emit(pct, \"PARSE\", \"IN-PROGRESS\");\n            },\n          });\n          const result = await reader.read(filer);\n\n          await emit(18, \"PARSE\", \"END\", {\n            unknownEntityCount: result.unknownEntityCount,\n            unknownObjectCount: result.unknownObjectCount,\n          });\n          await emit(20, \"ENTITY\", \"START\");\n\n          // Important: do not call endEventBatchChunked here. That is the path\n          // observed hanging the Stage 9 production Chromium gate.\n          db.endEventBatch();\n          batchOpen = false;\n\n          await emit(98, \"ENTITY\", \"END\");\n          await emit(100, \"END\", \"END\");\n        } catch (error) {\n          if (batchOpen) db.endEventBatch();\n          throw error;\n        }\n      };\n    }`;

source = source.replace(anchor, patch);
writeFileSync(adapterPath, source, "utf8");
console.log("Stage 9 deterministic DXF converter flush repair applied.");
