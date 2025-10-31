# Quick Start: Combined Nginx + Frontend Setup

## The New Script

**File**: `setup-nginx-frontend-prod.sh`

One unified script that does BOTH:
1. ✅ Builds the frontend (React/Vite)
2. ✅ Configures Nginx (Reverse Proxy + HTTPS)

---

## One-Command Deployment

### For Testing (Localhost)
```bash
sudo bash setup-nginx-frontend-prod.sh
```

### For Production (With Domain)
```bash
sudo DOMAIN=yourdomain.com bash setup-nginx-frontend-prod.sh
```

---

## What Happens

| Step | Action | Output |
|------|--------|--------|
| 1 | Check Node.js | ✅ Node.js version |
| 2 | Check npm | ✅ npm version |
| 3 | Install deps | ✅ Dependencies installed |
| 4 | Build frontend | ✅ Build complete (size) |
| 5 | Check permissions | ✅ Running as sudo |
| 6 | Install Nginx | ✅ Nginx installed & configured |
| 7 | Test & start | ✅ Nginx running |

**Total Time**: ~5-10 minutes (depending on internet)

---

## Complete Workflow

```bash
# 1. Setup Backend
sudo bash setup-backend-prod.sh

# 2. Setup Frontend + Nginx (NEW - Combined)
sudo DOMAIN=yourdomain.com bash setup-nginx-frontend-prod.sh

# 3. Start Backend
bash run-backend-prod.sh

# 4. Verify
curl https://yourdomain.com/health
```

---

## After Setup

### What You Get

✅ **Frontend**
- Built React/Vite app in `frontend/dist/`
- Optimized for production
- ~5-10MB size (minified)

✅ **Nginx**
- Reverse proxy running
- SSL/TLS configured
- Rate limiting active
- Security headers enabled
- Serving frontend SPA
- Proxying API requests

---

## Verification

### Check Frontend
```bash
ls -la /home/coderx64/hackathon/frontend/dist/
du -sh /home/coderx64/hackathon/frontend/dist/
```

### Check Nginx
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Test Endpoints
```bash
curl https://yourdomain.com/health
curl https://yourdomain.com/
curl https://yourdomain.com/api/v1/jobs/
```

### View Logs
```bash
sudo tail -f /var/log/nginx/joddb_error.log
sudo tail -f /var/log/nginx/joddb_access.log
```

---

## Troubleshooting

### Issue: "Permission denied"
```bash
# Must use sudo
sudo bash setup-nginx-frontend-prod.sh
```

### Issue: Node.js version too old
```bash
# Update Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Issue: Frontend not loading
```bash
# Check build
ls -la /home/coderx64/hackathon/frontend/dist/index.html

# Check Nginx config
sudo nginx -t

# View error log
sudo tail -20 /var/log/nginx/joddb_error.log
```

### Issue: API 502 Bad Gateway
```bash
# Backend running?
curl http://localhost:8000/api/v1/jobs/

# If not running
bash run-backend-prod.sh
```

---

## Environment Variables

```bash
# Domain for SSL and server_name
DOMAIN=yourdomain.com

# Backend port
BACKEND_PORT=8000

# Use self-signed certificate (for testing)
USE_SELF_SIGNED=true
```

### Examples

```bash
# Basic
sudo bash setup-nginx-frontend-prod.sh

# Production
sudo DOMAIN=api.example.com bash setup-nginx-frontend-prod.sh

# Testing with self-signed
sudo USE_SELF_SIGNED=true bash setup-nginx-frontend-prod.sh

# Custom ports
sudo DOMAIN=yourdomain.com BACKEND_PORT=8000 bash setup-nginx-frontend-prod.sh
```

---

## Configuration Served

After setup:

```
/ → Frontend SPA (frontend/dist/)
/api/* → Backend (port 8000)
/admin/* → Django admin (port 8000)
/static/* → Backend static files
/media/* → User uploads
/health → Health check endpoint
```

---

## SSL Certificates

### Automatic (Self-Signed)
```bash
sudo bash setup-nginx-frontend-prod.sh
# Creates self-signed certificate automatically
```

### Let's Encrypt (Recommended for Production)
```bash
# 1. Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# 2. Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# 3. Run setup script
sudo DOMAIN=yourdomain.com bash setup-nginx-frontend-prod.sh
# Script will detect and use Let's Encrypt certificate
```

---

## Performance

Out of the box:

✅ **Gzip Compression** - 60-80% data reduction  
✅ **Browser Caching** - 30 days for static files  
✅ **HTTP/2** - Multiplexing and faster loading  
✅ **Rate Limiting** - Protection against abuse  

---

## Security

Out of the box:

✅ **HTTPS/TLS 1.2+** - Encrypted communication  
✅ **7 Security Headers** - Protection against attacks  
✅ **Rate Limiting** - DDoS protection  
✅ **HSTS Preload** - Browser enforcement  

---

## Monitoring

```bash
# Watch for errors
watch -n 1 'tail -5 /var/log/nginx/joddb_error.log'

# Watch requests
watch -n 1 'tail -20 /var/log/nginx/joddb_access.log'

# Check connections
watch -n 1 'netstat -an | grep ESTABLISHED | wc -l'
```

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `sudo systemctl restart nginx` | Restart Nginx |
| `sudo systemctl reload nginx` | Reload config (no downtime) |
| `sudo nginx -t` | Test configuration |
| `sudo tail -f /var/log/nginx/joddb_error.log` | Watch errors |
| `curl https://yourdomain.com/health` | Test setup |

---

## Next Steps

1. ✅ Run the script
2. ✅ Verify with curl
3. ✅ Start backend
4. ✅ Monitor logs
5. ✅ Configure SSL (if needed)

---

## Files Created

- `setup-nginx-frontend-prod.sh` - The combined setup script
- `NGINX_FRONTEND_COMBINED_SETUP.md` - Full documentation
- `/etc/nginx/sites-available/joddb` - Nginx configuration
- `/home/coderx64/hackathon/frontend/dist/` - Built frontend

---

## Support

See full documentation in:
- `NGINX_FRONTEND_COMBINED_SETUP.md`
- `NGINX_SETUP_GUIDE.md`
- `PRODUCTION_COMPLETE_SETUP.md`

---

That's it! Your production setup is now simplified. 🚀

