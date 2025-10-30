#!/bin/bash
# ============================================================================
# Database Health Check Script
# ============================================================================
# This script verifies the database is accessible and operational
# ============================================================================

DB_PATH=${DB_PATH:-/data/ltplabs.db}

# Check if database file exists
if [ ! -f "$DB_PATH" ]; then
    echo "UNHEALTHY: Database file not found: $DB_PATH"
    exit 1
fi

# Check if database is accessible and can execute queries
if ! sqlite3 "$DB_PATH" "SELECT 1;" > /dev/null 2>&1; then
    echo "UNHEALTHY: Cannot execute queries on database"
    exit 1
fi

# Check database integrity
if ! sqlite3 "$DB_PATH" "PRAGMA quick_check;" | grep -q "ok"; then
    echo "UNHEALTHY: Database integrity check failed"
    exit 1
fi

# All checks passed
echo "HEALTHY: Database is operational"
exit 0
