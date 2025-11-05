#!/bin/bash
# ============================================================================
# Database Health Check Script
# ============================================================================

DB_PATH="${DB_PATH:-/data/ltplabs.db}"

# Check if database file exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database file not found at $DB_PATH"
    exit 1
fi

# Test if database is accessible
if ! sqlite3 "$DB_PATH" "SELECT 1" > /dev/null 2>&1; then
    echo "ERROR: Database query failed"
    exit 1
fi

# Check database integrity
if ! sqlite3 "$DB_PATH" "PRAGMA integrity_check" | grep -q "ok"; then
    echo "ERROR: Database integrity check failed"
    exit 1
fi

echo "OK: Database is healthy"
exit 0
