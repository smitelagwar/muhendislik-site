$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$evidenceLog = Join-Path $PSScriptRoot "ASAMA_14_preview_e2e_final.log"
$rcUrl = "https://muhendislik-site-2o68ppbmy-huseying5713-2819s-projects.vercel.app"

try {
    $env:STAGE14_RC_URL = $rcUrl
    $command = "vercel env run -e development -- npx.cmd playwright test --config=docs/belgeler-paylasim-v3-uygulama/playwright.stage14-preview.config.ts --project=chromium-preview"
    $output = @(& cmd.exe /d /s /c $command 2>&1)
    $exitCode = $LASTEXITCODE
    $text = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    Set-Content -LiteralPath $evidenceLog -Value $text -Encoding utf8
    Write-Output $text
    if ($exitCode -ne 0) { exit $exitCode }
} finally {
    Remove-Item Env:STAGE14_RC_URL -ErrorAction SilentlyContinue
}
