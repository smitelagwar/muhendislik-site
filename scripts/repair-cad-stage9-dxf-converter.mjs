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

const patch = `${anchor}\n\n    ${marker}\n    // cad-simple-viewer 1.6.2 + data-model 1.14.2 can stall while closing\n    // a database event batch in the production browser renderer. Keep the\n    // native MLightCAD DXF reader, but stream entity events directly instead\n    // of using beginEventBatch/endEventBatch(Chunked).\n    const dxfConverter = dataModel.AcDbDatabaseConverterManager.instance.get(\n      dataModel.AcDbFileType.DXF\n    ) as unknown as {\n      read?: (\n        data: ArrayBuffer,\n        db: InstanceType<typeof dataModel.AcDbDatabase>,\n        options?: {\n          minimumChunkSize?: number;\n          progress?: (\n            percentage: number,\n            stage: string,\n            status: string,\n            stageData?: unknown\n          ) => void | Promise<void>;\n        }\n      ) => Promise<void>;\n      __stage9DeterministicRead?: boolean;\n    };\n\n    if (dxfConverter?.read && !dxfConverter.__stage9DeterministicRead) {\n      dxfConverter.__stage9DeterministicRead = true;\n      dxfConverter.read = async (data, db, readOptions = {}) => {\n        const setTrace = (value: string) => {\n          if (typeof document !== \"undefined\") {\n            document.documentElement.setAttribute(\"data-stage9-dxf-trace\", value);\n          }\n        };\n        const emit = async (\n          percentage: number,\n          stage: string,\n          status: string,\n          stageData?: unknown\n        ) => {\n          setTrace(\`${'${'}stage}:${'${'}status}:${'${'}percentage}\`);\n          await readOptions.progress?.(percentage, stage, status, stageData);\n        };\n\n        await emit(0, \"START\", \"START\");\n        await emit(1, \"PARSE\", \"START\");\n\n        const filer = dataModel.AcDbDxfFiler.fromBuffer(data, { database: db });\n        const reader = new dataModel.AcDbDxfDocumentReader(db, {\n          // Frequent cooperative yields keep the main-thread renderer responsive\n          // while direct entityAppended events are being streamed.\n          entityBatchSize: Math.max(16, Math.min(128, readOptions.minimumChunkSize ?? 64)),\n          totalBytes: data.byteLength,\n          onProgress: async (ratio) => {\n            const pct = Math.max(2, Math.min(88, 1 + Math.floor(ratio * 87)));\n            await emit(pct, \"PARSE\", \"IN-PROGRESS\");\n          },\n        });\n\n        setTrace(\"reader:before\");\n        const result = await reader.read(filer);\n        setTrace(\"reader:after\");\n\n        await emit(90, \"PARSE\", \"END\", {\n          unknownEntityCount: result.unknownEntityCount,\n          unknownObjectCount: result.unknownObjectCount,\n        });\n        await emit(92, \"ENTITY\", \"START\");\n        await emit(98, \"ENTITY\", \"END\");\n        await emit(100, \"END\", \"END\");\n        setTrace(\"complete\");\n      };\n    }`;

source = source.replace(anchor, patch);
writeFileSync(adapterPath, source, "utf8");
console.log("Stage 9 streaming DXF converter repair applied.");
