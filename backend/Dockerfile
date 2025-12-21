# ---- Build stage ----
FROM node:20-bullseye AS builder

# Set working directory
WORKDIR /app

# Install system dependencies (for prisma and builds)
RUN apt-get update && apt-get install -y \
    bash git python3 make g++ curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build TypeScript (exclude Prisma seeds from build)
RUN npm run build

# ---- Runtime stage ----
FROM node:20-bullseye

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl curl bash \
    && rm -rf /var/lib/apt/lists/*

# Copy built app and node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Expose port (adjust if your NestJS app uses another port)
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]
