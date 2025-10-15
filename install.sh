#!/bin/bash

# OnPlay Installation Script
# For Ubuntu 24.04 LTS with static IP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Installation paths
INSTALL_DIR="/opt/onplay"
NGINX_CONF="/etc/nginx/sites-available/onplay"
NGINX_ENABLED="/etc/nginx/sites-enabled/onplay"
CERTBOT_RENEWAL_HOOK="/etc/letsencrypt/renewal-hooks/deploy/onplay-reload.sh"

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Check for previous installation
check_previous_installation() {
    if [ -d "$INSTALL_DIR" ] || docker ps -a | grep -q "onplay"; then
        return 0
    fi
    return 1
}

# Clean up previous installation
cleanup_installation() {
    print_info "Cleaning up previous OnPlay installation..."

    # Stop and remove Docker containers
    if docker ps -a | grep -q "onplay"; then
        print_info "Stopping OnPlay Docker containers..."
        cd "$INSTALL_DIR" 2>/dev/null || true
        docker-compose down -v 2>/dev/null || true
        docker ps -a | grep "onplay" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true
    fi

    # Remove Docker images
    print_info "Removing OnPlay Docker images..."
    docker images | grep "onplay" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

    # Remove installation directory
    if [ -d "$INSTALL_DIR" ]; then
        print_info "Removing installation directory..."
        rm -rf "$INSTALL_DIR"
    fi

    # Remove nginx configuration
    if [ -f "$NGINX_ENABLED" ]; then
        print_info "Removing nginx configuration..."
        rm -f "$NGINX_ENABLED"
    fi
    if [ -f "$NGINX_CONF" ]; then
        rm -f "$NGINX_CONF"
    fi

    # Reload nginx if installed
    if command -v nginx &> /dev/null; then
        systemctl reload nginx 2>/dev/null || true
    fi

    print_success "Previous installation cleaned up successfully"
}

