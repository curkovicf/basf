# Builds the web app from the monorepo root:
#   docker build -f apps/web/angular/finder/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json nx.json tsconfig.base.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx nx build finder --configuration=production --skip-nx-cache

FROM nginx:1.29-alpine
COPY apps/web/angular/finder/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/finder/browser /usr/share/nginx/html
