$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$testLog = Join-Path $PSScriptRoot "ASAMA_14_preview_origin_unit.log"
$tscLog = Join-Path $PSScriptRoot "ASAMA_14_preview_origin_tsc.log"
$tscJson = Join-Path $PSScriptRoot "ASAMA_14_preview_origin_tsc.json"

try {
    & node --import tsx --test --test-concurrency=1 tests/belgeler/belge-share-stage06.test.ts 2>&1 |
        Tee-Object -FilePath $testLog
    $testExitCode = $LASTEXITCODE
    if ($testExitCode -ne 0) { throw "Preview origin unit test failed with exit code $testExitCode." }

    & npx.cmd tsc --noEmit --incremental false -p tsconfig.next.json 2>&1 |
        Tee-Object -FilePath $tscLog
    $tscExitCode = $LASTEXITCODE
    $report = [pscustomobject]@{
        command = "npx.cmd tsc --noEmit --incremental false -p tsconfig.next.json"
        environment = "Local runtime TypeScript scope; no project env or deployment"
        result = if ($tscExitCode -eq 0) { "PASS" } else { "FAIL" }
        exitCode = $tscExitCode
        log = "ASAMA_14_preview_origin_tsc.log"
    }
    $report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $tscJson -Encoding utf8
    if ($tscExitCode -ne 0) { throw "Runtime TypeScript check failed with exit code $tscExitCode." }
} catch {
    Write-Error $_
    exit 1
}
