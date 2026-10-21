import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = process.cwd();
const lispPath = `${root}/motor_v2/evidence/fidelity-v3/L06/autocad-lt-readonly-inventory.lsp`;
const sessionPath = `${root}/motor_v2/evidence/fidelity-v3/L06/autocad-lt-readonly-session.scr`;

test("AutoCAD LT evidence script is read-only and writes only a temporary inventory", () => {
  const source = fs.readFileSync(lispPath, "utf8");
  const executableSource = source.replace(/^\s*;.*$/gm, "");
  const session = fs.readFileSync(sessionPath, "utf8");
  assert.match(executableSource, /\(defun\s+c:L06ORACLE\b/i);
  assert.match(executableSource, /\(ssget\s+"_X"\)/i);
  assert.match(executableSource, /\(entget\s+entity\)/i);
  assert.match(executableSource, /\(getenv\s+"TEMP"\)/i);
  assert.match(executableSource, /\(open\s+reportPath\s+"w"\)/i);
  assert.doesNotMatch(executableSource, /\(\s*(?:command|command-s|entmod|entmake|entdel|entupd|vla-[a-z0-9-]*|vlax-[a-z0-9-]*)\b/i);
  assert.doesNotMatch(executableSource, /\b(?:QSAVE|SAVEAS|AUDIT|PURGE|EXPLODE)\b/i);
  assert.match(session, /^\(load\s+"C:\/.*autocad-lt-readonly-inventory\.lsp"\)\s*\r?\nL06ORACLE\s*$/i);
  assert.doesNotMatch(session, /\b(?:QSAVE|SAVEAS|AUDIT|PURGE|EXPLODE)\b/i);
});
