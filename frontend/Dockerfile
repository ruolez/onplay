# Multi-stage build: compile the Vite app, then serve the static bundle from
# nginx. Production-only — for local development run `npm run dev` outside
# Docker (see CLAUDE.md), or use the dev docker-compose.yml which overrides
# the command to start the Vite dev server.

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time env vars (injected via docker-compose build args).
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
