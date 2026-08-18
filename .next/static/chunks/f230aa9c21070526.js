(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,410160,e=>{"use strict";function a(e){return(a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}e.s(["default",()=>a])},330666,e=>{"use strict";function a(e,a){return{yil:2026,grup:e,sinif:a}}let t=[{id:"villa-bungalov",label:"Villa, dağ evi, bungalov",shortLabel:"Villa / Bungalov",description:"Düşük katlı müstakil betonarme konutlar için dengeli ön keşif katsayıları.",officialSelection:a("II","C"),defaultStructuralSystem:"cerceve",defaultSlabSystem:"kirisli",defaultFoundationType:"radye",defaultSeismicDemand:"orta",defaultPlanCompactness:"standart",defaultBasementRetainingCondition:"yok",defaultSpanClass:"standart",applicationNote:"Müstakil konutlarda merdiven-çekirdek etkisi sınırlı, kiriş-döşeme etkisi ise toplam maliyette baskındır.",warningTone:"info",carryingShareBand:{low:.24,expected:.3,high:.36},baseBreakdown:{temel:{betonM3PerM2:.22,donatiKgPerM2:24,kalipM2PerM2:.72},kolonPerde:{betonM3PerM2:.042,donatiKgPerM2:4.8,kalipM2PerM2:.42},kirisDoseme:{betonM3PerM2:.13,donatiKgPerM2:18,kalipM2PerM2:.78},merdivenCekirdek:{betonM3PerM2:.01,donatiKgPerM2:1.2,kalipM2PerM2:.06}}},{id:"apartman-3-kat",label:"Apartman / 3 kat ve altı",shortLabel:"Apartman 3 Kat",description:"Az katlı betonarme apartmanlar ve küçük ölçekli konut blokları.",officialSelection:a("III","A"),defaultStructuralSystem:"cerceve",defaultSlabSystem:"kirisli",defaultFoundationType:"surekli",defaultSeismicDemand:"orta",defaultPlanCompactness:"standart",defaultBasementRetainingCondition:"tam",defaultSpanClass:"standart",applicationNote:"Düşük katlı apartmanlarda temel ve kirişli döşeme dengesi genellikle perdeli sistemlerden daha hafiftir.",warningTone:"info",carryingShareBand:{low:.22,expected:.28,high:.34},baseBreakdown:{temel:{betonM3PerM2:.24,donatiKgPerM2:28,kalipM2PerM2:.78},kolonPerde:{betonM3PerM2:.06,donatiKgPerM2:6.5,kalipM2PerM2:.52},kirisDoseme:{betonM3PerM2:.16,donatiKgPerM2:20,kalipM2PerM2:.88},merdivenCekirdek:{betonM3PerM2:.011,donatiKgPerM2:1.4,kalipM2PerM2:.08}}},{id:"apartman-4-7-kat",label:"Apartman / 4-7 kat",shortLabel:"Apartman 4-7 Kat",description:"Orta katlı konut blokları için radye ve perde etkisini içeren referans set.",officialSelection:a("III","B"),defaultStructuralSystem:"cercevePerde",defaultSlabSystem:"kirisli",defaultFoundationType:"radye",defaultSeismicDemand:"orta",defaultPlanCompactness:"standart",defaultBasementRetainingCondition:"tam",defaultSpanClass:"standart",applicationNote:"Bu bant, tipik şehir apartmanında temel-perde ve kiriş-döşeme paketini birlikte öne çıkarır.",warningTone:"warning",carryingShareBand:{low:.21,expected:.27,high:.33},baseBreakdown:{temel:{betonM3PerM2:.35,donatiKgPerM2:34,kalipM2PerM2:.82},kolonPerde:{betonM3PerM2:.07,donatiKgPerM2:8.5,kalipM2PerM2:.75},kirisDoseme:{betonM3PerM2:.17,donatiKgPerM2:22,kalipM2PerM2:1.12},merdivenCekirdek:{betonM3PerM2:.015,donatiKgPerM2:1.6,kalipM2PerM2:.09}}},{id:"apartman-8-10-kat",label:"Apartman / 8-10 kat",shortLabel:"Apartman 8-10 Kat",description:"Yüksekliği artan konut bloklarında perde ve çekirdek yoğunluğu artan set.",officialSelection:a("III","C"),defaultStructuralSystem:"cercevePerde",defaultSlabSystem:"kirisli",defaultFoundationType:"radye",defaultSeismicDemand:"yuksek",defaultPlanCompactness:"standart",defaultBasementRetainingCondition:"tam",defaultSpanClass:"standart",applicationNote:"Perde yoğunluğu ve çekirdek etkisi, orta katlı apartman tipine göre daha belirgindir.",warningTone:"warning",carryingShareBand:{low:.2,expected:.26,high:.32},baseBreakdown:{temel:{betonM3PerM2:.38,donatiKgPerM2:38,kalipM2PerM2:.86},kolonPerde:{betonM3PerM2:.082,donatiKgPerM2:10.2,kalipM2PerM2:.82},kirisDoseme:{betonM3PerM2:.175,donatiKgPerM2:23.5,kalipM2PerM2:1.14},merdivenCekirdek:{betonM3PerM2:.016,donatiKgPerM2:1.8,kalipM2PerM2:.095}}},{id:"apartman-11-17-kat",label:"Apartman / 11-17 kat",shortLabel:"Apartman 11-17 Kat",description:"Yüksek konutlarda daha yoğun perde, çekirdek ve temel etkisini taşıyan set.",officialSelection:a("IV","A"),defaultStructuralSystem:"perdeAgirlikli",defaultSlabSystem:"duzPlak",defaultFoundationType:"radye",defaultSeismicDemand:"yuksek",defaultPlanCompactness:"standart",defaultBasementRetainingCondition:"tam",defaultSpanClass:"standart",applicationNote:"Yapı yüksekliği arttıkça perde, çekirdek ve radye etkisi daha baskın hale gelir.",warningTone:"warning",carryingShareBand:{low:.18,expected:.24,high:.3},baseBreakdown:{temel:{betonM3PerM2:.42,donatiKgPerM2:45,kalipM2PerM2:.9},kolonPerde:{betonM3PerM2:.095,donatiKgPerM2:12.5,kalipM2PerM2:.92},kirisDoseme:{betonM3PerM2:.18,donatiKgPerM2:26,kalipM2PerM2:1.18},merdivenCekirdek:{betonM3PerM2:.018,donatiKgPerM2:2,kalipM2PerM2:.1}}},{id:"apartman-18-kat-uzeri",label:"Apartman / 18 kat ve üzeri",shortLabel:"Apartman 18+ Kat",description:"Çekirdek ve perde etkisi çok yüksek olan yüksek konut şemaları.",officialSelection:a("IV","B"),defaultStructuralSystem:"perdeAgirlikli",defaultSlabSystem:"duzPlak",defaultFoundationType:"radye",defaultSeismicDemand:"yuksek",defaultPlanCompactness:"standart",defaultBasementRetainingCondition:"tam",defaultSpanClass:"standart",applicationNote:"Bu bant, ön keşif amaçlıdır; yüksek yapılarda statik modelden bağımsız karar için kullanılmamalıdır.",warningTone:"warning",carryingShareBand:{low:.17,expected:.23,high:.29},baseBreakdown:{temel:{betonM3PerM2:.48,donatiKgPerM2:52,kalipM2PerM2:.95},kolonPerde:{betonM3PerM2:.11,donatiKgPerM2:15,kalipM2PerM2:1},kirisDoseme:{betonM3PerM2:.185,donatiKgPerM2:29,kalipM2PerM2:1.2},merdivenCekirdek:{betonM3PerM2:.02,donatiKgPerM2:2.2,kalipM2PerM2:.105}}},{id:"ofis-banka-idari",label:"Ofis, banka, borsa, idari bina",shortLabel:"Ofis / İdari",description:"Çekirdek ve açıklık talebi yüksek ofis yapıları için dengeli ön keşif seti.",officialSelection:a("IV","B"),defaultStructuralSystem:"cercevePerde",defaultSlabSystem:"duzPlak",defaultFoundationType:"radye",defaultSeismicDemand:"yuksek",defaultPlanCompactness:"standart",defaultBasementRetainingCondition:"tam",defaultSpanClass:"genis",applicationNote:"Ofis bloklarında çekirdek, perde ve düz plak ilişkisi tipik konutlardan farklı bir donatı deseni üretir.",warningTone:"warning",carryingShareBand:{low:.19,expected:.25,high:.31},baseBreakdown:{temel:{betonM3PerM2:.4,donatiKgPerM2:40,kalipM2PerM2:.88},kolonPerde:{betonM3PerM2:.09,donatiKgPerM2:11.5,kalipM2PerM2:.78},kirisDoseme:{betonM3PerM2:.165,donatiKgPerM2:22,kalipM2PerM2:1},merdivenCekirdek:{betonM3PerM2:.022,donatiKgPerM2:2.5,kalipM2PerM2:.12}}},{id:"otopark-akaryakit",label:"Otopark, akaryakıt, küçük ticari",shortLabel:"Otopark / Ticari",description:"Açık veya kapalı otopark karakteri baskın hafif ticari yapılar için set.",officialSelection:a("III","A"),defaultStructuralSystem:"cerceve",defaultSlabSystem:"kirisli",defaultFoundationType:"surekli",defaultSeismicDemand:"orta",defaultPlanCompactness:"kompakt",defaultBasementRetainingCondition:"kismi",defaultSpanClass:"genis",applicationNote:"Bu set, kapalı otopark ve küçük ticari yapılarda tipik betonarme ağırlığını temsil eder.",warningTone:"info",carryingShareBand:{low:.22,expected:.27,high:.33},baseBreakdown:{temel:{betonM3PerM2:.3,donatiKgPerM2:30,kalipM2PerM2:.84},kolonPerde:{betonM3PerM2:.065,donatiKgPerM2:7.5,kalipM2PerM2:.7},kirisDoseme:{betonM3PerM2:.16,donatiKgPerM2:20,kalipM2PerM2:1.06},merdivenCekirdek:{betonM3PerM2:.009,donatiKgPerM2:1.2,kalipM2PerM2:.05}}},{id:"karma-kullanim",label:"Karma kullanım, konut + ticaret",shortLabel:"Karma Kullanım",description:"Konut + ticari ortak çekirdekli karma betonarme yapılarda daha ağır taşıyıcı set.",officialSelection:a("V","A"),defaultStructuralSystem:"cercevePerde",defaultSlabSystem:"duzPlak",defaultFoundationType:"radye",defaultSeismicDemand:"yuksek",defaultPlanCompactness:"girintili",defaultBasementRetainingCondition:"tam",defaultSpanClass:"genis",applicationNote:"Karma kullanımlı yapılarda kat farklılıkları ve çekirdek yoğunluğu doğrudan donatı ağırlığını artırır.",warningTone:"warning",carryingShareBand:{low:.19,expected:.25,high:.32},baseBreakdown:{temel:{betonM3PerM2:.41,donatiKgPerM2:42,kalipM2PerM2:.88},kolonPerde:{betonM3PerM2:.095,donatiKgPerM2:12,kalipM2PerM2:.84},kirisDoseme:{betonM3PerM2:.175,donatiKgPerM2:24,kalipM2PerM2:1.08},merdivenCekirdek:{betonM3PerM2:.02,donatiKgPerM2:2.2,kalipM2PerM2:.12}}}],i=new Map(t.map(e=>[e.id,e])),r=[...new Set(t.map(e=>`${e.officialSelection.grup}-${e.officialSelection.sinif}`))];function n(){return t}function l(e){return i.get(e)??null}function o(){return t[2]}function d(e){return r.includes(`${e.grup}-${e.sinif}`)}e.s(["QUICK_QUANTITY_FOUNDATION_OPTIONS",0,[{value:"radye",label:"Radye Temel"},{value:"surekli",label:"Sürekli Temel"},{value:"tekil",label:"Tekil Temel"}],"QUICK_QUANTITY_PLAN_OPTIONS",0,[{value:"kompakt",label:"Kompakt Plan",description:"Kareye yakın, çevre uzunluğu düşük, sade plan kurgusu."},{value:"standart",label:"Standart Plan",description:"Tipik apartman/ofis planı, orta çevre uzunluğu."},{value:"girintili",label:"Girintili / Çıkıntılı",description:"Perimetre ve kalıp yüzeyi artan plan kurgusu."}],"QUICK_QUANTITY_RETAINING_OPTIONS",0,[{value:"yok",label:"Çevre Perdesi Yok",description:"Bodrum yok veya çevresel istinat etkisi ihmal edilebilir."},{value:"kismi",label:"Kısmi Çevre Perdesi",description:"Kısmen gömülü veya sadece birkaç cephede bodrum perdesi."},{value:"tam",label:"Tam Çevre Perdesi",description:"Parsel sınırına yakın, tipik şehir içi tam bodrum çevre perdesi."}],"QUICK_QUANTITY_SEISMIC_OPTIONS",0,[{value:"dusuk",label:"Düşük Deprem Talebi",description:"Düşük sismik talep veya rijitlik ihtiyacının sınırlı olduğu senaryolar."},{value:"orta",label:"Standart Deprem Talebi",description:"Türkiye şehir içi tipik betonarme yapı varsayımı."},{value:"yuksek",label:"Yüksek Deprem Talebi",description:"Perde, düğüm bölgesi ve temel zorlamasının belirgin arttığı senaryolar."}],"QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS",0,[{value:"kirisli",label:"Kirişli Döşeme"},{value:"asmolen",label:"Asmolen Döşeme"},{value:"duzPlak",label:"Düz Plak"}],"QUICK_QUANTITY_SOIL_OPTIONS",0,[{value:"ZA",label:"ZA"},{value:"ZB",label:"ZB"},{value:"ZC",label:"ZC"},{value:"ZD",label:"ZD"},{value:"ZE",label:"ZE"}],"QUICK_QUANTITY_SPAN_OPTIONS",0,[{value:"dar",label:"Dar Açıklık",description:"Kolon sıklığı artan, döşeme açıklığı görece kısa planlar."},{value:"standart",label:"Standart Açıklık",description:"Konut ve tipik ofis projelerinde yaygın açıklık bandı."},{value:"genis",label:"Geniş Açıklık",description:"Otopark, ofis veya seyrek kolonlu ticari açıklıklar."}],"QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS",0,[{value:"cerceve",label:"Çerçeve"},{value:"cercevePerde",label:"Çerçeve + Perde"},{value:"perdeAgirlikli",label:"Perde Ağırlıklı"}],"getQuickQuantityDefaultPreset",()=>o,"getQuickQuantityPreset",()=>l,"getQuickQuantityPresets",()=>n,"isQuickQuantityOfficialSelectionSupported",()=>d])},265362,e=>{"use strict";var a=e.i(255749),t=e.i(599007),i=e.i(456906),r=e.i(330666);let n="IBMPlexSerif";function l(e){return e.replace(/\r?\n/g," ").replace(/\u00a0/g," ").replace(/[–—]/g,"-").replace(/[“”]/g,'"').replace(/[’‘]/g,"'").replace(/\s+/g," ").trim()}function o(e,a,t){e.setFont(n,"bold"),e.setFontSize(12),e.text(l(a),14,t),e.setFont(n,"normal")}function d(e,a,t,i=182,r=5){let n=t;for(let t of(e.setFontSize(9),a)){let a=e.splitTextToSize(l(t),i);e.text(a,14,n),n+=a.length*r}return n}function s(e,a){return e.find(e=>e.value===a)?.label??a}function p(e){return e}function c(e){let p,c=((p=new a.jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:!0})).__quickQuantityFontsReady||(p.addFileToVFS("IBMPlexSerif-Regular.ttf",t.PDF_SERIF_REGULAR_BASE64),p.addFont("IBMPlexSerif-Regular.ttf",n,"normal"),p.addFileToVFS("IBMPlexSerif-Bold.ttf",t.PDF_SERIF_BOLD_BASE64),p.addFont("IBMPlexSerif-Bold.ttf",n,"bold"),p.__quickQuantityFontsReady=!0),p.setFont(n,"normal"),p),{result:u}=e,m=s(r.QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,u.input.tasiyiciSistem),k=s(r.QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,u.input.dosemeSistemi),b=s(r.QUICK_QUANTITY_FOUNDATION_OPTIONS,u.input.temelTipi),f=s(r.QUICK_QUANTITY_SOIL_OPTIONS,u.input.zeminSinifi),y=s(r.QUICK_QUANTITY_SEISMIC_OPTIONS,u.input.depremTalebi),g=s(r.QUICK_QUANTITY_PLAN_OPTIONS,u.input.planKompaktligi),v=u.input.bodrumKatSayisi>0?s(r.QUICK_QUANTITY_RETAINING_OPTIONS,u.input.bodrumCevrePerdesi):"Bodrum yok",M=s(r.QUICK_QUANTITY_SPAN_OPTIONS,u.input.tipikAciklik),P=u.kararOzetleri.find(e=>"saha-zorlugu"===e.id)?.value??"Saha özeti yok",S=c.internal.pageSize.getWidth();c.setFillColor(15,23,42),c.roundedRect(10,10,S-20,24,6,6,"F"),c.setFont(n,"bold"),c.setTextColor(255,255,255),c.setFontSize(18),c.text("Hızlı Metraj Hesaplayıcı",16,21),c.setFontSize(9.5),c.setFont(n,"normal"),c.text(l(u.preset.label),16,28),c.text(l(e.formattedDate),S-16,21,{align:"right"}),c.setTextColor(15,23,42);let T=42;return o(c,"Özet",42),T=d(c,[`Toplam alan: ${(0,i.formatSayi)(u.toplamInsaatAlaniM2,2)} m\xb2`,`Beton: ${(0,i.formatSayi)(u.betonM3,2)} m\xb3`,`Donatı: ${(0,i.formatSayi)(u.donatiTon,2)} ton`,`Kalıp: ${(0,i.formatSayi)(u.kalipM2,2)} m\xb2`,`Doğrudan taşıyıcı maliyet: ${(0,i.formatTL)(u.dogrudanTasiyiciMaliyet)}`,`Doğrudan maliyet yoğunluğu: ${(0,i.formatTL)(u.yogunlukOzet.directCostPerM2).replace(" TL"," TL/m²")}`,`Genişletilmiş kaba yapı: ${(0,i.formatTL)(u.genisletilmisKabaYapiBandi.expectedAmount)}`,`Resm\xee toplam yaklaşık maliyet: ${(0,i.formatTL)(u.officialResult.resmiToplamMaliyet)}`,`Saha zorluğu: ${P}`,`Taşıyıcı payı: ${(0,i.formatYuzde)(u.tasiyiciPayi.actual)} (bant ${(0,i.formatYuzde)(u.tasiyiciPayi.low)} - ${(0,i.formatYuzde)(u.tasiyiciPayi.expected)} - ${(0,i.formatYuzde)(u.tasiyiciPayi.high)})`],T+6)+3,o(c,"Proje Profili",T),T=d(c,[`Taşıyıcı sistem: ${m}`,`D\xf6şeme sistemi: ${k}`,`Temel tipi: ${b}`,`Zemin sınıfı: ${f}`,`Deprem talebi: ${y}`,`Plan kompaktlığı: ${g}`,`Bodrum \xe7evre perdesi: ${v}`,`Tipik a\xe7ıklık: ${M}`],T+6)+3,o(c,"Dağılım",T),T=d(c,u.breakdowns.map(e=>`${e.label}: ${(0,i.formatSayi)(e.betonM3,2)} m\xb3 beton, ${(0,i.formatSayi)(e.donatiTon,2)} ton donatı, ${(0,i.formatSayi)(e.kalipM2,2)} m\xb2 kalıp`),T+6)+3,o(c,"Yardımcı Kaba İşler",T),T=d(c,[...u.yardimciMetrajlar.map(e=>`${e.label}: ${(0,i.formatSayi)(e.quantity,"m"===e.unit?1:2)} ${e.unit}`),`Yardımcı kaba iş bandı: ${(0,i.formatTL)(u.yardimciKabaIsBandi.expectedAmount)} (${(0,i.formatYuzde)(u.yardimciKabaIsBandi.expected)})`],T+6)+3,o(c,"Yardımcı İş Muhasebesi",T),T=d(c,u.yardimciKabaIsDagilimi.slice(0,3).map(e=>`${e.label}: ${(0,i.formatTL)(e.amount)} (${(0,i.formatYuzde)(e.share)})`),T+6)+3,o(c,"Karar Özeti",T),T=d(c,u.kararOzetleri.slice(0,4).map(e=>`${e.title}: ${e.value} \xb7 ${e.note}`),T+6)+3,o(c,"Poz ve Fiyat Dayanakları",T),T=d(c,[`${u.priceBook.entries.concreteC30_37.pozNo} \xb7 ${u.priceBook.entries.concreteC30_37.label} \xb7 ${(0,i.formatM2Fiyat)(u.betonBirimFiyat).replace("/m²","/m³")}`,`${u.priceBook.entries.rebar8To12.pozNo} ve ${u.priceBook.entries.rebar14To28.pozNo} \xb7 Ağırlıklı donatı birim fiyatı \xb7 ${(0,i.formatTL)(u.donatiBirimFiyat).replace(" TL"," TL/ton")}`,`${u.priceBook.entries.formworkPlywood.pozNo} \xb7 ${u.priceBook.entries.formworkPlywood.label} \xb7 ${(0,i.formatTL)(u.kalipBirimFiyat).replace(" TL"," TL/m²")}`,`Resm\xee sınıf: ${u.officialResult.row.sinifKodu} \xb7 ${u.officialResult.row.sinifAdi}`],T+6)+3,o(c,"Notlar",T),d(c,[...u.notes,...u.warnings.map(e=>e.message),`Kaynak: ${u.priceBook.sourceLabel}`,`Kaynak bağlantısı: ${u.priceBook.sourceUrl}`,"Bu çıktı ön keşif / ön boyutlandırma içindir; statik proje, uygulama metrajı ve gerçek keşif yerine geçmez."],T+6),c}function u(e){let a=window.open("","_blank");if(!a)throw Error("Önizleme penceresi açılamadı. Lütfen pop-up engelleyicisini kontrol edin.");let t=function(e){let{result:a,formattedDate:t}=e,n=s(r.QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,a.input.tasiyiciSistem),l=s(r.QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,a.input.dosemeSistemi),o=s(r.QUICK_QUANTITY_FOUNDATION_OPTIONS,a.input.temelTipi),d=s(r.QUICK_QUANTITY_SOIL_OPTIONS,a.input.zeminSinifi);return`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Hızlı Metraj Raporu - ${t}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;700&display=swap');
    :root {
      --paper-bg: #F9F8F4;
      --paper-border: #D2D8E2;
      --official-blue: #102C54;
      --official-accent: #B96A24;
      --ink: #0F172A;
      --body: #334155;
      --muted: #64748B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #F1F5F9;
      font-family: 'IBM Plex Sans', sans-serif;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .paper {
      width: 210mm;
      min-height: 297mm;
      background-color: var(--paper-bg);
      padding: 20mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      position: relative;
      border: 1px solid var(--paper-border);
    }
    .paper::before {
      content: '';
      position: absolute;
      inset: 8mm;
      border: 0.4mm solid var(--paper-border);
      pointer-events: none;
    }
    .toolbar {
      width: 210mm;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      background: white;
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }
    .btn-primary { background: var(--official-blue); color: white; }
    .btn-secondary { background: #E2E8F0; color: var(--body); }
    
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .brand { display: flex; align-items: flex-start; gap: 15px; }
    .logo-mark {
      width: 10mm; height: 14mm;
      border-left: 1mm solid var(--official-blue);
      border-top: 1mm solid var(--official-blue);
      position: relative;
    }
    .logo-mark::after {
      content: 'İB';
      position: absolute; left: 1.5mm; top: 5mm;
      font-weight: 800; font-size: 11px; color: var(--official-blue);
    }
    .brand-text h2 { font-size: 16px; font-weight: 800; color: var(--ink); }
    .brand-text p { font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    
    .date-box {
      border: 1px solid var(--paper-border);
      background: white;
      padding: 5px 15px;
      border-radius: 6px;
      height: fit-content;
      font-size: 10px;
      font-weight: 700;
      color: var(--official-blue);
    }

    .title-area { margin-bottom: 25px; }
    .title-area h1 { font-family: 'IBM Plex Serif', serif; font-size: 26pt; color: var(--official-blue); margin-bottom: 6px; }
    .title-area p { font-size: 11pt; color: var(--body); }

    .grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; margin-bottom: 8mm; }
    .card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px 20px; }
    .card .label { font-size: 9pt; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
    .card .value { font-family: 'IBM Plex Serif', serif; font-size: 18pt; font-weight: 700; color: var(--official-blue); }

    .main-grid { display: grid; grid-template-columns: 105mm 1fr; gap: 6mm; margin-bottom: 8mm; }
    .section-card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; margin-bottom: 6mm; }
    .section-card h3 { font-size: 10pt; font-weight: 700; color: var(--official-blue); border-bottom: 1px solid var(--paper-border); padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; }
    .data-row { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 6px; }
    .data-row .l { color: var(--muted); }
    .data-row .v { font-weight: 700; color: var(--ink); text-align: right; }

    .notes { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; }
    .notes h3 { font-size: 9pt; font-weight: 700; color: var(--official-blue); margin-bottom: 10px; }
    .notes ul { list-style: none; }
    .notes li { font-size: 8.5pt; color: var(--muted); margin-bottom: 5px; position: relative; padding-left: 15px; }
    .notes li::before { content: '•'; position: absolute; left: 0; color: var(--official-accent); }

    [contenteditable="true"]:hover { outline: 1px dashed var(--official-accent); background: rgba(0,0,0,0.02); }
    [contenteditable="true"]:focus { outline: 2px solid var(--official-accent); background: white; }

    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .paper { box-shadow: none; border: none; padding: 15mm; margin: 0; }
      .paper::before { inset: 5mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 10px; height: 10px; background: var(--official-accent); border-radius: 50%;"></div>
      <span style="font-size: 13px; font-weight: 600; color: var(--body);">D\xfczenlenebilir Metraj Raporu</span>
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-secondary" onclick="window.close()">Kapat</button>
      <button class="btn btn-primary" onclick="window.print()">Yazdır veya PDF Kaydet</button>
    </div>
  </div>

  <div class="paper">
    <div class="header">
      <div class="brand">
        <div class="logo-mark"></div>
        <div class="brand-text">
          <h2 contenteditable="true">İNŞA BLOG</h2>
          <p contenteditable="true">M\xfchendislik \xb7 Yapı \xb7 Analiz</p>
        </div>
      </div>
      <div class="date-box" contenteditable="true">${t}</div>
    </div>

    <div class="title-area">
      <h1 contenteditable="true">Hızlı Metraj Raporu</h1>
      <p contenteditable="true">${a.preset.label}</p>
    </div>

    <div class="grid-4">
      <div class="card">
        <div class="label" contenteditable="true">Beton</div>
        <div class="value" contenteditable="true">${(0,i.formatSayi)(a.betonM3,2)} m\xb3</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Donatı</div>
        <div class="value" contenteditable="true">${(0,i.formatSayi)(a.donatiTon,2)} ton</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Kalıp</div>
        <div class="value" contenteditable="true">${(0,i.formatSayi)(a.kalipM2,2)} m\xb2</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Toplam Maliyet</div>
        <div class="value" contenteditable="true">${(0,i.formatTL)(a.dogrudanTasiyiciMaliyet)}</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="col-left">
        <div class="section-card">
          <h3 contenteditable="true">Proje Profili</h3>
          <div class="data-row"><span class="l" contenteditable="true">Taşıyıcı Sistem</span><span class="v" contenteditable="true">${n}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">D\xf6şeme Sistemi</span><span class="v" contenteditable="true">${l}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Temel Tipi</span><span class="v" contenteditable="true">${o}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Zemin Sınıfı</span><span class="v" contenteditable="true">${d}</span></div>
        </div>
      </div>
      <div class="col-right">
        <div class="section-card">
          <h3 contenteditable="true">Maliyet \xd6zeti</h3>
          <div class="data-row"><span class="l" contenteditable="true">Resm\xee Yaklaşık Maliyet</span><span class="v" contenteditable="true">${(0,i.formatTL)(a.officialResult.resmiToplamMaliyet)}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Yoğunluk (TL/m\xb2)</span><span class="v" contenteditable="true">${(0,i.formatTL)(a.yogunlukOzet.directCostPerM2)}</span></div>
        </div>
        <div class="section-card">
          <h3 contenteditable="true">Dayanaklar</h3>
          <div class="data-row"><span class="v" style="text-align: left; font-size: 8pt;" contenteditable="true">${a.priceBook.sourceLabel} referans fiyatları baz alınmıştır.</span></div>
        </div>
      </div>
    </div>

    <div class="notes">
      <h3 contenteditable="true">Notlar</h3>
      <ul>
        ${a.notes.slice(0,3).map(e=>`<li contenteditable="true">${e}</li>`).join("")}
        <li contenteditable="true">Bu \xe7ıktı \xf6n keşif i\xe7indir; statik proje yerine ge\xe7mez.</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `}(e);a.document.write(t),a.document.close()}function m(e,a){c(e).save(a)}function k(e){let a=c(e).output("blob"),t=URL.createObjectURL(a),i=window.open(t,"_blank");if(!i)throw URL.revokeObjectURL(t),Error("Yazdırma penceresi açılamadı.");window.setTimeout(()=>{try{i.focus(),i.print()}catch{}},1200),window.setTimeout(()=>{URL.revokeObjectURL(t)},6e4)}e.s(["buildQuickQuantityPdfSnapshot",()=>p,"createQuickQuantityPdfDocument",()=>c,"downloadQuickQuantityPdf",()=>m,"openQuickQuantityPdfPreview",()=>u,"printQuickQuantityPdf",()=>k])},48503,e=>{e.v(a=>Promise.all(["static/chunks/034945ea23f7a8ce.js"].map(a=>e.l(a))).then(()=>a(915833)))},870653,e=>{e.v(a=>Promise.all(["static/chunks/65bce5caaac3bf66.js"].map(a=>e.l(a))).then(()=>a(424154)))},195111,e=>{e.v(a=>Promise.all(["static/chunks/eac72d18bf6462e2.js"].map(a=>e.l(a))).then(()=>a(38201)))}]);