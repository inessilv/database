#!/bin/bash
# ============================================================================
# Deploy completo E-Catalog no Kubernetes (Minikube)
# ============================================================================
# Faz deploy de: Database, Catalog, Authentication, Frontend
# ============================================================================


# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          E-Catalog - Deploy Completo (Kubernetes)         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# 1. Garantir Minikube está a correr
# ============================================================================
echo -e "${YELLOW}📦 Passo 1/9: Verificando Minikube...${NC}"
if ! minikube status | grep -q "Running"; then
    echo -e "${BLUE}🚀 Iniciando Minikube...${NC}"
    minikube start
else
    echo -e "${GREEN}✓ Minikube já está running${NC}"
fi
echo ""

# ============================================================================
# 2. IMPORTANTE: Usar Docker do Minikube ANTES de build
# ============================================================================
echo -e "${YELLOW}🐳 Passo 2/9: Configurando Docker para Minikube...${NC}"
eval $(minikube docker-env)
echo -e "${GREEN}✓ Docker configurado para usar registry do Minikube${NC}"
echo ""

# ============================================================================
# 3. Build das imagens (no Docker do Minikube)
# ============================================================================
echo -e "${YELLOW}🔨 Passo 3/9: Building imagens Docker...${NC}"
echo ""

echo -e "${BLUE}  → Database...${NC}"
cd services/database && docker build -t ecatalog/database:latest . && cd ../..
echo -e "${GREEN}  ✓ Database image built${NC}"

echo -e "${BLUE}  → Catalog...${NC}"
cd services/catalog && docker build -t ecatalog/catalog:latest . && cd ../..
echo -e "${GREEN}  ✓ Catalog image built${NC}"

echo -e "${BLUE}  → Authentication...${NC}"
cd services/authentication && docker build -t ecatalog/authentication:latest . && cd ../..
echo -e "${GREEN}  ✓ Authentication image built${NC}"

echo -e "${BLUE}  → Frontend...${NC}"
cd services/frontend && echo "VITE_API_URL=http://$(minikube ip):30800" > .env && docker build -t ecatalog/frontend:latest . && cd ../..
echo -e "${GREEN}  ✓ Frontend image built${NC}"
echo ""

# Store Minikube IP for later use
MINIKUBE_IP=$(minikube ip)

# ============================================================================
# 4. Verificar imagens
# ============================================================================
echo -e "${YELLOW}📋 Passo 4/9: Verificando imagens no Minikube...${NC}"
docker images | grep ecatalog
echo ""

# ============================================================================
# 5. Deploy Kubernetes - Infraestrutura base
# ============================================================================
echo -e "${YELLOW}☸️  Passo 5/9: Deploy infraestrutura base (namespace, volumes, configs)...${NC}"

# Use Minikube IP stored from build step
echo -e "${BLUE}Minikube IP: ${MINIKUBE_IP}${NC}"

echo -e "${BLUE}  → Namespace...${NC}"
kubectl apply -f kubernetes/namespaces/ecatalog-namespace.yaml

echo -e "${BLUE}  → Volumes (PV + PVC)...${NC}"
kubectl apply -f kubernetes/volumes/database-pv.yaml
kubectl apply -f kubernetes/volumes/database-pvc.yaml

echo -e "${BLUE}  → ConfigMaps...${NC}"
kubectl apply -f kubernetes/configmaps/authentication-configmap.yaml
kubectl apply -f kubernetes/configmaps/catalog-configmap.yaml
kubectl apply -f kubernetes/configmaps/database-configmap.yaml
kubectl apply -f kubernetes/configmaps/frontend-config.yaml

echo -e "${BLUE}  → Secrets...${NC}"
kubectl apply -f kubernetes/secrets/database-secret.yaml
kubectl apply -f kubernetes/secrets/microsoft-oauth-secret.yaml

echo -e "${GREEN}✓ Infraestrutura base criada${NC}"
echo ""

# ============================================================================
# 6. Deploy Database (tem que ser primeiro - é dependência do Catalog)
# ============================================================================
echo -e "${YELLOW}🗄️  Passo 6/9: Deploy Database...${NC}"
kubectl apply -f kubernetes/deployments/database-deployment.yaml
kubectl apply -f kubernetes/services/database-internal-service.yaml

echo -e "${BLUE}⏳ Aguardando Database pod ficar ready...${NC}"
kubectl wait --for=condition=ready pod -l app=database -n ecatalog --timeout=180s
echo -e "${GREEN}✓ Database está ready!${NC}"
echo ""

# ============================================================================
# 7. Deploy serviços backend (Catalog, Authentication)
# ============================================================================
echo -e "${YELLOW}🔧 Passo 7/9: Deploy serviços backend...${NC}"

