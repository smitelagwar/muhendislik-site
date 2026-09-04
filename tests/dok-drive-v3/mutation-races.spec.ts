// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MUTATION RACES & CONCURRENCY KORUMASI TESTİ
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  acquireMutationScope,
  releaseMutationScope,
} from "../../src/components/dokumantasyon/drive-v3/query-client";

test.describe("Drive V3.1 — Mutation Scope & Concurrency Races", () => {
  const fileScope = "dok-item:file:file-101";
  const folderScope = "dok-item:folder:folder-202";
  const bulkScope = "dok-bulk:bulk-op-303";

  test.afterEach(() => {
    releaseMutationScope(fileScope);
    releaseMutationScope(folderScope);
    releaseMutationScope(bulkScope);
  });

  test("1. Aynı kaynak üzerinde ilk mutation lock alır, paralel ikinci istek reddedilir", () => {
    const lock1 = acquireMutationScope(fileScope);
    expect(lock1).toBe(true);

    // Aynı dosyaya aynı anda ikinci rename/star/move denemesi
    const lock2 = acquireMutationScope(fileScope);
    expect(lock2).toBe(false);
  });

  test("2. İlk işlem tamamlanıp scope serbest bırakıldığında sonraki istek lock alabilir", () => {
    expect(acquireMutationScope(fileScope)).toBe(true);
    expect(acquireMutationScope(fileScope)).toBe(false);

    releaseMutationScope(fileScope);

    // Serbest bırakıldıktan sonra yeni işlem başarılı olur
    expect(acquireMutationScope(fileScope)).toBe(true);
  });

  test("3. Farklı kaynaklar birbirinden bağımsız olarak eşzamanlı kilit alabilir", () => {
    const fileLock = acquireMutationScope(fileScope);
    const folderLock = acquireMutationScope(folderScope);
    const bulkLock = acquireMutationScope(bulkScope);

    expect(fileLock).toBe(true);
    expect(folderLock).toBe(true);
    expect(bulkLock).toBe(true);
  });
});
