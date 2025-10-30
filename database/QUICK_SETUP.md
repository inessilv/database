# Quick Setup Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Download All Files
Download all the files from this directory to your project's `database/` folder.

### Step 2: Make Scripts Executable
```bash
cd database/
chmod +x *.sh
```

### Step 3: Build the Docker Image
```bash
./build-database.sh
```

### Step 4: Test Locally (Optional but Recommended)
```bash
./test-database.sh
```

### Step 5: Deploy to Kubernetes
```bash
# First, ensure your kubectl is configured
kubectl cluster-info

# Then deploy
./deploy-database.sh
```

### Step 6: Verify Deployment
```bash
# Check if pod is running
kubectl get pods -l app=ltplabs-database

# Check database health
POD_NAME=$(kubectl get pods -l app=ltplabs-database -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $POD_NAME -- /scripts/healthcheck.sh

# Query the database
kubectl exec -it $POD_NAME -- sqlite3 /data/ltplabs.db "SELECT name FROM demos;"
```

## 📁 File Structure

Place all files in your project's `database/` directory:

```
your-project/
├── database/                    # ← Create this directory
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── schema.sql
│   ├── seed_data.sql
│   ├── init-db.sh
│   ├── healthcheck.sh
│   ├── build-database.sh
│   ├── test-database.sh
│   ├── deploy-database.sh
│   ├── backup-database.sh
│   ├── k8s-persistent-volume.yaml
│   ├── k8s-persistent-volume-claim.yaml
│   ├── k8s-configmap.yaml
│   ├── k8s-secret.yaml
│   ├── k8s-deployment.yaml
│   ├── k8s-service.yaml
│   ├── API_GATEWAY_INTEGRATION.md
│   ├── README.md
│   └── QUICK_SETUP.md          # ← This file
│
├── frontend/
├── kubernetes/
│   ├── configmaps/
│   ├── deployments/
│   └── services/
└── services/
    ├── api-gateway/
    ├── auth-service/
    ├── demo-service/
    └── analytics-service/
```

## ⚙️ Configuration Changes for Production

Before deploying to production, update these files:

### 1. `k8s-configmap.yaml`
```yaml
LOAD_SEED_DATA: "false"  # Change from "true" to "false"
```

### 2. `k8s-secret.yaml`
Generate secure secrets:
```bash
# Generate encryption key
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64

# Update k8s-secret.yaml with these values
```

### 3. `k8s-persistent-volume.yaml`
Update the host path to match your cluster:
```yaml
hostPath:
  path: "/mnt/data/ltplabs/database"  # Adjust for your environment
```

## 🔄 Next Steps After Deployment

1. **Integrate with API Gateway** - See `API_GATEWAY_INTEGRATION.md`
2. **Set up automated backups** - Use `backup-database.sh` in a CronJob
3. **Configure monitoring** - Add Prometheus/Grafana
4. **Implement API endpoints** - Based on the schema

## 🆘 Need Help?

1. Check `README.md` for complete documentation
2. Review `API_GATEWAY_INTEGRATION.md` for integration guide
3. Run `kubectl logs <pod-name>` to see logs
4. Execute `kubectl describe pod <pod-name>` for detailed status

## 📞 Common Commands

```bash
# View database logs
kubectl logs -l app=ltplabs-database -f

# Access database shell
kubectl exec -it <pod-name> -- sqlite3 /data/ltplabs.db

# Backup database
./backup-database.sh

# Restart database pod
kubectl rollout restart deployment ltplabs-database

# Check PVC status
kubectl get pvc sqlite-pvc

# Delete everything (careful!)
kubectl delete -f k8s-deployment.yaml
kubectl delete -f k8s-service.yaml
kubectl delete -f k8s-persistent-volume-claim.yaml
kubectl delete -f k8s-persistent-volume.yaml
```

---

**Ready to build your database? Start with Step 1! 🚀**
