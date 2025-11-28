# Setup Guide

This guide will walk you through setting up the AudioBookshelf Alexa skill from scratch.

## Prerequisites

Before you begin, ensure you have:

- ✅ Amazon Developer Account ([Sign up here](https://developer.amazon.com/))
- ✅ AWS Account ([Sign up here](https://aws.amazon.com/))
- ✅ AudioBookshelf server running (v2.0 or later)
- ✅ AudioBookshelf server accessible via HTTPS
- ✅ Node.js 18.x or later installed
- ✅ Git installed

## Step 1: AudioBookshelf Server Setup

### 1.1 Verify Your Server

Make sure your AudioBookshelf server is:
- Running and accessible
- Using HTTPS (required for Alexa)
- Has at least one library with audiobooks

### 1.2 Get Your API Token

1. Log into your AudioBookshelf web interface
2. Click on your user icon in the top right
3. Go to **Settings** → **Account**
4. Scroll to **API Access**
5. Copy your **API Token** (or generate one if needed)

**Save this token** - you'll need it later!

### 1.3 Test API Access

Test that your API token works:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-audiobookshelf-server.com/api/libraries
```

You should see a JSON response with your libraries.

## Step 2: Install Required Tools

### 2.1 Install Node.js

Download and install from [nodejs.org](https://nodejs.org/) (v18 or later).

Verify installation:
```bash
node --version
npm --version
```

### 2.2 Install ASK CLI

The Alexa Skills Kit CLI is required for deploying the skill:

```bash
npm install -g ask-cli
```

Verify installation:
```bash
ask --version
```

### 2.3 Configure ASK CLI

Link the CLI to your Amazon Developer Account:

```bash
ask configure
```

This will:
1. Open a browser for you to log in to your Amazon Developer account
2. Grant permissions to the CLI
3. Configure AWS credentials (if not already set up)

## Step 3: Clone and Configure the Project

### 3.1 Clone the Repository

```bash
git clone https://github.com/yourusername/alexa-audiobookshelf.git
cd alexa-audiobookshelf
```

### 3.2 Install Dependencies

```bash
cd lambda
npm install
cd ..
```

### 3.3 Configure Environment Variables

Create environment file:
```bash
cd lambda
cp .env.example .env
```

Edit `.env` with your details:
```env
AUDIOBOOKSHELF_URL=https://your-audiobookshelf-server.com
AUDIOBOOKSHELF_TOKEN=your_api_token_here
```

## Step 4: Configure AWS Lambda

### 4.1 Create IAM Role

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Roles** → **Create role**
3. Select **AWS service** → **Lambda**
4. Attach policy: **AWSLambdaBasicExecutionRole**
5. Name it: `alexa-audiobookshelf-role`
6. Click **Create role**

### 4.2 Update Skill Manifest

Edit `skill-package/skill.json` and update the Lambda ARN:

```json
{
  "apis": {
    "custom": {
      "endpoint": {
        "uri": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:alexa-audiobookshelf"
      }
    }
  }
}
```

You can find your AWS account ID in the AWS Console (top right corner).

## Step 5: Deploy the Skill

### 5.1 Create New Skill

If this is your first deployment:

```bash
ask deploy
```

This will:
- Create the skill in the Alexa Developer Console
- Create the Lambda function in AWS
- Deploy all code and configuration

**Save the Skill ID** that's displayed - you'll need it!

### 5.2 Set Lambda Environment Variables

After first deployment, set environment variables in Lambda:

```bash
ask lambda update-environment-variables \
  --function-name alexa-audiobookshelf \
  --environment Variables={AUDIOBOOKSHELF_URL=https://your-server.com,AUDIOBOOKSHELF_TOKEN=your_token}
```

Or do it manually:
1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find your function: `alexa-audiobookshelf`
3. Go to **Configuration** → **Environment variables**
4. Add:
   - Key: `AUDIOBOOKSHELF_URL`, Value: `https://your-server.com`
   - Key: `AUDIOBOOKSHELF_TOKEN`, Value: `your_api_token`

### 5.3 Configure Lambda Trigger

1. In Lambda console, go to **Configuration** → **Triggers**
2. Click **Add trigger**
3. Select **Alexa Skills Kit**
4. Enter your **Skill ID** (from step 5.1)
5. Click **Add**

## Step 6: Test the Skill

### 6.1 Test in Alexa Developer Console

1. Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Find your skill: **AudioBookshelf**
3. Click **Test** tab
4. Enable testing: **Development**

Try these commands:
```
open audio bookshelf
continue my book
play The Hobbit
```

### 6.2 Test with ASK CLI

Test locally with dialog mode:

```bash
ask dialog --locale en-US
```

Example interaction:
```
User  > open audio bookshelf
Alexa > Welcome to Audio Bookshelf. You can ask me to play an audiobook...
User  > continue my book
Alexa > Continuing The Hobbit. You're 35% through.
```

### 6.3 Test on Alexa Device

If you have an Alexa device:
1. Ensure it's registered to the same Amazon account
2. Say: **"Alexa, open audio bookshelf"**
3. Follow the prompts

## Step 7: Enable on Your Account

### 7.1 Find the Skill

The skill is automatically available on devices linked to your developer account.

### 7.2 Check in Alexa App

1. Open Alexa mobile app
2. Go to **More** → **Skills & Games**
3. Go to **Your Skills** → **Dev**
4. You should see **AudioBookshelf**

## Troubleshooting

### Deployment Issues

**Error: "Skill with given skillId does not exist"**
- Run `ask deploy` to create the skill first
- Check `.ask/ask-states.json` for skill ID

**Error: "Lambda function not found"**
- Ensure you've run `ask deploy` at least once
- Check AWS Lambda console for the function

### Testing Issues

**"There was a problem with the requested skill's response"**
- Check CloudWatch Logs in AWS Console
- Look for the log group: `/aws/lambda/alexa-audiobookshelf`
- Check for error messages

**"Your AudioBookshelf account isn't linked yet"**
- Verify environment variables are set in Lambda
- Check AUDIOBOOKSHELF_URL and AUDIOBOOKSHELF_TOKEN

**"I couldn't find any books matching..."**
- Verify your AudioBookshelf server is accessible via HTTPS
- Test the API endpoint manually with curl
- Check that your library has books

### Audio Playback Issues

**Audio won't play**
- AudioBookshelf must provide HTTPS URLs (not HTTP)
- Verify stream URL format: should be `https://your-server.com/api/items/{id}/play?token=...`
- Check audio format is supported (MP3, AAC)

**Playback stops immediately**
- Check Lambda timeout (should be at least 8 seconds)
- Verify AudioBookshelf server isn't blocking requests
- Check CloudWatch logs for errors

## Next Steps

### Customize the Skill

- Edit interaction model: `skill-package/interactionModels/custom/en-US.json`
- Modify voice responses: `lambda/utils/constants.js`
- Add new intents: Create new handlers in `lambda/handlers/`

### Add More Features

Ideas for enhancement:
- Add podcast support
- Implement chapter navigation
- Add bookmarking
- Support multiple libraries
- Add search by author
- Implement playlists

### Submit for Certification (Optional)

To make your skill publicly available:
1. Add privacy policy and terms of use
2. Add skill icons (108x108 and 512x512)
3. Complete all skill metadata
4. Test thoroughly on multiple devices
5. Submit for certification in Alexa Developer Console

## Getting Help

If you run into issues:

1. **Check the logs**: CloudWatch Logs are your best friend
2. **Test the API**: Use curl to verify AudioBookshelf API works
3. **Read the docs**: See CLAUDE.md for architecture details
4. **Ask for help**: Create an issue on GitHub

## Resources

- [ASK CLI Documentation](https://developer.amazon.com/docs/smapi/ask-cli-intro.html)
- [Alexa Skills Kit SDK](https://developer.amazon.com/docs/alexa/alexa-skills-kit-sdk-for-nodejs/overview.html)
- [AudioBookshelf API Docs](https://api.audiobookshelf.org/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)

---

**Congratulations!** You now have a working Alexa skill for AudioBookshelf! 🎉
