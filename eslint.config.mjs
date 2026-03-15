import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".agent/**",
    "get-shit-done/**",
    "-EKLEDİKLERİM/**",
    ".tmp/**",
    "output.html",
    "lint.txt",
    "lint_output.txt",
    "snapshot*.png",
    "puppeteer*.js",
    "test_scrollytelling.js",
    ".next-dev.err.log",
    ".next-dev.out.log",
  ]),
]);

export default eslintConfig;
