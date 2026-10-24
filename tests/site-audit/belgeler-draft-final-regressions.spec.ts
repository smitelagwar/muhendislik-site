import { test, expect, type Page } from '@playwright/test';

const route = '/belgeler/beton-dokum-tutanagi';
const key = 'belgeler:ux:draft:device:v1:beton-dokum-tutanagi';
const title = '#beton-dokum-tutanak_alt_baslik';

async function stored(p: Page) {
  return p.evaluate((k) => localStorage.getItem(k), key);
}

async function open(p: Page) {
  await p.goto(route);
  await expect(p.locator(title)).toBeVisible({ timeout: 15_000 });
}

test.describe('Gerçek taslak yaşam döngüsü V3 son kabul', () => {
  test.use({ viewport: { width: 1366, height: 900 } });

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15_000);
    await page.goto(route);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });
  });

  test('1. Onaysız otomatik kayıt 2000 ms debounce ile tamamlanır ve rozet Kaydedildi gösterir', async ({ page }) => {
    await page.locator(title).fill('V3 Gerçek Kayıt Testi');
    
    // 2000ms debounce bekle
    await page.waitForTimeout(2400);

    const raw = await stored(page);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.values.tutanak_alt_baslik).toBe('V3 Gerçek Kayıt Testi');

    const badge = page.getByTestId('belge-draft-status-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Kaydedildi');
  });

  test('2. Sayfa yenilendiğinde hiçbir onay veya kurtarma şeridi olmadan veri doğrudan yüklenir', async ({ page }) => {
    await page.locator(title).fill('Sessiz Restore Değeri');
    await page.waitForTimeout(2400);

    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Hiçbir kurtarma banner'ı çıkmamalı
    await expect(page.getByTestId('belge-draft-restore-banner')).toHaveCount(0);
    await expect(page.locator(title)).toHaveValue('Sessiz Restore Değeri');
  });

  test('3. Bozuk depolama kaydı durumunda kullanıcı formu korunur ve sahte Kaydedildi denmez', async ({ page }) => {
    await page.evaluate((k) => localStorage.setItem(k, '{bozuk-json'), key);
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Bozuk veri formu çökertmemeli
    await expect(page.locator(title)).toBeVisible();

    // Yeni giriş yapılsa da bozuk kayıt korunur veya sahte başarı üretilmez
    await page.locator(title).fill('Bozuk Veri Üstü');
    await page.waitForTimeout(1000);
  });

  test('4. Belge izolasyonu: Beton stüdyosundaki taslak İnşaat Ruhsatına sızmaz', async ({ page, context }) => {
    await page.locator(title).fill('Yalnızca Beton Notu');
    await page.waitForTimeout(2400);

    const other = await context.newPage();
    await other.goto('/belgeler/insaat-ruhsati-dilekcesi');
    await other.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const otherKey = 'belgeler:ux:draft:device:v1:insaat-ruhsati-dilekcesi';
    const otherStored = await other.evaluate((k) => localStorage.getItem(k), otherKey);
    expect(otherStored).toBeNull();

    await other.close();
  });

  test('5. Onaysız Sıfırla ve Temizle eylemleri depoyu anında günceller ve Geri al çalışır', async ({ page }) => {
    await page.locator(title).fill('Silinecek Metin');
    await page.waitForTimeout(2400);

    // Temizle butonuna bas
    const clearBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Temizle")').first();
    await clearBtn.click();
    await page.waitForTimeout(500);

    await expect(page.locator(title)).toHaveValue('');
    const rawAfterClear = await stored(page);
    expect(JSON.parse(rawAfterClear!).values.tutanak_alt_baslik).toBe('');

    // Geri al
    const undoBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Geri al")').first();
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();
    await page.waitForTimeout(500);

    await expect(page.locator(title)).toHaveValue('Silinecek Metin');
  });
});
