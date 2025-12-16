# 1v1Bro Mobile App Setup Guide

This guide walks through setting up the mobile app repo with Capacitor for iOS and Android.

## Why Separate Repos?

- **Web (this repo):** Uses Stripe for payments
- **Mobile (new repo):** Must use Apple IAP / Google Play Billing (App Store rules)
- Different build pipelines, review cycles, and dependencies

## Step 1: Create the Mobile Repo

```bash
# From your projects directory (not inside 1v1bro)
cd ~/Projects  # or wherever you keep repos

# Create new repo
mkdir 1v1bro-mobile
cd 1v1bro-mobile
git init

# Copy frontend from web repo (excluding node_modules)
cp -r ../1v1bro/frontend ./
rm -rf frontend/node_modules frontend/dist frontend/.vite

# Copy shared assets
cp -r ../1v1bro/*.glb ./assets/  # 3D models
cp ../1v1bro/.env.example ./.env.example
```

## Step 2: Install Capacitor

```bash
cd frontend

# Install Capacitor core
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init "1v1Bro" "com.1v1bro.app" --web-dir dist

# Add platforms
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# Install useful plugins
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen
```

## Step 3: Install In-App Purchase Plugin

```bash
# For Apple IAP and Google Play Billing
npm install cordova-plugin-purchase
npm install @awesome-cordova-plugins/in-app-purchase-2

# Or use the Capacitor community plugin
npm install @capgo/capacitor-purchases
```

## Step 4: Remove Stripe Dependencies

```bash
# Remove Stripe from package.json
npm uninstall @stripe/stripe-js @stripe/react-stripe-js

# Delete Stripe-related files
rm -rf src/components/payments/Stripe*
rm -rf src/hooks/useStripe*
```

## Step 5: Create Payment Abstraction

Create `src/services/PaymentService.ts`:

```typescript
// Platform-agnostic payment interface
// Web uses Stripe, Mobile uses IAP

import { Capacitor } from '@capacitor/core'

export interface Product {
  id: string
  title: string
  price: string
  priceAmount: number
  currency: string
}

export interface PurchaseResult {
  success: boolean
  transactionId?: string
  receipt?: string
  error?: string
}

class PaymentService {
  private isNative = Capacitor.isNativePlatform()

  async getProducts(productIds: string[]): Promise<Product[]> {
    if (this.isNative) {
      return this.getNativeProducts(productIds)
    }
    // Web fallback - shouldn't happen in mobile app
    throw new Error('Stripe not available in mobile app')
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    if (this.isNative) {
      return this.nativePurchase(productId)
    }
    throw new Error('Stripe not available in mobile app')
  }

  private async getNativeProducts(productIds: string[]): Promise<Product[]> {
    // Implementation depends on which IAP plugin you use
    // This is a placeholder
    const { Purchases } = await import('@capgo/capacitor-purchases')
    const offerings = await Purchases.getOfferings()
    // Map to your Product interface
    return []
  }

  private async nativePurchase(productId: string): Promise<PurchaseResult> {
    const { Purchases } = await import('@capgo/capacitor-purchases')
    try {
      const result = await Purchases.purchaseProduct({ productIdentifier: productId })
      return {
        success: true,
        transactionId: result.customerInfo.originalAppUserId,
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
      }
    }
  }

  async restorePurchases(): Promise<void> {
    if (this.isNative) {
      const { Purchases } = await import('@capgo/capacitor-purchases')
      await Purchases.restorePurchases()
    }
  }
}

export const paymentService = new PaymentService()
```

## Step 6: Update Environment Variables

Create `.env` for mobile:

```env
# API - same backend as web
VITE_API_URL=https://api.1v1bro.online

# Platform identifier
VITE_PLATFORM=mobile

# RevenueCat (recommended IAP service)
VITE_REVENUECAT_API_KEY_IOS=your_ios_key
VITE_REVENUECAT_API_KEY_ANDROID=your_android_key
```

## Step 7: Capacitor Configuration

`capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.1v1bro.app',
  appName: '1v1Bro',
  webDir: 'dist',
  server: {
    // For development - remove in production
    // url: 'http://localhost:5173',
    // cleartext: true,
  },
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
```

## Step 8: Build and Sync

```bash
# Build the web app
npm run build

# Sync to native projects
npx cap sync

# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio
npx cap open android
```

## Step 9: iOS Setup (Xcode)

1. Open `ios/App/App.xcworkspace` in Xcode
2. Set your Team in Signing & Capabilities
3. Add "In-App Purchase" capability
4. Configure App Store Connect:
   - Create your app
   - Set up In-App Purchases (consumables for coins, etc.)
   - Create a Sandbox tester account

## Step 10: Android Setup (Android Studio)

1. Open `android/` folder in Android Studio
2. Update `app/build.gradle` with your signing config
3. Configure Google Play Console:
   - Create your app
   - Set up In-App Products
   - Upload AAB for internal testing

## Backend Changes Needed

Your backend needs to verify IAP receipts. Add these endpoints:

```python
# backend/app/api/v1/iap.py

@router.post("/verify/apple")
async def verify_apple_receipt(receipt: str, user: CurrentUser):
    """Verify Apple App Store receipt"""
    # Call Apple's verifyReceipt endpoint
    # Grant coins/items to user
    pass

@router.post("/verify/google")
async def verify_google_receipt(purchase_token: str, product_id: str, user: CurrentUser):
    """Verify Google Play purchase"""
    # Use Google Play Developer API
    # Grant coins/items to user
    pass
```

## Development Workflow

1. **Develop on web** (fast hot reload)
2. **Test on simulator:**
   ```bash
   npm run build && npx cap sync
   npx cap run ios  # or android
   ```
3. **Test on device:**
   - Connect device
   - `npx cap run ios --device` or `npx cap run android --device`

## Files to Delete from Mobile Repo

- `backend/` - Keep using the same backend
- `docker-compose*.yml` - Not needed
- `Makefile` - Create mobile-specific one
- All Stripe-related frontend code

## Files to Keep/Modify

- `frontend/src/` - Most game code stays the same
- `frontend/src/services/` - Replace Stripe with IAP
- `frontend/src/components/shop/` - Update to use PaymentService

## Recommended: Use RevenueCat

RevenueCat simplifies IAP significantly:
- Handles Apple/Google receipt validation
- Provides webhooks for your backend
- Cross-platform subscription management
- Great dashboard for analytics

```bash
npm install @capgo/capacitor-purchases
```

Then configure in your app initialization.

---

## Quick Reference Commands

```bash
# Build and sync
npm run build && npx cap sync

# Run on iOS simulator
npx cap run ios

# Run on Android emulator
npx cap run android

# Open native IDEs
npx cap open ios
npx cap open android

# Update native plugins
npx cap update

# Check for issues
npx cap doctor
```
