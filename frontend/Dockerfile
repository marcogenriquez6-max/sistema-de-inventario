# --- Build del frontend ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY angular.json tsconfig.json tsconfig.app.json proxy.conf.json ./
COPY src ./src
COPY public ./public
RUN npm run build

# --- Servidor estático + proxy inverso /api ---
FROM nginx:alpine AS runtime
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
