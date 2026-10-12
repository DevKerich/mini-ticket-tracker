# Stage 1: build the React app
FROM node:22-alpine AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: API server (production deps only) + built UI
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client /client/dist ./public
ENV CLIENT_DIST=/app/public PORT=3000
EXPOSE 3000
USER node
# Migrations run automatically on startup (see src/server.js).
CMD ["node", "src/server.js"]
