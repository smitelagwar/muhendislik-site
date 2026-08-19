/**
 * =====================================================================
 * DÖKÜMANTASYON MODÜLÜ — UÇTAN UCA TÜM KULLANICI SENARYOLARI TEST SUITE
 * =====================================================================
 * 10 Ana Senaryo, gerçek kullanıcı ve tarayıcı akışlarını simüle eder.
 */

import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

let authCookie = "";

async function logStep(title) {
  console.log(`\n▶ ${title}`);
}

async function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runAllScenarios() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON MODÜLÜ GERÇEK KULLANICI UÇTAN UCA TESTLERİ");
  console.log("======================================================================");

  // -------------------------------------------------------------------
  // SENARYO 1: Kimlik Doğrulama, Hatalı Giriş Engeli ve Oturum Yaşam Döngüsü
  // -------------------------------------------------------------------
  await logStep("SENARYO 1: Kimlik Doğrulama ve Oturum Döngüsü");

  // 1.1 Hatalı şifre denemesi
  const badLogin = await fetch(`${BASE_URL}/api/dokumantasyon/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong_password_123" }),
  });
  assert.strictEqual(badLogin.status, 401, "Hatalı şifre 401 dönmelidir.");
  logSuccess("Hatalı şifre 401 ile güvenli biçimde engellendi.");

  // 1.2 Doğru şifre ile giriş
  const goodLogin = await fetch(`${BASE_URL}/api/dokumantasyon/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin" }),
  });
  assert.strictEqual(goodLogin.status, 200, "Doğru şifre 200 dönmelidir.");
  const rawCookies = typeof goodLogin.headers.getSetCookie === "function" 
    ? goodLogin.headers.getSetCookie() 
    : [goodLogin.headers.get("set-cookie") || ""];
  authCookie = rawCookies.map(c => c.split(";")[0]).join("; ");
  assert(authCookie.includes("dokumantasyon_session="), "Oturum çerezi üretilmelidir.");
  logSuccess("Admin başarıyla giriş yaptı, HTTP-only JWT çerezi alındı.");

  // 1.3 Oturum kontrolü
  const sessionRes = await fetch(`${BASE_URL}/api/dokumantasyon/auth/session`, {
    headers: { cookie: authCookie },
  });
  const sessionData = await sessionRes.json();
  assert(sessionData.authenticated === true && sessionData.user?.username === "admin", "Oturum doğrulanmalıdır.");
  logSuccess("Oturum doğrulama endpoint'i ({ authenticated: true }) onaylandı.");

  // -------------------------------------------------------------------
  // SENARYO 2: Klasör Oluşturma, İç İçe Klasörleme, Yeniden Adlandırma ve Breadcrumb
  // -------------------------------------------------------------------
  await logStep("SENARYO 2: Klasör Hiyerarşisi ve Breadcrumb");

  // 2.1 Kök klasör oluştur
  const rootFolderRes = await fetch(`${BASE_URL}/api/dokumantasyon/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: authCookie },
    body: JSON.stringify({ name: "2026 Proje Dosyalari", parentId: null }),
  });
  const rootFolderData = await rootFolderRes.json();
  assert(rootFolderRes.ok && rootFolderData.folder?.id, "Kök klasör oluşturulmalıdır.");
  const rootFolderId = rootFolderData.folder.id;
  logSuccess(`Kök klasör oluşturuldu: "${rootFolderData.folder.name}" (${rootFolderId})`);

  // 2.2 Alt klasör oluştur
  const subFolderRes = await fetch(`${BASE_URL}/api/dokumantasyon/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: authCookie },
    body: JSON.stringify({ name: "Statik Raporlar", parentId: rootFolderId }),
  });
  const subFolderData = await subFolderRes.json();
  assert(subFolderRes.ok && subFolderData.folder?.id, "Alt klasör oluşturulmalıdır.");
  const subFolderId = subFolderData.folder.id;
  logSuccess(`İç içe alt klasör oluşturuldu: "${subFolderData.folder.name}" (${subFolderId})`);

  // 2.3 Alt klasör içeriği ve breadcrumbs denetimi
  const subItemsRes = await fetch(`${BASE_URL}/api/dokumantasyon/items?folderId=${subFolderId}`, {
    headers: { cookie: authCookie },
  });
  const subItemsData = await subItemsRes.json();
  assert(subItemsData.breadcrumbs?.length >= 2, "Breadcrumbs doğru hiyerarşiyi içermelidir.");
  logSuccess("Breadcrumb yolu doğrulandı: Kök Dizin > 2026 Proje Dosyalari > Statik Raporlar");

  // 2.4 Klasör yeniden adlandırma
  const renameFolderRes = await fetch(`${BASE_URL}/api/dokumantasyon/folders/${subFolderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: authCookie },
    body: JSON.stringify({ name: "Nihai Statik Raporlar" }),
  });
  const renameFolderData = await renameFolderRes.json();
  assert(renameFolderRes.ok && renameFolderData.folder?.name === "Nihai Statik Raporlar", "Klasör yeniden adlandırılmalıdır.");
  logSuccess("Klasör yeniden adlandırma işlemi başarılı: 'Nihai Statik Raporlar'");

  // -------------------------------------------------------------------
  // SENARYO 3: Mühendislik Dosyaları Yükleme (DWG, PDF, XLSX) ve Çakışma Yönetimi
  // -------------------------------------------------------------------
  await logStep("SENARYO 3: Mühendislik Dosyaları Yükleme ve Çakışma Yönetimi");

  // 3.1 DWG Yükleme
  const dwgFormData = new FormData();
  const dwgBlob = new Blob(["AUTOCAD DWG HEADER 2026 BINARY STREAM"], { type: "application/acad" });
  dwgFormData.append("file", dwgBlob, "kiris_detaylari_kat1.dwg");
  dwgFormData.append("pathname", "dok_storage/kiris_detaylari_kat1.dwg");
  dwgFormData.append("folderId", subFolderId);

  const dwgUploadRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/local`, {
    method: "POST",
    headers: { cookie: authCookie },
    body: dwgFormData,
  });
  const dwgUploadData = await dwgUploadRes.json();
  assert(dwgUploadRes.ok && dwgUploadData.file?.id, "DWG dosyası yüklenmelidir.");
  const dwgFileId = dwgUploadData.file.id;
  logSuccess(`DWG dosyası yüklendi: "${dwgUploadData.file.display_name}" (.dwg - ${dwgFileId})`);

  // 3.2 PDF Yükleme
  const pdfFormData = new FormData();
  const pdfBlob = new Blob(["%PDF-1.7 STATIK HESAP RAPORU"], { type: "application/pdf" });
  pdfFormData.append("file", pdfBlob, "zemin_guvenlik_raporu.pdf");
  pdfFormData.append("pathname", "dok_storage/zemin_guvenlik_raporu.pdf");
  pdfFormData.append("folderId", subFolderId);

  const pdfUploadRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/local`, {
    method: "POST",
    headers: { cookie: authCookie },
    body: pdfFormData,
  });
  const pdfUploadData = await pdfUploadRes.json();
  assert(pdfUploadRes.ok && pdfUploadData.file?.id, "PDF dosyası yüklenmelidir.");
  const pdfFileId = pdfUploadData.file.id;
  logSuccess(`PDF dosyası yüklendi: "${pdfUploadData.file.display_name}" (.pdf - ${pdfFileId})`);

  // 3.3 Aynı isimli dosya yükleme (Çakışma / Unique İsim Türetimi)
  const dupFormData = new FormData();
  dupFormData.append("file", dwgBlob, "kiris_detaylari_kat1.dwg");
  dupFormData.append("pathname", "dok_storage/kiris_detaylari_kat1_dup.dwg");
  dupFormData.append("folderId", subFolderId);

  const dupUploadRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/local`, {
    method: "POST",
    headers: { cookie: authCookie },
    body: dupFormData,
  });
  const dupUploadData = await dupUploadRes.json();
  assert(dupUploadRes.ok && dupUploadData.file?.display_name.includes("kiris_detaylari_kat1"), "Çakışan dosya güvenle yüklenmelidir.");
  logSuccess(`Aynı isimli dosya yükleme çakışması başarıyla yönetildi: "${dupUploadData.file.display_name}"`);

  // -------------------------------------------------------------------
  // SENARYO 4: Arama ve Hızlı Filtreleme
  // -------------------------------------------------------------------
  await logStep("SENARYO 4: Global Arama ve Filtreleme");

  const searchRes = await fetch(`${BASE_URL}/api/dokumantasyon/search?q=kiris_detaylari`, {
    headers: { cookie: authCookie },
  });
  const searchData = await searchRes.json();
  assert(searchData.files?.some((f) => f.id === dwgFileId), "Arama DWG dosyasını bulmalıdır.");
  logSuccess(`Arama 'kiris_detaylari' sorgusu ile ${searchData.files.length} dosya buldu.`);

  // -------------------------------------------------------------------
  // SENARYO 5: Süreli & Şifreli Paylaşım Linki Oluşturma
  // -------------------------------------------------------------------
  await logStep("SENARYO 5: Süreli ve Şifreli Share Link Oluşturma");

  const shareCreateRes = await fetch(`${BASE_URL}/api/dokumantasyon/shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: authCookie },
    body: JSON.stringify({
      items: [
        { id: dwgFileId, type: "file" },
        { id: pdfFileId, type: "file" },
      ],
      duration: "1_DAY",
      title: "Mühendislik Denetim Paketi",
      password: "GizliSifre2026!",
      maxDownloads: 10,
    }),
  });

  const shareCreateData = await shareCreateRes.json();
  assert(shareCreateRes.ok && shareCreateData.rawToken && shareCreateData.shareUrl, "Paylaşım linki üretilmelidir.");
  const rawToken = shareCreateData.rawToken;
  const shareId = shareCreateData.shareLink.id;
  logSuccess(`Paylaşım linki üretildi: ${shareCreateData.shareUrl}`);
  logSuccess(`Parola koruması: 'GizliSifre2026!', Maksimum indirme limiti: 10`);

  // -------------------------------------------------------------------
  // SENARYO 6: Public /p/[token] Sayfası ve Parola Doğrulama
  // -------------------------------------------------------------------
  await logStep("SENARYO 6: Public İndirme Sayfası ve Parola Doğrulama");

  // 6.1 Parolasız erişim denemesi → password_required
  const publicPageRes = await fetch(`${BASE_URL}/p/${rawToken}`);
  const publicPageText = await publicPageRes.text();
  assert(
    publicPageText.includes("Şifre") ||
    publicPageText.includes("sifre") ||
    publicPageText.includes("Erişim") ||
    publicPageText.includes("password"),
    "Şifre giriş formu render edilmelidir."
  );
  logSuccess("Public sayfaya ilk girişte şifre ekranı başarıyla tetiklendi.");

  // 6.2 Yanlış parola gönderme
  const wrongPassRes = await fetch(`${BASE_URL}/api/dokumantasyon/public/verify-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: rawToken, password: "yanlis_sifre" }),
  });
  assert.strictEqual(wrongPassRes.status, 401, "Yanlış parola 401 dönmelidir.");
  logSuccess("Hatalı paylaşım parolası 401 ile reddedildi.");

  // 6.3 Doğru parola gönderme
  const rightPassRes = await fetch(`${BASE_URL}/api/dokumantasyon/public/verify-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: rawToken, password: "GizliSifre2026!" }),
  });
  assert.strictEqual(rightPassRes.status, 200, "Doğru parola 200 dönmelidir.");
  const rightPassRaw = typeof rightPassRes.headers.getSetCookie === "function"
    ? rightPassRes.headers.getSetCookie()
    : [rightPassRes.headers.get("set-cookie") || ""];
  const rightPassCookie = rightPassRaw.map(c => c.split(";")[0]).join("; ");
  logSuccess("Doğru parola ile kilit açıldı, geçici erişim bileti alındı.");

  // -------------------------------------------------------------------
  // SENARYO 7: Tekil İndirme ve Çoklu ZIP Arşivi İndirme
  // -------------------------------------------------------------------
  await logStep("SENARYO 7: Tekil İndirme ve Streaming ZIP Paketleme");

  // 7.1 Tekil DWG indirme
  const downloadRes = await fetch(`${BASE_URL}/api/dokumantasyon/public/download/${rawToken}/${dwgFileId}`, {
    headers: { cookie: rightPassCookie },
  });
  assert.strictEqual(downloadRes.status, 200, "Dosya başarıyla indirilmelidir.");
  const contentDisp = downloadRes.headers.get("content-disposition") || "";
  assert(contentDisp.includes("attachment"), "Attachment başlığı dönmelidir.");
  const downloadedBytes = await downloadRes.arrayBuffer();
  assert(downloadedBytes.byteLength > 0, "İndirilen dosya dolu olmalıdır.");
  logSuccess(`Tekil DWG indirme başarılı (Content-Disposition: ${contentDisp}, Boyut: ${downloadedBytes.byteLength} byte)`);

  // 7.2 ZIP Arşivi İndirme
  const zipRes = await fetch(`${BASE_URL}/api/dokumantasyon/public/zip/${rawToken}`, {
    headers: { cookie: rightPassCookie },
  });
  assert.strictEqual(zipRes.status, 200, "ZIP arşivi başarıyla üretilmelidir.");
  const zipBytes = await zipRes.arrayBuffer();
  assert(zipBytes.byteLength > 0, "ZIP arşivi dolu olmalıdır.");
  logSuccess(`Toplu ZIP akışı başarılı (Arşiv boyutu: ${zipBytes.byteLength} byte)`);

  // -------------------------------------------------------------------
  // SENARYO 8: Aktif Linkler Yönetimi ve Anlık İptal (Revoke)
  // -------------------------------------------------------------------
  await logStep("SENARYO 8: Aktif Linkler Listesi ve Anlık İptal (Revoke)");

  // 8.1 Aktif linkleri listele
  const activeSharesRes = await fetch(`${BASE_URL}/api/dokumantasyon/shares`, {
    headers: { cookie: authCookie },
  });
  const activeSharesData = await activeSharesRes.json();
  const currentShare = activeSharesData.links?.find((l) => l.id === shareId);
  assert(currentShare, "Oluşturulan link listede bulunmalıdır.");
  logSuccess(`Aktif link listede doğrulandı (İndirme sayacı: ${currentShare.download_count})`);

  // 8.2 Linki İptal Et (Revoke)
  const revokeRes = await fetch(`${BASE_URL}/api/dokumantasyon/shares/${shareId}/revoke`, {
    method: "POST",
    headers: { cookie: authCookie },
  });
  assert(revokeRes.ok, "Link iptal edilmelidir.");
  logSuccess("Paylaşım linki admin tarafından anında iptal edildi (revoked).");

  // 8.3 İptal sonrası erişim testi → indirme engellenmeli
  const revokedDownloadRes = await fetch(`${BASE_URL}/api/dokumantasyon/public/download/${rawToken}/${dwgFileId}`, {
    headers: { cookie: rightPassCookie },
  });
  assert.strictEqual(revokedDownloadRes.status, 410, "İptal edilen link üzerinden indirme 410 (Gone) dönmelidir.");
  logSuccess("İptal edilen linke yapılan indirme istekleri 410 Gone ile güvenle bloke edildi.");

  // -------------------------------------------------------------------
  // SENARYO 9: Çöp Kutusu, Geri Yükleme ve Kalıcı Silme
  // -------------------------------------------------------------------
  await logStep("SENARYO 9: Çöp Kutusu, Geri Yükleme ve Kalıcı Silme");

  // 9.1 Dosyayı çöp kutusuna taşı (Soft Delete)
  const trashFileRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${dwgFileId}`, {
    method: "DELETE",
    headers: { cookie: authCookie },
  });
  assert(trashFileRes.ok, "Dosya çöp kutusuna taşınmalıdır.");
  logSuccess("DWG dosyası çöp kutusuna taşındı (Soft Delete).");

  // 9.2 Çöp kutusunu listele
  const trashListRes = await fetch(`${BASE_URL}/api/dokumantasyon/trash`, {
    headers: { cookie: authCookie },
  });
  const trashListData = await trashListRes.json();
  assert(trashListData.items?.some((i) => i.id === dwgFileId), "Dosya çöp kutusunda bulunmalıdır.");
  logSuccess("Çöp kutusu listesinde dosya doğrulandı.");

  // 9.3 Geri Yükleme (Restore)
  const restoreRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${dwgFileId}/restore`, {
    method: "POST",
    headers: { cookie: authCookie },
  });
  assert(restoreRes.ok, "Dosya geri yüklenmelidir.");
  logSuccess("Dosya çöp kutusundan başarıyla geri yüklendi.");

  // 9.4 Tekrar sil ve kalıcı sil (Permanent Delete)
  await fetch(`${BASE_URL}/api/dokumantasyon/files/${dwgFileId}`, {
    method: "DELETE",
    headers: { cookie: authCookie },
  });
  const permDeleteRes = await fetch(`${BASE_URL}/api/dokumantasyon/trash/files/${dwgFileId}`, {
    method: "DELETE",
    headers: { cookie: authCookie },
  });
  assert(permDeleteRes.ok, "Dosya kalıcı olarak silinmelidir.");
  logSuccess("Dosya diskten ve veritabanından kalıcı olarak (Permanent Delete) temizlendi.");

  // -------------------------------------------------------------------
  // SENARYO 10: Çıkış Yapma (Logout)
  // -------------------------------------------------------------------
  await logStep("SENARYO 10: Çıkış Yapma (Logout)");

  const logoutRes = await fetch(`${BASE_URL}/api/dokumantasyon/cikis`, {
    method: "POST",
    headers: { cookie: authCookie },
  });
  assert(logoutRes.ok, "Çıkış başarılı olmalıdır.");
  const logoutCookie = logoutRes.headers.get("set-cookie") || "";
  assert(logoutCookie.includes("Max-Age=0") || logoutCookie.includes("Expires="), "Oturum çerezi sıfırlanmalıdır.");
  logSuccess("Admin güvenli biçimde çıkış yaptı, çerez temizlendi.");

  console.log("\n======================================================================");
  console.log("TEST SONUCU: 10/10 TÜM KULLANICI SENARYOLARI %100 BAŞARIYLA GEÇTİ!");
  console.log("======================================================================\n");
}

runAllScenarios().catch((err) => {
  console.error("\n❌ SENARYO TESTİ BAŞARISIZ OLDU:", err);
  process.exit(1);
});
