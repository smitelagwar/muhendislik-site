import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createServer as createNetServer } from "node:net";
import * as crypto from "node:crypto";
import { once } from "node:events";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import {
  CadV2DurableService,
  type CadV2BlobStorageAdapter,
} from "../../src/lib/cad-v2/service/cad-v2-durable-service";
import { CadV2DurableRepository, type CadV2SqlExecutor, type CadV2SqlStatement } from "../../src/lib/cad-v2/db/repository";
import { applyCadV2DurableRepositoryMigration } from "../../src/lib/cad-v2/db/migrate";
import { hashShareToken } from "../../src/lib/dokumantasyon/security";
import { POST as publicPrepare } from "../../src/app/api/public/cad-v2/prepare/route";
import { GET as publicJobGet } from "../../src/app/api/public/cad-v2/jobs/[jobId]/route";
import { GET as publicManifestGet } from "../../src/app/api/public/cad-v2/scenes/[sceneId]/manifest/route";
import { GET as publicChunkGet } from "../../src/app/api/public/cad-v2/scenes/[sceneId]/chunks/[chunkId]/route";
import { GET as publicIndexGet } from "../../src/app/api/public/cad-v2/scenes/[sceneId]/indexes/[indexId]/route";
import { GET as publicMetadataGet } from "../../src/app/api/public/cad-v2/scenes/[sceneId]/metadata/[metadataId]/route";
import { POST as adminPrepare } from "../../src/app/api/dokumantasyon/cad-v2/prepare/route";
import { GET as adminJobGet } from "../../src/app/api/dokumantasyon/cad-v2/jobs/[jobId]/route";
import { GET as adminManifestGet } from "../../src/app/api/dokumantasyon/cad-v2/scenes/[sceneId]/manifest/route";
import { GET as adminChunkGet } from "../../src/app/api/dokumantasyon/cad-v2/scenes/[sceneId]/chunks/[chunkId]/route";
import { DELETE as publicViewSessionDelete } from "../../src/app/api/public/cad-v2/view-sessions/[viewSessionId]/route";
import { POST as publicViewSessionHeartbeat } from "../../src/app/api/public/cad-v2/view-sessions/[viewSessionId]/heartbeat/route";
import { computeSceneIdentity } from "../../src/lib/cad-v2/service/scene-identity";
import { FontLayoutEngine } from "../../src/lib/cad-v2/text/font-layout-engine";
import { CAD_V2_COMPILER_REVISION } from "../../src/lib/cad-v2/version";
import { resolveDurableCadV2Source, runNextDurableCadV2Job } from "../../src/lib/cad-v2/worker/durable-worker";

const SAMPLE_DXF = `0
SECTION
2
ENTITIES
0
LINE
5
1
8
0
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF
`;

let accessUrlCanaryHits = 0;

class FileBlobStorageAdapter implements CadV2BlobStorageAdapter {
  private failed = false;

  constructor(
    private readonly root: string,
    private readonly failObjectType: "chunk" | "index" | "metadata" | "manifest" | null
  ) {}

  isConfigured(): boolean {
    return true;
  }

  async put(pathname: string, body: string | Uint8Array): Promise<void> {
    const objectType = pathname.endsWith(".bin")
      ? "chunk"
      : path.posix.basename(pathname).startsWith("index_")
        ? "index"
        : path.posix.basename(pathname).startsWith("meta_")
          ? "metadata"
          : path.posix.basename(pathname) === "manifest.json"
            ? "manifest"
            : null;
    if (this.failObjectType && objectType === this.failObjectType && !this.failed) {
      this.failed = true;
      throw new Error(`INJECTED_BLOB_PUT_FAILURE:${this.failObjectType}:${pathname}`);
    }

    const target = this.resolveObjectPath(pathname);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof body === "string" ? body : Buffer.from(body));
  }

  async get(pathname: string): Promise<Uint8Array | null> {
    const target = this.resolveObjectPath(pathname);
    if (!fs.existsSync(target)) return null;
    return new Uint8Array(fs.readFileSync(target));
  }

  private resolveObjectPath(pathname: string): string {
    const root = path.resolve(this.root);
    const target = path.resolve(root, ...pathname.split("/"));
    if (!target.startsWith(root + path.sep)) {
      throw new Error("TEST_BLOB_PATH_OUTSIDE_ROOT");
    }
    return target;
  }
}

function clearExternalPersistenceEnvironment(): void {
  for (const key of Object.keys(process.env)) {
    if (/DATABASE_URL|POSTGRES|NEON|BLOB|VERCEL/i.test(key)) delete process.env[key];
  }
  process.env.DOK_ALLOW_LOCAL_STORAGE = "true";
  process.env.NODE_ENV = "development";
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function toWebHeaders(headers: IncomingMessage["headers"]): Headers {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) result.append(name, item);
    } else if (value !== undefined) {
      result.set(name, value);
    }
  }
  return result;
}

async function readRequestBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function writeWebResponse(response: Response, target: ServerResponse): Promise<void> {
  target.statusCode = response.status;
  response.headers.forEach((value, name) => target.setHeader(name, value));
  target.end(Buffer.from(await response.arrayBuffer()));
}

