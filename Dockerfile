# React app: built with Node, served by nginx. Render (or any host) sets PORT; locally it defaults to 8080.

# ---- build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Backend URL baked into the bundle at build time, e.g. https://promotion-api.onrender.com (no trailing slash).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---- serve
FROM nginx:1.27-alpine
ENV PORT=8080
# The nginx image fills ${PORT} into templates at start-up.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
