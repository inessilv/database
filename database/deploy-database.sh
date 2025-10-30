# Configuration
NAMESPACE="${NAMESPACE:-default}"
KUBECTL="${KUBECTL:-kubectl}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Deploying LTP Labs Database${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if kubectl is available
if ! command -v $KUBECTL &> /dev/null; then
    echo -e "${RED}Error: kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check if cluster is accessible
if ! $KUBECTL cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"
echo ""

# Function to apply configuration
apply_config() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ File not found: $file${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Applying $description...${NC}"
    $KUBECTL apply -f "$file" -n "$NAMESPACE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $description applied successfully${NC}"
    else
        echo -e "${RED}✗ Failed to apply $description${NC}"
        return 1
    fi
    echo ""
}

# Step 1: Create namespace if it doesn't exist (optional)
if [ "$NAMESPACE" != "default" ]; then
    echo -e "${BLUE}Creating namespace: $NAMESPACE${NC}"
    $KUBECTL create namespace "$NAMESPACE" --dry-run=client -o yaml | $KUBECTL apply -f -
    echo ""
fi

# Step 2: Apply ConfigMap and Secret
echo -e "${YELLOW}Step 1: Applying configurations...${NC}"
apply_config "k8s-configmap.yaml" "ConfigMap"

# Generate secrets if not exists
if ! $KUBECTL get secret database-secret -n "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}Generating new secrets...${NC}"
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    
    $KUBECTL create secret generic database-secret \
        --from-literal=ENCRYPTION_KEY="$ENCRYPTION_KEY" \
        --from-literal=JWT_SECRET="$JWT_SECRET" \
        --from-literal=BACKUP_PASSWORD="changeme" \
        -n "$NAMESPACE"
    
    echo -e "${GREEN}✓ Secrets created${NC}"
else
    echo -e "${YELLOW}Secrets already exist, skipping creation${NC}"
fi
echo ""

# Step 3: Apply PersistentVolume and PersistentVolumeClaim
echo -e "${YELLOW}Step 2: Setting up persistent storage...${NC}"
apply_config "k8s-persistent-volume.yaml" "PersistentVolume"
apply_config "k8s-persistent-volume-claim.yaml" "PersistentVolumeClaim"

# Wait for PVC to be bound
echo -e "${BLUE}Waiting for PVC to be bound...${NC}"
$KUBECTL wait --for=condition=bound pvc/sqlite-pvc -n "$NAMESPACE" --timeout=120s

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PVC is bound${NC}"
else
    echo -e "${RED}✗ PVC binding timeout${NC}"
    echo -e "${YELLOW}You may need to check your PersistentVolume configuration${NC}"
fi
echo ""

# Step 4: Deploy database
echo -e "${YELLOW}Step 3: Deploying database...${NC}"
apply_config "k8s-deployment.yaml" "Deployment"
apply_config "k8s-service.yaml" "Service"

# Step 5: Wait for deployment to be ready
echo -e "${BLUE}Waiting for database pod to be ready...${NC}"
$KUBECTL wait --for=condition=ready pod -l app=ltplabs-database -n "$NAMESPACE" --timeout=300s

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database pod is ready${NC}"
else
    echo -e "${RED}✗ Deployment timeout${NC}"
    echo -e "${YELLOW}Checking pod logs...${NC}"
    $KUBECTL logs -l app=ltplabs-database -n "$NAMESPACE" --tail=50
    exit 1
fi
echo ""

# Step 6: Verify deployment
echo -e "${YELLOW}Step 4: Verifying deployment...${NC}"
echo ""
echo "Pods:"
$KUBECTL get pods -l app=ltplabs-database -n "$NAMESPACE"
echo ""
echo "Services:"
$KUBECTL get svc -l app=ltplabs-database -n "$NAMESPACE"
echo ""
echo "PVC:"
$KUBECTL get pvc sqlite-pvc -n "$NAMESPACE"
echo ""

# Check database health
POD_NAME=$($KUBECTL get pods -l app=ltplabs-database -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
echo -e "${BLUE}Checking database health...${NC}"
$KUBECTL exec -it "$POD_NAME" -n "$NAMESPACE" -- /scripts/healthcheck.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database health check passed${NC}"
else
    echo -e "${RED}✗ Database health check failed${NC}"
fi
echo ""

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Database pod: $POD_NAME"
echo "Service: ltplabs-database-service (ClusterIP)"
echo "Database path: /data/ltplabs.db"
echo ""
echo "Useful commands:"
echo "  View logs: $KUBECTL logs $POD_NAME -n $NAMESPACE -f"
echo "  Access shell: $KUBECTL exec -it $POD_NAME -n $NAMESPACE -- /bin/sh"
echo "  Check database: $KUBECTL exec -it $POD_NAME -n $NAMESPACE -- sqlite3 /data/ltplabs.db \"SELECT COUNT(*) FROM users;\""
echo ""
echo "Next steps:"
echo "1. Update your API Gateway to connect to: ltplabs-database-service:8080"
echo "2. Mount the same PVC in your API Gateway to access the database file"
