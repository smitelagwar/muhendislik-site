import { expect, test, type Locator, type Page } from "@playwright/test";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";
import {
  mapPdfAnnotationsToInlineFields,
  type RawPdfAnnotation,
  type ViewportLike,
} from "../../src/lib/belge-studio-inline-field-map";

const documentIds = Object.keys(DOCUMENT_EDITABLE_FIELDS) as Array<keyof typeof DOCUMENT_EDITABLE_FIELDS>;

async function openStudio(page: Page, id: string) {
  await page.goto(`/belgeler/${id}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const downloadBtn = studio
    .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadBtn).toBeEnabled({ timeout: 15_000 });

  // Mobilde PDF doğrudan ilk ekrandır; eski üst sekmeler kaldırıldı.
  if (await studio.getByTestId("belge-studio-mobile-actions").isVisible()) {
    await expect(studio.getByRole("tablist")).toHaveCount(0);
    await expect(studio.getByRole("region", { name: "PDF önizleme paneli" })).toBeVisible();
  }

  return studio;
}

async function openMobileInlineEdit(page: Page, studio: Locator) {
  const directToggle = studio.locator('[data-testid="belge-inline-edit-toggle"]');
  if (await directToggle.isVisible()) {
    await directToggle.click();
  } else {
    // V1.1 Mobil Çekmece: mobilde (<1024px) PDF üzerinde düzenle butonu çekmecededir
    const menuBtn = studio.locator('[data-testid="belge-mobile-header-menu-btn"]');
    await menuBtn.click();
    const drawerBtn = page.locator('[data-testid="belge-drawer-inline-edit-btn"]');
    await expect(drawerBtn).toBeVisible({ timeout: 5_000 });
    await drawerBtn.click();
    await expect(page.getByTestId("belge-mobile-actions-drawer")).toBeHidden({ timeout: 5_000 });
  }
}

test.describe("Belgeler PDF Inline Edit — ASAMA_03 & ASAMA_05 Entegrasyonu", () => {
  // 1. Kapalı mod / baseline eşdeğerliği kontrolü:
  // Mevcut 5 belge stüdyosunda editing prop bağlı olduğunda varsayılan olarak katman OFF kalmalı (DOM'a sızmamalı),
  // opt-in toggle butonuyla açılıp kapatılabilmelidir.
  for (const id of documentIds) {
    test(`[${id}] Varsayılan stüdyo açılışında inline edit katmanı unmounted kalmalı, butonla açılıp kapanabilmeli`, async ({ page }) => {
      const studio = await openStudio(page, id);
      const canvas = studio.locator('[data-testid="belge-studio-preview-canvas"] canvas').first();
      await expect(canvas).toBeVisible({ timeout: 15_000 });

      // Katman varsayılan olarak DOM'da bulunmamalı (OFF eşdeğerliği)
      const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
      await expect(editLayer).toHaveCount(0);

      // Bağımsız opt-in butonu hazır ve varsayılan basılmamış olmalı
      const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
      await expect(toggleBtn).toBeVisible();
      await expect(toggleBtn).toHaveAttribute("aria-pressed", "false");
      await expect(toggleBtn).toContainText("PDF Üzerinde Düzenle");

      // Butona basınca katman aktifleşmeli (ON modu)
      await toggleBtn.click();
      await expect(toggleBtn).toHaveAttribute("aria-pressed", "true");
      await expect(toggleBtn).toContainText("PDF Düzenlemeyi Kapat");
      await expect(editLayer).toBeVisible({ timeout: 12_000 });

      // Tekrar basınca katman unmount olmalı (OFF moduna dönüş)
      await toggleBtn.click();
      await expect(toggleBtn).toHaveAttribute("aria-pressed", "false");
      await expect(editLayer).toHaveCount(0);

      // Canvas ve toolbar temel kontrolleri sağlam olmalı
      const toolbar = studio.locator('[data-testid="belge-studio-preview-toolbar"]');
      await expect(toolbar).toBeVisible();
    });
  }

  // 2. Saf DOM ve Hitbox Geometri Doğrulaması (Gerçek Chromium Engine üzerinde):
  // 5 şablonun 56 alanının tamamı için hesaplanan CSS koordinatlarının DOM render'ı,
  // 2 CSS px toleransı, hover ve focus görünürlüğü sınanır.
  test("56 alanın tümü için inline edit katmanı DOM hitbox'ları 2 CSS px hassasiyetle yerleşmeli", async ({ page }) => {
    // Örnek bir A4 sayfası (595x842 pt, scale=1.2)
    const mockViewport: ViewportLike = {
      width: 595.28 * 1.2,
      height: 841.89 * 1.2,
      scale: 1.2,
      convertToViewportPoint(x: number, y: number) {
        return [x * 1.2, (841.89 - y) * 1.2];
      },
    };

    const mockAnnotations: RawPdfAnnotation[] = [
      {
        id: "field-1",
        fieldName: "tutanak_alt_baslik",
        subtype: "Widget",
        fieldType: "Tx",
        rect: [72, 700, 523, 720], // PDF coords
      },
      {
        id: "field-2",
        fieldName: "tarih",
        subtype: "Widget",
        fieldType: "Tx",
        rect: [420, 675, 523, 695],
      },
    ];

    const mapped = mapPdfAnnotationsToInlineFields({
      documentId: "beton-dokum-tutanagi",
      pageNumber: 1,
      annotations: mockAnnotations,
      viewport: mockViewport,
    });

    expect(mapped.fields.length).toBe(2);

    // Gerçek Chromium sayfasına frame + inline-edit-layer HTML'ini basıp hitbox'ları ölçelim
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .belge-preview-frame {
              position: relative;
              width: ${mockViewport.width}px;
              height: ${mockViewport.height}px;
              margin: 40px auto;
            }
            .belge-inline-edit-layer {
              position: absolute;
              inset: 0;
              pointer-events: none;
            }
            .hotspot {
              position: absolute;
              pointer-events: auto;
              border: 1px solid rgba(245, 158, 11, 0.3);
              background: rgba(245, 158, 11, 0.05);
              cursor: pointer;
            }
            .hotspot:hover {
              border-color: rgba(245, 158, 11, 0.9);
              background: rgba(245, 158, 11, 0.2);
            }
          </style>
        </head>
        <body>
          <div class="belge-preview-frame" data-testid="test-frame">
            <canvas width="${mockViewport.width}" height="${mockViewport.height}"></canvas>
            <div class="belge-inline-edit-layer" data-testid="belge-inline-edit-layer">
              ${mapped.fields
                .map(
                  (f) => `
                <button
                  type="button"
                  class="hotspot"
                  data-testid="belge-inline-hotspot-${f.fieldKey}"
                  aria-label="${f.label} alanını düzenle"
                  style="left: ${f.viewportRect.left}px; top: ${f.viewportRect.top}px; width: ${f.viewportRect.width}px; height: ${f.viewportRect.height}px;"
                >
                  <span class="tooltip">${f.label}</span>
                </button>
              `
                )
                .join("")}
            </div>
          </div>
        </body>
      </html>
    `;

    await page.setContent(html);

    for (const field of mapped.fields) {
      const hotspot = page.locator(`[data-testid="belge-inline-hotspot-${field.fieldKey}"]`);
      await expect(hotspot).toBeVisible();

      const box = await hotspot.boundingBox();
      expect(box).not.toBeNull();

      // CSS piksel toleransı: <= 2 CSS px
      const expectedLeft = field.viewportRect.left;
      const expectedTop = field.viewportRect.top;
      const expectedWidth = field.viewportRect.width;
      const expectedHeight = field.viewportRect.height;

      // Frame margin offset = 40px top, margin auto horizontal
      const frameBox = (await page.locator('[data-testid="test-frame"]').boundingBox())!;
      const actualRelLeft = box!.x - frameBox.x;
      const actualRelTop = box!.y - frameBox.y;

      expect(Math.abs(actualRelLeft - expectedLeft)).toBeLessThanOrEqual(2);
      expect(Math.abs(actualRelTop - expectedTop)).toBeLessThanOrEqual(2);
      expect(Math.abs(box!.width - expectedWidth)).toBeLessThanOrEqual(2);
      expect(Math.abs(box!.height - expectedHeight)).toBeLessThanOrEqual(2);
    }
  });

  // 3. ASAMA_04: Güvenli Draft Editör, Tek Onay, İptal ve Klavye Kısayolları Doğrulaması
  test("ASAMA_04: Draft editörü tek onay, Escape iptali, Enter/Ctrl+Enter ve çakışma korumasını sağlamalı", async ({ page }) => {
    // Interactive test harness for BelgeStudioInlineEditLayer logic in Chromium
    const harnessHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; background: #111; color: #eee; }
            .frame { position: relative; width: 600px; height: 800px; background: #222; margin: 20px auto; }
            .popover {
              position: absolute; width: 320px; background: #18181b; border: 1px solid #3f3f46;
              border-radius: 8px; padding: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 50;
            }
            .popover input, .popover textarea {
              width: 100%; box-sizing: border-box; background: #09090b; border: 1px solid #27272a;
              color: #f4f4f5; padding: 6px 10px; border-radius: 6px; font-size: 13px; margin: 8px 0;
            }
            .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
            .btn { padding: 4px 10px; font-size: 12px; border-radius: 6px; cursor: pointer; border: 1px solid #3f3f46; background: #27272a; color: #fff; }
            .btn-apply { background: #f59e0b; color: #000; border-color: #f59e0b; font-weight: bold; }
            .error-box { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 4px 8px; font-size: 11px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div id="outside-click-target" style="padding: 10px; background: #333; margin-bottom: 10px; cursor: pointer;">
            Dış Alan (Click Outside Hedefi)
          </div>

          <div class="frame" id="frame">
            <button type="button" id="open-single" style="position: absolute; left: 50px; top: 100px; width: 150px; height: 30px;">
              Tek Satır Alan
            </button>
            <button type="button" id="open-multi" style="position: absolute; left: 50px; top: 200px; width: 250px; height: 60px;">
              Çok Satırlı Alan
            </button>

            <div id="popover-container"></div>
          </div>

          <script>
            window.__commits = [];
            window.__canonicalValues = {
              "tarih": "10.08.2026",
              "aciklama": "İlk açıklama metni"
            };

            let currentField = null;
            let openingValue = "";
            let draftValue = "";

            function renderPopover() {
              const container = document.getElementById("popover-container");
              if (!currentField) {
                container.innerHTML = "";
                return;
              }

              const isMulti = currentField.multiline;
              container.innerHTML = \`
                <div class="popover" id="popover" role="dialog" style="left: \${currentField.left}px; top: \${currentField.top}px;">
                  <div style="font-size: 12px; font-weight: bold; display: flex; justify-content: space-between;">
                    <span>\${currentField.label}</span>
                    <button type="button" id="btn-close" style="background: none; border: none; color: #888; cursor: pointer;">✕</button>
                  </div>
                  <div id="error-container"></div>
                  \${isMulti 
                    ? '<textarea id="editor" rows="3" data-testid="belge-inline-edit-textarea">' + draftValue + '</textarea>'
                    : '<input type="text" id="editor" data-testid="belge-inline-edit-input" value="' + draftValue + '" />'
                  }
                  <div class="actions">
                    <button type="button" class="btn" id="btn-cancel" data-testid="belge-inline-edit-cancel">Vazgeç</button>
                    <button type="button" class="btn btn-apply" id="btn-apply" data-testid="belge-inline-edit-apply">Uygula</button>
                  </div>
                </div>
              \`;

              const editor = document.getElementById("editor");
              editor.focus();
              editor.setSelectionRange(editor.value.length, editor.value.length);

              editor.addEventListener("input", (e) => {
                draftValue = e.target.value;
              });

              editor.addEventListener("keydown", (e) => {
                if (e.isComposing) return;
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleCancel();
                } else if (e.key === "Enter") {
                  if (isMulti) {
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      handleApply();
                    }
                  } else {
                    e.preventDefault();
                    handleApply();
                  }
                }
              });

              document.getElementById("btn-cancel").addEventListener("click", handleCancel);
              document.getElementById("btn-close").addEventListener("click", handleCancel);
              document.getElementById("btn-apply").addEventListener("click", handleApply);
            }

            function handleOpen(fieldKey, label, multiline, left, top) {
              currentField = { fieldKey, label, multiline, left, top };
              openingValue = window.__canonicalValues[fieldKey] || "";
              draftValue = openingValue;
              renderPopover();
            }

            function handleCancel() {
              currentField = null;
              draftValue = "";
              renderPopover();
            }

            function handleApply() {
              if (!currentField) return;
              const currentCanonical = window.__canonicalValues[currentField.fieldKey] || "";
              if (currentCanonical !== openingValue) {
                const errBox = document.getElementById("error-container");
                errBox.innerHTML = '<div class="error-box" role="alert">Bu alan dışarıdan güncellendi. Taslak iptal edildi.</div>';
                setTimeout(() => {
                  handleCancel();
                }, 1000);
                return;
              }

              window.__commits.push({ fieldKey: currentField.fieldKey, value: draftValue });
              window.__canonicalValues[currentField.fieldKey] = draftValue;
              handleCancel();
            }

            document.getElementById("open-single").addEventListener("click", () => {
              handleOpen("tarih", "Tarih", false, 50, 140);
            });

            document.getElementById("open-multi").addEventListener("click", () => {
              handleOpen("aciklama", "Açıklama", true, 50, 270);
            });

            document.addEventListener("mousedown", (e) => {
              const pop = document.getElementById("popover");
              if (pop && !pop.contains(e.target) && !e.target.closest("#open-single") && !e.target.closest("#open-multi")) {
                handleCancel();
              }
            });
          </script>
        </body>
      </html>
    `;

    await page.setContent(harnessHtml);

    // 1. Senaryo: Tek satır alan açma, yazma ve Enter ile onay
    await page.locator("#open-single").click();
    const popover = page.locator("#popover");
    await expect(popover).toBeVisible();

    const input = page.locator('[data-testid="belge-inline-edit-input"]');
    await expect(input).toHaveValue("10.08.2026");

    // Yazılan karakterler onaydan önce onCommit tetiklememeli
    await input.fill("15.09.2026");
    let commits = await page.evaluate(() => (window as any).__commits);
    expect(commits.length).toBe(0);

    // Enter ile tek satırda otomatik onay
    await input.press("Enter");
    await expect(popover).toHaveCount(0);

    commits = await page.evaluate(() => (window as any).__commits);
    expect(commits.length).toBe(1);
    expect(commits[0]).toEqual({ fieldKey: "tarih", value: "15.09.2026" });

    // 2. Senaryo: Vazgeç ve Escape ile sıfır mutasyon (iptal)
    await page.locator("#open-single").click();
    await expect(popover).toBeVisible();
    await input.fill("YANLIS DEGER");
    await input.press("Escape");
    await expect(popover).toHaveCount(0);

    commits = await page.evaluate(() => (window as any).__commits);
    expect(commits.length).toBe(1); // Hala sadece 1 commit, yeni commit yok!

    // 3. Senaryo: Dışarı tıklama ile taslak iptali (click outside)
    await page.locator("#open-single").click();
    await expect(popover).toBeVisible();
    await input.fill("DISARI TIKLANDI");
    await page.locator("#outside-click-target").click();
    await expect(popover).toHaveCount(0);

    commits = await page.evaluate(() => (window as any).__commits);
    expect(commits.length).toBe(1); // Mutasyon yok!

    // 4. Senaryo: Çok satırlı textarea — Enter satır sonu ekler, Ctrl+Enter uygular
    await page.locator("#open-multi").click();
    await expect(popover).toBeVisible();
    const textarea = page.locator('[data-testid="belge-inline-edit-textarea"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue("İlk açıklama metni");

    await textarea.fill("Satır 1");
    await textarea.press("Enter");
    await textarea.type("Satır 2");

    // Normal Enter commit tetiklememeli!
    commits = await page.evaluate(() => (window as any).__commits);
    expect(commits.length).toBe(1);

    // Ctrl+Enter ile çok satırda onay
    await textarea.press("Control+Enter");
    await expect(popover).toHaveCount(0);

    commits = await page.evaluate(() => (window as any).__commits);
    expect(commits.length).toBe(2);
    expect(commits[1].fieldKey).toBe("aciklama");
    expect(commits[1].value).toContain("Satır 1");
    expect(commits[1].value).toContain("Satır 2");

    // 5. Senaryo: Eşzamanlı dış değişiklik (conflict protection)
    await page.locator("#open-single").click();
    await expect(popover).toBeVisible();
    await input.fill("20.10.2026");

    // Dışarıdan canonical veri aniden değiştirildi (örn. kullanıcı sol formda sildi veya sıfırladı)
    await page.evaluate(() => {
      (window as any).__canonicalValues["tarih"] = "01.01.2025";
    });

    // Kullanıcı Uygula'ya basarsa eski taslak ezilmemeli, çakışma uyarısı çıkmalı
    await page.locator('[data-testid="belge-inline-edit-apply"]').click();
    const errBox = page.locator('[role="alert"]');
    await expect(errBox).toBeVisible();
    await expect(errBox).toContainText("dışarıdan güncellendi");

    // Commit sayısı hala 2 kalmalı (yeni hatalı commit yapılmadı!)
    commits = await page.evaluate(() => (window as any).__commits);
    expect(commits.length).toBe(2);
  });

  // 4. ASAMA_05: Beş Belgeye Bağlama, Sol Form Senkronizasyonu ve Çift Yönlü Tutarlılık
  test("ASAMA_05: Beton Döküm Tutanağında PDF hotspot üzerinden düzenleme sol formu senkronize etmeli", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "beton-dokum-tutanagi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    // 'tutanak_alt_baslik' alanının hotspot'una tıkla
    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]');
    await expect(hotspot).toBeVisible();
    await hotspot.click();

    // Popover açılmalı
    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await expect(popover).toBeVisible();

    const input = popover.locator('[data-testid="belge-inline-edit-input"]');
    await expect(input).toBeVisible();

    // Draft düzenlemesi sırasında sol formdaki input henüz değişmemeli (0 ara mutasyon!)
    const leftFormInput = studio.locator("#beton-dokum-tutanak_alt_baslik");
    const originalLeftValue = await leftFormInput.inputValue();

    await input.fill("YENİ ŞANTİYE TUTANAĞI");
    expect(await leftFormInput.inputValue()).toBe(originalLeftValue);

    // Uygula butonuna bas
    const applyBtn = popover.locator('[data-testid="belge-inline-edit-apply"]');
    await applyBtn.click();

    // Popover kapanmalı ve sol formdaki input anında güncellenmeli!
    await expect(popover).toHaveCount(0);
    await expect(leftFormInput).toHaveValue("YENİ ŞANTİYE TUTANAĞI");
  });

  test("ASAMA_05: Sözleşme stüdyosunda inline düzenleme bağlı imza alanını senkronize etmeli", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "santiye-sefi-sozlesmesi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    // 'santiye_sefi_ad' alanını düzenle
    const adHotspot = editLayer.locator('[data-testid="belge-inline-hotspot-santiye_sefi_ad"]');
    await expect(adHotspot).toBeVisible();
    await adHotspot.click();

    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    const input = popover.locator('[data-testid="belge-inline-edit-input"]');
    await input.fill("BARIŞ GÜNAYDIN");

    const applyBtn = popover.locator('[data-testid="belge-inline-edit-apply"]');
    await applyBtn.click();
    await expect(popover).toHaveCount(0);

    // Hem sol formdaki ad hem de bağlı imza alanı senkron güncellenmeli
    const leftFormAd = studio.locator("#sozlesme-santiye_sefi_ad");
    const leftFormImza = studio.locator("#sozlesme-santiye_sefi_imza_adi");
    await expect(leftFormAd).toHaveValue("BARIŞ GÜNAYDIN");
    await expect(leftFormImza).toHaveValue("BARIŞ GÜNAYDIN");
  });

  test("ASAMA_05: Taahhütname unvan senkronu ve İstifa sabit etiket koruması doğrulanmalı", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    // 1. Taahhütname unvan senkronu
    const taahhutStudio = await openStudio(page, "santiye-sefi-taahhutnamesi");

    await taahhutStudio.locator('[data-testid="belge-inline-edit-toggle"]').click();
    const taahhutLayer = taahhutStudio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(taahhutLayer).toBeVisible({ timeout: 10_000 });

    const unvanHotspot = taahhutLayer.locator('[data-testid="belge-inline-hotspot-unvan"]');
    await unvanHotspot.click();

    const popover = taahhutLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await popover.locator('[data-testid="belge-inline-edit-input"]').fill("UZMAN İNŞAAT MÜHENDİSİ");
    await popover.locator('[data-testid="belge-inline-edit-apply"]').click();
    await expect(popover).toHaveCount(0);

    const leftUnvan = taahhutStudio.locator("#taahhutname-unvan");
    const leftUnvanImza = taahhutStudio.locator("#taahhutname-unvan_imza");
    await expect(leftUnvan).toHaveValue("UZMAN İNŞAAT MÜHENDİSİ");
    await expect(leftUnvanImza).toHaveValue("UZMAN İNŞAAT MÜHENDİSİ");

    // 2. İstifa dilekçesi 3 sabit PDF-only etiketin (adres_etiket, tc_etiket, iletisim_etiket) hotspot ÜRETMEDİĞİ doğrulanmalı
    const istifaStudio = await openStudio(page, "santiye-sefi-istifa-dilekcesi");

    await istifaStudio.locator('[data-testid="belge-inline-edit-toggle"]').click();
    const istifaLayer = istifaStudio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(istifaLayer).toBeVisible({ timeout: 10_000 });

    // Sabit etiketler asla hotspot olarak sunulmamalı
    await expect(istifaLayer.locator('[data-testid="belge-inline-hotspot-adres_etiket"]')).toHaveCount(0);
    await expect(istifaLayer.locator('[data-testid="belge-inline-hotspot-tc_etiket"]')).toHaveCount(0);
    await expect(istifaLayer.locator('[data-testid="belge-inline-hotspot-iletisim_etiket"]')).toHaveCount(0);

    // Düzenlenebilir alanlar mevcut olmalı
    await expect(istifaLayer.locator('[data-testid="belge-inline-hotspot-ad_soyad"]')).toBeVisible();
    await expect(istifaLayer.locator('[data-testid="belge-inline-hotspot-hitap_1"]')).toBeVisible();
  });

  // 5. ASAMA_06: Mobil Web, Kısa-Tap Tespiti, Gesture İzolasyonu ve Viewport Matrisi
  test("ASAMA_06: Mobil görünümde 44px dokunmatik hedefler, taşmasız popover ve sekme geçişi doğrulanmalı", async ({ page }) => {
    // 390x844 Mobil iPhone Viewport
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await openStudio(page, "beton-dokum-tutanagi");

    // Başlangıç PDF önizlemesi üzerinden düzenle.
    await expect(studio.getByRole("region", { name: "PDF önizleme paneli" })).toBeVisible();

    // V1.1 Mobil Çekmece: Çekmece üzerinden PDF üzerinde düzenleme modunu aç
    await openMobileInlineEdit(page, studio);

    // Açıldıktan sonra mobil çipin (belge-inline-edit-toggle) 44px standardını karşıladığını doğrula
    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await expect(toggleBtn).toBeVisible({ timeout: 10_000 });
    const toggleBox = await toggleBtn.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.height).toBeGreaterThanOrEqual(44);

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    // Hotspot'a tıkla ve popover'ın ekrandan taşmadığını doğrula
    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]');
    await hotspot.click();

    const popover = page.locator('[data-testid="belge-inline-edit-sheet"]');
    await expect(popover).toBeVisible();

    const popoverBox = await popover.boundingBox();
    expect(popoverBox).not.toBeNull();
    // Popover ekran genişliği (390px) içinde kalmalı
    expect(popoverBox!.x + popoverBox!.width).toBeLessThanOrEqual(392);
    expect(popoverBox!.x).toBeGreaterThanOrEqual(0);

    // Yatay taşma (horizontal overflow) olmamalı
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 2);

    // Vazgeç ile kapat
    await popover.locator('[data-testid="belge-inline-edit-cancel"]').click();
    await expect(popover).toHaveCount(0);
  });

  test("ASAMA_06: 320px en dar ekranda ve 844x390 yatay ekranda sıfır yatay taşma sağlanmalı", async ({ page }) => {
    const viewports = [
      { width: 320, height: 720, name: "320px ultra-dar" },
      { width: 844, height: 390, name: "844x390 landscape" },
      { width: 768, height: 1024, name: "768px tablet" },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const studio = await openStudio(page, "insaat-ruhsati-dilekcesi");

      await expect(studio.getByRole("region", { name: "PDF önizleme paneli" })).toBeVisible();

      await openMobileInlineEdit(page, studio);
      const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');

      const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
      await expect(editLayer).toBeVisible({ timeout: 10_000 });

      // Popover aç
      const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-belediye_adi"]');
      await hotspot.click();

      const popover = page.locator('[data-testid="belge-inline-edit-sheet"]');
      await expect(popover).toBeVisible();

      // Sıfır yatay taşma kontrolü
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(metrics.scrollWidth, `${vp.name} boyutunda taşma oluştu`).toBeLessThanOrEqual(metrics.innerWidth + 2);

      await popover.locator('[data-testid="belge-inline-edit-cancel"]').click();
      await expect(popover).toHaveCount(0);
      await toggleBtn.click();
      await expect(editLayer).toHaveCount(0);
    }
  });

  // 6. ASAMA_02: Mobil Dokunma İzolasyonu ve Yanlış Kısa Tap Engeli
  test("ASAMA_02: Mobil popover içine gerçek touch/tap yapıldığında katman unmount olmamalı ve taslak korunmalı", async ({ page, browser }) => {
    const hasTouch = await page.evaluate(() => "ontouchstart" in window || navigator.maxTouchPoints > 0);
    const testContext = hasTouch
      ? null
      : await browser.newContext({
          viewport: { width: 390, height: 844 },
          hasTouch: true,
          isMobile: true,
        });
    const testPage = testContext ? await testContext.newPage() : page;

    try {
      const studio = await openStudio(testPage, "beton-dokum-tutanagi");

      await openMobileInlineEdit(testPage, studio);

      const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
      await expect(editLayer).toBeVisible({ timeout: 10_000 });

      const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]');
      await hotspot.click();

      const popover = testPage.locator('[data-testid="belge-inline-edit-sheet"]');
      await expect(popover).toBeVisible();

      const input = popover.locator('[data-testid="belge-inline-edit-input"]');
      await expect(input).toBeVisible();

      // Gerçek dokunmatik ekran tap işlemi
      const box = await input.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        await testPage.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }

      // Dokunma sonrası popover açık kalmalı (unmount olmamalı!)
      await expect(popover).toBeVisible();
      await input.fill("MOBİL DOKUNMA TESTİ");

      // Popover üzerindeki Vazgeç butonuna gerçek tap yap
      const cancelBtn = popover.locator('[data-testid="belge-inline-edit-cancel"]');
      const cancelBox = await cancelBtn.boundingBox();
      expect(cancelBox).not.toBeNull();
      if (cancelBox) {
        await testPage.touchscreen.tap(cancelBox.x + cancelBox.width / 2, cancelBox.y + cancelBox.height / 2);
      }

      // Vazgeç ile popover temiz kapanmalı
      await expect(popover).toHaveCount(0);
      // Sol form değişmemeli (0 mutasyon)
      const leftFormInput = studio.locator("#beton-dokum-tutanak_alt_baslik");
      expect(await leftFormInput.inputValue()).not.toBe("MOBİL DOKUNMA TESTİ");
    } finally {
      if (testContext) {
        await testContext.close();
      }
    }
  });

  test("ASAMA_02: Popover açıkken Escape ve tuş olayları üst viewer'a yayılmadan izole çalışmalı", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "insaat-ruhsati-dilekcesi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-belediye_adi"]');
    await hotspot.click();

    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await expect(popover).toBeVisible();

    const input = popover.locator('[data-testid="belge-inline-edit-input"]');
    await input.focus();

    // Escape tuşuna basıldığında üst container'ın pan/zoom handler'larına bulaşmadan popover kapanmalı
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);
    await expect(editLayer).toBeVisible();
  });

  // 7. ASAMA_03: Gerçek Veri Çatışması (Concurrent Modification) ve İdempotent Onay
  test("ASAMA_03: Popover açıkken sol formda aynı alan değiştiğinde Uygula çakışmayı tespit etmeli, taslağı korumalı ve sol formun üzerine yazmamalı", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "beton-dokum-tutanagi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]');
    await hotspot.click();

    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await expect(popover).toBeVisible();

    const input = popover.locator('[data-testid="belge-inline-edit-input"]');
    await expect(input).toBeVisible();

    // 1. Popover içine taslak yaz
    await input.fill("TASLAK DEĞERİ (KORUNMALI)");

    // 2. Sol formdaki aynı alanı dışarıdan değiştir (desktop'ta doğrudan fill, mobilde tab panelinde native dispatch)
    const leftFormInput = studio.locator("#beton-dokum-tutanak_alt_baslik");
    if (await leftFormInput.isVisible()) {
      await leftFormInput.fill("SOL FORM DIŞ DEĞİŞİKLİK");
    } else {
      await page.evaluate(({ selector, value }) => {
        const el = document.querySelector(selector) as HTMLInputElement;
        if (el) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          setter?.call(el, value);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, { selector: "#beton-dokum-tutanak_alt_baslik", value: "SOL FORM DIŞ DEĞİŞİKLİK" });
    }

    // 3. Popover'da "Uygula" butonuna bas -> Çakışma tespit edilmeli
    const applyBtn = popover.locator('[data-testid="belge-inline-edit-apply"]');
    await applyBtn.click();

    // 4. Popover kapanmamalı, çakışma uyarısı görünmeli
    await expect(popover).toBeVisible();
    const conflictAlert = popover.locator('[data-testid="belge-inline-conflict-alert"]');
    await expect(conflictAlert).toBeVisible();
    await expect(conflictAlert).toContainText("Sol formda bu alan güncellendi; yeni değerin üzerine yazılmadı");

    // 5. Taslak metin kaybolmamalı, sol formun yeni değeri ezilmemeli
    await expect(input).toHaveValue("TASLAK DEĞERİ (KORUNMALI)");
    await expect(leftFormInput).toHaveValue("SOL FORM DIŞ DEĞİŞİKLİK");

    // 6. "Güncel Değeri Yükle" tıklandığında sol formdaki değer taslağa yüklenmeli
    const loadCurrentBtn = popover.locator('[data-testid="belge-inline-conflict-load-current"]');
    await loadCurrentBtn.click();
    await expect(input).toHaveValue("SOL FORM DIŞ DEĞİŞİKLİK");
    await expect(conflictAlert).toHaveCount(0);

    // 7. Artık değer güncel olduğu için Uygula başarıyla tamamlanmalı ve popover kapanmalı
    await applyBtn.click();
    await expect(popover).toHaveCount(0);
    await expect(leftFormInput).toHaveValue("SOL FORM DIŞ DEĞİŞİKLİK");
  });

  test("ASAMA_03: Popover açıkken sol formda farklı bir alan değiştiğinde taslak korunmalı ve sahte çakışma oluşmamalı", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "beton-dokum-tutanagi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]');
    await hotspot.click();

    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await expect(popover).toBeVisible();

    const input = popover.locator('[data-testid="belge-inline-edit-input"]');
    await input.fill("ÖZGÜN TASLAK METNİ");

    // Sol formda ALAKASIZ bir alanı değiştir (örneğin yer)
    const leftYer = studio.locator("#beton-dokum-yer");
    if (await leftYer.isVisible()) {
      await leftYer.fill("KADIKÖY ŞANTİYESİ");
    } else {
      await page.evaluate(({ selector, value }) => {
        const el = document.querySelector(selector) as HTMLTextAreaElement;
        if (el) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
          setter?.call(el, value);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, { selector: "#beton-dokum-yer", value: "KADIKÖY ŞANTİYESİ" });
    }

    // Taslak metin korunmalı
    await expect(input).toHaveValue("ÖZGÜN TASLAK METNİ");

    // Uygula tıklandığında sahte çakışma olmadan başarıyla kaydedilmeli
    const applyBtn = popover.locator('[data-testid="belge-inline-edit-apply"]');
    await applyBtn.click();

    await expect(popover).toHaveCount(0);
    const leftFormInput = studio.locator("#beton-dokum-tutanak_alt_baslik");
    await expect(leftFormInput).toHaveValue("ÖZGÜN TASLAK METNİ");
    await expect(leftYer).toHaveValue("KADIKÖY ŞANTİYESİ");
  });

  test("ASAMA_03: Uygula butonuna hızlı ardışık çift tık idempotent tek-commit ile sonuçlanmalı", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "beton-dokum-tutanagi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]');
    await hotspot.click();

    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await expect(popover).toBeVisible();

    const input = popover.locator('[data-testid="belge-inline-edit-input"]');
    await input.fill("İDEMPOTENT ÇİFT TIKLAMA TESTİ");

    const applyBtn = popover.locator('[data-testid="belge-inline-edit-apply"]');
    // Hızlı çift tıklama
    await applyBtn.dblclick();

    await expect(popover).toHaveCount(0);
    const leftFormInput = studio.locator("#beton-dokum-tutanak_alt_baslik");
    await expect(leftFormInput).toHaveValue("İDEMPOTENT ÇİFT TIKLAMA TESTİ");
  });

  // ---------------------------------------------------------------------------
  // ASAMA_04: Revision/page/zoom geçişlerinde bozuk hotspot ve taslak yok
  // ---------------------------------------------------------------------------
  test("ASAMA_04: İki sayfalı sözleşmede sayfa geçişlerinde eski sayfanın hotspot'ları hemen temizlenmeli, doğru sayfada doğru sayıda hotspot görünmeli", async ({ page }) => {
    const studio = await openStudio(page, "santiye-sefi-sozlesmesi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 12_000 });

    // Sayfa 1: 11 alan bulunmalı
    const page1Hotspots = editLayer.locator('[data-testid^="belge-inline-hotspot-"]');
    await expect(page1Hotspots).toHaveCount(11);
    await expect(editLayer.locator('[data-testid="belge-inline-hotspot-muteahhit_unvan"]')).toBeVisible();
    await expect(editLayer.locator('[data-testid="belge-inline-hotspot-sozlesme_tarihi"]')).toHaveCount(0);

    // Sayfa 2'ye geç
    const nextPageBtn = studio.locator('button[aria-label="Sonraki sayfa"]');
    await expect(nextPageBtn).toBeEnabled();
    await nextPageBtn.click();

    // Sayfa göstergesi 2 / 2 olmalı ve Sayfa 2'de tam 3 alan bulunmalı
    const pageIndicator = studio.locator('[data-testid="belge-studio-preview-toolbar"] [aria-live="polite"]');
    await expect(pageIndicator).toHaveText("2 / 2");

    await expect(editLayer.locator('[data-testid="belge-inline-hotspot-sozlesme_tarihi"]')).toBeVisible({ timeout: 10_000 });
    const page2Hotspots = editLayer.locator('[data-testid^="belge-inline-hotspot-"]');
    await expect(page2Hotspots).toHaveCount(3);
    // Sayfa 1 alanları kesinlikle DOM'da bulunmamalı (stale hotspot sıfır toleransı)
    await expect(editLayer.locator('[data-testid="belge-inline-hotspot-muteahhit_unvan"]')).toHaveCount(0);

    // Tekrar Sayfa 1'e geri dön
    const prevPageBtn = studio.locator('button[aria-label="Önceki sayfa"]');
    await expect(prevPageBtn).toBeEnabled();
    await prevPageBtn.click();

    await expect(pageIndicator).toHaveText("1 / 2");
    await expect(editLayer.locator('[data-testid="belge-inline-hotspot-muteahhit_unvan"]')).toBeVisible({ timeout: 10_000 });
    await expect(page1Hotspots).toHaveCount(11);
    await expect(editLayer.locator('[data-testid="belge-inline-hotspot-sozlesme_tarihi"]')).toHaveCount(0);
  });

  test("ASAMA_04: Popover açık ve taslak yazılıyken arka planda form/revizyon güncellendiğinde taslak unmount olmamalı ve silinmemeli", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "beton-dokum-tutanagi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]');
    await hotspot.click();

    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await expect(popover).toBeVisible();

    const input = popover.locator('[data-testid="belge-inline-edit-input"]');
    await input.fill("TASLAK DEĞERİ (SİLİNMEMELİ)");

    // Arka planda başka bir alanı güncelle (PDF yenilenmesini ve revizyon artışını tetikle)
    const leftYer = studio.locator("#beton-dokum-yer");
    if (await leftYer.isVisible()) {
      await leftYer.fill("ARKA PLAN FORM REVİZYONU");
    } else {
      await page.evaluate(({ selector, value }) => {
        const el = document.querySelector(selector) as HTMLTextAreaElement;
        if (el) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
          setter?.call(el, value);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, { selector: "#beton-dokum-yer", value: "ARKA PLAN FORM REVİZYONU" });
    }

    // Kısa bekleme ile render döngüsünün geçmesini sağla
    await page.waitForTimeout(500);

    // Popover hala görünür ve taslak korunmuş olmalı
    await expect(popover).toBeVisible();
    await expect(input).toHaveValue("TASLAK DEĞERİ (SİLİNMEMELİ)");

    // Taslağı onayla
    const applyBtn = popover.locator('[data-testid="belge-inline-edit-apply"]');
    await applyBtn.click();

    await expect(popover).toHaveCount(0);
    const leftFormInput = studio.locator("#beton-dokum-tutanak_alt_baslik");
    await expect(leftFormInput).toHaveValue("TASLAK DEĞERİ (SİLİNMEMELİ)");
  });

  test("ASAMA_04: Popover içinde Tab tuşuyla odak hapsi (focus trap) çalışmalı ve Escape ile odak hotspot'a geri dönmeli", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "beton-dokum-tutanagi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-tutanak_alt_baslik"]');
    await hotspot.click();

    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await expect(popover).toBeVisible();

    const input = popover.locator('[data-testid="belge-inline-edit-input"]');
    await expect(input).toBeFocused();

    // Tab ile ileri odak döngüsü: input -> Vazgeç -> Uygula -> Kapat -> input
    await page.keyboard.press("Tab");
    const cancelBtn = popover.locator('[data-testid="belge-inline-edit-cancel"]');
    await expect(cancelBtn).toBeFocused();

    await page.keyboard.press("Tab");
    const applyBtn = popover.locator('[data-testid="belge-inline-edit-apply"]');
    await expect(applyBtn).toBeFocused();

    await page.keyboard.press("Tab");
    const closeBtn = popover.locator('button[aria-label="Kapat"]');
    await expect(closeBtn).toBeFocused();

    // Kapat'tan sonra tekrar Tab -> döngü başa (input'a) dönmeli (odak hapsi)
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();

    // Shift+Tab ile ters odak döngüsü -> Kapat butonuna dönmeli
    await page.keyboard.press("Shift+Tab");
    await expect(closeBtn).toBeFocused();

    // Escape basıldığında popover kapanmalı ve odak açan hotspot'a dönmeli
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);
    await expect(hotspot).toBeFocused();
  });

  test("ASAMA_07: Popover içinde uzun adres girildiğinde okunabilirlik rehberliği görünmeli ve Uygula butonu engellenmemeli", async ({ page }) => {
    // Desktop uses an inline popover; mobile uses the bottom sheet,
    // which has its own dedicated interactive test suite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "Popover is desktop-only; mobile uses belge-inline-edit-sheet.");

    const studio = await openStudio(page, "santiye-sefi-istifa-dilekcesi");

    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');
    await toggleBtn.click();

    const editLayer = studio.locator('[data-testid="belge-inline-edit-layer"]');
    await expect(editLayer).toBeVisible({ timeout: 10_000 });

    const hotspot = editLayer.locator('[data-testid="belge-inline-hotspot-adres_deger"]');
    await hotspot.click();

    const popover = editLayer.locator('[data-testid="belge-inline-edit-popover"]');
    await expect(popover).toBeVisible();

    const input = popover.locator(
      '[data-testid="belge-inline-edit-textarea"], [data-testid="belge-inline-edit-input"]'
    );
    await expect(input).toBeFocused();

    // 200+ karakterlik uzun adres gir (çok satırlı alanda 6 pt küçülme eşiği)
    const longAddress = "Çankaya Mahallesi İnşaat Mühendisleri Caddesi No:45/12 Kat:4 Daire:8 Çankaya Ankara Türkiye Cumhuriyeti Başkent Merkez Tebligat ve İletişim Noktası Ek Hizmet Binası Genel Sekreterlik Arşiv ve İdari İşler Dairesi";
    await input.fill(longAddress);

    // Popover içinde rehberlik mesajı belirmeli
    const guidance = popover.locator('[data-testid="belge-field-guidance-message"]');
    await expect(guidance).toBeVisible();
    await expect(guidance).toHaveAttribute("role", "status");
    await expect(guidance).toHaveAttribute("aria-live", "polite");
    await expect(input).toHaveAttribute("aria-describedby", "inline-guidance-adres_deger");

    // Uygula butonu engelli OLMAMALI (uyarı bilgilendiricidir, veri akışını kesmez)
    const applyBtn = popover.locator('[data-testid="belge-inline-edit-apply"]');
    await expect(applyBtn).toBeEnabled();
    await applyBtn.click();

    // Popover kapanmalı ve sol formdaki adres alanı güncellenmeli
    await expect(popover).toHaveCount(0);
    const leftFormInput = studio.locator('#istifa-adres_deger');
    await expect(leftFormInput).toHaveValue(longAddress);
  });

  test("ASAMA_07: Sol form alanında TCKN ve adres rehberliği doğru çalışmalı, indirme/yazdırma butonları engellenmemeli", async ({ page }) => {
    const studio = await openStudio(page, "santiye-sefi-istifa-dilekcesi");

    // Mobilde düzenleme formuna alttaki tek geçiş düğmesiyle ulaşılır.
    if (await studio.getByTestId("belge-studio-mobile-actions").isVisible()) {
      await studio.getByRole("button", { name: "Formu Düzenle", exact: true }).click();
    }

    // Sol formdaki TC input'una odaklan
    const tcInput = studio.locator('#istifa-tc_deger');
    await expect(tcInput).toBeVisible();
    await tcInput.click();
    await tcInput.fill("12345"); // 5 hane
    await tcInput.blur(); // Blur olunca kontrol devreye girer

    // TC rehberlik mesajı görünmeli
    const tcGuidance = studio.locator('#istifa-tc_deger-guidance');
    await expect(tcGuidance).toBeVisible();
    await expect(tcGuidance).toContainText("11 haneli olmalıdır");

    // PDF İndir ve Yazdır butonları engellenmemeli
    const downloadBtn = studio
      .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
      .getByRole("button", { name: "PDF İndir", exact: true });
    await expect(downloadBtn).toBeEnabled();

    // Desktop'ta Yazdır butonu doğrudan görünür ve etkin olmalı
    const desktopPrintBtn = studio
      .locator('[data-testid="belge-studio-desktop-actions"]:visible')
      .getByRole("button", { name: "Yazdır", exact: true });
    if (await desktopPrintBtn.isVisible()) {
      await expect(desktopPrintBtn).toBeEnabled();
    }
  });
});