echo -e "${BLUE}  → Authentication Service...${NC}"
kubectl apply -f kubernetes/deployments/authentication-deployment.yaml
kubectl apply -f kubernetes/services/authentication-service.yaml

echo -e "${BLUE}  → Catalog Service...${NC}"
kubectl apply -f kubernetes/deployments/catalog-deployment.yaml
kubectl apply -f kubernetes/services/catalog-service.yaml

echo ""

# ============================================================================
# 8. Deploy Frontend
# ============================================================================
echo -e "${YELLOW}🎨 Passo 8/9: Deploy Frontend...${NC}"
kubectl apply -f kubernetes/deployments/frontend-deployment.yaml
kubectl apply -f kubernetes/services/frontend-service.yaml
echo ""

# ============================================================================
# 9. Network Policy (segurança)
# ============================================================================
echo -e "${YELLOW}🔒 Passo 9/9: Aplicando Network Policy...${NC}"
kubectl apply -f kubernetes/network-policies/database-access-policy.yaml
echo -e "${GREEN}✓ Network Policy aplicada (Database protegida)${NC}"
echo ""

# ============================================================================
# Aguardar todos os pods ficarem prontos
# ============================================================================
echo -e "${BLUE}⏳ Aguardando todos os pods ficarem prontos...${NC}"
echo ""

echo -e "${BLUE}  → Authentication...${NC}"
kubectl wait --for=condition=ready pod -l app=authentication -n ecatalog --timeout=180s
echo -e "${GREEN}  ✓ Authentication ready${NC}"

echo -e "${BLUE}  → Catalog...${NC}"
kubectl wait --for=condition=ready pod -l app=catalog -n ecatalog --timeout=180s
echo -e "${GREEN}  ✓ Catalog ready${NC}"

echo -e "${BLUE}  → Frontend...${NC}"
kubectl wait --for=condition=ready pod -l app=frontend -n ecatalog --timeout=120s
echo -e "${GREEN}  ✓ Frontend ready${NC}"

echo ""

# ============================================================================
# Mostrar status final
# ============================================================================
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   ✅ DEPLOY COMPLETO!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📊 Status dos Pods:${NC}"
kubectl get pods -n ecatalog
echo ""

echo -e "${BLUE}🌐 Services:${NC}"
kubectl get services -n ecatalog
echo ""

echo -e "${BLUE}💾 Storage:${NC}"
kubectl get pvc -n ecatalog
echo ""

# ============================================================================
# Configurar Ingress
# ============================================================================
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Configurar Ingress                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

#!/bin/bash

# Enable Ingress addon in Minikube
echo "Enabling Ingress addon in Minikube..."
minikube addons enable ingress

# Wait for ingress controller to be ready
echo "Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Apply the ingress configuration
echo "Applying ingress configuration..."
kubectl apply -f kubernetes/ingress/ingress.yaml

# Get the ingress IP
echo "Checking ingress status..."
kubectl get ingress -n ecatalog

echo ""
echo "✅ Ingress setup complete!"
echo ""



# ============================================================================
# URLs disponíveis
# ============================================================================
MINIKUBE_IP=$(minikube ip)
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    URLs DISPONÍVEIS                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Frontend:       ${NC}http://$MINIKUBE_IP:30300"
echo -e "${BLUE}📦 Catalog API:    ${NC}http://$MINIKUBE_IP:30800"
echo -e "${BLUE}📖 Catalog Docs:   ${NC}http://$MINIKUBE_IP:30800/docs"
echo -e "${BLUE}🔐 Authentication: ${NC}http://$MINIKUBE_IP:30080/docs"
echo -e "${YELLOW}🗄️  Database:       ${NC}(interno - apenas Catalog tem acesso)"
echo ""

echo -e "${YELLOW}💡 Comandos úteis:${NC}"
echo -e "   ${BLUE}Ver logs Catalog:${NC}        kubectl logs -f deployment/catalog -n ecatalog"
echo -e "   ${BLUE}Ver logs Database:${NC}       kubectl logs -f deployment/database -n ecatalog"
echo -e "   ${BLUE}Testar health Catalog:${NC}   curl http://$MINIKUBE_IP:30800/health"
echo -e "   ${BLUE}Ver todos os pods:${NC}       kubectl get pods -n ecatalog"
echo ""

# Tentar abrir browser (se disponível)
if command -v xdg-open &> /dev/null; then
    echo -e "${BLUE}🚀 Abrindo Frontend no browser...${NC}"
    xdg-open http://$MINIKUBE_IP:30300 2>/dev/null || true
fi


echo ""
echo "Port-forward to access via localhost (no sudo required):"
echo "  kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8080:80"
echo "  Frontend: http://localhost:8080"
echo "  Callback: http://localhost:8080/api/auth/microsoft/callback"
echo ""

kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8080:80
