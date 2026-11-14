import { createHash, timingSafeEqual } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, open, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const exec = promisify(execFile);
const maxBytes = 512 * 1024 * 1024;
const jobIdPattern = /^[a-f0-9]{32}$/;

function authorized(request: Request): boolean {
  const secret = process.env.HSYNCAD_REPORT_LOCAL_SECRET;
  const port = process.env.HSYNCAD_REPORT_LOCAL_PORT;
  const supplied = request.headers.get("x-hsyncad-local-capability") ?? "";
  if (!secret || !port || !/^[a-f0-9]{64}$/.test(secret) || !/^[a-f0-9]{64}$/.test(supplied)) return false;
  if (!timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))) return false;
  const authority = `127.0.0.1:${port}`;
  const origin = request.headers.get("origin");
  const sameOrigin = origin === `http://${authority}` || (!origin && request.headers.get("sec-fetch-site") === "same-origin");
  return request.headers.get("host") === authority && sameOrigin;
}

function paths() {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) throw new Error("local Windows required");
  const root = path.join(process.env.LOCALAPPDATA, "Hsyncad", "idecad-report");
  return { jobs: path.join(root, "jobs"), staging: path.join(root, "staging"),
    prepare: path.join(process.cwd(), "scripts", "idecad", "report_job.py"),
    worker: path.join(process.cwd(), "scripts", "idecad", "report_job_run.py"),
    status: path.join(process.cwd(), "scripts", "idecad", "report_job_status.py"),
    close: path.join(process.cwd(), "scripts", "idecad", "report_job_close.py") };
}

