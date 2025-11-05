# Kubernetes Configuration - E-Catalog

## 📋 Visão Geral

Esta pasta contém todos os manifestos Kubernetes necessários para fazer deploy do **E-Catalog** com a arquitetura de 2 pods (Catalog + Database).

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│         Service: catalog (NodePort 30800)       │
│         Exposto externamente                    │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              Pod: Catalog (2 replicas)          │
│              FastAPI - Port 8000                │
│              Lógica de negócio                  │
└─────────────────────────────────────────────────┘
                    │ HTTP
                    ▼
┌─────────────────────────────────────────────────┐
│         Service: database-internal              │
│         (ClusterIP - apenas interno)            │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│           Pod: Database (1 replica)             │
│           FastAPI + SQLite - Port 8001          │
│           Mini API CRUD                         │
└─────────────────────────────────────────────────┘
                    │
                    ▼
              ┌─────────┐
              │   PVC   │
              │ SQLite  │
              └─────────┘
```

## 📂 Estrutura de Ficheiros

```
kubernetes/
├── namespaces/
│   └── ecatalog-namespace.yaml         # Namespace "ecatalog"
│
├── volumes/
│   ├── database-pv.yaml                # PersistentVolume (5Gi)
│   └── database-pvc.yaml               # PersistentVolumeClaim
│
├── configmaps/
│   ├── catalog-configmap.yaml          # Config do Catalog
│   └── database-configmap.yaml         # Config do Database
│
├── secrets/
│   └── database-secret.yaml            # Credenciais sensíveis
│
├── deployments/
│   ├── catalog-deployment.yaml         # Deployment Catalog (2 replicas)
│   ├── database-deployment.yaml        # Deployment Database (1 replica)
│   ├── authentication-deployment.yaml  # Authentication Service (mantém)
│   └── frontend-deployment.yaml        # Frontend (mantém)
│
├── services/
│   ├── catalog-service.yaml            # Service Catalog (NodePort 30800)
│   ├── database-internal-service.yaml  # Service Database (ClusterIP)
│   ├── authentication-service.yaml     # Service Auth (mantém)
│   └── frontend-service.yaml           # Service Frontend (mantém)
│
├── network-policies/
│   └── database-access-policy.yaml     # Restringe acesso ao Database
│
├── scripts/
│   └── kubernetes_all.sh               # Script de deploy automático
│
└── README.md                           # Este ficheiro
```

## 🚀 Deploy

### Opção 1: Script Automático (Recomendado)

```bash
# Tornar executável
chmod +x kubernetes/scripts/kubernetes_all.sh

# Executar
./kubernetes/scripts/kubernetes_all.sh
```

**O script faz deploy de tudo automaticamente:**
- ✅ Verifica/inicia Minikube
- ✅ Configura Docker do Minikube
- ✅ Build de todas as imagens (Database, Catalog, Authentication, Frontend)
- ✅ Deploy de volumes, configs, secrets
- ✅ Deploy de Database (primeiro)
- ✅ Deploy de Catalog e Authentication
- ✅ Deploy de Frontend
- ✅ Aplica Network Policy
- ✅ Aguarda todos os pods ficarem ready
- ✅ Mostra status e URLs

### Opção 2: Manual (Passo a Passo)

```bash
# 1. Namespace
kubectl apply -f kubernetes/namespaces/ecatalog-namespace.yaml

# 2. Storage
kubectl apply -f kubernetes/volumes/database-pv.yaml
kubectl apply -f kubernetes/volumes/database-pvc.yaml

# 3. ConfigMaps e Secrets
kubectl apply -f kubernetes/configmaps/catalog-configmap.yaml
kubectl apply -f kubernetes/configmaps/database-configmap.yaml
kubectl apply -f kubernetes/secrets/database-secret.yaml

# 4. Database (primeiro)
kubectl apply -f kubernetes/deployments/database-deployment.yaml
kubectl apply -f kubernetes/services/database-internal-service.yaml
kubectl wait --for=condition=ready pod -l app=database -n ecatalog --timeout=180s

# 5. Catalog
kubectl apply -f kubernetes/deployments/catalog-deployment.yaml
kubectl apply -f kubernetes/services/catalog-service.yaml
kubectl wait --for=condition=ready pod -l app=catalog -n ecatalog --timeout=180s

# 6. Network Policy
kubectl apply -f kubernetes/network-policies/database-access-policy.yaml

# 7. Authentication (opcional, se já não estiver deployed)
kubectl apply -f kubernetes/deployments/authentication-deployment.yaml
kubectl apply -f kubernetes/services/authentication-service.yaml
```

## ⚙️ Configuração

### ConfigMaps

**Catalog** (`catalog-configmap.yaml`):
- `DATABASE_URL`: URL interna do Database (`http://database-internal:8001`)
- `AUTHENTICATION_URL`: URL do Authentication Service
- `CATALOG_PORT`: Porta do Catalog (8000)

**Database** (`database-configmap.yaml`):
- `DB_PATH`: Caminho do ficheiro SQLite (`/data/ltplabs.db`)
- `LOAD_SEED_DATA`: `true` para carregar dados iniciais (dev), `false` em produção
- `SQLITE_TIMEOUT`: Timeout para operações SQLite

