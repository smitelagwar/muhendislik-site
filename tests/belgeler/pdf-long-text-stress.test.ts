import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, PDFTextField } from "pdf-lib";
import {
  BETON_DOKUM_DEFAULT_DATA,
  INSAAT_RUHSATI_DEFAULT_DATA,
  ISTIFA_DILEKCESI_DEFAULT_DATA,
  SOZLESME_DEFAULT_DATA,
  TAAHHUTNAME_DEFAULT_DATA,
  generateBetonDokumPdf,
  generateInsaatRuhsatiPdf,
  generateIstifaDilekcesiPdf,
  generateSozlesmePdf,
  generateTaahhutnamePdf,
  type BetonDokumData,
  type InsaatRuhsatiData,
  type IstifaDilekcesiData,
  type SozlesmeData,
  type TaahhutnameData,
} from "../../src/lib/pdf-engine";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const outputDir = resolve(repoRoot, "test-results/belgeler-pdf-stress");
mkdirSync(outputDir, { recursive: true });

const turkishStress =
  "ÇĞİÖŞÜ çğıöşü — mühendislik kontrolü; çok uzun içerik sınaması";

type StressCase = {
  id: string;
  expectedPages: number;
  data: object;
  generate: (data: object) => Promise<Uint8Array>;
};

