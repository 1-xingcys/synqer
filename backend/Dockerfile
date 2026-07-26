# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies, devDependencies included since build tools are needed
# --ignore-scripts skips the native canvas compilation
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only (--ignore-scripts skips the native canvas compilation)
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy build output and Prisma Client from the build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port 8080 (required by GCP)
EXPOSE 8080

# Start the application
CMD ["node", "dist/src/main.js"]

