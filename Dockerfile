FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies
RUN npm run install:all

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy built frontend
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/next.config.js ./frontend/next.config.js

# Copy backend
COPY --from=builder /app/backend ./backend

# Copy root files
COPY --from=builder /app/package.json ./package.json

# Install production dependencies
RUN npm install --production
RUN cd frontend && npm install --production
RUN cd backend && npm install --production

# Copy start script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000 5000

CMD ["./docker-entrypoint.sh"]
