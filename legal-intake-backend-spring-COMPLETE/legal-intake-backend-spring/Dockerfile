# ================================================================
# DOCKERFILE FOR SPRING BOOT BACKEND
#
# MULTI-STAGE BUILD:
# Stage 1 (builder) = compile the Java code and create the fat JAR
# Stage 2 (runtime) = lean image with just the JRE to run the JAR
#
# Why multi-stage?
# The Maven + JDK image is ~600MB. The final JRE image is ~250MB.
# We don't ship the compiler/build tools to production — only what's needed to RUN.
#
# This replaces the Node Dockerfile which was:
#   FROM node:20-alpine
#   WORKDIR /app
#   COPY package*.json ./
#   RUN npm install
#   COPY . .
#   EXPOSE 3000
#   CMD ["node", "src/server.js"]
# ================================================================

# ---- Stage 1: Build ----
# eclipse-temurin = OpenJDK distribution (free, production-grade)
# 21-jdk-alpine = Java 21 with JDK (we need JDK to compile), Alpine = small Linux distro
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper first (so Docker can cache the dependency download layer)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

RUN chmod +x mvnw

# Download all dependencies (cached layer - won't re-download unless pom.xml changes)
# This is the equivalent of: COPY package*.json ./ && RUN npm install
RUN ./mvnw dependency:go-offline -q

# Copy source code
COPY src/ src/

# Build the fat JAR (compile + package, skip tests for faster Docker builds)
# Output: target/legal-intake-backend-1.0.0.jar
RUN ./mvnw package -DskipTests -q

# ---- Stage 2: Runtime ----
# Only JRE needed to run the JAR (not full JDK)
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create the uploads directory (same path as in application.properties)
RUN mkdir -p /app/uploads

# Copy ONLY the fat JAR from the build stage (nothing else)
COPY --from=builder /app/target/*.jar app.jar

# Port 3000 - same as Node backend so docker-compose and EC2 security groups don't change
EXPOSE 3000

# Health check (same concept as your Node /health endpoint)
# Docker will call this every 30 seconds to check if the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Run the Spring Boot fat JAR
# java -jar app.jar = starts embedded Tomcat, connects to DB, seeds admin, starts serving
# This replaces: CMD ["node", "src/server.js"]
ENTRYPOINT ["java", "-jar", "app.jar"]
