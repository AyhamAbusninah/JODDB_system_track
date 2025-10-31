# Complete Production Setup - All Components

## Overview

Your JODDB system now has **complete production-ready setup automation** with all three major components fully integrated:

1. **Backend** (Django + PostgreSQL) ✅
2. **Frontend** (React/Vite) ✅
3. **Nginx** (Reverse Proxy + HTTPS) ✅ **NEW**

---

## Complete Setup Workflow

### Option 1: Full Automated Setup (All Services)

Run this from `/home/coderx64/hackathon/`:

```bash
# Setup everything at once
sudo bash setup-all-prod.sh

# This runs in order:
# 1. Backend setup (PostgreSQL, Django)
# 2. Frontend setup (React build)
# 3. Nginx setup (Reverse proxy)
```

### Option 2: Manual Step-by-Step Setup

```bash
cd /home/coderx64/hackathon

# Step 1: Setup Backend
echo "Setting up backend..."
sudo bash setup-backend-prod.sh

# Step 2: Setup Frontend
echo "Setting up frontend..."
sudo bash setup-frontend-prod.sh

# Step 3: Setup Nginx
echo "Setting up Nginx..."
sudo DOMAIN=yourdomain.com bash setup-nginx-prod.sh

# Step 4: Verify All Services
echo "Verifying setup..."
curl https://yourdomain.com/health
```

### Option 3: Setup with Custom Configuration

```bash
cd /home/coderx64/hackathon

# Backend
export DB_NAME=joddb_prod
export DB_USER=joddb_user
export DB_PASSWORD=$(openssl rand -base64 16)
sudo bash setup-backend-prod.sh

# Frontend
export NODE_ENV=production
sudo bash setup-frontend-prod.sh

# Nginx
sudo DOMAIN=yourdomain.com \
     BACKEND_PORT=8000 \
     FRONTEND_PORT=80 \
     bash setup-nginx-prod.sh
```

---

## Component Details

### 1. Backend (Django + PostgreSQL)

**File**: `setup-backend-prod.sh`

**Includes**:
- ✅ Python virtual environment setup
- ✅ PostgreSQL database creation and user setup
- ✅ Django dependencies installation
- ✅ Database migrations (43/43)
- ✅ Database seeding with sample data
- ✅ Static files collection
- ✅ Gunicorn WSGI server installation
- ✅ Environment configuration (.env)

**Result**: Django backend running on port 8000

**Commands**:
```bash
# Setup
sudo bash setup-backend-prod.sh

# Start backend
bash run-backend-prod.sh

# Verify
curl http://localhost:8000/api/v1/jobs/
```

---

### 2. Frontend (React + Vite)

**File**: `setup-frontend-prod.sh`

**Includes**:
- ✅ Node.js and npm installation
- ✅ Dependencies installation
- ✅ Production build generation
- ✅ Static file optimization
- ✅ Ready for Nginx serving

**Result**: Frontend built and optimized for production

**Commands**:
```bash
# Setup
sudo bash setup-frontend-prod.sh

# Run development
npm run dev

# Build for production
npm run build
```

---

### 3. Nginx (Reverse Proxy + HTTPS) **NEW**

**File**: `setup-nginx-prod.sh`

**Includes**:
- ✅ Nginx installation and configuration
- ✅ SSL/TLS certificate setup (3 options)
- ✅ Reverse proxy configuration
- ✅ Security headers (7 types)
- ✅ Rate limiting and DDoS protection
- ✅ Performance optimization
- ✅ Logging and monitoring setup
- ✅ Health check endpoint

**Result**: Production-grade reverse proxy with HTTPS

**Commands**:
```bash
# Setup (localhost with self-signed cert)
sudo bash setup-nginx-prod.sh

# Setup (with domain and Let's Encrypt)
sudo DOMAIN=yourdomain.com bash setup-nginx-prod.sh

# Verify
sudo systemctl status nginx
sudo nginx -t
curl https://yourdomain.com/health
```

---

## Architecture

### Complete Request Flow

