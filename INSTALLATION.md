# OnPlay Installation Guide

This guide will help you install OnPlay on a fresh Ubuntu 24.04 LTS server with a static IP address.

## Prerequisites

- Ubuntu 24.04 LTS server with static IP
- Root access (via sudo)
- Domain name pointing to your server's IP address
- Ports 80 and 443 open in your firewall

## Quick Start

1. **Clone or upload the OnPlay repository to your server**
   ```bash
   # Option 1: Clone from git (if using git)
   git clone <your-repo-url> /tmp/onplay
   cd /tmp/onplay

   # Option 2: Upload files via SCP
   scp -r /path/to/onplay root@your-server-ip:/tmp/onplay
   ssh root@your-server-ip
   cd /tmp/onplay
   ```

2. **Run the installation script**
   ```bash
   sudo chmod +x install.sh
   sudo ./install.sh
   ```

3. **Follow the prompts**
   - If a previous installation exists, choose whether to clean install or delete
   - Enter your domain name (e.g., `onplay.site`)
   - Confirm domain before continuing
   - Wait for SSL certificate setup (press Enter when DNS is ready)

4. **Access your site**
   - Your OnPlay instance will be available at: `https://your-domain.com`

## What the Script Does

### 1. System Setup
- Checks for root privileges
- Detects previous installations
- Installs required dependencies:
  - Docker & Docker Compose
  - Nginx
  - Certbot & python3-certbot-nginx
  - System utilities (curl, git, rsync)

### 2. Application Setup
- Copies application files to `/opt/onplay`
- Creates media directories structure
- Generates secure database password
- Creates production Docker Compose configuration
- Updates frontend build for production with domain-specific environment variables

### 3. Docker Configuration
- Creates production-ready `docker-compose.prod.yml` with:
  - Nginx reverse proxy (port 80)
  - FastAPI backend with 4 workers
  - Celery workers (2 replicas, 4 concurrency each)
  - React frontend (production build)
  - PostgreSQL database
  - Redis queue
- Configures CORS for your domain
- Sets up proper volume mounts and networks

### 4. SSL/TLS Setup
- Configures system Nginx as HTTPS reverse proxy
- Obtains Let's Encrypt SSL certificate for your domain
- Sets up automatic certificate renewal (via certbot systemd timer)
- Configures renewal hook to reload services
- Implements secure SSL/TLS settings (TLS 1.2+, HSTS headers)

### 5. Security
- Generates random database password (32 characters)
- Stores sensitive data in `.env` file with restricted permissions (600)
- Enables security headers (HSTS, X-Frame-Options, etc.)
- Uses SSL/TLS best practices

## Installation Options

### When Previous OnPlay Installation is Detected

When running the script with a previous OnPlay installation detected, you'll see:

```
Previous OnPlay installation detected

Please select an option:
  1) Clean install (remove OnPlay and install fresh)
  2) Delete OnPlay only (remove without reinstalling)
  3) Complete system cleanup (⚠️  Remove ALL Docker containers and nginx configs)
  4) Fresh install (no cleanup)
  5) Cancel
```

**Option 1: Clean Install**
- Stops and removes OnPlay Docker containers
- Removes OnPlay Docker images
- Deletes installation directory (`/opt/onplay`)
- Removes OnPlay Nginx configuration
- Proceeds with fresh installation

**Option 2: Delete OnPlay Only**
- Performs OnPlay cleanup (same as Option 1)
- Exits without reinstalling

