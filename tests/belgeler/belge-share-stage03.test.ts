import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { GET as quotaGetRoute, POST as quotaPostRoute } from "../../src/app/api/belgeler/paylasim/kota/route";
import { POST as createShareRoute } from "../../src/app/api/belgeler/paylasim/route";
import {
  BROWSER_ID_COOKIE_NAME,
  BROWSER_ID_COOKIE_PATH,
  bootstrapBrowserIdentity,
  getBelgeShareEnvironmentKey,
  getBrowserIdentity,
  getIstanbulQuotaWindow,
} from "../../src/lib/belge-paylasim/browser-identity";
import {
  bootstrapBrowserShareQuota,
  BrowserBootstrapError,
  coordinateBrowserBootstrap,
} from "../../src/lib/belge-paylasim/browser-bootstrap";
import {
  MemoryBelgePaylasimRepository,
  NeonBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const originalEnvironment = {
  nodeEnv: process.env.NODE_ENV,
  vercel: process.env.VERCEL,
  vercelEnv: process.env.VERCEL_ENV,
  belgeShareSecret: process.env.BELGE_SHARE_SECRET,
};

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) Reflect.deleteProperty(process.env, name);
  else Reflect.set(process.env, name, value);
}

function assertSafeCookieMatch(value: string, pattern: RegExp, message: string): void {
  assert.ok(pattern.test(value), message);
}

function requestFor(pathname: string, options: { cookie?: string; host?: string; headers?: Record<string, string> } = {}): Request {
  const host = options.host ?? "localhost:3000";
  return new Request(`http://${host}${pathname}`, {
    headers: {
      host,
      origin: `http://${host}`,
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.headers ?? {}),
    },
  });
}

async function bootstrapCookie(host = "localhost:3000"): Promise<string> {
  const response = await quotaPostRoute(new Request(`http://${host}/api/belgeler/paylasim/kota`, {
    method: "POST",
    headers: { host, origin: `http://${host}` },
  }));
  assert.equal(response.status, 200);
  const value = response.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(value);
  return value;
}

afterEach(() => {
  setBelgePaylasimRepositoryForTest(null);
  restoreEnvironmentValue("VERCEL", originalEnvironment.vercel);
  restoreEnvironmentValue("VERCEL_ENV", originalEnvironment.vercelEnv);
  restoreEnvironmentValue("BELGE_SHARE_SECRET", originalEnvironment.belgeShareSecret);
  restoreEnvironmentValue("NODE_ENV", originalEnvironment.nodeEnv);
});

