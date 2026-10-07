import assert from "node:assert/strict";
import { classifyPdfError } from "../../../src/lib/dokumantasyon/studio/pdf/pdf-error-classifier";

// Plan 05 W2 Birim Testleri:
// HTTP 403 -> expired
assert.equal(classifyPdfError(new Error("Forbidden"), 403), "expired");
assert.equal(classifyPdfError(new Error("Unauthorized"), 401), "expired");

// fetch TypeError -> network
const fetchErr = new TypeError("Failed to fetch");
assert.equal(classifyPdfError(fetchErr), "network");

// PasswordException -> password
const pwdErr = new Error("Need password");
pwdErr.name = "PasswordException";
assert.equal(classifyPdfError(pwdErr), "password");

// InvalidPDFException -> corrupt
const corruptErr = new Error("Invalid PDF format");
corruptErr.name = "InvalidPDFException";
assert.equal(classifyPdfError(corruptErr), "corrupt");

// MissingPDFException -> network
const missingErr = new Error("Missing PDF");
missingErr.name = "MissingPDFException";
assert.equal(classifyPdfError(missingErr), "network");

console.log("error-classifier: birim testleri (W2 hata sınıfları eşlemesi) başarıyla geçti");
