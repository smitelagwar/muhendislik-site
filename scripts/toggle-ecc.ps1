<#
.SYNOPSIS
    ECC (Everything Claude Code) entegrasyonu durumunu yönetir (Aktif / Pasif).
.EXAMPLE
    .\scripts\toggle-ecc.ps1 -Status
    .\scripts\toggle-ecc.ps1 -Enable
    .\scripts\toggle-ecc.ps1 -Disable
    .\scripts\toggle-ecc.ps1 -Toggle
#>
param(
    [switch]$Status,
    [switch]$Enable,
    [switch]$Disable,
    [switch]$Toggle
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir "toggle-ecc.mjs"

$action = "--status"
if ($Enable) { $action = "--enable" }
elseif ($Disable) { $action = "--disable" }
elseif ($Toggle) { $action = "--toggle" }

& node $nodeScript $action
