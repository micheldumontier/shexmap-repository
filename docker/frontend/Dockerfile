# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/index.html ./
COPY frontend/src ./src
COPY frontend/public ./public

# Pass build-time env vars (values come from docker-compose env_file or build args)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_SPARQL_ENDPOINT=/sparql
ARG VITE_AUTH_ENABLED=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SPARQL_ENDPOINT=$VITE_SPARQL_ENDPOINT
ENV VITE_AUTH_ENABLED=$VITE_AUTH_ENABLED

RUN npm run build

# ── Stage 2: Serve via nginx ──────────────────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