### Secrets

**Database** (`database-secret.yaml`):
- `ENCRYPTION_KEY`: Chave de encriptação (base64)
- `JWT_SECRET`: Secret para JWT tokens (base64)
- `BACKUP_PASSWORD`: Password para backups encriptados

⚠️ **IMPORTANTE**: Antes de produção, gerar secrets seguros:
```bash
# Gerar ENCRYPTION_KEY
openssl rand -base64 32

# Gerar JWT_SECRET
openssl rand -base64 64

# Criar secret no Kubernetes
kubectl create secret generic database-secret \
  --from-literal=ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=BACKUP_PASSWORD="sua-senha-forte" \
  -n ecatalog
```

## 🔐 Segurança

### Network Policy

A **Network Policy** (`database-access-policy.yaml`) garante que:
- ✅ **Apenas** pods com label `app=catalog` podem aceder ao Database
- ❌ Outros pods não podem comunicar com o Database
- ❌ Acesso externo ao Database é bloqueado

Para funcionar, o cluster precisa de um CNI plugin que suporte Network Policies:
```bash
# Minikube com Calico
minikube start --cni=calico
```

## 🔍 Verificação e Debug

### Ver Status dos Pods

```bash
kubectl get pods -n ecatalog
kubectl get pods -n ecatalog -o wide
```

### Ver Logs

```bash
# Catalog
kubectl logs -f deployment/catalog -n ecatalog

# Database
kubectl logs -f deployment/database -n ecatalog

# Logs anteriores (se pod crashou)
kubectl logs deployment/catalog -n ecatalog --previous
```

### Testar Conectividade

```bash
# Entrar no pod Catalog
kubectl exec -it deployment/catalog -n ecatalog -- /bin/bash

# Dentro do pod, testar comunicação com Database
curl http://database-internal:8001/health
```

### Ver Configurações

```bash
# Ver ConfigMaps
kubectl get configmap -n ecatalog
kubectl describe configmap catalog-config -n ecatalog

# Ver Secrets (valores em base64)
kubectl get secret database-secret -n ecatalog -o yaml

# Decodificar secret
kubectl get secret database-secret -n ecatalog -o jsonpath='{.data.ENCRYPTION_KEY}' | base64 -d
```

## 🔄 Atualizações

### Atualizar Configuração

```bash
# Editar ConfigMap
kubectl edit configmap catalog-config -n ecatalog

# Restart pods para aplicar mudanças
kubectl rollout restart deployment/catalog -n ecatalog
kubectl rollout restart deployment/database -n ecatalog
```

### Atualizar Imagem

```bash
# Rebuild imagem
docker build -t ecatalog/catalog:latest ./services/catalog

# Restart deployment (força pull da nova imagem)
kubectl rollout restart deployment/catalog -n ecatalog

# Ver status do rollout
kubectl rollout status deployment/catalog -n ecatalog
```

### Escalar Replicas

```bash
# Escalar Catalog (pode ter múltiplas replicas)
kubectl scale deployment/catalog --replicas=3 -n ecatalog

# Database SEMPRE 1 replica (SQLite = single writer)
```

## 🗑️ Limpeza

### Remover Tudo

```bash
# Remover namespace (apaga tudo)
kubectl delete namespace ecatalog

# Remover PV (não é apagado com namespace)
kubectl delete pv database-pv
```

### Remover Apenas Catalog + Database

```bash
kubectl delete deployment catalog database -n ecatalog
kubectl delete service catalog database-internal -n ecatalog
kubectl delete networkpolicy database-access-policy -n ecatalog
```

## 📊 URLs de Acesso

Após deploy, aceder via:

```
Catalog API:     http://<minikube-ip>:30800
Catalog Docs:    http://<minikube-ip>:30800/docs
Authentication:  http://<minikube-ip>:30080
```

Obter IP do Minikube:
```bash
minikube ip
```

## 🐛 Troubleshooting

### Pod não inicia

```bash
# Ver eventos
kubectl describe pod <pod-name> -n ecatalog

# Ver logs
kubectl logs <pod-name> -n ecatalog
```

### PVC não faz bind

```bash
# Ver status
kubectl get pvc -n ecatalog
kubectl describe pvc database-pvc -n ecatalog

# Verificar se PV existe
kubectl get pv
```

### Database não responde

```bash
# Ver se pod está running
kubectl get pods -l app=database -n ecatalog

# Entrar no pod e testar SQLite
kubectl exec -it deployment/database -n ecatalog -- /bin/bash
sqlite3 /data/ltplabs.db "SELECT COUNT(*) FROM admin;"
```

### Catalog não comunica com Database

```bash
# Testar DNS interno
kubectl exec -it deployment/catalog -n ecatalog -- nslookup database-internal

# Testar conectividade
kubectl exec -it deployment/catalog -n ecatalog -- curl http://database-internal:8001/health
```

## 📚 Recursos Adicionais

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

---

**Criado para: LTP Labs E-Catalog Project**  
**Versão: 1.0.0**