test("ASAMA_03: bootstrap 256-bit imzalı HttpOnly cookie verir; host-only/path/SameSite ve local Secure istisnası doğrudur", async () => {
  const response = await quotaPostRoute(requestFor("/api/belgeler/paylasim/kota", { host: "localhost:3000" }));
  assert.equal(response.status, 200);
  const body = await response.json() as Record<string, unknown>;
  assert.equal(body.status, "cookie_issued");

  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  const cookiePair = setCookie.split(";", 1)[0]!;
  const cookieValue = cookiePair.slice(cookiePair.indexOf("=") + 1);
  assertSafeCookieMatch(cookieValue, /^v1\.[A-Za-z0-9_-]{43}\.\d{10}\.\d{10}\.[A-Za-z0-9_-]{43}$/, "cookie biçimi sürümlü ve 256-bit olmalı");
  assertSafeCookieMatch(setCookie, new RegExp(`^${BROWSER_ID_COOKIE_NAME}=`), "cookie adı sabit olmalı");
  assertSafeCookieMatch(setCookie, new RegExp(`Path=${BROWSER_ID_COOKIE_PATH.replaceAll("/", "\\/")}`), "cookie paylaşım API path'ine sınırlandırılmalı");
  assertSafeCookieMatch(setCookie, /; HttpOnly/i, "cookie HttpOnly olmalı");
  assertSafeCookieMatch(setCookie, /; SameSite=Lax/i, "cookie SameSite=Lax olmalı");
  assertSafeCookieMatch(setCookie, /; Max-Age=3153\d{4}/i, "cookie süresi bir yıl olmalı");
  assert.ok(!/; Domain=/i.test(setCookie), "cookie host-only olmalı");
  assert.ok(!/; Secure/i.test(setCookie), "yerel HTTP cookie'si Secure olmamalı");
  assert.ok(!JSON.stringify(body).includes(cookieValue), "bootstrap yanıtı cookie değerini taşımamalı");

  const crossSite = await quotaPostRoute(new Request("http://localhost:3000/api/belgeler/paylasim/kota", {
    method: "POST",
    headers: { host: "localhost:3000", origin: "https://evil.example.test" },
  }));
  assert.equal(crossSite.status, 403);
  assert.equal(crossSite.headers.has("set-cookie"), false);

  const secureResponse = await (async () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    process.env.BELGE_SHARE_SECRET = "isolated-stage03-test-secret-32-bytes-minimum";
    return quotaPostRoute(requestFor("/api/belgeler/paylasim/kota", { host: "preview.example.test" }));
  })();
  assertSafeCookieMatch(secureResponse.headers.get("set-cookie") ?? "", /; Secure/i, "Vercel cookie'si Secure olmalı");

  process.env.NODE_ENV = "production";
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  process.env.BELGE_SHARE_SECRET = "isolated-stage03-test-secret-32-bytes-minimum";
  const productionResponse = await quotaPostRoute(requestFor("/api/belgeler/paylasim/kota", { host: "muhendis.example.test" }));
  const localProductionResponse = await quotaPostRoute(requestFor("/api/belgeler/paylasim/kota", { host: "localhost:3000" }));
  assertSafeCookieMatch(productionResponse.headers.get("set-cookie") ?? "", /; Secure/i, "yerel olmayan production cookie Secure olmalı");
  assert.ok(!/; Secure/i.test(localProductionResponse.headers.get("set-cookie") ?? ""), "localhost production testinde HTTP istisnası korunmalı");
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "development";
  assert.equal(getBelgeShareEnvironmentKey(), "development");
  const vercelDevLocalResponse = await quotaPostRoute(requestFor("/api/belgeler/paylasim/kota", { host: "localhost:3000" }));
  assert.ok(!/; Secure/i.test(vercelDevLocalResponse.headers.get("set-cookie") ?? ""), "localhost vercel dev HTTP cookie istisnası korunmalı");
});

test("ASAMA_03: imza, versiyon, expiry ve kimlik aynı kalırken cookie yenilemesi doğrulanır", () => {
  process.env.NODE_ENV = "test";
  const issuedAt = new Date("2026-10-23T12:00:00.000Z");
  const request = requestFor("/api/belgeler/paylasim/kota", { host: "identity.example.test" });
  const issued = bootstrapBrowserIdentity(request, issuedAt);
  assert.equal(issued.status, "issued");
  assert.ok(issued.cookieValue);
  const cookieHeader = `${BROWSER_ID_COOKIE_NAME}=${issued.cookieValue}`;
  const signedRequest = requestFor("/api/belgeler/paylasim/kota", { host: "identity.example.test", cookie: cookieHeader });
  const original = getBrowserIdentity(signedRequest, issuedAt);
  assert.ok(original);

  const cookieParts = issued.cookieValue!.split(".");
  const signature = cookieParts[4]!;
  cookieParts[4] = `${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`;
  const tampered = cookieParts.join(".");
  assert.equal(getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", {
    host: "identity.example.test",
    cookie: `${BROWSER_ID_COOKIE_NAME}=${tampered}`,
  }), issuedAt), null);
  const nonCanonicalSignature = `${issued.cookieValue!.slice(0, -1)}${issued.cookieValue!.endsWith("A") ? "B" : "A"}`;
  assert.equal(getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", {
    host: "identity.example.test",
    cookie: `${BROWSER_ID_COOKIE_NAME}=${nonCanonicalSignature}`,
  }), issuedAt), null);
  assert.equal(getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", {
    host: "identity.example.test",
    cookie: `${BROWSER_ID_COOKIE_NAME}=v2.${issued.cookieValue!.split(".").slice(1).join(".")}`,
  }), issuedAt), null);

  const renewalTime = new Date(issuedAt.getTime() + 340 * 24 * 60 * 60 * 1000);
  const renewed = bootstrapBrowserIdentity(signedRequest, renewalTime);
  assert.equal(renewed.status, "renewed");
  assert.ok(renewed.cookieValue);
  const renewedIdentity = getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", {
    host: "identity.example.test",
    cookie: `${BROWSER_ID_COOKIE_NAME}=${renewed.cookieValue}`,
  }), renewalTime);
  assert.equal(renewedIdentity?.ownerHash, original.ownerHash);

  const expiredTime = new Date(issued.expiresAt!.getTime() + 1_000);
  assert.equal(getBrowserIdentity(signedRequest, expiredTime), null);
  assert.equal(bootstrapBrowserIdentity(signedRequest, expiredTime).status, "issued");
});

