# Photo Map Frontend - Dockerfile
# Build Angular locally first: ng build --configuration production
# Build image: docker build -t photo-map-frontend:latest .
# Run: docker-compose up (from deployment/)

FROM nginx:alpine

# Metadata
LABEL maintainer="Photo Map MVP"
LABEL description="Nginx + Angular frontend for Photo Map application"

# Copy Angular build (from local dist/)
COPY dist/frontend/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Nginx runs in foreground (default CMD from nginx:alpine)
