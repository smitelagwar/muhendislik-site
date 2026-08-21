// ============================================================================
// DÖKÜMANTASYON — AŞAMA 4 DRIVE UX SÖZLEŞME DENETİMİ
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const manager = read("src/components/dokumantasyon/file-manager.tsx");
const db = read("src/lib/dokumantasyon/db.ts");
const files = read("src/lib/dokumantasyon/files.ts");
const folders = read("src/lib/dokumantasyon/folders.ts");
const itemsRoute = read("src/app/api/dokumantasyon/items/route.ts");
const folderUpload = read("src/lib/dokumantasyon/folder-upload.ts");
const toast = read("src/components/dokumantasyon/upload-progress-toast.tsx");
const moveModal = read("src/components/dokumantasyon/modals/move-modal.tsx");
const activity = read("src/lib/dokumantasyon/activity.ts");

assert(db.includes('LATEST_REQUIRED_SCHEMA_VERSION = "006"'), "Aşama 4 meta ve etkinlik şeması sürümlenmelidir.");
assert(db.includes("starred_at") && db.includes("last_opened_at"), "Yıldız ve son açılanlar kalıcı şemada bulunmalıdır.");
assert(files.includes("setFileStarred") && folders.includes("setFolderStarred"), "Yıldız durumu hem dosya hem klasör için server-side olmalıdır.");
assert(files.includes("markFileOpened") && files.includes("INTERVAL '2 minutes'"), "Son açılanlar düşük maliyetli spam korumasıyla güncellenmelidir.");
assert(itemsRoute.includes('collection !== "recent"') && itemsRoute.includes('collection !== "starred"') && itemsRoute.includes("last_opened_at"), "Koleksiyonlar semantic server verisiyle listelenmelidir.");
assert(!manager.includes("starredIds"), "İstemci yalnız LocalStorage yıldız setiyle karar vermemelidir.");
assert(manager.includes("makeFolderUploadPlan") && manager.includes("createdFolderIds") && manager.includes("reverse()"), "Klasör yükleme planı ve hiyerarşi rollback yolu bulunmalıdır.");
assert(folderUpload.includes('segment === ".."') && folderUpload.includes("startsWith(\"/\")"), "Relative path traversal ve mutlak yol reddedilmelidir.");
assert(toast.includes("onRetry") && toast.includes("isAllDone &&"), "Queue hata başına retry ve yalnız terminal durumda dismiss sunmalıdır.");
assert(moveModal.includes("failedIds") && moveModal.includes("onPartialFailure"), "Bulk move partial failure sözleşmesini korumalıdır.");
assert(manager.includes("safe-area") || manager.includes("mobileSelectionBar"), "Mobil bulk action çubuğu safe-area tasarımını korumalıdır.");
assert(activity.includes("recordDokActivity") && files.includes('action: "upload"') && folders.includes('action: "trash"') && read("src/lib/dokumantasyon/shares.ts").includes('action: "share_revoke"'), "Minimal etkinlik kaydı yalnız anlamlı yönetim olaylarını kapsamalıdır.");

console.log("✓ Aşama 4 Drive yönetimi statik sözleşme denetimi başarıyla geçti.");
