#!/bin/bash

# 1v1Bro Mobile Repo Setup Script
# Run this from the PARENT directory of your 1v1bro repo
# Usage: cd ~/Projects && bash 1v1bro/scripts/setup-mobile-repo.sh

set -e

echo "🚀 Setting up 1v1Bro Mobile Repository"
echo "======================================="

# Check we're in the right place
if [ ! -d "1v1bro" ]; then
    echo "❌ Error: Run this from the parent directory of 1v1bro"
    echo "   cd ~/Projects && bash 1v1bro/scripts/setup-mobile-repo.sh"
    exit 1
fi

# Create mobile repo directory
if [ -d "1v1bro-mobile" ]; then
    echo "⚠️  1v1bro-mobile already exists. Remove it first if you want to start fresh."
    exit 1
fi

echo "📁 Creating 1v1bro-mobile directory..."
mkdir 1v1bro-mobile
cd 1v1bro-mobile

# Initialize git
echo "🔧 Initializing git..."
git init

# Copy frontend (excluding build artifacts)
echo "📋 Copying frontend code..."
mkdir -p frontend
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.vite' --exclude='ios' --exclude='android' ../1v1bro/frontend/ ./frontend/

# Create assets directory and copy 3D models
echo "🎮 Copying game assets..."
mkdir -p assets/models
cp ../1v1bro/*.glb ./assets/models/ 2>/dev/null || echo "   (No .glb files in root)"

# Copy docs
echo "📚 Copying documentation..."
mkdir -p docs
cp ../1v1bro/docs/MOBILE_APP_SETUP.md ./docs/ 2>/dev/null || true

# Create mobile-specific .env.example
echo "⚙️  Creating environment config..."
cat > .env.example << 'EOF'
# API Configuration (same backend as web)
VITE_API_URL=https://api.1v1bro.online

# Platform identifier
VITE_PLATFORM=mobile

# RevenueCat API Keys (for In-App Purchases)
VITE_REVENUECAT_API_KEY_IOS=
VITE_REVENUECAT_API_KEY_ANDROID=

# App identifiers
VITE_IOS_BUNDLE_ID=com.1v1bro.app
VITE_ANDROID_PACKAGE=com.1v1bro.app
EOF

cp .env.example .env

# Create mobile-specific .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
*.local

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Capacitor native projects (optional - some teams commit these)
# ios/
# android/

# Capacitor build artifacts
ios/App/App/public/
android/app/src/main/assets/public/

# Logs
*.log
npm-debug.log*

# Testing
coverage/

# Misc
*.tgz
EOF

# Create README
echo "📖 Creating README..."
cat > README.md << 'EOF'
# 1v1Bro Mobile App

Mobile app version of 1v1Bro built with Capacitor for iOS and Android.

## Setup

```bash
cd frontend
npm install
npm run build
npx cap sync
```

## Development

```bash
# Run on iOS simulator
npx cap run ios

# Run on Android emulator  
npx cap run android

# Open in native IDE
npx cap open ios
npx cap open android
```

## Key Differences from Web

- Uses Apple IAP / Google Play Billing instead of Stripe
- Same backend API
- Native push notifications
- App Store / Play Store distribution

## Documentation

See `docs/MOBILE_APP_SETUP.md` for detailed setup instructions.
EOF

# Create Capacitor config
echo "⚡ Creating Capacitor config..."
cat > frontend/capacitor.config.ts << 'EOF'
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.1v1bro.app',
  appName: '1v1Bro',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#09090b',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#09090b',
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#09090b',
  },
}

export default config
EOF

echo ""
echo "✅ Mobile repo created successfully!"
echo ""
echo "Next steps:"
echo "==========="
echo ""
echo "1. cd 1v1bro-mobile/frontend"
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Install Capacitor:"
echo "   npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android"
echo "   npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen"
echo ""
echo "4. Add platforms:"
echo "   npx cap add ios"
echo "   npx cap add android"
echo ""
echo "5. Remove Stripe (if present):"
echo "   npm uninstall @stripe/stripe-js @stripe/react-stripe-js"
echo ""
echo "6. Install IAP plugin (RevenueCat recommended):"
echo "   npm install @capgo/capacitor-purchases"
echo ""
echo "7. Build and sync:"
echo "   npm run build"
echo "   npx cap sync"
echo ""
echo "8. Create GitHub repo and push:"
echo "   git add -A"
echo "   git commit -m 'Initial mobile app setup'"
echo "   gh repo create 1v1bro-mobile --private --source=. --push"
echo ""
echo "📚 See docs/MOBILE_APP_SETUP.md for detailed instructions"