test("ASAMA_03: Istanbul kota günü 00.00'da değişir; host, ortam ve gün ayrımları doğru uygulanır", () => {
  const beforeMidnight = new Date("2026-10-23T20:59:59.000Z");
  const atMidnight = new Date("2026-10-23T21:00:00.000Z");
  const beforeWindow = getIstanbulQuotaWindow(beforeMidnight);
  const nextWindow = getIstanbulQuotaWindow(atMidnight);
  assert.equal(beforeWindow.quotaDay, "2026-10-23");
  assert.equal(beforeWindow.resetAt.toISOString(), "2026-10-23T21:00:00.000Z");
  assert.equal(nextWindow.quotaDay, "2026-10-24");

  const now = new Date("2026-10-23T12:00:00.000Z");
  const issued = bootstrapBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", { host: "same.example.test" }), now);
  const cookie = `${BROWSER_ID_COOKIE_NAME}=${issued.cookieValue}`;
  const base = getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", { host: "same.example.test", cookie }), now);
  const otherHost = getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", { host: "other.example.test", cookie }), now);
  assert.ok(base && otherHost);
  assert.notEqual(base.ownerHash, otherHost.ownerHash);
  assert.equal(getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", { host: "same.example.test", cookie }), atMidnight)?.ownerHash, base.ownerHash);

  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  try {
    assert.equal(getBelgeShareEnvironmentKey(), "preview");
    const preview = getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", { host: "same.example.test", cookie }), now);
    assert.ok(preview);
    assert.notEqual(preview.ownerHash, base.ownerHash);
    assert.equal(preview.environmentKey, "preview");
  } finally {
    restoreEnvironmentValue("VERCEL_ENV", previousVercelEnv);
  }
});

test("ASAMA_03: create POST kimlik yok veya bozuksa 428 döndürür, cookie üretmez ve kayıt açmaz", async () => {
  const repo = new MemoryBelgePaylasimRepository();
  setBelgePaylasimRepositoryForTest(repo);
  const body = JSON.stringify({ clientRequestId: "stage03-no-browser-0001", documentId: "beton-dokum-tutanagi", values: {} });

  const missing = await createShareRoute(new Request("http://localhost:3000/api/belgeler/paylasim", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", origin: "http://localhost:3000" },
    body,
  }));
  assert.equal(missing.status, 428);
  assert.equal((await missing.json() as Record<string, unknown>).code, "BROWSER_ID_REQUIRED");
  assert.equal(missing.headers.has("set-cookie"), false);

  const malformed = await createShareRoute(new Request("http://localhost:3000/api/belgeler/paylasim", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      origin: "http://localhost:3000",
      cookie: `${BROWSER_ID_COOKIE_NAME}=malformed`,
    },
    body,
  }));
  assert.equal(malformed.status, 428);
  assert.equal(repo.getAllRecordsForTest().length, 0);
});

test("ASAMA_03: kota GET cookie echo yapar, aynı tarayıcı sekmelerini birleştirir ve aynı IP'deki ayrı browser'ları ayırır", async () => {
  const repo = new MemoryBelgePaylasimRepository();
  setBelgePaylasimRepositoryForTest(repo);
  const firstCookie = await bootstrapCookie();
  const secondCookie = await bootstrapCookie();
  const now = new Date();
  const firstIdentity = getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", { cookie: firstCookie }), now);
  const secondIdentity = getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", { cookie: secondCookie }), now);
  assert.ok(firstIdentity && secondIdentity);
  assert.notEqual(firstIdentity.ownerHash, secondIdentity.ownerHash);
  repo.setDailyQuotaForTest(firstIdentity.environmentKey, firstIdentity.ownerHash, getIstanbulQuotaWindow(now).quotaDay, {
    usedLinks: 7,
    reservedLinks: 2,
  });

  const headers = { "x-forwarded-for": "203.0.113.40" };
  const tabOne = await quotaGetRoute(requestFor("/api/belgeler/paylasim/kota", { cookie: firstCookie, headers }));
  const tabTwo = await quotaGetRoute(requestFor("/api/belgeler/paylasim/kota", { cookie: firstCookie, headers }));
  const separateBrowser = await quotaGetRoute(requestFor("/api/belgeler/paylasim/kota", { cookie: secondCookie, headers }));
  const quotaOne = (await tabOne.json() as { quota: Record<string, unknown> }).quota;
  const quotaTwo = (await tabTwo.json() as { quota: Record<string, unknown> }).quota;
  const quotaSeparate = (await separateBrowser.json() as { quota: Record<string, unknown> }).quota;
  assert.deepEqual([quotaOne.used, quotaOne.reserved, quotaOne.remaining], [7, 2, 41]);
  assert.deepEqual([quotaTwo.used, quotaTwo.reserved, quotaTwo.remaining], [7, 2, 41]);
  assert.deepEqual([quotaSeparate.used, quotaSeparate.reserved, quotaSeparate.remaining], [0, 0, 50]);
  assert.equal(quotaOne.timeZone, "Europe/Istanbul");
  assert.equal("ownerHash" in quotaOne, false);
  assert.equal(JSON.stringify(quotaOne).includes(firstCookie), false);
  assert.ok(/no-store/.test(tabOne.headers.get("cache-control") ?? ""), "kota yanıtı cache edilmemeli");
});

