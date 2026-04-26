import fs from "node:fs";
import path from "node:path";

const DEFAULT_FILE_PATH = path.join(process.cwd(), "src/lib/data.json");

function isUnescapedQuote(value, index) {
  if (value[index] !== "\"") {
    return false;
  }

  let backslashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
    backslashCount += 1;
  }

  return backslashCount % 2 === 0;
}

function findUnescapedQuoteFromStart(value, startIndex = 0) {
  for (let index = startIndex; index < value.length; index += 1) {
    if (isUnescapedQuote(value, index)) {
      return index;
    }
  }

  return -1;
}

function findUnescapedQuoteFromEnd(value, endIndex = value.length - 1) {
  for (let index = endIndex; index >= 0; index -= 1) {
    if (isUnescapedQuote(value, index)) {
      return index;
    }
  }

  return -1;
}

function escapeInnerQuotes(value) {
  let result = "";

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "\"" && isUnescapedQuote(value, index)) {
      result += "\\\"";
      continue;
    }

    result += value[index];
  }

  return result;
}

function normalizeStringValue(value) {
  return escapeInnerQuotes(value.replace(/"'/g, "'"));
}

function repairPropertyLine(line) {
  if (!/^\s*"[^"]+":\s*"/.test(line)) {
    return line;
  }

  const colonIndex = line.indexOf(":");
  const startQuoteIndex = findUnescapedQuoteFromStart(line, colonIndex + 1);

  if (startQuoteIndex < 0) {
    return line;
  }

  const trimmedLine = line.trimEnd();
  const hasTrailingComma = trimmedLine.endsWith(",");
  const valueEndSearchIndex = hasTrailingComma ? line.lastIndexOf(",") - 1 : line.length - 1;
  const endQuoteIndex = findUnescapedQuoteFromEnd(line, valueEndSearchIndex);
  const prefix = line.slice(0, startQuoteIndex + 1);

  if (endQuoteIndex <= startQuoteIndex) {
    const rawValue = line
      .slice(startQuoteIndex + 1, hasTrailingComma ? line.lastIndexOf(",") : line.length)
      .trimEnd();

    return `${prefix}${normalizeStringValue(rawValue)}"${hasTrailingComma ? "," : ""}`;
  }

  const rawValue = line.slice(startQuoteIndex + 1, endQuoteIndex);
  return `${prefix}${normalizeStringValue(rawValue)}"${line.slice(endQuoteIndex + 1)}`;
}

function repairArrayItemLine(line) {
  if (!/^\s*"/.test(line) || line.includes(":")) {
    return line;
  }

  const startQuoteIndex = findUnescapedQuoteFromStart(line, 0);
  if (startQuoteIndex !== line.indexOf("\"")) {
    return line;
  }

  const trimmedLine = line.trimEnd();
  const hasTrailingComma = trimmedLine.endsWith(",");
  const valueEndSearchIndex = hasTrailingComma ? line.lastIndexOf(",") - 1 : line.length - 1;
  const endQuoteIndex = findUnescapedQuoteFromEnd(line, valueEndSearchIndex);
  const prefix = line.slice(0, startQuoteIndex + 1);

  if (endQuoteIndex <= startQuoteIndex) {
    const rawValue = line
      .slice(startQuoteIndex + 1, hasTrailingComma ? line.lastIndexOf(",") : line.length)
      .trimEnd();

    return `${prefix}${normalizeStringValue(rawValue)}"${hasTrailingComma ? "," : ""}`;
  }

  const rawValue = line.slice(startQuoteIndex + 1, endQuoteIndex);
  return `${prefix}${normalizeStringValue(rawValue)}"${line.slice(endQuoteIndex + 1)}`;
}

function repairJsonLikeText(source) {
  return source
    .split(/\r?\n/)
    .map((line) => repairArrayItemLine(repairPropertyLine(line)))
    .join("\n");
}

const targetFilePath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : DEFAULT_FILE_PATH;

const fileContent = fs.readFileSync(targetFilePath, "utf8");
const repairedContent = repairJsonLikeText(fileContent);

JSON.parse(repairedContent);
fs.writeFileSync(targetFilePath, repairedContent, "utf8");

console.log(`Veri dosyası onarıldı: ${targetFilePath}`);