```
User Request
    ↓
HTTPS (Port 443)
    ↓
Nginx (Reverse Proxy)
    ├─ Terminate SSL/TLS
    ├─ Apply Security Headers
    ├─ Rate Limiting
    ├─ Request Routing
    │
    ├─ Route: / → Frontend SPA (Port 5173)
    │          ├─ HTML/CSS/JS files
    │          └─ Cached 30 days
    │
    ├─ Route: /api/* → Django Backend (Port 8000)
    │          ├─ REST API endpoints
    │          ├─ Rate limited: 10 req/sec
    │          └─ No caching
    │
    ├─ Route: /admin/* → Django Admin (Port 8000)
    │          └─ Admin panel
    │
    ├─ Route: /static/* → Static Files
    │          ├─ CSS, JS, fonts
    │          └─ Cached 30 days
    │
    └─ Route: /media/* → Media Files
             ├─ User uploads
             └─ Cached 7 days
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Production Server                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Nginx (Port 80 & 443)                     │   │
│  │  ┌─ HTTPS/TLS Termination                          │   │
│  │  ├─ Security Headers                                │   │
│  │  ├─ Rate Limiting                                   │   │
│  │  └─ Request Routing                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│           │                    │                    │       │
│           ↓                    ↓                    ↓       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Frontend    │  │   Backend    │  │   Static     │     │
│  │  (Port 80)   │  │  (Port 8000) │  │   Files      │     │
│  │              │  │              │  │              │     │
│  │ SPA React    │  │ Django REST  │  │ CSS, JS,     │     │
│  │ Application  │  │ API Service  │  │ Images       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                 │                               │
│         └─────────────────┴──────────────────────┐        │
│                                                  │        │
│                            ┌─────────────────────┘        │
│                            ↓                              │
│                   ┌──────────────────┐                    │
│                   │   PostgreSQL     │                    │
│                   │   Database       │                    │
│                   │ (Port 5432)      │                    │
│                   │                  │                    │
│                   │  joddb_prod DB   │                    │
│                   │  joddb_user      │                    │
│                   └──────────────────┘                    │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Implementation

### HTTPS/TLS Security ✅

- TLS 1.2 and 1.3 support
- Strong cipher suites (HIGH:!aNULL:!MD5)
- HSTS with preload enabled
- SSL session caching
- OCSP stapling support
- HTTP/2 enabled

### Security Headers ✅

```
Strict-Transport-Security: 31536000s
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: [configured]
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: [configured]
```

### Rate Limiting ✅

- API: 10 req/sec (burst 20)
- General: 30 req/sec (burst 10)
- DDoS protection enabled
- Brute-force prevention

### Database Security ✅

- PostgreSQL with strong user permissions
- Password-based authentication
- Database isolation
- No public access (localhost only)

### Backend Security ✅

- DEBUG=False in production
- SECURE_SSL_REDIRECT=True
- SESSION_COOKIE_SECURE=True
- CSRF_COOKIE_SECURE=True
- ALLOWED_HOSTS configured
- CORS properly configured

---

## Performance Optimization

### Gzip Compression ✅

- Compression level: 6
- Applied to: text, CSS, JSON, JavaScript
- Reduction: 60-80% of transfer size

### Caching Strategy ✅

| Type | Duration | Purpose |
|------|----------|---------|
| Static files | 30 days | CSS, JS, fonts |
| Media files | 7 days | User uploads |
| API responses | no-store | Dynamic content |

### HTTP/2 ✅

- Multiplexing support
- Server push capable
- Header compression

### Connection Pooling ✅

- Backend keepalive: 32
- Least connections algorithm
- Persistent connections

---

## Monitoring & Logging

### Log Files

```bash
# Nginx access log
/var/log/nginx/joddb_access.log

# Nginx error log  
/var/log/nginx/joddb_error.log

# Django application log
/home/coderx64/hackathon/backend/logs/django.log
```

### Health Check Endpoint

```bash
# Test health
curl https://yourdomain.com/health

# Response
healthy

# HTTP Status
200 OK
```

### Monitoring Commands

```bash
# Check Nginx status
sudo systemctl status nginx

