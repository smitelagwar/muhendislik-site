import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => {
  console.error(`FAIL — ${message}`);
  process.exitCode = 1;
};

const pass = (message) => console.log(`PASS — ${message}`);

const vercelPath = path.join(root, "vercel.json");
const markerPath = path.join(root, "DEPLOYMENT_FREEZE.md");
const workflowsDir = path.join(root, ".github", "workflows");

if (!fs.existsSync(vercelPath)) {
  fail("vercel.json bulunamadı");
} else {
  try {
    const config = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
    if (config?.git?.deploymentEnabled !== false) {
      fail("vercel.json içinde git.deploymentEnabled tam olarak false değil");
    } else {
      pass("Vercel Git deployments disabled");
    }
  } catch (error) {
    fail(`vercel.json okunamadı: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (!fs.existsSync(markerPath)) {
  fail("DEPLOYMENT_FREEZE.md bulunamadı");
} else {
  pass("Deployment freeze marker mevcut");
}

const bannedPatterns = [
  { label: "vercel deploy", regex: /\bvercel\s+deploy\b/i },
  { label: "vercel --prod", regex: /\bvercel\s+--prod\b/i },
  { label: "vercel promote", regex: /\bvercel\s+promote\b/i },
  { label: "vercel rollback", regex: /\bvercel\s+rollback\b/i },
  { label: "deploy_to_vercel", regex: /\bdeploy_to_vercel\b/i },
  { label: "createDeployment", regex: /\bcreateDeployment\b/ },
];

const workflowFiles = [];
if (fs.existsSync(workflowsDir)) {
  for (const name of fs.readdirSync(workflowsDir)) {
    if (/\.ya?ml$/i.test(name)) workflowFiles.push(path.join(workflowsDir, name));
  }
}

let bannedHitCount = 0;
for (const file of workflowFiles) {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  for (const pattern of bannedPatterns) {
    if (pattern.regex.test(source)) {
      bannedHitCount += 1;
      fail(`${relative} aktif deployment ifadesi içeriyor: ${pattern.label}`);
    }
  }
}

if (bannedHitCount === 0) {
  pass("GitHub Actions içinde aktif Vercel deploy/promote/rollback komutu bulunmadı");
}

if (process.exitCode) {
  console.error("\nDeployment freeze doğrulaması başarısız.");
  process.exit(process.exitCode);
}

console.log("\nDEPLOYMENT FREEZE: PASS");
