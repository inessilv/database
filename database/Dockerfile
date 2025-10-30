# ============================================================================
# Dockerfile for LTP Labs SQLite Database
# ============================================================================
# This container provides a persistent SQLite database with health checks
# and initialization scripts
# ============================================================================

FROM alpine:3.19

# Install SQLite and utilities
RUN apk add --no-cache \
    sqlite \
    sqlite-libs \
    bash \
    curl \
    && rm -rf /var/cache/apk/*

# Create directories for database and scripts
RUN mkdir -p /data /scripts /backups

# Set working directory
WORKDIR /data

# Copy initialization scripts
COPY schema.sql /scripts/
COPY seed_data.sql /scripts/

# Copy initialization script
COPY init-db.sh /scripts/
RUN chmod +x /scripts/init-db.sh

# Copy health check script
COPY healthcheck.sh /scripts/
RUN chmod +x /scripts/healthcheck.sh

# Environment variables
ENV DB_PATH=/data/ltplabs.db
ENV BACKUP_PATH=/backups
ENV SQLITE_TIMEOUT=5000

# Expose a simple HTTP health endpoint (optional, via nc)
# SQLite doesn't have a port, but we can create a health endpoint
EXPOSE 8080

# Create volume mount point
VOLUME ["/data", "/backups"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD /scripts/healthcheck.sh

# Run the initialization script on startup
ENTRYPOINT ["/scripts/init-db.sh"]
