import { chromium } from 'file:///C:/Users/mohit/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('console',m=>{if(m.type()==='error')console.log('ERROR',m.text());});
page.on('pageerror',e=>console.log('ERROR',e.message));
await page.goto('http://127.0.0.1:5175');
await page.evaluate(async()=>{const {ThreeScene}=await import('/src/js/three/ThreeScene.js'); const fn=ThreeScene.prototype.renderCharacterView; ThreeScene.prototype.renderCharacterView=function(){window.__scene=this;return fn.call(this)}; const {SceneController}=await import('/src/js/core/SceneController.js');const f=SceneController.prototype.setState;SceneController.prototype.setState=function(s){window.__controller=this;return f.call(this,s)};});
await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();
await page.locator('[data-intro-start]').click();
await page.waitForFunction(()=>document.documentElement.dataset.appState==='world');
await page.locator('.character-nav__trigger').click();
await page.locator('[data-destination="work"]').click();
await page.waitForFunction(()=>document.documentElement.dataset.appState==='content',{},{timeout:35000});
await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>({center:__controller.ballCenter(),count:__scene.liquidBlob.stickers.length,loaded:__scene.liquidBlob.surfaceStickers.loaded.size,hero:document.querySelector('.destination-hero').getBoundingClientRect().toJSON(),intro:document.querySelector('.destination-introduction').getBoundingClientRect().toJSON()})));
await page.screenshot({path:'artifacts/qa/jelly/premium-first.png'});
const c=await page.evaluate(()=>__controller.ballCenter());
for(const [x,y] of [[-90,-75],[90,50],[-80,110],[120,-80],[0,0]]) {await page.mouse.click(c.x+x,c.y+y);await page.waitForTimeout(300);}
await page.waitForTimeout(1200);
await page.screenshot({path:'artifacts/qa/jelly/premium-stickers.png'});
console.log(await page.evaluate(()=>({count:__scene.liquidBlob.stickers.length,info:__scene.renderer.info.memory,programs:__scene.renderer.info.programs.length})));
await browser.close();

