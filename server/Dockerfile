# ==========================================
# STAGE 1: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies needed for node-gyp/native builds (if any)
RUN apk add --no-cache python3 make g++

# Copy package config and lock files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Remove development dependencies to keep output image small
RUN npm prune --production

# ==========================================
# STAGE 2: Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

# Copy runtime binaries and Prisma configurations
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 5000

# Run in production mode using node command
CMD ["node", "dist/index.js"]
