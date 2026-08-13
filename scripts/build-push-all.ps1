# =============================================================================
# NexusCart - Build & Push All Microservice Images to Azure Container Registry
# =============================================================================
# Usage (from backend/ directory):
#   pwsh ./scripts/build-push-all.ps1
#
# Optional parameters:
#   pwsh ./scripts/build-push-all.ps1 -Registry myregistry -Tag v1.0.0
# =============================================================================

param(
    [string]$Registry = "nexuscartacr",
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"
$LoginServer = "$Registry.azurecr.io"

# All 9 services and their ports (informational)
$Services = @(
    @{ Name = "api-gateway";           Port = 5000 },
    @{ Name = "auth-service";          Port = 5001 },
    @{ Name = "business-service";      Port = 5002 },
    @{ Name = "product-service";       Port = 5003 },
    @{ Name = "admin-service";         Port = 5004 },
    @{ Name = "order-service";         Port = 5005 },
    @{ Name = "payment-service";       Port = 5006 },
    @{ Name = "notification-service";  Port = 5007 },
    @{ Name = "review-rating-service"; Port = 5008 }
)

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendRoot = Split-Path -Parent $ScriptRoot

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " NexusCart - Build & Push to $LoginServer" -ForegroundColor Cyan
Write-Host " Tag: $Tag" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Ensure we are logged in to the registry
Write-Host "`n[0/9] Checking ACR login..." -ForegroundColor Yellow
az acr login --name $Registry | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: az acr login failed. Run 'az login' first." -ForegroundColor Red
    exit 1
}
Write-Host "Logged in to $LoginServer" -ForegroundColor Green

$Results = @()
$Index = 0

foreach ($svc in $Services) {
    $Index++
    $Name = $svc.Name
    $ServiceDir = Join-Path $BackendRoot $Name
    $Image = "${LoginServer}/${Name}:${Tag}"

    Write-Host "`n[$Index/9] $Name (port $($svc.Port))" -ForegroundColor Yellow
    Write-Host "  Image: $Image"

    if (-not (Test-Path (Join-Path $ServiceDir "Dockerfile"))) {
        Write-Host "  SKIPPED - no Dockerfile found" -ForegroundColor Red
        $Results += [pscustomobject]@{ Service = $Name; Status = "SKIPPED"; Duration = "-" }
        continue
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    # Build
    docker build -t $Image $ServiceDir
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  BUILD FAILED for $Name" -ForegroundColor Red
        $Results += [pscustomobject]@{ Service = $Name; Status = "BUILD FAILED"; Duration = "-" }
        continue
    }

    # Push
    docker push $Image
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  PUSH FAILED for $Name" -ForegroundColor Red
        $Results += [pscustomobject]@{ Service = $Name; Status = "PUSH FAILED"; Duration = "-" }
        continue
    }

    $sw.Stop()
    $Duration = "{0:mm\:ss}" -f $sw.Elapsed
    Write-Host "  OK ($Duration)" -ForegroundColor Green
    $Results += [pscustomobject]@{ Service = $Name; Status = "OK"; Duration = $Duration }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " Summary" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
$Results | Format-Table -AutoSize

$Failed = ($Results | Where-Object { $_.Status -ne "OK" }).Count
if ($Failed -gt 0) {
    Write-Host "$Failed service(s) failed." -ForegroundColor Red
    exit 1
} else {
    Write-Host "All 9 images built and pushed to $LoginServer" -ForegroundColor Green
    Write-Host "`nVerify with: az acr repository list --name $Registry --output table" -ForegroundColor DarkGray
}
