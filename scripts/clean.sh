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

# Voltar ao Docker local
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
    # Entrar no Docker do Minikube
    eval $(minikube docker-env)
    
    echo "🔍 Procurando imagens ecatalog com tag..."
    
    # Remover APENAS imagens com repository "ecatalog/*"
    CATALOG_IMG=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^ecatalog/catalog:")
    AUTH_IMG=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^ecatalog/authentication:")
    FRONT_IMG=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^ecatalog/frontend:")
    
    REMOVED=0
    
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
    
    # IMPORTANTE: NÃO remover dangling images automaticamente!
    DANGLING_COUNT=$(docker images -f "dangling=true" -q | wc -l)
    if [ $DANGLING_COUNT -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}ℹ️  Há $DANGLING_COUNT dangling images (<none>)${NC}"
        echo "   Estas NÃO foram removidas (segurança)."
        echo "   Se quiseres remover TODAS as dangling:"
        echo "   docker image prune -f"
    fi
    
    # Voltar ao Docker local
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

# minikube delete
# minikube start

# ============================================================================
# RESUMO
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║            ✅ LIMPEZA SEGURA COMPLETA!                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🧹 O que foi limpo:"
echo "   ✓ Namespace Kubernetes 'ecatalog'"
echo "   ✓ Imagens Docker 'ecatalog/*' (apenas com tag)"
echo "   ✓ Containers Docker Compose"
echo ""
echo "⚠️  O que NÃO foi tocado:"
echo "   • Dangling images (<none>) - mantidas por segurança"
echo "   • Outras imagens de outros projetos"
echo "   • Cluster Minikube"
echo ""
echo "📝 Próximo passo:"
echo "   ./scripts/redeploy.sh"
echo ""