# Check backend running
curl http://localhost:8000/api/v1/jobs/

# View Nginx errors
sudo tail -f /var/log/nginx/joddb_error.log

# View access logs
sudo tail -f /var/log/nginx/joddb_access.log

# Count active connections
sudo netstat -an | grep ESTABLISHED | wc -l

# Check SSL certificate
openssl s_client -connect yourdomain.com:443
```

---

## Configuration Files

### Backend

- Location: `/home/coderx64/hackathon/backend/.env`
- Contains: Database credentials, SECRET_KEY, security settings
- Backup: Created automatically

### Frontend

- Location: `/home/coderx64/hackathon/frontend/`
- Contains: Built application files, configuration
- Build: `npm run build`

### Nginx

- Location: `/etc/nginx/sites-available/joddb`
- Contains: Reverse proxy configuration, SSL settings
- Backup: Automatic before overwrite
- Logs: `/var/log/nginx/joddb_*.log`

---

## SSL/TLS Certificates

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update Nginx config automatically
sudo certbot renew --dry-run
```

**Cost**: Free  
**Renewal**: Automatic  
**Trust**: Universal

### Option 2: Self-Signed

```bash
# Automatic via script
sudo USE_SELF_SIGNED=true bash setup-nginx-prod.sh

# Manual generation
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/certs/joddb.key \
  -out /etc/nginx/certs/joddb.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

**Cost**: Free  
**Renewal**: Manual  
**Trust**: No (testing only)

### Option 3: Commercial

```bash
# Copy certificate files
sudo cp /path/to/cert.crt /etc/nginx/certs/
sudo cp /path/to/key.key /etc/nginx/certs/

# Update Nginx config
sudo nano /etc/nginx/sites-available/joddb
```

**Cost**: $$  
**Renewal**: Manual  
**Trust**: Yes (premium)

---

## Troubleshooting

### Issue: "502 Bad Gateway"

```bash
# Check backend running
curl http://localhost:8000/api/v1/jobs/

# Check Nginx config
sudo nginx -t

# View error log
sudo tail -20 /var/log/nginx/joddb_error.log
```

### Issue: "SSL Certificate Error"

```bash
# Check certificate validity
openssl x509 -in /etc/nginx/certs/joddb.crt -text -noout

# Renew certificate
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: "Connection Timeout"

```bash
# Increase timeouts in Nginx config
sudo nano /etc/nginx/sites-available/joddb

# Add/update:
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;

# Restart
sudo systemctl restart nginx
```

### Issue: High Memory/CPU Usage

