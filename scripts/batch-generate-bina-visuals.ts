import fs from "fs";
import path from "path";
import { processVisualToWebp } from "./process-visual";

interface InventoryItem {
  id: string;
  slugPath: string;
  label: string;
  summary: string;
  phaseId: string;
  depth: number;
  promptTr: string;
  negativePromptTr: string;
  altTr: string;
  visualPurpose: string;
  mode: string;
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
  const inventory: InventoryItem[] = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));

  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const phaseArg = args.find((a) => a.startsWith("--phase="))?.split("=")[1];
  const idArg = args.find((a) => a.startsWith("--id="))?.split("=")[1];

  let targets = inventory;
  if (idArg) {
    targets = targets.filter((t) => t.id === idArg);
  } else if (phaseArg) {
    targets = targets.filter((t) => t.phaseId === phaseArg);
  }

  console.log("=== BİNA AŞAMALARI TOPLU GÖRSEL YÖNETİCİSİ ===");
  console.log(`Hedef Düğüm Sayısı: ${targets.length}`);

  const publicTopicsDir = path.resolve(process.cwd(), "public/bina-asamalari/topics");
  const completed = targets.filter((t) => fs.existsSync(path.join(publicTopicsDir, `${t.id}.webp`)));
  const pending = targets.filter((t) => !fs.existsSync(path.join(publicTopicsDir, `${t.id}.webp`)));

  console.log(`Tamamlanmış (WebP mevcut): ${completed.length}`);
  console.log(`Üretim Bekleyen: ${pending.length}`);

  if (isDryRun) {
    console.log("\n[DRY RUN] Bekleyen Düğümler:");
    for (const item of pending) {
      console.log(`- [${item.phaseId}] ${item.id} (${item.label}) -> ${item.visualPurpose}`);
    }
    return;
  }

  const apiKey = loadEnvKey();
  if (!apiKey || apiKey.startsWith("CHANGE_ME")) {
    console.log("\n[BİLGİ] GEMINI_API_KEY veya GOOGLE_API_KEY bulunamadı.");
    console.log("Harici API ile toplu üretim yapmak için .env.local içine GEMINI_API_KEY ekleyebilirsiniz.");
    console.log("Alternatif olarak IDE görsel üretim kotası resetlendiğinde yerel üretim devam ettirilebilir.");
    return;
  }

  const rawOutDir = path.resolve(process.cwd(), ".gorsel-cikti-ham");
  if (!fs.existsSync(rawOutDir)) {
    fs.mkdirSync(rawOutDir, { recursive: true });
  }

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    console.log(`\n[${i + 1}/${pending.length}] Üretiliyor: ${item.id} (${item.label})...`);

    try {
      const imageBuffer = await callImagenApi(item.promptTr, item.negativePromptTr, apiKey);
      const rawFilePath = path.join(rawOutDir, `${item.id}.jpg`);
      fs.writeFileSync(rawFilePath, imageBuffer);

      const processed = await processVisualToWebp({
        inputPath: rawFilePath,
        targetId: item.id,
      });

      console.log(`✓ Başarılı: ${processed.outputPath} (${Math.round(processed.sizeBytes / 1024)} KB)`);
    } catch (err: any) {
      console.error(`✗ Hata (${item.id}):`, err.message);
    }
  }

  console.log("\nToplu işlem tamamlandı. Manifest senkronizasyonu çalıştırılıyor...");
}

main().catch((err) => {
  console.error("Kritik Hata:", err);
  process.exit(1);
});
