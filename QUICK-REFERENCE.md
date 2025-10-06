# OnPlay Quick Reference

Essential commands for managing your OnPlay installation.

## Daily Operations

### Check Status
```bash
# All services
cd /opt/onplay && docker compose -f docker-compose.prod.yml ps

# Specific service status
docker compose -f docker-compose.prod.yml ps api
docker compose -f docker-compose.prod.yml ps worker

# Health check
curl https://your-domain.com/health
```

### View Logs
```bash
cd /opt/onplay

# All services (real-time)
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker
docker compose -f docker-compose.prod.yml logs -f frontend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100

# Follow specific worker
docker compose -f docker-compose.prod.yml logs -f worker | grep ERROR
```

### Restart Services
```bash
cd /opt/onplay

# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart worker
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart nginx

# Restart with rebuild (after code changes)
docker compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

### Service Not Responding
```bash
# Check container status
docker ps -a | grep onplay

# Check specific container
docker inspect onplay-api-1

# Check resource usage
docker stats

# Check server resources
htop  # or top
df -h  # disk space
free -h  # memory
```

### Worker Issues
```bash
cd /opt/onplay

# Check worker status
docker compose -f docker-compose.prod.yml ps worker

# View worker logs
docker compose -f docker-compose.prod.yml logs -f worker

# Restart workers
docker compose -f docker-compose.prod.yml restart worker

# Scale workers (increase to 3 replicas)
docker compose -f docker-compose.prod.yml up -d --scale worker=3
```

### Database Issues
```bash
cd /opt/onplay

# Check database status
docker compose -f docker-compose.prod.yml ps postgres

# Access database shell
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U mediauser -d mediadb

# Check database size
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U mediauser -d mediadb -c "SELECT pg_size_pretty(pg_database_size('mediadb'));"

# List all tables
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U mediauser -d mediadb -c "\dt"
```

### Redis Issues
```bash
cd /opt/onplay

# Check Redis status
docker compose -f docker-compose.prod.yml ps redis

# Connect to Redis CLI
docker compose -f docker-compose.prod.yml exec redis redis-cli

# Check queue length
docker compose -f docker-compose.prod.yml exec redis redis-cli LLEN celery

# Clear all Redis data (⚠️ CAREFUL!)
docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

## Maintenance

### Backup Database
```bash
# Create backup
docker compose -f /opt/onplay/docker-compose.prod.yml exec postgres \
  pg_dump -U mediauser mediadb > /backup/onplay-db-$(date +%Y%m%d).sql

# Restore backup
docker compose -f /opt/onplay/docker-compose.prod.yml exec -T postgres \
  psql -U mediauser -d mediadb < /backup/onplay-db-20250106.sql
```

### Backup Media Files
```bash
# Create tar.gz backup
tar -czf /backup/onplay-media-$(date +%Y%m%d).tar.gz /opt/onplay/media/

# Restore media backup
tar -xzf /backup/onplay-media-20250106.tar.gz -C /
```

### Clean Up Old Media
```bash
# Find large files
du -sh /opt/onplay/media/*/* | sort -hr | head -20

# Remove specific media (by ID)
rm -rf /opt/onplay/media/original/{media-id}.*
rm -rf /opt/onplay/media/hls/{media-id}/
rm -rf /opt/onplay/media/thumbnails/{media-id}.*

# Clean up orphaned files (be careful!)
cd /opt/onplay
docker compose -f docker-compose.prod.yml exec api python -c "
from app.database import SessionLocal
from app.models import Media
import os
db = SessionLocal()
media_ids = {str(m.id) for m in db.query(Media).all()}
# List orphaned directories
"
```

### Update OnPlay
```bash
cd /opt/onplay

# 1. Backup first!
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U mediauser mediadb > /backup/onplay-pre-update-$(date +%Y%m%d).sql

# 2. Pull latest code (if using git)
git pull

# Or upload new files via scp/rsync

# 3. Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# 4. Check logs for errors
docker compose -f docker-compose.prod.yml logs -f
```

## SSL Certificate Management

### Check Certificate
```bash
# View certificate details
certbot certificates

# Check expiration
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -noout -dates
```

### Renew Certificate
```bash
# Test renewal (dry run)
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# After renewal, reload services
systemctl reload nginx
docker compose -f /opt/onplay/docker-compose.prod.yml restart nginx
```

### Certificate Auto-Renewal
```bash
# Check renewal timer status
systemctl status certbot.timer

# List all timers
systemctl list-timers | grep certbot

# View renewal log
journalctl -u certbot.timer
```

## Performance Optimization

### Monitor Resource Usage
```bash
# Container stats
docker stats

# Detailed container resource usage
docker ps -q | xargs docker stats --no-stream

# Check disk I/O
iotop

# Check network usage
iftop
```

### Optimize Workers
```bash
cd /opt/onplay

# Reduce worker concurrency (edit docker-compose.prod.yml)
# Change: --concurrency=4 to --concurrency=2

# Apply changes
docker compose -f docker-compose.prod.yml up -d --force-recreate worker
```

