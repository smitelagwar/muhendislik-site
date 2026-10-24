import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { PDFArray, PDFDict, PDFDocument, PDFName } from "pdf-lib";
import { buildBelgeFilename, formatYibfPart, isValidCalendarDate, parseBelgeDateToIso } from "../../src/lib/belge-filename";
import { downloadFilledBetonDokumPdf, downloadFilledInsaatRuhsatiPdf, downloadFilledIstifaDilekcesiPdf, downloadFilledSozlesmePdf, downloadFilledTaahhutnamePdf, generateBelgeDocument } from "../../src/lib/pdf-engine";
import { getDocumentPdfProfiles, normalizePdfFieldValue } from "../../src/lib/belgeler-pdf-profiles";
import { renderFlattenedPdf, ServerPdfRenderError, validateFlattenedPdf } from "../../src/lib/belge-paylasim/server-pdf";
import { stage12Cases, stage12Documents } from "./fixtures/stage12-cases";

describe("ASAMA_12: five documents x blank/sample/Turkish-long PDF contracts", () => {
  for (const document of stage12Documents) for (const fixture of stage12Cases(document)) {
    it(`${document.name}/${fixture.name}: page count, canonical fields/widgets, fresh AP, no DV; flattened fields/widgets/tree=0`, async () => {
      const editable = await generateBelgeDocument(document.id, fixture.values);
      const reopened = await PDFDocument.load(editable.bytes);
      assert.equal(reopened.getPageCount(), document.pages);
      const form = reopened.getForm();
      const profiles = getDocumentPdfProfiles(document.id);
      assert.equal(form.getFields().length, Object.keys(profiles).length);
      for (const [key, profile] of Object.entries(profiles)) {
        const field = form.getTextField(key);
        const expected = normalizePdfFieldValue(profile.fixedValue ?? fixture.values[key], profile.multiline);
        assert.equal(field.getText() ?? "", expected, key);
        assert.equal(field.acroField.dict.has(PDFName.of("DV")), false, key);
        assert.ok(editable.layouts[key].widgets.length > 0);
        assert.equal(editable.layouts[key].overflow, false, key);
        for (const widget of field.acroField.getWidgets()) {
          assert.equal(widget.dict.has(PDFName.of("DV")), false, key);
          const appearance = widget.getAppearances()?.normal;
          assert.ok(appearance, `${key}: nonempty saved AP/N`);
          const effectiveValue = widget.dict.get(PDFName.of("V")) ?? field.acroField.dict.get(PDFName.of("V"));
          assert.equal(effectiveValue?.toString(), field.acroField.dict.get(PDFName.of("V"))?.toString(), key);
        }
      }
      const flattened = await renderFlattenedPdf(document.id, fixture.values);
      const shared = await PDFDocument.load(flattened.pdfBytes);
      assert.equal(shared.getPageCount(), document.pages);
      assert.equal(shared.catalog.has(PDFName.of("AcroForm")), false);
      assert.equal(shared.getForm().getFields().length, 0);
      for (const page of shared.getPages()) for (const reference of page.node.Annots()?.asArray() ?? []) {
        assert.notEqual(shared.context.lookup(reference, PDFDict).get(PDFName.of("Subtype")), PDFName.of("Widget"));
      }
    });
  }
});

describe("ASAMA_12: malformed output is rejected before storage", () => {
  const rejected = (bytes: Uint8Array, code: string) => assert.rejects(validateFlattenedPdf("beton-dokum-tutanagi", bytes), (error: unknown) => error instanceof ServerPdfRenderError && error.code === code);
  it("rejects PDF-looking corrupt data, undersize and over-limit payloads", async () => {
    await rejected(new TextEncoder().encode("%PDF-1.7\n"+"invalid ".repeat(40)), "INVALID_PDF_DOCUMENT");
    await rejected(new Uint8Array(10), "PDF_TOO_SMALL");
    await rejected(new Uint8Array(300).fill(65), "INVALID_PDF_HEADER");
    const oversized = new Uint8Array(3*1024*1024+1); oversized.set(new TextEncoder().encode("%PDF-"));
    await rejected(oversized, "PDF_SIZE_EXCEEDED");
  });
  it("rejects wrong page count and editable fields even with a valid header", async () => {
    const wrong = await PDFDocument.create(); wrong.addPage(); wrong.addPage();
    await rejected(await wrong.save(), "INVALID_PDF_PAGE_COUNT");
    const editable = await generateBelgeDocument("beton-dokum-tutanagi", {});
    await rejected(editable.bytes, "PDF_FORM_REMAINS");
  });
  it("rejects orphan Widget annotations even without an AcroForm catalog entry", async () => {
    const pdf = await PDFDocument.create(); const page = pdf.addPage();
    const widget = pdf.context.register(pdf.context.obj({ Type: "Annot", Subtype: "Widget", Rect: [0,0,10,10] }));
    page.node.set(PDFName.of("Annots"), pdf.context.obj([widget]) as PDFArray);
    await rejected(await pdf.save(), "PDF_FORM_REMAINS");
  });
  it("actual POST cannot upload a corrupt template in an isolated working directory", () => {
    const root=process.cwd(),fixture=mkdtempSync(join(tmpdir(),"belge-stage12-rejection-"));
    try {
      mkdirSync(join(fixture,"public/belgeler"),{recursive:true});
      cpSync(join(root,"public/fonts"),join(fixture,"public/fonts"),{recursive:true});
      writeFileSync(join(fixture,"public/belgeler/beton-dokum-tutanagi.pdf"),"%PDF-1.7\n"+"invalid ".repeat(50));
      const loader=pathToFileURL(createRequire(join(root,"package.json")).resolve("tsx")).href;
      const output=execFileSync(process.execPath,["--import",loader,join(root,"tests/belgeler/fixtures/stage12-rejected-upload.ts")],{cwd:fixture,env:{...process.env,NODE_ENV:"test",TSX_TSCONFIG_PATH:join(root,"tsconfig.json")},timeout:30000,windowsHide:true,stdio:"pipe"});
      assert.match(output.toString(),/PASS: actual POST/);
    } finally {
      assert.ok(resolve(fixture).startsWith(join(resolve(tmpdir()),"belge-stage12-rejection-")));
      rmSync(fixture,{recursive:true,force:true});
    }
  });
});

