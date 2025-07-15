# Dockerfile for PandaWiki web/app (Next.js) with standalone output

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

# Set environment variable
ENV NODE_ENV=production

# Copy the standalone output from the builder stage.
# This includes the server and minimal node_modules.
COPY --from=builder /app/dist/standalone ./

# Copy the public folder and the static assets from the build output
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist/static ./dist/static

# Expose the port the app runs on
EXPOSE 3000

# Start the application using the standalone server.js
CMD ["node", "dist/server.js"]