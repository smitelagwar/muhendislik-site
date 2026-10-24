$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectId = "prj_znyq9fxSJMhptPOouSH6AAx7iQkI"
$teamId = "team_0r5QmGjgyEZXdrTmKMm0dYWc"
$previewStoreId = "store_fnCz97b5poIneDPq"
$tempEnv = Join-Path $env:TEMP ("stage14-development-" + [guid]::NewGuid().ToString("N") + ".env")
$evidenceLog = Join-Path $PSScriptRoot "ASAMA_14_preview_deploy_final.log"
$databaseValues = @{}

try {
    & vercel env pull $tempEnv --environment development --yes --project muhendislik-site --scope huseying5713-2819s-projects 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Development environment pull failed." }

    foreach ($line in Get-Content -LiteralPath $tempEnv) {
        if ($line -match "^(DATABASE_URL|POSTGRES_URL|POSTGRES_URL_NON_POOLING|POSTGRES_PRISMA_URL)=(.*)$") {
            $value = $Matches[2].Trim()
            if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            $databaseValues[$Matches[1]] = $value
        }
    }

    foreach ($name in @("DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL")) {
        if (-not $databaseValues.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($databaseValues[$name])) {
            throw "Required isolated Development DB variable is missing: $name"
        }
        if (([uri]$databaseValues[$name]).Host -notmatch "\.neon\.(tech|build)$") {
            throw "Database host rejected for $name"
        }
    }

    $secretBytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
    $shareSecret = [Convert]::ToBase64String($secretBytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
    [Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
    $cronSecret = [Convert]::ToBase64String($secretBytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")

    $arguments = @(
        "deploy", "--target", "preview", "--no-wait", "--yes",
        "--project", $projectId, "--scope", $teamId
    )
    foreach ($name in @("DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL")) {
        $arguments += @("--env", ($name + "=" + $databaseValues[$name]))
    }
    $arguments += @(
        "--env", ("BLOB_STORE_ID=" + $previewStoreId),
        "--env", ("BELGE_SHARE_SECRET=" + $shareSecret),
        "--env", ("CRON_SECRET=" + $cronSecret),
        "--env", "BELGE_SHARE_GLOBAL_DAILY_LIMIT=200",
        "--env", "BELGE_SHARE_GLOBAL_MAX_STORAGE_BYTES=1000000000"
    )

    $output = @(& vercel @arguments 2>&1)
    $deployExitCode = $LASTEXITCODE
    $text = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    foreach ($value in @($databaseValues.Values) + @($shareSecret, $cronSecret)) {
        if ($value) { $text = $text.Replace($value, "[REDACTED]") }
    }
    Set-Content -LiteralPath $evidenceLog -Value $text -Encoding utf8
    if ($deployExitCode -ne 0) { throw "Preview deployment failed with exit code $deployExitCode. See sanitized evidence log." }

    $url = [regex]::Match(($output -join "`n"), "https://[^\s]+\.vercel\.app").Value.TrimEnd(".")
    if (-not $url) { throw "Deployment URL missing from CLI output. See sanitized evidence log." }

    [pscustomobject]@{
        url = $url
        target = "preview"
        production = $false
        database = "Vercel Development isolated Neon"
        blobStoreId = $previewStoreId
        sourceGitHead = (git rev-parse HEAD)
        sourceTree = "dirty local V3 worktree"
        log = "docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_deploy_final.log"
    } | ConvertTo-Json -Compress | Write-Output
} finally {
    Remove-Item -LiteralPath $tempEnv -Force -ErrorAction SilentlyContinue
}
