# AudioBookshelf Alexa Skill - Python (Self-Hosted)

Self-hosted Python Flask implementation of the AudioBookshelf Alexa skill. No AWS Lambda required!

## Features

- ✅ **No AWS required** - Host on your own server
- ✅ **Python Flask** - Simple, lightweight web framework
- ✅ **Same functionality** - All features from Lambda version
- ✅ **Easy deployment** - Works with CloudPanel, cPanel, or any Linux server
- ✅ **Full control** - Your infrastructure, your rules

## Quick Start

### 1. Install Dependencies

```bash
cd python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure

```bash
cp .env.example .env
nano .env
```

Set your AudioBookshelf URL and API token.

### 3. Run Development Server

```bash
python app.py
```

The app will run at `http://localhost:5000`

### 4. Test

```bash
curl http://localhost:5000/health
```

Should return: `{"status": "healthy", ...}`

## Production Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions:

- **CloudPanel**: Step-by-step CloudPanel setup
- **Generic Linux**: systemd + Nginx configuration
- **Troubleshooting**: Common issues and solutions

## Project Structure

```
python/
├── app.py                      # Main Flask application with Alexa handlers
├── wsgi.py                     # WSGI entry point for production
├── audiobookshelf_client.py    # AudioBookshelf API client
├── constants.py                # Constants and messages
├── helpers.py                  # Utility functions
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variables template
├── DEPLOYMENT.md               # Detailed deployment guide
└── README.md                   # This file
```

## Endpoints

- `POST /alexa` - Alexa skill endpoint (configure in skill.json)
- `GET /health` - Health check endpoint
- `GET /` - Service information

## Environment Variables

Required:
- `AUDIOBOOKSHELF_URL` - Your AudioBookshelf server URL (HTTPS)
- `AUDIOBOOKSHELF_TOKEN` - Your AudioBookshelf API token

Optional:
- `DEBUG` - Enable debug mode (default: False)
- `PORT` - Port to run on (default: 5000)

## Alexa Configuration

Update your `skill-package/skill.json`:

```json
{
  "apis": {
    "custom": {
      "endpoint": {
        "uri": "https://your-domain.com/alexa"
      }
    }
  }
}
```

Then deploy:
```bash
ask deploy --target skill
```

## Advantages Over Lambda

| Feature | Lambda | Self-Hosted |
|---------|--------|-------------|
| **Cost** | Free tier, then pay per request | One-time server cost |
| **Control** | Limited | Full |
| **Debugging** | CloudWatch logs | Direct access |
| **Latency** | Cold starts | Always warm |
| **Setup** | AWS account required | Use existing server |
| **AudioBookshelf** | Remote calls | Can be localhost |

## Production Deployment Options

### Option 1: Gunicorn (Recommended)

```bash
gunicorn --bind 127.0.0.1:5000 --workers 4 wsgi:app
```

### Option 2: uWSGI

```bash
uwsgi --http 127.0.0.1:5000 --wsgi-file wsgi.py --callable app --processes 4
```

### Option 3: CloudPanel

CloudPanel automatically configures everything. Just upload files and start!

## Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /alexa {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development

### Running Tests

```bash
python -m pytest tests/
```

### Debug Mode

Set in `.env`:
```env
DEBUG=True
```

### Viewing Logs

Logs are written to stdout. Capture with:
```bash
python app.py 2>&1 | tee app.log
```

Or with systemd:
```bash
journalctl -u audiobookshelf-alexa -f
```

## Troubleshooting

### Import Errors

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Connection to AudioBookshelf Failed

Test API connection:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-abs-server.com/api/libraries
```

### Alexa Can't Reach Endpoint

1. Verify HTTPS is working
2. Check firewall allows port 443
3. Verify domain resolves correctly
4. Check Nginx is running and configured

## Security

- ✅ HTTPS required (Alexa requirement)
- ✅ Environment variables for secrets
- ✅ No hardcoded credentials
- ✅ Request validation (optional, see DEPLOYMENT.md)

## Performance

- **Workers**: Set based on CPU cores: `(2 × cores) + 1`
- **Memory**: ~50MB per worker
- **Concurrency**: Handles 100+ concurrent users easily

## Comparison to Node.js Version

Both versions have identical functionality. Choose based on:

- **Python**: Easier to deploy on shared hosting, simpler debugging
- **Node.js/Lambda**: Better for AWS-native deployments

## Support

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed troubleshooting.

For issues:
1. Check logs
2. Test health endpoint
3. Verify AudioBookshelf connection
4. Check Alexa Developer Console

## License

MIT License - See ../LICENSE file for details

---

**Ready to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions!
