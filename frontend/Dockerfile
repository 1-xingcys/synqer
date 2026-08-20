# The image Cloud Run runs in production. It is built and pushed to Artifact
# Registry by .github/workflows/deploy-to-gcp.yml, which supplies the build
# arguments below from GitHub secrets.
#
# The thing to know before changing production configuration: NEXT_PUBLIC_*
# variables are inlined into the client bundle during `npm run build`, so they
# are frozen into the image. Editing them on the Cloud Run service does
# nothing; the image has to be rebuilt and redeployed.
#
# NEXT_PUBLIC_SITE_URL is intentionally absent. It is not passed as a build
# argument, so production falls back to the DEFAULT_SITE_URL constant in
# lib/seo/site.ts. Adding it here would also mean adding it to the workflow's
# build-args and to the repository secrets.

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments (NEXT_PUBLIC_* variables must exist at build time).
# NEXT_PUBLIC_API is the absolute API origin in production, unlike the relative
# /api used locally, because there is no nginx in front of Cloud Run to merge
# the two services into one origin.
ARG NEXT_PUBLIC_API
ARG NEXT_PUBLIC_LINE_LIFF_ID

# Promote build arguments to environment variables for the Next.js build
ENV NEXT_PUBLIC_API=${NEXT_PUBLIC_API}
ENV NEXT_PUBLIC_LINE_LIFF_ID=${NEXT_PUBLIC_LINE_LIFF_ID}

# Copy package files
COPY package*.json ./

# Install dependencies, devDependencies included since build tools are needed
RUN npm ci

# Copy frontend source
COPY . .

# Build the application (standalone mode produces an optimized output)
# NEXT_PUBLIC_* variables are inlined into the client bundle at this stage
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Copy the standalone output from the build stage
# Next.js standalone mode emits .next/standalone with everything needed to run
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port 8080 (required by GCP)
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