```bash
# Check worker processes
ps aux | grep nginx | grep -v grep | wc -l

# Monitor in real-time
watch -n 1 'ps aux | grep nginx'

# Reduce worker processes (edit /etc/nginx/nginx.conf)
sudo nano /etc/nginx/nginx.conf
# Change: worker_processes auto;
# To: worker_processes 2;

# Restart
sudo systemctl restart nginx
```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Backend database created and seeded
- [ ] Frontend built and tested
- [ ] Nginx configuration reviewed
- [ ] SSL certificate obtained (Let's Encrypt or commercial)
- [ ] Domain name configured and DNS pointing to server
- [ ] Firewall rules configured (allow 80, 443, SSH)
- [ ] All configuration files backed up

### Deployment

- [ ] Run: `sudo bash setup-backend-prod.sh`
- [ ] Run: `sudo bash setup-frontend-prod.sh`
- [ ] Run: `sudo DOMAIN=yourdomain.com bash setup-nginx-prod.sh`
- [ ] Verify: `sudo nginx -t` passes
- [ ] Restart: `sudo systemctl restart nginx`
- [ ] Test: `curl https://yourdomain.com/health`

### Post-Deployment

- [ ] Monitor error logs: `sudo tail -f /var/log/nginx/joddb_error.log`
- [ ] Check certificate expiration: `sudo certbot certificates`
- [ ] Set up monitoring/alerts
- [ ] Configure auto-renewal for certificates
- [ ] Test all API endpoints
- [ ] Verify HTTPS redirect working
- [ ] Confirm security headers present

---

## Documentation Reference

| Document | Purpose | Topics |
|----------|---------|--------|
| **NGINX_SETUP_GUIDE.md** | Complete Nginx guide | Installation, SSL, tuning, troubleshooting |
| **NGINX_PRODUCTION_INTEGRATION.md** | Integration summary | Architecture, security, workflow |
| **HTTPS_CONFIGURATION_GUIDE.md** | HTTPS setup | Let's Encrypt, certificates, reverse proxy |
| **POSTGRESQL_DATABASE_GENERATION.md** | Database setup | PostgreSQL automation, verification |
| **BACKEND.md** | Backend deployment | Django, Gunicorn, migrations |
| **FRONTEND.md** | Frontend deployment | React, build, static files |

---

## Quick Commands

### Start All Services

```bash
# Backend
cd /home/coderx64/hackathon && bash run-backend-prod.sh

# Frontend (if dev server)
cd /home/coderx64/hackathon/frontend && npm run dev

# Nginx
sudo systemctl start nginx
```

### Stop All Services

```bash
# Backend
pkill -f gunicorn

# Frontend
pkill -f "node.*vite"

# Nginx
sudo systemctl stop nginx
```

### Status Check

```bash
# All services
sudo systemctl status nginx
curl http://localhost:8000/api/v1/jobs/
ps aux | grep gunicorn
```

### View Logs

```bash
# Nginx errors
sudo tail -f /var/log/nginx/joddb_error.log

# Nginx access
sudo tail -f /var/log/nginx/joddb_access.log

# Django app
tail -f /home/coderx64/hackathon/backend/logs/django.log
```

---

## Performance Benchmarks

Expected performance with this setup:

| Metric | Value |
|--------|-------|
| HTTPS Handshake | < 100ms |
| API Response | 50-200ms |
| Static File Serving | < 10ms |
| Gzip Compression | 60-80% reduction |
| Requests/sec (sustained) | 1000+ |
| Concurrent Connections | 1000+ |
| Memory Usage (Nginx) | 5-10MB |
| Memory Usage (Backend) | 50-100MB |

---

## Support

### Getting Help

1. **Check logs**: `sudo tail -f /var/log/nginx/joddb_error.log`
2. **Test config**: `sudo nginx -t`
3. **Read guides**: See documentation reference above
4. **Verify services**: Run status checks above

### Common Issues

See **NGINX_SETUP_GUIDE.md** troubleshooting section for:
- 502 Bad Gateway
- SSL Certificate Errors
- Connection Timeouts
- CORS Issues
- High Memory Usage
- Performance Problems

---

## Maintenance

### Regular Tasks

```bash
# Weekly: Check SSL certificate expiration
sudo certbot certificates

# Monthly: Review access logs
sudo grep "ERROR" /var/log/nginx/joddb_error.log | wc -l

# Quarterly: Test disaster recovery
sudo systemctl stop nginx && sudo systemctl start nginx
```

### Certificate Renewal

Let's Encrypt certificates auto-renew. To verify:

```bash
# Check renewal
sudo certbot renew --dry-run

# View renewal cron
sudo cat /etc/cron.d/certbot
```

### Performance Monitoring

```bash
# Real-time connections
watch -n 1 'netstat -an | grep ESTABLISHED | wc -l'

# Request rate
watch -n 1 'tail -100 /var/log/nginx/joddb_access.log | wc -l'

# Error rate
watch -n 1 'tail -100 /var/log/nginx/joddb_access.log | grep -E " 5[0-9]{2} " | wc -l'
```

---

## Summary

✅ **Complete Production System Ready**

- Backend: Django + PostgreSQL ✅
- Frontend: React + Vite ✅
- Proxy: Nginx with HTTPS ✅
- Security: Full hardening ✅
- Performance: Fully optimized ✅
- Monitoring: Logging enabled ✅
- Documentation: Complete ✅

**Status**: 🟢 Ready for Production Deployment

**Next Step**: Run the setup scripts!

