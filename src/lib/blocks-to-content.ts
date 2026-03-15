export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "code"
  | "callout"
  | "link-embed"
  | "list"
  | "quote"
  | "divider"
  | "table";

export interface BlockBase {
  id: string;
  type: BlockType;
  content?: string;
  items?: string[];
  src?: string;
  alt?: string;
  caption?: string;
  lang?: string;
  variant?: string;
  url?: string;
  title?: string;
  ordered?: boolean;
  rows?: string[][];
  level?: number;
}

export interface ParagraphBlock extends BlockBase {
  type: "paragraph";
  content: string;
}

export interface HeadingBlock extends BlockBase {
  type: "heading";
  content: string;
  level?: number;
}

export interface ImageBlock extends BlockBase {
  type: "image";
  src: string;
  alt?: string;
  caption?: string;
}

export interface CodeBlock extends BlockBase {
  type: "code";
  lang?: string;
  content: string;
}

export interface CalloutBlock extends BlockBase {
  type: "callout";
  variant?: string;
  content: string;
}

export interface LinkEmbedBlock extends BlockBase {
  type: "link-embed";
  url: string;
  title?: string;
}

export interface ListBlock extends BlockBase {
  type: "list";
  ordered?: boolean;
  items: string[];
}

export interface QuoteBlock extends BlockBase {
  type: "quote";
  content: string;
}

export interface DividerBlock extends BlockBase {
  type: "divider";
}

export interface TableBlock extends BlockBase {
  type: "table";
  rows: string[][];
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | CodeBlock
  | CalloutBlock
  | LinkEmbedBlock
  | ListBlock
  | QuoteBlock
  | DividerBlock
  | TableBlock;

export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isDivider(line: string) {
  return /^---+$/.test(line.trim());
}

function parseTableRows(chunk: string): string[][] {
  return chunk
    .split("\n")
    .filter((row) => row.trim() && !/^\|[-\s|]+\|$/.test(row.trim()))
    .map((row) => row.split("|").map((cell) => cell.trim()).filter(Boolean));
}

function normalizeCalloutVariant(raw: string | undefined): CalloutBlock["variant"] {
  const value = (raw || "not").trim().toLowerCase();

  if (value.includes("uyar") || value.includes("warn") || value.includes("important")) {
    return "uyari";
  }

  if (value.includes("ipu") || value.includes("tip")) {
    return "ipucu";
  }

  if (value.includes("bilgi") || value.includes("info")) {
    return "bilgi";
  }

  return "not";
}

export function contentToBlocks(content: string): Block[] {
  const chunks = content
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const blocks: Block[] = [];

  for (const chunk of chunks) {
    if (chunk.startsWith("```") && chunk.endsWith("```")) {
      const match = chunk.match(/^```([\w-]*)\n([\s\S]*?)\n```$/);
      blocks.push({
        id: generateId(),
        type: "code",
        lang: match?.[1] || "",
        content: match?.[2] || chunk.replace(/^```/, "").replace(/```$/, "").trim(),
      });
      continue;
    }

    if (chunk.startsWith("> [!")) {
      const lines = chunk.split("\n");
      const tone = lines[0].match(/^> \[!(.*)\]$/)?.[1];
      const body = lines
        .slice(1)
        .map((line) => line.replace(/^>\s?/, ""))
        .join("\n")
        .trim();

      blocks.push({
        id: generateId(),
        type: "callout",
        variant: normalizeCalloutVariant(tone),
        content: body,
      });
      continue;
    }

    if (chunk.startsWith("|")) {
      blocks.push({
        id: generateId(),
        type: "table",
        rows: parseTableRows(chunk),
      });
      continue;
    }

    if (/^!\[.*\]\(.*\)/.test(chunk)) {
      const match = chunk.match(/^!\[(.*?)\]\((.*?)\)(?:\n\*([\s\S]*?)\*)?$/);
      blocks.push({
        id: generateId(),
        type: "image",
        alt: match?.[1] || "",
        src: match?.[2] || "",
        caption: match?.[3] || "",
      });
      continue;
    }

    if (/^#{2,6}\s+/.test(chunk)) {
      const match = chunk.match(/^(#{2,6})\s+([\s\S]*)$/);
      blocks.push({
        id: generateId(),
        type: "heading",
        level: match?.[1].length ?? 3,
        content: match?.[2]?.trim() || chunk,
      });
      continue;
    }

    if (isDivider(chunk)) {
      blocks.push({
        id: generateId(),
        type: "divider",
      });
      continue;
    }

    if (/^(?:- |\d+\.\s)/m.test(chunk) && chunk.split("\n").every((line) => /^(?:- |\d+\.\s)/.test(line.trim()))) {
      const ordered = /^\d+\.\s/.test(chunk.trim());
      blocks.push({
        id: generateId(),
        type: "list",
        ordered,
        items: chunk.split("\n").map((line) => line.replace(/^(?:- |\d+\.\s)/, "").trim()),
      });
      continue;
    }

    if (/^>\s+/.test(chunk)) {
      blocks.push({
        id: generateId(),
        type: "quote",
        content: chunk.replace(/^>\s?/gm, "").trim(),
      });
      continue;
    }

    if (/^\[(.*?)\]\((.*?)\)$/.test(chunk)) {
      const match = chunk.match(/^\[(.*?)\]\((.*?)\)$/);
      blocks.push({
        id: generateId(),
        type: "link-embed",
        title: match?.[1] || "",
        url: match?.[2] || "",
      });
      continue;
    }

    blocks.push({
      id: generateId(),
      type: "paragraph",
      content: chunk,
    });
  }

  return blocks.length > 0 ? blocks : [{ id: generateId(), type: "paragraph", content: "" }];
}

export function blocksToContent(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return (block.content || "").trim();
        case "heading": {
          const level = Math.min(Math.max(block.level ?? 3, 2), 6);
          return `${"#".repeat(level)} ${(block.content || "").trim()}`;
        }
        case "image": {
          const imageLine = `![${block.alt || ""}](${block.src})`;
          return block.caption ? `${imageLine}\n*${block.caption}*` : imageLine;
        }
        case "code":
          return `\`\`\`${block.lang || ""}\n${block.content || ""}\n\`\`\``;
        case "callout":
          return `> [!${(block.variant || "not").toUpperCase()}]\n> ${(block.content || "").replace(/\n/g, "\n> ")}`;
        case "link-embed":
          return `[${block.title || block.url}](${block.url})`;
        case "list":
          return (block.items || [])
            .map((item, index) => (block.ordered ? `${index + 1}. ${item}` : `- ${item}`))
            .join("\n");
        case "quote":
          return (block.content || "")
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n");
        case "divider":
          return "---";
        case "table": {
          const rows = block.rows || [];

          if (rows.length === 0) {
            return "";
          }

          const [header, ...body] = rows;
          const divider = header.map(() => "---");
          const renderRow = (row: string[]) => `| ${row.join(" | ")} |`;

          return [renderRow(header), renderRow(divider), ...body.map(renderRow)].join("\n");
        }
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}
