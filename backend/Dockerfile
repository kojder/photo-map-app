# Photo Map Backend - Dockerfile
# Build: docker build -t photo-map-backend:latest .
# Run: docker-compose up (from deployment/)

FROM eclipse-temurin:17-jre-alpine

# Metadata
LABEL maintainer="Photo Map MVP"
LABEL description="Spring Boot backend for Photo Map application"

# Working directory
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy JAR (built locally with Maven)
COPY target/*.jar app.jar

# Create uploads directories
RUN mkdir -p /app/uploads/input /app/uploads/original /app/uploads/medium /app/uploads/failed

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-Xms256m", "-Xmx1024m", "-jar", "app.jar"]