test("ASAMA_13: kota GET Origin başlığı olmadan aynı Host'u kabul eder, cross-site ve bozuk origin'i reddeder", async () => {
  setBelgePaylasimRepositoryForTest(new MemoryBelgePaylasimRepository());
  const cookie = await bootstrapCookie();
  const url = "http://localhost:3000/api/belgeler/paylasim/kota";
  const headers = { host: "localhost:3000", cookie, "sec-fetch-site": "same-origin" };

  const sameOriginWithoutOrigin = await quotaGetRoute(new Request(url, { headers }));
  assert.equal(sameOriginWithoutOrigin.status, 200);
  assert.equal((await sameOriginWithoutOrigin.json() as { status: string }).status, "ready");

  const mismatchedHost = await quotaGetRoute(new Request(url, {
    headers: { ...headers, host: "evil.example" },
  }));
  assert.equal(mismatchedHost.status, 403);
  assert.equal((await mismatchedHost.json() as { error: string }).error, "INVALID_ORIGIN");

  const crossSiteWithoutOrigin = await quotaGetRoute(new Request(url, {
    headers: { ...headers, "sec-fetch-site": "cross-site" },
  }));
  assert.equal(crossSiteWithoutOrigin.status, 403);
  assert.equal((await crossSiteWithoutOrigin.json() as { error: string }).error, "CROSS_SITE_FORBIDDEN");

  const nullOrigin = await quotaGetRoute(new Request(url, {
    headers: { ...headers, origin: "null" },
  }));
  assert.equal(nullOrigin.status, 403);
  assert.equal((await nullOrigin.json() as { error: string }).error, "INVALID_ORIGIN");
});

test("ASAMA_03: bozuk cookie bootstrap ile değiştirilir; eksik echo 428 verir", async () => {
  const malformedResponse = await quotaPostRoute(requestFor("/api/belgeler/paylasim/kota", {
    cookie: `${BROWSER_ID_COOKIE_NAME}=broken-value`,
  }));
  assert.equal((await malformedResponse.json() as Record<string, unknown>).status, "cookie_issued");
  const replacement = malformedResponse.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(replacement);
  assert.ok(replacement !== `${BROWSER_ID_COOKIE_NAME}=broken-value`, "bozuk cookie yenisiyle değiştirilmelidir");
  assert.equal((await quotaGetRoute(requestFor("/api/belgeler/paylasim/kota"))).status, 428);
});

