# LLM Integration - Quick Deployment Script (PowerShell)
# Usage: .\deploy.ps1 -Environment production
# Example: .\deploy.ps1 -Environment staging

param(
    [string]$Environment = "staging"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 LLM Integration Deployment Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Project: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Step 1: Verify dependencies
Write-Host "📦 Step 1: Verifying dependencies..." -ForegroundColor Cyan

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install Node.js." -ForegroundColor Red
    exit 1
}
Write-Host "✅ npm is installed" -ForegroundColor Green

# Step 2: Install/Update packages
Write-Host ""
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Cyan
npm install

# Step 3: Verify environment file
Write-Host ""
Write-Host "🔧 Step 3: Checking environment configuration..." -ForegroundColor Cyan

if (-not (Test-Path ".env.$Environment")) {
    Write-Host "⚠️  .env.$Environment not found" -ForegroundColor Yellow
    Write-Host "   Using .env.production as template..." -ForegroundColor Yellow
    if (-not (Test-Path ".env.production")) {
        Write-Host "❌ .env.production not found" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Environment file verified" -ForegroundColor Green

# Step 4: Verify all LLM services exist
Write-Host ""
Write-Host "🔍 Step 4: Verifying LLM services..." -ForegroundColor Cyan

$services = @(
    "services/llmIntegrationService.ts",
    "services/contextManagementService.ts",
    "services/activityAnalysisEngine.ts",
    "services/webContentRetrievalService.ts"
)

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "✅ $service" -ForegroundColor Green
    } else {
        Write-Host "❌ $service NOT FOUND" -ForegroundColor Red
        exit 1
    }
}

# Step 5: Verify components exist
Write-Host ""
Write-Host "🎨 Step 5: Verifying LLM components..." -ForegroundColor Cyan

$components = @(
    "components/EnhancedLLMChat.tsx",
    "components/ExtendedLLMDashboard.tsx"
)

foreach ($component in $components) {
    if (Test-Path $component) {
        Write-Host "✅ $component" -ForegroundColor Green
    } else {
        Write-Host "❌ $component NOT FOUND" -ForegroundColor Red
        exit 1
    }
}

# Step 6: Type check
Write-Host ""
Write-Host "🔎 Step 6: Running TypeScript type check..." -ForegroundColor Cyan
npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Type check passed" -ForegroundColor Green
} else {
    Write-Host "❌ Type check failed" -ForegroundColor Red
    exit 1
}

# Step 7: Build
Write-Host ""
Write-Host "🏗️  Step 7: Building application..." -ForegroundColor Cyan

if ($Environment -eq "production") {
    npm run build:production
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Production build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Production build failed" -ForegroundColor Red
        exit 1
    }
} elseif ($Environment -eq "preview") {
    npm run build:preview
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Preview build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Preview build failed" -ForegroundColor Red
        exit 1
    }
} else {
    npm run build:preview
    Write-Host "✅ Preview build successful" -ForegroundColor Green
}

# Step 8: Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT PREPARATION COMPLETE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan

if ($Environment -eq "production") {
    Write-Host "1. Review changes: git diff" -ForegroundColor White
    Write-Host "2. Commit: git add . && git commit -m 'Deploy LLM integration'" -ForegroundColor White
    Write-Host "3. Deploy: eas build --profile production --platform all" -ForegroundColor White
} else {
    Write-Host "1. Start dev server: npm start" -ForegroundColor White
    Write-Host "2. Test in emulator/device" -ForegroundColor White
    Write-Host "3. Deploy to staging: eas build --profile preview --platform all" -ForegroundColor White
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "- Full guide: docs/LLM_INTEGRATION_GUIDE.md" -ForegroundColor White
Write-Host "- Quick ref: docs/QUICK_REFERENCE.md" -ForegroundColor White
Write-Host "- Deployment: docs/PRODUCTION_DEPLOYMENT_READY.md" -ForegroundColor White
Write-Host ""
