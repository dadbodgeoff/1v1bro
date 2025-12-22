#!/bin/bash
# Mobile App Fork Script
# Creates a clean copy of the repo excluding 2D arena game engine files
# while KEEPING shared modules that other systems depend on
#
# Usage: ./scripts/create-mobile-fork.sh /path/to/new/mobile-app-repo
#
# What gets EXCLUDED (2D Arena Game Engine):
# - frontend/src/game/engine/ (2D game loop, player controller, render pipeline)
# - frontend/src/game/arena/ (2D arena manager, tilemap)
# - frontend/src/game/combat/ (2D combat system)
# - frontend/src/game/renderers/ (2D canvas renderers)
# - frontend/src/game/terrain/ (2D tile terrain)
# - frontend/src/game/visual/ (2D visual effects)
# - frontend/src/game/backdrop/ (2D backdrop system)
# - frontend/src/game/barriers/ (2D barriers)
# - frontend/src/game/hazards/ (2D hazards)
# - frontend/src/game/traps/ (2D traps)
# - frontend/src/game/zones/ (2D zones)
# - frontend/src/game/transport/ (2D transport)
# - frontend/src/game/interactive/ (2D interactive)
# - frontend/src/game/particles/ (2D particles)
# - frontend/src/game/props/ (2D props)
# - frontend/src/game/rendering/ (2D rendering layers)
# - frontend/src/game/themes/ (2D themes)
# - frontend/src/game/emotes/ (2D emotes)
# - frontend/src/game/telemetry/ (2D telemetry)
# - frontend/src/game/collision/ (2D collision)
# - frontend/src/game/GameEngine.ts (2D main engine)
# - frontend/src/components/game/ (2D game UI components)
# - 2D arena pages and hooks
#
# What gets KEPT (Shared modules used by other systems):
# - frontend/src/game/guest/ (Used by Register.tsx for session transfer)
# - frontend/src/game/types/ (Vector2, PowerUpState used everywhere)
# - frontend/src/game/config/ (Map configs used by matchmaking)
# - frontend/src/game/bot/ (Bot behavior - may be useful)
# - frontend/src/game/assets/ (DynamicAssetLoader used by useDynamicImage)
# - frontend/src/game/systems/PositionInterpolator.ts (Used by arena hooks)
# - frontend/src/game/index.ts (Re-exports types)

set -e

TARGET_DIR="${1:-../mobile-app}"

if [ -d "$TARGET_DIR" ]; then
    echo "Error: Target directory $TARGET_DIR already exists"
    echo "Please remove it or specify a different path"
    exit 1
fi

echo "Creating mobile app fork at: $TARGET_DIR"
echo ""

# Create target directory
mkdir -p "$TARGET_DIR"

# Use rsync to copy with exclusions
# NOTE: We exclude specific 2D engine folders but KEEP shared modules
rsync -av --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='.pytest_cache' \
    --exclude='.hypothesis' \
    --exclude='*.pyc' \
    --exclude='.DS_Store' \
    \
    --exclude='frontend/src/game/engine/' \
    --exclude='frontend/src/game/arena/' \
    --exclude='frontend/src/game/combat/' \
    --exclude='frontend/src/game/renderers/' \
    --exclude='frontend/src/game/terrain/' \
    --exclude='frontend/src/game/visual/' \
    --exclude='frontend/src/game/backdrop/' \
    --exclude='frontend/src/game/barriers/' \
    --exclude='frontend/src/game/hazards/' \
    --exclude='frontend/src/game/traps/' \
    --exclude='frontend/src/game/zones/' \
    --exclude='frontend/src/game/transport/' \
    --exclude='frontend/src/game/interactive/' \
    --exclude='frontend/src/game/particles/' \
    --exclude='frontend/src/game/props/' \
    --exclude='frontend/src/game/rendering/' \
    --exclude='frontend/src/game/themes/' \
    --exclude='frontend/src/game/emotes/' \
    --exclude='frontend/src/game/telemetry/' \
    --exclude='frontend/src/game/collision/' \
    --exclude='frontend/src/game/GameEngine.ts' \
    --exclude='frontend/src/game/__tests__/' \
    \
    --exclude='frontend/src/components/game/' \
    \
    --exclude='frontend/src/pages/Game.tsx' \
    --exclude='frontend/src/pages/ArenaGame.tsx' \
    --exclude='frontend/src/pages/BotGame.tsx' \
    --exclude='frontend/src/pages/CornfieldMapBuilder.tsx' \
    --exclude='frontend/src/pages/VolcanicLanding.tsx' \
    --exclude='frontend/src/pages/SimpleArenaTest.tsx' \
    \
    --exclude='frontend/src/hooks/useGame.ts' \
    --exclude='frontend/src/hooks/useBotGame.ts' \
    --exclude='frontend/src/hooks/useArenaGame.ts' \
    --exclude='frontend/src/hooks/useGameLoop.ts' \
    --exclude='frontend/src/hooks/useGameArenaCallbacks.ts' \
    --exclude='frontend/src/hooks/useArenaConfig.ts' \
    --exclude='frontend/src/hooks/useArenaCosmetics.ts' \
    --exclude='frontend/src/hooks/useArenaInput.ts' \
    \
    ./ "$TARGET_DIR/"

echo ""
echo "✅ Mobile fork created at: $TARGET_DIR"
echo ""
echo "SHARED MODULES KEPT (required by other systems):"
echo "  - frontend/src/game/guest/     → Used by Register.tsx (session transfer)"
echo "  - frontend/src/game/types/     → Vector2, PowerUpState types"
echo "  - frontend/src/game/config/    → Map configs for matchmaking"
echo "  - frontend/src/game/bot/       → Bot behavior configs"
echo "  - frontend/src/game/assets/    → DynamicAssetLoader"
echo "  - frontend/src/game/systems/   → PositionInterpolator"
echo ""
echo "Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. git init"
echo "3. git remote add origin <your-new-repo-url>"
echo "4. npm install"
echo "5. Update frontend/src/game/index.ts to remove 2D engine exports"
echo "6. Update App.tsx routes to remove 2D arena routes"
echo "7. git add . && git commit -m 'Initial mobile app fork'"
echo "8. git push -u origin main"
echo ""
echo "Files to update manually:"
echo "- frontend/src/App.tsx - Remove routes for /game, /arena-game, /bot-game"
echo "- frontend/src/pages/index.ts - Remove 2D game exports"
echo "- frontend/src/game/index.ts - Remove GameEngine export, keep types"
echo "- frontend/src/hooks/useInstantPlay.ts - May need updates (uses 2D game)"
echo "- frontend/src/components/matchmaking/MapSelector.tsx - Keep or update"
