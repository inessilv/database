#!/bin/bash
# ============================================================================
# Database Initialization Script
# ============================================================================
# This script initializes the SQLite database if it doesn't exist
# and keeps the container running
# ============================================================================

set -e

DB_PATH=${DB_PATH:-/data/ltplabs.db}
SCHEMA_FILE="/scripts/schema.sql"
SEED_FILE="/scripts/seed_data.sql"
INIT_FLAG="/data/.initialized"

echo "========================================="
echo "LTP Labs Database Initialization"
echo "========================================="
echo "Database path: $DB_PATH"
echo "Current time: $(date)"
echo ""

# Function to initialize database
init_database() {
    echo "Initializing new database..."
    
    # Create the database and apply schema
    if [ -f "$SCHEMA_FILE" ]; then
        echo "Applying schema from $SCHEMA_FILE..."
        sqlite3 "$DB_PATH" < "$SCHEMA_FILE"
        echo "✓ Schema applied successfully"
    else
        echo "✗ Schema file not found: $SCHEMA_FILE"
        exit 1
    fi
    
    # Apply seed data if in development mode
    if [ "${LOAD_SEED_DATA:-true}" = "true" ]; then
        if [ -f "$SEED_FILE" ]; then
            echo "Loading seed data from $SEED_FILE..."
            sqlite3 "$DB_PATH" < "$SEED_FILE"
            echo "✓ Seed data loaded successfully"
        else
            echo "⚠ Seed data file not found: $SEED_FILE (skipping)"
        fi
    fi
    
    # Mark as initialized
    touch "$INIT_FLAG"
    echo "✓ Database initialization complete"
}

# Check if database already exists
if [ -f "$DB_PATH" ] && [ -f "$INIT_FLAG" ]; then
    echo "Database already exists and is initialized"
    echo "Database file size: $(du -h $DB_PATH | cut -f1)"
    
    # Verify database integrity
    echo "Verifying database integrity..."
    if sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        echo "✓ Database integrity check passed"
    else
        echo "✗ Database integrity check failed!"
        exit 1
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

# Start a simple HTTP health check server on port 8080
# This allows Kubernetes to do HTTP health checks
echo "Starting health check server on port 8080..."
while true; do
    echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK" | nc -l -p 8080 2>/dev/null || true
done &

HEALTH_PID=$!

# Cleanup function
cleanup() {
    echo "Shutting down..."
    kill $HEALTH_PID 2>/dev/null || true
    
    # Checkpoint WAL file before shutdown
    echo "Checkpointing WAL file..."
    sqlite3 "$DB_PATH" "PRAGMA wal_checkpoint(TRUNCATE);"
    
    echo "Shutdown complete"
    exit 0
}

trap cleanup SIGTERM SIGINT

echo ""
echo "========================================="
echo "Database is ready and running"
echo "Waiting for connections..."
echo "Press Ctrl+C to stop"
echo "========================================="

# Keep container running and handle signals
while true; do
    sleep 3600 &
    wait $!
done
