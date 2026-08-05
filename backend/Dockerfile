# --- Build ---
FROM node:24-alpine AS build
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

# --- Runtime ---
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY backend/assets ./assets
COPY backend/package.json ./
COPY backend/scripts ./scripts
COPY database ./database
EXPOSE 3000
USER node
# Bootstrap de BD idempotente y luego la API
CMD ["sh", "-c", "node scripts/bootstrap-db.js && node dist/main.js"]
