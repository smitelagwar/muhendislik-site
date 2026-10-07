import assert from "node:assert/strict";
import { readAllSizes, type SizeSource } from "../../../src/lib/dokumantasyon/studio/pdf/engine/page-sizes";
import type { PageSizePt } from "../../../src/lib/dokumantasyon/studio/pdf/engine/layout";

async function main() {
  // 1. Sahte 60 sayfalık doküman
  const mockDoc: SizeSource = {
    numPages: 60,
    async getPage(n: number) {
      // Çift sayfalar 90 derece döndürülmüş A4
      const isRotated = n % 2 === 0;
      return {
        view: [0, 0, 595, 842],
        rotate: isRotated ? 90 : 0,
        cleanup: () => {},
      };
    },
  };

  const collected: Array<{ from: number; sizes: PageSizePt[] }> = [];
  const ac = new AbortController();

  await readAllSizes(
    mockDoc,
    ac.signal,
    (from, sizes) => {
      collected.push({ from, sizes });
    },
    { batch: 25 }
  );

  // 60 sayfa, 25'lik batch'ler: 1..25, 26..50, 51..60 (toplam 3 batch)
  assert.equal(collected.length, 3);
  assert.equal(collected[0].from, 1);
  assert.equal(collected[0].sizes.length, 25);
  assert.equal(collected[1].from, 26);
  assert.equal(collected[1].sizes.length, 25);
  assert.equal(collected[2].from, 51);
  assert.equal(collected[2].sizes.length, 10);

  // Sayfa 1 (tek): 595 x 842
  assert.equal(collected[0].sizes[0].w, 595);
  assert.equal(collected[0].sizes[0].h, 842);

  // Sayfa 2 (çift, 90 derece): 842 x 595 (yer değiştirmiş)
  assert.equal(collected[0].sizes[1].w, 842);
  assert.equal(collected[0].sizes[1].h, 595);

  // 2. Abort testi
  const abortAc = new AbortController();
  abortAc.abort(); // hemen abort edilmiş
  let abortCalled = false;

  await readAllSizes(
    mockDoc,
    abortAc.signal,
    () => {
      abortCalled = true;
    },
    { batch: 25 }
  );

  assert.equal(abortCalled, false, "Abort edilmiş sinyalde onBatch çağrılmamalı");

  console.log("page-sizes: birim testleri (kademeli okuma, döndürme, abort) başarıyla geçti");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
