(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,763793,e=>{"use strict";var t=e.i(255749),a=e.i(599007),i=e.i(456906),l=e.i(265362);let o="IBMPlexSerif",r=new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"long",year:"numeric"}),n=[243,247,252],s=[255,255,255],c=[217,226,239],d=[15,23,42],u=[51,65,85],f=[100,116,139],m=[232,240,254],x=[255,243,217],p=[223,248,235],h=[239,232,255],b=[233,238,246],g=[37,99,235],w=[217,119,6],y=[5,150,105],S=[124,58,237],T=[71,85,105],v=[15,23,42],z=[255,255,255],k=[249,248,244],F=[210,216,226],R=[16,44,84],P=[185,106,36];function M(e){return e.replace(/\r?\n/g," ").replace(/\u00a0/g," ").replace(/[–—]/g,"-").replace(/[“”]/g,'"').replace(/[’‘]/g,"'").replace(/\s+/g," ").trim()}function A(e=new Date){return r.format(e)}function L(e){return`${e.row.anaGrupKodu}. ${e.row.altGrupKodu} sınıfına giren yapılar`}function C(e,t){e.setFillColor(t[0],t[1],t[2])}function E(e,t){e.setDrawColor(t[0],t[1],t[2])}function B(e,t){e.setTextColor(t[0],t[1],t[2])}function $(e,t="normal"){e.setFont(o,t)}function I(){let e=new t.jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:!0});return e.__insaPdfFontsReady||(e.addFileToVFS("IBMPlexSerif-Regular.ttf",a.PDF_SERIF_REGULAR_BASE64),e.addFont("IBMPlexSerif-Regular.ttf",o,"normal"),e.addFileToVFS("IBMPlexSerif-Bold.ttf",a.PDF_SERIF_BOLD_BASE64),e.addFont("IBMPlexSerif-Bold.ttf",o,"bold"),e.__insaPdfFontsReady=!0),$(e),e}function W(e){let t=window.open("","_blank"),a="";if(!t)throw Error("PDF önizleme sekmesi açılamadı.");try{let i=e().output("blob");a=URL.createObjectURL(i),t.location.href=a}catch(e){throw t.close(),a&&URL.revokeObjectURL(a),e}window.setTimeout(()=>{a&&URL.revokeObjectURL(a)},6e4)}function D(e,t){let a=e.internal.pageSize.getWidth(),i=e.internal.pageSize.getHeight();C(e,n),e.rect(0,0,a,i,"F"),B(e,f),$(e),e.setFontSize(8),e.text(`Sayfa ${t}`,a-12,i-6,{align:"right"})}function O(e,t,a){D(e,a);let i=e.internal.pageSize.getWidth()-24,l="official"===t.variant?g:w;return C(e,v),e.roundedRect(12,12,i,16,6,6,"F"),C(e,l),e.roundedRect(16,16,3,8,2,2,"F"),B(e,z),$(e,"bold"),e.setFontSize(10),e.text(M(t.title),23,22),B(e,[210,222,255]),$(e),e.setFontSize(8),e.text(M(t.subtitle),12+i-5,22,{align:"right"}),34}function U(e,t,a){let i=a-18,l=.34*i,o=i-l-8,r=18;for(let a of t.rows)r+=function(e,t,a,i){let l=e.splitTextToSize(M(t.label),a),o=e.splitTextToSize(M(t.value),i);return 5+4.6*Math.max(l.length,o.length)}(e,a,l,o);return r+4*Math.max(t.rows.length-1,0)+10}function K(e){let t=e.internal.pageSize.getWidth(),a=e.internal.pageSize.getHeight();C(e,k),e.rect(0,0,t,a,"F"),E(e,F),e.setLineWidth(.35),e.rect(7,7,t-14,a-14)}function j(e,t,a){E(e,R),e.setLineWidth(.9),e.line(t,a+5,t,a),e.line(t,a,t+5,a),e.line(t+8,a,t+8,a+5),e.line(t,a+10,t,a+15),e.line(t,a+15,t+5,a+15),e.line(t+8,a+10,t+8,a+15),B(e,R),$(e,"bold"),e.setFontSize(10),e.text("İB",t+1.4,a+10.4),e.setLineWidth(.2),E(e,F),e.line(t+12,a,t+12,a+15),B(e,d),e.setFontSize(15),e.text("İNŞA BLOG",t+15,a+6.5),B(e,f),$(e),e.setFontSize(7.3),e.text("Mühendislik · Yapı · Analiz",t+15,a+12.5)}function Y(e,t,a,i,l){C(e,s),E(e,F),e.roundedRect(t,a,i,17,5,5,"FD"),B(e,f),$(e,"bold"),e.setFontSize(7),e.text("Tarih",t+5,a+6.3),B(e,d),e.setFontSize(10.5),e.text(l,t+5,a+12.1)}function Q(e,t,a,i,l,o){C(e,s),E(e,F),e.roundedRect(t,a,i,24,5,5,"FD"),C(e,P),e.roundedRect(t+4,a+4,2.3,16,1.2,1.2,"F"),B(e,f),$(e,"bold"),e.setFontSize(7.1),e.text(M(l.toLocaleUpperCase("tr-TR")),t+9,a+7.5),B(e,d),$(e,"bold"),e.setFontSize(12.8),e.text(e.splitTextToSize(M(o),i-18),t+9,a+15)}function N(e,t,a,i,l){let o,r,n,c,u=(r=.34*(o=i-16),n=o-r-6,c=16,l.forEach(t=>{let a=e.splitTextToSize(M(t.label),r),i=e.splitTextToSize(M(t.value),n);c+=4.4*Math.max(a.length,i.length)+4.5}),c+2*Math.max(l.length-1,0)+8),m=i-16,x=.34*m,p=m-x-6;C(e,s),E(e,F),e.roundedRect(t,a,i,u,6,6,"FD"),B(e,R),$(e,"bold"),e.setFontSize(9),e.text("Resmî seçim özeti",t+6,a+10.5);let h=a+17;return l.forEach((a,l)=>{let o=e.splitTextToSize(M(a.label),x),r=e.splitTextToSize(M(a.value),p),n=4.4*Math.max(o.length,r.length)+4.5;l>0&&(E(e,F),e.setLineWidth(.2),e.line(t+5,h,t+i-5,h),h+=2.5),B(e,f),$(e,"bold"),e.setFontSize(8),e.text(o,t+6,h+4.2),B(e,d),$(e),e.setFontSize(8.8),e.text(r,t+6+x+6,h+4.2),h+=n}),a+u}function H(e,t,a){let i=16;return t.forEach(t=>{i+=4.2*e.splitTextToSize(M(t),a-18).length+2}),i+8}function _(e,t,a){let i=e.internal.pageSize.getWidth()-28,l=H(e,a,i);C(e,s),E(e,F),e.roundedRect(14,t,i,l,6,6,"FD"),B(e,R),$(e,"bold"),e.setFontSize(9),e.text("Notlar",20,t+10);let o=t+17;a.forEach(t=>{C(e,P),e.circle(20.5,o-1.3,.85,"F"),B(e,u),$(e),e.setFontSize(8.3);let a=e.splitTextToSize(M(t),i-18);e.text(a,23,o),o+=4.2*a.length+2})}function G(e,t,a,i,l,o){let r,n=(r=16,o.forEach(t=>{r+=4.2*e.splitTextToSize(M(t),i-12).length+2}),r+8);C(e,s),E(e,F),e.roundedRect(t,a,i,n,6,6,"FD"),B(e,R),$(e,"bold"),e.setFontSize(8.7),e.text(l,t+6,a+9.5);let c=a+16;return o.forEach(a=>{B(e,u),$(e),e.setFontSize(8.1);let l=e.splitTextToSize(M(a),i-12);e.text(l,t+6,c),c+=4.2*l.length+2}),a+n}function V(e,t){let a=[{title:"Proje özeti",rows:[{label:"Yapı türü",value:e.project.yapiTuru},{label:"Toplam inşaat alanı",value:`${e.project.insaatAlani.toLocaleString("tr-TR")} m\xb2`},{label:"Kat adedi",value:String(e.project.katAdedi)},{label:"Bağımsız bölüm",value:String(e.project.bagimsizBolumSayisi)},{label:"Kalite seviyesi",value:e.project.kaliteSeviyesi},{label:"Fiyat veri tarihi",value:e.priceDate}]},{title:"Toplamlar",rows:[{label:"Net inşaat maliyeti",value:(0,i.formatTL)(e.genelToplam)},{label:"Kaba işler",value:`${(0,i.formatTL)(e.kabaIsToplamı)} (${(100*e.kabaIsPct).toFixed(1)}%)`},{label:"İnce işler",value:`${(0,i.formatTL)(e.inceIsToplamı)} (${(100*e.inceIsPct).toFixed(1)}%)`},{label:"Diğer giderler",value:`${(0,i.formatTL)(e.digerToplamı)} (${(100*e.digerPct).toFixed(1)}%)`},{label:"Müteahhit kârı",value:(0,i.formatTL)(e.muteahhitKariTutari)},{label:"KDV",value:(0,i.formatTL)(e.kdvTutari)},{label:"Anahtar teslim satış",value:(0,i.formatTL)(e.anahtarTeslimSatisFiyati)}]},{title:"Kategori dağılımı",rows:e.categories.map(e=>({label:e.label,value:(0,i.formatTL)(e.altToplam)}))}];if(t){let l=e.genelToplam-t.resmiToplamMaliyet,o=t.resmiToplamMaliyet>0?l/t.resmiToplamMaliyet*100:0;a.push({title:"Resmî birim maliyet karşılaştırması",rows:[{label:"Seçilen resmî sınıf",value:t.row.sinifAdi},{label:"Resmî m² birim maliyeti",value:(0,i.formatM2Fiyat)(t.row.m2BirimMaliyet)},{label:"Resmî toplam",value:(0,i.formatTL)(t.resmiToplamMaliyet)},{label:"Detaylı hesap farkı",value:`${(0,i.formatTL)(l)} (${o.toFixed(1)}%)`}]})}return{variant:"calculation",title:"İnşaat Maliyeti Raporu",subtitle:"Detaylı kategori dağılımı ve toplu maliyet özeti",generatedAt:new Date().toLocaleString("tr-TR"),highlights:[{label:"Net maliyet",value:(0,i.formatTL)(e.genelToplam),helper:"Sadece net proje toplamı",tone:"amber"},{label:"Anahtar teslim",value:(0,i.formatTL)(e.anahtarTeslimSatisFiyati),helper:"Kâr ve KDV dahil",tone:"blue"},{label:"m² birim",value:(0,i.formatM2Fiyat)(e.m2BasinaFiyat),helper:`${e.project.insaatAlani.toLocaleString("tr-TR")} m\xb2 proje`,tone:"emerald"},{label:"Bölüm başı",value:e.project.bagimsizBolumSayisi>0?(0,i.formatTL)(e.bolumBasinaFiyat):"Takip dışı",helper:e.project.bagimsizBolumSayisi>0?`${e.project.bagimsizBolumSayisi} bağımsız b\xf6l\xfcm`:"Bölüm verisi girilmedi",tone:"violet"}],sections:a,footnotes:["Bu rapor referans amaçlıdır; piyasa tekliflerinin ve saha koşullarının yerini almaz.","PDF raporu yapılandırılmış veri üzerinden üretilmiştir; ekran görüntüsü kullanılmaz."]}}function J(e){return{variant:"official",title:"Resmî Birim Maliyet Raporu",subtitle:`${e.row.sinifKodu} \xb7 ${e.row.sinifAdi}`,generatedAt:A(),highlights:[{label:"Resmî sınıf kodu",value:e.row.sinifKodu,helper:e.row.anaGrupAdi,tone:"blue"},{label:"Resmî m² birim maliyeti",value:(0,i.formatM2Fiyat)(e.row.m2BirimMaliyet),helper:"2026 tebliğ referansı",tone:"amber"},{label:"Toplam inşaat alanı",value:`${e.toplamInsaatAlani.toLocaleString("tr-TR")} m\xb2`,helper:"Kullanıcı girdisi",tone:"emerald"},{label:"Toplam resmî maliyet",value:(0,i.formatTL)(e.resmiToplamMaliyet),helper:"Alan × resmî m² birim maliyeti",tone:"violet"}],sections:[{title:"Resmî seçim özeti",rows:[{label:"Yıl",value:String(e.selection.yil)},{label:"Ana grup",value:e.row.anaGrupAdi},{label:"Alt grup / sınıf",value:e.row.sinifAdi},{label:"Resmî sınıf kodu",value:e.row.sinifKodu},{label:"Formül",value:e.formula},{label:"Kapsam",value:"Resmî yaklaşık birim maliyet referansı"}]},{title:L(e),rows:e.row.ornekYapilar.map((e,t)=>({label:`\xd6rnek ${t+1}`,value:e}))},{title:"Kaynak",rows:[{label:"Tebliğ",value:e.row.kaynakPdf}]}],footnotes:["Bu değer resmî yaklaşık birim maliyettir; piyasa teklifi değildir.",e.row.not]}}function q(e){var t,a,l;let o,r,n,c,d,f,m=I(),x=m.internal.pageSize.getWidth(),p=x-28-112-6,h=[{label:"Yıl",value:String(e.selection.yil)},{label:"Ana grup",value:e.row.anaGrupAdi},{label:"Alt grup / sınıf",value:e.row.sinifAdi},{label:"Resmî sınıf kodu",value:e.row.sinifKodu},{label:"Formül",value:e.formula},{label:"Kapsam",value:"Resmî yaklaşık birim maliyet referansı"}],b=["Bu belge resmî referans niteliğinde olup piyasa teklifi yerine geçmez.",e.row.not];K(m),j(m,14,16),Y(m,x-14-54,14,54,A());let g=(B(m,R),$(m,"bold"),m.setFontSize(22),m.text("Resmî Birim Maliyet Raporu",14,42),B(m,u),$(m),m.setFontSize(10.5),m.text(M(`${e.row.sinifAdi} \xb7 ${e.row.sinifKodu}`),14,48.5),54);t=g,o=(m.internal.pageSize.getWidth()-28-6)/2,[{label:"Resmî sınıf kodu",value:e.row.sinifKodu},{label:"Resmî m² birim maliyeti",value:(0,i.formatM2Fiyat)(e.row.m2BirimMaliyet)},{label:"Toplam inşaat alanı",value:`${e.toplamInsaatAlani.toLocaleString("tr-TR")} m\xb2`},{label:"Toplam resmî maliyet",value:(0,i.formatTL)(e.resmiToplamMaliyet)}].forEach((e,a)=>{let i=Math.floor(a/2);Q(m,14+a%2*(o+6),t+30*i,o,e.label,e.value)});let w=N(m,14,g=t+48+6+6,112,h),y=(a=g,C(m,s),E(m,F),m.roundedRect(132,a,p,28,6,6,"FD"),B(m,R),$(m,"bold"),m.setFontSize(8.7),m.text("Kaynak",138,a+9.5),B(m,u),$(m),m.setFontSize(8.2),m.text(m.splitTextToSize(M(e.row.kaynakPdf),p-12),138,a+16),a+28),S=Math.max(w,(l=y+6,r=L(e),n=e.row.ornekYapilar.slice(0,3),c=16,n.forEach(e=>{c+=4.2*m.splitTextToSize(M(e),p-18).length+2}),d=c+8,C(m,s),E(m,F),m.roundedRect(132,l,p,d,6,6,"FD"),B(m,R),$(m,"bold"),m.setFontSize(8.5),m.text(m.splitTextToSize(r,p-12),138,l+10.5),f=l+17,n.forEach((e,t)=>{C(m,P),m.circle(138.5,f-1.3,.85,"F"),B(m,u),$(m),m.setFontSize(8.1);let a=m.splitTextToSize(M(e),p-18);m.text(a,141,f),f+=4.2*a.length+2.2*(t!==n.length-1)}),l+d))+6;return _(m,S,b),m}function Z(e){var t;let a,l=I(),o=l.internal.pageSize.getWidth(),r=o-28-112-6,n=[{label:"Net parsel alanı",value:`${(0,i.formatSayi)(e.input.parcelAreaM2,2)} m\xb2`},{label:"TAKS",value:(0,i.formatSayi)(e.input.taks,2)},{label:"KAKS / emsal",value:(0,i.formatSayi)(e.input.kaks,2)},{label:"Normal kat sayısı",value:String(e.input.normalFloorCount)},{label:"Kullanım profili",value:e.profileLabel},{label:"Bodrum kat sayısı",value:e.input.hasBasement?String(e.input.basementFloorCount):"Yok"},{label:"Bodrum kat alanı kabulü",value:e.input.hasBasement?`${(0,i.formatSayi)(e.result.resolvedBasementFloorAreaM2,2)} m\xb2`:"Yok"}],s=[`${e.profileLabel} profili i\xe7in baz emsal harici artış oranı ${(0,i.formatYuzde)(e.result.bazEmsalHariciOrani)} kabul edildi.`,`Kat adedi d\xfczeltmesi ${(0,i.formatYuzde)(e.result.katAdediDuzeltmesiOrani)} ile toplam oran ${(0,i.formatYuzde)(e.result.emsalHariciEkAlanOrani)} seviyesine taşındı.`,"Ön fizibilite yaklaşımı, emsal dışı büyümeyi %30 üst sınırı altında tutar."],c=[`${(0,i.formatSayi)(e.input.parcelAreaM2,2)} \xd7 ${(0,i.formatSayi)(e.input.kaks,2)} = ${(0,i.formatSayi)(e.result.emsalAreaM2,2)} m\xb2 emsal alanı`,`${(0,i.formatSayi)(e.result.emsalAreaM2,2)} \xd7 ${(0,i.formatYuzde)(e.result.emsalHariciEkAlanOrani)} = ${(0,i.formatSayi)(e.result.emsalHariciEkAlanM2,2)} m\xb2 emsal harici ek alan`,e.input.hasBasement?`${e.input.basementFloorCount} \xd7 ${(0,i.formatSayi)(e.result.resolvedBasementFloorAreaM2,2)} = ${(0,i.formatSayi)(e.result.toplamBodrumAlanM2,2)} m\xb2 toplam bodrum alanı`:"Bodrum katkısı bu senaryoda sıfır kabul edildi.",`${(0,i.formatSayi)(e.result.emsalAreaM2,2)} + ${(0,i.formatSayi)(e.result.emsalHariciEkAlanM2,2)} + ${(0,i.formatSayi)(e.result.toplamBodrumAlanM2,2)} = ${(0,i.formatSayi)(e.result.yaklasikToplamInsaatAlaniM2,2)} m\xb2 tahmini toplam`],d=["Bu belge ruhsat hesabı değil, ön fizibilite amaçlı yaklaşık inşaat alanı raporudur.",...e.result.notes.slice(0,3)];K(l),j(l,14,16),Y(l,o-14-54,14,54,e.formattedDate||A());let f=(B(l,R),$(l,"bold"),l.setFontSize(22),l.text("Tahmini İnşaat Alanı Raporu",14,42),B(l,u),$(l),l.setFontSize(10.2),l.text(M(`${e.profileLabel} \xb7 Emsalden toplam inşaat alanına \xf6n fizibilite`),14,48.5),54);t=f,a=(l.internal.pageSize.getWidth()-28-6)/2,[{label:"Tahmini toplam inşaat alanı",value:`${(0,i.formatSayi)(e.result.yaklasikToplamInsaatAlaniM2,2)} m\xb2`},{label:"Emsal alanı",value:`${(0,i.formatSayi)(e.result.emsalAreaM2,2)} m\xb2`},{label:"Emsal harici ek alan",value:`${(0,i.formatSayi)(e.result.emsalHariciEkAlanM2,2)} m\xb2`},{label:"Toplam bodrum alanı",value:`${(0,i.formatSayi)(e.result.toplamBodrumAlanM2,2)} m\xb2`}].forEach((e,i)=>{let o=Math.floor(i/2);Q(l,14+i%2*(a+6),t+30*o,a,e.label,e.value)});let m=N(l,14,f=t+48+6+6,112,n),x=G(l,132,f,r,"Profil varsayımı",s),p=Math.max(m,G(l,132,x+6,r,"Hesap formülü",c))+6;return _(l,p,d),l}function X(e,t,a){return B(e,R),$(e,"bold"),e.setFontSize(22),e.text(M(t.title),14,a),B(e,u),$(e),e.setFontSize(10.2),e.text(e.splitTextToSize(M(t.subtitle),e.internal.pageSize.getWidth()-28),14,a+6.5),a+12}function ee(e,t=6){return e?e.rows.slice(0,t).map(e=>`${e.label}: ${e.value}`):[]}function et(e){let t=e.trim().replace("#","");return/^[0-9a-fA-F]{6}$/.test(t)?[Number.parseInt(t.slice(0,2),16),Number.parseInt(t.slice(2,4),16),Number.parseInt(t.slice(4,6),16)]:w}function ea(e){var t,a;let i,l,o,r,n=I(),c=n.internal.pageSize.getWidth(),f=c-28,m=f-108-6,p=e.sections[0],h=e.sections[1],b=e.sections[2],g=e.sections[3],w=e.sections[4];K(n),j(n,14,16),Y(n,c-14-54,14,54,e.generatedAt);let y=X(n,e,42);t=y,i=(n.internal.pageSize.getWidth()-28-6)/2,e.highlights.slice(0,4).map(e=>({label:e.label,value:e.value})).forEach((e,a)=>{let l=Math.floor(a/2);Q(n,14+a%2*(i+6),t+30*l,i,e.label,e.value)});let S=N(n,14,y=t+48+6+6,108,p?.rows??[]),T=G(n,128,y,m,h?.title??"Maliyet kırılımı",ee(h,4)),v=Math.max(S,G(n,128,T+6,m,b?.title??"En yüksek maliyet kalemleri",ee(b,4)))+6,z=(f-6)/2,k=Math.max((a=e.chart,C(n,s),E(n,F),n.roundedRect(14,v,z,70,6,6,"FD"),B(n,R),$(n,"bold"),n.setFontSize(8.7),n.text("Maliyet dağılımı",20,v+9.5),!function(e,t,a,i,l,o){let r=t?.reduce((e,t)=>e+Math.max(t.value,0),0)??0;if(!t||0===t.length||r<=0){C(e,x),e.circle(38,i,17,"F"),C(e,s),e.circle(38,i,10,"F");return}let n=-Math.PI/2;t.forEach(t=>{let a=Math.max(t.value,0)/r*Math.PI*2,l=n+a,o=Math.max(4,Math.ceil(a/(Math.PI/18))),s=[[38,i]];for(let e=0;e<=o;e+=1){let t=n+a*e/o;s.push([38+17*Math.cos(t),i+17*Math.sin(t)])}let c=s.slice(1).map((e,t)=>{let a=s[t];return[e[0]-a[0],e[1]-a[1]]});C(e,et(t.color)),e.lines(c,s[0][0],s[0][1],[1,1],"F",!0),n=l}),C(e,s),e.circle(38,i,10,"F")}(n,a,38,v+36,0,0),l=(a??[]).slice(0,6),o=v+17,l.forEach(e=>{C(n,et(e.color)),n.circle(61,o-1.4,1.1,"F"),B(n,u),$(n),n.setFontSize(7.4);let t=M(e.label);n.text(n.splitTextToSize(t,z-62),64,o),B(n,d),$(n,"bold"),n.setFontSize(7.5),n.text(`%${e.percent.toFixed(0)}`,14+z-6,o,{align:"right"}),o+=7.2}),v+70),G(n,14+z+6,v,z,g?.title??"Etki sürücüleri",ee(g,3)))+6;k=G(n,14,k,f,w?.title??"Karşılaştırma özeti",ee(w,2))+6;let P=e.footnotes.slice(0,4);return k+H(n,P,f)>n.internal.pageSize.getHeight()-10&&(r=n.internal.pageSize.getWidth(),n.addPage(),K(n),j(n,14,16),Y(n,r-14-54,14,54,e.generatedAt),k=X(n,{...e,subtitle:`${e.subtitle} - devam`},42)+6),_(n,k,P),n}function ei(e){W(()=>q(e))}function el(e,t){q(e).save(t)}function eo(e){W(()=>ea(e))}function er(e,t="insaat-maliyeti-onizleme.png"){let a=window.open("","_blank");if(!a)throw Error("Önizleme penceresi açılamadı. Lütfen pop-up engelleyicisini kontrol edin.");let i=function(e,t){let a,i,l,o,r=JSON.stringify((a=e.sections[0],i=e.sections[1],l=e.sections[2],o=(e.chart??[]).map((e,t)=>({label:e.label,description:e.description??"",color:e.color,percent:e.percent,value:i?.rows[t]?.value??""})),{title:e.title,subtitle:e.subtitle,generatedAt:e.generatedAt,highlights:e.highlights,projectRows:(a?.rows??[]).slice(0,8),breakdownRows:o,macroRows:(l?.rows??[]).slice(0,6),footnotes:e.footnotes.slice(0,6),chart:e.chart??[]})).replace(/</g,"\\u003c"),n=JSON.stringify(t);return`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${e.title.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")} - G\xf6rsel \xd6nizleme</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #e2e8f0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #0f172a;
      padding: 28px 16px 44px;
    }
    .toolbar {
      width: min(100%, 980px);
      margin: 0 auto 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border: 1px solid #dbe4ef;
      border-radius: 16px;
      background: #fff;
      padding: 12px 16px;
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
    }
    .toolbar-title { font-size: 13px; font-weight: 800; color: #334155; }
    .toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .btn {
      border: 0;
      border-radius: 10px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }
    .btn-primary { background: #102c54; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .canvas-wrap {
      width: min(100%, 980px);
      margin: 0 auto;
      overflow: auto;
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
      background: white;
    }
    canvas { display: block; width: 100%; height: auto; background: white; }
    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .canvas-wrap { width: 100%; box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-title">Kaydedilebilir g\xf6rsel \xf6nizleme</div>
    <div class="toolbar-actions">
      <button class="btn btn-secondary" type="button" onclick="window.close()">Kapat</button>
      <button class="btn btn-secondary" type="button" onclick="window.print()">Yazdır</button>
      <button class="btn btn-primary" type="button" id="download-png">PNG indir</button>
    </div>
  </div>
  <div class="canvas-wrap">
    <canvas id="report-canvas" width="1400" height="1600" aria-label="İnşaat maliyeti rapor g\xf6rseli"></canvas>
  </div>
  <script>
    const payload = ${r};
    const filename = ${n};
    const canvas = document.getElementById("report-canvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    function roundedRect(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    }

    function card(x, y, w, h, fill, stroke, radius = 24) {
      roundedRect(x, y, w, h, radius);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    function setFont(size, weight = 500, family = "Segoe UI") {
      ctx.font = weight + " " + size + "px " + family + ", Arial, sans-serif";
    }

    function drawText(text, x, y, size, color, weight = 500, align = "left") {
      setFont(size, weight);
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.fillText(String(text ?? ""), x, y);
      ctx.textAlign = "left";
    }

    function fittedFontSize(text, maxWidth, size, weight = 500, minSize = 10) {
      let nextSize = size;
      setFont(nextSize, weight);
      while (nextSize > minSize && ctx.measureText(String(text ?? "")).width > maxWidth) {
        nextSize -= 1;
        setFont(nextSize, weight);
      }
      return nextSize;
    }

    function drawFittedText(text, x, y, maxWidth, size, color, weight = 500, align = "left", minSize = 10) {
      const nextSize = fittedFontSize(text, maxWidth, size, weight, minSize);
      drawText(text, x, y, nextSize, color, weight, align);
      return nextSize;
    }

    function wrapText(text, maxWidth, size, weight = 500) {
      setFont(size, weight);
      const words = String(text ?? "").split(/\\s+/).filter(Boolean);
      const lines = [];
      let line = "";
      for (const word of words) {
        const next = line ? line + " " + word : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else if (!line && ctx.measureText(word).width > maxWidth) {
          let chunk = "";
          for (const char of word) {
            const nextChunk = chunk + char;
            if (ctx.measureText(nextChunk).width > maxWidth && chunk) {
              lines.push(chunk);
              chunk = char;
            } else {
              chunk = nextChunk;
            }
          }
          line = chunk;
        } else {
          line = next;
        }
      }
      if (line) lines.push(line);
      return lines;
    }

    function drawWrapped(text, x, y, maxWidth, size, color, weight = 500, lineHeight = size * 1.35, maxLines = 3) {
      const lines = wrapText(text, maxWidth, size, weight).slice(0, maxLines);
      lines.forEach((line, index) => drawText(line, x, y + index * lineHeight, size, color, weight));
      return y + lines.length * lineHeight;
    }

    function drawDonut(slices, cx, cy, outerR, innerR) {
      const total = slices.reduce((sum, slice) => sum + Math.max(Number(slice.value) || 0, 0), 0);
      let start = -Math.PI / 2;
      for (const slice of slices) {
        const value = Math.max(Number(slice.value) || 0, 0);
        const end = start + (total > 0 ? (value / total) * Math.PI * 2 : Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, start, end);
        ctx.closePath();
        ctx.fillStyle = slice.color || "#f59e0b";
        ctx.fill();
        start = end;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    function drawHeader() {
      drawText(payload.title, 120, 82, 31, "#020617", 900);
      drawText(payload.generatedAt, 120, 122, 16, "#64748b", 500);
      drawText("muhendislik-site.vercel.app", 1280, 86, 15, "#64748b", 500, "right");
      drawText("\xd6n Boyutlandırma Ama\xe7lıdır", 1280, 112, 15, "#64748b", 500, "right");
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 168);
      ctx.lineTo(1280, 168);
      ctx.stroke();
    }

    function drawTotalCard() {
      const total = payload.highlights[0] || { label: "Toplam", value: "-" };
      const unit = payload.highlights[1] || { value: "" };
      const range = payload.highlights[2] || { value: "" };
      card(120, 220, 360, 235, "#fff7ed", "#fcd34d", 28);
      drawText(total.label.toLocaleUpperCase("tr-TR"), 150, 250, 14, "#ea580c", 900);
      drawFittedText(total.value, 150, 292, 300, 40, "#020617", 900, "left", 28);
      drawFittedText(unit.value, 150, 345, 300, 18, "#64748b", 600, "left", 13);
      ctx.strokeStyle = "#fde68a";
      ctx.beginPath();
      ctx.moveTo(150, 386);
      ctx.lineTo(450, 386);
      ctx.stroke();
      card(150, 408, 135, 50, "#ecfdf5", "#d1fae5", 14);
      card(305, 408, 145, 50, "#fff1f2", "#ffe4e6", 14);
      const rangeParts = String(range.value || "").split("/");
      drawText("İyimser", 165, 420, 12, "#059669", 900);
      drawFittedText(rangeParts[0]?.trim() || "-", 165, 438, 105, 15, "#047857", 900, "left", 11);
      drawText("K\xf6t\xfcmser", 320, 420, 12, "#e11d48", 900);
      drawFittedText(rangeParts[1]?.trim() || "-", 320, 438, 110, 15, "#be123c", 900, "left", 11);
    }

    function drawChartCard() {
      card(120, 480, 360, 410, "#ffffff", "#e2e8f0", 28);
      drawText("MALİYET DAĞILIMI", 150, 512, 14, "#64748b", 900);
      drawDonut(payload.chart, 300, 636, 86, 52);
      let y = 755;
      for (const slice of payload.chart.slice(0, 6)) {
        ctx.beginPath();
        ctx.arc(150, y + 9, 6, 0, Math.PI * 2);
        ctx.fillStyle = slice.color;
        ctx.fill();
        drawWrapped(slice.label, 168, y, 210, 14, "#334155", 600, 18, 1);
        drawText("%" + Math.round(slice.percent), 450, y, 14, "#0f172a", 800, "right");
        y += 32;
      }
    }

    function drawProjectCard() {
      card(120, 915, 360, 360, "#ffffff", "#e2e8f0", 28);
      drawText("PROJE \xd6ZETİ", 150, 947, 14, "#64748b", 900);
      let y = 990;
      for (const row of payload.projectRows) {
        drawText(row.label, 150, y, 15, "#64748b", 500);
        const valueLines = wrapText(row.value, 150, 14, 800).slice(0, 2);
        valueLines.forEach((line, index) => {
          drawText(line, 450, y + index * 17, 14, "#0f172a", 800, "right");
        });
        ctx.strokeStyle = "#f1f5f9";
        ctx.beginPath();
        ctx.moveTo(150, y + 29);
        ctx.lineTo(450, y + 29);
        ctx.stroke();
        y += 41;
      }
    }

    function drawBreakdownCard() {
      card(506, 220, 774, 670, "#ffffff", "#e2e8f0", 28);
      roundedRect(506, 220, 774, 58, 28);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      drawText("DETAYLI MALİYET KIRILIMI", 536, 244, 14, "#64748b", 900);
      let y = 310;
      for (const row of payload.breakdownRows.slice(0, 6)) {
        ctx.beginPath();
        ctx.arc(536, y + 10, 8, 0, Math.PI * 2);
        ctx.fillStyle = row.color;
        ctx.fill();
        drawFittedText(row.label, 560, y, 430, 19, "#0f172a", 800, "left", 14);
        drawWrapped(row.description, 560, y + 27, 420, 13, "#64748b", 500, 17, 1);
        drawFittedText(row.value.split("(")[0].trim(), 1250, y, 235, 18, "#020617", 900, "right", 13);
        drawText("%" + row.percent.toFixed(1), 1250, y + 27, 13, "#f97316", 800, "right");
        roundedRect(536, y + 61, 690, 7, 4);
        ctx.fillStyle = "#eef2f7";
        ctx.fill();
        roundedRect(536, y + 61, Math.max(8, 690 * row.percent / 100), 7, 4);
        ctx.fillStyle = row.color;
        ctx.fill();
        y += 92;
      }
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(506, 830, 774, 60);
      drawText("TOPLAM", 536, 850, 19, "#020617", 900);
      drawFittedText(payload.highlights[0]?.value || "-", 1250, 846, 270, 25, "#ea580c", 900, "right", 18);
    }

    function drawMacroCards() {
      const colors = [
        ["#eff6ff", "#bfdbfe", "#1d4ed8"],
        ["#f8fafc", "#e2e8f0", "#334155"],
        ["#fff7ed", "#fed7aa", "#c2410c"],
      ];
      payload.macroRows.slice(0, 3).forEach((row, index) => {
        const x = 506 + index * 260;
        const [fill, stroke, textColor] = colors[index] || colors[0];
        card(x, 915, 238, 120, fill, stroke, 22);
        drawText(row.label.toLocaleUpperCase("tr-TR"), x + 22, 938, 14, textColor, 900);
        drawFittedText(row.value, x + 22, 968, 190, 24, textColor, 900, "left", 15);
      });
    }

    function drawNotes() {
      card(506, 1060, 774, 250, "#fffbeb", "#fcd34d", 24);
      drawText("VARSAYIMLAR VE NOTLAR", 536, 1090, 14, "#b45309", 900);
      let y = 1128;
      for (const note of payload.footnotes) {
        drawText("•", 536, y, 16, "#f59e0b", 900);
        y = drawWrapped(note, 558, y, 675, 14, "#92400e", 500, 21, 2) + 3;
      }
    }

    function drawFooter() {
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(120, 1370);
      ctx.lineTo(1280, 1370);
      ctx.stroke();
      drawWrapped(
        "Bu rapor muhendislik-site.vercel.app tarafından otomatik \xfcretilmiştir. \xd6n boyutlandırma ama\xe7lıdır; kesin teklif i\xe7in m\xfcteahhit ile iletişime ge\xe7iniz.",
        258,
        1400,
        884,
        14,
        "#94a3b8",
        500,
        18,
        2
      );
    }

    function render() {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      drawHeader();
      drawTotalCard();
      drawChartCard();
      drawProjectCard();
      drawBreakdownCard();
      drawMacroCards();
      drawNotes();
      drawFooter();
    }

    function downloadPng() {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    }

    render();
    document.getElementById("download-png").addEventListener("click", downloadPng);
  </script>
</body>
</html>
  `}(e,t);a.document.write(i),a.document.close()}function en(e,t){ea(e).save(t)}function es(e){let t=window.open("","_blank"),a="";if(!t)throw Error("Yazdırma penceresi açılamadı.");try{let i=ea(e).output("blob");a=URL.createObjectURL(i),t.location.href=a}catch(e){throw t.close(),a&&URL.revokeObjectURL(a),e}window.setTimeout(()=>{try{t.focus(),t.print()}catch{}},1200),window.setTimeout(()=>{a&&URL.revokeObjectURL(a)},6e4)}function ec(e){W(()=>Z(e))}function ed(e,t){Z(e).save(t)}function eu(e){let t=Z(e).output("blob"),a=URL.createObjectURL(t),i=window.open(a,"_blank");if(!i)throw URL.revokeObjectURL(a),Error("Yazdırma penceresi açılamadı.");window.setTimeout(()=>{try{i.focus(),i.print()}catch{}},1200),window.setTimeout(()=>{URL.revokeObjectURL(a)},6e4)}function ef(e,t){var a,i;let l,o,r,n,k,F,R,P;(l=I(),o=1,D(l,1),r=l.internal.pageSize.getWidth()-24,n="official"===e.variant?g:w,C(l,v),l.roundedRect(12,12,r,40,8,8,"F"),C(l,n),l.roundedRect(18,18,38,8,4,4,"F"),B(l,z),$(l,"bold"),l.setFontSize(8),l.text("official"===e.variant?"RESMÎ REFERANS":"MALİYET RAPORU",23,23.5),l.setFontSize(20),l.text(M(e.title),18,35),$(l),l.setFontSize(9.5),l.text(l.splitTextToSize(M(e.subtitle),r-24),18,42),B(l,[210,222,255]),l.setFontSize(8.5),l.text(M(e.generatedAt),12+r-6,23.5,{align:"right"}),k=60,a=e.highlights,i=k,F=(l.internal.pageSize.getWidth()-24-5)/2,a.slice(0,4).forEach((e,t)=>{let a=Math.floor(t/2),o=12+t%2*(F+5),r=i+28*a,n=function(e){switch(e){case"amber":return{fill:x,text:d,accent:w};case"emerald":return{fill:p,text:d,accent:y};case"violet":return{fill:h,text:d,accent:S};case"slate":return{fill:b,text:d,accent:T};default:return{fill:m,text:d,accent:g}}}(e.tone);C(l,n.fill),l.roundedRect(o,r,F,23,6,6,"F"),C(l,n.accent),l.roundedRect(o+3.5,r+4,2.5,15,1.5,1.5,"F"),B(l,f),$(l,"bold"),l.setFontSize(7.5),l.text(M(e.label.toLocaleUpperCase("tr-TR")),o+9,r+8),B(l,n.text),l.setFontSize(14),l.text(l.splitTextToSize(M(e.value),F-16),o+9,r+15),e.helper&&(B(l,f),$(l),l.setFontSize(7.5),l.text(l.splitTextToSize(M(e.helper),F-16),o+9,r+20))}),k=i+28*Math.ceil(Math.min(a.length,4)/2)+4,R=l.internal.pageSize.getHeight(),e.sections.forEach(t=>{var a,i;let r,n,u,m,x,p,h=U(l,t,l.internal.pageSize.getWidth()-24);k+h>R-14-28&&(l.addPage(),o+=1,k=O(l,e,o)),a=k,i=e.variant,r=l.internal.pageSize.getWidth()-24,n=U(l,t,r),m=.34*(u=r-18),x=u-m-8,C(l,s),E(l,c),l.roundedRect(12,a,r,n,7,7,"FD"),C(l,"official"===i?g:w),l.roundedRect(18,a+3,r-12,2.5,1.2,1.2,"F"),B(l,f),$(l,"bold"),l.setFontSize(8),l.text(M(t.title.toLocaleUpperCase("tr-TR")),21,a+11),p=a+18,t.rows.forEach((e,t)=>{let a=l.splitTextToSize(M(e.label),m),i=l.splitTextToSize(M(e.value),x),o=Math.max(a.length,i.length);t>0&&(E(l,c),l.setLineWidth(.2),l.line(20,p,12+r-8,p),p+=4),B(l,f),$(l,"bold"),l.setFontSize(8.5),l.text(a,21,p+4.5),B(l,d),$(l),l.setFontSize(9.5),l.text(i,21+m+8,p+4.5),p+=5+4.6*o}),k=a+n+7}),P=e.footnotes.reduce((e,t)=>e+4.6*l.splitTextToSize(M(t),l.internal.pageSize.getWidth()-24-18).length,24),k+P>R-14&&(l.addPage(),o+=1,k=O(l,e,o)),!function(e,t,a,i){if(0===t.length)return;let l=e.internal.pageSize.getWidth()-24,o=18;t.forEach(t=>{o+=4.6*e.splitTextToSize(M(t),l-18).length}),C(e,s),E(e,c),e.roundedRect(12,a,l,o,7,7,"FD"),C(e,"official"===i?g:w),e.roundedRect(17,a+5,3,o-10,1.5,1.5,"F"),B(e,d),$(e,"bold"),e.setFontSize(9),e.text("Notlar",24,a+11);let r=a+17;t.forEach(t=>{let a=e.splitTextToSize(M(t),l-22);B(e,u),$(e),e.setFontSize(8.5),e.text(a,24,r),r+=4.6*a.length+2.5})}(l,e.footnotes,k,e.variant),l).save(t)}e.s(["buildCalculationPdfSnapshot",()=>V,"buildOfficialCostPdfSnapshot",()=>J,"createConstructionCostPdfDocument",()=>ea,"createEstimatedConstructionAreaPdfDocument",()=>Z,"createOfficialCostPdfDocument",()=>q,"downloadConstructionCostPdf",()=>en,"downloadEstimatedConstructionAreaPdf",()=>ed,"downloadOfficialCostPdf",()=>el,"exportPdf",()=>ef,"openConstructionCostImagePreview",()=>er,"openConstructionCostPdfPreview",()=>eo,"openEstimatedConstructionAreaPdfPreview",()=>ec,"openOfficialCostPdfPreview",()=>ei,"printConstructionCostPdf",()=>es,"printEstimatedConstructionAreaPdf",()=>eu],460),e.i(460),e.s(["buildCalculationPdfSnapshot",()=>V,"buildOfficialCostPdfSnapshot",()=>J,"buildQuickQuantityPdfSnapshot",()=>l.buildQuickQuantityPdfSnapshot,"createConstructionCostPdfDocument",()=>ea,"createEstimatedConstructionAreaPdfDocument",()=>Z,"createOfficialCostPdfDocument",()=>q,"createQuickQuantityPdfDocument",()=>l.createQuickQuantityPdfDocument,"downloadConstructionCostPdf",()=>en,"downloadEstimatedConstructionAreaPdf",()=>ed,"downloadOfficialCostPdf",()=>el,"downloadQuickQuantityPdf",()=>l.downloadQuickQuantityPdf,"exportPdf",()=>ef,"openConstructionCostImagePreview",()=>er,"openConstructionCostPdfPreview",()=>eo,"openEstimatedConstructionAreaPdfPreview",()=>ec,"openOfficialCostPdfPreview",()=>ei,"openQuickQuantityPdfPreview",()=>l.openQuickQuantityPdfPreview,"printConstructionCostPdf",()=>es,"printEstimatedConstructionAreaPdf",()=>eu,"printQuickQuantityPdf",()=>l.printQuickQuantityPdf],763793)}]);