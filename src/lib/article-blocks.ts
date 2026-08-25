export type CalloutTone = "info" | "warning" | "tip" | "regulation" | "engineering" | "field" | "check";

export interface FormulaSymbol {
  symbol: string;
  description: string;
  unit: string;
}

export type ParsedBlock =
  | { type: "paragraph"; content: string }
  | { type: "code"; content: string; lang: string }
  | { type: "formula"; expression: string; label: string; symbols: FormulaSymbol[] }
  | { type: "callout"; content: string; tone: CalloutTone; title: string }
  | { type: "table"; content: string }
  | { type: "list"; content: string }
  | { type: "heading"; content: string; level: number }
  | {
      type: "image";
      src: string;
      alt: string;
      caption: string;
      figureNumber: string;
      note: string;
      sourceNote: string;
      lightbox: boolean;
    }
  | { type: "quote"; content: string }
  | { type: "divider" };

const CALLOUT_TONE_ALIASES: Record<string, CalloutTone> = {
  note: "info",
  info: "info",
  bilgi: "info",
  warning: "warning",
  important: "warning",
  danger: "warning",
  uyari: "warning",
  uyarı: "warning",
  tip: "tip",
  ipucu: "tip",
  regulation: "regulation",
  yonetmelik: "regulation",
  yönetmelik: "regulation",
  mevzuat: "regulation",
  engineering: "engineering",
  muhendislik: "engineering",
  mühendislik: "engineering",
  tasarim: "engineering",
  tasarım: "engineering",
  field: "field",
  saha: "field",
  uygulama: "field",
  check: "check",
  kontrol: "check",
};

function normalizeCalloutTone(value: string): CalloutTone {
  return CALLOUT_TONE_ALIASES[value.trim().toLocaleLowerCase("tr-TR")] ?? "info";
}

function parseFigureMetadata(line: string) {
  const match = line.trim().match(/^\{(.+)\}$/);
  if (!match) {
    return null;
  }

  const metadata = {
    figureNumber: "",
    note: "",
    sourceNote: "",
    lightbox: false,
  };

  for (const token of match[1].split("|")) {
    const separator = token.indexOf(":");
    if (separator === -1) continue;
    const key = token.slice(0, separator).trim().toLocaleLowerCase("tr-TR");
    const value = token.slice(separator + 1).trim();

    if (key === "figure" || key === "sekil" || key === "şekil") metadata.figureNumber = value;
    if (key === "note" || key === "not") metadata.note = value;
    if (key === "source" || key === "kaynak") metadata.sourceNote = value;
    if (key === "lightbox" || key === "buyut" || key === "büyüt") metadata.lightbox = /^(1|true|yes|evet)$/i.test(value);
  }

  return metadata;
}

function parseFormula(lines: string[]) {
  const expressionLines: string[] = [];
  const symbols: FormulaSymbol[] = [];
  let label = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const labelMatch = line.match(/^@(?:label|etiket)\s*:\s*(.+)$/i);
    if (labelMatch) {
      label = labelMatch[1].trim();
      continue;
    }

    const symbolMatch = line.match(/^@(?:symbol|sembol)\s*:\s*(.+)$/i);
    if (symbolMatch) {
      const [symbol = "", description = "", unit = ""] = symbolMatch[1].split("|").map((part) => part.trim());
      symbols.push({ symbol, description, unit });
      continue;
    }

    expressionLines.push(rawLine);
  }

  return {
    expression: expressionLines.join("\n").trim(),
    label,
    symbols,
  };
}

export function parseBlocks(content: string): ParsedBlock[] {
  const lines = content.split("\n");
  const blocks: ParsedBlock[] = [];
  let index = 0;

  const isBlockStart = (line: string) =>
    /^```/.test(line) ||
    /^> \[!/.test(line) ||
    /^\|/.test(line) ||
    /^!\[/.test(line) ||
    /^#{2,6}\s+/.test(line) ||
    /^(?:- |\d+\.\s)/.test(line) ||
    /^>\s+/.test(line) ||
    /^---+$/.test(line);

  while (index < lines.length) {
    const line = lines[index].trimEnd();

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) index += 1;

      if (/^(formula|denklem|equation)$/i.test(lang)) {
        blocks.push({ type: "formula", ...parseFormula(codeLines) });
      } else {
        blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      }
      continue;
    }

    if (/^> \[!/.test(line)) {
      const calloutMatch = line.match(/^> \[!([^\]]+)\](?:\s+(.+))?$/);
      const tone = normalizeCalloutTone(calloutMatch?.[1] ?? "info");
      const title = calloutMatch?.[2]?.trim() ?? "";
      const parts: string[] = [];
      index += 1;

      while (index < lines.length && /^>/.test(lines[index].trim())) {
        parts.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ type: "callout", tone, title, content: parts.join("\n").trim() });
      continue;
    }

    if (/^\|/.test(line)) {
      const rows = [line];
      index += 1;

      while (index < lines.length && /^\|/.test(lines[index].trim())) {
        rows.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "table", content: rows.join("\n") });
      continue;
    }

    if (/^!\[/.test(line)) {
      const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      let caption = "";
      index += 1;

      if (index < lines.length && /^\*.*\*$/.test(lines[index].trim())) {
        caption = lines[index].trim().replace(/^\*/, "").replace(/\*$/, "");
        index += 1;
      }

      const metadata = index < lines.length ? parseFigureMetadata(lines[index]) : null;
      if (metadata) index += 1;

      blocks.push({
        type: "image",
        alt: match?.[1] || "",
        src: match?.[2] || "",
        caption,
        figureNumber: metadata?.figureNumber || "",
        note: metadata?.note || "",
        sourceNote: metadata?.sourceNote || "",
        lightbox: metadata?.lightbox ?? false,
      });
      continue;
    }

    if (/^#{2,6}\s+/.test(line)) {
      const match = line.match(/^(#{2,6})\s+(.*)$/);
      blocks.push({ type: "heading", level: match?.[1].length || 3, content: match?.[2] || line });
      index += 1;
      continue;
    }

    if (/^(?:- |\d+\.\s)/.test(line)) {
      const items = [line];
      index += 1;

      while (index < lines.length && /^(?:- |\d+\.\s)/.test(lines[index].trim())) {
        items.push(lines[index].trim());
        index += 1;
      }

      blocks.push({ type: "list", content: items.join("\n") });
      continue;
    }

    if (/^>\s+/.test(line)) {
      const items = [line.replace(/^>\s?/, "")];
      index += 1;

      while (index < lines.length && /^>\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ type: "quote", content: items.join("\n") });
      continue;
    }

    if (/^---+$/.test(line)) {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }

    const paragraph = [line];
    index += 1;

    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index].trim())) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push({ type: "paragraph", content: paragraph.join("\n").trim() });
  }

  return blocks;
}
