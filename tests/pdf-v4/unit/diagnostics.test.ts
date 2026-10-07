import assert from "node:assert/strict";
import {
  sanitizeErrorMsg,
  recordPdfError,
  getPdfErrors,
  clearPdfErrors,
  collectPdfDiagnostics,
} from "../../../src/lib/dokumantasyon/studio/pdf/pdf-diagnostics";
import { PDFJS_VERSION } from "../../../src/lib/pdfjs-paths";

// W6 Ölçüt 1: URL ve token temizliği (5 örnek dizgi)
const cases = [
  {
    input: "Failed to load https://example.com/api/pdf?token=secret123 from server",
    expectedNotContain: ["https://example.com", "secret123"],
  },
  {
    input: "Error fetching http://localhost:3000/dokumantasyon/stream?auth=xyz789",
    expectedNotContain: ["http://localhost:3000", "xyz789"],
  },
  {
    input: "Network error at https://storage.googleapis.com/bucket/doc.pdf?key=abc",
    expectedNotContain: ["https://storage.googleapis.com", "key=abc"],
  },
  {
    input: "Unauthorized access: token=jwt_token_payload_secret",
    expectedNotContain: ["jwt_token_payload_secret"],
  },
  {
    input: "Password check failed: password=supersecretpass",
    expectedNotContain: ["supersecretpass"],
  },
];

for (const c of cases) {
  const sanitized = sanitizeErrorMsg(c.input);
  for (const forbidden of c.expectedNotContain) {
    assert.equal(
      sanitized.includes(forbidden),
      false,
      `Sanitized message contains forbidden string: ${forbidden} in "${sanitized}"`
    );
  }
}

// W6 Ölçüt 2: Halka tamponu 20 ile sınırlı
clearPdfErrors();
for (let i = 1; i <= 25; i++) {
  recordPdfError("test", `Error #${i}`);
}
const errors = getPdfErrors();
assert.equal(errors.length, 20, "Halka tamponu tam 20 hata saklamalı");
assert.equal(errors[0].msg, "Error #6", "İlk hata en eski 5 hatadan sonra #6 olmalı");
assert.equal(errors[19].msg, "Error #25", "Son hata en yeni #25 olmalı");

// W6 Ölçüt 3: Tanılama çıktısı ve pdfjs.version doğrulaması
const diag = collectPdfDiagnostics({ numPages: 10, scale: 1.5 });
assert.equal(diag.pdfjs.version, PDFJS_VERSION);
assert.equal(diag.pdfjs.build, "legacy");
assert.equal(diag.doc.numPages, 10);
assert.equal(diag.doc.scale, 1.5);

console.log("diagnostics: birim testleri (W6 sanitizasyon, 20 halka tamponu, versiyon) başarıyla geçti");