function failure(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

const allowedOptionKeys = new Set(["scope", "analysis", "staircaseSmart", "activeFloorName", "sections", "ideKapak", "rptFlags"]);
const verifiedSections = new Set([
  "aciklama", "kat_yuk", "dinamik", "duzensizlik", "doseme", "kiris", "kolon", "perde", "perde_grubu",
  "birlesim", "surekli_temel", "tekil_temel", "radye", "bag_kiris", "kazik", "izolator", "merdiven",
  "istinat", "kuyu_temel", "iskele", "guclendirme",
]);

function isValidOptions(options: unknown): options is {
  scope: "all" | "active_floor";
  analysis: "fresh" | "saved";
  staircaseSmart?: boolean;
  activeFloorName?: string;
  sections?: string[];
  ideKapak?: boolean;
  rptFlags?: boolean[];
} {
  if (!options || typeof options !== "object" || Array.isArray(options)) return false;
  const o = options as Record<string, unknown>;
  if (Object.keys(o).some(k => !allowedOptionKeys.has(k))) return false;
  if (o.scope !== "all" && o.scope !== "active_floor") return false;
  if (o.analysis !== "fresh" && o.analysis !== "saved") return false;
  if (o.staircaseSmart !== undefined && typeof o.staircaseSmart !== "boolean") return false;
  if (o.ideKapak !== undefined && typeof o.ideKapak !== "boolean") return false;
  if (o.scope === "active_floor") {
    if (typeof o.activeFloorName !== "string") return false;
    const trimmed = o.activeFloorName.trim();
    if (!trimmed || trimmed.length > 64 || /[\x00-\x1f\x7f]/.test(o.activeFloorName)) return false;
  } else if (o.activeFloorName !== undefined) {
    return false;
  }
  if (o.sections !== undefined) {
    if (!Array.isArray(o.sections) || o.sections.length < 1 || o.sections.length > verifiedSections.size) return false;
    if (o.sections.some(s => typeof s !== "string" || !verifiedSections.has(s))) return false;
    if (new Set(o.sections).size !== o.sections.length) return false;
  }
  if (o.rptFlags !== undefined) {
    if (!Array.isArray(o.rptFlags) || o.rptFlags.length !== 146 || o.rptFlags.some(v => typeof v !== "boolean")) return false;
  }
  return true;
}

export async function POST(request: Request) {
  if (!authorized(request)) return failure(403, "Yerel rapor hizmeti kapalı veya erişim reddedildi.");
  const expected = request.headers.get("x-hsyncad-sha256") ?? "";
  const revision = request.headers.get("x-hsyncad-revision") ?? "";
  if (!/^[a-f0-9]{64}$/.test(expected) || !revision.trim() || revision.length > 128 || /[\x00-\x1f\x7f]/.test(revision))
    return failure(400, "Kaynak hash veya model revizyonu geçersiz.");
  let options: unknown;
  try { options = JSON.parse(request.headers.get("x-hsyncad-options") ?? ""); }
  catch { return failure(400, "Rapor seçenekleri okunamadı."); }
  if (!isValidOptions(options))
    return failure(400, "Rapor kapsamı veya analiz seçeneği desteklenmiyor.");
  if (!request.body) return failure(400, "IDE dosyası gerekli.");
  let stagedDir: string | undefined;
  let launched = false;
  try {
    const p = paths();
    await mkdir(p.staging, { recursive: true });
    await mkdir(p.jobs, { recursive: true });
    stagedDir = await mkdtemp(path.join(p.staging, "upload-"));
    const source = path.join(stagedDir, "source.ide10");
    const file = await open(source, "wx", 0o600);
    const sha = createHash("sha256");
    let size = 0;
    try {
      for await (const part of request.body as unknown as AsyncIterable<Uint8Array>) {
        size += part.byteLength;
        if (size > maxBytes) throw new Error("file_too_large");
        sha.update(part);
        await file.writeFile(part);
      }
    } finally { await file.close(); }
    if (!size || sha.digest("hex") !== expected) return failure(400, "Seçilen dosyanın hash değeri eşleşmiyor.");
    const args = ["-X", "utf8", p.prepare, "--source", source, "--sha256", expected,
      "--revision", revision, "--analysis", options.analysis, "--job-root", p.jobs];
    if (options.scope === "active_floor" && options.activeFloorName) args.push("--scope", "active_floor", `--active-floor-name=${options.activeFloorName.trim()}`);
    if (options.sections) args.push(`--sections=${options.sections.join(",")}`);
    if (typeof options.ideKapak === "boolean") args.push("--ide-kapak", options.ideKapak ? "yes" : "no");
    if (options.rptFlags) args.push(`--rpt-flags=${options.rptFlags.map(v => (v ? "1" : "0")).join("")}`);
    if (typeof options.staircaseSmart === "boolean") args.push("--staircase-smart", options.staircaseSmart ? "yes" : "no");
    const env = { ...process.env, PYTHONUTF8: "1" };
    const { stdout } = await exec("python", args, { timeout: 120_000, maxBuffer: 1024 * 1024, env, windowsHide: true });
    const receipt = JSON.parse(stdout) as { jobId?: string; status?: string };
    if (!receipt.jobId || !jobIdPattern.test(receipt.jobId) || receipt.status !== "prepared") throw new Error("bad receipt");
    const worker = spawn("python", ["-X", "utf8", p.worker, receipt.jobId, p.jobs, source],
      { detached: true, windowsHide: true, stdio: "ignore", env });
    await new Promise<void>((resolve, reject) => { worker.once("spawn", resolve); worker.once("error", reject); });
    worker.unref();
    launched = true;
    return Response.json({ jobId: receipt.jobId, status: "prepared" }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(400, "Yerel rapor işi hazırlanamadı; kaynak ve kurulumu kontrol edin.");
  } finally {
    if (stagedDir && !launched) await rm(stagedDir, { recursive: true, force: true });
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) return failure(403, "Yerel rapor hizmeti kapalı veya erişim reddedildi.");
  const id = new URL(request.url).searchParams.get("jobId") ?? "";
  if (!jobIdPattern.test(id)) return failure(400, "İş kimliği geçersiz.");
  try {
    const p = paths();
    const { stdout } = await exec("python", ["-X", "utf8", p.status, id, p.jobs],
      { timeout: 20_000, maxBuffer: 1024 * 1024, env: { ...process.env, PYTHONUTF8: "1" }, windowsHide: true });
    const receipt = JSON.parse(stdout);
    if (receipt.jobId !== id) throw new Error("bad receipt");
    return Response.json(receipt, { headers: { "Cache-Control": "no-store" } });
  } catch { return failure(404, "Rapor işi bulunamadı."); }
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return failure(403, "Yerel rapor hizmeti kapalı veya erişim reddedildi.");
  const id = new URL(request.url).searchParams.get("jobId") ?? "";
  if (!jobIdPattern.test(id)) return failure(400, "İş kimliği geçersiz.");
  try {
    const directory = path.join(paths().jobs, id);
    const receipt = JSON.parse(await readFile(path.join(directory, "receipt.json"), "utf8"));
    if (receipt.jobId !== id || ["failed", "cancelled", "closed"].includes(receipt.status)) return failure(409, "İş artık iptal edilemez.");
    if (receipt.status === "ready") {
      const p = paths();
      const { stdout } = await exec("python", ["-X", "utf8", p.close, id, p.jobs],
        { timeout: 20_000, maxBuffer: 1024 * 1024, env: { ...process.env, PYTHONUTF8: "1" }, windowsHide: true });
      return Response.json(JSON.parse(stdout), { headers: { "Cache-Control": "no-store" } });
    }
    const flag = await open(path.join(directory, "cancel.flag"), "a"); await flag.close();
    return Response.json({ jobId: id, status: "cancelling" }, { status: 202 });
  } catch { return failure(404, "Rapor işi bulunamadı."); }
}
