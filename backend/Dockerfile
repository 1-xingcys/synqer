# The image Cloud Run runs in production. It is built and pushed to Artifact
# Registry by .github/workflows/deploy-to-gcp.yml, which then deploys it.
#
# Two things deliberately live outside this image:
#   * Runtime configuration. DATABASE_URL (Neon), the session secret and every
#     OAuth credential are set on the Cloud Run service itself in GCP, not
#     baked in here. `gcloud run deploy --image` replaces only the image, so
#     those values survive each deploy.
#   * Migrations. The workflow runs `prisma migrate deploy` against Neon before
#     this image is deployed, so the container never migrates on startup.
#
# Local development does not use this file at all — see backend/docker-compose.yml
# for the local database and the repo root's nginx.conf for the request chain.

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

