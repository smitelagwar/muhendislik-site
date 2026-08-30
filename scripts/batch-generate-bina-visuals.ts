import fs from "fs";
import path from "path";
import { processVisualToWebp } from "./process-visual";

interface InventoryItemV2 {
  id: string;
  slugPath: string;
  label: string;
  summary: string;
  phaseId: string;
  depth: number;

  primaryTargetWebp: string;
  secondaryTargetWebp: string;

  primaryMode: string;
  primaryVisualPurpose: string;
  primaryMustShow: string[];
  primaryMustNotShow: string[];
  primaryPromptTr: string;
  primaryAltTr: string;

  secondaryMode: string;
  secondaryPlacement: string;
  secondaryVisualPurpose: string;
  secondaryMustShow: string[];
  secondaryMustNotShow: string[];
  secondaryPromptTr: string;
  secondaryAltTr: string;
  secondaryDifference: string;

  negativePromptTr: string;
  status: string;
}

function loadEnvKey(): string | undefined {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("GEMINI_API_KEY=")) {
        return trimmed.replace("GEMINI_API_KEY=", "").trim();
      }
      if (trimmed.startsWith("GOOGLE_API_KEY=")) {
        return trimmed.replace("GOOGLE_API_KEY=", "").trim();
      }
    }
  }
  return undefined;
}

async function callImagenApi(prompt: string, negativePrompt: string, apiKey: string): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        aspectRatio: "16:9",
        sampleCount: 1,
        negativePrompt,
        outputOptions: {
          mimeType: "image/jpeg",
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Hatası (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const base64Bytes = data.predictions?.[0]?.bytesBase64Encoded;
  if (!base64Bytes) {
    throw new Error("API yanıtında görsel verisi bulunamadı.");
  }

  return Buffer.from(base64Bytes, "base64");
}

async function main() {
  const inventoryPath = path.resolve(process.cwd(), "bina-gorsel-envanteri.json");
  const inventory: InventoryItemV2[] = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));

  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const phaseArg = args.find((a) => a.startsWith("--phase="))?.split("=")[1];
  const idArg = args.find((a) => a.startsWith("--id="))?.split("=")[1];
  const targetArg = args.find((a) => a.startsWith("--target="))?.split("=")[1] || "all"; // 'primary', 'secondary', 'all'

  let targets = inventory;
  if (idArg) {
    targets = targets.filter((t) => t.id === idArg);
  } else if (phaseArg) {
    targets = targets.filter((t) => t.phaseId === phaseArg);
  }

  const knownKeepPrimary = ["ince-isler", "siva", "alcipan"];
  const publicTopicsDir = path.resolve(process.cwd(), "public/bina-asamalari/topics");
  const publicDetailsDir = path.resolve(process.cwd(), "public/bina-asamalari/details");

  // Tasks to perform
  interface Task {
    type: "primary" | "secondary";
    item: InventoryItemV2;
    prompt: string;
    targetSubdir: "topics" | "details";
    targetFile: string;
  }

  const tasks: Task[] = [];

  for (const item of targets) {
    // Primary task
    if (targetArg === "all" || targetArg === "primary") {
      const isKeep = knownKeepPrimary.includes(item.id) && (item.slugPath === "ince-isler" || item.slugPath === "ince-isler/siva" || item.slugPath === "ince-isler/alcipan");
      const primaryExists = fs.existsSync(path.join(publicTopicsDir, `${item.id}.webp`));
      if (!isKeep && !primaryExists) {
        tasks.push({
          type: "primary",
          item,
          prompt: item.primaryPromptTr,
          targetSubdir: "topics",
          targetFile: `${item.id}.webp`,
        });
      }
    }

    // Secondary task
    if (targetArg === "all" || targetArg === "secondary") {
      const secondaryExists = fs.existsSync(path.join(publicDetailsDir, `${item.id}.webp`));
      if (!secondaryExists) {
        tasks.push({
          type: "secondary",
          item,
          prompt: item.secondaryPromptTr,
          targetSubdir: "details",
          targetFile: `${item.id}.webp`,
        });
      }
    }
  }

  console.log("=== BİNA AŞAMALARI TOPLU GÖRSEL YÖNETİCİSİ V2 ===");
  console.log(`Hedef Düğüm Sayısı: ${targets.length}`);
  console.log(`Hedef Kapsam: ${targetArg.toUpperCase()}`);
  console.log(`Toplam Bekleyen Görev: ${tasks.length}`);
  console.log(`- Bekleyen PRIMARY: ${tasks.filter((t) => t.type === "primary").length}`);
  console.log(`- Bekleyen SECONDARY: ${tasks.filter((t) => t.type === "secondary").length}`);

  if (isDryRun) {
    console.log("\n[DRY RUN] Bekleyen Görev Listesi:");
    for (const t of tasks) {
      console.log(`- [${t.type.toUpperCase()}] [${t.item.phaseId}] ${t.item.id} -> public/bina-asamalari/${t.targetSubdir}/${t.targetFile}`);
    }
    return;
  }

  const apiKey = loadEnvKey();
  if (!apiKey || apiKey.startsWith("CHANGE_ME")) {
    console.error("\n[BLOCKED] GEMINI_API_KEY veya GOOGLE_API_KEY bulunamadı.");
    console.error("Görsel üretimi için `.env.local` içine geçerli bir `GEMINI_API_KEY=<key>` ekleyiniz.");
    console.error("Veya IDE kotası resetlendiğinde (23:11 UTC) yerel üretim moduna geçebilirsiniz.");
    console.error(`Kalan iş: ${tasks.length} adet görsel (${tasks.filter((t) => t.type === "primary").length} PRIMARY + ${tasks.filter((t) => t.type === "secondary").length} SECONDARY)`);
    process.exit(1);
  }

  const rawOutDir = path.resolve(process.cwd(), ".gorsel-cikti-ham");
  if (!fs.existsSync(rawOutDir)) {
    fs.mkdirSync(rawOutDir, { recursive: true });
  }

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`\n[${i + 1}/${tasks.length}] Üretiliyor [${task.type}]: ${task.item.id} (${task.item.label})...`);

    try {
      const imageBuffer = await callImagenApi(task.prompt, task.item.negativePromptTr, apiKey);
      const rawSubDir = path.join(rawOutDir, task.targetSubdir);
      if (!fs.existsSync(rawSubDir)) fs.mkdirSync(rawSubDir, { recursive: true });

      const rawFilePath = path.join(rawSubDir, `${task.item.id}.jpg`);
      fs.writeFileSync(rawFilePath, imageBuffer);

      const processed = await processVisualToWebp({
        inputPath: rawFilePath,
        targetId: task.item.id,
        subDir: task.targetSubdir,
      });

      console.log(`✓ Başarılı: ${processed.outputPath} (${Math.round(processed.sizeBytes / 1024)} KB)`);
    } catch (err: any) {
      console.error(`✗ Hata (${task.type} - ${task.item.id}):`, err.message);
    }
  }

  console.log("\nToplu işlem tamamlandı. Manifest senkronizasyonu çalıştırılıyor...");
}

main().catch((err) => {
  console.error("Kritik Hata:", err);
  process.exit(1);
});
