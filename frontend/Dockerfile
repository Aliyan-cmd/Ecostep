# Stage 1: Build the React Application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package descriptors and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy application source and build static assets
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static assets from the Vite builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port (Configured externally via volume mount in compose)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
