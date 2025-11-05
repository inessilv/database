#!/bin/bash
# ============================================================================
# Database Initialization Script
# ============================================================================

set -e

DB_PATH="${DB_PATH:-/data/ltplabs.db}"
LOAD_SEED_DATA="${LOAD_SEED_DATA:-true}"

echo "========================================="
echo "Database Initialization"
echo "========================================="
echo "DB Path: $DB_PATH"
echo "Load Seed Data: $LOAD_SEED_DATA"
echo "========================================="

# Function to initialize database
init_database() {
    echo "Creating new database..."
    
    # Apply schema
    if [ -f "/scripts/schema.sql" ]; then
        echo "Applying schema..."
        sqlite3 "$DB_PATH" < /scripts/schema.sql
        echo "✓ Schema applied"
    else
        echo "ERROR: schema.sql not found!"
        exit 1
    fi
    
    # Load seed data if requested
    if [ "$LOAD_SEED_DATA" = "true" ] && [ -f "/scripts/seed_data.sql" ]; then
        echo "Loading seed data..."
        sqlite3 "$DB_PATH" < /scripts/seed_data.sql
        echo "✓ Seed data loaded"
    fi
}

# Check if database exists
if [ -f "$DB_PATH" ]; then
    echo "Database already exists at $DB_PATH"
    
    # Test if database is valid
    if sqlite3 "$DB_PATH" "SELECT 1" > /dev/null 2>&1; then
        echo "✓ Database is valid"
    else
        echo "Database is corrupted! Recreating..."
        rm "$DB_PATH"
        init_database
    fi
else
    init_database
fi

# Set proper permissions
chmod 644 "$DB_PATH"

# Enable WAL mode for better concurrency
echo "Configuring database for optimal performance..."
sqlite3 "$DB_PATH" "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA cache_size=-64000; PRAGMA temp_store=MEMORY;"

# Display database statistics
echo ""
echo "Database Statistics:"
echo "========================================="
sqlite3 "$DB_PATH" << 'EOF'
.mode line
SELECT 
    (SELECT COUNT(*) FROM admin) as total_admins,
    (SELECT COUNT(*) FROM cliente) as total_clients,
    (SELECT COUNT(*) FROM demo) as total_demos,
    (SELECT COUNT(*) FROM pedido) as total_requests,
    (SELECT COUNT(*) FROM log) as total_logs;
EOF
echo "========================================="
echo ""
echo "✓ Database is ready!"
echo ""
