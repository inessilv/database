echo "🗑️  E-Catalog - Limpeza Segura (Empresa)"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================================================
# DOCKER COMPOSE
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 Docker Compose"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

eval $(minikube docker-env -u) 2>/dev/null

if [ -f "docker-compose.yml" ]; then
    docker-compose down -v 2>/dev/null
    echo -e "${GREEN}✅ Docker Compose parado${NC}"
else
    echo -e "${YELLOW}⚠️  docker-compose.yml não encontrado${NC}"
fi

echo ""

# ============================================================================
# KUBERNETES
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "☸️  Kubernetes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if minikube status | grep -q "Running" 2>/dev/null; then
    if kubectl get namespace ecatalog &> /dev/null; then
        kubectl delete namespace ecatalog
        echo -e "${GREEN}✅ Namespace 'ecatalog' removido${NC}"
    else
        echo -e "${YELLOW}⚠️  Namespace 'ecatalog' não existe${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Minikube não está a correr${NC}"
fi

echo ""

# ============================================================================
# DOCKER IMAGES (MINIKUBE) - SÓ ECATALOG!
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖼️  Docker Images (Minikube) - Apenas E-Catalog"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if minikube status | grep -q "Running" 2>/dev/null; then
    eval $(minikube docker-env)
    
    echo "🔍 Procurando imagens ecatalog com tag..."

    DB_IMG=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^ecatalog/database:")
    CATALOG_IMG=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^ecatalog/catalog:")
    AUTH_IMG=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^ecatalog/authentication:")
    FRONT_IMG=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^ecatalog/frontend:")
    
    REMOVED=0
    
    if [ ! -z "$DB_IMG" ]; then
        echo "🗑️  Removendo: $DB_IMG"
        docker rmi -f $DB_IMG 2>/dev/null && ((REMOVED++))
    fi
    
    if [ ! -z "$CATALOG_IMG" ]; then
        echo "🗑️  Removendo: $CATALOG_IMG"
        docker rmi -f $CATALOG_IMG 2>/dev/null && ((REMOVED++))
    fi
    
    if [ ! -z "$AUTH_IMG" ]; then
        echo "🗑️  Removendo: $AUTH_IMG"
        docker rmi -f $AUTH_IMG 2>/dev/null && ((REMOVED++))
    fi
    
    if [ ! -z "$FRONT_IMG" ]; then
        echo "🗑️  Removendo: $FRONT_IMG"
        docker rmi -f $FRONT_IMG 2>/dev/null && ((REMOVED++))
    fi
    
    if [ $REMOVED -gt 0 ]; then
        echo -e "${GREEN}✅ $REMOVED imagem(ns) ecatalog removida(s)${NC}"
    else
        echo -e "${YELLOW}⚠️  Nenhuma imagem ecatalog encontrada${NC}"
    fi

    DANGLING_COUNT=$(docker images -f "dangling=true" -q | wc -l)
    if [ $DANGLING_COUNT -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}ℹ️  Há $DANGLING_COUNT dangling images (<none>)${NC}"
        echo "   Estas NÃO foram removidas automaticamente."
        echo "   Para limpar manualmente:"
        echo "   docker image prune -f"
    fi
    
    eval $(minikube docker-env -u)
else
    echo -e "${YELLOW}⚠️  Minikube não está a correr${NC}"
fi

echo ""

# ============================================================================
# DANGLING IMAGES E CONTAINERS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Limpeza Adicional"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🗑️  Removendo containers parados..."
docker container prune -f

echo "🗑️  Removendo imagens dangling..."
docker image prune -f

echo "🗑️  Removendo volumes não utilizados..."
docker volume prune -f

echo -e "${GREEN}✅ Limpeza adicional completa${NC}"
echo ""
# ============================================================================
# KUBERNETES RESOURCES
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "☸️  Kubernetes - Limpeza Namespace + PV"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if minikube status &>/dev/null; then
    echo "🔍 Verificando recursos Kubernetes..."
    
    # Verificar se namespace existe
    if kubectl get namespace ecatalog &>/dev/null; then
        echo "🗑️  Removendo namespace 'ecatalog' (pods, services, pvc, deployments, etc)..."
        kubectl delete namespace ecatalog
        echo -e "${GREEN}✅ Namespace 'ecatalog' removido${NC}"
    else
        echo -e "${YELLOW}⚠️  Namespace 'ecatalog' já não existe${NC}"
    fi
    
    # Verificar e remover PV (não é apagado com namespace!)
    if kubectl get pv database-pv &>/dev/null; then
        echo "🗑️  Removendo PersistentVolume 'database-pv'..."
        kubectl delete pv database-pv
        echo -e "${GREEN}✅ PV 'database-pv' removido${NC}"
    else
        echo -e "${YELLOW}⚠️  PV 'database-pv' já não existe${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  Minikube não está a correr${NC}"
fi

echo "🗑️  Removendo dados físicos do Database (hostPath)..."
minikube ssh "sudo rm -rf /mnt/data/ecatalog" 2>/dev/null
echo -e "${GREEN}✅ Dados físicos removidos${NC}"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            ✅ LIMPEZA SEGURA COMPLETA!                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🧹 O que foi limpo:"
echo "   ✓ Namespace Kubernetes 'ecatalog'"
echo "   ✓ Imagens Docker 'ecatalog/*' (incluindo database)"
echo "   ✓ Containers Docker Compose"
echo ""
echo ""
echo "📝 Próximo passo:"
echo "   ./scripts/kubernetes_all.sh"
echo ""
