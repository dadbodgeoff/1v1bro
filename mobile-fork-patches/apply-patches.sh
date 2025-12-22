#!/bin/bash
# Apply patches to mobile fork
# Run this from the mobile-app directory: ../1v1bro/mobile-fork-patches/apply-patches.sh

set -e

echo "Applying mobile fork patches..."
echo ""

# 1. Update frontend/src/game/index.ts
echo "✓ Updating frontend/src/game/index.ts (remove GameEngine export)"
cp ../1v1bro/mobile-fork-patches/game-index.ts frontend/src/game/index.ts

echo ""
echo "✅ Patches applied successfully!"
echo ""
echo "Next manual steps:"
echo "1. Update frontend/src/App.tsx - Remove 2D arena routes"
echo "2. Update frontend/src/pages/index.ts - Remove 2D page exports"
echo "3. Review frontend/src/hooks/useInstantPlay.ts - Uses 2D game"
echo "4. Test build: npm run build"
echo "5. Commit changes: git add . && git commit -m 'Apply mobile fork patches'"
