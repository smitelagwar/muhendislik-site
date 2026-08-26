import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/BinaConstructionTimelineVisual.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/components/article-client.tsx"],
    rules: {
      // figureIndex is a render-local, deterministic counter used only while
      // synchronously mapping article image blocks. It is reset on every render
      // and never escapes ArticleBody, so this mutation is intentional.
      "react-hooks/immutability": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-playwright*/**",
    "test-results/**",
    "playwright-report/**",
    "out/**",
    "build/**",
    "public/vendor/**",
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
