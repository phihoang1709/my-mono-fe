FROM node:22-alpine AS builder

RUN apk update && apk upgrade --no-cache
RUN apk add --no-cache python3 make g++

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# 1. Copy file dependency
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# 2. Fetch dependencies to cache
RUN pnpm fetch

# 3. Install from cache (offline mode)
RUN pnpm install -r --offline --frozen-lockfile

# 4. Copy source code
COPY . .

# 5. Build (project.json: 'dist/apps/portal')
ARG APP_NAME=portal
RUN pnpm nx build ${APP_NAME} --skip-nx-cache

# --- STAGE 2: RUNTIME (PRODUCTION) ---
FROM nginx:1.25-alpine-slim AS runtime

RUN apk update && apk upgrade --no-cache
ARG APP_NAME=portal

# Copy config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/apps/${APP_NAME} /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]