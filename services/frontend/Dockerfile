FROM node:22-alpine AS build

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci --silent

# Copiar código fonte
COPY . .

# Build para produção (Vite vai usar VITE_API_URL do .env)
RUN npm run build

# ============================================
# STAGE 2: Servir com Nginx
# ============================================
FROM nginx:alpine

# Remover configuração default do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar build da stage anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração nginx customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# CMD já vem do nginx:alpine, não precisamos sobrescrever