test("ASAMA_03: PGlite repository kota sayacını doğru env/owner/day satırından SELECT eder ve boş satırı ayırt eder", async () => {
  const files = [
    "001_dokumantasyon_base.sql",
    "002_upload_integrity.sql",
    "004_cad_aps_derivatives.sql",
    "005_belge_paylasim.sql",
    "006_belge_paylasim_v3_runtime.sql",
    "007_belge_paylasim_token_key_version.sql",
    "008_belge_paylasim_atomic_quota.sql",
    "009_belge_paylasim_cleanup_queue.sql",
  ];
  const database = new PGlite();
  const statements: string[] = [];
  try {
    for (const file of files) {
      await database.exec(await readFile(path.join(projectRoot, "db/migrations", file), "utf8"));
    }
    const queryClient = Object.assign(
      async (parts: TemplateStringsArray, ...values: unknown[]) => {
        let statement = parts[0] ?? "";
        for (let index = 0; index < values.length; index += 1) statement += `$${index + 1}${parts[index + 1] ?? ""}`;
        statements.push(statement);
        const result = await database.query(statement, values as never[]);
        return result.rows;
      },
      {
        async query(statement: string) {
          statements.push(statement);
          return (await database.query(statement)).rows;
        },
      }
    ) as unknown as NeonQueryFunction<false, false>;
    const repository = new NeonBelgePaylasimRepository(undefined, queryClient);
    const ownerHash = "a".repeat(64);
    const databaseDay = await database.query<{ quota_day: string }>(
      "SELECT (NOW() AT TIME ZONE 'Europe/Istanbul')::date::text AS quota_day"
    );
    const quotaDay = databaseDay.rows[0]?.quota_day;
    assert.ok(quotaDay);
    await database.query(
      `INSERT INTO belge_paylasim_daily_quotas (environment_key, owner_hash, quota_day, used_links, reserved_links)
       VALUES ('preview', $1, $2::date, 11, 3)`,
      [ownerHash, quotaDay]
    );

    const populated = await repository.getDailyQuota("preview", ownerHash);
    assert.deepEqual([populated.usedLinks, populated.reservedLinks, populated.quotaDay], [11, 3, quotaDay]);
    assert.ok(Number.isFinite(populated.serverNow.getTime()));
    assert.ok(Number.isFinite(populated.resetAt.getTime()));
    assert.equal(populated.resetAt.toISOString(), getIstanbulQuotaWindow(populated.serverNow).resetAt.toISOString());
    const empty = await repository.getDailyQuota("preview", "b".repeat(64));
    assert.deepEqual([empty.usedLinks, empty.reservedLinks, empty.quotaDay], [0, 0, quotaDay]);
    const reads = statements.filter((statement) => /(?:FROM|JOIN)\s+belge_paylasim_daily_quotas/i.test(statement));
    assert.equal(reads.length, 2);
    assert.ok(reads.every((statement) => /^\s*WITH\b/i.test(statement) && /\bSELECT\b/i.test(statement)));
    assert.doesNotMatch(reads.join("\n"), /\b(INSERT|UPDATE|DELETE)\b/i);
  } finally {
    await database.close();
  }
});

class FakeChannelHub {
  private readonly channels = new Set<FakeBroadcastChannel>();

  create = () => {
    const channel = new FakeBroadcastChannel(this);
    this.channels.add(channel);
    return channel;
  };

  remove(channel: FakeBroadcastChannel): void {
    this.channels.delete(channel);
  }

  broadcast(sender: FakeBroadcastChannel, message: unknown): void {
    for (const channel of this.channels) {
      if (channel === sender) continue;
      queueMicrotask(() => channel.dispatch(message));
    }
  }
}

class FakeBroadcastChannel {
  private listeners = new Set<(event: { data: unknown }) => void>();

  constructor(private readonly hub: FakeChannelHub) {}

  addEventListener(_type: "message", listener: (event: { data: unknown }) => void): void {
    this.listeners.add(listener);
  }

  postMessage(message: unknown): void {
    this.hub.broadcast(this, message);
  }

  dispatch(message: unknown): void {
    for (const listener of this.listeners) listener({ data: message });
  }

  close(): void {
    this.hub.remove(this);
  }
}

test("ASAMA_03: Web Locks olmayan iki sekmede BroadcastChannel tek ilk cookie mint eder ve ikisi de cookie echo ile kotayı okur", async () => {
  const hub = new FakeChannelHub();
  let cookieAccepted = false;
  let mintCount = 0;
  let echoCount = 0;
  const fetcher: typeof fetch = async (_input, init) => {
    if (init?.method === "POST") {
      if (!cookieAccepted) {
        mintCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        cookieAccepted = true;
      }
      return Response.json({ status: "cookie_issued" });
    }
    echoCount += 1;
    if (!cookieAccepted) return Response.json({ error: "BROWSER_ID_REQUIRED" }, { status: 428 });
    return Response.json({
      status: "ready",
      quota: {
        limit: 50,
        used: 1,
        reserved: 0,
        remaining: 49,
        quotaDay: "2026-10-23",
        serverNow: "2026-10-23T12:00:00.000Z",
        resetAt: "2026-10-23T21:00:00.000Z",
        timeZone: "Europe/Istanbul",
      },
    });
  };
  const dependencies = (randomTabId: string) => ({
    lockManager: null,
    createChannel: hub.create,
    randomTabId: () => randomTabId,
    settleDelayMs: 40,
    timeoutMs: 500,
  });
  const results = await Promise.all([
    bootstrapBrowserShareQuota(fetcher, dependencies("tab-a")),
    bootstrapBrowserShareQuota(fetcher, dependencies("tab-b")),
  ]);
  assert.deepEqual(results.map((quota) => [quota.used, quota.remaining]), [[1, 49], [1, 49]]);
  assert.equal(mintCount, 1);
  assert.equal(echoCount, 2);
});

