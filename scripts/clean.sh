echo "🗑️  E-Catalog - Script de Limpeza Completa"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================================================
# DOCKER COMPOSE
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 Docker Compose - Parar e Remover Containers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "docker-compose.yml" ]; then
    echo "📦 Parando containers..."
    docker-compose down -v --remove-orphans
    
    echo -e "${GREEN}✅ Containers Docker Compose parados e removidos${NC}"
else
    echo -e "${YELLOW}⚠️  docker-compose.yml não encontrado${NC}"
fi

echo ""

# ============================================================================
# DOCKER IMAGES (LOCAL)
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖼️  Docker Images - Remover Imagens Locais"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 Procurando imagens ecatalog..."
IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep ecatalog)

if [ ! -z "$IMAGES" ]; then
    echo "📋 Imagens encontradas:"
    echo "$IMAGES"
    echo ""
    echo "🗑️  Removendo imagens..."
    docker rmi -f $IMAGES
    echo -e "${GREEN}✅ Imagens locais removidas${NC}"
else
    echo -e "${YELLOW}⚠️  Nenhuma imagem ecatalog encontrada${NC}"
fi

# Remover também por nome específico
docker rmi -f ecatalog/catalog:latest 2>/dev/null
docker rmi -f ecatalog/authentication:latest 2>/dev/null
docker rmi -f ecatalog/frontend:latest 2>/dev/null
docker rmi -f projeto_ltp_labs-catalog 2>/dev/null
docker rmi -f projeto_ltp_labs-authentication 2>/dev/null
docker rmi -f projeto_ltp_labs-frontend 2>/dev/null

echo ""

# ============================================================================
# KUBERNETES
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "☸️  Kubernetes - Remover Deployments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se Minikube está a correr
if minikube status | grep -q "Running"; then
    echo "🔍 Minikube está a correr..."
    
    # Verificar se namespace existe
    if kubectl get namespace ecatalog &> /dev/null; then
        echo "📦 Namespace 'ecatalog' encontrado"
        echo ""
        
        echo "🗑️  Removendo namespace (remove tudo dentro)..."
        kubectl delete namespace ecatalog
        
        echo -e "${GREEN}✅ Namespace Kubernetes removido${NC}"
    else
        echo -e "${YELLOW}⚠️  Namespace 'ecatalog' não existe${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Minikube não está a correr${NC}"
fi

echo ""

# ============================================================================
# DOCKER IMAGES (MINIKUBE)
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖼️  Docker Images - Remover do Minikube"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if minikube status | grep -q "Running"; then
    echo "🔄 Usando Docker do Minikube..."
    eval $(minikube docker-env)
    
    echo "🔍 Procurando imagens ecatalog no Minikube..."
    MINIKUBE_IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep ecatalog)
    
    if [ ! -z "$MINIKUBE_IMAGES" ]; then
        echo "📋 Imagens encontradas no Minikube:"
        echo "$MINIKUBE_IMAGES"
        echo ""
        echo "🗑️  Removendo imagens do Minikube..."
        docker rmi -f $MINIKUBE_IMAGES
        echo -e "${GREEN}✅ Imagens do Minikube removidas${NC}"
    else
        echo -e "${YELLOW}⚠️  Nenhuma imagem ecatalog no Minikube${NC}"
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

minikube delete
minikube start

# ============================================================================
# RESUMO
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ LIMPEZA COMPLETA!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🧹 O que foi limpo:"
echo "   ✓ Containers Docker Compose parados"
echo "   ✓ Imagens Docker locais removidas"
echo "   ✓ Namespace Kubernetes removido"
echo "   ✓ Imagens Minikube removidas"
echo "   ✓ Recursos dangling limpos"
echo ""
echo "Para fazer deploy novamente:"
echo "   Docker Compose: docker-compose up --build"
echo "   Kubernetes:     ./scripts/deploy-k8s.sh"
echo ""
