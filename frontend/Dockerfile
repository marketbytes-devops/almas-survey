FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./

# Clean npm cache and use ci for more reliable builds
RUN npm cache clean --force && \
    npm ci --prefer-offline --no-audit

COPY . .
RUN npm run build 

FROM nginx:alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]