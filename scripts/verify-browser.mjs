// Local verification only. Uses the isolated managed OpenClaw browser, not personal Chrome.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium,expect}=require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const browser=await chromium.connectOverCDP('http://127.0.0.1:18800');
const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:1});
const page=await context.newPage(),errors=[],remote=[],results=[];
page.setDefaultTimeout(10000);
page.on('pageerror',e=>errors.push(e.message));
page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:4173')&&!req.url().startsWith('blob:'))remote.push(req.url());});
await mkdir('verification',{recursive:true});
try{
  // Rasterize our code-native SVG icon for iOS/PWA compatibility.
  await page.goto('http://127.0.0.1:4173/icon.svg');
  for(const n of [192,512]){await page.setViewportSize({width:n,height:n});await page.screenshot({path:`public/icon-${n}.png`,omitBackground:true});}
  await page.setViewportSize({width:1440,height:1100});
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('heading',{name:'Um passo além.'})).toBeVisible();
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();
  await page.screenshot({path:'verification/desktop.png',fullPage:true});
  results.push('Desktop renders with empty, non-fabricated history');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'verification/mobile.png',fullPage:true});
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const hash of ['hoje','plano','evolucao','ajustes']){
      await page.goto(`http://127.0.0.1:4173/#${hash}`);
      await expect(page.locator('main h1')).toBeVisible();
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      expect(overflow,`${hash} @ ${width} overflow`).toBe(false);
    }
  }
  results.push('All four views fit 320, 390, 768 and 1440 px');
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#hoje');
  await page.getByRole('button',{name:'Começar treino'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('spinbutton',{name:'Carga da série 1',exact:true}).fill('25');
  await page.getByRole('spinbutton',{name:'Repetições da série 1',exact:true}).fill('10');
  await page.getByRole('button',{name:'Concluir série 1',exact:true}).click();
  await expect(page.getByRole('button',{name:'Desmarcar série 1',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#rest')).not.toHaveText('00:00');
  await page.getByRole('button',{name:'Salvar e sair',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:/^Retomar treino/}).click();
  await expect(page.getByRole('spinbutton',{name:'Carga da série 1',exact:true})).toHaveValue('25');
  results.push('Strength sets and paused session survive reload; rest timer starts');
  await page.getByRole('button',{name:'Revisar e finalizar'}).click();
  await page.getByRole('spinbutton',{name:'Esforço geral'}).fill('4');
  await page.getByRole('spinbutton',{name:'Dor durante'}).fill('0');
  await page.getByRole('button',{name:'Salvar registro'}).click();
  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('camara-gravidade-v1')));
  expect(state.cursor).toBe(0);expect(state.history[0].status).toBe('partial');
  results.push('Partial session recorded without advancing sequence');
  // Finish the entire next strength session through actual form interaction.
  await page.getByRole('button',{name:'Começar treino'}).click();
  for(let i=0;i<5;i++){
    for(let j=1;j<=2;j++){
      await page.getByRole('spinbutton',{name:`Repetições da série ${j}`,exact:true}).fill('10');
      await page.getByRole('button',{name:`Concluir série ${j}`,exact:true}).click();
    }
    if(i<4)await page.getByRole('button',{name:'Próximo exercício'}).click();
  }
  await page.getByRole('button',{name:'Revisar e finalizar'}).click();
  await page.getByRole('spinbutton',{name:'Esforço geral'}).fill('5');
  await page.getByRole('spinbutton',{name:'Dor durante'}).fill('0');
  await page.getByRole('button',{name:'Salvar registro'}).click();
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('camara-gravidade-v1')));
  expect(state.cursor).toBe(1);expect(state.history.length).toBe(2);
  results.push('Completing every strength set advances exactly once to Corrida A');
  await page.getByRole('button',{name:'Começar treino'}).click();
  await expect(page.locator('#phase-label')).toHaveText('Aquecimento');
  await page.getByRole('button',{name:'Salvar e sair',exact:true}).click();
  await page.evaluate(()=>{const key='camara-gravidade-v1',s=JSON.parse(localStorage.getItem(key));s.active.accumulated=300;localStorage.setItem(key,JSON.stringify(s));});
  await page.reload();await page.getByRole('button',{name:/^Retomar treino/}).click();
  await expect(page.locator('#phase-label')).toHaveText('Trote 1 de 6');
  await page.getByRole('button',{name:'Salvar e sair',exact:true}).click();
  await page.evaluate(()=>{const key='camara-gravidade-v1',s=JSON.parse(localStorage.getItem(key));s.active.accumulated=2040;localStorage.setItem(key,JSON.stringify(s));});
  await page.reload();await page.getByRole('button',{name:/^Retomar treino/}).click();
  await expect(page.locator('#phase-label')).toHaveText('Sessão completa');
  await page.getByRole('button',{name:'Revisar e finalizar'}).click();
  await page.getByRole('spinbutton',{name:'Esforço geral'}).fill('4');
  await page.getByRole('spinbutton',{name:'Dor durante'}).fill('0');
  await page.getByRole('checkbox',{name:'Consegui falar'}).check();
  await page.getByRole('button',{name:'Salvar registro'}).click();
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('camara-gravidade-v1')));
  expect(state.cursor).toBe(2);expect(state.level).toBe(0);
  results.push('Running timer transitions at wall-clock boundaries; no automatic level advance');
  await page.goto('http://127.0.0.1:4173/#ajustes');
  const dlPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Exportar backup'}).click();
  const dl=await dlPromise;await dl.saveAs('verification/synthetic-backup.json');
  await page.evaluate(()=>localStorage.removeItem('camara-gravidade-v1'));await page.reload();
  page.once('dialog',d=>d.accept());
  await page.locator('#import').setInputFiles('verification/synthetic-backup.json');
  await expect(page.locator('#toast')).toContainText('Backup importado');
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('camara-gravidade-v1')));
  expect(state.history.length).toBe(3);expect(state.cursor).toBe(2);
  results.push('Export/import round-trip restores all synthetic records');
  await writeFile('verification/invalid-backup.json','{"version":1,"cursor":99}');
  await page.locator('#import').setInputFiles('verification/invalid-backup.json');
  await expect(page.locator('#toast')).toContainText('Não importado');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('camara-gravidade-v1')).history.length)).toBe(3);
  results.push('Invalid import rejected without modifying existing records');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Seu espaço. Seus dados.'})).toBeVisible();
  await page.getByRole('link',{name:'Hoje',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Um passo além.'})).toBeVisible();
  await page.getByRole('button',{name:'Começar treino'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Salvar e sair',exact:true}).click();
  results.push('Offline reload, navigation and starting/saving a workout work');
  await context.setOffline(false);
  expect(errors).toEqual([]);expect(remote).toEqual([]);
  results.push('No JavaScript errors and no third-party network requests');
  await writeFile('verification/browser-results.json',JSON.stringify({date:new Date().toISOString(),results,errors,remote},null,2));
  console.log(JSON.stringify({passed:results.length,results},null,2));
}catch(e){await page.screenshot({path:'verification/failure.png',fullPage:true}).catch(()=>{});throw e;}
finally{await context.close();await browser.close();}
