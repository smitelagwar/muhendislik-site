$ErrorActionPreference = 'Stop'

$evidenceDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$modelPath = Join-Path $evidenceDirectory 'ASAMA_14_capacity_model.json'
$model = Get-Content -LiteralPath $modelPath -Raw | ConvertFrom-Json
$pdfDirectory = Join-Path $evidenceDirectory 'ASAMA_12_pdfs'
$pdfFiles = @(Get-ChildItem -LiteralPath $pdfDirectory -File -Recurse | Where-Object { $_.Name -like '*_shared.pdf' } | Sort-Object Name)
$sizes = @($pdfFiles | ForEach-Object { [long]$_.Length } | Sort-Object)
$mean = [double](($sizes | Measure-Object -Sum).Sum) / $sizes.Count
$p95 = [long]$sizes[[int][math]::Ceiling(0.95 * $sizes.Count) - 1]
$maximumAllowedPdfBytes = 3 * 1024 * 1024
$passed = 0

function Assert-Stage14([bool]$condition, [string]$message) {
  if (-not $condition) { throw "FAIL: $message" }
  $script:passed++
  Write-Output "PASS: $message"
}

Assert-Stage14 ($pdfFiles.Count -eq $model.pdfSample.count) 'fixture count matches the capacity model'
Assert-Stage14 ((($sizes | Measure-Object -Sum).Sum) -eq $model.pdfSample.bytesTotal) 'fixture byte total matches the capacity model'
Assert-Stage14 ([math]::Abs($mean - $model.pdfSample.bytesMean) -lt 0.001) 'sample mean recomputes from the checked fixture files'
Assert-Stage14 ($p95 -eq $model.pdfSample.bytesP95NearestRank) 'nearest-rank p95 recomputes from the checked fixture files'
Assert-Stage14 ($sizes[-1] -eq $model.pdfSample.bytesMax -and $sizes[-1] -le $maximumAllowedPdfBytes) 'sample maximum is recorded and below the 3 MiB PDF limit'

foreach ($scenario in $model.scenarios) {
  $browserCount = [int]$scenario.activeBrowsers
  $oneDaily = $scenario.oneNewSharePerBrowserPerDay
  $oneLinks90 = $browserCount * 90
  $oneLists = [int][math]::Ceiling($oneLinks90 / 100) * 30
  $oneOps = $browserCount * 30 + $oneLists
  Assert-Stage14 ($oneDaily.activeLinksAt90Days -eq $oneLinks90) "$browserCount browser(s): one-per-day 90-day record count"
  Assert-Stage14 ($oneDaily.cleanupListCallsPerMonth -eq $oneLists -and $oneDaily.advancedOperationsPerMonth -eq $oneOps) "$browserCount browser(s): one-per-day PUT/list operation forecast"

  $maxDaily = [math]::Min($browserCount * 50, 200)
  $maxLinks90 = $maxDaily * 90
  $max = $scenario.perBrowser50PerDayWithLocalGlobal200Hypothesis
  $maxLists = [int][math]::Ceiling($maxLinks90 / 100) * 30
  $maxOps = ($maxDaily * 30) + $maxLists
  Assert-Stage14 ($max.activeLinksAt90Days -eq $maxLinks90) "$browserCount browser(s): quota-ceiling 90-day record count"
  Assert-Stage14 ($max.advancedOperationsPerMonth -eq $maxOps) "$browserCount browser(s): quota-ceiling Blob PUT/list forecast"
}

$remainingHobbyStoreBytes = 1000000000 - [long]$model.productionSnapshot.blobStore.bytes
$worstSizeActiveDocs = [math]::Floor($remainingHobbyStoreBytes / $maximumAllowedPdfBytes)
Assert-Stage14 ($worstSizeActiveDocs -eq 301) 'Hobby storage remainder fits 301 additional maximum-size PDFs before other usage'
Assert-Stage14 (-not $model.capacityInputs.productionGlobalDailyLimitConfigured -and -not $model.capacityInputs.productionGlobalMaxStorageConfigured) 'production global quota variables are absent from the inspected environment inventory'
Assert-Stage14 ($model.capacityInputs.productionPreviewShareDatabaseEnvironmentEntry -and $model.capacityInputs.productionPreviewShareBlobStoreEnvironmentEntry -and -not $model.capacityInputs.productionPreviewIsolationProven) 'Preview isolation is not proven and cannot be used for RC'
Assert-Stage14 ($model.historicalLocalCleanupBenchmark.pageSizeOverride -eq 20 -and $model.historicalLocalCleanupBenchmark.listPages -eq 51 -and $model.historicalLocalCleanupBenchmark.environment -like 'PGlite + Memory Blob*') 'historical cleanup benchmark remains labeled as synthetic pageSize=20 evidence'

Write-Output "RESULT: PASS ($passed assertions); arithmetic only, no production database query, Blob listing, cron invocation, environment write, or deployment."
