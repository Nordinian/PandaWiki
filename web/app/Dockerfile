# Dockerfile for PandaWiki web/app (Next.js)

# Stage 1: Build the Next.js application
FROM node:20-slim AS builder
# Set working directory
WORKDIR /app

# Copy package.json and lockfile
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Production image
FROM node:20-slim AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy built assets from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]