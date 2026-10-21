import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--ignore-gpu-blocklist",
      "--enable-webgl",
      "--enable-webgl2",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--in-process-gpu",
      "--disable-gpu-sandbox",
    ],
  });

  const page = await browser.newPage();
  page.on("console", (msg) => {
    console.log(`[Console ${msg.type()}]: ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    console.error(`[PageError]: ${err.message}\n${err.stack}`);
  });

  console.log("Navigating to kalip_plani...");
  await page.goto("http://127.0.0.1:3000/dokumantasyon/dosya/bcec9dd8-39f3-44ca-9625-2c9fedddb5cf?cadEngine=v2");

  await page.waitForTimeout(6000);

  const canvasInfo = await page.evaluate(() => {
    const v2 = document.querySelector("[data-cad-v2-host='true']");
    const phase = v2?.getAttribute("data-v2-phase");
    return {
      phase,
      windowErrors: (window as unknown).__lastCadError || null,
    };
  });

  console.log("Evaluation result:", canvasInfo);

  await browser.close();
}

main().catch(console.error);
