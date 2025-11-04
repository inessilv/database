# 1. Garantir Minikube está a correr
echo "📦 Verificando Minikube..."
if ! minikube status | grep -q "Running"; then
    echo "🚀 Iniciando Minikube..."
    minikube start
fi

# 2. IMPORTANTE: Usar Docker do Minikube ANTES de build
echo "🐳 Configurando Docker para Minikube..."
eval $(minikube docker-env)

# 3. Build das imagens (no Docker do Minikube)
echo ""
echo "🔨 Building imagens..."
echo "  → Catalog..."
cd services/catalog && docker build -t ecatalog/catalog:latest . && cd ../..

echo "  → Authentication..."
cd services/authentication && docker build -t ecatalog/authentication:latest . && cd ../..

echo "  → Frontend..."
cd services/frontend && echo "VITE_API_URL=http://$(minikube ip):30800" > .env && docker build -t ecatalog/frontend:latest . && cd ../..

# 4. Verificar imagens
echo ""
echo "📋 Verificando imagens no Minikube..."
docker images | grep ecatalog

# 5. Deploy Kubernetes
echo ""
echo "☸️  Deploying para Kubernetes..."
kubectl apply -f kubernetes/namespaces/ecatalog-namespace.yaml
kubectl apply -f kubernetes/deployments/authentication-deployment.yaml
kubectl apply -f kubernetes/services/authentication-service.yaml
kubectl apply -f kubernetes/deployments/catalog-deployment.yaml
kubectl apply -f kubernetes/services/catalog-service.yaml
kubectl apply -f kubernetes/deployments/frontend-deployment.yaml
kubectl apply -f kubernetes/services/frontend-service.yaml

# 6. Aguardar pods
echo ""
echo "⏳ Aguardando pods ficarem prontos..."
kubectl wait --for=condition=ready pod -l app=authentication -n ecatalog --timeout=180s
kubectl wait --for=condition=ready pod -l app=catalog -n ecatalog --timeout=180s
kubectl wait --for=condition=ready pod -l app=frontend -n ecatalog --timeout=120s

# 7. Mostrar status
echo ""
echo "✅ Deploy completo!"
kubectl get pods -n ecatalog
kubectl get services -n ecatalog

# 8. URLs
MINIKUBE_IP=$(minikube ip)
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    URLs DISPONÍVEIS                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Frontend:       http://$MINIKUBE_IP:30300"
echo "📦 Catalog:        http://$MINIKUBE_IP:30800/docs"
echo "🔐 Authentication: http://$MINIKUBE_IP:30080/docs"
echo ""

xdg-open http://$MINIKUBE_IP:30300

# For windows users:
# minikube service frontend -n ecatalog