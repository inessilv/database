#!/bin/bash
# ============================================================================
# Build Database Docker Image
# ============================================================================
# This script builds the SQLite database Docker image
# ============================================================================

set -e

# Configuration
IMAGE_NAME="${IMAGE_NAME:-ltplabs/sqlite-database}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-}"  # Set your registry URL if using one

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Building LTP Labs Database Docker Image${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}Error: Dockerfile not found in current directory${NC}"
    exit 1
fi

# Check if required files exist
required_files=("schema.sql" "seed_data.sql" "init-db.sh" "healthcheck.sh")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Required file not found: $file${NC}"
        exit 1
    fi
done

# Build the image
echo -e "${GREEN}Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
    echo ""
    echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
    echo "Size: $(docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "{{.Size}}")"
else
    echo -e "${RED}✗ Failed to build Docker image${NC}"
    exit 1
fi

# Tag for registry if specified
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    echo -e "${GREEN}Tagging image for registry: ${FULL_IMAGE}${NC}"
    docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${FULL_IMAGE}"
    
    # Ask if user wants to push
    read -p "Do you want to push to registry? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Pushing to registry...${NC}"
        docker push "${FULL_IMAGE}"
        echo -e "${GREEN}✓ Image pushed successfully${NC}"
    fi
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Build complete!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test the image locally: ./test-database.sh"
echo "2. Deploy to Kubernetes: ./deploy-database.sh"
