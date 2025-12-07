# alexa-audiobookshelf

An Alexa custom skill that enables voice control of your self-hosted AudioBookshelf server. Listen to your audiobooks and podcasts hands-free using natural voice commands.

## Features

- 🎧 **Voice-controlled playback**: Play audiobooks by title or continue where you left off
- 📊 **Progress tracking**: Automatically syncs your listening progress with AudioBookshelf
- 🔍 **Library search**: Find books in your library using voice commands
- ⏯️ **Playback controls**: Pause, resume, and control playback with standard Alexa commands
- 🔐 **Secure authentication**: JWT-based authentication with AudioBookshelf API

## Deployment Options

This skill can be deployed in two ways:

### 🔷 Option 1: AWS Lambda (Node.js)
- Serverless deployment using AWS Lambda
- Free tier available
- Auto-scaling
- Located in `lambda/` directory
- See setup instructions below

### 🔶 Option 2: Self-Hosted (Python)
- Deploy on your own web server
- No AWS required
- Full control and easier debugging
- Works with CloudPanel, cPanel, or any Linux server
- Located in `python/` directory
- **[See Python Deployment Guide →](python/README.md)**

**Choose the option that best fits your needs!**

---

## Requirements

### For AWS Lambda Deployment:
- Amazon Developer Account
- AWS Account
- AudioBookshelf server (v2.0 or later) accessible via HTTPS
- Node.js 18.x or later

### For Self-Hosted Deployment:
- Amazon Developer Account
- Web server with HTTPS/SSL
- AudioBookshelf server (v2.0 or later) accessible via HTTPS
- Python 3.8 or later

## Quick Start

> **Note**: These instructions are for AWS Lambda deployment. For self-hosted Python deployment, see **[python/README.md](python/README.md)**

### AWS Lambda Deployment

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/alexa-audiobookshelf.git
cd alexa-audiobookshelf
```

#### 2. Install Dependencies

```bash
cd lambda
npm install
```

#### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your AudioBookshelf server details
```

#### 4. Setup ASK CLI

```bash
npm install -g ask-cli
ask configure
```

#### 5. Deploy the Skill

```bash
ask deploy
```

### Self-Hosted Python Deployment

For deploying on your own server (CloudPanel, cPanel, VPS, etc.):

```bash
cd python
bash setup.sh
# Edit .env with your details
python app.py
```

**See [python/DEPLOYMENT.md](python/DEPLOYMENT.md) for complete instructions.**

## Configuration

### Environment Variables

Create a `.env` file in the `lambda/` directory with the following:

```env
AUDIOBOOKSHELF_URL=https://your-server.com
AUDIOBOOKSHELF_TOKEN=your_api_token
```

**Getting your API token:**
1. Log into your AudioBookshelf server
2. Go to Settings → Account
3. Copy your API token

### Lambda Environment Variables

If deploying to AWS Lambda, set these environment variables in the Lambda console:
- `AUDIOBOOKSHELF_URL`: Your AudioBookshelf server URL
- `AUDIOBOOKSHELF_TOKEN`: Your API token (optional if using account linking)

## Usage

### Example Voice Commands

**Opening the skill:**
- "Alexa, open audio bookshelf"

**Playing books:**
- "Alexa, ask audio bookshelf to play The Hobbit"
- "Alexa, tell audio bookshelf to play Ready Player One"

**Continuing playback:**
- "Alexa, ask audio bookshelf to continue my book"
- "Alexa, tell audio bookshelf to continue where I left off"

**Playback controls:**
- "Alexa, pause"
- "Alexa, resume"
- "Alexa, stop"

## Project Structure

```
alexa-audiobookshelf/
├── lambda/                          # AWS Lambda function code
│   ├── handlers/                    # Intent handlers
│   │   ├── launch-handler.js
│   │   ├── play-book-handler.js
│   │   ├── continue-book-handler.js
│   │   ├── playback-control-handlers.js
│   │   ├── audio-player-handlers.js
│   │   └── error-handler.js
│   ├── services/                    # Business logic
│   │   └── audiobookshelf-client.js # AudioBookshelf API client
│   ├── utils/                       # Helper functions
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── index.js                     # Main Lambda handler
│   └── package.json                 # Dependencies
├── skill-package/                   # Skill metadata
│   ├── skill.json                   # Skill manifest
│   └── interactionModels/
│       └── custom/
│           └── en-US.json           # Interaction model
├── CLAUDE.md                        # AI assistant guide
└── README.md                        # This file
```

