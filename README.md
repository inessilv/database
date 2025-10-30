## 🚀 Quick Start

### **Opção 1: Docker Compose (Recomendado para Testes Locais)**

```bash
# Iniciar stack completa
docker-compose up --build

# URLs disponíveis:
# Frontend:        http://localhost:3000
# API Gateway:     http://localhost:8000
# Request Service: http://localhost:8004
```

**Parar:**
```bash
docker-compose down
```

---

### **Opção 2: Kubernetes (Ambiente Produção-Like)**

```bash
# Deploy completo (comando único mas ainda não está a funcionar)
./scripts/deploy-k8s.sh
```

**Ou passo a passo:**

```bash
# 1. Iniciar Minikube
minikube start

# 2. Deploy
cd ~/Desktop/5ºAno/Projeto_Informatica/projeto_ltp_labs && \
eval $(minikube docker-env) && \
cd services/request-service && docker build -t ecatalog/request-service:latest . && cd ../.. && \
cd services/api-gateway && docker build -t ecatalog/api-gateway:latest . && cd ../.. && \
cd frontend && echo "VITE_API_URL=http://$(minikube ip):30800" > .env && docker build -t ecatalog/frontend:latest . && cd .. && \
kubectl apply -f kubernetes/namespaces/ecatalog-namespace.yaml && \
kubectl apply -f kubernetes/deployments/request-service-deployment.yaml && \
kubectl apply -f kubernetes/services/request-service-service.yaml && \
kubectl apply -f kubernetes/deployments/api-gateway-deployment.yaml && \
kubectl apply -f kubernetes/services/api-gateway-service.yaml && \
kubectl apply -f kubernetes/deployments/frontend-deployment.yaml && \
kubectl apply -f kubernetes/services/frontend-service.yaml && \
kubectl wait --for=condition=ready pod -l app=request-service -n ecatalog --timeout=120s && \
kubectl wait --for=condition=ready pod -l app=api-gateway -n ecatalog --timeout=120s && \
kubectl wait --for=condition=ready pod -l app=frontend -n ecatalog --timeout=120s

# 3. Ver URLs
MINIKUBE_IP=$(minikube ip)
echo "Frontend:    http://$MINIKUBE_IP:30300"
echo "API Gateway: http://$MINIKUBE_IP:30800"
```

## 🧪 Testes

### **Testar Comunicação (Docker Compose)**

```bash
# Health checks
curl http://localhost:8004/health  # Request Service
curl http://localhost:8000/health  # API Gateway
curl http://localhost:3000/health  # Frontend

# Listar pedidos
curl http://localhost:8000/api/requests/all

# Abrir Frontend
xdg-open http://localhost:3000
```

---

### **Testar Comunicação (Kubernetes)**

```bash
MINIKUBE_IP=$(minikube ip)

# Health checks
curl http://$MINIKUBE_IP:30800/health

# Listar pedidos
curl http://$MINIKUBE_IP:30800/api/requests/all

# Abrir Frontend
xdg-open http://$MINIKUBE_IP:30300
```

---


## 🐛 Troubleshooting

### **Problema: Porta já em uso (Docker Compose)**

```bash
# Ver processos usando portas
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :8004

# Matar processo
sudo kill -9 <PID>

# Ou usar portas diferentes no docker-compose.yml
```

---

### **Problema: Imagens antigas no Kubernetes**

```bash
# Limpar deployment
kubectl delete namespace ecatalog

# Garantir uso do Docker do Minikube
eval $(minikube docker-env)

# Verificar imagens
docker images | grep ecatalog

# Remover imagens antigas (opcional)
docker rmi ecatalog/request-service:latest
docker rmi ecatalog/api-gateway:latest
docker rmi ecatalog/frontend:latest

# Rebuild e redeploy
# ... (ver seção Deploy Kubernetes)
```

---

### **Problema: Pods não ficam Running**

```bash
# Ver status dos pods
kubectl get pods -n ecatalog

# Ver logs de um pod específico
kubectl logs <pod-name> -n ecatalog

# Ver eventos
kubectl describe pod <pod-name> -n ecatalog

# Ver eventos do namespace
kubectl get events -n ecatalog --sort-by='.lastTimestamp'
```