**Option 3: Complete System Cleanup** ⚠️
- **WARNING**: This is a destructive operation!
- Removes **ALL** Docker containers (not just OnPlay)
- Removes **ALL** Docker images
- Removes **ALL** Docker volumes
- Removes **ALL** custom Docker networks
- Removes **ALL** Nginx site configurations
- Removes **ALL** SSL certificates (Let's Encrypt)
- Clears Docker build cache
- Requires typing "YES I UNDERSTAND" to confirm
- Use this if you had another app installed previously and want a completely clean slate

**Option 4: Fresh Install**
- Proceeds with installation without any cleanup
- Use if you want to keep other containers/configs

**Option 5: Cancel**
- Exits script without making changes

### When No Previous Installation is Detected

When running the script on a clean system, you'll see:

```
Please select an option:
  1) Install OnPlay
  2) Complete system cleanup (⚠️  Remove ALL Docker containers and nginx configs)
  3) Cancel
```

**Option 1: Install OnPlay**
- Proceeds with standard installation

**Option 2: Complete System Cleanup** ⚠️
- Same destructive cleanup as described above
- Use this if you had other applications installed and want to start fresh
- After cleanup, run the script again to install OnPlay

**Option 3: Cancel**
- Exits script without making changes

### Complete System Cleanup Details

The complete system cleanup option is designed for servers that previously ran other Docker-based applications. It will:

1. **Stop all running containers**
   ```bash
   docker stop $(docker ps -q)
   ```

2. **Remove all containers**
   ```bash
   docker rm -f $(docker ps -aq)
   ```

3. **Remove all images**
   ```bash
   docker rmi -f $(docker images -q)
   ```

4. **Remove all volumes**
   ```bash
   docker volume rm $(docker volume ls -q)
   ```

5. **Remove all custom networks**
   - Preserves default networks (bridge, host, none)

6. **Clean all Nginx configurations**
   - Removes all files from `/etc/nginx/sites-enabled/`
   - Removes all files from `/etc/nginx/sites-available/`

7. **Remove all SSL certificates**
   - Deletes all Let's Encrypt certificates
   - Removes renewal hooks

8. **Remove common app directories**
   - `/opt/onplay`
   - `/opt/app`
   - `/var/www/html/*`

9. **Clean Docker system**
   - Prunes build cache
   - Removes dangling resources

⚠️ **Important**: This cleanup keeps Docker, Nginx, and Certbot installed - it only removes configurations and data.

## Post-Installation

### Verify Installation

Check container status:
```bash
cd /opt/onplay
docker compose -f docker-compose.prod.yml ps
```

All services should show "Up" status.

### View Logs

```bash
# All services
cd /opt/onplay
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Managing Services

```bash
cd /opt/onplay

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart api

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Rebuild and restart (after code changes)
docker compose -f docker-compose.prod.yml up -d --build
```

### SSL Certificate Management

Check certificate expiry:
```bash
certbot certificates
```

Test renewal process (dry run):
```bash
certbot renew --dry-run
```

Force renewal:
```bash
certbot renew --force-renewal
```

The certificate will automatically renew via systemd timer. Check renewal timer:
```bash
systemctl status certbot.timer
systemctl list-timers | grep certbot
```

## File Locations

- **Installation Directory**: `/opt/onplay`
- **Media Files**: `/opt/onplay/media/`
- **Environment Config**: `/opt/onplay/.env`
- **Docker Compose**: `/opt/onplay/docker-compose.prod.yml`
- **System Nginx Config**: `/etc/nginx/sites-available/onplay`
- **SSL Certificates**: `/etc/letsencrypt/live/your-domain/`
- **Certbot Renewal Hook**: `/etc/letsencrypt/renewal-hooks/deploy/onplay-reload.sh`

## Architecture

```
Internet (Port 443)
    |
    ├─> System Nginx (HTTPS Termination)
    |       |
    |       └─> SSL Certificate (Let's Encrypt)
    |
    └─> Docker Network
            |
            ├─> Nginx Container (Port 80)
            |       ├─> Frontend (React App)
            |       ├─> API (FastAPI)
            |       ├─> WebSocket (FastAPI)
            |       └─> Media Files (Static)
            |
            ├─> API Container (FastAPI + Uvicorn)
            |       └─> PostgreSQL Database
            |
            ├─> Worker Containers (Celery)
            |       ├─> Redis Queue
            |       └─> FFmpeg Processing
            |
            ├─> Frontend Container (React Production Build)
            |
            ├─> PostgreSQL Container
            |
            └─> Redis Container
```

## Firewall Configuration

Ensure these ports are open:

```bash
# Using UFW
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (for Let's Encrypt)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Or using iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## Troubleshooting

### SSL Certificate Failed

**Issue**: Let's Encrypt certificate request failed

**Solutions**:
1. Verify DNS is pointing to your server:
   ```bash
   dig +short your-domain.com
   nslookup your-domain.com
   ```

2. Check if port 80/443 are accessible:
   ```bash
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   ```

3. Test with HTTP first:
   ```bash
   curl http://your-domain.com/health
   ```

4. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### Container Won't Start

**Issue**: Docker container keeps restarting

**Solutions**:
1. Check container logs:
   ```bash
   docker compose -f /opt/onplay/docker-compose.prod.yml logs [service-name]
   ```

2. Verify environment variables:
   ```bash
   cat /opt/onplay/.env
   ```

3. Check disk space:
   ```bash
   df -h
   ```

4. Verify Docker is running:
   ```bash
   systemctl status docker
   ```

### Database Connection Failed

**Issue**: API cannot connect to PostgreSQL

**Solutions**:
1. Check if PostgreSQL container is running:
   ```bash
   docker compose -f /opt/onplay/docker-compose.prod.yml ps postgres
   ```

2. Verify database credentials in `.env` file

3. Check database logs:
   ```bash
   docker compose -f /opt/onplay/docker-compose.prod.yml logs postgres
   ```

4. Test connection from API container:
   ```bash
   docker compose -f /opt/onplay/docker-compose.prod.yml exec api \
     psql postgresql://mediauser:PASSWORD@postgres:5432/mediadb
   ```

### Media Upload Fails

**Issue**: Cannot upload media files

**Solutions**:
1. Check media directory permissions:
   ```bash
   ls -la /opt/onplay/media/
   ```

2. Verify disk space:
   ```bash
   df -h /opt/onplay/media/
   ```

3. Check worker logs for FFmpeg errors:
   ```bash
   docker compose -f /opt/onplay/docker-compose.prod.yml logs worker
   ```

4. Verify Redis is running:
   ```bash
   docker compose -f /opt/onplay/docker-compose.prod.yml ps redis
   ```

### High CPU Usage

**Issue**: Server CPU usage is very high

**Solutions**:
1. Check which container is using CPU:
   ```bash
   docker stats
   ```

2. If workers are maxed out, reduce concurrency in `docker-compose.prod.yml`:
   ```yaml
   worker:
     command: celery -A app.celery_app worker --loglevel=info --concurrency=2
   ```

3. Reduce number of worker replicas:
   ```yaml
   worker:
     deploy:
       replicas: 1
   ```

4. Restart services after changes:
   ```bash
   docker compose -f /opt/onplay/docker-compose.prod.yml up -d --build
   ```

## Updating OnPlay

To update your OnPlay installation:

1. **Backup your data**:
   ```bash
   # Backup database
   docker compose -f /opt/onplay/docker-compose.prod.yml exec postgres \
     pg_dump -U mediauser mediadb > /opt/onplay-backup-$(date +%Y%m%d).sql

   # Backup media files
   tar -czf /opt/onplay-media-backup-$(date +%Y%m%d).tar.gz /opt/onplay/media/
   ```

2. **Pull latest changes**:
   ```bash
   cd /opt/onplay
   git pull  # or upload new files
   ```

3. **Rebuild and restart**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

## Monitoring

### Check Service Health

```bash
# Health check endpoint
curl https://your-domain.com/health

# System Nginx status
systemctl status nginx

# Docker services status
docker compose -f /opt/onplay/docker-compose.prod.yml ps
```

### Resource Usage

```bash
# Container resource usage
docker stats

# Disk usage
df -h
du -sh /opt/onplay/media/*

# Database size
docker compose -f /opt/onplay/docker-compose.prod.yml exec postgres \
  psql -U mediauser -d mediadb -c "SELECT pg_size_pretty(pg_database_size('mediadb'));"
```

## Uninstalling OnPlay

To completely remove OnPlay, you have several options:

### Option 1: Using the Install Script (Recommended)

```bash
cd /tmp/onplay
sudo ./install.sh
# Select option 2: Delete OnPlay only
```

This will:
- Remove OnPlay containers, images, and volumes
- Delete installation directory
- Remove OnPlay-specific Nginx configuration
- Keep other Docker containers and configurations intact

### Option 2: Complete System Cleanup (Nuclear Option)

```bash
cd /tmp/onplay
sudo ./install.sh
# Select option 3: Complete system cleanup
# Type "YES I UNDERSTAND" when prompted
```

This will remove **EVERYTHING**:
- All Docker containers (not just OnPlay)
- All Docker images
- All Docker volumes
- All Nginx configurations
- All SSL certificates

⚠️ **WARNING**: Only use this if you want to remove all applications and start fresh!

### Option 3: Manual Removal

```bash
# Remove OnPlay services
cd /opt/onplay
docker compose -f docker-compose.prod.yml down -v

# Remove OnPlay images
docker images | grep onplay | awk '{print $3}' | xargs docker rmi -f

# Remove installation files
sudo rm -rf /opt/onplay

# Remove Nginx configuration
sudo rm -f /etc/nginx/sites-enabled/onplay
sudo rm -f /etc/nginx/sites-available/onplay

# Remove SSL certificate
sudo certbot delete --cert-name your-domain.com

# Reload Nginx
sudo systemctl reload nginx
```

## Support

For issues or questions:
- Check logs: `docker compose -f /opt/onplay/docker-compose.prod.yml logs -f`
- Review this documentation
- Check the main README.md for application-specific details
- Review CLAUDE.md for architecture and implementation details
