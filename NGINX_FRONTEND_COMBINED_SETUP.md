# Combined Nginx + Frontend Build Setup

## Overview

**New Script**: `setup-nginx-frontend-prod.sh`

This unified script handles both:
1. **Frontend Build** - React/Vite production build optimization
2. **Nginx Configuration** - Reverse proxy setup with SSL/TLS

Perfect for production deployments where Nginx serves the built frontend and proxies API requests to the backend.

---

## One-Command Setup

### Basic Setup (Testing)
```bash
sudo bash setup-nginx-frontend-prod.sh
```

### Production Setup (Recommended)
```bash
sudo DOMAIN=yourdomain.com bash setup-nginx-frontend-prod.sh
```

### With Self-Signed Certificate
```bash
sudo USE_SELF_SIGNED=true bash setup-nginx-frontend-prod.sh
```

### Custom Configuration
```bash
sudo DOMAIN=yourdomain.com \
     BACKEND_PORT=8000 \
     USE_SELF_SIGNED=false \
     bash setup-nginx-frontend-prod.sh
```

---

## What It Does

### Part 1: Frontend Build (Steps 1-4)

1. **Check Node.js** (Step 1)
   - Verifies Node.js v16+ installed
   - Reports version

2. **Check npm** (Step 2)
   - Verifies npm availability
   - Reports version

3. **Install Dependencies** (Step 3)
   - Cleans previous node_modules
   - Runs `npm install`
   - Installs all dependencies

4. **Build for Production** (Step 4)
   - Runs `npm run build`
   - Creates optimized build in `dist/`
   - Reports build size

### Part 2: Nginx Configuration (Steps 5-7)

5. **Check Permissions** (Step 5)
   - Verifies running with sudo
   - Required for system configuration

