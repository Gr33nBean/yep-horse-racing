# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for yarn support
RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Enable corepack
RUN corepack enable

COPY package.json yarn.lock ./
# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
# Copy built server from builder
COPY --from=builder /app/dist-server ./dist-server

EXPOSE 3000

CMD ["node", "dist-server/index.cjs"]
