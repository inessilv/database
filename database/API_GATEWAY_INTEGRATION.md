# API Gateway Database Integration Guide

## Overview
This guide explains how to integrate your API Gateway with the SQLite database running in Kubernetes.

## Architecture
Since SQLite is a file-based database, your API Gateway needs to **mount the same PersistentVolumeClaim** as the database pod to access the database file directly.

## Integration Steps

### Step 1: Update API Gateway Deployment

Modify your API Gateway's Kubernetes deployment to mount the database PVC:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: default
spec:
  replicas: 1  # Keep at 1 for SQLite
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: your-registry/api-gateway:latest
        
        env:
        # Database configuration
        - name: DATABASE_PATH
          value: "/data/ltplabs.db"
        - name: DATABASE_URL
          value: "file:/data/ltplabs.db"
        
        # Import secrets
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: JWT_SECRET
        
        volumeMounts:
        # Mount the same PVC as the database
        - name: database-storage
          mountPath: /data
          readOnly: false  # Set to true if API Gateway only reads
        
        ports:
        - containerPort: 3000
      
      volumes:
      - name: database-storage
        persistentVolumeClaim:
          claimName: sqlite-pvc  # Same PVC as database pod
```

### Step 2: Database Client Configuration

#### For Node.js/TypeScript with `better-sqlite3`:

```typescript
// database.ts
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || '/data/ltplabs.db';

// Initialize database connection
export const db = new Database(DB_PATH, {
  verbose: console.log, // Remove in production
  fileMustExist: true
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('foreign_keys = ON');

// Set busy timeout
db.pragma('busy_timeout = 5000');

// Health check function
export function checkDatabaseHealth(): boolean {
  try {
    const result = db.prepare('SELECT 1 as health').get();
    return result.health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
```

#### Example API Route (Express.js):

```typescript
// routes/clients.ts
import { Router } from 'express';
import { db } from '../database';

const router = Router();

// Get all active clients
router.get('/clients', (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT * FROM v_active_clients 
      WHERE is_active = 1
      ORDER BY created_at DESC
    `).all();
    
    res.json({ success: true, data: clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Create new client
router.post('/clients', (req, res) => {
  const { name, email, password_hash, company, access_days } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO clients (
        name, email, password_hash, company,
        data_registo, access_end_date,
        created_by
      ) VALUES (
        ?, ?, ?, ?,
        datetime('now'), 
        datetime('now', '+' || ? || ' days'),
        ?
      )
    `);
    
    const result = stmt.run(
      name, email, password_hash, company,
      access_days || 30,
      req.user.id  // From authentication middleware
    );
    
    res.json({ 
      success: true, 
      clientId: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

export default router;
```

### Step 3: Database Connection Pooling (Optional)

For SQLite, connection pooling is different since it's file-based:

```typescript
// db-pool.ts
import Database from 'better-sqlite3';

class DatabasePool {
  private db: Database.Database;
  
  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
  }
  
  // Use a single connection with transaction management
  transaction<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback);
    return transaction();
  }
  
  close() {
    this.db.close();
  }
}

export const dbPool = new DatabasePool(process.env.DATABASE_PATH!);
```

### Step 4: Add Health Check Endpoint

```typescript
// routes/health.ts
import { Router } from 'express';
import { checkDatabaseHealth } from '../database';

const router = Router();

router.get('/health', (req, res) => {
  const dbHealthy = checkDatabaseHealth();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

export default router;
```

### Step 5: Deployment Configuration

#### docker-compose.yml (for local development):

```yaml
version: '3.8'

services:
  database:
    build: ./database
    volumes:
      - db-data:/data
    networks:
      - ltplabs-network
  
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      DATABASE_PATH: /data/ltplabs.db
      NODE_ENV: development
    volumes:
      - db-data:/data  # Same volume as database
    depends_on:
      - database
    networks:
      - ltplabs-network

volumes:
  db-data:

networks:
  ltplabs-network:
```

## Important Considerations

### 1. **Concurrency**
- SQLite handles multiple readers but only one writer at a time
- WAL mode improves concurrent read performance
- Set appropriate `busy_timeout` (5000ms recommended)

### 2. **Replica Count**
- Keep API Gateway at **1 replica** when using SQLite
- For scaling, consider migrating to PostgreSQL/MySQL

### 3. **Read-Only Mode**
- Other services (analytics, demo-service) should mount the volume as **read-only**:
```yaml
volumeMounts:
- name: database-storage
  mountPath: /data
  readOnly: true  # Read-only access
```

### 4. **Error Handling**
Always handle `SQLITE_BUSY` errors:

```typescript
function retryOperation<T>(operation: () => T, maxRetries = 3): T {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      return operation();
    } catch (error) {
      if (error.code === 'SQLITE_BUSY' && attempts < maxRetries - 1) {
        attempts++;
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempts) * 100;
        setTimeout(() => {}, delay);
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### 5. **Transactions**
Use transactions for multi-statement operations:

```typescript
db.transaction(() => {
  db.prepare('INSERT INTO clients ...').run(...);
  db.prepare('INSERT INTO client_demo_access ...').run(...);
  db.prepare('INSERT INTO audit_log ...').run(...);
})();
```

## Testing the Integration

1. **Start the services:**
```bash
kubectl get pods -n default
```

2. **Check API Gateway can access database:**
```bash
kubectl exec -it <api-gateway-pod> -- ls -la /data/ltplabs.db
```

3. **Test API endpoints:**
```bash
curl http://your-api-gateway/health
curl http://your-api-gateway/api/clients
```

## Migration to PostgreSQL (Future)

If you need to scale beyond SQLite:

1. Export data:
```bash
sqlite3 ltplabs.db .dump > dump.sql
```

2. Convert to PostgreSQL syntax
3. Import to PostgreSQL
4. Update API Gateway connection strings

## Troubleshooting

### Database locked errors:
- Check `busy_timeout` setting
- Ensure WAL mode is enabled
- Verify only one writer at a time

### Permission denied:
- Check PVC permissions
- Verify `securityContext` in deployments
- Ensure user/group IDs match

### Connection errors:
- Verify PVC is mounted correctly
- Check database file path
- Review pod logs: `kubectl logs <pod-name>`

## Additional Resources

- [better-sqlite3 documentation](https://github.com/WiseLibs/better-sqlite3)
- [SQLite WAL mode](https://www.sqlite.org/wal.html)
- [SQLite optimization tips](https://www.sqlite.org/optoverview.html)