function getRouteHandler(method: string, pathname: string) {
  if (method === "POST" && pathname === "/api/dokumantasyon/cad-v2/prepare") {
    return (request: Request) => adminPrepare(request);
  }

  if (method === "POST" && pathname === "/api/public/cad-v2/prepare") {
    return (request: Request) => publicPrepare(request);
  }

  const adminJobMatch = pathname.match(/^\/api\/dokumantasyon\/cad-v2\/jobs\/([^/]+)$/);
  if (method === "GET" && adminJobMatch) {
    const jobId = decodeURIComponent(adminJobMatch[1]!);
    return (request: Request) => adminJobGet(request, { params: Promise.resolve({ jobId }) });
  }

  const adminManifestMatch = pathname.match(/^\/api\/dokumantasyon\/cad-v2\/scenes\/([^/]+)\/manifest$/);
  if (method === "GET" && adminManifestMatch) {
    const sceneId = decodeURIComponent(adminManifestMatch[1]!);
    return (request: Request) => adminManifestGet(request, { params: Promise.resolve({ sceneId }) });
  }

  const adminChunkMatch = pathname.match(/^\/api\/dokumantasyon\/cad-v2\/scenes\/([^/]+)\/chunks\/([^/]+)$/);
  if (method === "GET" && adminChunkMatch) {
    const sceneId = decodeURIComponent(adminChunkMatch[1]!);
    const chunkId = decodeURIComponent(adminChunkMatch[2]!);
    return (request: Request) => adminChunkGet(request, { params: Promise.resolve({ sceneId, chunkId }) });
  }

  const jobMatch = pathname.match(/^\/api\/public\/cad-v2\/jobs\/([^/]+)$/);
  if (method === "GET" && jobMatch) {
    const jobId = decodeURIComponent(jobMatch[1]!);
    return (request: Request) => publicJobGet(request, { params: Promise.resolve({ jobId }) });
  }

  const manifestMatch = pathname.match(/^\/api\/public\/cad-v2\/scenes\/([^/]+)\/manifest$/);
  if (method === "GET" && manifestMatch) {
    const sceneId = decodeURIComponent(manifestMatch[1]!);
    return (request: Request) => publicManifestGet(request, { params: Promise.resolve({ sceneId }) });
  }

  const publicIndexMatch = pathname.match(/^\/api\/public\/cad-v2\/scenes\/([^/]+)\/indexes\/([^/]+)$/);
  if (method === "GET" && publicIndexMatch) {
    const sceneId = decodeURIComponent(publicIndexMatch[1]!);
    const indexId = decodeURIComponent(publicIndexMatch[2]!);
    return (request: Request) => publicIndexGet(request, { params: Promise.resolve({ sceneId, indexId }) });
  }

  const publicMetadataMatch = pathname.match(/^\/api\/public\/cad-v2\/scenes\/([^/]+)\/metadata\/([^/]+)$/);
  if (method === "GET" && publicMetadataMatch) {
    const sceneId = decodeURIComponent(publicMetadataMatch[1]!);
    const metadataId = decodeURIComponent(publicMetadataMatch[2]!);
    return (request: Request) => publicMetadataGet(request, { params: Promise.resolve({ sceneId, metadataId }) });
  }

  const chunkMatch = pathname.match(/^\/api\/public\/cad-v2\/scenes\/([^/]+)\/chunks\/([^/]+)$/);
  if (method === "GET" && chunkMatch) {
    const sceneId = decodeURIComponent(chunkMatch[1]!);
    const chunkId = decodeURIComponent(chunkMatch[2]!);
    return (request: Request) => publicChunkGet(request, { params: Promise.resolve({ sceneId, chunkId }) });
  }

  const heartbeatMatch = pathname.match(/^\/api\/public\/cad-v2\/view-sessions\/([^/]+)\/heartbeat$/);
  if (method === "POST" && heartbeatMatch) {
    const viewSessionId = decodeURIComponent(heartbeatMatch[1]!);
    return (request: Request) => publicViewSessionHeartbeat(request, { params: Promise.resolve({ viewSessionId }) });
  }

  const viewSessionMatch = pathname.match(/^\/api\/public\/cad-v2\/view-sessions\/([^/]+)$/);
  if (method === "DELETE" && viewSessionMatch) {
    const viewSessionId = decodeURIComponent(viewSessionMatch[1]!);
    return (request: Request) => publicViewSessionDelete(request, { params: Promise.resolve({ viewSessionId }) });
  }

  return null;
}

