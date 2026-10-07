// Çalıştır: npx tsx tests/pdf-v4/unit/document-source.test.ts
import assert from "node:assert/strict";
import { openPdfSource, FULL_FETCH_LIMIT_BYTES, PROBE_BYTES, type RangeTransportLike } from "../../../src/lib/dokumantasyon/studio/pdf/pdf-document-source";

type Handler = (url: string, range: string | null, n: number) => Response;
function mkFetch(handler: Handler) {
  const calls: { url: string; range: string | null }[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    const range = (init?.headers as Record<string, string> | undefined)?.Range ?? null;
    calls.push({ url, range });
    return handler(url, range, calls.length);
  }) as unknown as typeof fetch;
  return { f, calls };
}
const bytes = (n: number) => Uint8Array.from({ length: n }, (_, i) => i % 251);
function serve(file: Uint8Array, honorRange = true) {
  return (_u: string, range: string | null) => {
    if (!range || !honorRange) return new Response(file as BodyInit, { status: 200, headers: { "content-length": String(file.length) } });
    const m = range.match(/bytes=(\d+)-(\d*)/)!;
    const b = Number(m[1]);
    const e = m[2] ? Math.min(Number(m[2]), file.length - 1) : file.length - 1;
    return new Response(file.slice(b, e + 1) as BodyInit, { status: 206, headers: { "content-range": `bytes ${b}-${e}/${file.length}` } });
  };
}
const noSleep = async () => undefined;
class FakeTransport implements RangeTransportLike {
  chunks: [number, Uint8Array][] = [];
  constructor(public length: number, public initial: Uint8Array) {}
  onDataRange(b: number, c: Uint8Array) { this.chunks.push([b, c]); }
}

async function main() {
  const ac = () => new AbortController().signal;

  // 1) küçük dosya (< probe): tek parça
  { const file = bytes(1000); const { f, calls } = mkFetch(serve(file));
    const r = await openPdfSource({ getUrl: () => "u1", signal: ac(), fetchImpl: f, sleepImpl: noSleep });
    assert.equal(r.kind, "data"); assert.deepEqual(r.kind === "data" && r.data, file); assert.equal(calls.length, 1); }

  // 2) orta dosya: probe + kalan; birleştirme bire bir
  { const file = bytes(PROBE_BYTES * 5 + 123); const { f, calls } = mkFetch(serve(file));
    const prog: number[] = [];
    const r = await openPdfSource({ getUrl: () => "u1", signal: ac(), fetchImpl: f, sleepImpl: noSleep, onProgress: (p) => prog.push(p.loaded) });
    assert.equal(r.kind, "data"); assert.deepEqual(r.kind === "data" && r.data, file); assert.equal(calls.length, 2);
    assert.equal(prog[prog.length - 1], file.length); }

  // 3) sunucu Range'i yok sayar (200): tüm gövde
  { const file = bytes(300_000); const { f } = mkFetch(serve(file, false));
    const r = await openPdfSource({ getUrl: () => "u1", signal: ac(), fetchImpl: f, sleepImpl: noSleep });
    assert.equal(r.kind, "data"); assert.deepEqual(r.kind === "data" && r.data, file); }

  // 4) 403 → refresh → yeni URL ile devam (belge yeniden yüklenmeden)
  { const file = bytes(200_000); let refreshed = 0;
    const base = serve(file);
    const { f, calls } = mkFetch((u, r) => (u === "old" ? new Response("", { status: 403 }) : base(u, r)));
    const r = await openPdfSource({ getUrl: () => "old", signal: ac(), fetchImpl: f, sleepImpl: noSleep,
      refresh: async () => { refreshed++; return { url: "new" }; } });
    assert.equal(refreshed, 1); assert.equal(calls[0].url, "old"); assert.equal(calls[1].url, "new");
    assert.deepEqual(r.kind === "data" && r.data, file); }

  // 5) 403 sürekli: 3 denemeden sonra http hatası (sonsuz döngü yok)
  { let refreshed = 0; const { f } = mkFetch(() => new Response("", { status: 403 }));
    await assert.rejects(openPdfSource({ getUrl: () => "x", signal: ac(), fetchImpl: f, sleepImpl: noSleep, refresh: async () => { refreshed++; return null; } }),
      (e: { kind?: string; status?: number }) => e.kind === "http" && e.status === 403);
    assert.equal(refreshed, 3); }

  // 6) 404
  { const { f } = mkFetch(() => new Response("", { status: 404 }));
    await assert.rejects(openPdfSource({ getUrl: () => "x", signal: ac(), fetchImpl: f, sleepImpl: noSleep }), (e: { status?: number }) => e.status === 404); }

  // 7) büyük dosya + aktarım: range transport; her aralık İSTEĞİ güncel URL'i kullanır
  { const file = bytes(FULL_FETCH_LIMIT_BYTES + 1000); let url = "a";
    const { f, calls } = mkFetch(serve(file));
    const r = await openPdfSource({ getUrl: () => url, signal: ac(), fetchImpl: f, sleepImpl: noSleep }, FakeTransport);
    assert.equal(r.kind, "range");
    if (r.kind !== "range") return;
    assert.equal(r.length, file.length); assert.equal(r.initialData.length, PROBE_BYTES);
    url = "b"; // arka plan lease yenilemesi
    const t = r.transport as FakeTransport & { requestDataRange: (b: number, e: number) => void };
    t.requestDataRange(1_000_000, 1_000_100);
    await new Promise((res) => setTimeout(res, 20));
    assert.equal(calls[calls.length - 1].url, "b");
    assert.equal(t.chunks.length, 1); assert.equal(t.chunks[0][0], 1_000_000); assert.equal(t.chunks[0][1].length, 100);
    assert.deepEqual(t.chunks[0][1], file.slice(1_000_000, 1_000_100)); }

  // 8) iptal
  { const c = new AbortController(); c.abort();
    const f = (async () => { throw new DOMException("aborted", "AbortError"); }) as unknown as typeof fetch;
    await assert.rejects(openPdfSource({ getUrl: () => "x", signal: c.signal, fetchImpl: f, sleepImpl: noSleep }), (e: { kind?: string }) => e.kind === "aborted"); }

  console.log("document-source: 8/8 geçti");
}
main().catch((e) => { console.error(e); process.exit(1); });
