const { spawn } = require("child_process");
const puppeteer = require("puppeteer");
const path = require("path");

const PORT = 3010;
const URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = "C:\\Users\\hsyn\\.gemini\\antigravity\\brain\\d6c7abe2-88a9-4ec0-957a-bf2482958cd9";

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 120;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          // Başa geri sar ki düzen düzgün görünsün
          window.scrollTo(0, 0);
          resolve();
        }
      }, 50);
    });
  });
}

async function main() {
  console.log("Starting Next.js development server on port " + PORT + "...");
  const devServer = spawn("npx", ["next", "dev", "-p", PORT.toString()], {
    shell: true,
    cwd: path.resolve(__dirname, ".."),
  });

  // Server hazır olana kadar bekle
  await new Promise((resolve) => {
    let started = false;
    devServer.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[Dev Server]", output.trim());
      if (output.includes("Ready in") || output.includes("ready") || output.includes("localhost:")) {
        if (!started) {
          started = true;
          setTimeout(resolve, 5000);
        }
      }
    });

    devServer.stderr.on("data", (data) => {
      console.error("[Dev Server Error]", data.toString());
    });

    setTimeout(() => {
      if (!started) {
        console.log("Dev server timeout, proceeding...");
        resolve();
      }
    }, 15000);
  });

  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // 1. Masaüstü Ekran Görüntüsü
    console.log("Navigating to homepage (Desktop)...");
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: "networkidle2" });
    
    console.log("Scrolling page to trigger animations...");
    await autoScroll(page);
    await new Promise((r) => setTimeout(r, 2000));
    
    console.log("Capturing Desktop screenshot...");
    const desktopPath = path.join(OUTPUT_DIR, "homepage_desktop.png");
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log(`Saved desktop screenshot to: ${desktopPath}`);

    // 2. Mobil Ekran Görüntüsü
    console.log("Navigating to homepage (Mobile)...");
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto(URL, { waitUntil: "networkidle2" });
    
    console.log("Scrolling page to trigger mobile animations...");
    await autoScroll(page);
    await new Promise((r) => setTimeout(r, 2000));
    
    console.log("Capturing Mobile screenshot...");
    const mobilePath = path.join(OUTPUT_DIR, "homepage_mobile.png");
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`Saved mobile screenshot to: ${mobilePath}`);

  } catch (error) {
    console.error("Error during screenshot:", error);
  } finally {
    console.log("Closing browser...");
    await browser.close();
    console.log("Terminating development server...");
    
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", devServer.pid, "/f", "/t"]);
    } else {
      devServer.kill("SIGKILL");
    }
    
    console.log("Process complete.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