describe("ASAMA_12: filenames do not constrain user form values", () => {
  const now = new Date("2026-10-23T21:30:00Z");
  it("accepts exactly seven ASCII digits, preserves leading zero, omits every other YIBF", () => {
    for(const value of ["0", "123456", "12345678", "12a34567", "123 4567", "１２３４５６７", "1234567/../../", "-", "YIBF-12345678"]) {
      assert.equal(formatYibfPart(value), "");
      assert.equal(buildBelgeFilename("beton-dokum-tutanagi", { yibf:value },now), "Beton-Tutanagi_2026-10-24.pdf");
    }
    assert.equal(formatYibfPart("  YİBF-0071234  "),"YIBF-0071234");
    assert.equal(formatYibfPart("0071234",10),"");
  });
  it("keeps leap/invalid dates deterministic and uses Istanbul next-day fallback", () => {
    assert.equal(parseBelgeDateToIso("29.02.2024",now),"2024-02-29");
    for(const value of ["29.02.2023","31.04.2026","", "../../", "2026-13-01"]) assert.equal(parseBelgeDateToIso(value,now),"2026-10-24");
    for(const triple of [[NaN,2,2],[2026,2.1,2],[2026,2,1.5],[Infinity,1,1]]) assert.equal(isValidCalendarDate(...triple as [number,number,number]),false);
  });
  it("all five empty names, sample names, unicode/path inputs and long names stay <=100 ASCII characters", () => {
    const fields=["yibf","santiye_sefi_ad_soyad","ad_soyad","ad_soyad","santiye_sefi_ad"];
    stage12Documents.forEach((doc,index)=>{
      for(const value of ["", "HÜSEYİN GÜNAYDIN", "Çığ IŞIK İpek 😊/../../".repeat(20)]) {
        const filename=buildBelgeFilename(doc.id,{[fields[index]]:value},now);
        assert.match(filename,/^[A-Za-z0-9_-]+\.pdf$/);assert.ok(filename.length<=100);
        assert.ok(!filename.toLowerCase().includes("huseyin-gunaydin"));
        assert.ok(filename.endsWith("2026-10-24.pdf"));
      }
    });
  });
  it("explicit filename overrides on all five download helpers stay intact", async () => {
    const previousWindow=Object.getOwnPropertyDescriptor(globalThis,"window"),previousDocument=Object.getOwnPropertyDescriptor(globalThis,"document");
    const create=URL.createObjectURL,revoke=URL.revokeObjectURL,timeout=globalThis.setTimeout;
    const clicks:string[]=[];const timers:ReturnType<typeof setTimeout>[]=[];
    try {
      Object.defineProperty(globalThis,"window",{configurable:true,value:{}});
      Object.defineProperty(globalThis,"document",{configurable:true,value:{createElement:()=>{const link={href:"",download:"",click:()=>clicks.push(link.download)};return link;},body:{appendChild(){},removeChild(){}}}});
      URL.createObjectURL=()=>"blob:isolated";URL.revokeObjectURL=()=>{};
      globalThis.setTimeout=((...args:Parameters<typeof setTimeout>)=>{const timer=timeout(...args);timers.push(timer);return timer;}) as typeof setTimeout;
      for(const download of [downloadFilledBetonDokumPdf,downloadFilledTaahhutnamePdf,downloadFilledIstifaDilekcesiPdf,downloadFilledInsaatRuhsatiPdf,downloadFilledSozlesmePdf]) await download({},"Ozel-Ad.pdf",new Uint8Array([1,2,3]));
      assert.deepEqual(clicks,Array(5).fill("Ozel-Ad.pdf"));
    } finally {
      timers.forEach(clearTimeout);globalThis.setTimeout=timeout;URL.createObjectURL=create;URL.revokeObjectURL=revoke;
      if(previousWindow)Object.defineProperty(globalThis,"window",previousWindow);else Reflect.deleteProperty(globalThis,"window");
      if(previousDocument)Object.defineProperty(globalThis,"document",previousDocument);else Reflect.deleteProperty(globalThis,"document");
    }
  });
});
