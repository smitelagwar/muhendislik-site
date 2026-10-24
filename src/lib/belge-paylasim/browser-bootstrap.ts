export interface BrowserShareQuotaSnapshot {
  limit: number;
  used: number;
  reserved: number;
  remaining: number;
  quotaDay: string;
  serverNow: string;
  resetAt: string;
  timeZone: "Europe/Istanbul";
}

export class BrowserBootstrapError extends Error {
  constructor(
    public readonly code: "COOKIE_UNAVAILABLE" | "BOOTSTRAP_FAILED" | "COORDINATION_UNAVAILABLE" | "COORDINATION_TIMEOUT",
    message: string
  ) {
    super(message);
    this.name = "BrowserBootstrapError";
  }
}

interface LockManagerLike {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

interface ChannelMessageEvent {
  data: unknown;
}

interface BroadcastChannelLike {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: ChannelMessageEvent) => void): void;
  close(): void;
}

export interface BrowserBootstrapCoordinatorDependencies {
  lockManager?: LockManagerLike | null;
  createChannel?: ((name: string) => BroadcastChannelLike) | null;
  randomTabId?: () => string;
  settleDelayMs?: number;
  timeoutMs?: number;
}

const LOCK_NAME = "belge-paylasim-browser-bootstrap-v1";
const CHANNEL_NAME = "belge-paylasim-browser-bootstrap-v1";

function createTabId(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isMessage(value: unknown): value is { type: string; id: string } {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.type === "string" && typeof record.id === "string";
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getDefaultLockManager(): LockManagerLike | null {
  if (typeof navigator === "undefined" || !navigator.locks) return null;
  return navigator.locks;
}

function getDefaultChannelFactory(): ((name: string) => BroadcastChannelLike) | null {
  if (typeof BroadcastChannel === "undefined") return null;
  return (name) => new BroadcastChannel(name);
}

async function waitForCoordinator(
  terminal: Promise<"done" | "failed">,
  timeoutMs: number
): Promise<"done" | "failed"> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      terminal,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new BrowserBootstrapError("COORDINATION_TIMEOUT", "Tarayıcı sekmeleri eşgüdüm yanıtı vermedi.")),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** Web Locks olmayan tarayıcılarda BroadcastChannel ile ilk cookie yazımını tek sekmeye indirir. */
export async function coordinateBrowserBootstrap<T>(
  run: () => Promise<T>,
  dependencies: BrowserBootstrapCoordinatorDependencies = {}
): Promise<T> {
  const lockManager = dependencies.lockManager === undefined ? getDefaultLockManager() : dependencies.lockManager;
  if (lockManager) return lockManager.request(LOCK_NAME, run);

  const createChannel = dependencies.createChannel === undefined
    ? getDefaultChannelFactory()
    : dependencies.createChannel;
  if (!createChannel) {
    throw new BrowserBootstrapError(
      "COORDINATION_UNAVAILABLE",
      "Bu tarayıcı sekmeler arası güvenli eşgüdümü desteklemiyor. PDF dosyasını indirebilirsiniz."
    );
  }

  const channel = createChannel(CHANNEL_NAME);
  const tabId = (dependencies.randomTabId ?? createTabId)();
  const peers = new Set<string>([tabId]);
  let leaderId: string | null = null;
  let resolveTerminal: (result: "done" | "failed") => void = () => {};
  const terminal = new Promise<"done" | "failed">((resolve) => {
    resolveTerminal = resolve;
  });

  channel.addEventListener("message", (event) => {
    if (!isMessage(event.data) || event.data.id === tabId) return;
    const message = event.data;
    if (message.type === "hello") {
      peers.add(message.id);
      if (leaderId === tabId) channel.postMessage({ type: "claim", id: tabId });
      return;
    }
    if (message.type === "claim") {
      peers.add(message.id);
      if (leaderId === null || message.id < leaderId) leaderId = message.id;
      return;
    }
    if (message.type === "done" || message.type === "failed") {
      if (leaderId === null || leaderId === message.id) {
        leaderId = message.id;
        resolveTerminal(message.type);
      }
    }
  });

  try {
    channel.postMessage({ type: "hello", id: tabId });
    await wait(dependencies.settleDelayMs ?? 60);
    if (leaderId === null) leaderId = [...peers].sort()[0] ?? tabId;

    if (leaderId === tabId) {
      channel.postMessage({ type: "claim", id: tabId });
      try {
        const result = await run();
        channel.postMessage({ type: "done", id: tabId });
        return result;
      } catch (error) {
        channel.postMessage({ type: "failed", id: tabId });
        throw error;
      }
    }

    const outcome = await waitForCoordinator(terminal, dependencies.timeoutMs ?? 15_000);
    if (outcome === "failed") {
      throw new BrowserBootstrapError(
        "BOOTSTRAP_FAILED",
        "Başka bir sekmede tarayıcı kimliği hazırlanamadı. Tekrar deneyin veya PDF dosyasını indirin."
      );
    }
    // Liderin echo doğrulamasından sonra cookie tarayıcı kavanozunda doğrulanmış olmalıdır.
    return run();
  } finally {
    channel.close();
  }
}

function readApiErrorCode(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : record.error;
  return typeof code === "string" ? code : null;
}

function parseQuota(value: unknown): BrowserShareQuotaSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (body.status !== "ready" || !body.quota || typeof body.quota !== "object") return null;
  const quota = body.quota as Record<string, unknown>;
  if (
    quota.limit !== 50 ||
    !Number.isSafeInteger(quota.used) || Number(quota.used) < 0 ||
    !Number.isSafeInteger(quota.reserved) || Number(quota.reserved) < 0 ||
    !Number.isSafeInteger(quota.remaining) || Number(quota.remaining) < 0 ||
    typeof quota.quotaDay !== "string" ||
    typeof quota.serverNow !== "string" ||
    typeof quota.resetAt !== "string" ||
    quota.timeZone !== "Europe/Istanbul"
  ) {
    return null;
  }
  return {
    limit: 50,
    used: Number(quota.used),
    reserved: Number(quota.reserved),
    remaining: Number(quota.remaining),
    quotaDay: quota.quotaDay,
    serverNow: quota.serverNow,
    resetAt: quota.resetAt,
    timeZone: "Europe/Istanbul",
  };
}

