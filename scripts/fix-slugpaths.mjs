import fs from "fs";
import path from "path";

const pagesDir = path.resolve(process.cwd(), "src/lib/bina-asamalari-content/pages");
const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".ts"));

function toAsciiSlug(str) {
  return str
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c");
}

let fixedFiles = 0;

for (const file of files) {
  const fullPath = path.join(pagesDir, file);
  let content = fs.readFileSync(fullPath, "utf-8");
  let modified = content;

  // Fix slugPath: "..."
  modified = modified.replace(/slugPath:\s*"([^"]+)"/g, (match, p1) => {
    return `slugPath: "${toAsciiSlug(p1)}"`;
  });

  // Fix relatedPaths: [...]
  modified = modified.replace(/relatedPaths:\s*\[([^\]]+)\]/g, (match, p1) => {
    const fixedList = p1.replace(/"([^"]+)"/g, (m, slug) => `"${toAsciiSlug(slug)}"`);
    return `relatedPaths: [${fixedList}]`;
  });

  if (modified !== content) {
    fs.writeFileSync(fullPath, modified, "utf-8");
    fixedFiles++;
    console.log(`Normalized slug paths in: ${file}`);
  }
}

console.log(`Normalized ${fixedFiles} files.`);
