(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,410160,e=>{"use strict";function t(e){return(t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}e.s(["default",()=>t])},265362,e=>{"use strict";var t=e.i(255749),a=e.i(599007),i=e.i(456906),o=e.i(330666);let r="IBMPlexSerif";function n(e){return e.replace(/\r?\n/g," ").replace(/\u00a0/g," ").replace(/[–—]/g,"-").replace(/[“”]/g,'"').replace(/[’‘]/g,"'").replace(/\s+/g," ").trim()}function l(e,t,a){e.setFont(r,"bold"),e.setFontSize(12),e.text(n(t),14,a),e.setFont(r,"normal")}function d(e,t,a,i=182,o=5){let r=a;for(let a of(e.setFontSize(9),t)){let t=e.splitTextToSize(n(a),i);e.text(t,14,r),r+=t.length*o}return r}function s(e,t){return e.find(e=>e.value===t)?.label??t}function c(e){return e}function p(e){let c,p=((c=new t.jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:!0})).__quickQuantityFontsReady||(c.addFileToVFS("IBMPlexSerif-Regular.ttf",a.PDF_SERIF_REGULAR_BASE64),c.addFont("IBMPlexSerif-Regular.ttf",r,"normal"),c.addFileToVFS("IBMPlexSerif-Bold.ttf",a.PDF_SERIF_BOLD_BASE64),c.addFont("IBMPlexSerif-Bold.ttf",r,"bold"),c.__quickQuantityFontsReady=!0),c.setFont(r,"normal"),c),{result:m}=e,b=s(o.QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,m.input.tasiyiciSistem),u=s(o.QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,m.input.dosemeSistemi),f=s(o.QUICK_QUANTITY_FOUNDATION_OPTIONS,m.input.temelTipi),v=s(o.QUICK_QUANTITY_SOIL_OPTIONS,m.input.zeminSinifi),y=s(o.QUICK_QUANTITY_SEISMIC_OPTIONS,m.input.depremTalebi),x=s(o.QUICK_QUANTITY_PLAN_OPTIONS,m.input.planKompaktligi),g=m.input.bodrumKatSayisi>0?s(o.QUICK_QUANTITY_RETAINING_OPTIONS,m.input.bodrumCevrePerdesi):"Bodrum yok",T=s(o.QUICK_QUANTITY_SPAN_OPTIONS,m.input.tipikAciklik),k=m.kararOzetleri.find(e=>"saha-zorlugu"===e.id)?.value??"Saha özeti yok",h=p.internal.pageSize.getWidth();p.setFillColor(15,23,42),p.roundedRect(10,10,h-20,24,6,6,"F"),p.setFont(r,"bold"),p.setTextColor(255,255,255),p.setFontSize(18),p.text("Hızlı Metraj Hesaplayıcı",16,21),p.setFontSize(9.5),p.setFont(r,"normal"),p.text(n(m.preset.label),16,28),p.text(n(e.formattedDate),h-16,21,{align:"right"}),p.setTextColor(15,23,42);let S=42;return l(p,"Özet",42),S=d(p,[`Toplam alan: ${(0,i.formatSayi)(m.toplamInsaatAlaniM2,2)} m\xb2`,`Beton: ${(0,i.formatSayi)(m.betonM3,2)} m\xb3`,`Donatı: ${(0,i.formatSayi)(m.donatiTon,2)} ton`,`Kalıp: ${(0,i.formatSayi)(m.kalipM2,2)} m\xb2`,`Doğrudan taşıyıcı maliyet: ${(0,i.formatTL)(m.dogrudanTasiyiciMaliyet)}`,`Doğrudan maliyet yoğunluğu: ${(0,i.formatTL)(m.yogunlukOzet.directCostPerM2).replace(" TL"," TL/m²")}`,`Genişletilmiş kaba yapı: ${(0,i.formatTL)(m.genisletilmisKabaYapiBandi.expectedAmount)}`,`Resm\xee toplam yaklaşık maliyet: ${(0,i.formatTL)(m.officialResult.resmiToplamMaliyet)}`,`Saha zorluğu: ${k}`,`Taşıyıcı payı: ${(0,i.formatYuzde)(m.tasiyiciPayi.actual)} (bant ${(0,i.formatYuzde)(m.tasiyiciPayi.low)} - ${(0,i.formatYuzde)(m.tasiyiciPayi.expected)} - ${(0,i.formatYuzde)(m.tasiyiciPayi.high)})`],S+6)+3,l(p,"Proje Profili",S),S=d(p,[`Taşıyıcı sistem: ${b}`,`D\xf6şeme sistemi: ${u}`,`Temel tipi: ${f}`,`Zemin sınıfı: ${v}`,`Deprem talebi: ${y}`,`Plan kompaktlığı: ${x}`,`Bodrum \xe7evre perdesi: ${g}`,`Tipik a\xe7ıklık: ${T}`],S+6)+3,l(p,"Dağılım",S),S=d(p,m.breakdowns.map(e=>`${e.label}: ${(0,i.formatSayi)(e.betonM3,2)} m\xb3 beton, ${(0,i.formatSayi)(e.donatiTon,2)} ton donatı, ${(0,i.formatSayi)(e.kalipM2,2)} m\xb2 kalıp`),S+6)+3,l(p,"Yardımcı Kaba İşler",S),S=d(p,[...m.yardimciMetrajlar.map(e=>`${e.label}: ${(0,i.formatSayi)(e.quantity,"m"===e.unit?1:2)} ${e.unit}`),`Yardımcı kaba iş bandı: ${(0,i.formatTL)(m.yardimciKabaIsBandi.expectedAmount)} (${(0,i.formatYuzde)(m.yardimciKabaIsBandi.expected)})`],S+6)+3,l(p,"Yardımcı İş Muhasebesi",S),S=d(p,m.yardimciKabaIsDagilimi.slice(0,3).map(e=>`${e.label}: ${(0,i.formatTL)(e.amount)} (${(0,i.formatYuzde)(e.share)})`),S+6)+3,l(p,"Karar Özeti",S),S=d(p,m.kararOzetleri.slice(0,4).map(e=>`${e.title}: ${e.value} \xb7 ${e.note}`),S+6)+3,l(p,"Poz ve Fiyat Dayanakları",S),S=d(p,[`${m.priceBook.entries.concreteC30_37.pozNo} \xb7 ${m.priceBook.entries.concreteC30_37.label} \xb7 ${(0,i.formatM2Fiyat)(m.betonBirimFiyat).replace("/m²","/m³")}`,`${m.priceBook.entries.rebar8To12.pozNo} ve ${m.priceBook.entries.rebar14To28.pozNo} \xb7 Ağırlıklı donatı birim fiyatı \xb7 ${(0,i.formatTL)(m.donatiBirimFiyat).replace(" TL"," TL/ton")}`,`${m.priceBook.entries.formworkPlywood.pozNo} \xb7 ${m.priceBook.entries.formworkPlywood.label} \xb7 ${(0,i.formatTL)(m.kalipBirimFiyat).replace(" TL"," TL/m²")}`,`Resm\xee sınıf: ${m.officialResult.row.sinifKodu} \xb7 ${m.officialResult.row.sinifAdi}`],S+6)+3,l(p,"Notlar",S),d(p,[...m.notes,...m.warnings.map(e=>e.message),`Kaynak: ${m.priceBook.sourceLabel}`,`Kaynak bağlantısı: ${m.priceBook.sourceUrl}`,"Bu çıktı ön keşif / ön boyutlandırma içindir; statik proje, uygulama metrajı ve gerçek keşif yerine geçmez."],S+6),p}function m(e){let t=window.open("","_blank");if(!t)throw Error("Önizleme penceresi açılamadı. Lütfen pop-up engelleyicisini kontrol edin.");let a=function(e){let{result:t,formattedDate:a}=e,r=s(o.QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,t.input.tasiyiciSistem),n=s(o.QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,t.input.dosemeSistemi),l=s(o.QUICK_QUANTITY_FOUNDATION_OPTIONS,t.input.temelTipi),d=s(o.QUICK_QUANTITY_SOIL_OPTIONS,t.input.zeminSinifi);return`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Hızlı Metraj Raporu - ${a}</title>
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
      <div class="date-box" contenteditable="true">${a}</div>
    </div>

    <div class="title-area">
      <h1 contenteditable="true">Hızlı Metraj Raporu</h1>
      <p contenteditable="true">${t.preset.label}</p>
    </div>

    <div class="grid-4">
      <div class="card">
        <div class="label" contenteditable="true">Beton</div>
        <div class="value" contenteditable="true">${(0,i.formatSayi)(t.betonM3,2)} m\xb3</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Donatı</div>
        <div class="value" contenteditable="true">${(0,i.formatSayi)(t.donatiTon,2)} ton</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Kalıp</div>
        <div class="value" contenteditable="true">${(0,i.formatSayi)(t.kalipM2,2)} m\xb2</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Toplam Maliyet</div>
        <div class="value" contenteditable="true">${(0,i.formatTL)(t.dogrudanTasiyiciMaliyet)}</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="col-left">
        <div class="section-card">
          <h3 contenteditable="true">Proje Profili</h3>
          <div class="data-row"><span class="l" contenteditable="true">Taşıyıcı Sistem</span><span class="v" contenteditable="true">${r}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">D\xf6şeme Sistemi</span><span class="v" contenteditable="true">${n}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Temel Tipi</span><span class="v" contenteditable="true">${l}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Zemin Sınıfı</span><span class="v" contenteditable="true">${d}</span></div>
        </div>
      </div>
      <div class="col-right">
        <div class="section-card">
          <h3 contenteditable="true">Maliyet \xd6zeti</h3>
          <div class="data-row"><span class="l" contenteditable="true">Resm\xee Yaklaşık Maliyet</span><span class="v" contenteditable="true">${(0,i.formatTL)(t.officialResult.resmiToplamMaliyet)}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Yoğunluk (TL/m\xb2)</span><span class="v" contenteditable="true">${(0,i.formatTL)(t.yogunlukOzet.directCostPerM2)}</span></div>
        </div>
        <div class="section-card">
          <h3 contenteditable="true">Dayanaklar</h3>
          <div class="data-row"><span class="v" style="text-align: left; font-size: 8pt;" contenteditable="true">${t.priceBook.sourceLabel} referans fiyatları baz alınmıştır.</span></div>
        </div>
      </div>
    </div>

    <div class="notes">
      <h3 contenteditable="true">Notlar</h3>
      <ul>
        ${t.notes.slice(0,3).map(e=>`<li contenteditable="true">${e}</li>`).join("")}
        <li contenteditable="true">Bu \xe7ıktı \xf6n keşif i\xe7indir; statik proje yerine ge\xe7mez.</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `}(e);t.document.write(a),t.document.close()}function b(e,t){p(e).save(t)}function u(e){let t=p(e).output("blob"),a=URL.createObjectURL(t),i=window.open(a,"_blank");if(!i)throw URL.revokeObjectURL(a),Error("Yazdırma penceresi açılamadı.");window.setTimeout(()=>{try{i.focus(),i.print()}catch{}},1200),window.setTimeout(()=>{URL.revokeObjectURL(a)},6e4)}e.s(["buildQuickQuantityPdfSnapshot",()=>c,"createQuickQuantityPdfDocument",()=>p,"downloadQuickQuantityPdf",()=>b,"openQuickQuantityPdfPreview",()=>m,"printQuickQuantityPdf",()=>u])},48503,e=>{e.v(t=>Promise.all(["static/chunks/034945ea23f7a8ce.js"].map(t=>e.l(t))).then(()=>t(915833)))},870653,e=>{e.v(t=>Promise.all(["static/chunks/65bce5caaac3bf66.js"].map(t=>e.l(t))).then(()=>t(424154)))},195111,e=>{e.v(t=>Promise.all(["static/chunks/eac72d18bf6462e2.js"].map(t=>e.l(t))).then(()=>t(38201)))}]);