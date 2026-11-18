/** P02: çıktı kimliği/gerçek kayıt kapsamı; sabit bölüm sayısı hesap doğruluğu sayılmaz. */
import test from "node:test";
import assert from "node:assert/strict";
import { generateStaticReportPDF,generateQuantityReportPDF } from "../../src/lib/hsyncad/reports";
import { calculateFullTakeoff } from "../../src/lib/hsyncad/quantities";
import { smallSlab,manyColumns,preliminaryRecords,pdfText } from "../hsyncad-structural/report-fixtures";
test("Turkish metadata survives extraction without borrowed author",async()=>{
 const m=smallSlab();m.name="Çığ Şölen Üsküdar İğdır ıĞğŞşÖöÜü";
 const {text}=await pdfText(await generateStaticReportPDF(m));assert.ok(text.includes(m.name));assert.doesNotMatch(text,/Fahrettin|698927828|E-İMZALIDIR/);
});
test("long metadata wraps and keeps the final character sequence",async()=>{
 const m=smallSlab();m.name="Uzun proje ".repeat(80)+"SON-KÜNYE";
 const {text}=await pdfText(await generateStaticReportPDF(m));assert.match(text,/SON-KÜNYE/);
});
test("100 columns paginate and include last failing record",async()=>{
 const m=manyColumns(100),a=preliminaryRecords(m);a.members["column-99"].pass=false;
 const {text,pages}=await pdfText(await generateStaticReportPDF(m,a));assert.ok(pages>5);assert.match(text,/column-99/);assert.match(text,/SAĞLANMADI/);assert.doesNotMatch(text,/TÜM SINIRLAR SAĞLANDI/);
});
test("quantity PDF has last item and explicit unknown total",async()=>{
 const m=manyColumns(100),{text}=await pdfText(await generateQuantityReportPDF(m,calculateFullTakeoff(m)));
 assert.match(text,/column-99/);assert.match(text,/VERİ EKSİK/);assert.doesNotMatch(text,/117[.,]421/);
});
test("sparse old analysis does not add example numbers or fake modals",async()=>{
 const m=manyColumns(1),a=preliminaryRecords(m);a.modes=[];
 const {text}=await pdfText(await generateStaticReportPDF(m,a));assert.doesNotMatch(text,/0[.,]837|43196|1157[.,]9|Dinamik Analizle Çözülmüştür/);assert.match(text,/DOĞRULAMA GEREKLİ/);
});