const cases: StressCase[] = [
  {
    id: "beton-dokum-tutanagi",
    expectedPages: 1,
    data: {
      ...BETON_DOKUM_DEFAULT_DATA,
      tutanak_alt_baslik:
        "BETON DÖKÜMÜ SİSTEM ONAYI VE SAHA TESPİTİ HAKKINDA UZUN BAŞLIK",
      yer:
        "ANKARA İli ÇANKAYA İlçesi Çok Uzun Örnek Mahallesi Mühendisler Bulvarı No:123/A Blok:8 Kat:12 Daire:34 — " +
        turkishStress,
      olay_aciklamasi:
        "Birinci satır: şantiye sahasında gerçekleştirilen beton dökümü sırasında sistem onayı alınamamıştır. " +
        turkishStress +
        "\nİkinci satır: saha ekibi, yapı denetim ve laboratuvar temsilcileri ile birlikte ayrıntılı kontrol yapılmıştır. " +
        turkishStress,
      gozlem_notlar:
        "Gözlem notu birinci satır — " +
        turkishStress +
        "\nGözlem notu ikinci satır — beton sınıfı, sevk irsaliyesi ve döküm koşulları ayrıca kontrol edilmiştir.",
      laboratuvar:
        "ÇOK UZUN BETON VE YAPI MALZEMELERİ DENEY LABORATUVARI MÜHENDİSLİK SANAYİ VE TİCARET ANONİM ŞİRKETİ",
      muteahhit:
        "ÇOK UZUN ÖRNEK İNŞAAT TAAHHÜT MÜHENDİSLİK MİMARLIK SANAYİ VE TİCARET LİMİTED ŞİRKETİ",
      santiye_sefi:
        "İnş. Müh. ÇAĞATAY ŞÜKRÜ İBRAHİM ÖZTÜRK UZUN SOYAD DENEMESİ",
      yapi_denetim:
        "ÇOK UZUN GÜVENLİ YAPI DENETİM MÜHENDİSLİK VE MÜŞAVİRLİK LİMİTED ŞİRKETİ",
    } satisfies BetonDokumData,
    generate: (data) =>
      generateBetonDokumPdf(data as BetonDokumData, { flatten: false }),
  },
  {
    id: "insaat-ruhsati-dilekcesi",
    expectedPages: 1,
    data: {
      ...INSAAT_RUHSATI_DEFAULT_DATA,
      belediye_adi:
        "ÇOK UZUN ÖRNEK BÜYÜKŞEHİR İLÇE BELEDİYE BAŞKANLIĞI",
      mudurluk_adi:
        "İMAR, ŞEHİRCİLİK, YAPI KONTROL VE RUHSAT DENETİM MÜDÜRLÜĞÜNE",
      ana_metin:
        "İlçenin çok uzun isimli örnek mahallesinde bulunan taşınmaz için yeni yapı ruhsatı düzenlenmesini talep ediyorum. " +
        turkishStress +
        "\nİkinci satırda başvuru kapsamı, yapı sahibi bilgileri ve talep edilen işlem ayrıntılı biçimde açıklanmaktadır.",
      ad_soyad:
        "ÇAĞATAY ŞÜKRÜ İBRAHİM ÖZTÜRK UZUN AD SOYAD DENEMESİ",
      unvan:
        "YAPI SAHİBİ VE YETKİLİ BAŞVURU TEMSİLCİSİ",
      adres:
        "Adres: Çok Uzun Örnek Mahallesi Mühendisler Bulvarı No:123/A Blok:8 Kat:12 Daire:34\nÇankaya / ANKARA — " +
        turkishStress,
      tel: "Tel: 0555 111 22 33 / 0555 444 55 66",
    } satisfies InsaatRuhsatiData,
    generate: (data) =>
      generateInsaatRuhsatiPdf(data as InsaatRuhsatiData, { flatten: false }),
  },
  {
    id: "santiye-sefi-istifa-dilekcesi",
    expectedPages: 1,
    data: {
      ...ISTIFA_DILEKCESI_DEFAULT_DATA,
      hitap_1:
        "ÇOK UZUN ÖRNEK BELEDİYE BAŞKANLIĞI İMAR VE ŞEHİRCİLİK MÜDÜRLÜĞÜNE",
      hitap_2: "ÇANKAYA / ANKARA — " + turkishStress,
      ana_paragraf:
        "Arsa sahibi Çok Uzun Örnek İnşaat Mühendislik Mimarlık Sanayi ve Ticaret Limited Şirketi adına kayıtlı taşınmazdaki şantiye şefliği görevimden ayrılıyorum. " +
        turkishStress +
        "\nİkinci satırda istifa bildiriminin kapsamı ve ilgili yapı bilgileri ayrıntılı olarak belirtilmektedir.",
      sonuc_cumlesi:
        "Şantiye şefliği görevimden istifa ettiğimi bildirir, gerekli idari işlemlerin gerçekleştirilmesini arz ederim. " +
        turkishStress,
      unvan:
        "İNŞAAT MÜHENDİSİ — ŞANTİYE ŞEFİ",
      ad_soyad:
        "ÇAĞATAY ŞÜKRÜ İBRAHİM ÖZTÜRK UZUN AD SOYAD DENEMESİ",
      adres_deger:
        "Çok Uzun Örnek Mahallesi Mühendisler Bulvarı No:123/A Blok:8 Kat:12 Daire:34 Çankaya / ANKARA — " +
        turkishStress,
      iletisim_deger: "0555 111 22 33 / 0555 444 55 66",
    } satisfies IstifaDilekcesiData,
    generate: (data) =>
      generateIstifaDilekcesiPdf(data as IstifaDilekcesiData, { flatten: false }),
  },
  {
    id: "santiye-sefi-sozlesmesi",
    expectedPages: 2,
    data: {
      ...SOZLESME_DEFAULT_DATA,
      muteahhit_unvan:
        "ÇOK UZUN ÖRNEK İNŞAAT TAAHHÜT MÜHENDİSLİK MİMARLIK SANAYİ VE TİCARET LİMİTED ŞİRKETİ",
      santiye_sefi_ad:
        "ÇAĞATAY ŞÜKRÜ İBRAHİM ÖZTÜRK UZUN AD SOYAD DENEMESİ",
      il: "KAHRAMANMARAŞ",
      ilce: "ONİKİŞUBAT",
      adres:
        "Çok Uzun Örnek Mahallesi Mühendisler Bulvarı No:123/A Blok:8 Kat:12 Daire:34\nOnikişubat / KAHRAMANMARAŞ — " +
        turkishStress,
      mahalle:
        "ÇOK UZUN ÖRNEK MÜHENDİSLER VE YAPI DENETİM MAHALLESİ",
      santiye_sefi_imza_adi:
        "ÇAĞATAY ŞÜKRÜ İBRAHİM ÖZTÜRK UZUN AD SOYAD DENEMESİ",
      muteahhit_imza_unvan:
        "ÇOK UZUN ÖRNEK İNŞAAT TAAHHÜT MÜHENDİSLİK LİMİTED ŞİRKETİ",
    } satisfies SozlesmeData,
    generate: (data) =>
      generateSozlesmePdf(data as SozlesmeData, { flatten: false }),
  },
  {
    id: "santiye-sefi-taahhutnamesi",
    expectedPages: 1,
    data: {
      ...TAAHHUTNAME_DEFAULT_DATA,
      santiye_sefi_ad_soyad:
        "ÇAĞATAY ŞÜKRÜ İBRAHİM ÖZTÜRK UZUN AD SOYAD DENEMESİ",
      unvan:
        "İNŞAAT YÜKSEK MÜHENDİSİ — ŞANTİYE ŞEFİ VE TEKNİK SORUMLU",
      adres:
        "Çok Uzun Örnek Mahallesi Mühendisler Bulvarı No:123/A Blok:8 Kat:12 Daire:34 Çankaya / ANKARA — " +
        turkishStress,
      ilgili_idare:
        "ÇOK UZUN ÖRNEK BELEDİYE BAŞKANLIĞI İMAR VE ŞEHİRCİLİK MÜDÜRLÜĞÜ",
      pafta_ada_parsel:
        "Pafta: ÇOK-UZUN-PAFTA-ADI, Ada: 123456, Parsel: 7891011",
      yapi_adresi:
        "Çok Uzun Yapı Adresi, Örnek Mahallesi Mühendisler Bulvarı No:999/A Blok:20 Kat:15 Daire:60 Çankaya / ANKARA — " +
        turkishStress,
      yapi_sahibi:
        "ÇOK UZUN ÖRNEK YAPI GELİŞTİRME İNŞAAT MÜHENDİSLİK SANAYİ VE TİCARET ANONİM ŞİRKETİ",
      yapi_sahibi_adresi:
        "Çok Uzun Şirket Merkezi Adresi, Teknoloji Caddesi No:88 Kat:9 Çankaya / ANKARA — " +
        turkishStress,
      unvan_imza:
        "İNŞAAT YÜKSEK MÜHENDİSİ — ŞANTİYE ŞEFİ",
    } satisfies TaahhutnameData,
    generate: (data) =>
      generateTaahhutnamePdf(data as TaahhutnameData, { flatten: false }),
  },
];

async function main() {
  for (const testCase of cases) {
    const pdfBytes = await testCase.generate(testCase.data);
    assert.ok(pdfBytes.byteLength > 0, `${testCase.id}: stres PDF üretilemedi`);
  
    const pdfDocument = await PDFDocument.load(pdfBytes);
    assert.equal(
      pdfDocument.getPageCount(),
      testCase.expectedPages,
      `${testCase.id}: stres PDF sayfa sayısı değişti`
    );
  
    const form = pdfDocument.getForm();
  
    for (const [fieldName, expectedValue] of Object.entries(testCase.data)) {
      if (typeof expectedValue !== "string") continue;
  
      const field = form.getFieldMaybe(fieldName);
      if (!(field instanceof PDFTextField)) continue;
  
      assert.equal(
        field.getText(),
        expectedValue,
        `${testCase.id}/${fieldName}: PDF alan değeri sessiz kesildi veya değişti`
      );
    }
  
    writeFileSync(resolve(outputDir, `${testCase.id}-stress.pdf`), pdfBytes);
  }
  
  
  console.log(
    `Belge uzun metin stres üretimi başarılı. Görsel taşma kontrolü için çıktılar: ${outputDir}`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
