import { test, expect, type Page } from '@playwright/test';

const route = '/belgeler/beton-dokum-tutanagi';
const key = 'belgeler:ux:draft:device:v1:beton-dokum-tutanagi';
const skey = 'belgeler:ux:draft:session:v1:beton-dokum-tutanagi';
const title = '#beton-dokum-tutanak_alt_baslik';
async function stored(p: Page, session = false) {
  return p.evaluate(({key, session}) => (session ? sessionStorage : localStorage).getItem(key), { key: session ? skey : key, session });
}
async function open(p: Page) {
  await p.goto(route);
  await expect(p.getByTestId('belge-draft-status-badge')).toBeVisible();
  await expect(p.locator(title)).toBeVisible();
}
async function save(p: Page, mode: 'device' | 'session' = 'device') {
  await open(p); await p.locator(title).fill('Örnek kayıt çığ şantiye');
  await p.getByTestId(`belge-draft-consent-${mode}`).click();
  await expect.poll(() => stored(p, mode === 'session')).not.toBeNull();
}
async function menu(p: Page, action: string) {
  await p.getByTestId('belge-draft-status-badge').click();
  await p.getByTestId(action).click();
}
test.describe('Gerçek taslak yaşam döngüsü son kabul', () => {
  test.use({ viewport: { width: 1366, height: 900 } });
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(8000);
    page.on('pageerror', error => { throw error; });
  });
  test('session kapatma reload ve edit sonrasında kapalı kalır', async ({ page }) => {
    await save(page, 'session'); const original = await stored(page, true);
    await menu(page, 'belge-draft-disable-btn');
    await page.reload(); await page.getByTestId('belge-draft-restore-confirm').click();
    await page.locator(title).fill('Kapatılmış kaydı değiştirmeyen edit');
    await page.waitForTimeout(1000);
    expect(await stored(page, true)).toBe(original);
    await expect(page.getByTestId('belge-draft-status-badge')).toContainText('Kapalı');
  });
  test('hedef modda eski taslak varsa seçim beklenir, sessiz taşıma yok', async ({ page }) => {
    await save(page, 'device'); const device = await stored(page);
    await menu(page, 'belge-draft-switch-session');
    await page.locator(title).fill('Sekmede farklı değer');
    await expect.poll(() => stored(page, true)).not.toBeNull();
    await menu(page, 'belge-draft-switch-device');
    await expect(page.getByTestId('belge-draft-restore-banner')).toBeVisible();
    await page.waitForTimeout(1000); expect(await stored(page)).toBe(device);
    page.once('dialog', d => d.dismiss());
    await page.getByTestId('belge-draft-restore-ignore').click();
    expect(await stored(page)).toBe(device);
    page.once('dialog', d => d.accept());
    await page.getByTestId('belge-draft-restore-ignore').click();
    await expect.poll(async () => JSON.parse((await stored(page))!).values.tutanak_alt_baslik).toBe('Sekmede farklı değer');
  });
  test('dismiss sonrası kayıt menüsü recovery kararını tekrar açar', async ({ page }) => {
    await save(page); const original = await stored(page);
    await page.reload(); await page.getByTestId('belge-draft-restore-dismiss').click();
    await page.locator(title).fill('Henüz kabul edilmemiş form');
    await menu(page, 'belge-draft-toggle-pause');
    await expect(page.getByTestId('belge-draft-restore-banner')).toBeVisible();
    expect(await stored(page)).toBe(original);
  });
  test('bozuk kayıt retry/SPA ayrılışı ile ezilmez', async ({ page }) => {
    await open(page);
    await page.evaluate(k => {localStorage.setItem(k, '{bozuk'); localStorage.setItem('belgeler:ux:draft-consent:device:v1', 'device');}, key);
    await page.reload(); await page.locator(title).fill('Korumalı değer');
    await page.getByTestId('belge-draft-retry').click();
    await page.getByRole('link', {name:'Tüm belgelere dön',exact:true}).click();
    expect(await stored(page)).toBe('{bozuk');
  });
  test('conflict varken SPA cleanup eski formu yazamaz', async ({ page, context }) => {
    await save(page); const other = await context.newPage(); await open(other);
    await other.getByTestId('belge-draft-restore-confirm').click();
    await page.locator(title).fill('A yeni kayıt');
    await expect.poll(async () => JSON.parse((await stored(page))!).values.tutanak_alt_baslik).toBe('A yeni kayıt');
    await expect(other.getByTestId('belge-draft-conflict-banner')).toBeVisible();
    await other.locator(title).fill('B henüz kaydedilmemiş');
    await other.getByRole('link',{name:'Tüm belgelere dön',exact:true}).click();
    expect(JSON.parse((await stored(page))!).values.tutanak_alt_baslik).toBe('A yeni kayıt');
  });
  test('silme hatası görünür ve yeniden deneme silmeyi başarılı göstermez', async ({ page }) => {
    await save(page);
    await page.evaluate(k=>{ const remove=Storage.prototype.removeItem; Storage.prototype.removeItem=function(x){if(x===k)throw new Error('Test silme hatası'); return remove.call(this,x);};},key);
    page.once('dialog',d=>d.accept());await menu(page,'belge-draft-delete-btn');
    await expect(page.getByTestId('belge-draft-error-banner')).toBeVisible();
    expect(await stored(page)).not.toBeNull();
  });
  test('session seçimi başka belgenin cihaz izninden etkilenmez', async ({ page, context }) => {
    await save(page,'session'); const other=await context.newPage();
    await other.goto('/belgeler/insaat-ruhsati-dilekcesi');
    await other.locator('#insaat-ruhsati-belediye_adi').fill('Örnek idare');
    await other.getByTestId('belge-draft-consent-device').click();
    await page.locator(title).fill('Yalnız sekmede kalan yeni edit');
    await expect.poll(async()=>JSON.parse((await stored(page,true))!).values.tutanak_alt_baslik).toBe('Yalnız sekmede kalan yeni edit');
    expect(await stored(page)).toBeNull();
  });
  test('iki writer aynı sürümü yazmaya çalışınca biri conflict olur', async ({ page, context }) => {
    await save(page); const other=await context.newPage(); await open(other);
    await other.getByTestId('belge-draft-restore-confirm').click();
    // İki ayrı render sürecinde aynı taban sürüm; Web Locks ortak kritik bölümü korur.
    await Promise.all([page.locator(title).fill('A eşzamanlı'),other.locator(title).fill('B eşzamanlı')]);
    await expect.poll(async()=> Number(await page.getByTestId('belge-draft-conflict-banner').isVisible()) + Number(await other.getByTestId('belge-draft-conflict-banner').isVisible())).toBeGreaterThanOrEqual(1);
    const raw=JSON.parse((await stored(page))!);
    expect(['A eşzamanlı','B eşzamanlı']).toContain(raw.values.tutanak_alt_baslik);
    expect(raw.revision).toBe(2);
  });
});
