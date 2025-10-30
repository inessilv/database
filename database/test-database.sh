#!/bin/bash
# ============================================================================
# Test Database Locally with Docker
# ============================================================================
# This script tests the database container locally before deploying
# ============================================================================

set -e
trap 'echo -e "\n${RED}Script terminated due to an error.${NC}"; read -p "Press ENTER to close..."' ERR


# Configuration
IMAGE_NAME="${IMAGE_NAME:-ltplabs/sqlite-database:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-ltplabs-db-test}"
DB_PATH="./test-data"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Testing Database Container Locally${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Clean up any existing test container
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Removing existing test container...${NC}"
    docker rm -f "$CONTAINER_NAME" > /dev/null 2>&1
fi

# Create test data directory
mkdir -p "$DB_PATH"

echo -e "${GREEN}Starting database container...${NC}"
docker run -d \
    --name "$CONTAINER_NAME" \
    -p 8080:8080 \
    -v "$(pwd)/$DB_PATH:/data" \
    -e LOAD_SEED_DATA=true \
    "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start container${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container started${NC}"
echo ""

# Wait for container to be ready
echo -e "${BLUE}Waiting for database to initialize...${NC}"
sleep 5

# Check container logs
echo ""
echo -e "${BLUE}Container logs:${NC}"
echo "─────────────────────────────────────────"
docker logs "$CONTAINER_NAME" --tail 30
echo "─────────────────────────────────────────"
echo ""

# Test database health
echo -e "${BLUE}Testing database health...${NC}"
MSYS_NO_PATHCONV=1 docker exec "$CONTAINER_NAME" /scripts/healthcheck.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Query database
echo -e "${BLUE}Testing database queries...${NC}"
echo ""

echo "1. Counting users:"
MSYS_NO_PATHCONV=1 docker exec "$CONTAINER_NAME" sqlite3 /data/ltplabs.db "SELECT COUNT(*) as admin_count FROM admin;"

echo ""
echo "2. Counting clients:"
MSYS_NO_PATHCONV=1 docker exec "$CONTAINER_NAME" sqlite3 /data/ltplabs.db "SELECT COUNT(*) as cliente_count FROM cliente;"

echo ""
echo "3. Counting demos:"
MSYS_NO_PATHCONV=1 docker exec "$CONTAINER_NAME" sqlite3 /data/ltplabs.db "SELECT COUNT(*) as demo_count FROM demo;"

echo ""
echo "4. Listing demo names:"
MSYS_NO_PATHCONV=1 docker exec "$CONTAINER_NAME" sqlite3 /data/ltplabs.db "SELECT nome FROM demo;" | head -5


# Test health endpoint
echo -e "${BLUE}Testing HTTP health endpoint...${NC}"
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ HTTP health endpoint responding${NC}"
else
    echo -e "${RED}✗ HTTP health endpoint not responding${NC}"
fi
echo ""

# Show database file info
echo -e "${BLUE}Database file information:${NC}"
echo "Location: $DB_PATH/ltplabs.db"
echo "Size: $(du -h $DB_PATH/ltplabs.db 2>/dev/null | cut -f1 || echo "N/A")"
echo ""

# Interactive menu
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Test complete!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "What would you like to do?"
echo "1) View more logs"
echo "2) Access SQLite shell"
echo "3) View database schema"
echo "4) Stop and remove container"
echo "5) Keep running and exit"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        docker logs "$CONTAINER_NAME" -f
        ;;
    2)
        echo ""
        echo -e "${YELLOW}Entering SQLite shell (type .exit to quit)${NC}"
        MSYS_NO_PATHCONV=1 docker exec -it "$CONTAINER_NAME" sqlite3 /data/ltplabs.db
        ;;
    3)
        echo ""
        MSYS_NO_PATHCONV=1 docker exec "$CONTAINER_NAME" sqlite3 /data/ltplabs.db ".schema"
        ;;
    4)
        echo ""
        echo -e "${YELLOW}Stopping and removing container...${NC}"
        docker rm -f "$CONTAINER_NAME"
        echo -e "${GREEN}✓ Container removed${NC}"
        ;;
    5)
        echo ""
        echo -e "${GREEN}Container is still running${NC}"
        echo "Container name: $CONTAINER_NAME"
        echo "Access shell: docker exec -it $CONTAINER_NAME /bin/sh"
        echo "View logs: docker logs $CONTAINER_NAME -f"
        echo "Stop: docker rm -f $CONTAINER_NAME"
        ;;
    *)
        echo "Invalid choice"
        ;;
esac

echo ""
echo -e "${BLUE}Test data saved in: $DB_PATH/${NC}"
