import assert from "node:assert/strict";
import { Scheduler, type Job } from "../../../src/lib/dokumantasyon/studio/pdf/engine/scheduler";

async function main() {
  const executed: string[] = [];

  const syncPost = (fn: () => void) => setTimeout(fn, 0);

  // 1. Sıralama testi (cls sonra dist)
  const s = new Scheduler(1, syncPost);

  const makeJob = (id: string, cls: number, dist: number): Job => ({
    id,
    cls,
    dist,
    run: async (signal) => {
      await new Promise((res) => setTimeout(res, 5));
      if (!signal.aborted) {
        executed.push(id);
      }
    },
  });

  // Önce gesture yaparak kuyruğu dolduralım (böylece hemen pump edilmez)
  s.setInteraction("gesture");
  s.enqueue(makeJob("j3", 2, 10)); // cls 2
  s.enqueue(makeJob("j1", 0, 5)); // cls 0 (en öncelikli)
  s.enqueue(makeJob("j2", 0, 20)); // cls 0 ama dist daha büyük

  // Şimdi idle yaparak pump'ı başlatalım
  s.setInteraction("idle");

  await new Promise((res) => setTimeout(res, 100));

  // Beklenen yürütülme sırası: j1 (cls 0 dist 5), j2 (cls 0 dist 20), j3 (cls 2 dist 10)
  assert.deepEqual(executed, ["j1", "j2", "j3"]);

  // 2. Gesture durumu: yeni iş başlatmaz
  executed.length = 0;
  s.setInteraction("gesture");
  s.enqueue(makeJob("g1", 0, 10));
  s.enqueue(makeJob("g2", 2, 10));

  await new Promise((res) => setTimeout(res, 50));
  assert.equal(executed.length, 0, "Gesture sırasında hiçbir yeni iş başlamamalı");

  // 3. Scrolling durumu: yalnızca cls 1 ve cls 3'e izin verir
  executed.length = 0;
  s.setInteraction("scrolling");
  s.enqueue(makeJob("s0", 0, 10)); // cls 0 -> beklemeli
  s.enqueue(makeJob("s1", 1, 10)); // cls 1 (backdrop) -> çalışmalı
  s.enqueue(makeJob("s2", 2, 10)); // cls 2 -> beklemeli
  s.enqueue(makeJob("s3", 3, 10)); // cls 3 (komşu backdrop) -> çalışmalı

  await new Promise((res) => setTimeout(res, 120));
  assert.deepEqual(executed, ["s1", "s3"], "Scrolling durumunda yalnızca cls 1 ve 3 çalışmalı");

  // 4. Idle durumuna geçince bekleyen cls 0 ve 2 tamamlanmalı
  s.setInteraction("idle");
  await new Promise((res) => setTimeout(res, 120));
  assert.ok(executed.includes("s0"));
  assert.ok(executed.includes("s2"));

  // 5. İptal (cancel) ve AbortSignal testi
  let abortedCaught = false;
  const longJob: Job = {
    id: "long1",
    cls: 0,
    dist: 0,
    run: async (signal) => {
      if (signal.aborted) {
        abortedCaught = true;
        return;
      }
      signal.addEventListener("abort", () => {
        abortedCaught = true;
      });
      await new Promise((res) => setTimeout(res, 200));
    },
  };

  s.enqueue(longJob);
  // İşi başlatması için bir tick bekle
  await new Promise((res) => setTimeout(res, 10));
  s.cancel("long1");
  assert.equal(abortedCaught, true, "Aktif iş iptal edilince signal abort olmalı");

  console.log("scheduler: birim testleri (öncelik, gesture engeli, scrolling, cancel) başarıyla geçti");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