async function startRouteServer(
  role: "publisher" | "publisher-retry" | "reader",
  options: { port: number; dataDir: string; cacheDir: string; blobDir: string; databaseDir: string }
): Promise<void> {
  clearExternalPersistenceEnvironment();
  process.env.DOK_LOCAL_DATA_DIR = options.dataDir;

  const database = new PGlite(options.databaseDir);
  await database.waitReady;
  const executor: CadV2SqlExecutor = {
    query: async <T extends Record<string, unknown>>(text: string, params: readonly unknown[] = []) => {
      const result = await database.query<T>(text, [...params]);
      return result.rows;
    },
    transaction: async (statements: readonly CadV2SqlStatement[]) => {
      await database.exec("BEGIN");
      try {
        const results: unknown[][] = [];
        for (const statement of statements) {
          const result = await database.query(statement.text, [...(statement.params || [])]);
          results.push(result.rows as unknown[]);
        }
        await database.exec("COMMIT");
        return results;
      } catch (error) {
        await database.exec("ROLLBACK");
        throw error;
      }
    },
  };
  await applyCadV2DurableRepositoryMigration(executor);
  const repository = new CadV2DurableRepository(executor);
  const service = new CadV2DurableService(
    options.cacheDir,
    new FileBlobStorageAdapter(options.blobDir, role === "publisher" ? "chunk" : null),
    repository
  );
  CadV2DurableService.getInstance = () => service;

  const server = createHttpServer(async (incoming, outgoing) => {
    try {
      const requestUrl = new URL(incoming.url || "/", `http://${incoming.headers.host || "127.0.0.1"}`);
      if (requestUrl.pathname === "/__test/access-url-canary") {
        accessUrlCanaryHits++;
        outgoing.statusCode = 200;
        outgoing.end("ACCESS_URL_CANARY");
        return;
      }
      if (requestUrl.pathname === "/__test/access-url-canary-count") {
        outgoing.setHeader("Content-Type", "application/json");
        outgoing.end(JSON.stringify({ hits: accessUrlCanaryHits }));
        return;
      }
      const handler = getRouteHandler(incoming.method || "GET", requestUrl.pathname);
      if (!handler) {
        outgoing.statusCode = 404;
        outgoing.end("NOT_FOUND");
        return;
      }

      const headers = toWebHeaders(incoming.headers);
      const init: RequestInit = { method: incoming.method || "GET", headers };
      if (!(["GET", "HEAD"].includes(init.method || "GET"))) {
        init.body = await readRequestBody(incoming);
      }
      const request = new Request(requestUrl, init);
      await writeWebResponse(await handler(request), outgoing);
    } catch (error) {
      outgoing.statusCode = 500;
      outgoing.end(error instanceof Error ? error.message : String(error));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, "127.0.0.1", () => resolve());
  });

  process.stdout.write(`READY:${JSON.stringify({ role, port: options.port })}\n`);
  const stop = () => {
    server.closeAllConnections();
    server.close(() => { void database.close().finally(() => process.exit(0)); });
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}

async function findFreePort(): Promise<number> {
  const server = createNetServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a local test port.");
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function startChild(
  role: "publisher" | "publisher-retry" | "reader",
  options: { port: number; dataDir: string; cacheDir: string; blobDir: string; databaseDir: string }
): Promise<{ process: ChildProcessWithoutNullStreams; closed: Promise<void>; baseUrl: string; logs: string[] }> {
  const childEnv = { ...process.env };
  for (const key of Object.keys(childEnv)) {
    if (/DATABASE_URL|POSTGRES|NEON|BLOB|VERCEL/i.test(key)) delete childEnv[key];
  }
  Object.assign(childEnv, {
    NODE_ENV: "development",
    DOK_ALLOW_LOCAL_STORAGE: "true",
    DOK_LOCAL_DATA_DIR: options.dataDir,
  });

  const child = spawn(
    process.execPath,
    ["--import", "tsx", __filename, "--role", role, "--port", String(options.port), "--data", options.dataDir, "--cache", options.cacheDir, "--blob", options.blobDir, "--db", options.databaseDir],
    { cwd: process.cwd(), env: childEnv, stdio: ["ignore", "pipe", "pipe"] }
  );
  const closed = once(child, "close").then(() => undefined);
  const logs: string[] = [];
  child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString()));

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${role} server startup timeout: ${logs.join("")}`)), 15_000);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    const checkReady = (chunk: Buffer) => {
      if (!chunk.toString().includes(`READY:${JSON.stringify({ role, port: options.port })}`)) return;
      clearTimeout(timeout);
      child.stdout.off("data", checkReady);
      resolve();
    };
    child.stdout.on("data", checkReady);
  });

  return { process: child, closed, baseUrl: `http://127.0.0.1:${options.port}`, logs };
}

async function runWorkerChild(
  role: "worker-fault" | "worker-success",
  options: { dataDir: string; cacheDir: string; blobDir: string; databaseDir: string }
): Promise<Record<string, unknown>> {
  const childEnv = { ...process.env };
  for (const key of Object.keys(childEnv)) {
    if (/DATABASE_URL|POSTGRES|NEON|BLOB|VERCEL/i.test(key)) delete childEnv[key];
  }
  Object.assign(childEnv, {
    NODE_ENV: "development",
    DOK_ALLOW_LOCAL_STORAGE: "true",
    DOK_LOCAL_DATA_DIR: options.dataDir,
  });
  const child = spawn(
    process.execPath,
    ["--import", "tsx", __filename, "--role", role, "--data", options.dataDir, "--cache", options.cacheDir, "--blob", options.blobDir, "--db", options.databaseDir],
    { cwd: process.cwd(), env: childEnv, stdio: ["ignore", "pipe", "pipe"] }
  );
  const logs: string[] = [];
  child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString()));
  let timer: NodeJS.Timeout | undefined;
  const [exitCode, signal] = await Promise.race([
    once(child, "close") as Promise<[number | null, NodeJS.Signals | null]>,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`${role} worker timeout: ${logs.join("")}`));
      }, 25_000);
    }),
  ]).finally(() => { if (timer) clearTimeout(timer); });
  if (exitCode !== 0) throw new Error(`${role} worker exited ${exitCode}/${signal}: ${logs.join("")}`);
  const resultLine = logs.join("").split(/\r?\n/).find((line) => line.startsWith("WORKER_RESULT:"));
  if (!resultLine) throw new Error(`${role} worker did not emit a result: ${logs.join("")}`);
  return JSON.parse(resultLine.slice("WORKER_RESULT:".length));
}

async function runWorkerProcess(
  role: "worker-fault" | "worker-success",
  options: { dataDir: string; cacheDir: string; blobDir: string; databaseDir: string }
): Promise<void> {
  clearExternalPersistenceEnvironment();
  process.env.DOK_LOCAL_DATA_DIR = options.dataDir;
  const database = new PGlite(options.databaseDir);
  await database.waitReady;
  const executor: CadV2SqlExecutor = {
    query: async <T extends Record<string, unknown>>(text: string, params: readonly unknown[] = []) => {
      const result = await database.query<T>(text, [...params]);
      return result.rows;
    },
    transaction: async (statements: readonly CadV2SqlStatement[]) => {
      await database.exec("BEGIN");
      try {
        const results: unknown[][] = [];
        for (const statement of statements) {
          const result = await database.query(statement.text, [...(statement.params || [])]);
          results.push(result.rows as unknown[]);
        }
        await database.exec("COMMIT");
        return results;
      } catch (error) {
        await database.exec("ROLLBACK");
        throw error;
      }
    },
  };
  await applyCadV2DurableRepositoryMigration(executor);
  const repository = new CadV2DurableRepository(executor);
  let heartbeatCount = 0;
  const heartbeat = repository.heartbeatJobLease.bind(repository);
  repository.heartbeatJobLease = async (input) => {
    heartbeatCount += 1;
    return heartbeat(input);
  };
  const service = new CadV2DurableService(
    options.cacheDir,
    new FileBlobStorageAdapter(options.blobDir, role === "worker-fault" ? "chunk" : null),
    repository
  );
  try {
    const result = await runNextDurableCadV2Job({
      repository,
      service,
      ownerId: `test-${role}`,
      leaseMs: 3_000,
      maxAttempts: role === "worker-fault" ? 1 : 3,
      baseRetryDelayMs: 10,
      resolveSource: async (claim) => {
        await new Promise((resolve) => setTimeout(resolve, 1_200));
        return resolveDurableCadV2Source(claim);
      },
    });
    process.stdout.write(`WORKER_RESULT:${JSON.stringify({ ...result, heartbeatCount })}\n`);
  } finally {
    await database.close();
  }
}

