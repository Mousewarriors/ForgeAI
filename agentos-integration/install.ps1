# Installs ForgeAI into AgentOS as a native workspace app.
#  1. Copies the adapter into C:\AgentOS\server\adapters\
#  2. Registers it in C:\AgentOS\server\index.js
#  3. Adds the agent entry to C:\AgentOS\agentos.config.json
# Idempotent: safe to run more than once. Backs up files it modifies.

$ErrorActionPreference = "Stop"
$agentOs = "C:\AgentOS"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path (Join-Path $agentOs "server\index.js"))) {
    Write-Host "AgentOS not found at $agentOs - aborting." -ForegroundColor Red
    exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

# --- 1. Copy the adapter ---------------------------------------------------
$adapterDest = Join-Path $agentOs "server\adapters\forgeai-adapter.js"
Copy-Item (Join-Path $here "forgeai-adapter.js") $adapterDest -Force
Write-Host "[1/3] Adapter copied to $adapterDest" -ForegroundColor Green

# --- 2. Register the adapter in server/index.js -----------------------------
$indexPath = Join-Path $agentOs "server\index.js"
$indexSrc = [System.IO.File]::ReadAllText($indexPath)

if ($indexSrc.Contains("forgeai-adapter")) {
    Write-Host "[2/3] server/index.js already registers ForgeAI - skipped" -ForegroundColor Yellow
} else {
    Copy-Item $indexPath "$indexPath.bak-$stamp"

    $requireAnchor = "const FerrariTraderAdapter = require('./adapters/ferrari-trader-adapter');"
    $mapAnchor = "'ferrari-trader': FerrariTraderAdapter"

    if (-not $indexSrc.Contains($requireAnchor)) {
        Write-Host "Could not find the adapter require block in server/index.js - aborting (no changes made to it)." -ForegroundColor Red
        exit 1
    }
    if (-not $indexSrc.Contains($mapAnchor)) {
        Write-Host "Could not find the adapterClasses map in server/index.js - aborting (no changes made to it)." -ForegroundColor Red
        exit 1
    }

    $nl = [Environment]::NewLine
    $indexSrc = $indexSrc.Replace(
        $requireAnchor,
        $requireAnchor + $nl + "  const ForgeAIAdapter = require('./adapters/forgeai-adapter');"
    )
    $indexSrc = $indexSrc.Replace(
        $mapAnchor,
        $mapAnchor + "," + $nl + "    'forgeai': ForgeAIAdapter"
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($indexPath, $indexSrc, $utf8NoBom)
    Write-Host "[2/3] Registered ForgeAIAdapter in server/index.js (backup: index.js.bak-$stamp)" -ForegroundColor Green
}

# --- 3. Add the agent entry to agentos.config.json --------------------------
$configPath = Join-Path $agentOs "agentos.config.json"
$configRaw = [System.IO.File]::ReadAllText($configPath)
# Strip a UTF-8 BOM if present so ConvertFrom-Json is happy
if ($configRaw.Length -gt 0 -and $configRaw[0] -eq [char]0xFEFF) {
    $configRaw = $configRaw.Substring(1)
}
$config = $configRaw | ConvertFrom-Json

$existing = @($config.agents | Where-Object { $_.id -eq "forgeai" })
if ($existing.Count -gt 0) {
    Write-Host "[3/3] agentos.config.json already contains the forgeai agent - skipped" -ForegroundColor Yellow
} else {
    Copy-Item $configPath "$configPath.bak-$stamp"

    $entryRaw = [System.IO.File]::ReadAllText((Join-Path $here "agent-config.json"))
    $entry = $entryRaw | ConvertFrom-Json
    $config.agents = @($config.agents) + $entry

    $json = $config | ConvertTo-Json -Depth 16
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($configPath, $json, $utf8NoBom)
    Write-Host "[3/3] Added forgeai agent to agentos.config.json (backup: agentos.config.json.bak-$stamp)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! Restart AgentOS to pick up the new app:" -ForegroundColor Cyan
Write-Host "  - If it runs with 'npm run dev' (node --watch), editing index.js restarted it already."
Write-Host "  - Otherwise restart it manually, or POST /api/system/restart from the UI."
Write-Host "ForgeAI will appear as a workspace app; its native tab embeds http://localhost:3000"
Write-Host "and the 'open-control' action auto-starts the dev server if it is not running."
