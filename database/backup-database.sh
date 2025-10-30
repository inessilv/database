#!/bin/bash
# ============================================================================
# Database Backup Script
# ============================================================================
# This script creates backups of the SQLite database
# Can be run as a Kubernetes CronJob or manually
# ============================================================================

set -e

# Configuration
NAMESPACE="${NAMESPACE:-default}"
POD_LABEL="${POD_LABEL:-app=ltplabs-database}"
DB_PATH="${DB_PATH:-/data/ltplabs.db}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ltplabs_db_backup_${TIMESTAMP}.db"
KEEP_DAYS="${KEEP_DAYS:-7}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}LTP Labs Database Backup${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Get pod name
echo -e "${BLUE}Finding database pod...${NC}"
POD_NAME=$(kubectl get pods -l "$POD_LABEL" -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo -e "${RED}✗ Database pod not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found pod: $POD_NAME${NC}"
echo ""

# Create backup using SQLite's backup command
echo -e "${BLUE}Creating backup...${NC}"
kubectl exec "$POD_NAME" -n "$NAMESPACE" -- sqlite3 "$DB_PATH" ".backup /tmp/backup.db"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to create backup${NC}"
    exit 1
fi

# Copy backup from pod to local
echo -e "${BLUE}Downloading backup...${NC}"
kubectl cp "$NAMESPACE/$POD_NAME:/tmp/backup.db" "$BACKUP_DIR/$BACKUP_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to download backup${NC}"
    exit 1
fi

# Clean up temporary backup in pod
kubectl exec "$POD_NAME" -n "$NAMESPACE" -- rm /tmp/backup.db

# Verify backup
echo -e "${BLUE}Verifying backup...${NC}"
if sqlite3 "$BACKUP_DIR/$BACKUP_NAME" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo -e "${GREEN}✓ Backup verification passed${NC}"
else
    echo -e "${RED}✗ Backup verification failed${NC}"
    exit 1
fi

# Compress backup
echo -e "${BLUE}Compressing backup...${NC}"
gzip "$BACKUP_DIR/$BACKUP_NAME"
BACKUP_NAME="${BACKUP_NAME}.gz"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)

echo -e "${GREEN}✓ Backup created successfully${NC}"
echo ""
echo "Backup details:"
echo "  File: $BACKUP_DIR/$BACKUP_NAME"
echo "  Size: $BACKUP_SIZE"
echo "  Date: $(date)"
echo ""

# Clean up old backups
echo -e "${BLUE}Cleaning up old backups (older than $KEEP_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "ltplabs_db_backup_*.db.gz" -type f -mtime +$KEEP_DAYS -delete
OLD_COUNT=$(find "$BACKUP_DIR" -name "ltplabs_db_backup_*.db.gz" -type f | wc -l)
echo -e "${GREEN}✓ Cleanup complete (${OLD_COUNT} backups remaining)${NC}"
echo ""

# List recent backups
echo -e "${BLUE}Recent backups:${NC}"
ls -lh "$BACKUP_DIR"/ltplabs_db_backup_*.db.gz 2>/dev/null | tail -5 || echo "No backups found"
echo ""

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Backup complete!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "To restore this backup:"
echo "  1. Extract: gunzip $BACKUP_DIR/$BACKUP_NAME"
echo "  2. Copy to pod: kubectl cp $BACKUP_DIR/\${BACKUP_NAME%.gz} $NAMESPACE/$POD_NAME:/tmp/restore.db"
echo "  3. Restore: kubectl exec $POD_NAME -n $NAMESPACE -- sqlite3 $DB_PATH \".restore /tmp/restore.db\""