---

### **Problema: Frontend não conecta ao API Gateway (Kubernetes)**

```bash
# Verificar se .env foi criado corretamente
cd frontend
cat .env

# Deve ter: VITE_API_URL=http://<MINIKUBE_IP>:30800

# Rebuild frontend
MINIKUBE_IP=$(minikube ip)
echo "VITE_API_URL=http://${MINIKUBE_IP}:30800" > .env
docker build -t ecatalog/frontend:latest .

# Restart deployment
kubectl rollout restart deployment/frontend -n ecatalog
```


## 🗑️ Limpeza

### **Docker Compose**

```bash
# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Parar e remover imagens
docker-compose down -v --rmi all

# Limpar tudo (containers, volumes, networks)
docker system prune -a --volumes
```

---

### **Kubernetes**

```bash
# Remover namespace (remove tudo!)
kubectl delete namespace ecatalog

# Ou remover individualmente
kubectl delete -f kubernetes/deployments/
kubectl delete -f kubernetes/services/
kubectl delete -f kubernetes/namespaces/

# Parar Minikube
minikube stop

# Remover cluster Minikube
minikube delete
```

---

### **Limpar Imagens Docker (Minikube)**

```bash
# Usar Docker do Minikube
eval $(minikube docker-env)

# Listar imagens
docker images | grep ecatalog

# Remover imagens
docker rmi ecatalog/request-service:latest
docker rmi ecatalog/api-gateway:latest
docker rmi ecatalog/frontend:latest

# Voltar ao Docker local
eval $(minikube docker-env -u)
```

---

## 📊 Comandos Úteis

### **Docker Compose**

```bash
# Ver logs em tempo real
docker-compose logs -f

# Logs de serviço específico
docker-compose logs -f request-service
docker-compose logs -f api-gateway
docker-compose logs -f frontend

# Rebuild serviço específico
docker-compose up --build request-service
docker-compose up --build api-gateway
docker-compose up --build frontend

# Ver containers ativos
docker-compose ps

# Restart serviço
docker-compose restart request-service
```

---

### **Kubernetes**

```bash
# Ver todos os recursos
kubectl get all -n ecatalog

# Ver pods com mais detalhes
kubectl get pods -n ecatalog -o wide

# Ver logs em tempo real
kubectl logs -f deployment/request-service -n ecatalog
kubectl logs -f deployment/api-gateway -n ecatalog
kubectl logs -f deployment/frontend -n ecatalog

# Entrar num pod
kubectl exec -it deployment/request-service -n ecatalog -- /bin/bash

# Port-forward (acesso local)
kubectl port-forward deployment/request-service 8004:8004 -n ecatalog

# Escalar replicas
kubectl scale deployment/request-service --replicas=3 -n ecatalog

# Restart deployment
kubectl rollout restart deployment/request-service -n ecatalog

# Ver status do rollout
kubectl rollout status deployment/request-service -n ecatalog

# Ver histórico de deploys
kubectl rollout history deployment/request-service -n ecatalog

# Voltar para versão anterior
kubectl rollout undo deployment/request-service -n ecatalog
```
---

## 📈 Monitorização

### **Docker Compose**

```bash
# Ver uso de recursos
docker stats

# Ver logs de erros
docker-compose logs --tail=100 | grep -i error
```

---

### **Kubernetes**

```bash
# Ver uso de recursos dos pods
kubectl top pods -n ecatalog

# Ver uso de recursos dos nodes
kubectl top nodes

# Dashboard do Kubernetes (opcional)
minikube dashboard
```

---

## 🎯 Fluxo de Trabalho Recomendado

### **Para Desenvolvimento:**

1. Testar mudanças com **Docker Compose** (validar containers)
1. Deploy final em **Kubernetes** (validar produção)

### **Para Testes:**

1. Usar **Docker Compose** (setup rápido, fácil debug)

### **Para Demonstração:**

1. Usar **Kubernetes** (ambiente realista, escalável)

---