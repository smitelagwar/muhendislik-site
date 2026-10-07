// pdf.js (legacy build) için EK polyfill'ler. Ölçüm (Chromium'dan API silerek, PDF v4 Plan 01 S10b):
// legacy build şunları KENDİ polyfill'lemiyor; yoksa PDF açılmıyor:
//   Promise.withResolvers (Chrome 119 / Safari 17.4 / Firefox 121)
//   ArrayBuffer.prototype.transfer + transferToFixedLength (Chrome 114 / Safari 17.4 / Firefox 122)
//     DİKKAT: worker font bilgisini transferToFixedLength ile derler; yoksa HATA VERMEDEN glifler çizilmez (boş metin).
//   ReadableStream[Symbol.asyncIterator] (Chrome 124 / Safari: yok / Firefox 110)
// Bu dosya hem ana iş parçacığında (pdf.js'ten ÖNCE import edilir) hem worker girişinde çalışır.
// Yan etkili modüldür; export yok. Tüm eklemeler "yoksa ekle" biçimindedir.

if (typeof Promise.withResolvers !== "function") {
  Object.defineProperty(Promise, "withResolvers", {
    configurable: true,
    writable: true,
    value: function withResolvers() {
      let resolve, reject;
      const promise = new this((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    },
  });
}

if (typeof ArrayBuffer.prototype.transfer !== "function") {
  Object.defineProperty(ArrayBuffer.prototype, "transfer", {
    configurable: true,
    writable: true,
    value: function transfer(newLength) {
      // Gerçek transfer: kaynak buffer detach edilir. Sonuç her zaman sabit uzunluklu (resizable değil).
      const moved = structuredClone(this, { transfer: [this] });
      if (newLength === undefined || newLength === moved.byteLength) return moved;
      const dst = new ArrayBuffer(newLength);
      new Uint8Array(dst).set(new Uint8Array(moved, 0, Math.min(newLength, moved.byteLength)));
      return dst;
    },
  });
}

if (typeof ArrayBuffer.prototype.transferToFixedLength !== "function") {
  Object.defineProperty(ArrayBuffer.prototype, "transferToFixedLength", {
    configurable: true,
    writable: true,
    value: function transferToFixedLength(newLength) {
      return ArrayBuffer.prototype.transfer.call(this, newLength);
    },
  });
}

if (typeof ReadableStream !== "undefined" && !ReadableStream.prototype[Symbol.asyncIterator]) {
  const values = async function* (options) {
    const reader = this.getReader();
    let finished = false;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          finished = true;
          return;
        }
        yield value;
      }
    } finally {
      if (!finished && !(options && options.preventCancel)) {
        try {
          await reader.cancel();
        } catch {
          /* yut */
        }
      }
      try {
        reader.releaseLock();
      } catch {
        /* yut */
      }
    }
  };
  Object.defineProperty(ReadableStream.prototype, "values", {
    configurable: true,
    writable: true,
    value: function (o) {
      return values.call(this, o);
    },
  });
  Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, {
    configurable: true,
    writable: true,
    value: ReadableStream.prototype.values,
  });
}
