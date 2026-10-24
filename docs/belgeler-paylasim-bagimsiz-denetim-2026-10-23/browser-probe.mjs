import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
let browser;
const results={scope:'Canonical production UI read-only; all share mutations intercepted locally',checks:[]};
const watchdog=setTimeout(()=>{console.error('BROWSER_AUDIT_TIMEOUT');process.exit(124);},90000);
async function main(){
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  let mockedPosts=0;
  await context.route('**/*',async route=>{
    const req=route.request();const url=new URL(req.url());
    if(url.pathname==='/api/belgeler/paylasim'&&req.method()==='POST'){
      mockedPosts++;
      return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({url:'/b/'+'a'.repeat(43),viewToken:'a'.repeat(43),manageToken:'b'.repeat(43),documentId:'santiye-sefi-sozlesmesi',expiresAt:new Date(Date.now()+90*86400000).toISOString()})});
    }
    if(url.pathname.startsWith('/api/belgeler/paylasim/')&&req.method()==='DELETE')return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'SENTETIK_IPTAL_HATASI'})});
    if(!['GET','HEAD','OPTIONS'].includes(req.method()))return route.abort();
    return route.continue();
  });
  const page=await context.newPage();page.setDefaultTimeout(8000);
  await page.goto('https://muhendislik-site.vercel.app/belgeler/santiye-sefi-sozlesmesi',{waitUntil:'domcontentloaded',timeout:45000});
  const share=page.locator('[data-testid="belge-studio-desktop-actions"]:visible').getByRole('button',{name:'Paylaş',exact:true});
  await share.click();
  await page.getByTestId('belge-share-create-btn').click();
  await page.getByTestId('belge-share-result').waitFor();
  await page.getByRole('button',{name:'Bu bağlantıyı iptal et',exact:true}).click();
  await page.getByRole('button',{name:'Evet, Bağlantıyı İptal Et',exact:true}).click();
  await page.waitForResponse(r=>r.request().method()==='DELETE',{timeout:8000}).catch(()=>null);
  results.checks.push({id:'B01-revoke-error-hidden',errorVisible:await page.getByText('SENTETIK_IPTAL_HATASI',{exact:true}).count()});
  await page.getByTestId('belge-share-close-btn').click();
  const editable=page.locator('[data-testid="belge-studio-form-scroll"] input:visible').first();
  const editableId=await editable.getAttribute('id');await editable.fill('SENTETIK DENETIM A');
  await share.click();
  results.checks.push({id:'B02-new-revision',editedFieldId:editableId,oldResultVisible:await page.getByTestId('belge-share-result').isVisible(),createButtons:await page.getByTestId('belge-share-create-btn').count(),mockedPosts});
  await page.setViewportSize({width:320,height:740});
  results.checks.push({id:'B03-mobile-dialog',dimensions:await page.getByTestId('belge-share-dialog').evaluate(e=>({clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,viewport:innerWidth})),smallButtons:await page.getByTestId('belge-share-dialog').locator('button:visible').evaluateAll(es=>es.map(e=>({label:e.getAttribute('aria-label')||e.textContent.trim()||e.getAttribute('title'),w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})).filter(x=>x.w<44||x.h<44))});
  await page.getByTestId('belge-share-dialog').screenshot({path:new URL('./dialog-320.png',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),mask:[page.getByTestId('belge-share-url-input')]});
}
try{await main();}catch(e){results.error=e.message;process.exitCode=1;}
finally{if(browser)await browser.close();clearTimeout(watchdog);writeFileSync(new URL('./browser-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results));process.exit(process.exitCode||0);}
