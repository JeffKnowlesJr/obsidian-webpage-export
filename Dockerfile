# Multi-stage build for optimized Docker image
# Stage 1: Build the plugin with minimal Node.js image
FROM node:18-alpine AS plugin-builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install only production dependencies first, then dev dependencies
RUN npm ci --only=production && \
    npm ci --include=dev

# Copy build configuration and source code
COPY esbuild.config.mjs tsconfig*.json ./
COPY src ./src

# Build the plugin
RUN npm run build

# Stage 2: Build electron-injector with specific Rust version
FROM rust:1.89.0-slim AS injector-builder

# Install electron-injector in a single layer
RUN cargo install electron-injector --locked

# Stage 3: Final runtime image with optimizations
FROM debian:bookworm-slim AS runtime

# Set build arguments and environment
ARG DEBIAN_FRONTEND=noninteractive
ARG OBSIDIAN_VERSION=1.9.12
ENV TZ=Etc/UTC

# Create volumes
VOLUME ["/vault", "/output", "/config.json"]

# Install all dependencies in a single layer to minimize image size
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        libasound2 \
        xvfb \
        libgtk-3-0 \
        libxss1 \
        libgconf-2-4 \
        libxtst6 \
        libxrandr2 \
        libasound2 \
        libpangocairo-1.0-0 \
        libatk1.0-0 \
        libcairo-gobject2 \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0 && \
    # Download and install Obsidian in the same layer
    curl -L "https://github.com/obsidianmd/obsidian-releases/releases/download/v${OBSIDIAN_VERSION}/obsidian_${OBSIDIAN_VERSION}_amd64.deb" -o obsidian.deb && \
    apt-get install -y --no-install-recommends ./obsidian.deb && \
    # Clean up in the same layer to reduce image size
    rm -rf obsidian.deb \
           /var/lib/apt/lists/* \
           /tmp/* \
           /var/tmp/* && \
    apt-get autoremove -y && \
    apt-get clean

# Copy electron-injector binary
COPY --from=injector-builder /usr/local/cargo/bin/electron-injector /usr/local/bin/

# Copy plugin files
COPY --from=plugin-builder /app/main.js /app/styles.css /app/manifest.json /plugin/

# Copy docker scripts and make them executable
COPY docker/run.sh docker/export-vault.mjs /
RUN chmod +x /run.sh

# Set up Obsidian configuration in a single layer
RUN mkdir -p /root/.config/obsidian /output && \
    echo '{"vaults":{"94349b4f2b2e057a":{"path":"/vault","ts":1715257568671,"open":true}}}' > /root/.config/obsidian/obsidian.json

# Use exec form for better signal handling
CMD ["/run.sh"]
