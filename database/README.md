# LTP Labs E-Catalog Database - Complete Development Roadmap

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Complete Roadmap](#complete-roadmap)
5. [Quick Start](#quick-start)
6. [Deployment](#deployment)
7. [API Gateway Integration](#api-gateway-integration)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This is the complete database solution for the LTP Labs E-Catalog project, a containerized demo catalog platform running on Kubernetes with SQLite as the backend database.

### Key Features
- ✅ SQLite database with WAL mode for better concurrency
- ✅ Docker containerization
- ✅ Kubernetes deployment with persistent storage
- ✅ Complete schema supporting all 8 use cases
- ✅ Seed data for development and testing
- ✅ Automated backup scripts
- ✅ Health monitoring
- ✅ API Gateway integration guide

### Use Cases Supported
1. **UC1**: User Authentication
2. **UC2**: Add Demo to Catalog
3. **UC3**: Open Demo
4. **UC4**: Revoke Client Access
5. **UC5**: Create Client
6. **UC6**: View Client Usage Analytics
7. **UC7**: Renew Client Access
8. **UC8**: Remove Demo from Catalog

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────┐
│         Kubernetes Cluster                      │
│                                                 │
│  ┌──────────────┐      ┌──────────────┐       │
│  │ API Gateway  │──────│  Database    │       │
│  │    Pod       │      │     Pod      │       │
│  │              │      │              │       │
│  │ - Mounts PVC │      │ - SQLite     │       │
│  │ - R/W Access │      │ - Init       │       │
│  └──────────────┘      └──────────────┘       │
│         │                     │                │
│         └─────────┬───────────┘                │
│                   │                            │
│           ┌───────▼────────┐                   │
│           │ PersistentVol  │                   │
│           │   (sqlite-pvc) │                   │
│           └────────────────┘                   │
│                   │                            │
│           ┌───────▼────────┐                   │
│           │  Host Storage  │                   │
│           │ /mnt/data/...  │                   │
│           └────────────────┘                   │
└─────────────────────────────────────────────────┘
```

### Database Access Pattern
- **API Gateway**: Read/Write access to database file
- **Other Services**: Communicate through API Gateway (HTTP/gRPC)
- **No Direct DB Access**: Other services don't access database directly

### Why This Architecture?
- ✅ SQLite works well with single-writer pattern
- ✅ API Gateway acts as the single writer
- ✅ Other services remain stateless
- ✅ Easy to scale horizontally (except API Gateway)

---

## 📊 Database Schema

### Core Tables

#### 1. **users** - Administrators
- Stores admin user accounts
- Fields: email, password_hash, full_name, role

#### 2. **clients** - External Users
- Time-limited demo access accounts
- Fields: name, email, company, access_start_date, access_end_date

#### 3. **demos** - Catalog Entries
- Demo applications in the catalog
- Fields: name, description, docker_image_id, demo_url, status

#### 4. **docker_images** - Container Images
- Available Docker images for demos
- Fields: image_name, image_tag, registry_url

#### 5. **client_demo_access** - Access Control
- Controls which clients can access which demos
- Many-to-many relationship

#### 6. **usage_analytics** - Tracking
- Logs user interactions with demos
- Fields: client_id, demo_id, event_type, timestamp

#### 7. **access_requests** - Notifications
- Renewal and revocation requests
- Fields: client_id, request_type, status

#### 8. **sessions** - Authentication
- Active user sessions (JWT tokens)
- Fields: user_id/client_id, token_hash, expires_at

### Useful Views
- `v_active_clients` - Active clients with access status
- `v_active_demos` - Available demos with metadata
- `v_pending_requests` - Pending renewal/revocation requests
- `v_client_usage_stats` - Per-client usage statistics

---

## 🗺️ Complete Roadmap

### **Phase 1: Database Design & Setup** (✅ Completed)
**Duration**: 1-3 days

**Deliverables**:
- ✅ Complete schema design (`schema.sql`)
- ✅ Seed data for testing (`seed_data.sql`)
- ✅ Database initialization scripts

**Files Created**:
- `schema.sql` - Complete database schema with all tables, indexes, triggers
- `seed_data.sql` - Sample data for development
- `init-db.sh` - Database initialization script
- `healthcheck.sh` - Health monitoring script

---

### **Phase 2: Docker Containerization** (✅ Completed)
**Duration**: 1-2 days

**Deliverables**:
- ✅ Dockerfile for SQLite container
- ✅ Health check mechanisms
- ✅ Initialization automation

**Files Created**:
- `Dockerfile` - Container definition
- Build scripts for easy image creation

**What to do**:
```bash
# Build the Docker image
chmod +x build-database.sh
./build-database.sh

# Test locally
chmod +x test-database.sh
./test-database.sh
```

---

### **Phase 3: Kubernetes Deployment** (✅ Configured, Ready to Deploy)
**Duration**: 2-3 days

**Deliverables**:
- ✅ PersistentVolume configuration
- ✅ PersistentVolumeClaim setup
- ✅ Deployment manifests
- ✅ Service definitions
- ✅ ConfigMaps and Secrets

**Files Created**:
- `k8s-persistent-volume.yaml`
- `k8s-persistent-volume-claim.yaml`
- `k8s-deployment.yaml`
- `k8s-service.yaml`
- `k8s-configmap.yaml`
- `k8s-secret.yaml`
- `deploy-database.sh` - Automated deployment script

**What to do**:
```bash
# Deploy to Kubernetes
chmod +x deploy-database.sh
./deploy-database.sh

# Verify deployment
kubectl get pods -l app=ltplabs-database
kubectl get pvc sqlite-pvc
kubectl get svc ltplabs-database-service
```

---

### **Phase 4: API Gateway Integration** (🔄 Next Step)
**Duration**: 3-5 days

**What to do**:
1. Update API Gateway deployment to mount the same PVC
2. Install database client library (better-sqlite3 for Node.js)
3. Implement database connection layer
4. Create repository pattern for data access
5. Add error handling and retry logic
6. Implement API endpoints for all use cases

**Reference**: See `API_GATEWAY_INTEGRATION.md` for detailed guide

**Example API Endpoints to Implement**:
```
POST   /api/auth/login          # UC1: Authentication
POST   /api/clients             # UC5: Create client
GET    /api/clients             # View clients list
PATCH  /api/clients/:id/revoke  # UC4: Revoke access
PATCH  /api/clients/:id/renew   # UC7: Renew access
POST   /api/demos               # UC2: Add demo
GET    /api/demos               # View demos catalog
DELETE /api/demos/:id           # UC8: Remove demo
POST   /api/demos/:id/open      # UC3: Open demo (tracking)
GET    /api/analytics/clients/:id # UC6: View usage
GET    /api/requests            # View access requests
```

---

### **Phase 5: Microservices Integration** (🔄 After Phase 4)
**Duration**: 3-5 days

**What to do**:
1. Update other services to communicate via API Gateway
2. Remove direct database dependencies
3. Implement HTTP/gRPC clients
4. Add circuit breakers and retry logic
5. Update Docker Compose configuration
6. Test inter-service communication

---

### **Phase 6: Testing & Validation** (🔄 Ongoing)
**Duration**: 2-3 days

**What to do**:
1. **Unit Tests**: Database operations
2. **Integration Tests**: API endpoints
3. **Load Tests**: Concurrent access patterns
4. **Security Tests**: Authentication, authorization
5. **Backup/Restore Tests**: Data recovery procedures

**Testing Checklist**:
- [ ] All CRUD operations work correctly
- [ ] Concurrent read operations don't lock database
- [ ] Write operations are properly synchronized
- [ ] Session management works correctly
- [ ] Access control enforced properly
- [ ] Analytics tracking records correctly
- [ ] Backup/restore procedures work
- [ ] Health checks report accurately

---

### **Phase 7: Production Deployment** (🔄 Final Phase)
**Duration**: 2-3 days

**What to do**:
1. Update configurations for production:
   - Set `LOAD_SEED_DATA=false`
   - Use strong encryption keys
   - Enable SSL/TLS
   - Configure proper resource limits
2. Set up monitoring and alerting
3. Configure automated backups (CronJob)
4. Create disaster recovery procedures
5. Deploy to production cluster
6. Monitor performance and errors

**Production Checklist**:
- [ ] All secrets generated securely
- [ ] Seed data disabled
- [ ] Backups scheduled (daily recommended)
- [ ] Monitoring configured
- [ ] Logs aggregated
- [ ] Health checks passing
- [ ] Resource limits set appropriately
- [ ] Disaster recovery plan documented

---

## 🚀 Quick Start

### Prerequisites
- Docker installed
- Kubernetes cluster (minikube, kind, or production cluster)
- kubectl configured
- Basic knowledge of SQL and Kubernetes

### 1. Build Database Image

```bash
# Make scripts executable
chmod +x *.sh

# Build the Docker image
./build-database.sh
```

### 2. Test Locally

```bash
# Test the database container
./test-database.sh

# This will:
# - Start container locally
# - Initialize database
# - Load seed data
# - Run test queries
# - Provide interactive menu
```

### 3. Deploy to Kubernetes

```bash
# Deploy to your cluster
./deploy-database.sh

# This will:
# - Create PV and PVC
# - Apply ConfigMap and Secrets
# - Deploy database pod
# - Create services
# - Wait for pod to be ready
# - Verify health
```

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods -l app=ltplabs-database

# Check database health
kubectl exec -it <pod-name> -- /scripts/healthcheck.sh

# Query database
kubectl exec -it <pod-name> -- sqlite3 /data/ltplabs.db "SELECT COUNT(*) FROM users;"

# View logs
kubectl logs -l app=ltplabs-database -f
```

---

## 📦 Deployment

### File Structure

After setup, your database directory should look like this:

```
database/
├── Dockerfile
├── schema.sql
├── seed_data.sql
├── init-db.sh
├── healthcheck.sh
├── build-database.sh
├── test-database.sh
├── deploy-database.sh
├── backup-database.sh
├── k8s-persistent-volume.yaml
├── k8s-persistent-volume-claim.yaml
├── k8s-configmap.yaml
├── k8s-secret.yaml
├── k8s-deployment.yaml
├── k8s-service.yaml
├── API_GATEWAY_INTEGRATION.md
└── README.md
```

### Environment Variables

**ConfigMap** (`k8s-configmap.yaml`):
- `DB_PATH`: Database file path
- `LOAD_SEED_DATA`: Whether to load seed data (true/false)
- `SQLITE_TIMEOUT`: Busy timeout in milliseconds

**Secrets** (`k8s-secret.yaml`):
- `ENCRYPTION_KEY`: For encrypting sensitive data
- `JWT_SECRET`: For session token generation
- `BACKUP_PASSWORD`: For encrypted backups

### Kubernetes Resources

- **PersistentVolume**: 5Gi host-based storage
- **PersistentVolumeClaim**: Requests storage from PV
- **Deployment**: 1 replica (important for SQLite)
- **Service**: ClusterIP for internal access
- **ConfigMap**: Database configuration
- **Secret**: Sensitive credentials

---

## 🔌 API Gateway Integration

### Quick Integration Steps

1. **Mount the same PVC in API Gateway**:
```yaml
volumeMounts:
- name: database-storage
  mountPath: /data
  readOnly: false

volumes:
- name: database-storage
  persistentVolumeClaim:
    claimName: sqlite-pvc
```

2. **Install database client**:
```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

3. **Create database connection**:
```typescript
import Database from 'better-sqlite3';

const db = new Database('/data/ltplabs.db');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
```

4. **Implement repositories/services**:
```typescript
// clientRepository.ts
export class ClientRepository {
  create(client: ClientData) {
    const stmt = db.prepare(`
      INSERT INTO clients (...) VALUES (...)
    `);
    return stmt.run(...);
  }
  
  findAll() {
    return db.prepare('SELECT * FROM v_active_clients').all();
  }
}
```

**Full Guide**: See `API_GATEWAY_INTEGRATION.md`

---

## 🔧 Maintenance

### Backups

**Manual Backup**:
```bash
./backup-database.sh
```

**Automated Backup** (Kubernetes CronJob):
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: ltplabs/sqlite-database:latest
            command: ["/bin/bash", "/scripts/backup.sh"]
            volumeMounts:
            - name: database-storage
              mountPath: /data
          restartPolicy: OnFailure
```

### Monitoring

**Health Checks**:
```bash
# Check database health
kubectl exec <pod-name> -- /scripts/healthcheck.sh

# Check from service
curl http://ltplabs-database-service:8080
```

**Metrics to Monitor**:
- Database file size
- Query response times
- Connection errors
- WAL file size
- Backup success/failure

### Maintenance Tasks

**Weekly**:
- Check database integrity: `PRAGMA integrity_check;`
- Review error logs
- Verify backups

**Monthly**:
- Analyze usage patterns
- Optimize queries if needed
- Review and archive old data
- Test restore procedures

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Database is locked" Error
**Cause**: Multiple writes or long-running transactions

**Solutions**:
```bash
# Check WAL mode
sqlite3 /data/ltplabs.db "PRAGMA journal_mode;"

# Increase busy timeout
sqlite3 /data/ltplabs.db "PRAGMA busy_timeout = 10000;"

# Check for long transactions in your code
```

#### 2. Pod Stuck in Pending
**Cause**: PVC not bound or node not ready

**Solutions**:
```bash
# Check PVC status
kubectl get pvc sqlite-pvc

# Check PV
kubectl get pv

# Describe PVC for events
kubectl describe pvc sqlite-pvc

# Check node has directory
# On the node: ls -la /mnt/data/ltplabs/database
```

#### 3. Database File Not Found
**Cause**: Volume not mounted or initialization failed

**Solutions**:
```bash
# Check volume mount
kubectl describe pod <pod-name>

# Check initialization logs
kubectl logs <pod-name>

# Manually verify mount
kubectl exec -it <pod-name> -- ls -la /data/
```

#### 4. Permission Denied Errors
**Cause**: File permissions or security context issues

**Solutions**:
```bash
# Check file permissions on host
ls -la /mnt/data/ltplabs/database/

# Fix permissions
chmod 644 /mnt/data/ltplabs/database/ltplabs.db

# Update securityContext in deployment
```

#### 5. Out of Memory Errors
**Cause**: Insufficient resources or memory leak

**Solutions**:
```yaml
# Increase memory limits
resources:
  limits:
    memory: "2Gi"  # Increase from 1Gi

# Check PRAGMA cache_size
```

### Debug Commands

```bash
# View full logs
kubectl logs <pod-name> -f

# Access database shell
kubectl exec -it <pod-name> -- sqlite3 /data/ltplabs.db

# Check database statistics
kubectl exec <pod-name> -- sqlite3 /data/ltplabs.db "PRAGMA page_count; PRAGMA page_size;"

# Monitor resource usage
kubectl top pod <pod-name>

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

---

## 📚 Additional Resources

### Documentation
- [SQLite Official Documentation](https://www.sqlite.org/docs.html)
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- [Kubernetes Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

### Best Practices
- Always use WAL mode for better concurrency
- Set appropriate busy_timeout (5000ms recommended)
- Use prepared statements to prevent SQL injection
- Implement proper transaction boundaries
- Monitor database file size growth
- Regular backups (daily recommended)
- Test disaster recovery procedures

---

## 🎉 Next Steps

Now that you have the complete database setup:

1. ✅ **Review all files** created in this roadmap
2. ✅ **Build and test** the Docker image locally
3. ✅ **Deploy to Kubernetes** using the deployment script
4. 🔄 **Integrate with API Gateway** (see integration guide)
5. 🔄 **Implement API endpoints** for all use cases
6. 🔄 **Connect other microservices** through API Gateway
7. 🔄 **Set up monitoring** and alerts
8. 🔄 **Schedule automated backups**
9. 🔄 **Test in staging** environment
10. 🔄 **Deploy to production**

### Questions to Answer

Before moving forward, confirm:

- ✅ Database schema covers all your requirements?
- ✅ Comfortable with SQLite limitations (single writer)?
- ✅ Kubernetes cluster is ready and accessible?
- ✅ API Gateway programming language/framework chosen?
- ✅ Authentication strategy decided (JWT, sessions)?
- ✅ Backup retention policy defined?

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review pod logs: `kubectl logs <pod-name>`
3. Verify all prerequisites are met
4. Check file permissions on PersistentVolume

---

**Happy Coding! 🚀**

*LTP Labs E-Catalog Database v1.0*
