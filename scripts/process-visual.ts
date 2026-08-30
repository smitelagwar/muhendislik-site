import fs from "fs";
import path from "path";
import sharp from "sharp";

interface ProcessOptions {
  inputPath: string;
  targetId: string;
  quality?: number;
}

export async function processVisualToWebp(options: ProcessOptions): Promise<{ outputPath: string; sizeBytes: number; width: number; height: number }> {
  const { inputPath, targetId, quality = 85 } = options;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Girdi dosyası bulunamadı: ${inputPath}`);
  }

  const outputDir = path.resolve(process.cwd(), "public/bina-asamalari/topics");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${targetId}.webp`);

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // 1920x1080 hedefli resize (16:9)
  const processed = await image
    .resize(1920, 1080, {
      fit: "cover",
      position: "center",
    })
    .webp({
      quality,
      effort: 6,
    })
    .toFile(outputPath);

  return {
    outputPath,
    sizeBytes: processed.size,
    width: processed.width,
    height: processed.height,
  };
}

// CLI desteği: npx tsx scripts/process-visual.ts <inputPath> <targetId>
if (process.argv[2] && process.argv[3]) {
  const input = process.argv[2];
  const id = process.argv[3];
  processVisualToWebp({ inputPath: input, targetId: id })
    .then((res) => {
      console.log(`Başarıyla işlendi: ${res.outputPath} (${Math.round(res.sizeBytes / 1024)} KB, ${res.width}x${res.height})`);
    })
    .catch((err) => {
      console.error("Hata:", err);
      process.exit(1);
    });
}
