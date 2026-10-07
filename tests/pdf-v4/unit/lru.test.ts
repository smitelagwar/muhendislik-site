import assert from "node:assert/strict";
import { ByteLru } from "../../../src/lib/dokumantasyon/studio/pdf/engine/lru";

const evicted: Array<{ k: string; v: number }> = [];
const lru = new ByteLru<string, number>(1000, (k, v) => {
  evicted.push({ k, v });
});

// 1. Ekleme ve bayt hesabı
lru.set("a", 1, 300);
lru.set("b", 2, 400);
assert.equal(lru.bytes, 700);

// "a"ya erişelim; şimdi "a" daha yeni, "b" en eski oldu: ["b", "a"]
assert.equal(lru.get("a"), 1);

// 2. Bütçe aşımı ve trim
lru.set("c", 3, 500); // ["b", "a", "c"], toplam 700 + 500 = 1200 > 1000
lru.trim(); // en eski olan "b" tahliye edilmeli
assert.ok(lru.bytes <= 1000);
assert.equal(evicted.length, 1);
assert.equal(evicted[0].k, "b");
assert.equal(lru.has("b"), false);

// 3. Korunan küme (protect)
evicted.length = 0;
// Şu an "a" (300) ve "c" (500) var = 800. Sıra: ["a", "c"]
lru.set("d", 4, 400); // 800 + 400 = 1200 > 1000. Sıra: ["a", "c", "d"]
// Normalde "a" düşerdi ama "a" korunursa "c" tahliye edilmeli
lru.trim((k) => k === "a");
assert.ok(lru.bytes <= 1000);
assert.equal(evicted.length, 1);
assert.equal(evicted[0].k, "c");
assert.equal(lru.has("a"), true);
assert.equal(lru.has("d"), true);

// 4. Bütçe düşürme
evicted.length = 0;
lru.setBudget(200);
lru.trim();
assert.ok(lru.bytes <= 200);

console.log("lru: birim testleri (ByteLru sıra, bütçe, protect, onEvict) başarıyla geçti");
