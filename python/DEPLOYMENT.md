# Python Deployment Guide

This guide covers deploying the Python Flask version of the AudioBookshelf Alexa skill to your own web server.

## Table of Contents

- [CloudPanel Deployment](#cloudpanel-deployment)
- [Generic Linux Server](#generic-linux-server)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## CloudPanel Deployment

### Prerequisites

- CloudPanel installed and configured
- Python 3.8+ available
- Domain with HTTPS/SSL certificate
- SSH access to your server

### Step 1: Prepare Your Domain

1. Log into CloudPanel
2. Create a new site (or use existing):
   - **Site Type**: Python
   - **Domain Name**: `alexa.yourdomain.com` (or subdomain of your choice)
   - **Python Version**: 3.8 or higher

### Step 2: Upload Files

Upload all files from the `python/` directory to:
```
/home/cloudpanel/htdocs/alexa.yourdomain.com/
```

Your directory structure should look like:
```
/home/cloudpanel/htdocs/alexa.yourdomain.com/
├── app.py
├── wsgi.py
├── audiobookshelf_client.py
├── constants.py
├── helpers.py
├── requirements.txt
├── .env
└── venv/  (will be created)
```

### Step 3: SSH Into Your Server

```bash
ssh your-user@your-server.com
cd /home/cloudpanel/htdocs/alexa.yourdomain.com
```

### Step 4: Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 5: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 6: Configure Environment

```bash
cp .env.example .env
nano .env
```

Edit `.env` with your values:
```env
AUDIOBOOKSHELF_URL=https://your-audiobookshelf-server.com
AUDIOBOOKSHELF_TOKEN=your_api_token_here
DEBUG=False
PORT=5000
```

Save and exit (Ctrl+X, Y, Enter).

### Step 7: Configure CloudPanel Application

In CloudPanel, configure your Python application:

1. Go to **Sites** → Your site → **Python Settings**
2. Set **Application Startup File**: `wsgi.py`
3. Set **Application Entry Point**: `app`
4. Set **Python Path**: `/home/cloudpanel/htdocs/alexa.yourdomain.com/venv/bin/python`

### Step 8: Configure Nginx (CloudPanel Auto-Configures)

CloudPanel should automatically configure Nginx, but verify the config includes:

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Step 9: Start the Application

In CloudPanel:
1. Go to your site → **Python Application**
2. Click **Start Application**

Or via command line:
```bash
gunicorn --bind 127.0.0.1:5000 --workers 4 wsgi:app
```

### Step 10: Test the Endpoint

```bash
curl http://alx.sgrslab.in/health
```

Should return:
```json
{"status": "healthy", "service": "audiobookshelf-alexa-skill"}
```

### Step 11: Update Alexa Skill Configuration

Update your `skill-package/skill.json`:

```json
{
  "apis": {
    "custom": {
      "endpoint": {
        "uri": "https://alexa.yourdomain.com/alexa"
      }
    }
  }
}
```

Deploy the updated skill:
```bash
ask deploy --target skill
```

---

## Generic Linux Server Deployment

### Using systemd Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/audiobookshelf-alexa.service
```

Add this content:

```ini
[Unit]
Description=AudioBookshelf Alexa Skill
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/alexa-skill
Environment="PATH=/var/www/alexa-skill/venv/bin"
ExecStart=/var/www/alexa-skill/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 4 wsgi:app

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable audiobookshelf-alexa
sudo systemctl start audiobookshelf-alexa
sudo systemctl status audiobookshelf-alexa
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/alexa-skill
```

Add:

```nginx
server {
    listen 443 ssl http2;
    server_name alexa.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/alexa.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alexa.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Alexa requires these headers
        proxy_buffering off;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/alexa-skill /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Configuration

### Environment Variables

Required:
- `AUDIOBOOKSHELF_URL` - Your AudioBookshelf server URL (HTTPS)
- `AUDIOBOOKSHELF_TOKEN` - Your API token

Optional:
- `DEBUG` - Set to `True` for development
- `PORT` - Port to run on (default: 5000)

### Getting Your API Token

1. Log into AudioBookshelf
2. Click your user icon → Settings
3. Go to **Account** tab
4. Find **API Access** section
5. Copy your API token

### Security Considerations

1. **HTTPS Only**: Alexa requires HTTPS endpoints
2. **Keep .env secure**: Never commit .env to git
3. **Firewall**: Only allow port 443 (HTTPS) from outside
4. **Update dependencies**: Regularly run `pip install --upgrade -r requirements.txt`

---

## Testing

### 1. Test Health Endpoint

```bash
curl https://alexa.yourdomain.com/health
```

Expected:
```json
{"status": "healthy", "service": "audiobookshelf-alexa-skill"}
```

### 2. Test Alexa Endpoint

```bash
curl -X POST https://alexa.yourdomain.com/alexa \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0",
    "session": {"new": true, "sessionId": "test"},
    "request": {
      "type": "LaunchRequest",
      "requestId": "test-request",
      "timestamp": "2025-01-01T00:00:00Z",
      "locale": "en-US"
    }
  }'
```

Should return Alexa response JSON.

### 3. Test with Alexa

1. Open Alexa Developer Console
2. Go to Test tab
3. Enable testing for Development
4. Say: "open audio bookshelf"

---

## Troubleshooting

### Service Won't Start

Check logs:
```bash
# For systemd
sudo journalctl -u audiobookshelf-alexa -f

# Or check application logs
tail -f /var/log/alexa-skill.log
```

### Import Errors

Make sure virtual environment is activated:
```bash
source venv/bin/activate
pip list
```

### "Module not found" Errors

Reinstall dependencies:
```bash
pip install -r requirements.txt --force-reinstall
```

### Nginx 502 Bad Gateway

Check if application is running:
```bash
sudo systemctl status audiobookshelf-alexa
curl http://127.0.0.1:5000/health
```

### SSL Certificate Issues

Renew Let's Encrypt certificate:
```bash
sudo certbot renew
sudo systemctl restart nginx
```

### Alexa Can't Reach Endpoint

1. Verify HTTPS is working:
   ```bash
   curl -I https://alexa.yourdomain.com/health
   ```

2. Check Alexa skill configuration:
   - Endpoint URL must be HTTPS
   - Must be publicly accessible
   - SSL certificate must be valid

### AudioBookshelf Connection Failed

1. Test AudioBookshelf API:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-abs-server.com/api/libraries
   ```

2. Check environment variables:
   ```bash
   cat .env
   ```

3. Verify AudioBookshelf server is accessible from your skill server

---

## Monitoring

### Log Files

Application logs are written to stdout. Capture them:

**With systemd:**
```bash
sudo journalctl -u audiobookshelf-alexa -f
```

**With CloudPanel:**
Check CloudPanel logs interface or:
```bash
tail -f /home/cloudpanel/htdocs/alexa.yourdomain.com/logs/app.log
```

### Performance Monitoring

Monitor with htop:
```bash
htop
# Look for gunicorn workers
```

### Restart Application

**CloudPanel:**
- Use CloudPanel interface: Sites → Your Site → Restart Application

**Systemd:**
```bash
sudo systemctl restart audiobookshelf-alexa
```

---

## Scaling

### Increase Workers

Edit systemd service or start command:
```bash
gunicorn --bind 127.0.0.1:5000 --workers 8 wsgi:app
```

Rule of thumb: `(2 × CPU cores) + 1` workers

### Multiple Servers

Use a load balancer to distribute across multiple servers. All servers can point to the same AudioBookshelf instance.

---

## Updates

To update the application:

1. Upload new files
2. Activate virtual environment
3. Install updated dependencies:
   ```bash
   source venv/bin/activate
   pip install -r requirements.txt --upgrade
   ```
4. Restart application:
   ```bash
   sudo systemctl restart audiobookshelf-alexa
   ```

---

## Support

For issues:
- Check logs first
- Verify AudioBookshelf connection
- Test endpoint with curl
- Check Nginx configuration
- Verify SSL certificate is valid

---

**Congratulations!** Your self-hosted AudioBookshelf Alexa skill is now running! 🎉
