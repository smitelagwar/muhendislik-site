import fs from "node:fs";
import path from "node:path";

const DEFAULT_FILE_PATH = path.join(process.cwd(), "src/lib/data.json");
const suspiciousPatterns = [
  /\uFFFD/,
  /"'/,
  /[A-Za-zÇĞİÖŞÜçğıöşü]"[A-Za-zÇĞİÖŞÜçğıöşü]/,
];

const targetFilePath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : DEFAULT_FILE_PATH;

const fileContent = fs.readFileSync(targetFilePath, "utf8");

let parsedContent;
try {
  parsedContent = JSON.parse(fileContent);
  console.log(`JSON geçerli: ${targetFilePath}`);
} catch (error) {
  console.error(`JSON geçersiz: ${targetFilePath}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const findings = [];

function walk(value, trail) {
  if (typeof value === "string") {
    if (suspiciousPatterns.some((pattern) => pattern.test(value))) {
      findings.push(`${trail}: ${value.slice(0, 140)}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${trail}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      walk(item, trail ? `${trail}.${key}` : key);
    });
  }
}

walk(parsedContent, "");

if (findings.length === 0) {
  console.log("Şüpheli metin deseni bulunmadı.");
  process.exit(0);
}

console.log(`Şüpheli metin sayısı: ${findings.length}`);
for (const finding of findings.slice(0, 20)) {
  console.log(`- ${finding}`);
}