async function stopChild(child: Awaited<ReturnType<typeof startChild>> | undefined): Promise<void> {
  if (!child) return;
  if (child.process.exitCode !== null || child.process.signalCode !== null) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3_000));
  child.process.kill("SIGTERM");
  const graceful = await Promise.race([child.closed.then(() => true), timeout.then(() => false)]);
  if (graceful) return;
  child.process.kill("SIGKILL");
  await child.closed;
}

async function main(): Promise<void> {
  clearExternalPersistenceEnvironment();
  const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
  const tempRoot = path.join(os.tmpdir(), `cad-v2-luna-http-repro-${runId}`);
  const tempPrefix = `${path.resolve(os.tmpdir())}${path.sep}`;
  if (!path.resolve(tempRoot).startsWith(tempPrefix)) {
    throw new Error("CAD_V2_HTTP_TEST_CLEANUP_GUARD: temporary root escaped os.tmpdir().");
  }
  const dataDir = path.join(tempRoot, "isolated-dok-data");
  const blobDir = path.join(tempRoot, "test-blob-store");
  const databaseDir = path.join(tempRoot, "durable-postgres");
  const publisherCache = path.join(tempRoot, "publisher-cache");
  const readerCache = path.join(tempRoot, "reader-cache");
  const coldReaderCache = path.join(tempRoot, "cold-reader-cache");
  const retryPublisherCache = path.join(tempRoot, "retry-publisher-cache");
  const fileId = `f${crypto.randomUUID().replace(/-/g, "")}`;
  const otherFileId = `f${crypto.randomUUID().replace(/-/g, "")}`;
  const staleFileId = `f${crypto.randomUUID().replace(/-/g, "")}`;
  const shareId = `share_${crypto.randomUUID()}`;
  const otherShareId = `share_${crypto.randomUUID()}`;
  const foreignShareId = `share_${crypto.randomUUID()}`;
  const expiredShareId = `share_${crypto.randomUUID()}`;
  const revokedShareId = `share_${crypto.randomUUID()}`;
  const passwordShareId = `share_${crypto.randomUUID()}`;
  const shareToken = `test_${crypto.randomBytes(24).toString("base64url")}`;
  const otherShareToken = `test_${crypto.randomBytes(24).toString("base64url")}`;
  const foreignShareToken = `test_${crypto.randomBytes(24).toString("base64url")}`;
  const expiredShareToken = `test_${crypto.randomBytes(24).toString("base64url")}`;
  const revokedShareToken = `test_${crypto.randomBytes(24).toString("base64url")}`;
  const passwordShareToken = `test_${crypto.randomBytes(24).toString("base64url")}`;
  const testNow = Date.now();
  const updatedAt = new Date(testNow - 60_000).toISOString();
  const activeShareExpiresAt = new Date(testNow + 24 * 60 * 60_000).toISOString();
  const expiredShareExpiresAt = new Date(testNow - 24 * 60 * 60_000).toISOString();
  const revokedAt = new Date(testNow - 30_000).toISOString();
  const staleUpdatedAt = new Date(testNow).toISOString();
  const publisherPort = await findFreePort();
  let publisher: Awaited<ReturnType<typeof startChild>> | undefined;
  let retryPublisher: Awaited<ReturnType<typeof startChild>> | undefined;
  let reader: Awaited<ReturnType<typeof startChild>> | undefined;

  try {
    fs.mkdirSync(path.join(dataDir, "dok_storage"), { recursive: true });
    fs.mkdirSync(blobDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, "dok_storage", "sample.dxf"), SAMPLE_DXF, "utf-8");
    fs.writeFileSync(path.join(dataDir, "dok_storage", "stale.dxf"), SAMPLE_DXF, "utf-8");
    fs.writeFileSync(
      path.join(dataDir, "dok_db.json"),
      JSON.stringify({
        folders: [],
        files: [
          {
            id: fileId,
            folder_id: null,
            display_name: "sample.dxf",
            blob_pathname: "sample.dxf",
            blob_url: "local:sample.dxf",
            size_bytes: Buffer.byteLength(SAMPLE_DXF),
            mime_type: "application/dxf",
            extension: ".dxf",
            created_at: updatedAt,
            updated_at: updatedAt,
            deleted_at: null,
            current_version_number: 1,
          },
          {
            id: otherFileId,
            folder_id: null,
            display_name: "remote.dxf",
            blob_pathname: "not-found/remote.dxf",
            blob_url: `http://127.0.0.1:${publisherPort}/__test/access-url-canary`,
            size_bytes: Buffer.byteLength(SAMPLE_DXF),
            mime_type: "application/dxf",
            extension: ".dxf",
            created_at: updatedAt,
            updated_at: updatedAt,
            deleted_at: null,
            current_version_number: 1,
          },
          {
            id: staleFileId,
            folder_id: null,
            display_name: "stale.dxf",
            blob_pathname: "stale.dxf",
            blob_url: "local:stale.dxf",
            size_bytes: Buffer.byteLength(SAMPLE_DXF),
            mime_type: "application/dxf",
            extension: ".dxf",
            created_at: updatedAt,
            updated_at: updatedAt,
            deleted_at: null,
            current_version_number: 1,
          },
        ],
        file_versions: [],
        cad_derivatives: [],
        dwg_dxf_derivatives: [],
        shares: [
          {
            id: shareId,
            token_hash: hashShareToken(shareToken),
            title: "isolated CAD test share",
            expires_at: activeShareExpiresAt,
            password_hash: null,
            max_downloads: null,
            download_count: 0,
            created_at: updatedAt,
            revoked_at: null,
            last_accessed_at: null,
          },
          {
            id: otherShareId,
            token_hash: hashShareToken(otherShareToken),
            title: "unrelated isolated CAD test share",
            expires_at: activeShareExpiresAt,
            password_hash: null,
            max_downloads: null,
            download_count: 0,
            created_at: updatedAt,
            revoked_at: null,
            last_accessed_at: null,
          },
          {
            id: foreignShareId,
            token_hash: hashShareToken(foreignShareToken),
            title: "foreign isolated CAD test share",
            expires_at: activeShareExpiresAt,
            password_hash: null,
            max_downloads: null,
            download_count: 0,
            created_at: updatedAt,
            revoked_at: null,
            last_accessed_at: null,
          },
          {
            id: expiredShareId,
            token_hash: hashShareToken(expiredShareToken),
            title: "expired isolated CAD test share",
            expires_at: expiredShareExpiresAt,
            password_hash: null,
            max_downloads: null,
            download_count: 0,
            created_at: updatedAt,
            revoked_at: null,
            last_accessed_at: null,
          },
          {
            id: revokedShareId,
            token_hash: hashShareToken(revokedShareToken),
            title: "revoked isolated CAD test share",
            expires_at: activeShareExpiresAt,
            password_hash: null,
            max_downloads: null,
            download_count: 0,
            created_at: updatedAt,
            revoked_at: revokedAt,
            last_accessed_at: null,
          },
          {
            id: passwordShareId,
            token_hash: hashShareToken(passwordShareToken),
            title: "password protected isolated CAD test share",
            expires_at: activeShareExpiresAt,
            password_hash: "test-password-hash",
            max_downloads: null,
            download_count: 0,
            created_at: updatedAt,
            revoked_at: null,
            last_accessed_at: null,
          },
        ],
        share_items: [
          {
            id: `item_${crypto.randomUUID()}`,
            share_link_id: shareId,
            file_id: fileId,
            file_version_id: null,
            snapshot_name: "sample.dxf",
            relative_path: "sample.dxf",
            snapshot_size_bytes: Buffer.byteLength(SAMPLE_DXF),
            snapshot_mime_type: "application/dxf",
            sort_order: 0,
          },
          {
            id: `item_${crypto.randomUUID()}`,
            share_link_id: otherShareId,
            file_id: fileId,
            file_version_id: null,
            snapshot_name: "sample.dxf",
            relative_path: "sample.dxf",
            snapshot_size_bytes: Buffer.byteLength(SAMPLE_DXF),
            snapshot_mime_type: "application/dxf",
            sort_order: 0,
          },
          {
            id: `item_${crypto.randomUUID()}`,
            share_link_id: foreignShareId,
            file_id: otherFileId,
            file_version_id: null,
            snapshot_name: "remote.dxf",
            relative_path: "remote.dxf",
            snapshot_size_bytes: Buffer.byteLength(SAMPLE_DXF),
            snapshot_mime_type: "application/dxf",
            sort_order: 0,
          },
          ...[expiredShareId, revokedShareId, passwordShareId].map((shareLinkId) => ({
            id: `item_${crypto.randomUUID()}`,
            share_link_id: shareLinkId,
            file_id: fileId,
            file_version_id: null,
            snapshot_name: "sample.dxf",
            relative_path: "sample.dxf",
            snapshot_size_bytes: Buffer.byteLength(SAMPLE_DXF),
            snapshot_mime_type: "application/dxf",
            sort_order: 0,
          })),
          {
            id: `item_${crypto.randomUUID()}`,
            share_link_id: otherShareId,
            file_id: otherFileId,
            file_version_id: null,
            snapshot_name: "remote.dxf",
            relative_path: "remote.dxf",
            snapshot_size_bytes: Buffer.byteLength(SAMPLE_DXF),
            snapshot_mime_type: "application/dxf",
            sort_order: 0,
          },
        ],
        activity_log: [],
      }, null, 2),
      "utf-8"
    );

    publisher = await startChild("publisher", {
      port: publisherPort,
      dataDir,
      cacheDir: publisherCache,
      blobDir,
      databaseDir,
    });

    const prepareResponse = await fetch(`http://127.0.0.1:${publisherPort}/api/dokumantasyon/cad-v2/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        fileId,
        expectedSourceVersionKey: `${fileId}_${updatedAt}`,
        clientRequestId: crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const prepareBody = await prepareResponse.json() as Record<string, any>;

    const sourceSha256 = crypto.createHash("sha256").update(SAMPLE_DXF).digest("hex");
    const sceneId = String(prepareBody.sceneId || computeSceneIdentity({
      fileId,
      sourceSha256,
      authoritativeRevision: `${fileId}_${updatedAt}`,
      tenantScope: "global",
      fontDigest: FontLayoutEngine.getFontDigest(),
    }).sceneId);
    let jobBody: Record<string, any> | null = null;
    if (prepareBody.jobId) {
      const jobResponse = await fetch(
        `${publisher.baseUrl}/api/dokumantasyon/cad-v2/jobs/${encodeURIComponent(prepareBody.jobId)}`,
        { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
      );
      jobBody = await jobResponse.json() as Record<string, any>;
    }

    await stopChild(publisher);
    publisher = undefined;

    const faultWorkerResult = await runWorkerChild("worker-fault", {
      dataDir,
      cacheDir: publisherCache,
      blobDir,
      databaseDir,
    });

    const readerPort = await findFreePort();
    reader = await startChild("reader", { port: readerPort, dataDir, cacheDir: readerCache, blobDir, databaseDir });
    const manifestResponse = await fetch(
      `${reader.baseUrl}/api/dokumantasyon/cad-v2/scenes/${encodeURIComponent(sceneId)}/manifest`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const firstChunkId = "chunk_model_001";
    const chunkResponse = await fetch(
      `${reader.baseUrl}/api/dokumantasyon/cad-v2/scenes/${encodeURIComponent(sceneId)}/chunks/${encodeURIComponent(firstChunkId)}`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const manifestStatus = manifestResponse.status;
    const chunkStatus = chunkResponse.status;
    await stopChild(reader);
    reader = undefined;

    const retryPublisherPort = await findFreePort();
    retryPublisher = await startChild("publisher-retry", {
      port: retryPublisherPort,
      dataDir,
      cacheDir: retryPublisherCache,
      blobDir,
      databaseDir,
    });

    const publicPrepareResponse = await fetch(`${retryPublisher.baseUrl}/api/public/cad-v2/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        shareToken,
        fileId,
        expectedSourceVersionKey: `${fileId}_${updatedAt}`,
        clientRequestId: crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const publicPrepareBody = await publicPrepareResponse.json() as Record<string, any>;

    const canaryUrl = `${retryPublisher.baseUrl}/__test/access-url-canary`;
    const accessUrlPrepareResponse = await fetch(`${retryPublisher.baseUrl}/api/public/cad-v2/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        shareToken: otherShareToken,
        fileId: otherFileId,
        expectedSourceVersionKey: `${otherFileId}_${updatedAt}`,
        clientRequestId: crypto.randomUUID(),
        accessUrl: canaryUrl,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const adminAccessUrlPrepareResponse = await fetch(`${retryPublisher.baseUrl}/api/dokumantasyon/cad-v2/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        fileId: otherFileId,
        expectedSourceVersionKey: `${otherFileId}_${updatedAt}`,
        clientRequestId: crypto.randomUUID(),
        accessUrl: canaryUrl,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const stalePrepareResponse = await fetch(`${retryPublisher.baseUrl}/api/dokumantasyon/cad-v2/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        fileId: staleFileId,
        expectedSourceVersionKey: `${staleFileId}_${updatedAt}`,
        clientRequestId: crypto.randomUUID(),
        accessUrl: canaryUrl,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const stalePrepareBody = await stalePrepareResponse.json() as Record<string, unknown>;
    const staleDokDbPath = path.join(dataDir, "dok_db.json");
    const staleDokDb = JSON.parse(fs.readFileSync(staleDokDbPath, "utf-8")) as {
      files: Array<{ id: string; updated_at: string }>;
    };
    const staleFileRecord = staleDokDb.files.find((file) => file.id === staleFileId);
    staleFileRecord.updated_at = staleUpdatedAt;
    fs.writeFileSync(staleDokDbPath, JSON.stringify(staleDokDb, null, 2), "utf-8");
    const canaryCountResponse = await fetch(`${retryPublisher.baseUrl}/__test/access-url-canary-count`, {
      headers: { Connection: "close" },
      signal: AbortSignal.timeout(8_000),
    });
    const canaryCount = await canaryCountResponse.json() as { hits: number };

    await stopChild(retryPublisher);
    retryPublisher = undefined;

    const successWorkerResult = await runWorkerChild("worker-success", {
      dataDir,
      cacheDir: retryPublisherCache,
      blobDir,
      databaseDir,
    });
    const staleWorkerResult = await runWorkerChild("worker-success", {
      dataDir,
      cacheDir: retryPublisherCache,
      blobDir,
      databaseDir,
    });

    const coldReaderPort = await findFreePort();
    reader = await startChild("reader", {
      port: coldReaderPort,
      dataDir,
      cacheDir: coldReaderCache,
      blobDir,
      databaseDir,
    });
    const completedManifestResponse = await fetch(
      `${reader.baseUrl}/api/dokumantasyon/cad-v2/scenes/${encodeURIComponent(sceneId)}/manifest`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const completedManifest = await completedManifestResponse.json() as Record<string, any>;
    const completedChunkResponse = await fetch(
      `${reader.baseUrl}/api/dokumantasyon/cad-v2/scenes/${encodeURIComponent(sceneId)}/chunks/${encodeURIComponent(completedManifest.chunks?.[0]?.chunkId || firstChunkId)}`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const coldPublicManifestResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/scenes/${encodeURIComponent(sceneId)}/manifest?shareToken=${encodeURIComponent(shareToken)}`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const coldPublicChunkResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/scenes/${encodeURIComponent(sceneId)}/chunks/${encodeURIComponent(completedManifest.chunks?.[0]?.chunkId || firstChunkId)}?shareToken=${encodeURIComponent(shareToken)}`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const indexId = String(completedManifest.indexPages?.[0]?.indexId || "");
    const metadataId = String(completedManifest.metadataPages?.[0]?.metadataId || "");
    const coldPublicIndexResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/scenes/${encodeURIComponent(sceneId)}/indexes/${encodeURIComponent(indexId)}?shareToken=${encodeURIComponent(shareToken)}`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const coldPublicMetadataResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/scenes/${encodeURIComponent(sceneId)}/metadata/${encodeURIComponent(metadataId)}?shareToken=${encodeURIComponent(shareToken)}`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const staleSceneId = computeSceneIdentity({
      fileId: staleFileId,
      sourceSha256: crypto.createHash("sha256").update(SAMPLE_DXF).digest("hex"),
      authoritativeRevision: `${staleFileId}_${updatedAt}`,
      tenantScope: "global",
      fontDigest: FontLayoutEngine.getFontDigest(),
    }).sceneId;
    const staleManifestResponse = await fetch(
      `${reader.baseUrl}/api/dokumantasyon/cad-v2/scenes/${encodeURIComponent(staleSceneId)}/manifest`,
      { headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );

    const sessionId = String(publicPrepareBody.viewSessionId || "");
    const invalidShareCases = [
      { name: "foreign", token: foreignShareToken, expectedStatus: 403 },
      { name: "expired", token: expiredShareToken, expectedStatus: 410 },
      { name: "revoked", token: revokedShareToken, expectedStatus: 410 },
      { name: "password", token: passwordShareToken, expectedStatus: 401 },
    ] as const;
    const shareRouteAuthorization = await Promise.all(invalidShareCases.map(async (shareCase) => {
      const headers = { "x-share-token": shareCase.token, Connection: "close" };
      const [manifest, job, heartbeat, deletion] = await Promise.all([
        fetch(`${reader!.baseUrl}/api/public/cad-v2/scenes/${encodeURIComponent(sceneId)}/manifest`, {
          headers, signal: AbortSignal.timeout(8_000),
        }),
        jobBody?.jobId
          ? fetch(`${reader!.baseUrl}/api/public/cad-v2/jobs/${encodeURIComponent(jobBody.jobId)}`, {
              headers, signal: AbortSignal.timeout(8_000),
            })
          : Promise.resolve(null),
        fetch(`${reader!.baseUrl}/api/public/cad-v2/view-sessions/${encodeURIComponent(sessionId)}/heartbeat`, {
          method: "POST", headers, signal: AbortSignal.timeout(8_000),
        }),
        fetch(`${reader!.baseUrl}/api/public/cad-v2/view-sessions/${encodeURIComponent(sessionId)}`, {
          method: "DELETE", headers, signal: AbortSignal.timeout(8_000),
        }),
      ]);
      return {
        name: shareCase.name,
        expectedStatus: shareCase.expectedStatus,
        manifestStatus: manifest.status,
        jobStatus: job?.status ?? null,
        heartbeatStatus: heartbeat.status,
        deleteStatus: deletion.status,
      };
    }));
    const strangerHeartbeatResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/view-sessions/${encodeURIComponent(sessionId)}/heartbeat`,
      { method: "POST", headers: { "x-share-token": otherShareToken, Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const crossOriginOwnerHeartbeatResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/view-sessions/${encodeURIComponent(sessionId)}/heartbeat`,
      { method: "POST", headers: { "x-share-token": shareToken, Origin: "https://attacker.example", Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const strangerDeleteResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/view-sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE", headers: { "x-share-token": otherShareToken, Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );
    const ownerHeartbeatResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/view-sessions/${encodeURIComponent(sessionId)}/heartbeat`,
      { method: "POST", headers: { "x-share-token": shareToken, Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );

    const jobStatusResponse = jobBody?.jobId
      ? await fetch(`${reader.baseUrl}/api/public/cad-v2/jobs/${encodeURIComponent(jobBody.jobId)}?shareToken=${encodeURIComponent(shareToken)}`, {
          headers: { Connection: "close" }, signal: AbortSignal.timeout(8_000),
        })
      : null;
    const ownerDeleteResponse = await fetch(
      `${reader.baseUrl}/api/public/cad-v2/view-sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE", headers: { "x-share-token": shareToken, Connection: "close" }, signal: AbortSignal.timeout(8_000) }
    );

    const evidence = {
      runId,
      candidate: {
        head: "4b51ebe6b1470c6a247e03158dfe4b5359621c97",
        workingTree: "dirty",
        compilerRevision: CAD_V2_COMPILER_REVISION,
      },
      isolation: "temporary persistent PGlite PostgreSQL + file-backed test Blob; prepare, fault worker, retry worker and cold-reader are separate processes; no production credentials or data",
      injectedFault: "first immutable .bin upload rejects before the manifest commit pointer is published",
      prepareHttpStatus: prepareResponse.status,
      prepareStatus: prepareBody.status,
      sceneId,
      jobStatusBeforeWorker: jobBody?.status || null,
      faultWorkerResult,
      manifestHttpStatus: manifestStatus,
      firstChunkId,
      chunkHttpStatus: chunkStatus,
      completedColdRead: {
        manifestHttpStatus: completedManifestResponse.status,
        chunkHttpStatus: completedChunkResponse.status,
        chunkBytes: completedChunkResponse.ok ? Number(completedChunkResponse.headers.get("content-length")) : null,
      },
      coldPublicShare: {
        manifestHttpStatus: coldPublicManifestResponse.status,
        chunkHttpStatus: coldPublicChunkResponse.status,
        indexHttpStatus: coldPublicIndexResponse.status,
        metadataHttpStatus: coldPublicMetadataResponse.status,
      },
      publicJobReadStatus: jobStatusResponse?.status ?? null,
      shareAuthorization: shareRouteAuthorization,
      publicSessionPrepare: {
        httpStatus: publicPrepareResponse.status,
        status: publicPrepareBody.status,
      },
      successWorkerResult,
      staleSourceQueue: {
        prepareHttpStatus: stalePrepareResponse.status,
        prepareStatus: stalePrepareBody.status,
        workerResult: staleWorkerResult,
        manifestHttpStatus: staleManifestResponse.status,
      },
      sessionAuthorization: {
        strangerHeartbeatStatus: strangerHeartbeatResponse.status,
        strangerDeleteStatus: strangerDeleteResponse.status,
        crossOriginOwnerHeartbeatStatus: crossOriginOwnerHeartbeatResponse.status,
        ownerHeartbeatStatus: ownerHeartbeatResponse.status,
        ownerDeleteStatus: ownerDeleteResponse.status,
      },
      callerSuppliedAccessUrl: {
        publicResponseStatus: accessUrlPrepareResponse.status,
        adminResponseStatus: adminAccessUrlPrepareResponse.status,
        canaryHits: canaryCount.hits,
      },
      result: prepareBody.status === "ready" && manifestStatus === 200 && chunkStatus === 404
        ? "REPRODUCED_READY_THEN_CHUNK_404"
        : jobBody?.status === "queued" && faultWorkerResult.status === "failed" && manifestStatus === 404 && chunkStatus === 404
          ? "QUEUED_THEN_FAIL_CLOSED_AFTER_INJECTED_WORKER_PUBLISH_FAILURE"
          : "UNEXPECTED_PARTIAL_PUBLISH_STATE",
    };

    const evidenceDir = path.join(process.cwd(), "test-output", "cad-v2-luna", runId);
    fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(path.join(evidenceDir, "prepare-chunk-404-repro.json"), JSON.stringify(evidence, null, 2));
    process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);

    assert.notEqual(
      prepareBody.status,
      "ready",
      `prepare returned ready despite an uploaded manifest and missing chunk: ${JSON.stringify(evidence)}`
    );
    assert.equal(jobBody?.status, "queued", "prepare must persist work without compiling in the request process");
    assert.equal(faultWorkerResult.status, "failed", "an incomplete object-set publication must fail its worker attempt");
    assert.notEqual(manifestStatus, 200, "an incomplete object set must not expose a ready manifest");
    assert.equal(chunkStatus, 404, "a missing immutable chunk must remain missing while no manifest is published");
    assert.equal(publicPrepareResponse.status, 202, "public prepare must queue work and return before compilation");
    assert.equal(successWorkerResult.status, "ready", "a separate worker process must publish the queued retry");
    assert.ok(Number(successWorkerResult.heartbeatCount) >= 1, "the worker must renew its lease while resolving the queued source");
    assert.equal(stalePrepareResponse.status, 202, "admin prepare with an accessUrl override must still queue its stored source");
    assert.equal(staleWorkerResult.status, "failed", "worker must reject a source whose authoritative revision changed after prepare");
    assert.match(String(staleWorkerResult.error), /CAD_V2_SOURCE_REVISION_CHANGED/);
    assert.equal(staleManifestResponse.status, 404, "stale source must not publish a READY manifest");
    assert.equal(completedManifestResponse.status, 200, "a separate reader must see the committed manifest");
    assert.equal(completedChunkResponse.status, 200, "a separate reader must read the exact generation's chunk");
    assert.equal(coldPublicManifestResponse.status, 200, "a valid cold share must read the manifest through a new route process");
    assert.equal(coldPublicChunkResponse.status, 200, "a valid cold share must read a chunk through a new route process");
    assert.equal(coldPublicIndexResponse.status, 200, "a valid cold share must read durable index objects");
    assert.equal(coldPublicMetadataResponse.status, 200, "a valid cold share must read durable metadata objects");
    assert.equal(jobStatusResponse?.status, 200, "a valid cold share can read a durable job through the public route");
    for (const check of shareRouteAuthorization) {
      assert.equal(check.manifestStatus, check.expectedStatus, `${check.name} share must be denied on manifest route`);
      assert.equal(check.jobStatus, check.expectedStatus, `${check.name} share must be denied on job route`);
      assert.equal(check.heartbeatStatus, check.expectedStatus, `${check.name} share must be denied on heartbeat route`);
      assert.equal(check.deleteStatus, check.expectedStatus, `${check.name} share must be denied on DELETE route`);
    }
    assert.equal(strangerHeartbeatResponse.status, 403, "a different share cannot extend this view session");
    assert.equal(strangerDeleteResponse.status, 403, "a different share cannot delete this view session");
    assert.equal(crossOriginOwnerHeartbeatResponse.status, 403, "credentialed cross-origin mutation must be rejected");
    assert.equal(ownerHeartbeatResponse.status, 200, "the owning share can still use the view session");
    assert.equal(ownerDeleteResponse.status, 204, "the owning share can delete its durable view session");
    assert.equal(canaryCount.hits, 0, "public and admin prepare must ignore caller-supplied accessUrl values");
  } finally {
    await stopChild(reader);
    await stopChild(retryPublisher);
    await stopChild(publisher);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function mainEntry(): Promise<void> {
  const role = getArg("--role");
  if (role === "worker-fault" || role === "worker-success") {
    const dataDir = getArg("--data");
    const cacheDir = getArg("--cache");
    const blobDir = getArg("--blob");
    const databaseDir = getArg("--db");
    if (!dataDir || !cacheDir || !blobDir || !databaseDir) throw new Error("Incomplete child worker arguments.");
    await runWorkerProcess(role, { dataDir, cacheDir, blobDir, databaseDir });
    return;
  }
  if (role === "publisher" || role === "publisher-retry" || role === "reader") {
    const port = Number(getArg("--port"));
    const dataDir = getArg("--data");
    const cacheDir = getArg("--cache");
    const blobDir = getArg("--blob");
    const databaseDir = getArg("--db");
    if (!port || !dataDir || !cacheDir || !blobDir || !databaseDir) throw new Error("Incomplete child server arguments.");
    await startRouteServer(role, { port, dataDir, cacheDir, blobDir, databaseDir });
    return;
  }

  await main();
}

mainEntry().catch((error) => {
  console.error("prepare-chunk-404-repro failed:", error);
  process.exitCode = 1;
  process.exit(process.exitCode);
});
