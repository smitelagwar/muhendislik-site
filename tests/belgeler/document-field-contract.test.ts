import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DOCUMENT_EDITABLE_FIELDS,
  DOCUMENT_PDF_ONLY_FIELDS,
  countFilledEditableFields,
} from "../../src/lib/document-field-contracts";
import { DOCUMENTS } from "../../src/lib/documents-data";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const pdfEngineSource = readFileSync(
  resolve(repoRoot, "src/lib/pdf-engine.ts"),
  "utf8"
);

const contracts = {
  "beton-dokum-tutanagi": {
    defaultConstant: "BETON_DOKUM_DEFAULT_DATA",
    specConstant: "BETON_DOKUM_FIELD_SPECS",
    componentPath: "src/components/beton-dokum-studio.tsx",
  },
  "insaat-ruhsati-dilekcesi": {
    defaultConstant: "INSAAT_RUHSATI_DEFAULT_DATA",
    specConstant: "INSAAT_RUHSATI_FIELD_SPECS",
    componentPath: "src/components/insaat-ruhsati-studio.tsx",
  },
  "santiye-sefi-istifa-dilekcesi": {
    defaultConstant: "ISTIFA_DILEKCESI_DEFAULT_DATA",
    specConstant: "ISTIFA_FIELD_SPECS",
    componentPath: "src/components/istifa-studio.tsx",
  },
  "santiye-sefi-sozlesmesi": {
    defaultConstant: "SOZLESME_DEFAULT_DATA",
    specConstant: "SOZLESME_FIELD_SPECS",
    componentPath: "src/components/sozlesme-studio.tsx",
  },
  "santiye-sefi-taahhutnamesi": {
    defaultConstant: "TAAHHUTNAME_DEFAULT_DATA",
    specConstant: "TAAHHUTNAME_FIELD_SPECS",
    componentPath: "src/components/taahhutname-studio.tsx",
  },
} as const;

function extractAssignedObjectKeys(source: string, constantName: string): string[] {
  const markerIndex = source.indexOf(constantName);
  assert.notEqual(markerIndex, -1, `${constantName} bulunamadı`);

  const assignmentIndex = source.indexOf("= {", markerIndex);
  assert.notEqual(assignmentIndex, -1, `${constantName} nesne ataması bulunamadı`);

  const objectStart = source.indexOf("{", assignmentIndex);
  let depth = 0;
  let objectEnd = -1;

  for (let index = objectStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        objectEnd = index;
        break;
      }
    }
  }

  assert.notEqual(objectEnd, -1, `${constantName} nesnesi kapanmıyor`);

  const body = source.slice(objectStart + 1, objectEnd);
  return [...body.matchAll(/^\s{2}([A-Za-z0-9_]+)\s*:/gm)].map(
    (match) => match[1]
  );
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function assertSameMembers(
  actual: readonly string[],
  expected: readonly string[],
  message: string
) {
  assert.deepEqual([...actual].sort(), [...expected].sort(), message);
}

for (const [documentId, contract] of Object.entries(contracts)) {
  const id = documentId as keyof typeof DOCUMENT_EDITABLE_FIELDS;
  const editableFields = [...DOCUMENT_EDITABLE_FIELDS[id]];
  const pdfOnlyFields = [...DOCUMENT_PDF_ONLY_FIELDS[id]];
  const expectedPdfFields = [...editableFields, ...pdfOnlyFields];

  assert.equal(
    unique(editableFields).length,
    editableFields.length,
    `${documentId}: editable field listesinde tekrar var`
  );

  const metadata = DOCUMENTS.find((document) => document.id === documentId);
  assert.ok(metadata, `${documentId}: documents-data metadata kaydı yok`);

  assertSameMembers(
    metadata.fields.map((field) => field.key),
    editableFields,
    `${documentId}: metadata fields editable sözleşmeyle eşleşmiyor`
  );

  assertSameMembers(
    Object.keys(metadata.defaultValues),
    editableFields,
    `${documentId}: metadata defaultValues editable sözleşmeyle eşleşmiyor`
  );

  assertSameMembers(
    extractAssignedObjectKeys(pdfEngineSource, contract.defaultConstant),
    expectedPdfFields,
    `${documentId}: PDF default data sözleşmesi farklı`
  );

  assertSameMembers(
    extractAssignedObjectKeys(pdfEngineSource, contract.specConstant),
    expectedPdfFields,
    `${documentId}: PDF field spec sözleşmesi farklı`
  );

  const componentSource = readFileSync(resolve(repoRoot, contract.componentPath), "utf8");
  const componentEditableFields = unique(
    [...componentSource.matchAll(/handleFieldChange\(\s*"([^"]+)"/g)].map(
      (match) => match[1]
    )
  );

  assertSameMembers(
    componentEditableFields,
    editableFields,
    `${documentId}: stüdyo input alanları editable sözleşmeyle eşleşmiyor`
  );

  assert.ok(
    componentSource.includes(
      `{filledFieldCount}/{DOCUMENT_EDITABLE_FIELDS["${documentId}"].length}`
    ),
    `${documentId}: sayaç toplamı editable sözleşmeden türetilmiyor`
  );

  const allFilled = Object.fromEntries(
    expectedPdfFields.map((field) => [field, "değer"])
  );

  assert.equal(
    countFilledEditableFields(allFilled, editableFields),
    editableFields.length,
    `${documentId}: sayaç yalnız editable alanları saymalı`
  );
}

console.log("Belge field contract testi başarılı.");
