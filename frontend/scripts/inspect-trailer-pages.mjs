import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true, args:["--disable-gpu","--hide-scrollbars"] });
const context = await browser.newContext({ viewport:{width:1920,height:1080}, locale:"en-US" });
const page = await context.newPage();
await page.addInitScript(() => localStorage.setItem("nexus.onboarding.complete.v1","true"));
for (const route of ["/settings","/library"]) {
  await page.goto("http://127.0.0.1:4173"+route,{waitUntil:"networkidle"});
  await page.waitForTimeout(5000);
  console.log("\nROUTE",route,"\n",(await page.locator("body").innerText()).slice(0,6000));
}
await browser.close();
