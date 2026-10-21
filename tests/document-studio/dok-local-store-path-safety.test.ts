import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { getLocalStorageDir } from "../../src/lib/dokumantasyon/local-store";

const keys = ["NODE_ENV", "DOK_ALLOW_LOCAL_STORAGE", "DOK_LOCAL_DATA_DIR", "VERCEL"] as const;
const previous = new Map(keys.map((key) => [key, process.env[key]]));

try {
  process.env.NODE_ENV = "development";
  process.env.DOK_ALLOW_LOCAL_STORAGE = "true";
  process.env.DOK_LOCAL_DATA_DIR = os.homedir();
  delete process.env.VERCEL;

  assert.throws(() => getLocalStorageDir(), /UNSAFE_TEST_DATA_DIR/);
  process.env.DOK_LOCAL_DATA_DIR = path.parse(os.homedir()).root;
  assert.throws(() => getLocalStorageDir(), /UNSAFE_TEST_DATA_DIR/);

  console.log("[dok-local-store-path-safety] PASS: home and filesystem root remain rejected");
} finally {
  for (const key of keys) {
    const value = previous.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}