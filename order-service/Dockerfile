# ---------- Stage 1: Build ----------
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:18-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install production dependencies only (no devDependencies)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Run as non-root user for security
USER node

EXPOSE 5005

CMD ["npm", "start"]
