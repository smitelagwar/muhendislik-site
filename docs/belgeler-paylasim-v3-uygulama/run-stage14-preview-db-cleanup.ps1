$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$evidenceLog = Join-Path $PSScriptRoot "ASAMA_14_preview_db_cleanup_final.log"
$env:BELGE_STAGE14_PREVIEW_CLEANUP = "1"
$env:BELGE_STAGE14_DB_SCOPE = "development"
$env:BELGE_STAGE14_BLOB_SCOPE = "preview-only-store"
$env:BELGE_STAGE14_BLOB_STORE_ID = "store_fnCz97b5poIneDPq"

try {
    $command = "vercel env run -e development -- node --import tsx docs/belgeler-paylasim-v3-uygulama/cleanup-stage14-preview.ts"
    $output = @(& cmd.exe /d /s /c $command 2>&1)
    $exitCode = $LASTEXITCODE
    $text = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    Set-Content -LiteralPath $evidenceLog -Value $text -Encoding utf8
    Write-Output $text
    if ($exitCode -ne 0) { exit $exitCode }
} finally {
    Remove-Item Env:BELGE_STAGE14_PREVIEW_CLEANUP, Env:BELGE_STAGE14_DB_SCOPE, Env:BELGE_STAGE14_BLOB_SCOPE, Env:BELGE_STAGE14_BLOB_STORE_ID -ErrorAction SilentlyContinue
}
