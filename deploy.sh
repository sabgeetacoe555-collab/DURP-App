#!/bin/bash
# LLM Integration - Quick Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

ENVIRONMENT=${1:-staging}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "🚀 LLM Integration Deployment Script"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_DIR"
echo ""

# Step 1: Verify dependencies
echo "📦 Step 1: Verifying dependencies..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js."
    exit 1
fi
echo "✅ npm is installed"

# Step 2: Install/Update packages
echo ""
echo "📦 Step 2: Installing dependencies..."
cd "$PROJECT_DIR"
npm install

# Step 3: Verify environment file
echo ""
echo "🔧 Step 3: Checking environment configuration..."
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo "⚠️  .env.$ENVIRONMENT not found"
    echo "   Using .env.production as template..."
    if [ ! -f ".env.production" ]; then
        echo "❌ .env.production not found"
        exit 1
    fi
fi
echo "✅ Environment file verified"

# Step 4: Verify all LLM services exist
echo ""
echo "🔍 Step 4: Verifying LLM services..."
SERVICES=(
    "services/llmIntegrationService.ts"
    "services/contextManagementService.ts"
    "services/activityAnalysisEngine.ts"
    "services/webContentRetrievalService.ts"
)

for service in "${SERVICES[@]}"; do
    if [ -f "$service" ]; then
        echo "✅ $service"
    else
        echo "❌ $service NOT FOUND"
        exit 1
    fi
done

# Step 5: Verify components exist
echo ""
echo "🎨 Step 5: Verifying LLM components..."
COMPONENTS=(
    "components/EnhancedLLMChat.tsx"
    "components/ExtendedLLMDashboard.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        echo "✅ $component"
    else
        echo "❌ $component NOT FOUND"
        exit 1
    fi
done

# Step 6: Type check
echo ""
echo "🔎 Step 6: Running TypeScript type check..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ Type check passed"
else
    echo "❌ Type check failed"
    exit 1
fi

# Step 7: Build
echo ""
echo "🏗️  Step 7: Building application..."
if [ "$ENVIRONMENT" = "production" ]; then
    npm run build:production
    if [ $? -eq 0 ]; then
        echo "✅ Production build successful"
    else
        echo "❌ Production build failed"
        exit 1
    fi
elif [ "$ENVIRONMENT" = "preview" ]; then
    npm run build:preview
    if [ $? -eq 0 ]; then
        echo "✅ Preview build successful"
    else
        echo "❌ Preview build failed"
        exit 1
    fi
else
    npm run build:preview
    echo "✅ Preview build successful"
fi

# Step 8: Summary
echo ""
echo "========================================="
echo "✅ DEPLOYMENT PREPARATION COMPLETE"
echo "========================================="
echo ""
echo "Next steps:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "1. Review changes: git diff"
    echo "2. Commit: git add . && git commit -m 'Deploy LLM integration'"
    echo "3. Deploy: eas build --profile production --platform all"
else
    echo "1. Start dev server: npm start"
    echo "2. Test in emulator/device"
    echo "3. Deploy to staging: eas build --profile preview --platform all"
fi
echo ""
echo "Documentation:"
echo "- Full guide: docs/LLM_INTEGRATION_GUIDE.md"
echo "- Quick ref: docs/QUICK_REFERENCE.md"
echo "- Deployment: docs/PRODUCTION_DEPLOYMENT_READY.md"
echo ""
