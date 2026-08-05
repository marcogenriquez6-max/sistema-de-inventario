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
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY config.js.template /etc/nginx/config.js.template
# Sustituye solo ${API_UPSTREAM} (default "http://api" para docker-compose) y
# ${API_ORIGIN} (vacio en local; en Render la URL publica HTTPS de la API).
ENV API_UPSTREAM=http://api
ENV API_ORIGIN=
CMD sh -c "envsubst '\${API_UPSTREAM}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && envsubst '\${API_ORIGIN}' < /etc/nginx/config.js.template > /usr/share/nginx/html/config.js && nginx -g 'daemon off;'"