# Complete system cleanup (removes ALL Docker containers and nginx configs)
complete_system_cleanup() {
    print_error "⚠️  WARNING: COMPLETE SYSTEM CLEANUP ⚠️"
    echo ""
    print_warning "This will remove:"
    echo "  - ALL Docker containers (running and stopped)"
    echo "  - ALL Docker images"
    echo "  - ALL Docker volumes"
    echo "  - ALL Docker networks (except defaults)"
    echo "  - ALL Nginx site configurations"
    echo "  - ALL SSL certificates (Let's Encrypt)"
    echo "  - Docker build cache"
    echo ""
    print_error "This action CANNOT be undone!"
    echo ""
    read -p "Type 'YES I UNDERSTAND' to proceed: " confirmation

    if [ "$confirmation" != "YES I UNDERSTAND" ]; then
        print_info "Cleanup cancelled"
        return 1
    fi

    echo ""
    print_info "Starting complete system cleanup..."

    # Stop all Docker containers
    print_info "Stopping all Docker containers..."
    if [ "$(docker ps -q)" ]; then
        docker stop $(docker ps -q) 2>/dev/null || true
    fi

    # Remove all Docker containers
    print_info "Removing all Docker containers..."
    if [ "$(docker ps -aq)" ]; then
        docker rm -f $(docker ps -aq) 2>/dev/null || true
    fi

    # Remove all Docker images
    print_info "Removing all Docker images..."
    if [ "$(docker images -q)" ]; then
        docker rmi -f $(docker images -q) 2>/dev/null || true
    fi

    # Remove all Docker volumes
    print_info "Removing all Docker volumes..."
    if [ "$(docker volume ls -q)" ]; then
        docker volume rm $(docker volume ls -q) 2>/dev/null || true
    fi

    # Remove all Docker networks (except defaults)
    print_info "Removing all custom Docker networks..."
    docker network ls --format '{{.Name}}' | grep -v -E '^(bridge|host|none)$' | xargs -r docker network rm 2>/dev/null || true

    # Prune Docker system
    print_info "Cleaning Docker system (cache, build cache, etc.)..."
    docker system prune -a -f --volumes 2>/dev/null || true

    # Remove all nginx site configurations
    print_info "Removing all Nginx site configurations..."
    rm -f /etc/nginx/sites-enabled/* 2>/dev/null || true
    rm -f /etc/nginx/sites-available/* 2>/dev/null || true

    # Restore default nginx config
    if [ -f /etc/nginx/nginx.conf.dpkg-old ]; then
        cp /etc/nginx/nginx.conf.dpkg-old /etc/nginx/nginx.conf
    fi

    # Test and reload nginx
    if command -v nginx &> /dev/null; then
        nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
    fi

    # Remove all Let's Encrypt certificates
    print_info "Removing all SSL certificates..."
    if [ -d /etc/letsencrypt/live ]; then
        for cert in /etc/letsencrypt/live/*/; do
            if [ -d "$cert" ]; then
                domain=$(basename "$cert")
                certbot delete --cert-name "$domain" --non-interactive 2>/dev/null || true
            fi
        done
    fi

    # Clean up renewal hooks
    rm -rf /etc/letsencrypt/renewal-hooks/deploy/* 2>/dev/null || true

    # Remove common installation directories
    print_info "Removing common application directories..."
    rm -rf /opt/onplay 2>/dev/null || true
    rm -rf /opt/app 2>/dev/null || true
    rm -rf /var/www/html/* 2>/dev/null || true

    print_success "Complete system cleanup finished!"
    echo ""
    print_info "Your system is now clean. Docker, Nginx, and Certbot are still installed."
    print_info "You can now proceed with a fresh installation."
    echo ""
}

# Install system dependencies
install_dependencies() {
    print_info "Installing system dependencies..."

    apt-get update
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common \
        git \
        nginx \
        certbot \
        python3-certbot-nginx

    print_success "System dependencies installed"
}

# Install Docker
install_docker() {
    if command -v docker &> /dev/null; then
        print_info "Docker is already installed"
        docker --version
        return
    fi

    print_info "Installing Docker..."

    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    print_success "Docker installed successfully"
    docker --version
}

# Get domain from user
get_domain() {
    while true; do
        echo ""
        read -p "Enter your domain name (e.g., onplay.site): " DOMAIN

        if [ -z "$DOMAIN" ]; then
            print_error "Domain name cannot be empty"
            continue
        fi

        # Validate domain format
        if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
            print_error "Invalid domain format. Please enter a valid domain (e.g., example.com)"
            continue
        fi

        echo ""
        print_info "Domain: $DOMAIN"
        read -p "Is this correct? (y/n): " confirm

        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            break
        fi
    done
}

# Setup application files
setup_application() {
    print_info "Setting up OnPlay application..."

    # Create installation directory
    mkdir -p "$INSTALL_DIR"

    # Copy application files
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

    print_info "Copying application files from $SCRIPT_DIR to $INSTALL_DIR..."

    # Copy all files except node_modules and build artifacts
    rsync -av --progress \
        --exclude 'node_modules' \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude 'build' \
        --exclude '.vite' \
        "$SCRIPT_DIR/" "$INSTALL_DIR/"

    # Create media directories
    mkdir -p "$INSTALL_DIR/media/original"
    mkdir -p "$INSTALL_DIR/media/hls"
    mkdir -p "$INSTALL_DIR/media/thumbnails"

    # Set proper permissions
    chmod -R 755 "$INSTALL_DIR"

    print_success "Application files set up successfully"
}

# Create production docker-compose file
create_production_compose() {
    print_info "Creating production docker-compose configuration..."

    cat > "$INSTALL_DIR/docker-compose.prod.yml" << 'EOF'
version: '3.8'

name: onplay

services:
  nginx:
    build: ./nginx
    ports:
      - "8080:80"
    volumes:
      - ./media:/var/www/media:ro
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - api
      - frontend
    restart: unless-stopped

  api:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8002 --workers 4
    expose:
      - "8002"
    environment:
      - DATABASE_URL=postgresql://mediauser:${DB_PASSWORD}@postgres:5432/mediadb
      - REDIS_URL=redis://redis:6379/0
      - MEDIA_ROOT=/media
      - CORS_ORIGINS=https://${DOMAIN}
    volumes:
      - ./backend:/app
      - ./media:/media
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  worker:
    build: ./backend
    command: celery -A app.celery_app worker --loglevel=info --concurrency=4
    environment:
      - DATABASE_URL=postgresql://mediauser:${DB_PASSWORD}@postgres:5432/mediadb
      - REDIS_URL=redis://redis:6379/0
      - MEDIA_ROOT=/media
    volumes:
      - ./backend:/app
      - ./media:/media
      - nginx_logs:/var/log/nginx:ro
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    deploy:
      replicas: 2

  beat:
    build: ./backend
    command: celery -A app.celery_app beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://mediauser:${DB_PASSWORD}@postgres:5432/mediadb
      - REDIS_URL=redis://redis:6379/0
      - MEDIA_ROOT=/media
    volumes:
      - ./backend:/app
      - ./media:/media
      - nginx_logs:/var/log/nginx:ro
    depends_on:
      - redis
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        - VITE_API_URL=https://${DOMAIN}/api
        - VITE_WS_URL=wss://${DOMAIN}/ws
    expose:
      - "5173"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=mediadb
      - POSTGRES_USER=mediauser
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  nginx_logs:
EOF

    print_success "Production docker-compose configuration created"
}

# Create production nginx configuration
create_production_nginx_conf() {
    print_info "Creating production nginx configuration for Docker..."

    cat > "$INSTALL_DIR/nginx/nginx.prod.conf" << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    log_format bandwidth '$remote_addr|$time_iso8601|$request_uri|$body_bytes_sent|$status|$request_time';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 5G;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/javascript application/xml+rss
               application/json application/vnd.ms-fontobject application/x-font-ttf
               font/opentype image/svg+xml image/x-icon;

    upstream frontend {
        server frontend:5173;
    }

    upstream api {
        server api:8002;
    }

    server {
        listen 80;

        # Frontend (React app)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints
        location /api {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 300s;
        }

        # WebSocket
        location /ws {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
        }

        # Media files (HLS segments, thumbnails)
        location /media {
            alias /var/www/media;
            expires 30d;
            add_header Cache-Control "public, immutable";
            add_header Access-Control-Allow-Origin *;

            # Bandwidth tracking for HLS segments
            access_log /var/log/nginx/bandwidth.log bandwidth;

            # HLS specific
            location ~ \.(m3u8)$ {
                add_header Cache-Control "no-cache";
                add_header Access-Control-Allow-Origin *;
            }

            location ~ \.(ts)$ {
                add_header Cache-Control "public, max-age=31536000, immutable";
                add_header Access-Control-Allow-Origin *;
            }
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

    print_success "Production nginx configuration created"
}

# Create system nginx reverse proxy configuration (HTTP only, SSL will be added by certbot)
create_system_nginx_conf() {
    print_info "Creating initial nginx configuration (HTTP only)..."

    cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Proxy settings
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_buffering off;
    client_max_body_size 5G;

    # Proxy to Docker nginx container
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:80/health;
        access_log off;
    }
}
EOF

    # Enable site
    ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

    print_success "Initial nginx configuration created"
}

# Update nginx configuration with SSL settings after certificate is obtained
update_nginx_ssl_config() {
    print_info "Updating nginx configuration with SSL settings..."

    cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL certificates (configured by certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_buffering off;
    client_max_body_size 5G;

    # Proxy to Docker nginx container
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:80/health;
        access_log off;
    }
}
EOF

    # Test and reload nginx
    nginx -t && systemctl reload nginx

    print_success "Nginx configuration updated with SSL"
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    print_info "Setting up SSL certificate with Let's Encrypt..."

    # Create directory for certbot webroot
    mkdir -p /var/www/certbot

    # Test nginx configuration
    nginx -t

    # Reload nginx to enable HTTP server for verification
    systemctl reload nginx

    # Obtain SSL certificate
    print_info "Obtaining SSL certificate for $DOMAIN..."
    print_warning "Make sure your domain DNS is pointing to this server's IP address"

    read -p "Press Enter to continue with SSL certificate request..."

    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}" || {
        print_error "Failed to obtain SSL certificate"
        print_info "Please check:"
        print_info "1. Domain DNS is correctly pointing to this server"
        print_info "2. Port 80 and 443 are open in firewall"
        print_info "3. No other service is using port 80 or 443"
        exit 1
    }

    print_success "SSL certificate obtained successfully"
}

# Setup SSL auto-renewal
setup_ssl_renewal() {
    print_info "Setting up SSL certificate auto-renewal..."

    # Create renewal hook script
    mkdir -p /etc/letsencrypt/renewal-hooks/deploy

    cat > "$CERTBOT_RENEWAL_HOOK" << 'EOF'
#!/bin/bash
# Reload nginx after certificate renewal
systemctl reload nginx
docker-compose -f /opt/onplay/docker-compose.prod.yml restart nginx
EOF

    chmod +x "$CERTBOT_RENEWAL_HOOK"

    # Test renewal
    print_info "Testing SSL certificate renewal..."
    certbot renew --dry-run

    # Certbot automatically sets up a systemd timer for renewal
    print_success "SSL auto-renewal configured successfully"
}

# Create environment file
create_env_file() {
    print_info "Creating environment configuration..."

    # Generate random database password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

    cat > "$INSTALL_DIR/.env" << EOF
# OnPlay Production Environment Configuration
DOMAIN=${DOMAIN}
DB_PASSWORD=${DB_PASSWORD}
EOF

    chmod 600 "$INSTALL_DIR/.env"

    print_success "Environment configuration created"
}

# Update frontend Dockerfile for production
update_frontend_dockerfile() {
    print_info "Updating frontend Dockerfile for production..."

    cat > "$INSTALL_DIR/frontend/Dockerfile" << 'EOF'
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL

# Set environment variables
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
EOF

    # Create nginx config for frontend container
    cat > "$INSTALL_DIR/frontend/nginx.conf" << 'EOF'
server {
    listen 5173;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    print_success "Frontend Dockerfile updated for production"
}

# Start application
start_application() {
    print_info "Starting OnPlay application..."

    cd "$INSTALL_DIR"

    # Load environment variables
    export $(grep -v '^#' .env | xargs)

    # Build and start services
    docker compose -f docker-compose.prod.yml build
    docker compose -f docker-compose.prod.yml up -d

    print_success "OnPlay application started successfully"
}

# Display installation summary
display_summary() {
    echo ""
    echo "======================================"
    print_success "OnPlay Installation Complete!"
    echo "======================================"
    echo ""
    print_info "Installation Details:"
    echo "  - Installation Directory: $INSTALL_DIR"
    echo "  - Domain: https://${DOMAIN}"
    echo "  - SSL Certificate: Let's Encrypt (Auto-renewal enabled)"
    echo "  - Database Password: Stored in $INSTALL_DIR/.env"
    echo ""
    print_info "Container Status:"
    cd "$INSTALL_DIR"
    docker compose -f docker-compose.prod.yml ps
    echo ""
    print_info "Useful Commands:"
    echo "  - View logs: cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml logs -f"
    echo "  - Restart services: cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml restart"
    echo "  - Stop services: cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml down"
    echo "  - Start services: cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml up -d"
    echo "  - Check SSL renewal: certbot renew --dry-run"
    echo ""
    print_info "Your site should now be accessible at: https://${DOMAIN}"
    echo ""
}

# Update existing installation
update_installation() {
    print_info "Updating OnPlay installation..."

    cd "$INSTALL_DIR"

    # Check if we're in a git repository, if not initialize it
    if [ ! -d ".git" ]; then
        print_warning "Installation directory is not a git repository. Initializing..."

        # Initialize git repository
        git init
        git remote add origin https://github.com/ruolez/onplay.git

        print_info "Fetching latest code..."
        git fetch origin

        # Reset to match remote (this will overwrite local files)
        print_warning "This will overwrite any local modifications..."
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            print_info "Update cancelled"
            exit 0
        fi

        git reset --hard origin/main
        git branch --set-upstream-to=origin/main main 2>/dev/null || git branch -M main

        print_success "Git repository initialized"
    fi

    # Backup .env if it exists
    if [ -f .env ]; then
        print_info "Backing up .env file..."
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    fi

    # Pull latest code
    print_info "Pulling latest code from GitHub..."
    git fetch origin
    git pull origin main
    if [ $? -ne 0 ]; then
        print_error "Failed to pull latest code"
        exit 1
    fi
    print_success "Code updated successfully"

    # Stop containers
    print_info "Stopping containers..."
    docker compose -f docker-compose.prod.yml down --remove-orphans

    # Rebuild images
    print_info "Rebuilding Docker images (this may take a few minutes)..."
    docker compose -f docker-compose.prod.yml build --no-cache
    if [ $? -ne 0 ]; then
        print_error "Failed to rebuild Docker images"
        exit 1
    fi
    print_success "Docker images rebuilt successfully"

    # Clean up dangling images and build cache
    print_info "Cleaning up dangling images and build cache..."
    docker image prune -f
    docker system prune -f
    print_success "Cleanup completed successfully"

    # Start containers
    print_info "Starting containers..."
    docker compose -f docker-compose.prod.yml up -d
    if [ $? -ne 0 ]; then
        print_error "Failed to start containers"
        exit 1
    fi
    print_success "Containers started successfully"

    # Wait for services to be healthy
    print_info "Waiting for services to be ready..."
    sleep 10

    # Show status
    echo ""
    print_success "Update completed successfully!"
    echo ""
    print_info "Service Status:"
    docker compose -f docker-compose.prod.yml ps
    echo ""
    print_info "Your site is now running the latest version: https://${DOMAIN}"
    echo ""
    print_info "Useful Commands:"
    echo "  - View logs: cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml logs -f"
    echo "  - Restart services: cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml restart"
    echo ""
}

# Main installation flow
main() {
    clear
    echo "======================================"
    echo "  OnPlay Installation Script"
    echo "  Ubuntu 24.04 LTS"
    echo "======================================"
    echo ""

    check_root

    # Show main menu
    echo "Please select an option:"
    echo ""

    # Check for previous installation
    if check_previous_installation; then
        print_warning "Previous OnPlay installation detected"
        echo ""
        echo "  1) Update installation (pull latest code and rebuild)"
        echo "  2) Clean install (remove OnPlay and install fresh)"
        echo "  3) Delete OnPlay only (remove without reinstalling)"
        echo "  4) Complete system cleanup (⚠️  Remove ALL Docker containers and nginx configs)"
        echo "  5) Fresh install (no cleanup)"
        echo "  6) Cancel"
        echo ""
        read -p "Enter your choice (1-6): " choice

        case $choice in
            1)
                # Get domain from .env or prompt
                if [ -f "$INSTALL_DIR/.env" ]; then
                    DOMAIN=$(grep "^DOMAIN=" "$INSTALL_DIR/.env" | cut -d'=' -f2)
                fi
                if [ -z "$DOMAIN" ]; then
                    get_domain
                fi
                update_installation
                exit 0
                ;;
            2)
                cleanup_installation
                ;;
            3)
                cleanup_installation
                print_success "OnPlay has been completely removed"
                exit 0
                ;;
            4)
                complete_system_cleanup
                if [ $? -eq 1 ]; then
                    exit 0
                fi
                ;;
            5)
                print_info "Proceeding with fresh installation (no cleanup)..."
                ;;
            6)
                print_info "Installation cancelled"
                exit 0
                ;;
            *)
                print_error "Invalid choice"
                exit 1
                ;;
        esac
    else
        echo "  1) Install OnPlay"
        echo "  2) Complete system cleanup (⚠️  Remove ALL Docker containers and nginx configs)"
        echo "  3) Cancel"
        echo ""
        read -p "Enter your choice (1-3): " choice

        case $choice in
            1)
                print_info "Proceeding with OnPlay installation..."
                ;;
            2)
                complete_system_cleanup
                if [ $? -eq 1 ]; then
                    exit 0
                fi
                print_info "System cleanup complete. Run this script again to install OnPlay."
                exit 0
                ;;
            3)
                print_info "Installation cancelled"
                exit 0
                ;;
            *)
                print_error "Invalid choice"
                exit 1
                ;;
        esac
    fi

    echo ""

    # Get domain name
    get_domain

    # Install dependencies
    install_dependencies
    install_docker

    # Setup application
    setup_application
    create_production_compose
    create_production_nginx_conf
    update_frontend_dockerfile
    create_env_file

    # Setup nginx (HTTP only first)
    create_system_nginx_conf

    # Test and reload nginx
    print_info "Testing nginx configuration..."
    nginx -t
    if [ $? -ne 0 ]; then
        print_error "Nginx configuration test failed"
        exit 1
    fi
    systemctl reload nginx
    print_success "Nginx configuration loaded"

    # Start application
    start_application

    # Setup SSL (now that nginx is working with HTTP)
    setup_ssl

    # Update nginx with SSL configuration
    update_nginx_ssl_config

    # Setup SSL auto-renewal
    setup_ssl_renewal

    # Display summary
    display_summary
}

# Run main function
main "$@"
