# HTTPS/SSL Configuration Guide for JODDB Backend

**Status**: Ready for HTTPS  
**Date**: October 30, 2025  

---

## 🔐 Current HTTPS Configuration

Your backend is now configured with **production-ready HTTPS settings**:

### Security Settings in `.env`
```bash
# HTTPS & Security Headers
SECURE_SSL_REDIRECT=True              # Redirect HTTP to HTTPS
SESSION_COOKIE_SECURE=True            # Only send cookies over HTTPS
CSRF_COOKIE_SECURE=True               # Protect CSRF tokens over HTTPS
SECURE_HSTS_SECONDS=31536000          # 1 year HSTS
SECURE_HSTS_INCLUDE_SUBDOMAINS=True   # Include subdomains in HSTS
SECURE_HSTS_PRELOAD=True              # Enable HSTS preload
```

### Security Settings in `settings.py`
```python
SECURE_BROWSER_XSS_FILTER = True      # Enable XSS protection
SECURE_CONTENT_SECURITY_POLICY = {...} # Content Security Policy
X_FRAME_OPTIONS = 'DENY'              # Disable clickjacking
```

---

## 📋 SSL Certificate Setup Options

### Option 1: Let's Encrypt (Recommended for Production)

#### Install Certbot
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

#### Generate Free SSL Certificate
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

This creates:
- `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- `/etc/letsencrypt/live/yourdomain.com/privkey.pem`

#### Configure Nginx/Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Auto-Renew Certificate
```bash
sudo certbot renew --dry-run  # Test renewal
sudo systemctl enable certbot.timer
```

---

### Option 2: Self-Signed Certificate (Development/Testing)

#### Generate Self-Signed Certificate
```bash
# Create directory
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs

# Generate certificate (valid for 365 days)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/self-signed.key \
    -out /etc/ssl/certs/self-signed.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Set permissions
sudo chmod 600 /etc/ssl/private/self-signed.key
sudo chmod 644 /etc/ssl/certs/self-signed.crt
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name localhost;

    ssl_certificate /etc/ssl/certs/self-signed.crt;
    ssl_certificate_key /etc/ssl/private/self-signed.key;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

### Option 3: Commercial SSL Certificate

Contact your SSL provider for:
- `certificate.crt` (Certificate file)
- `private.key` (Private key)
- `ca-bundle.crt` (CA bundle, if provided)

---

## 🔧 Django Configuration for HTTPS

### Update `.env` for Your Domain
```bash
# Update with your domain
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# Update CORS for HTTPS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Ensure HTTPS is enabled
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Update `settings.py` (Already configured)
```python
if IS_PRODUCTION:
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
    SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
    CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
```

---

## 🚀 Deployment with HTTPS

### Step 1: Set Up SSL Certificate
Choose one of the options above and install your certificate.

### Step 2: Update Environment Variables
```bash
# Edit backend/.env
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Step 3: Configure Reverse Proxy (Nginx)
```bash
# Install Nginx
sudo apt-get install nginx

# Create config file
sudo nano /etc/nginx/sites-available/joddb

# Enable site
sudo ln -s /etc/nginx/sites-available/joddb /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 4: Start Backend
```bash
bash run-backend-prod.sh
```

### Step 5: Test HTTPS
```bash
# Test certificate
curl -I https://yourdomain.com/api/v1/jobs/

# Should return 200 OK
```

---

## 🔒 Security Headers

Your backend now includes:

### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
**Effect**: Browser will use HTTPS for all future requests

### X-Frame-Options
```
X-Frame-Options: DENY
```
**Effect**: Prevents clickjacking attacks

### Content-Security-Policy
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```
**Effect**: Restricts resource loading

---

## ✅ HTTPS Verification Checklist

After setting up HTTPS:

- [ ] SSL certificate installed
- [ ] Nginx/reverse proxy configured
- [ ] DNS pointing to server
- [ ] Port 443 accessible
- [ ] Port 80 redirects to 443
- [ ] `ALLOWED_HOSTS` updated
- [ ] `SECURE_SSL_REDIRECT=True`
- [ ] `SESSION_COOKIE_SECURE=True`
- [ ] `CSRF_COOKIE_SECURE=True`
- [ ] CORS URLs use `https://`
- [ ] Django server running
- [ ] Test with `curl https://yourdomain.com`

### Test Command
```bash
curl -I https://yourdomain.com/api/v1/jobs/
```

Should return:
```
HTTP/2 200
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

---

## 🐛 Troubleshooting

### SSL Certificate Error
```
SSL: CERTIFICATE_VERIFY_FAILED
```
**Solution**: 
- Verify certificate is valid: `openssl x509 -in certificate.crt -text`
- Check certificate dates: `openssl x509 -in certificate.crt -noout -dates`
- Renew certificate if expired

### Mixed Content Warning
```
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```
**Solution**:
- Ensure all API URLs use `https://`
- Update frontend API endpoint to use HTTPS
- Set `SECURE_SSL_REDIRECT=True`

### HSTS Error (First Visit)
Browser warns about untrusted certificate on first visit (normal).
**Solution**: 
- Accept exception (development)
- Get proper certificate (production)

### Reverse Proxy Not Working
```
502 Bad Gateway
```
**Solution**:
- Verify Django is running: `ps aux | grep gunicorn`
- Check Nginx config: `sudo nginx -t`
- View Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify port: `sudo netstat -tlnp | grep 8000`

---

## 📚 Additional Resources

- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot Documentation](https://certbot.eff.org/)
- [Django HTTPS Guide](https://docs.djangoproject.com/en/stable/topics/security/#ssl-https)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Mozilla SSL Configuration](https://ssl-config.mozilla.org/)

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] HTTPS enabled
- [ ] SSL certificate valid
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS configured
- [ ] SECURE_SSL_REDIRECT=True
- [ ] Database backups configured
- [ ] Email backend configured
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Firewall rules set
- [ ] Load balancing (if needed)
- [ ] Database replication (if needed)

---

## 🚀 Quick HTTPS Setup (Let's Encrypt)

```bash
# 1. Install Certbot
sudo apt-get install certbot

# 2. Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# 3. Update .env
ALLOWED_HOSTS=yourdomain.com
SECURE_SSL_REDIRECT=True

# 4. Configure Nginx (see template above)

# 5. Start services
sudo systemctl start nginx
bash run-backend-prod.sh

# 6. Test
curl -I https://yourdomain.com/api/v1/jobs/
```

---

**Your backend is now HTTPS-ready!** 🔐

For detailed setup, follow the options above based on your deployment environment.
