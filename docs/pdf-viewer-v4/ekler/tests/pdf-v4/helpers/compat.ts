import type { BrowserContext } from "@playwright/test";

/**
 * "Eski tarayıcı" simülasyonu. Playwright'ın Chromium'u çok yeni olduğundan gerçekten eski
 * bir tarayıcıyı taklit etmek için, TABAN = Chrome/Edge 110, Firefox 115, Safari/iOS 16.4
 * sonrasında eklenen yerleşikleri HEM ana sayfada (addInitScript) HEM pdf.js worker'ında
 * (route ile dosya başına ekleme) siler. Legacy build bunları kendi polyfill'iyle geri
 * koymalıdır; modern build koymaz ve çöker (D1).
 */
export const COMPAT_PRELUDE = String.raw`
(() => {
  const g = globalThis;
  const del = (o, k) => { try { if (o && k in o) delete o[k]; } catch (_) {} };
  del(g.ArrayBuffer && ArrayBuffer.prototype, 'transfer');            // Chrome 114
  del(g.ArrayBuffer && ArrayBuffer.prototype, 'transferToFixedLength');
  del(Object, 'groupBy'); del(Map, 'groupBy');                         // 117
  del(Promise, 'withResolvers');                                      // 119
  del(g.URL, 'canParse');                                             // 120
  del(Array, 'fromAsync');                                            // 121
  for (const k of ['union','intersection','difference','symmetricDifference','isSubsetOf','isSupersetOf','isDisjointFrom']) del(Set.prototype, k); // 122
  del(Promise, 'try');                                                // 128
  del(g, 'Float16Array'); del(Math, 'f16round'); del(g.DataView && DataView.prototype, 'getFloat16'); del(g.DataView && DataView.prototype, 'setFloat16'); // 135
  del(g.RegExp, 'escape');                                            // 136
  del(Uint8Array, 'fromBase64'); del(Uint8Array, 'fromHex'); del(Uint8Array.prototype, 'toBase64'); del(Uint8Array.prototype, 'toHex'); // 140
  del(Map.prototype, 'getOrInsert'); del(Map.prototype, 'getOrInsertComputed');          // 145
  del(g.WeakMap && WeakMap.prototype, 'getOrInsert'); del(g.WeakMap && WeakMap.prototype, 'getOrInsertComputed');
  del(Math, 'sumPrecise');
  del(g.Error, 'isError');
  g.__COMPAT_PRELUDE_RAN = true;
})();
`;

/**
 * Bir bağlama (context) uygular.
 *  - Ana iş parçacığı: addInitScript (her modülden önce çalışır).
 *  - Worker: worker dosyasının BAŞINA `import "/__compat-prelude.mjs"` eklenir. ES modüllerinde
 *    importlar metin sırasıyla çalışır; yani silme, worker'ın kendi importlarından
 *    (örn. compat-polyfills.mjs) ÖNCE gerçekleşir. Dosya başına düz ifade koymak İŞE YARAMAZ
 *    (importlar hoist edilir, önce çalışır).
 */
export async function installCompat(context: BrowserContext): Promise<void> {
  await context.addInitScript(COMPAT_PRELUDE);
  await context.route(/\/__compat-prelude\.mjs$/, (route) =>
    route.fulfill({ contentType: "text/javascript", body: COMPAT_PRELUDE })
  );
  await context.route(/\/vendor\/pdfjs\/.*worker.*\.mjs(\?.*)?$/, async (route) => {
    const res = await route.fetch();
    const headers = { ...res.headers() };
    delete headers["content-length"];
    delete headers["content-encoding"];
    await route.fulfill({ status: res.status(), headers, body: `import "/__compat-prelude.mjs";\n${await res.text()}` });
  });
}
