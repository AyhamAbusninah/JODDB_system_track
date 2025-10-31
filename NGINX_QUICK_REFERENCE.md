# Nginx Quick Reference Card

## One-Command Deployments

### Testing/Development
```bash
sudo bash setup-nginx-prod.sh
```
✓ Localhost only | ✓ Self-signed cert | ✓ Testing ready

### Production (Recommended)
```bash
sudo DOMAIN=yourdomain.com bash setup-nginx-prod.sh
```
✓ Full domain | ✓ Let's Encrypt ready | ✓ Production grade

### With Custom Ports
```bash
sudo DOMAIN=yourdomain.com \
     BACKEND_PORT=8000 \
     FRONTEND_PORT=5173 \
     bash setup-nginx-prod.sh
```

---

## Verification Commands

| Command | Purpose |
|---------|---------|
| `sudo nginx -t` | Test configuration |
| `sudo systemctl status nginx` | Check status |
| `curl https://yourdomain.com/health` | Test endpoint |
| `sudo tail -f /var/log/nginx/joddb_error.log` | View errors |
| `sudo tail -f /var/log/nginx/joddb_access.log` | View access |

---

## Common Operations

### Start/Stop/Restart
```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx     # No downtime
```

### View Configuration
```bash
sudo nano /etc/nginx/sites-available/joddb
```

### Check SSL Certificate
```bash
openssl s_client -connect yourdomain.com:443
sudo certbot certificates
```

### View Logs
```bash
sudo tail -f /var/log/nginx/joddb_error.log
sudo tail -f /var/log/nginx/joddb_access.log
```

---

## Request Routing

| Path | Routes To | Purpose |
|------|-----------|---------|
| `/` | Frontend (5173) | SPA application |
| `/api/*` | Backend (8000) | REST API |
| `/admin/*` | Backend (8000) | Django admin |
| `/static/*` | /staticfiles/ | CSS, JS, fonts |
| `/media/*` | /media/ | User uploads |
| `/health` | Internal | Health check |

---

## Security Features

✅ HTTPS/SSL/TLS  
✅ HSTS preload  
✅ 7 Security headers  
✅ Rate limiting  
✅ DDoS protection  
✅ Gzip compression  
✅ HTTP/2 support  

---

## Troubleshooting

### 502 Bad Gateway
```bash
# Check backend running
curl http://localhost:8000/api/v1/jobs/

# Check Nginx config
sudo nginx -t

# View errors
sudo tail -20 /var/log/nginx/joddb_error.log
```

### SSL Certificate Error
```bash
# Check certificate
openssl x509 -in /etc/nginx/certs/joddb.crt -text

# Renew
sudo certbot renew --force-renewal

# Restart
sudo systemctl restart nginx
```

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443

# Kill if needed
sudo kill -9 <PID>
```

---

## SSL Certificate Renewal

### Let's Encrypt (Automatic)
```bash
# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew --force-renewal
```

### Manual Certificate Update
```bash
# Update paths in config
sudo nano /etc/nginx/sites-available/joddb

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

---

## Performance Tuning

### Enable Gzip
Already enabled by default at compression level 6.

### Adjust Worker Processes
```bash
sudo nano /etc/nginx/nginx.conf
# Change: worker_processes auto;
```

### Increase File Descriptors
```bash
sudo nano /etc/security/limits.conf
# Add: nginx soft nofile 65535
#      nginx hard nofile 65535
```

---

## Monitoring

### Real-Time Connections
```bash
watch -n 1 'netstat -an | grep ESTABLISHED | wc -l'
```

### Request Rate
```bash
watch -n 1 'tail -100 /var/log/nginx/joddb_access.log | wc -l'
```

### Error Rate
```bash
watch -n 1 'grep " 5[0-9][0-9] " /var/log/nginx/joddb_access.log | wc -l'
```

### Memory Usage
```bash
ps aux | grep nginx
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `/etc/nginx/nginx.conf` | Main config |
| `/etc/nginx/sites-available/joddb` | Site config |
| `/var/log/nginx/joddb_access.log` | Access log |
| `/var/log/nginx/joddb_error.log` | Error log |
| `/etc/nginx/certs/joddb.crt` | SSL cert |
| `/etc/nginx/certs/joddb.key` | SSL key |

---

## Rate Limiting

| Zone | Limit | Burst |
|------|-------|-------|
| API | 10 req/s | 20 |
| General | 30 req/s | 10 |

Edit: `/etc/nginx/sites-available/joddb`

---

## Security Headers

```
Strict-Transport-Security: 31536000s
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: [configured]
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: [configured]
```

---

## Environment Variables

```bash
DOMAIN=yourdomain.com          # Domain for SSL
BACKEND_PORT=8000             # Backend port
FRONTEND_PORT=5173            # Frontend port
USE_SELF_SIGNED=true          # Use self-signed cert
CERT_DIR=/path/to/certs       # Certificate directory
```

---

## Quick Start (4 Steps)

```bash
# 1. Navigate to project
cd /home/coderx64/hackathon

# 2. Make script executable
chmod +x setup-nginx-prod.sh

# 3. Run setup
sudo DOMAIN=yourdomain.com bash setup-nginx-prod.sh

# 4. Verify
curl https://yourdomain.com/health
```

---

## Documentation Files

| File | Content |
|------|---------|
| `NGINX_SETUP_GUIDE.md` | Complete setup guide (10+ sections) |
| `NGINX_PRODUCTION_INTEGRATION.md` | Integration overview |
| `PRODUCTION_COMPLETE_SETUP.md` | Full system workflow |
| `HTTPS_CONFIGURATION_GUIDE.md` | HTTPS setup details |
| `setup-nginx-prod.sh` | Automated setup script |

---

## Support

1. **Check logs** → `/var/log/nginx/joddb_error.log`
2. **Test config** → `sudo nginx -t`
3. **Read guides** → See documentation files above
4. **Troubleshoot** → See NGINX_SETUP_GUIDE.md

---

## Status Checks

```bash
# All systems
sudo systemctl status nginx
curl http://localhost:8000/api/v1/jobs/
curl https://yourdomain.com/health

# SSL
openssl s_client -connect yourdomain.com:443

# Performance
ps aux | grep nginx
netstat -an | grep ESTABLISHED | wc -l
```

---

## Next Steps

✅ Run setup script  
✅ Verify with `sudo nginx -t`  
✅ Test endpoint with curl  
✅ Check logs  
✅ Configure firewall  
✅ Set up monitoring  

**Status**: 🟢 Ready for Production

