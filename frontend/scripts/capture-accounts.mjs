import { chromium } from "playwright-core";
import { resolve } from "node:path";
const out=resolve(import.meta.dirname,"..","artifacts","promotion","flow-trailer-v2.2","screenshots","07-accounts.png");
const browser=await chromium.launch({executablePath:"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",headless:true,args:["--disable-gpu","--hide-scrollbars"]});
const context=await browser.newContext({viewport:{width:1920,height:1080},locale:"en-US"}); const page=await context.newPage();
await page.addInitScript(()=>{localStorage.setItem("nexus.onboarding.complete.v1","true");localStorage.setItem("nexus.locale.v1","en");});
await page.goto("http://127.0.0.1:4173/settings?section=accounts",{waitUntil:"networkidle"}); await page.waitForTimeout(5000);
await page.screenshot({path:out,fullPage:false}); console.log("saved",out); await browser.close();
