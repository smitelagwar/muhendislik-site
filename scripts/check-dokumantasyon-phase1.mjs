// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 1 P0 SÖZLEŞME DENETİMİ
// ============================================================================

import assert from "assert";
import fs from "fs";
import path from "path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const manager = read("src/components/dokumantasyon/file-manager.tsx");
const sidebar = read("src/components/dokumantasyon/drive-sidebar.tsx");
const details = read("src/components/dokumantasyon/drive-details-drawer.tsx");
const uploadToast = read("src/components/dokumantasyon/upload-progress-toast.tsx");
const mutation = read("src/lib/dokumantasyon/client-mutation.ts");
const imageViewer = read("src/components/dokumantasyon/preview/image-viewer.tsx");

assert(manager.includes("isSidebarOpenMobile &&"), "Mobil sidebar state'i görünür DOM üretmelidir.");
assert(manager.includes('role="dialog"') && manager.includes("Dokümantasyon gezintisi"), "Mobil sidebar erişilebilir dialog olmalıdır.");
assert(manager.includes("closeOnEscape") && manager.includes("document.body.style.overflow = \"hidden\""), "Mobil sidebar Escape ve body scroll lock yönetmelidir.");
assert(manager.includes("menuButton?.focus()"), "Mobil sidebar kapanınca focus hamburger butonuna dönmelidir.");
assert(sidebar.includes("onNavigate") && sidebar.includes("completeNavigation"), "Mobil ve desktop sidebar aynı navigation markup'ını paylaşmalıdır.");
assert(!manager.includes("min-h-[750px]"), "Dosya yöneticisi küçük ekranlarda sabit 750px minimum yüksekliğe sahip olmamalıdır.");
assert(details.includes("<span>Önizle</span>") && !details.includes("Önizle (Yeni Sekme)"), "Detay çekmecesi preview'ı aynı-sekme semantiğinde göstermelidir.");

const blankTargetCount = (manager.match(/target="_blank"/g) || []).length;
assert.strictEqual(blankTargetCount, 1, "Yalnız açık Yeni Sekmede Aç komutu target='_blank' kullanmalıdır.");
assert(manager.includes("<span>Yeni Sekmede Aç</span>"), "Açık yeni-sekme komutu korunmalıdır.");

assert(mutation.includes("{ ok: true; data: T }") && mutation.includes("{ ok: false; code: string; message: string"), "Mutation sonuçları normalize sözleşmeyi uygulamalıdır.");
assert(manager.includes("failedIds") && manager.includes("Başarısız öğeler seçili bırakıldı"), "Çoklu silme partial failure'ı görünür ve seçilebilir bırakmalıdır.");
assert(manager.includes("role=\"alert\"") && manager.includes("Tekrar dene"), "Liste hata durumu kullanıcıya retry ile görünmelidir.");
assert(manager.includes("confirming_metadata") && manager.includes("waitForUploadMetadata"), "Upload completed olmadan önce metadata doğrulamalıdır.");
assert(uploadToast.includes("Liste kaydı doğrulanıyor"), "Upload queue metadata doğrulama durumunu göstermelidir.");
assert(imageViewer.includes("onPointerDown") && imageViewer.includes("onPointerMove") && imageViewer.includes("image.zoom.fit"), "Görsel viewer pointer pan ve mobilde fit komutunu korumalıdır.");

console.log("✓ Aşama 1 P0 sözleşme denetimi başarıyla geçti.");
