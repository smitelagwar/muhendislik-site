import test from "node:test";
import assert from "node:assert/strict";
import { synthesizeIdeFile } from "./synthesize";
import { createDemoModel } from "../model";

for (const format of ["ide10", "ide11"] as const) {
  test(`${format}: incomplete native serialization cannot produce a downloadable file`, () => {
    const model = createDemoModel();
    const before = JSON.stringify(model);
    assert.throws(() => synthesizeIdeFile(model, format), /native IDE yazıcısı/);
    assert.equal(JSON.stringify(model), before);
  });
}