## Architecture

### How It Works

1. **User speaks to Alexa**: "Alexa, ask audio bookshelf to play The Hobbit"
2. **Alexa processes the command**: Converts speech to intent (PlayBookIntent)
3. **Lambda function executes**: Handles the intent and calls AudioBookshelf API
4. **AudioBookshelf responds**: Returns search results and stream URL
5. **Alexa plays audio**: Streams the audiobook from your AudioBookshelf server
6. **Progress syncs**: Playback progress is automatically saved to AudioBookshelf

### AudioPlayer Interface

This skill uses the Alexa AudioPlayer interface to stream audio. The audio plays on the Alexa device, not on the AudioBookshelf server itself.

**Important**: AudioBookshelf must provide HTTPS streaming URLs for Alexa to play the audio.

## Development

### Local Testing

Use the ASK CLI dialog simulator for testing:

```bash
ask dialog --locale en-US
```

Example dialog:
```
User  > open audio bookshelf
Alexa > Welcome to Audio Bookshelf...
User  > continue my book
Alexa > Continuing The Hobbit. You're 35% through.
```

### Running Tests

```bash
npm test
```

### Viewing Logs

View Lambda execution logs:

```bash
ask logs --skill-id <your-skill-id>
```

Or use CloudWatch Logs in AWS Console.

## AudioBookshelf API Integration

This skill uses the AudioBookshelf REST API:

### Key Endpoints Used

- `POST /api/login` - Authenticate and get JWT token
- `GET /api/libraries` - Get user's libraries
- `GET /api/libraries/{id}/search` - Search for books
- `GET /api/me/items-in-progress` - Get currently listening books
- `GET /api/items/{id}/play` - Get stream URL for playback
- `PATCH /api/me/progress/{id}` - Update listening progress

### Authentication

The skill supports both:
1. **API Token**: Set as environment variable
2. **JWT Token**: Obtained via login endpoint (v2.26.0+)

## Deployment

### Deploy to AWS Lambda

1. **Create Lambda function** in AWS Console
2. **Set environment variables** (AUDIOBOOKSHELF_URL, AUDIOBOOKSHELF_TOKEN)
3. **Deploy using ASK CLI**:
   ```bash
   ask deploy --target lambda
   ```

### Configure Skill

1. **Deploy skill manifest**:
   ```bash
   ask deploy --target skill
   ```

2. **Update skill.json** with your Lambda ARN

3. **Enable skill** in Alexa Developer Console

### Testing

Test in the Alexa Developer Console:
1. Go to Test tab
2. Enable testing for "Development"
3. Test with voice or text commands

## Troubleshooting

### "There was a problem with the requested skill's response"

- Check CloudWatch logs for errors
- Verify Lambda timeout is at least 8 seconds
- Ensure response format is valid

### "I couldn't find any books matching..."

- Verify AudioBookshelf server is accessible
- Check API token is valid
- Ensure library has books

### Audio won't play

- Verify AudioBookshelf provides HTTPS URLs
- Check stream URL format
- Ensure audio format is supported (MP3, AAC)

### Authentication failed

- Verify AUDIOBOOKSHELF_URL is correct (with https://)
- Check API token is valid
- For JWT: ensure v2.26.0+ and credentials are correct

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Resources

- [AudioBookshelf Documentation](https://www.audiobookshelf.org/docs/)
- [AudioBookshelf API Reference](https://api.audiobookshelf.org/)
- [Alexa Skills Kit Documentation](https://developer.amazon.com/docs/alexa/ask-overviews/what-is-the-alexa-skills-kit.html)
- [ASK SDK for Node.js](https://developer.amazon.com/docs/alexa/alexa-skills-kit-sdk-for-nodejs/overview.html)

## Support

For issues and questions:
- AudioBookshelf: [GitHub Issues](https://github.com/advplyr/audiobookshelf/issues)
- This skill: [Create an issue](https://github.com/yourusername/alexa-audiobookshelf/issues)

---

**Note**: This is an unofficial community project and is not affiliated with or endorsed by Amazon or AudioBookshelf.
