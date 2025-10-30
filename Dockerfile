# -------------------------
# 🌍 Stage 1: Dependencies & Build
# -------------------------
FROM node:20-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./

# Install dependencies using npm ci for clean, reproducible builds
RUN npm ci

# Copy the rest of the project files
COPY . .

# Build the Next.js app (this creates the .next folder)
RUN npm run build


# 🚀 Stage 2: Production Runtime
FROM node:20-alpine AS runner

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Set working directory
WORKDIR /app

# Copy only necessary build artifacts and dependencies from builder
# This keeps the image small and secure
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Install only production dependencies (no devDependencies)
RUN npm ci --only=production && npm cache clean --force

# Expose the app port
EXPOSE 3000

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the Next.js server
CMD ["npm", "start"]