export async function bootstrapBrowserShareQuota(
  fetcher: typeof fetch = fetch,
  coordinatorDependencies: BrowserBootstrapCoordinatorDependencies = {}
): Promise<BrowserShareQuotaSnapshot> {
  const endpoint = "/api/belgeler/paylasim/kota";
  return coordinateBrowserBootstrap(async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const bootstrapResponse = await fetcher(endpoint, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!bootstrapResponse.ok) {
        let code: string | null = null;
        try {
          code = readApiErrorCode(await bootstrapResponse.json());
        } catch {
          // API gövdesi tanınmıyorsa ham içerik istemciye taşınmaz.
        }
        throw new BrowserBootstrapError("BOOTSTRAP_FAILED", code ?? "Tarayıcı paylaşım kimliği hazırlanamadı.");
      }

      const echoResponse = await fetcher(endpoint, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (echoResponse.ok) {
        const quota = parseQuota(await echoResponse.json());
        if (quota) return quota;
        throw new BrowserBootstrapError("BOOTSTRAP_FAILED", "Kota yanıtı doğrulanamadı.");
      }

      let code: string | null = null;
      try {
        code = readApiErrorCode(await echoResponse.json());
      } catch {
        // Ham API gövdesi hata mesajına eklenmez.
      }
      if (echoResponse.status !== 428 || code !== "BROWSER_ID_REQUIRED") {
        throw new BrowserBootstrapError("BOOTSTRAP_FAILED", code ?? "Tarayıcı kimliği doğrulanamadı.");
      }
    }

    throw new BrowserBootstrapError(
      "COOKIE_UNAVAILABLE",
      "Tarayıcı çerezi kabul etmedi. Paylaşım bağlantısı için çerezleri etkinleştirin veya PDF dosyasını indirin."
    );
  }, coordinatorDependencies);
}
