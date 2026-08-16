# =============================================================================
# NexusCart - Full Azure Deployment Script
# =============================================================================
# Deploys: Cosmos DB (MongoDB) + Container Apps Environment + 9 Container Apps
#
# Usage (from backend/ directory):
#   pwsh ./scripts/deploy-to-azure.ps1
#
# Prerequisites:
#   az login
#   Images already pushed to ACR (run scripts/build-push-all.ps1 first)
# =============================================================================

param(
    [string]$ResourceGroup  = "NexusCart-RG",
    [string]$Location       = "centralindia",
    [string]$Registry       = "nexuscartacr",
    [string]$Environment    = "nexuscart-env",
    [string]$CosmosAccount  = "nexuscart-db",
    [string]$Tag            = "latest"
)

$ErrorActionPreference = "Stop"
$ScriptRoot  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendRoot = Split-Path -Parent $ScriptRoot
$LoginServer = "$Registry.azurecr.io"

# Internal microservices (deployed with internal ingress)
$Microservices = @(
    @{ Name = "auth-service";          Port = 5001 },
    @{ Name = "business-service";      Port = 5002 },
    @{ Name = "product-service";       Port = 5003 },
    @{ Name = "admin-service";         Port = 5004 },
    @{ Name = "order-service";         Port = 5005 },
    @{ Name = "payment-service";       Port = 5006 },
    @{ Name = "notification-service";  Port = 5007 },
    @{ Name = "review-rating-service"; Port = 5008 }
)

# Detect how to invoke az without cmd.exe mangling arguments containing &
# (az.cmd re-parses args through cmd.exe, splitting values at '&').
# Calling the bundled python module directly bypasses cmd entirely.
$script:AzPython = $null
$azCmd = (Get-Command az -ErrorAction SilentlyContinue).Source
if ($azCmd) {
    $candidate = Join-Path (Split-Path (Split-Path $azCmd)) "python.exe"   # .../CLI2/python.exe
    if (Test-Path $candidate) {
        & $candidate -m azure.cli version *> $null
        if ($LASTEXITCODE -eq 0) { $script:AzPython = $candidate }
    }
}
if ($script:AzPython) {
    Write-Host "  az invocation: bundled python -m azure.cli (cmd-safe)" -ForegroundColor DarkGray
} else {
    Write-Host "  az invocation: az.cmd with metacharacter escaping" -ForegroundColor DarkGray
}

