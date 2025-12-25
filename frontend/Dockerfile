# -------- Build stage --------
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files first (better cache)
COPY package.json package-lock.json* ./

# Safe npm install
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source
COPY . .

# Build
RUN npm run build


# -------- Runtime stage --------
FROM nginx:alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
