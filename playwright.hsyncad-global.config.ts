import {defineConfig} from "@playwright/test";
import base from "./playwright.hsyncad.config";
export default defineConfig({...base,testMatch:["**/global-reviews.spec.ts","**/project-settings.spec.ts","**/report-integrity.spec.ts"],outputDir:"test-results/hsyncad-global-p08",use:{...base.use,baseURL:"http://127.0.0.1:3158"},webServer:{command:"node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3158",env:{NEXT_DIST_DIR:".next-hsyncad-p08-build"},url:"http://127.0.0.1:3158/kategori/araclar/hsyncad",reuseExistingServer:false,timeout:120000}});
