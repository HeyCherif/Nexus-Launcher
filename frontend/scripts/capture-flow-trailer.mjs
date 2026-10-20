import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,".."), out=resolve(root,"artifacts","promotion","flow-trailer-v2.2","screenshots");
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",headless:true,args:["--disable-gpu","--hide-scrollbars"]});
const context=await browser.newContext({viewport:{width:1920,height:1080},locale:"en-US"});
const page=await context.newPage();
await page.addInitScript(()=>{localStorage.setItem("nexus.onboarding.complete.v1","true");localStorage.setItem("nexus.locale.v1","en");});
const routes=[["01-home.png","/"],["02-library.png","/library"],["03-search.png","/search"],["04-settings.png","/settings"],["05-downloads.png","/downloads"]];
for(const [name,route] of routes){await page.goto("http://127.0.0.1:4173"+route,{waitUntil:"networkidle"});await page.waitForTimeout(4500);await page.screenshot({path:resolve(out,name),fullPage:false});console.log(name,route);}
await page.goto("http://127.0.0.1:4173/library",{waitUntil:"networkidle"});await page.waitForTimeout(4500);
const card=page.locator("button.library-entry").first();
if(await card.count()){await card.click();await page.waitForTimeout(4500);await page.screenshot({path:resolve(out,"06-game-detail.png"),fullPage:false});console.log("06-game-detail.png",page.url());}
await browser.close();
