import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { IDE_EXAMPLES } from "@/lib/hsyncad/ide-examples";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local-only sample bridge; never packages or publishes the owner's project files. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  if (process.env.VERCEL || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return new Response(null, { status: 404 });
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return new Response(null, { status: 403 });
  const { id } = await params;
  if (!IDE_EXAMPLES.some(sample => sample.id === id)) return new Response(null, { status: 404 });
  try {
    const config: unknown = JSON.parse(await readFile(path.join(process.cwd(), ".data", "hsyncad", "ide-examples.json"), "utf8"));
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Missing configuration");
    const filePath = (config as Record<string, unknown>)[id];
    if (typeof filePath !== "string" || !path.isAbsolute(filePath) || !/\.(?:ide10|ide11|ide11trial)$/i.test(filePath)) throw new Error("Invalid sample");
    const info = await stat(filePath);
    if (!info.isFile() || info.size > 250 * 1024 * 1024) throw new Error("Invalid sample size");
    const headers = { "Content-Type": "application/octet-stream", "Content-Length": String(info.size), "Cache-Control": "private, no-store", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(filePath))}`, "X-Content-Type-Options": "nosniff" };
    const body = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>;
    return new Response(body, { headers });
  } catch {
    return Response.json({ error: "Bu örnek bu bilgisayarda bağlı değil. Aynı IDE dosyasını Dosya aç ile seçebilirsiniz." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
