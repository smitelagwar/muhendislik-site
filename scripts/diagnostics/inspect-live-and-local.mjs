import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://muhendislik-site.vercel.app/dokumantasyon", { waitUntil: "networkidle" });
  
  const files = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("a[href*='/dokumantasyon/dosya/']"));
    return rows.map((el) => {
      const parent = el.closest("tr") || el.parentElement;
      return {
        text: parent ? parent.innerText.split("\n").filter(Boolean).join(" | ") : el.innerText,
        href: el.getAttribute("href"),
      };
    });
  });

  console.log(`Found ${files.length} file links on live site:`);
  for (const f of files) {
    console.log(`- ${f.text} -> ${f.href}`);
  }

  await browser.close();
}

main().catch(console.error);