### Clean Docker Resources
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune

# Full cleanup (⚠️ CAREFUL!)
docker system prune -a --volumes
```

## Security

### View Logs for Suspicious Activity
```bash
# Check nginx access logs
docker compose -f /opt/onplay/docker-compose.prod.yml logs nginx | grep "POST /api"

# Check system nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Check for failed login attempts (if auth implemented)
docker compose -f /opt/onplay/docker-compose.prod.yml logs api | grep "401\|403"
```

### Update System Packages
```bash
# Update Ubuntu packages
apt-get update
apt-get upgrade -y

# Update Docker
apt-get install --only-upgrade docker-ce docker-ce-cli containerd.io
```

### Firewall Rules
```bash
# Check current rules
ufw status verbose
# or
iptables -L -n -v

# Allow specific IP only
ufw allow from 1.2.3.4 to any port 443
```

## Environment Configuration

### View Current Config
```bash
# View environment variables
cat /opt/onplay/.env

# View Docker Compose config
cat /opt/onplay/docker-compose.prod.yml
```

### Change Database Password
```bash
# 1. Edit .env file
nano /opt/onplay/.env
# Change DB_PASSWORD value

# 2. Restart services
cd /opt/onplay
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

## Monitoring Endpoints

### Health Checks
```bash
# Application health
curl https://your-domain.com/health

# API health
curl https://your-domain.com/api/docs

# Check if all services responding
curl -I https://your-domain.com/
```

### API Testing
```bash
# List media
curl https://your-domain.com/api/media

# Get specific media
curl https://your-domain.com/api/media/{id}

# Check analytics
curl https://your-domain.com/api/analytics/overview
```

## Common Issues

### "Cannot connect to Docker daemon"
```bash
# Start Docker service
systemctl start docker
systemctl enable docker
```

### "Port already in use"
```bash
# Find process using port
netstat -tulpn | grep :80
# or
lsof -i :80

# Kill process if needed
kill -9 <PID>
```

### "Disk space full"
```bash
# Check disk usage
df -h

# Find large files
du -sh /opt/onplay/media/* | sort -hr | head -20

# Clean Docker
docker system prune -a --volumes

# Remove old media files
# (Make sure to remove from database first!)
```

### "Worker not processing jobs"
```bash
# Check Redis connection
docker compose -f /opt/onplay/docker-compose.prod.yml exec redis redis-cli PING

# Check queue
docker compose -f /opt/onplay/docker-compose.prod.yml exec redis redis-cli LLEN celery

# Restart workers
docker compose -f /opt/onplay/docker-compose.prod.yml restart worker
```

## Complete System Cleanup

If you need to remove **EVERYTHING** (all Docker containers, images, nginx configs, SSL certs) to start fresh:

```bash
cd /tmp/onplay
sudo ./install.sh
# Select option 3: Complete system cleanup
# Type "YES I UNDERSTAND" when prompted
```

This is useful when:
- Migrating from another Docker-based application
- Server was previously used for other projects
- You want a completely clean slate

⚠️ **WARNING**: This removes ALL Docker containers and configurations, not just OnPlay!

What it removes:
- All Docker containers (running and stopped)
- All Docker images
- All Docker volumes
- All Docker networks (except defaults)
- All Nginx site configurations
- All SSL certificates
- Docker build cache

What it keeps:
- Docker itself
- Nginx itself
- Certbot itself
- System packages

After cleanup, run the install script again to install OnPlay on the clean system.

## Quick Commands Summary

```bash
# Status check
cd /opt/onplay && docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart everything
docker compose -f docker-compose.prod.yml restart

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up -d --build

# Backup database
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U mediauser mediadb > backup.sql

# Check SSL cert
certbot certificates

# Renew SSL (dry run)
certbot renew --dry-run

# Clean Docker (safe - only removes unused)
docker system prune -a

# Check disk space
df -h

# Complete system cleanup (⚠️ DESTRUCTIVE)
cd /tmp/onplay && sudo ./install.sh
# Then select option 3
```

## Important File Locations

```
/opt/onplay/                          # Installation directory
├── .env                              # Environment configuration
├── docker-compose.prod.yml           # Production Docker Compose
├── media/                            # Media storage
│   ├── original/                     # Original uploaded files
│   ├── hls/                          # Transcoded HLS files
│   └── thumbnails/                   # Generated thumbnails
├── backend/                          # FastAPI application
├── frontend/                         # React application
└── nginx/                            # Nginx configuration

/etc/nginx/sites-available/onplay     # System nginx config
/etc/letsencrypt/live/{domain}/       # SSL certificates
/var/log/nginx/                       # Nginx logs
```

## Need More Help?

- **Detailed Installation Guide**: See [INSTALLATION.md](INSTALLATION.md)
- **Application Documentation**: See [README.md](README.md)
- **Architecture & Implementation**: See [CLAUDE.md](CLAUDE.md)
- **System Logs**: Check `/var/log/nginx/` and Docker logs