test("ASAMA_03: lider bootstrap hata verirse bekleyen sekmeler ikinci paralel mint başlatmaz", async () => {
  const hub = new FakeChannelHub();
  let runCount = 0;
  const run = async () => {
    runCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    throw new Error("isolated bootstrap failure");
  };
  const dependencies = (randomTabId: string) => ({
    lockManager: null,
    createChannel: hub.create,
    randomTabId: () => randomTabId,
    settleDelayMs: 40,
    timeoutMs: 500,
  });
  const outcomes = await Promise.allSettled([
    coordinateBrowserBootstrap(run, dependencies("tab-a")),
    coordinateBrowserBootstrap(run, dependencies("tab-b")),
  ]);
  assert.equal(runCount, 1);
  assert.deepEqual(outcomes.map((outcome) => outcome.status), ["rejected", "rejected"]);
});

test("ASAMA_03: cookie reddi en çok iki bootstrap/echo denemesinde açıklanır; sonsuz döngü yoktur", async () => {
  let posts = 0;
  let gets = 0;
  const fetcher: typeof fetch = async (_input, init) => {
    if (init?.method === "POST") {
      posts += 1;
      return Response.json({ status: "cookie_issued" });
    }
    gets += 1;
    return Response.json({ error: "BROWSER_ID_REQUIRED" }, { status: 428 });
  };
  await assert.rejects(
    bootstrapBrowserShareQuota(fetcher, { lockManager: { request: (_name, callback) => callback() } }),
    (caught: unknown) => caught instanceof BrowserBootstrapError && caught.code === "COOKIE_UNAVAILABLE"
  );
  assert.deepEqual([posts, gets], [2, 2]);
});

test("ASAMA_03: GET cookie echo sonrası kota aggregate'ini döndürür; endpoint POST bootstrap yanıtı kimliği açığa çıkarmaz", async () => {
  const repo = new MemoryBelgePaylasimRepository();
  setBelgePaylasimRepositoryForTest(repo);
  const cookie = await bootstrapCookie();
  const identity = getBrowserIdentity(requestFor("/api/belgeler/paylasim/kota", { cookie }));
  assert.ok(identity);
  repo.setDailyQuotaForTest(identity.environmentKey, identity.ownerHash, getIstanbulQuotaWindow().quotaDay, { usedLinks: 1, reservedLinks: 0 });
  const response = await quotaGetRoute(requestFor("/api/belgeler/paylasim/kota", { cookie }));
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.ok(/"used":1/.test(body), "kota aggregate'i dönmeli");
  assert.ok(!/ownerHash|belge_share_browser_v1|v1\.[A-Za-z0-9_-]{43}/.test(body), "response kimliği açığa çıkarmamalı");
});

test("ASAMA_03: DB yokken kota GET 503 verir; eksik tabloyu bellekten boş quota diye uydurmaz", async () => {
  const databaseNames = Object.keys(process.env).filter((name) =>
    /DATABASE|POSTGRES|NEON|^PG(HOST|USER|PASSWORD|DATABASE)$/i.test(name),
  );
  const savedValues = new Map(databaseNames.map((name) => [name, process.env[name]]));
  const previousVercel = process.env.VERCEL;
  try {
    for (const name of databaseNames) delete process.env[name];
    delete process.env.VERCEL;
    setBelgePaylasimRepositoryForTest(null);
    const cookie = await bootstrapCookie();
    const response = await quotaGetRoute(requestFor("/api/belgeler/paylasim/kota", { cookie }));
    assert.equal(response.status, 503);
    assert.equal((await response.json() as Record<string, unknown>).error, "DATABASE_NOT_CONFIGURED");
  } finally {
    setBelgePaylasimRepositoryForTest(null);
    restoreEnvironmentValue("VERCEL", previousVercel);
    for (const name of databaseNames) restoreEnvironmentValue(name, savedValues.get(name));
  }
});
