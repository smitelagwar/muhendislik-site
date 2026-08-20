import assert from "node:assert/strict";
import {
  buildPublicShareUrl,
  getPublicSiteOrigin,
  PublicSiteOriginError,
} from "../src/lib/site-config";

const token = "A".repeat(43);
const keys = ["NODE_ENV", "NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL"] as const;
const original = new Map(keys.map((key) => [key, process.env[key]]));
const mutableEnvironment = process.env as Record<string, string | undefined>;

function setEnvironment(values: Partial<Record<(typeof keys)[number], string | undefined>>) {
  for (const key of keys) {
    const value = values[key];
    if (value === undefined) delete mutableEnvironment[key];
    else mutableEnvironment[key] = value;
  }
}

try {
  setEnvironment({ NODE_ENV: "development" });
  assert.equal(getPublicSiteOrigin(), "http://localhost:3000");

  setEnvironment({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://muhendislik-site.vercel.app/" });
  assert.equal(buildPublicShareUrl(token), `https://muhendislik-site.vercel.app/p/${token}`);

  setEnvironment({ NODE_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "portal.example.com" });
  assert.equal(getPublicSiteOrigin(), "https://portal.example.com");

  setEnvironment({ NODE_ENV: "production" });
  assert.throws(() => getPublicSiteOrigin(), PublicSiteOriginError);

  setEnvironment({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
  assert.throws(() => getPublicSiteOrigin(), PublicSiteOriginError);

  console.log("Document share public-origin checks passed.");
} finally {
  for (const key of keys) {
    const value = original.get(key);
    if (value === undefined) delete mutableEnvironment[key];
    else mutableEnvironment[key] = value;
  }
}
