// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOCUMENT STUDIO COMMAND REGISTRY & CONTRACT
// ============================================================================

export type StudioCommandCategory =
  | "studio"
  | "pdf"
  | "cad"
  | "image"
  | "text"
  | "markdown";

export interface StudioCommandDefinition {
  id: string;
  category: StudioCommandCategory;
  name: string;
  description: string;
  shortcut?: string;
  defaultEnabled: boolean;
  requiresCapability?: string;
}

/**
 * Document Studio UI eylemleri için tek ve değişmez komut sözlüğü
 */
export const STUDIO_COMMANDS: Record<string, StudioCommandDefinition> = {
  // --- Genel Stüdyo Komutları ---
  "studio.back": {
    id: "studio.back",
    category: "studio",
    name: "Dosya Yöneticisine Dön",
    description: "Stüdyodan çıkarak dosya yöneticisi listesine geri döner.",
    shortcut: "Alt+Left",
    defaultEnabled: true,
  },
  "studio.share": {
    id: "studio.share",
    category: "studio",
    name: "Paylaşım Bağlantısı Oluştur",
    description: "Bu dosya için süreli veya şifreli paylaşım bağlantısı oluşturur.",
    shortcut: "Ctrl+Shift+S",
    defaultEnabled: true,
  },
  "studio.download": {
    id: "studio.download",
    category: "studio",
    name: "Dosyayı İndir",
    description: "Mevcut dosya veya revizyonu doğrudan istemciye indirir.",
    shortcut: "Ctrl+D",
    defaultEnabled: true,
  },
  "studio.save": {
    id: "studio.save",
    category: "studio",
    name: "Yeni Sürüm Olarak Kaydet",
    description: "Düzenlenen dokümanı yeni bir versiyon olarak sunucuya kaydeder.",
    shortcut: "Ctrl+S",
    defaultEnabled: true,
  },
  "studio.fullscreen": {
    id: "studio.fullscreen",
    category: "studio",
    name: "Tam Ekran Modunu Aç/Kapat",
    description: "Tarayıcının native Fullscreen API (F11 benzeri) modunu değiştirir.",
    shortcut: "F11",
    defaultEnabled: true,
  },
  "studio.rename": {
    id: "studio.rename",
    category: "studio",
    name: "Dosyayı Yeniden Adlandır",
    description: "Dosyanın görünen adını günceller.",
    defaultEnabled: true,
  },
  "studio.delete": {
    id: "studio.delete",
    category: "studio",
    name: "Çöp Kutusuna Taşı",
    description: "Dosyayı çöp kutusuna taşır ve aktif linkleri iptal eder.",
    shortcut: "Delete",
    defaultEnabled: true,
  },

  // --- PDF Viewer Komutları ---
  "pdf.sidebar.toggle": {
    id: "pdf.sidebar.toggle",
    category: "pdf",
    name: "Kenar Çubuğunu Aç/Kapat",
    description: "Sayfa küçük resimlerini (thumbnails) ve içindekiler panelini gösterir/gizler.",
    shortcut: "Ctrl+B",
    defaultEnabled: true,
  },
  "pdf.page.first": {
    id: "pdf.page.first",
    category: "pdf",
    name: "İlk Sayfaya Git",
    description: "Dokümanın birinci sayfasına atlar.",
    shortcut: "Home",
    defaultEnabled: true,
  },
  "pdf.page.previous": {
    id: "pdf.page.previous",
    category: "pdf",
    name: "Önceki Sayfa",
    description: "Bir önceki sayfaya gider.",
    shortcut: "PageUp",
    defaultEnabled: true,
  },
  "pdf.page.next": {
    id: "pdf.page.next",
    category: "pdf",
    name: "Sonraki Sayfa",
    description: "Bir sonraki sayfaya gider.",
    shortcut: "PageDown",
    defaultEnabled: true,
  },
  "pdf.page.last": {
    id: "pdf.page.last",
    category: "pdf",
    name: "Son Sayfaya Git",
    description: "Dokümanın son sayfasına atlar.",
    shortcut: "End",
    defaultEnabled: true,
  },
  "pdf.zoom.in": {
    id: "pdf.zoom.in",
    category: "pdf",
    name: "Yakınlaştır",
    description: "Görünümü %20 oranında yakınlaştırır.",
    shortcut: "Ctrl++",
    defaultEnabled: true,
  },
  "pdf.zoom.out": {
    id: "pdf.zoom.out",
    category: "pdf",
    name: "Uzaklaştır",
    description: "Görünümü %20 oranında uzaklaştırır.",
    shortcut: "Ctrl+-",
    defaultEnabled: true,
  },
  "pdf.zoom.100": {
    id: "pdf.zoom.100",
    category: "pdf",
    name: "Gerçek Boyut (%100)",
    description: "Ölçeği %100 orijinal sayfa boyutuna sıfırlar.",
    shortcut: "Ctrl+1",
    defaultEnabled: true,
  },
  "pdf.zoom.fitWidth": {
    id: "pdf.zoom.fitWidth",
    category: "pdf",
    name: "Genişliğe Sığdır",
    description: "PDF sayfasını stüdyo genişliğine tam sığdırır.",
    shortcut: "Ctrl+2",
    defaultEnabled: true,
  },
  "pdf.zoom.fitPage": {
    id: "pdf.zoom.fitPage",
    category: "pdf",
    name: "Sayfaya Sığdır",
    description: "PDF sayfasının tamamını ekrana sığdırır.",
    shortcut: "Ctrl+0",
    defaultEnabled: true,
  },
  "pdf.rotateView": {
    id: "pdf.rotateView",
    category: "pdf",
    name: "Görünümü Saat Yönünde Döndür",
    description: "Geçici görünüm açısını 90 derece saat yönünde çevirir.",
    shortcut: "Ctrl+R",
    defaultEnabled: true,
  },
  "pdf.tool.select": {
    id: "pdf.tool.select",
    category: "pdf",
    name: "Metin Seçim İmleci",
    description: "PDF içindeki doğal metin ve nesneleri seçme modunu etkinleştirir.",
    shortcut: "V",
    defaultEnabled: true,
  },
  "pdf.tool.hand": {
    id: "pdf.tool.hand",
    category: "pdf",
    name: "Kaydırma / El Aracı (Pan)",
    description: "Fare ile pafta üzerinde serbest sürükleme modunu etkinleştirir.",
    shortcut: "H",
    defaultEnabled: true,
  },
  "pdf.search.open": {
    id: "pdf.search.open",
    category: "pdf",
    name: "Doküman İçinde Ara",
    description: "PDF metin arama çubuğunu açar veya kapatır.",
    shortcut: "Ctrl+F",
    defaultEnabled: true,
  },
  "pdf.print": {
    id: "pdf.print",
    category: "pdf",
    name: "PDF Yazdır",
    description: "Sitenin arayüzü olmadan yalnızca PDF dokümanını yazdırır.",
    shortcut: "Ctrl+P",
    defaultEnabled: true,
  },

  // --- PDF Pro Düzenleme / İnceleme Komutları ---
  "pdf.edit.enter": {
    id: "pdf.edit.enter",
    category: "pdf",
    name: "Düzenleme Moduna Geç",
    description: "Profesyonel PDF metin/görsel düzenleme modunu başlatır.",
    defaultEnabled: false,
    requiresCapability: "trueContentEdit",
  },
  "pdf.edit.save": {
    id: "pdf.edit.save",
    category: "pdf",
    name: "Yeni Revizyon Olarak Kaydet",
    description: "Yapılan değişiklikleri yeni bir versiyon olarak güvenle kaydeder.",
    shortcut: "Ctrl+S",
    defaultEnabled: false,
    requiresCapability: "versionedSave",
  },
  "pdf.measure.calibrate": {
    id: "pdf.measure.calibrate",
    category: "pdf",
    name: "Ölçek Kalibre Et",
    description: "Pafta üzerindeki bilinen mesafeyi referans alarak ölçek tanımlar.",
    defaultEnabled: false,
    requiresCapability: "measure",
  },
  "pdf.measure.distance": {
    id: "pdf.measure.distance",
    category: "pdf",
    name: "Mesafe Ölç",
    description: "İki nokta arası mühendislik uzunluğunu ölçer.",
    defaultEnabled: false,
    requiresCapability: "measure",
  },

  // --- CAD / APS Komutları ---
  "cad.fit": {
    id: "cad.fit",
    category: "cad",
    name: "Modeli Ekrana Sığdır",
    description: "CAD çiziminin tamamını görünüm alanına ortalar ve sığdırır.",
    shortcut: "Z+E",
    defaultEnabled: true,
  },
  "cad.pan": {
    id: "cad.pan",
    category: "cad",
    name: "CAD Pan Aracı",
    description: "Çizim alanında fare ile gezinme aracını etkinleştirir.",
    shortcut: "P",
    defaultEnabled: true,
  },
  "cad.layers": {
    id: "cad.layers",
    category: "cad",
    name: "Katman Yöneticisi",
    description: "DWG/DXF katmanlarını (layers) listeler ve görünürlüklerini açar/kapatır.",
    shortcut: "L",
    defaultEnabled: true,
  },
  "cad.properties": {
    id: "cad.properties",
    category: "cad",
    name: "Özellikler Paneli",
    description: "Seçili CAD nesnesinin teknik özelliklerini gösterir.",
    shortcut: "Ctrl+1",
    defaultEnabled: true,
  },
  "cad.download": {
    id: "cad.download",
    category: "cad",
    name: "Orijinal DWG/DXF İndir",
    description: "Orijinal CAD dosyasını masaüstü CAD programlarında açmak üzere indirir.",
    defaultEnabled: true,
  },

  // --- Görsel & Metin Komutları ---
  "image.rotate": {
    id: "image.rotate",
    category: "image",
    name: "Görseli Döndür",
    description: "Görseli 90 derece saat yönünde döndürür.",
    shortcut: "R",
    defaultEnabled: true,
  },
  "image.rotate.cw": {
    id: "image.rotate.cw",
    category: "image",
    name: "Saat Yönünde 90° Döndür",
    description: "Görseli 90 derece saat yönünde çevirir.",
    shortcut: "R",
    defaultEnabled: true,
  },
  "image.rotate.ccw": {
    id: "image.rotate.ccw",
    category: "image",
    name: "Saat Yönü Tersine 90° Döndür",
    description: "Görseli 90 derece saat yönünün tersine çevirir.",
    shortcut: "Shift+R",
    defaultEnabled: true,
  },
  "image.flip": {
    id: "image.flip",
    category: "image",
    name: "Görseli Yatay Aynala",
    description: "Görseli yatay eksende aynalar.",
    defaultEnabled: true,
  },
  "image.flip.h": {
    id: "image.flip.h",
    category: "image",
    name: "Yatay Aynala",
    description: "Görseli yatay eksende simetrik aynalar.",
    defaultEnabled: true,
  },
  "image.flip.v": {
    id: "image.flip.v",
    category: "image",
    name: "Dikey Aynala",
    description: "Görseli dikey eksende simetrik aynalar.",
    defaultEnabled: true,
  },
  "image.checkerboard": {
    id: "image.checkerboard",
    category: "image",
    name: "Şeffaflık Izgarası Aç/Kapat",
    description: "PNG/WebP şeffaf arka plan dama tahtası ızgarasını gösterir veya gizler.",
    defaultEnabled: true,
  },
  "image.zoom.fit": {
    id: "image.zoom.fit",
    category: "image",
    name: "Ekrana Sığdır",
    description: "Görseli stüdyo görünüm alanına tam sığdırır.",
    defaultEnabled: true,
  },
  "text.copy": {
    id: "text.copy",
    category: "text",
    name: "Tümünü Kopyala",
    description: "Metin içeriğinin tamamını panoya kopyalar.",
    shortcut: "Ctrl+Shift+C",
    defaultEnabled: true,
  },
  "text.copyAll": {
    id: "text.copyAll",
    category: "text",
    name: "Tüm Metni Kopyala",
    description: "Metin dosyasının tüm içeriğini panoya kopyalar.",
    shortcut: "Ctrl+Shift+C",
    defaultEnabled: true,
  },
  "text.wrap": {
    id: "text.wrap",
    category: "text",
    name: "Satır Kaydırmayı Aç/Kapat",
    description: "Uzun metin satırlarının pencere kenarından otomatik kaydırılmasını sağlar.",
    shortcut: "Alt+Z",
    defaultEnabled: true,
  },
};

/**
 * Belirli bir komut kimliğinin tanımını döndürür
 */
export function getStudioCommand(commandId: string): StudioCommandDefinition | undefined {
  return STUDIO_COMMANDS[commandId];
}

/**
 * Kategoriye göre tüm komutları listeler
 */
export function getCommandsByCategory(category: StudioCommandCategory): StudioCommandDefinition[] {
  return Object.values(STUDIO_COMMANDS).filter((cmd) => cmd.category === category);
}