function Invoke-Az([string[]]$Arguments) {
    if ($script:AzPython) {
        $output = & $script:AzPython -m azure.cli @Arguments 2>&1
    } else {
        # Fallback: escape cmd metacharacters for az.cmd
        $escaped = $Arguments | ForEach-Object { $_ -replace '[&|<>^]', '^$&' }
        $output = & az @escaped 2>&1
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host ($output -join "`n") -ForegroundColor Red
        throw "az command failed: az $($Arguments[0..2] -join ' ') ..."
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " NexusCart Azure Deployment" -ForegroundColor Cyan
Write-Host " RG: $ResourceGroup | Region: $Location | ACR: $LoginServer" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# Step 0: Register required resource providers
# -----------------------------------------------------------------------------
Write-Host "`n[Step 0] Registering resource providers..." -ForegroundColor Yellow
foreach ($ns in @("Microsoft.DocumentDB", "Microsoft.App", "Microsoft.OperationalInsights")) {
    az provider register --namespace $ns 2>$null | Out-Null
}
foreach ($ns in @("Microsoft.DocumentDB", "Microsoft.App")) {
    $state = ""
    do {
        Start-Sleep 10
        $state = az provider show --namespace $ns --query registrationState -o tsv
        Write-Host "  $ns : $state"
    } while ($state -ne "Registered")
}

# -----------------------------------------------------------------------------
# Step 1: Cosmos DB for MongoDB
# -----------------------------------------------------------------------------
Write-Host "`n[Step 1] Creating Cosmos DB for MongoDB account '$CosmosAccount'..." -ForegroundColor Yellow
$existing = az cosmosdb show --name $CosmosAccount --resource-group $ResourceGroup --query name -o tsv 2>$null
if ($existing) {
    Write-Host "  Account already exists - reusing." -ForegroundColor Green
} else {
    Invoke-Az @("cosmosdb", "create",
        "--name", $CosmosAccount,
        "--resource-group", $ResourceGroup,
        "--kind", "MongoDB",
        "--locations", "regionName=$Location",
        "--default-consistency-level", "Session",
        "--only-show-errors")
    Write-Host "  Cosmos DB account created." -ForegroundColor Green
}

Write-Host "  Retrieving MongoDB connection string..." -ForegroundColor Yellow
$MongoUri = az cosmosdb keys list --name $CosmosAccount --resource-group $ResourceGroup --type connection-strings `
    --query "connectionStrings[0].connectionString" -o tsv
if (-not $MongoUri) { throw "Failed to retrieve MongoDB connection string" }
Write-Host "  Connection string retrieved (hidden)." -ForegroundColor Green

# -----------------------------------------------------------------------------
# Step 2: Secrets (JWT secret generated, optionally email creds from local .env)
# -----------------------------------------------------------------------------
Write-Host "`n[Step 2] Preparing secrets..." -ForegroundColor Yellow
$SubscriptionId = az account show --query id -o tsv
$JwtSecret = -join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
Write-Host "  JWT_SECRET generated (32 chars)." -ForegroundColor Green

$EmailUser = $null
$EmailPass = $null

$LocalEnvFile = Join-Path $BackendRoot ".env"
if (Test-Path $LocalEnvFile) {
    $envMap = @{}
    Get-Content $LocalEnvFile | ForEach-Object {
        if ($_ -match '^([A-Z_]+)=(.*)$') { $envMap[$Matches[1]] = $Matches[2].Trim('"') }
    }
    if ($envMap["EMAIL_USER"] -and $envMap["EMAIL_PASS"]) {
        $EmailUser = $envMap["EMAIL_USER"]
        $EmailPass = $envMap["EMAIL_PASS"]
        Write-Host "  EMAIL_USER/EMAIL_PASS imported from local .env." -ForegroundColor Green
    }
    if ($envMap["GOOGLE_CLIENT_ID"]) {
        $GoogleClientId = $envMap["GOOGLE_CLIENT_ID"]
        Write-Host "  GOOGLE_CLIENT_ID imported from local .env." -ForegroundColor Green
    }
}

# -----------------------------------------------------------------------------
# Step 3: Container Apps Environment
# -----------------------------------------------------------------------------
Write-Host "`n[Step 3] Creating Container Apps Environment '$Environment'..." -ForegroundColor Yellow
$envExists = az containerapp env show --name $Environment --resource-group $ResourceGroup --query name -o tsv 2>$null
if ($envExists) {
    Write-Host "  Environment already exists - reusing." -ForegroundColor Green
} else {
    Invoke-Az @("containerapp", "env", "create",
        "--name", $Environment,
        "--resource-group", $ResourceGroup,
        "--location", $Location,
        "--only-show-errors")
    Write-Host "  Environment created." -ForegroundColor Green
}

# ACR admin credentials for Container Apps image pulls
Write-Host "  Enabling ACR admin user and retrieving credentials..." -ForegroundColor Yellow
Invoke-Az @("acr", "update", "--name", $Registry, "--admin-enabled", "true", "--only-show-errors")
$AcrUser = $Registry
$AcrPass = az acr credential show --name $Registry --query "passwords[0].value" -o tsv
if (-not $AcrPass) { throw "Failed to retrieve ACR admin password" }

# -----------------------------------------------------------------------------
# Step 4: Deploy 8 internal microservices (YAML-based, avoids CLI arg parsing)
# -----------------------------------------------------------------------------
Write-Host "`n[Step 4] Deploying 8 internal microservices..." -ForegroundColor Yellow
$Results = @()

function Get-EnvYaml([array]$Envs, [int]$Indent) {
    $pad = ' ' * $Indent
    $lines = @()
    foreach ($e in $Envs) {
        $k = $e.Name; $v = $e.Value
        if ($v -match '^secretref:') {
            $lines += "$pad- name: $k"
            $lines += "$pad  secretRef: $($v.Substring(10))"
        } else {
            $lines += "$pad- name: $k"
            $lines += "$pad  value: `"$v`""
        }
    }
    return $lines
}

function Get-SecretsYaml([hashtable]$SecretMap, [int]$Indent) {
    $pad = ' ' * $Indent
    $lines = @()
    foreach ($k in $SecretMap.Keys) {
        $lines += "$pad- name: $k"
        $lines += "$pad  value: `"$($SecretMap[$k])`""
    }
    return $lines
}

function Deploy-ContainerApp([string]$Name, [string]$Image, [string]$Ingress, [int]$Port, [array]$Envs, [hashtable]$SecretMap) {
    # Registry password is always passed as a secret reference
    if (-not $SecretMap.ContainsKey("acr-password")) { $SecretMap["acr-password"] = $AcrPass }

    $envLines    = Get-EnvYaml $Envs 10
    $secretLines = Get-SecretsYaml $SecretMap 6
    $externalBool = if ($Ingress -eq 'external') { 'true' } else { 'false' }

    $yaml = @"
location: $Location
name: $Name
properties:
  managedEnvironmentId: /subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.App/managedEnvironments/$Environment
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: $externalBool
      targetPort: $Port
      transport: auto
    registries:
    - server: $LoginServer
      username: $AcrUser
      passwordSecretRef: acr-password
    secrets:
$($secretLines -join "`n")
  template:
    containers:
    - image: $Image
      name: $Name
      env:
$($envLines -join "`n")
      resources:
        cpu: 0.25
        memory: 0.5Gi
    scale:
      minReplicas: 1
      maxReplicas: 1
"@

    $yamlPath = Join-Path $env:TEMP "nexuscart-$Name.yaml"
    Set-Content -Path $yamlPath -Value $yaml -Encoding utf8

    $appExists = az containerapp show --name $Name --resource-group $ResourceGroup --query name -o tsv 2>$null
    if ($appExists) {
        # UPDATE via YAML (works reliably; also avoids az.cmd '&' mangling)
        Write-Host "     exists - updating via YAML" -ForegroundColor DarkGray
        Invoke-Az @("containerapp", "update", "--name", $Name,
            "--resource-group", $ResourceGroup, "--yaml", $yamlPath, "--only-show-errors")
    } else {
        # CREATE via CLI args ('az containerapp create --yaml' has a null-field
        # injection bug; '--env-vars'/'--secrets' are the create-time flags)
        $createArgs = @("containerapp", "create",
            "--name", $Name,
            "--resource-group", $ResourceGroup,
            "--environment", $Environment,
            "--image", $Image,
            "--registry-server", $LoginServer,
            "--registry-username", $AcrUser,
            "--registry-password", $AcrPass,
            "--ingress", $Ingress,
            "--target-port", "$Port",
            "--min-replicas", "1",
            "--max-replicas", "1",
            "--cpu", "0.25",
            "--memory", "0.5Gi",
            "--only-show-errors")
        $secretPairs = foreach ($k in $SecretMap.Keys) { "$k=$($SecretMap[$k])" }
        $createArgs += "--secrets"; $createArgs += $secretPairs
        $envPairs = foreach ($e in $Envs) { "$($e.Name)=$($e.Value)" }
        $createArgs += "--env-vars"; $createArgs += $envPairs
        Invoke-Az $createArgs
    }
    Remove-Item $yamlPath -ErrorAction SilentlyContinue
}

$SecretMap = @{ "mongodb-uri" = $MongoUri; "jwt-secret" = $JwtSecret }
if ($EmailUser) { $SecretMap["email-user"] = $EmailUser; $SecretMap["email-pass"] = $EmailPass }

foreach ($svc in $Microservices) {
    $name  = $svc.Name
    $port  = $svc.Port
    $image = "${LoginServer}/${name}:${Tag}"
    Write-Host "`n  -> $name (port $port)" -ForegroundColor Cyan

    $envs = @(
        @{ Name = "MONGODB_URI"; Value = "secretref:mongodb-uri" },
        @{ Name = "JWT_SECRET";  Value = "secretref:jwt-secret" },
        @{ Name = "PORT";        Value = "$port" }
    )
    if ($EmailUser) {
        $envs += @{ Name = "EMAIL_USER"; Value = "secretref:email-user" }
        $envs += @{ Name = "EMAIL_PASS"; Value = "secretref:email-pass" }
    }
    if ($GoogleClientId) {
        $envs += @{ Name = "GOOGLE_CLIENT_ID"; Value = "$GoogleClientId" }
    }

    try {
        Deploy-ContainerApp -Name $name -Image $image -Ingress "internal" -Port $port -Envs $envs -SecretMap $SecretMap
        $Results += [pscustomobject]@{ Service = $name; Port = $port; Ingress = "internal"; Status = "OK" }
        Write-Host "     OK" -ForegroundColor Green
    } catch {
        $Results += [pscustomobject]@{ Service = $name; Port = $port; Ingress = "internal"; Status = "FAILED" }
        Write-Host "     FAILED: $_" -ForegroundColor Red
    }
}

# -----------------------------------------------------------------------------
# Step 5: Deploy API Gateway (external ingress)
# -----------------------------------------------------------------------------
Write-Host "`n[Step 5] Deploying api-gateway (external ingress, port 5000)..." -ForegroundColor Yellow

# Within the same Container Apps environment, apps are reachable via http://<app-name>
$gatewayEnvs = @(
    @{ Name = "PORT";                     Value = "5000" },
    @{ Name = "AUTH_SERVICE_URL";         Value = "http://auth-service" },
    @{ Name = "BUSINESS_SERVICE_URL";     Value = "http://business-service" },
    @{ Name = "PRODUCT_SERVICE_URL";      Value = "http://product-service" },
    @{ Name = "ADMIN_SERVICE_URL";        Value = "http://admin-service" },
    @{ Name = "ORDER_SERVICE_URL";        Value = "http://order-service" },
    @{ Name = "PAYMENT_SERVICE_URL";      Value = "http://payment-service" },
    @{ Name = "NOTIFICATION_SERVICE_URL"; Value = "http://notification-service" },
    @{ Name = "REVIEW_SERVICE_URL";       Value = "http://review-rating-service" }
)

try {
    Deploy-ContainerApp -Name "api-gateway" -Image "${LoginServer}/api-gateway:$Tag" -Ingress "external" -Port 5000 -Envs $gatewayEnvs -SecretMap @{}
    $Results += [pscustomobject]@{ Service = "api-gateway"; Port = 5000; Ingress = "external"; Status = "OK" }
    Write-Host "  OK" -ForegroundColor Green
} catch {
    $Results += [pscustomobject]@{ Service = "api-gateway"; Port = 5000; Ingress = "external"; Status = "FAILED" }
    Write-Host "  FAILED: $_" -ForegroundColor Red
}

# -----------------------------------------------------------------------------
# Step 6: Summary
# -----------------------------------------------------------------------------
Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host " Deployment Summary" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
$Results | Format-Table -AutoSize

$GatewayFqdn = az containerapp show --name "api-gateway" --resource-group $ResourceGroup `
    --query "properties.configuration.ingress.fqdn" -o tsv 2>$null

if ($GatewayFqdn) {
    Write-Host "API Gateway public URL: https://$GatewayFqdn" -ForegroundColor Green
    Write-Host "Health check:           https://$GatewayFqdn/api/health" -ForegroundColor Green
} else {
    Write-Host "Could not resolve gateway FQDN - check 'az containerapp list -g $ResourceGroup'" -ForegroundColor Red
}

$FailedCount = ($Results | Where-Object { $_.Status -eq "FAILED" }).Count
if ($FailedCount -gt 0) { Write-Host "`n$FailedCount deployment(s) failed - review errors above." -ForegroundColor Red; exit 1 }
Write-Host "`nDeployment complete." -ForegroundColor Green
