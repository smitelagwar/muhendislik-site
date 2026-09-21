export type FileIconKind =
  | "dwg"
  | "dxf"
  | "pdf"
  | "markdown"
  | "image"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "archive"
  | "text"
  | "code"
  | "video"
  | "audio"
  | "database"
  | "model3d"
  | "cad"
  | "config"
  | "font"
  | "unknown";

export type FileIconMeta = {
  label: string;
  top: string;
  bottom: string;
  band: string;
  symbol: string;
};

export const FILE_ICON_META: Record<FileIconKind, FileIconMeta> = {
  dwg: { label: "DWG", top: "#2f8cff", bottom: "#0b62d6", band: "#0a4598", symbol: "#ffffff" },
  dxf: { label: "DXF", top: "#18d1d4", bottom: "#049ca8", band: "#04747f", symbol: "#ffffff" },
  pdf: { label: "PDF", top: "#ff4b55", bottom: "#e21f2d", band: "#b70d16", symbol: "#ffffff" },
  markdown: { label: "MD", top: "#eef3f7", bottom: "#cbd5df", band: "#596673", symbol: "#334155" },
  image: { label: "IMG", top: "#45d94e", bottom: "#16a43c", band: "#07852e", symbol: "#ffffff" },
  document: { label: "DOC", top: "#5d62ff", bottom: "#3834da", band: "#2723a5", symbol: "#ffffff" },
  spreadsheet: { label: "XLS", top: "#25c95a", bottom: "#079b3b", band: "#05752d", symbol: "#ffffff" },
  presentation: { label: "PPT", top: "#ff6338", bottom: "#e23b17", band: "#aa2b12", symbol: "#ffffff" },
  archive: { label: "ZIP", top: "#ff2b79", bottom: "#d4115f", band: "#9c0b48", symbol: "#ffffff" },
  text: { label: "TXT", top: "#9aa8b7", bottom: "#667685", band: "#44515f", symbol: "#ffffff" },
  code: { label: "CODE", top: "#526171", bottom: "#253341", band: "#17212a", symbol: "#ffffff" },
  video: { label: "VID", top: "#9b5cff", bottom: "#6f34e7", band: "#5020ad", symbol: "#ffffff" },
  audio: { label: "AUD", top: "#ff3c95", bottom: "#d51f70", band: "#9d1552", symbol: "#ffffff" },
  database: { label: "DB", top: "#ffbd2e", bottom: "#e99a08", band: "#aa6b00", symbol: "#ffffff" },
  model3d: { label: "3D", top: "#8a75ff", bottom: "#6553e6", band: "#4738a8", symbol: "#ffffff" },
  cad: { label: "CAD", top: "#e93f86", bottom: "#bf1f67", band: "#861747", symbol: "#ffffff" },
  config: { label: "CFG", top: "#b7c4d1", bottom: "#8192a4", band: "#576777", symbol: "#334155" },
  font: { label: "FONT", top: "#c99875", bottom: "#9f6846", band: "#75482e", symbol: "#ffffff" },
  unknown: { label: "UNK", top: "#a6adff", bottom: "#7c83e8", band: "#545ab0", symbol: "#ffffff" },
};

const EXTENSION_KIND: Record<string, FileIconKind> = {
  dwg: "dwg",
  dxf: "dxf",
  pdf: "pdf",
  md: "markdown",
  markdown: "markdown",
  mdown: "markdown",
  mkd: "markdown",

  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  bmp: "image",
  avif: "image",
  heic: "image",
  heif: "image",
  svg: "image",

  doc: "document",
  docx: "document",
  odt: "document",
  rtf: "document",

  xls: "spreadsheet",
  xlsx: "spreadsheet",
  xlsm: "spreadsheet",
  csv: "spreadsheet",
  ods: "spreadsheet",

  ppt: "presentation",
  pptx: "presentation",
  odp: "presentation",

  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  bz2: "archive",
  xz: "archive",

  txt: "text",
  log: "text",

  js: "code",
  jsx: "code",
  ts: "code",
  tsx: "code",
  html: "code",
  htm: "code",
  css: "code",
  scss: "code",
  sass: "code",
  less: "code",
  json: "code",
  xml: "code",
  yaml: "code",
  yml: "code",
  py: "code",
  java: "code",
  c: "code",
  cpp: "code",
  h: "code",
  hpp: "code",
  cs: "code",
  go: "code",
  rs: "code",
  php: "code",
  rb: "code",
  sh: "code",
  bash: "code",
  zsh: "code",
  ps1: "code",

  mp4: "video",
  mov: "video",
  mkv: "video",
  webm: "video",
  avi: "video",
  m4v: "video",

  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  aac: "audio",
  flac: "audio",
  ogg: "audio",

  db: "database",
  sqlite: "database",
  sqlite3: "database",
  mdb: "database",
  accdb: "database",

  ifc: "model3d",
  rvt: "model3d",
  skp: "model3d",
  obj: "model3d",
  stl: "model3d",
  fbx: "model3d",
  glb: "model3d",
  gltf: "model3d",

  dgn: "cad",
  dwf: "cad",
  step: "cad",
  stp: "cad",
  iges: "cad",
  igs: "cad",

  ini: "config",
  config: "config",
  env: "config",
  toml: "config",

  ttf: "font",
  otf: "font",
  woff: "font",
  woff2: "font",
};

export function normalizeFileExtension(value?: string | null): string {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return "";

  const withoutQuery = raw.split(/[?#]/, 1)[0];
  const tail = withoutQuery.split(/[\\/]/).pop() ?? withoutQuery;
  const dot = tail.lastIndexOf(".");

  if (dot >= 0 && dot < tail.length - 1) return tail.slice(dot + 1);
  return tail.replace(/^\.+/, "");
}

function resolveMimeKind(mimeType?: string | null): FileIconKind | null {
  const mime = (mimeType ?? "").trim().toLowerCase();
  if (!mime) return null;

  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("markdown")) return "markdown";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") return "spreadsheet";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "presentation";
  if (mime.includes("word") || mime.includes("opendocument.text") || mime.includes("rtf")) return "document";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z") || mime.includes("tar") || mime.includes("gzip")) return "archive";
  if (mime.includes("json") || mime.includes("xml") || mime.includes("javascript")) return "code";
  if (mime.startsWith("text/")) return "text";

  return null;
}

export function resolveFileIconKind(
  extension?: string | null,
  mimeType?: string | null,
): FileIconKind {
  const ext = normalizeFileExtension(extension);
  return EXTENSION_KIND[ext] ?? resolveMimeKind(mimeType) ?? "unknown";
}
