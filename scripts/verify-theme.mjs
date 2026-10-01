// Local rendering fixture: files are fulfilled from disk, never requested from localhost.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium,expect}=require(process.env.PLAYWRIGHT_MODULE||'@playwright/test');
const browser=await chromium.connectOverCDP('http://127.0.0.1:18800');
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,serviceWorkers:'block'});
const root=path.resolve('public'),origin='https://gravity-render.test';
const contentTypes={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const errors=[],outbound=[],results=[];
await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin){outbound.push(url.href);return route.abort();}
  const pathname=decodeURIComponent(url.pathname),target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(root+path.sep))return route.abort();
  try{const bytes=await readFile(target);return route.fulfill({status:200,body:bytes,contentType:contentTypes[path.extname(target)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:'Missing fixture'});}
});
const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
await mkdir('verification/baki',{recursive:true});
try{
  await page.goto(origin+'/icon.svg');
  for(const size of [192,512]){await page.setViewportSize({width:size,height:size});await page.screenshot({path:`public/icon-${size}.png`,omitBackground:true});}
  await page.setViewportSize({width:1440,height:1000});await page.goto(origin);
  await expect(page.locator('.baki-figure img')).toBeVisible();
  await expect.poll(()=>page.locator('.baki-figure img').evaluate(i=>i.naturalWidth)).toBe(1920);
  await page.screenshot({path:'verification/baki/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'verification/baki/mobile.png',fullPage:true});
  await page.screenshot({path:'verification/baki/mobile-first-screen.png'});
  results.push('Official Baki PNG loaded at full source dimensions; desktop/mobile screenshots captured');
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const hash of ['hoje','plano','evolucao','ajustes']){
      await page.goto(origin+'/#'+hash);
      await expect(page.locator('main h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),hash+' overflow at '+width).toBe(false);
      expect(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
    }
  }
  results.push('All views fit 320/390/768/1440 pixels in dark Baki theme');
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/#hoje');
  await page.getByRole('button',{name:'Começar treino'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('spinbutton',{name:'Carga da série 1',exact:true}).fill('20');
  await page.getByRole('spinbutton',{name:'Repetições da série 1',exact:true}).fill('10');
  await page.getByRole('button',{name:'Concluir série 1',exact:true}).click();
  await page.screenshot({path:'verification/baki/workout.png'});
  await page.getByRole('button',{name:'Salvar e sair',exact:true}).click();await page.reload();
  await page.getByRole('button',{name:/^Retomar treino/}).click();
  await expect(page.getByRole('spinbutton',{name:'Carga da série 1',exact:true})).toHaveValue('20');
  await expect(page.getByRole('button',{name:'Desmarcar série 1',exact:true})).toHaveAttribute('aria-pressed','true');
  results.push('Existing storage key, set completion and paused workout persistence unchanged');
  await page.getByRole('button',{name:'Salvar e sair',exact:true}).click();
  await page.goto(origin+'/#ajustes');await expect(page.getByRole('heading',{name:'Universo Baki'})).toBeVisible();
  expect(errors).toEqual([]);expect(outbound).toEqual([]);
  results.push('Attribution visible; no JavaScript errors or third-party requests');
  const sw=await readFile('public/sw.js','utf8');
  for(const asset of ['baki.css','assets/baki-hanma-official.png','assets/baki-hanma-portrait.jpg']){expect(sw).toContain(asset);await readFile(path.join('public',asset));}
  results.push('Theme assets included in versioned offline precache (static verification)');
  await writeFile('verification/baki/results.json',JSON.stringify({date:new Date().toISOString(),method:'Local fixtures, service workers blocked; no localhost navigation',results,errors,outbound},null,2));
  console.log(JSON.stringify({passed:results.length,results},null,2));
}catch(e){await page.screenshot({path:'verification/baki/failure.png',fullPage:true}).catch(()=>{});throw e;}
finally{await context.close();await browser.close();}
