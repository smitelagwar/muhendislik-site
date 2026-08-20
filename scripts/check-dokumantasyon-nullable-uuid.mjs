// ============================================================================
// DÖKÜMANTASYON — NULLABLE UUID / POSTGRES 42P18 REGRESYON KAPISI
// ============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const filesPath = path.join(root, "src/lib/dokumantasyon/files.ts");
const foldersPath = path.join(root, "src/lib/dokumantasyon/folders.ts");
const sourceFiles = fs.readFileSync(filesPath, "utf8");
const sourceFolders = fs.readFileSync(foldersPath, "utf8");

function assertNullSafeSiblingQuery({ source, idName, column, label }) {
  const oldUnsafe = new RegExp(
    `\\(${column}\\s*=\\s*\\$\\{${idName}\\}\\s*OR\\s*\\(${column}\\s+IS\\s+NULL\\s+AND\\s+\\$\\{${idName}\\}\\s+IS\\s+NULL\\)\\)`,
    "s",
  );
  assert(!oldUnsafe.test(source), `${label}: eski iki-placeholder nullable UUID sorgusu bulunmamalı.`);

  const rootBranch = new RegExp(
    `if \\(${idName} === null\\)[\\s\\S]*?WHERE ${column} IS NULL[\\s\\S]*?deleted_at IS NULL`,
  );
  assert(rootBranch.test(source), `${label}: root dizin sorgusu parametresiz IS NULL dalı kullanmalı.`);

  const nestedBranch = new RegExp(
    `WHERE ${column} = \\$\\{${idName}\\}::uuid[\\s\\S]*?deleted_at IS NULL`,
  );
  assert(nestedBranch.test(source), `${label}: alt klasör sorgusu açık ::uuid type cast kullanmalı.`);
}

assertNullSafeSiblingQuery({ source: sourceFiles, idName: "folderId", column: "folder_id", label: "Dosya benzersiz ad" });
assertNullSafeSiblingQuery({ source: sourceFolders, idName: "parentId", column: "parent_id", label: "Klasör benzersiz ad" });

const dokumantasyonSourceRoot = path.join(root, "src", "lib", "dokumantasyon");
const appSourceRoot = path.join(root, "src", "app", "api", "dokumantasyon");
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? walk(path.join(directory, entry.name)) : entry.name.endsWith(".ts") ? [path.join(directory, entry.name)] : [],
);
const unsafeUntypedNullParam = /\$\{[^}]+\}\s+IS\s+NULL|IS\s+NULL[^\n]*\$\{[^}]+\}/;
const offenders = [...walk(dokumantasyonSourceRoot), ...walk(appSourceRoot)]
  .filter((file) => unsafeUntypedNullParam.test(fs.readFileSync(file, "utf8")));
assert.deepEqual(offenders, [], `Tipsiz nullable SQL parametresi kaldı: ${offenders.join(", ")}`);

console.log("PASS root-folder file query: parameterless folder_id IS NULL");
console.log("PASS nested-folder file query: folder_id = $1::uuid");
console.log("PASS root-folder folder query: parameterless parent_id IS NULL");
console.log("PASS nested-folder folder query: parent_id = $1::uuid");
console.log("PASS adversarial scan: no untyped `${...} IS NULL` parameter remains");
