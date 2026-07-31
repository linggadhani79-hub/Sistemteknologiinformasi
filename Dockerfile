# syntax=docker/dockerfile:1
# =====================================================================
#  SIAKAD Terpadu — Single-container image untuk Google Cloud Run
#  API Express sekaligus menyajikan SPA React (build). Listen di $PORT.
# =====================================================================

# ---- 1. Build frontend (React + Vite) ----
FROM node:22-bookworm-slim AS frontend
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- 2. Build backend (TypeScript + Prisma) ----
FROM node:22-bookworm-slim AS backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package.json ./
RUN npm install --no-audit --no-fund
COPY backend/ ./
RUN npx prisma generate && npm run build

# ---- 3. Runtime ----
FROM node:22-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Dependency + hasil build backend (termasuk Prisma Client & CLI untuk migrate/seed)
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/dist ./dist
COPY --from=backend /app/prisma ./prisma
COPY --from=backend /app/package.json ./package.json
# SPA hasil build disajikan sebagai static (PUBLIC_DIR default: ../public dari dist)
COPY --from=frontend /fe/dist ./public
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 8080
CMD ["./docker-entrypoint.sh"]
