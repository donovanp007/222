# AI Medical Scribe - DigitalOcean Production Deployment Guide

This guide provides step-by-step instructions for deploying the AI Medical Scribe platform on DigitalOcean using Docker Compose with production-grade security and performance optimizations.

## Prerequisites

- DigitalOcean account with billing enabled
- Domain name (recommended: purchase through DigitalOcean or configure DNS)
- Basic knowledge of Linux and Docker
- SSH key pair for server access

## 📋 Table of Contents

1. [Server Setup](#server-setup)
2. [Domain Configuration](#domain-configuration)
3. [Security Hardening](#security-hardening)
4. [Application Deployment](#application-deployment)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Backup Configuration](#backup-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Development Deployment](#development-deployment)
10. [Environment Configuration](#environment-configuration)

---

## 🚀 Server Setup

### Step 1: Create DigitalOcean Droplet

1. **Create Droplet:**
   ```bash
   # Recommended specifications:
   # - Ubuntu 22.04 LTS
   # - CPU: 4 vCPUs
   # - Memory: 8GB RAM
   # - Storage: 160GB SSD
   # - Region: Choose closest to your users
   ```

2. **Access via SSH:**
   ```bash
   ssh root@your-server-ip
   ```

### Step 2: Initial Server Configuration

1. **Update system packages:**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Install Docker and Docker Compose:**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   apt install docker-compose-plugin -y
   
   # Verify installation
   docker --version
   docker compose version
   ```

3. **Create non-root user:**
   ```bash
   adduser mediscribe
   usermod -aG docker mediscribe
   usermod -aG sudo mediscribe
   
   # Copy SSH keys
   rsync --archive --chown=mediscribe:mediscribe ~/.ssh /home/mediscribe
   ```

4. **Create application directories:**
   ```bash
   mkdir -p /opt/mediscribe/{data,logs,uploads,nginx-logs,redis,postgres,backups,minio}
   chown -R mediscribe:mediscribe /opt/mediscribe
   chmod -R 755 /opt/mediscribe
   ```

---

## 🌐 Domain Configuration

### Step 1: DNS Setup

1. **Configure A Record:**
   - Point your domain to your DigitalOcean droplet IP
   - Add both `@` (root domain) and `www` subdomain

2. **DigitalOcean DNS (if using DO domains):**
   ```bash
   # Create DNS record via API or control panel
   # A record: yourdomain.com -> your-server-ip
   # A record: www.yourdomain.com -> your-server-ip
   ```

### Step 2: Firewall Configuration

```bash
# Enable UFW firewall
ufw enable

# Allow SSH (change port if customized)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Check status
ufw status verbose
```

---

## 🔒 Security Hardening

### Step 1: SSH Security

1. **Edit SSH configuration:**
   ```bash
   nano /etc/ssh/sshd_config
   ```

2. **Update settings:**
   ```bash
   PermitRootLogin no
   PasswordAuthentication no
   PubkeyAuthentication yes
   Port 22  # Consider changing to non-standard port
   Protocol 2
   MaxAuthTries 3
   ```

3. **Restart SSH service:**
   ```bash
   systemctl restart sshd
   ```

### Step 2: Fail2Ban Installation

```bash
# Install fail2ban
apt install fail2ban -y

# Configure fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
nano /etc/fail2ban/jail.local

# Enable and start
systemctl enable fail2ban
systemctl start fail2ban
```

### Step 3: System Requirements

#### Minimum Requirements
- **CPU**: 2 cores (4 recommended)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB free space (50GB recommended)
- **OS**: Ubuntu 20.04+, CentOS 8+, or Docker Desktop

#### Software Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- SSL certificates (for production)

### Installation Commands

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-v2 git -y
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install docker docker-compose git -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Logout and login again to apply group changes
```

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/ai-medic-scribe.git
cd ai-medic-scribe
```

### 2. Development Setup (Fastest Way to Get Started)

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop environment
docker-compose down
```

The application will be available at:
- **App**: http://localhost:3000
- **Mailhog**: http://localhost:8025 (Email testing)
- **MinIO**: http://localhost:9001 (File storage)

## 🛠️ Development Deployment

### Environment Setup

1. **Copy Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit Configuration**
   ```bash
   nano .env.local
   ```

3. **Basic Development Environment Variables**
   ```env
   NODE_ENV=development
   NEXT_TELEMETRY_DISABLED=1
   
   # Database
   DATABASE_URL=postgresql://mediscribe:dev_password@postgres:5432/mediscribe_dev
   REDIS_URL=redis://redis:6379
   
   # Email (using Mailhog)
   SMTP_HOST=mailhog
   SMTP_PORT=1025
   SMTP_USER=
   SMTP_PASS=
   
   # File Storage (using MinIO)
   S3_ENDPOINT=http://minio:9000
   S3_BUCKET=mediscribe-dev
   S3_ACCESS_KEY=mediscribe
   S3_SECRET_KEY=dev_password_change_in_production
   ```

### Development Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d app

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Access container shell
docker-compose exec app sh
docker-compose exec postgres psql -U mediscribe -d mediscribe_dev

# Restart service
docker-compose restart app

# Rebuild after code changes
docker-compose build app
docker-compose up -d app

# Stop all services
docker-compose down

# Stop and remove volumes (complete reset)
docker-compose down -v
```

### Hot Reload

The development setup includes hot reload for:
- Next.js application files
- Configuration changes
- Package.json modifications (requires rebuild)

## 🏭 Production Deployment

### Pre-deployment Checklist

- [ ] Domain name configured
- [ ] SSL certificates obtained
- [ ] Environment variables configured
- [ ] Database backups planned
- [ ] Monitoring setup
- [ ] Security review completed

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt install htop git curl wget nginx-utils -y
```

### 2. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot -y

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
sudo chown -R $USER:$USER ./ssl
```

#### Using Custom Certificates

```bash
# Create SSL directory
mkdir -p ./ssl

# Copy your certificates
cp your-certificate.pem ./ssl/fullchain.pem
cp your-private-key.pem ./ssl/privkey.pem

# Set proper permissions
chmod 644 ./ssl/fullchain.pem
chmod 600 ./ssl/privkey.pem
```

### 3. Production Environment Configuration

```bash
# Copy production environment template
cp .env.prod.example .env.prod

# Edit production configuration
nano .env.prod
```

#### Production Environment Variables

```env
# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DOMAIN_NAME=yourdomain.com
PORT=3000

# Security
SESSION_SECRET=your-super-secure-session-secret-here
JWT_SECRET=your-jwt-secret-here
HEALTH_CHECK_TOKEN=your-health-check-token

# Database
DATABASE_URL=postgresql://mediscribe:your-secure-password@postgres:5432/mediscribe_prod
POSTGRES_DB=mediscribe_prod
POSTGRES_USER=mediscribe
POSTGRES_PASSWORD=your-secure-database-password

# Redis
REDIS_URL=redis://redis:6379

# Email (Production SMTP)
SMTP_HOST=smtp.yourmailprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# File Storage (AWS S3 or compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=mediscribe-prod
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key

# AI Services
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
GRAFANA_PASSWORD=your-secure-grafana-password

# SSL
ACME_EMAIL=your-email@yourdomain.com
```

### 4. Deploy Production Environment

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Initialize database (first time only)
docker-compose -f docker-compose.prod.yml exec postgres psql -U mediscribe -d mediscribe_prod -f /docker-entrypoint-initdb.d/init.sql

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs app
```

### 5. Configure Nginx (Alternative to Traefik)

Create nginx configuration:

```bash
# Create nginx config directory
mkdir -p docker/nginx

# Create production nginx config
cat > docker/nginx/prod.conf << 'EOF'
upstream mediscribe_app {
    server app:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Client upload limit (for file uploads)
    client_max_body_size 50M;

    # Proxy to Next.js app
    location / {
        proxy_pass http://mediscribe_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://mediscribe_app/api/health;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://mediscribe_app;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

## 🔧 Environment Configuration

### Development Environment (.env.local)

```env
# Development configuration
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# Local database
DATABASE_URL=postgresql://mediscribe:dev_password@localhost:5432/mediscribe_dev

# Local Redis
REDIS_URL=redis://localhost:6379

# Development email (Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025

# Development file storage
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=mediscribe-dev
S3_ACCESS_KEY=mediscribe
S3_SECRET_KEY=dev_password

# Debug settings
DEBUG=true
LOG_LEVEL=debug
```

### Production Environment (.env.prod)

```env
# Production configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DOMAIN_NAME=yourdomain.com

# Production database
DATABASE_URL=postgresql://mediscribe:secure_prod_password@postgres:5432/mediscribe_prod

# Production Redis with password
REDIS_URL=redis://:secure_redis_password@redis:6379

# Production email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-app-password

# Production S3
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=mediscribe-production
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=your-secret-key

# Security
SESSION_SECRET=your-256-bit-secret-key
JWT_SECRET=your-jwt-secret-key

# AI Services
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...

# Monitoring
SENTRY_DSN=https://...
NEW_RELIC_LICENSE_KEY=...

# Backup
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key
```

## 🔒 Security Considerations

### 1. Firewall Configuration

```bash
# UFW (Ubuntu Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Docker Security

```bash
# Run Docker daemon with user namespace remapping
echo "dockerd-rootless" | sudo tee -a /etc/systemd/system/docker.service

# Limit container capabilities
# Already configured in docker-compose files
```

### 3. Database Security

```bash
# Create secure passwords
openssl rand -base64 32  # For database passwords
openssl rand -base64 64  # For JWT secrets
```

### 4. SSL/TLS Security

- Use TLS 1.2+ only
- Strong cipher suites
- HSTS headers
- Certificate pinning (advanced)

### 5. Application Security

- Input validation
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting

## 📊 Monitoring and Logging

### Prometheus Metrics

Available at: `http://localhost:9090`

Key metrics to monitor:
- Application response time
- Error rates
- Database connections
- Memory usage
- CPU utilization

### Grafana Dashboards

Available at: `http://localhost:3001`

Pre-configured dashboards:
- Application Performance
- Infrastructure Health
- Database Metrics
- User Activity

### ELK Stack (Elasticsearch, Logstash, Kibana)

Available at: `http://localhost:5601`

Log aggregation and analysis:
- Application logs
- Access logs
- Error tracking
- Performance monitoring

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready -U mediscribe

# Redis health
docker-compose exec redis redis-cli ping
```

## 💾 Backup and Recovery

### 1. Database Backup

```bash
# Create backup script
cat > backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="mediscribe_prod"

mkdir -p $BACKUP_DIR

# Create database backup
docker-compose exec -T postgres pg_dump -U mediscribe $DB_NAME | gzip > $BACKUP_DIR/backup_${DATE}.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_${DATE}.sql.gz"
EOF

chmod +x backup-database.sh
```

### 2. File Storage Backup

```bash
# Backup application data
cat > backup-files.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup data volumes
docker run --rm -v mediscribe_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/data_${DATE}.tar.gz -C /data .

echo "File backup completed: data_${DATE}.tar.gz"
EOF

chmod +x backup-files.sh
```

### 3. Automated Backup (Cron)

```bash
# Add to crontab
crontab -e

# Add these lines for daily backups at 2 AM
0 2 * * * /path/to/backup-database.sh
15 2 * * * /path/to/backup-files.sh
```

### 4. Recovery Procedures

#### Database Recovery

```bash
# Stop application
docker-compose down app

# Restore database
gunzip -c backup_20240101_020000.sql.gz | docker-compose exec -T postgres psql -U mediscribe mediscribe_prod

# Start application
docker-compose up -d app
```

#### File Recovery

```bash
# Stop all services
docker-compose down

# Restore files
docker run --rm -v mediscribe_data:/data -v /backups/files:/backup alpine tar xzf /backup/data_20240101_020000.tar.gz -C /data

# Start services
docker-compose up -d
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
docker-compose logs app

# Common causes:
# - Port already in use
# - Environment variables missing
# - Database connection failed

# Solutions:
docker-compose down
docker-compose up -d postgres redis
# Wait for databases to be ready
docker-compose up -d app
```

#### 2. Database Connection Issues

```bash
# Check database status
docker-compose exec postgres pg_isready -U mediscribe

# Check database logs
docker-compose logs postgres

# Reset database (CAUTION: This will delete all data)
docker-compose down
docker volume rm ai-medic-scribe_postgres_data
docker-compose up -d postgres
```

#### 3. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in ./ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
sudo cp /etc/letsencrypt/live/yourdomain.com/* ./ssl/
docker-compose restart nginx
```

#### 4. Performance Issues

```bash
# Check resource usage
docker stats

# Check application metrics
curl http://localhost:3000/api/metrics

# Scale services if needed
docker-compose up -d --scale app=2
```

### Log Analysis

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# Nginx logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# Real-time monitoring
docker-compose exec app top
```

### Debug Mode

```bash
# Enable debug logging
echo "DEBUG=true" >> .env.local
echo "LOG_LEVEL=debug" >> .env.local

# Restart with debug
docker-compose restart app

# View debug logs
docker-compose logs -f app | grep DEBUG
```

## 🔄 Updates and Maintenance

### 1. Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild application
docker-compose build app

# Rolling update (zero downtime)
docker-compose up -d --no-deps app

# Verify update
curl http://localhost:3000/api/health
```

### 2. Dependency Updates

```bash
# Update base images
docker-compose pull

# Update npm packages
docker-compose exec app npm update

# Rebuild with updates
docker-compose build --no-cache app
```

### 3. Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
curl -fsSL https://get.docker.com | sh

# Update SSL certificates
sudo certbot renew --force-renewal
```

### 4. Database Migrations

```bash
# Run migrations
docker-compose exec app npm run migrate

# Rollback if needed
docker-compose exec app npm run migrate:rollback
```

### 5. Maintenance Schedule

**Daily:**
- Monitor application health
- Check error logs
- Verify backups

**Weekly:**
- Update security patches
- Review performance metrics
- Clean up old logs

**Monthly:**
- Update dependencies
- Review SSL certificates
- Capacity planning

**Quarterly:**
- Security audit
- Disaster recovery test
- Performance optimization

## 📞 Support and Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Community
- [GitHub Issues](https://github.com/your-org/ai-medic-scribe/issues)
- [Discord Community](https://discord.gg/mediscribe)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ai-medic-scribe)

### Professional Support
- Email: support@mediscribe.com
- Phone: +27 (0) 21 XXX XXXX
- Business Hours: 08:00 - 17:00 SAST

---

**Note**: This deployment guide is designed for healthcare environments and includes security considerations for handling sensitive medical data in compliance with POPIA (Protection of Personal Information Act) and HIPAA guidelines.