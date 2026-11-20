# Build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=development

RUN npm install --global npm@11.19.1 \
    && npm --version

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Pacotes de produção
FROM node:22-bookworm-slim AS production-deps

WORKDIR /app

ENV NODE_ENV=production

RUN npm install --global npm@11.19.1 \
    && npm --version

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

# Imagem final
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system appgroup \
    && useradd --system \
--gid appgroup \
--create-home \
    appuser

RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm \
    /usr/local/bin/npx

COPY --from=production-deps \
    --chown=appuser:appgroup \
    /app/node_modules \
    ./node_modules

COPY --from=builder \
    --chown=appuser:appgroup \
    /app/dist \
    ./dist

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=20s \
            --retries=3 \
    CMD node -e "\
        require('http').get(\
        'http://127.0.0.1:3000/api/health',\
        res => process.exit(res.statusCode === 200 ? 0 : 1)\
        ).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]