6. **Install & Configure Nginx** (Step 6)
   - Installs Nginx if needed
   - Creates SSL certificates (self-signed or Let's Encrypt)
   - Generates production-ready configuration
   - Enables the site

7. **Test & Start** (Step 7)
   - Tests Nginx configuration
   - Restarts Nginx service
   - Enables auto-start on boot

---

## Configuration Features

### Frontend Serving

```nginx
location / {
    root /home/coderx64/hackathon/frontend/dist;
    try_files $uri $uri/ /index.html;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

- Serves built frontend from `dist/` directory
- SPA routing with fallback to index.html
- 30-day browser caching

### Static Files

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    root /home/coderx64/hackathon/frontend/dist;
    expires 30d;
    add_header Cache-Control "public, immutable";
    gzip_static on;
}
```

- Direct serving of optimized files
- Gzip compression enabled
- Long-term caching

### API Proxying

```nginx
location /api/ {
    proxy_pass http://localhost:8000;
    limit_req zone=api_limit burst=20 nodelay;
    # Rate limiting + security headers
}
```

- Routes `/api/*` to Django backend
- Rate limiting (10 req/sec)
- Request forwarding with proper headers

### Admin Panel

```nginx
location /admin/ {
    proxy_pass http://localhost:8000;
    limit_req zone=general_limit burst=10 nodelay;
    # Rate limiting + no-store caching
}
```

- Routes `/admin/*` to Django admin
- Gentle rate limiting
- No caching for security

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOMAIN` | `localhost` | Domain for SSL cert and server_name |
| `BACKEND_PORT` | `8000` | Django backend port |
| `FRONTEND_PORT` | `5173` | Frontend port (for dev reference) |
| `USE_SELF_SIGNED` | `false` | Use self-signed certificate |

### Example Usage

```bash
sudo DOMAIN=api.example.com \
     BACKEND_PORT=8000 \
     USE_SELF_SIGNED=false \
     bash setup-nginx-frontend-prod.sh
```

---

## Output Structure

### After Execution

```
Frontend:
├── /home/coderx64/hackathon/frontend/dist/
│   ├── index.html
│   ├── assets/
│   │   ├── js/
│   │   ├── css/
│   │   └── ...
│   └── ...

Nginx:
├── /etc/nginx/sites-available/joddb
├── /etc/nginx/sites-enabled/joddb → sites-available/joddb
├── /var/log/nginx/joddb_access.log
├── /var/log/nginx/joddb_error.log
├── /etc/nginx/certs/joddb.crt (if self-signed)
└── /etc/nginx/certs/joddb.key (if self-signed)
```

---

## Verification

### Check Frontend Build
```bash
ls -lh /home/coderx64/hackathon/frontend/dist/
du -sh /home/coderx64/hackathon/frontend/dist/
```

### Check Nginx Configuration
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Test the Setup
```bash
# Test health endpoint
curl https://yourdomain.com/health

# Check frontend serving
curl https://yourdomain.com/ | head -20

# Check API proxying
curl https://yourdomain.com/api/v1/jobs/
```

### View Logs
```bash
# Nginx access log
sudo tail -f /var/log/nginx/joddb_access.log

# Nginx error log
sudo tail -f /var/log/nginx/joddb_error.log
```

---

## SSL Certificate Options

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Run setup script - it will detect and use the certificate
sudo DOMAIN=yourdomain.com bash setup-nginx-frontend-prod.sh
```

**Automatic renewal** via Certbot cron job.

### Option 2: Self-Signed

```bash
# Automatic generation
sudo USE_SELF_SIGNED=true bash setup-nginx-frontend-prod.sh

# Or manual
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/certs/joddb.key \
  -out /etc/nginx/certs/joddb.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

**Best for**: Development and testing.

### Option 3: Commercial

```bash
# Place certificate files
sudo cp /path/to/cert.crt /etc/nginx/certs/
sudo cp /path/to/key.key /etc/nginx/certs/

# Update Nginx config
sudo nano /etc/nginx/sites-available/joddb
# Update SSL paths

# Restart
sudo systemctl restart nginx
```

---

## Complete Production Workflow

### 1. Backend Setup
```bash
sudo bash setup-backend-prod.sh
# Creates PostgreSQL database, runs migrations, seeds data
```

### 2. Build Frontend & Configure Nginx
```bash
sudo bash setup-nginx-frontend-prod.sh
# Builds React app, configures Nginx, starts service
```

### 3. Start Backend
```bash
bash run-backend-prod.sh
# Starts Django on port 8000
```

### 4. Verify Everything
```bash
# Test health
curl https://yourdomain.com/health

# Test frontend
curl https://yourdomain.com/

# Test API
curl https://yourdomain.com/api/v1/jobs/

# Check status
sudo systemctl status nginx
ps aux | grep gunicorn
```

---

## Performance Optimizations Included

✅ **Gzip Compression**
- Level 6 compression
- Applied to text, CSS, JSON, JavaScript
- 60-80% data reduction

✅ **Browser Caching**
- Static files: 30 days
- Media files: 7 days
- API responses: no-store

✅ **HTTP/2 Support**
- Multiplexing
- Server push capable
- Header compression

✅ **Direct Static File Serving**
- ETag support
- Gzip-static enabled
- No proxy overhead

✅ **Rate Limiting**
- API: 10 req/sec (burst 20)
- General: 30 req/sec (burst 10)
- DDoS protection

---

## Security Features

✅ **HTTPS/TLS 1.2+**
- Strong cipher suites
- Session caching
- HSTS enabled

✅ **Security Headers (7 types)**
- Strict-Transport-Security
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy
- Permissions-Policy

✅ **Rate Limiting**
- Prevents brute force
- DDoS protection
- Resource exhaustion prevention

✅ **Sensitive File Blocking**
- Blocks `.git` directory
- Blocks backup files
- Access logging disabled for security

---

## Troubleshooting

### Issue: Frontend not serving

**Check**:
```bash
# Verify build exists
ls -la /home/coderx64/hackathon/frontend/dist/

# Check Nginx config points to correct location
grep "root" /etc/nginx/sites-available/joddb

# Check file permissions
ls -la /home/coderx64/hackathon/frontend/dist/index.html
```

### Issue: API 502 Bad Gateway

**Check**:
```bash
# Backend running?
curl http://localhost:8000/api/v1/jobs/

# Nginx config correct?
sudo nginx -t

# View error
sudo tail -20 /var/log/nginx/joddb_error.log
```

### Issue: SSL certificate error

**Check**:
```bash
# Verify certificate
openssl x509 -in /etc/nginx/certs/joddb.crt -text -noout

# Check paths in config
grep "ssl_certificate" /etc/nginx/sites-available/joddb

# Renew if needed
sudo certbot renew --force-renewal
```

---

## Monitoring

### Real-Time Requests
```bash
sudo tail -f /var/log/nginx/joddb_access.log
```

### Error Monitoring
```bash
sudo tail -f /var/log/nginx/joddb_error.log
```

### System Resources
```bash
# Nginx processes
ps aux | grep nginx

# Memory usage
watch -n 1 'ps aux | grep nginx'

# Active connections
netstat -an | grep ESTABLISHED | wc -l
```

---

## File Summary

| File | Size | Purpose |
|------|------|---------|
| `setup-nginx-frontend-prod.sh` | 15 KB | Combined setup (NEW) |
| `frontend/dist/` | ~5-10 MB | Built frontend files |
| `/etc/nginx/sites-available/joddb` | ~4 KB | Nginx configuration |
| `/var/log/nginx/joddb_access.log` | Growing | Access logs |
| `/var/log/nginx/joddb_error.log` | Growing | Error logs |

---

## Comparison: Old vs New Workflow

### Old Workflow (Separate Steps)
```bash
# Step 1: Build frontend
cd frontend && npm install && npm run build

# Step 2: Configure Nginx
sudo bash setup-nginx-prod.sh

# Step 3: Verify
sudo nginx -t
```

### New Workflow (One Command)
```bash
# Everything in one command
sudo bash setup-nginx-frontend-prod.sh
```

**Benefit**: Single execution, coordinated setup, consistent results.

---

## Next Steps

1. **Prepare domain**: Register domain and point DNS to server
2. **Generate SSL certificate**: Use Let's Encrypt or commercial provider
3. **Run script**: `sudo DOMAIN=yourdomain.com bash setup-nginx-frontend-prod.sh`
4. **Start backend**: `bash run-backend-prod.sh`
5. **Verify**: `curl https://yourdomain.com/health`
6. **Monitor**: `sudo tail -f /var/log/nginx/joddb_error.log`

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| `setup-nginx-frontend-prod.sh` | This combined setup script |
| `NGINX_SETUP_GUIDE.md` | Detailed Nginx documentation |
| `NGINX_QUICK_REFERENCE.md` | Quick command reference |
| `PRODUCTION_COMPLETE_SETUP.md` | Full system documentation |
| `HTTPS_CONFIGURATION_GUIDE.md` | SSL/TLS configuration details |

---

## Support

For issues:

1. Check logs: `sudo tail -f /var/log/nginx/joddb_error.log`
2. Test config: `sudo nginx -t`
3. Review guides: See documentation above
4. Troubleshooting: See troubleshooting section

---

## Summary

✅ **One-Command Setup**
- Frontend build + Nginx config combined
- Automated SSL certificate handling
- Production-ready configuration

✅ **Performance Optimized**
- Gzip compression
- Browser caching
- HTTP/2 support
- Direct file serving

✅ **Security Hardened**
- HTTPS/TLS 1.2+
- 7 security headers
- Rate limiting
- DDoS protection

✅ **Complete Documentation**
- Setup guides
- Troubleshooting
- Monitoring
- Performance tuning

**Status**: 🟢 Ready for Production

