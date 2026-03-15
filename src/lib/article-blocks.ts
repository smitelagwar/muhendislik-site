export type ParsedBlock =
  | { type: "paragraph"; content: string }
  | { type: "code"; content: string; lang: string }
  | { type: "callout"; content: string; tone: string }
  | { type: "table"; content: string }
  | { type: "list"; content: string }
  | { type: "heading"; content: string; level: number }
  | { type: "image"; src: string; alt: string; caption: string }
  | { type: "quote"; content: string }
  | { type: "divider" };

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

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      continue;
    }

    if (/^> \[!/.test(line)) {
      const tone = line.match(/^> \[!(.*)\]$/)?.[1] || "not";
      const parts: string[] = [];
      index += 1;

      while (index < lines.length && /^>/.test(lines[index].trim())) {
        parts.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ type: "callout", tone, content: parts.join("\n").trim() });
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

      if (index + 1 < lines.length && /^\*.*\*$/.test(lines[index + 1].trim())) {
        caption = lines[index + 1].trim().replace(/^\*/, "").replace(/\*$/, "");
        index += 1;
      }

      blocks.push({ type: "image", alt: match?.[1] || "", src: match?.[2] || "", caption });
      index += 1;
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
