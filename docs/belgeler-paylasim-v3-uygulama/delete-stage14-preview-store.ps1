$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$storeId = "store_fnCz97b5poIneDPq"
$expectedName = "belgeler-stage14-preview-20261024"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$envPath = Join-Path $projectRoot ".env.local"
$ignorePath = Join-Path $projectRoot ".gitignore"
$tempRoot = Join-Path $env:TEMP ("stage14-store-cleanup-" + [guid]::NewGuid().ToString("N"))
$envBackup = Join-Path $tempRoot ".env.local"
$ignoreBackup = Join-Path $tempRoot ".gitignore"
$logPath = Join-Path $PSScriptRoot "ASAMA_14_preview_blob_cleanup_final.log"

New-Item -ItemType Directory -Path $tempRoot | Out-Null
Copy-Item -LiteralPath $envPath -Destination $envBackup
Copy-Item -LiteralPath $ignorePath -Destination $ignoreBackup
$initialEnvHash = (Get-FileHash -LiteralPath $envPath -Algorithm SHA256).Hash
$initialIgnoreHash = (Get-FileHash -LiteralPath $ignorePath -Algorithm SHA256).Hash

try {
    $before = @(& vercel blob get-store $storeId --scope huseying5713-2819s-projects 2>&1)
    if ($LASTEXITCODE -ne 0) { throw "Isolated Preview store could not be verified; refusing deletion." }
    $beforeText = ($before | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    if ($beforeText -notmatch [regex]::Escape($expectedName) -or $beforeText -notmatch [regex]::Escape($storeId)) {
        throw "Preview store identity mismatch; refusing deletion."
    }

    $deleteOutput = @(& vercel blob delete-store $storeId --scope huseying5713-2819s-projects --yes 2>&1)
    $deleteExitCode = $LASTEXITCODE
    $after = @(& vercel blob get-store $storeId --scope huseying5713-2819s-projects 2>&1)
    $afterExitCode = $LASTEXITCODE
    if ($deleteExitCode -ne 0 -or $afterExitCode -eq 0) {
        $details = (($deleteOutput + $after) | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
        Set-Content -LiteralPath $logPath -Value $details -Encoding utf8
        throw "Isolated Preview store deletion did not verify; see cleanup log."
    }

    $summary = @(
        "store=$expectedName ($storeId)",
        "scope=preview-only isolated synthetic test data",
        "before:", $beforeText,
        "delete:", (($deleteOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine),
        "after=store not found (verified)"
    ) -join [Environment]::NewLine
    Set-Content -LiteralPath $logPath -Value $summary -Encoding utf8
    Write-Output $summary
} finally {
    if ((Get-FileHash -LiteralPath $envPath -Algorithm SHA256).Hash -ne $initialEnvHash) {
        Copy-Item -LiteralPath $envBackup -Destination $envPath -Force
    }
    if ((Get-FileHash -LiteralPath $ignorePath -Algorithm SHA256).Hash -ne $initialIgnoreHash) {
        Copy-Item -LiteralPath $ignoreBackup -Destination $ignorePath -Force
    }
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
