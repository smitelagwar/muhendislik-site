// Audit only: no production writes; all browser profiles and values are synthetic.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.UX_AUDIT_URL || 'http://127.0.0.1:3016';
const route = '/belgeler/beton-dokum-tutanagi';
const key = 'belgeler:ux:draft:device:v1:beton-dokum-tutanagi';
const consent = 'belgeler:ux:draft-consent:device:v1';
const skey = 'belgeler:ux:draft:session:v1:beton-dokum-tutanagi';
const title = '#beton-dokum-tutanak_alt_baslik';
const results = [];
let browser;
const watchdog = setTimeout(() => {
  console.error('Audit timeout');
  process.exitCode = 2;
  void browser?.close();
  setTimeout(() => process.exit(2), 2000);
}, 240000);
const tid = (page, id) => page.getByTestId(id);
const settle = page => page.waitForTimeout(1200);
async function open(context, url = route) {
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(base + url, { timeout: 45000 });
  await tid(page, 'belge-studio-preview-toolbar').waitFor();
  await page.waitForTimeout(350);
  return page;
}
async function saved(page, mode = 'device', value = 'AUDIT synthetic saved') {
  await page.locator(title).fill(value);
  await tid(page, `belge-draft-consent-${mode}`).click();
  await settle(page);
}
const read = page => page.evaluate(k => localStorage.getItem(k), key);
async function check(id, run) {
  if (process.env.UX_AUDIT_CASES && !process.env.UX_AUDIT_CASES.split(',').some(x=>id.startsWith(x))) return;
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  try {
    const result = await run(context);
    results.push({ id, ...result });
    console.log(JSON.stringify({ id, ...result }));
  } catch (error) {
    results.push({ id, result: 'HARNESS_ERROR', error: String(error) });
    console.error(id, String(error));
  } finally { await context.close(); }
}
try {
  browser = await chromium.launch({ headless: true });
  await check('R01_corrupt_draft', async c => {
    const p = await open(c);
    const raw = '{AUDIT incompatible saved data';
    await p.evaluate(({key,consent,raw}) => { localStorage.setItem(key,raw); localStorage.setItem(consent,'device'); }, {key,consent,raw});
    await p.reload(); await p.waitForTimeout(350);
    await p.locator(title).fill('AUDIT replacement without recovery approval'); await settle(p);
    const preserved = (await read(p)) === raw;
    return { result: preserved ? 'PASS' : 'FAIL', preserved, errorVisible: await tid(p,'belge-draft-error-banner').isVisible() };
  });
  await check('R02_session_to_device_leak', async c => {
    const a = await open(c);
    await saved(a,'session','AUDIT SESSION ONLY');
    const b = await open(c,'/belgeler/insaat-ruhsati-dilekcesi');
    await b.locator('#insaat-ruhsati-belediye_adi').fill('AUDIT other document');
    await tid(b,'belge-draft-consent-device').click(); await settle(a);
    await a.locator(title).fill('AUDIT SESSION ONLY later edit'); await settle(a);
    const raw = await read(a);
    return { result: raw === null ? 'PASS' : 'FAIL', sessionOnlyDataWrittenToDevice: raw !== null, badge: await tid(a,'belge-draft-status-badge').innerText() };
  });
  await check('R03_remote_delete_resurrection', async c => {
    const a = await open(c); await saved(a);
    const b = await open(c);
    b.on('dialog',d=>d.accept());
    await a.locator(title).fill('AUDIT pending edit before other tab deletes');
    await tid(b,'belge-draft-restore-delete').click(); await settle(a);
    return { result: (await read(a)) === null ? 'PASS' : 'FAIL', draftRecreated: (await read(a)) !== null };
  });
  await check('R04_restore_then_edit', async c => {
    const p = await open(c); await saved(p);
    await p.reload(); await tid(p,'belge-draft-restore-confirm').click();
    await p.locator(title).fill('AUDIT after reload edit'); await settle(p);
    const conflict = await tid(p,'belge-draft-conflict-banner').isVisible();
    return { result: conflict ? 'FAIL' : 'PASS', falseOtherTabConflict: conflict, savedValue: JSON.parse(await read(p)).values.tutanak_alt_baslik };
  });
  await check('R05_clear_confirmation', async c => {
    const p = await open(c); await saved(p);
    let dialogs = 0; p.on('dialog',async d => { dialogs++; await d.dismiss(); });
    await p.getByRole('button',{ name:'Temizle',exact:true }).click(); await settle(p);
    return { result: dialogs > 0 && (await p.locator(title).inputValue()) !== '' ? 'PASS' : 'FAIL', dialogs, emptiedWithoutApproval: (await p.locator(title).inputValue()) === '', storedTitle: JSON.parse(await read(p)).values.tutanak_alt_baslik };
  });
  await check('R06_decline_cannot_enable', async c => {
    const p = await open(c); await p.locator(title).fill('AUDIT opt out');
    await tid(p,'belge-draft-consent-dismiss').click();
    const badge = await tid(p,'belge-draft-status-badge').count();
    return {result: badge > 0 ? 'PASS' : 'FAIL', availableDraftSettings: badge};
  });
  await check('R07_hidden_settings_and_pause_label', async c => {
    const p = await open(c); await saved(p);
    await tid(p,'belge-draft-status-badge').click(); await tid(p,'belge-draft-toggle-pause').click();
    const pausedBadge = await tid(p,'belge-draft-status-badge').innerText();
    await tid(p,'belge-pdf-focus-toggle').click();
    const focusVisible = await tid(p,'belge-draft-status-badge').isVisible();
    await p.setViewportSize({width:390,height:844});
    const mobileVisible = await tid(p,'belge-draft-status-badge').isVisible();
    return {result: focusVisible && mobileVisible && pausedBadge.includes('Duraklat') ? 'PASS':'FAIL',focusVisible,mobileVisible,pausedBadge};
  });
  await check('R08_accordion_contract', async c => {
    const p = await open(c);
    const heights = await p.locator('[data-testid^="belge-section-toggle-"]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
    await tid(p,'belge-sections-toggle-all').click();
    const openCount = await p.locator('[data-testid^="belge-section-toggle-"][aria-expanded="true"]').count();
    await p.screenshot({path:path.join(out,'accordion-all-closed.png')});
    return {result: openCount >= 1 && heights.every(h=>h>=44) ? 'PASS':'FAIL',openCount,heights};
  });
  await check('R09_quota_no_visible_error', async c => {
    const p = await open(c);
    await p.evaluate(()=>{ Storage.prototype.setItem=function(){throw new DOMException('AUDIT full','QuotaExceededError');}; });
    await p.locator(title).fill('AUDIT quota'); await tid(p,'belge-draft-consent-device').click(); await settle(p);
    const errorVisible=await tid(p,'belge-draft-error-banner').isVisible();
    return {result:errorVisible?'PASS':'FAIL',errorVisible,stored:await read(p),badge:await tid(p,'belge-draft-status-badge').innerText()};
  });
  await check('R10_delete_failure_false_success', async c => {
    const p = await open(c); await saved(p);
    await p.evaluate(k=>{const old=Storage.prototype.removeItem;Storage.prototype.removeItem=function(x){if(x===k)throw new DOMException('AUDIT denied','SecurityError');return old.call(this,x);};},key);
    p.on('dialog',d=>d.accept());
    await tid(p,'belge-draft-status-badge').click(); await tid(p,'belge-draft-delete-btn').click();
    return {result:await tid(p,'belge-draft-error-banner').isVisible()?'PASS':'FAIL',recordStillPresent:(await read(p))!==null,errorVisible:await tid(p,'belge-draft-error-banner').isVisible()};
  });
  await check('R11_pause_reload', async c => {
    const p = await open(c); await saved(p);
    await tid(p,'belge-draft-status-badge').click(); await tid(p,'belge-draft-toggle-pause').click();
    await p.reload(); await tid(p,'belge-draft-restore-confirm').click();
    await tid(p,'belge-draft-status-badge').click();
    const action=await tid(p,'belge-draft-toggle-pause').innerText();
    return {result:action.includes('Devam')?'PASS':'FAIL',action,consentStillDevice:await p.evaluate(k=>localStorage.getItem(k),consent)};
  });
  await check('R12_read_error_overwrites_existing', async c => {
    const p = await open(c); await saved(p);
    const original=await read(p);
    await c.addInitScript(k=>{const old=Storage.prototype.getItem;Storage.prototype.getItem=function(x){if(x===k)throw new DOMException('AUDIT read blocked','SecurityError');return old.call(this,x);};},key);
    await p.reload(); await p.waitForTimeout(350);
    await p.locator(title).fill('AUDIT overwrite unread record'); await settle(p);
    // Storage named-property access bypasses the deliberately failed getItem.
    const raw=await p.evaluate(k=>localStorage[k] ?? null,key);
    return {result:raw===original?'PASS':'FAIL',originalPreserved:raw===original,errorVisible:await tid(p,'belge-draft-error-banner').isVisible()};
  });
  await check('R13_session_corrupt_restore_decision', async c => {
    const p = await open(c); await saved(p,'session');
    const original = await p.evaluate(k=>sessionStorage.getItem(k),skey);
    await p.reload(); await p.waitForTimeout(350);
    await p.locator(title).fill('AUDIT overwrite pending session');
    let dialogs=0;p.on('dialog',async d=>{dialogs++;await d.dismiss();});
    await tid(p,'belge-draft-restore-ignore').click();await settle(p);
    const raw=await p.evaluate(k=>sessionStorage.getItem(k),skey);
    return {result:raw===original && dialogs>0?'PASS':'FAIL',dialogs,oldDraftPreserved:raw===original};
  });
  await check('R14_remote_load_no_confirmation', async c => {
    const a=await open(c);await saved(a);
    const b=await open(c);await tid(b,'belge-draft-restore-confirm').click();
    await b.locator(title).fill('AUDIT B unsaved');await settle(b);
    let dialogs=0;b.on('dialog',async d=>{dialogs++;await d.dismiss();});
    await tid(b,'belge-draft-conflict-reload').click();
    return {result:dialogs>0 && (await b.locator(title).inputValue())==='AUDIT B unsaved'?'PASS':'FAIL',dialogs,currentValue:await b.locator(title).inputValue()};
  });
  await check('R15_pdf_failure_exit_locked', async c => {
    const p=await open(c);await tid(p,'belge-pdf-focus-toggle').click();
    await p.evaluate(()=>{URL.createObjectURL=()=>{throw new Error('AUDIT injected generation failure');};});
    await p.getByRole('button',{name:'Temizle',exact:true}).click();await settle(p);
    const disabled=await tid(p,'belge-pdf-focus-toggle').isDisabled();
    const formHidden=!(await tid(p,'belge-studio-form-scroll').isVisible());
    return {result:disabled && formHidden?'FAIL':'PASS',disabled,formHidden};
  });
  await check('R16_spa_navigation_pending_edit', async c => {
    const p=await open(c);await saved(p);
    await p.request.get(base+'/belgeler',{timeout:45000});
    await p.getByRole('link',{name:'Tüm belgelere dön',exact:true}).hover();await p.waitForTimeout(500);
    await p.locator(title).fill('AUDIT final edit before SPA exit');const before=Date.now();
    await p.getByRole('link',{name:'Tüm belgelere dön',exact:true}).click();
    await p.waitForURL(base+'/belgeler');const elapsed=Date.now()-before;await settle(p);
    const value=JSON.parse(await read(p)).values.tutanak_alt_baslik;
    return {result:value==='AUDIT final edit before SPA exit'?'PASS':elapsed<800?'FAIL':'INCONCLUSIVE',elapsedMs:elapsed,savedValue:value};
  });
  await check('R17_focus_restore_scroll', async c => {
    const p=await open(c);await p.setViewportSize({width:1366,height:600});
    await p.locator(title).focus();
    await tid(p,'belge-studio-form-scroll').evaluate(el=>{el.scrollTop=180;});
    const before=await tid(p,'belge-studio-form-scroll').evaluate(el=>el.scrollTop);
    await tid(p,'belge-pdf-focus-toggle').click();await tid(p,'belge-pdf-focus-toggle').click();await p.waitForTimeout(150);
    const after=await tid(p,'belge-studio-form-scroll').evaluate(el=>el.scrollTop);
    return {result:Math.abs(before-after)<=2?'PASS':'FAIL',before,after};
  });
  await check('R18_session_ignore_without_edit', async c => {
    const p=await open(c);await saved(p,'session');await p.reload();
    await tid(p,'belge-draft-restore-ignore').click();
    await p.locator(title).fill('AUDIT newly edited after ignore');await settle(p);
    const raw=await p.evaluate(k=>sessionStorage.getItem(k),skey);
    return {result:JSON.parse(raw).values.tutanak_alt_baslik==='AUDIT synthetic saved'?'PASS':'FAIL',overwrittenWithoutSecondConfirmation:true};
  });
} catch(error) { console.error(error);process.exitCode=2; }
finally {
  await fs.writeFile(path.join(out,process.env.UX_AUDIT_CASES ? `results-${process.env.UX_AUDIT_CASES.replaceAll(',','-')}.json` : 'results.json'),JSON.stringify({base,testedAt:new Date().toISOString(),results},null,2));
  if(browser) await browser.close();
  clearTimeout(watchdog);
  process.exit(process.exitCode || (results.some(r=>r.result!=='PASS')?1:0));
}
