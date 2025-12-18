#!/bin/bash
# Compress GLB animations with gltf-transform and upload to Supabase storage

set -e

# Load environment variables
source .env

# Configuration
INPUT_DIR=".kiro/specs/arena-3d-physics-multiplayer/Meshy_AI_biped"
OUTPUT_DIR="meshy-compressed"
BUCKET="arena-assets"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== GLB Animation Compression & Upload ===${NC}"
echo ""

# Check for required tools
if ! command -v gltf-transform &> /dev/null; then
    echo -e "${RED}Error: gltf-transform not found. Install with: npm install -g @gltf-transform/cli${NC}"
    exit 1
fi

# Check for Supabase credentials
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Step 1: Compressing GLB files with Draco...${NC}"
echo ""

# Track sizes for summary
declare -A original_sizes
declare -A compressed_sizes

for file in "$INPUT_DIR"/*.glb; do
    filename=$(basename "$file")
    # Create cleaner output name (remove Meshy_AI_Animation_ prefix and _withSkin suffix)
    clean_name=$(echo "$filename" | sed 's/Meshy_AI_Animation_//' | sed 's/_withSkin//' | sed 's/_inplace//')
    output_file="$OUTPUT_DIR/$clean_name"
    
    # Get original size
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    original_sizes["$filename"]=$original_size
    
    echo -n "  Compressing $filename... "
    
    # Compress with meshopt + webp textures at 1024px max
    gltf-transform optimize "$file" "$output_file" \
        --compress meshopt \
        --texture-compress webp \
        --texture-size 1024 \
        2>/dev/null
    
    # Get compressed size
    compressed_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file")
    compressed_sizes["$clean_name"]=$compressed_size
    
    # Calculate reduction
    reduction=$(echo "scale=1; (1 - $compressed_size / $original_size) * 100" | bc)
    
    echo -e "${GREEN}Done${NC} ($(numfmt --to=iec $original_size) → $(numfmt --to=iec $compressed_size), -${reduction}%)"
done

echo ""
echo -e "${YELLOW}Step 2: Uploading to Supabase Storage (bucket: $BUCKET)...${NC}"
echo ""

# Upload each compressed file
for file in "$OUTPUT_DIR"/*.glb; do
    filename=$(basename "$file")
    
    echo -n "  Uploading $filename... "
    
    # Upload using curl to Supabase Storage API
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/storage/v1/object/${BUCKET}/animations/${filename}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: model/gltf-binary" \
        -H "x-upsert: true" \
        --data-binary "@$file")
    
    # Check if upload succeeded
    if echo "$response" | grep -q '"error"'; then
        echo -e "${RED}Failed${NC}"
        echo "    Error: $response"
    else
        echo -e "${GREEN}Done${NC}"
    fi
done

echo ""
echo -e "${YELLOW}=== Summary ===${NC}"
echo ""

# Calculate totals
total_original=0
total_compressed=0

for size in "${original_sizes[@]}"; do
    total_original=$((total_original + size))
done

for size in "${compressed_sizes[@]}"; do
    total_compressed=$((total_compressed + size))
done

total_reduction=$(echo "scale=1; (1 - $total_compressed / $total_original) * 100" | bc)

echo "  Files processed: ${#original_sizes[@]}"
echo "  Original total:  $(numfmt --to=iec $total_original)"
echo "  Compressed total: $(numfmt --to=iec $total_compressed)"
echo "  Total reduction: ${total_reduction}%"
echo ""
echo -e "${GREEN}Files available at:${NC}"
echo "  ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/animations/"
echo ""
