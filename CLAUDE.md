# CLAUDE.md - AI Assistant Development Guide

This document provides comprehensive guidance for AI assistants working on the alexa-audiobookshelf project.

## Project Overview

**Project**: alexa-audiobookshelf
**Purpose**: Custom Alexa skill for controlling and interacting with AudioBookshelf servers
**Type**: Alexa Custom Skill with backend integration
**Status**: Initial development phase

### What is AudioBookshelf?

AudioBookshelf is a self-hosted audiobook and podcast server. Users can manage their audiobook libraries, track listening progress, and stream content across devices.

### Project Goals

- Enable voice control of AudioBookshelf through Alexa devices
- Support common operations: play/pause, resume, search for books, check progress
- Provide seamless authentication and session management
- Deliver a natural, conversational voice experience

## Repository Structure

When fully developed, the expected structure is:

```
alexa-audiobookshelf/
├── lambda/                    # AWS Lambda function code
│   ├── index.js              # Main Lambda handler
│   ├── handlers/             # Intent handlers
│   ├── services/             # Business logic (AudioBookshelf API client)
│   ├── utils/                # Helper functions
│   └── package.json          # Lambda dependencies
├── models/                    # Alexa interaction models
│   ├── en-US.json            # US English model
│   └── en-GB.json            # UK English model (optional)
├── skill-package/            # Skill metadata
│   ├── skill.json            # Skill manifest
│   └── interactionModels/    # Voice models
├── tests/                     # Test files
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── .ask/                      # ASK CLI configuration
├── README.md                 # Project documentation
├── CLAUDE.md                 # This file
└── package.json              # Project dependencies
```

## Technology Stack

### Core Technologies

- **Runtime**: Node.js (18.x or later recommended for Lambda)
- **Framework**: Alexa Skills Kit SDK v2 for Node.js
- **Hosting**: AWS Lambda (or self-hosted web service)
- **API**: AudioBookshelf REST API
- **Authentication**: Bearer token authentication (JWT as of v2.26.0)

### Key Dependencies

```json
{
  "ask-sdk-core": "^2.x",
  "ask-sdk-model": "^1.x",
  "axios": "^1.x",
  "dotenv": "^16.x"
}
```

## Development Setup

### Prerequisites

1. Amazon Developer Account
2. AWS Account (for Lambda hosting)
3. ASK CLI installed: `npm install -g ask-cli`
4. Node.js 18.x or later
5. Access to an AudioBookshelf server instance

### Initial Setup Commands

```bash
# Install dependencies
npm install

# Configure ASK CLI
ask configure

# Deploy skill
ask deploy

# Test locally
ask dialog --locale en-US
```

## Alexa Skill Architecture

### Interaction Model

The interaction model defines how users interact with the skill through voice commands.

**Key Components**:

1. **Invocation Name**: "audio bookshelf" or "my audiobooks"
2. **Intents**: User actions the skill can handle
3. **Slots**: Variables within intents
4. **Utterances**: Example phrases users might say

### Core Intents to Implement

```javascript
// Built-in intents (required)
- AMAZON.HelpIntent
- AMAZON.StopIntent
- AMAZON.CancelIntent
- AMAZON.NavigateHomeIntent
- AMAZON.PauseIntent
- AMAZON.ResumeIntent

// Custom intents
- PlayBookIntent          // "Play [book title]"
- ContinueBookIntent      // "Continue my book"
- SearchBooksIntent       // "Find books by [author]"
- GetProgressIntent       // "How much have I listened to?"
- NextChapterIntent       // "Next chapter"
- PreviousChapterIntent   // "Previous chapter"
```

### Lambda Handler Structure

```javascript
// Recommended handler structure
const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    // Implementation
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayBookIntentHandler,
    // ... other handlers
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
```

## AudioBookshelf API Integration

### API Endpoints Documentation

Official API Reference: https://api.audiobookshelf.org/

### Authentication

**Current Method (transitioning)**:
```javascript
headers: {
  'Authorization': `Bearer ${apiToken}`
}
```

**New JWT Method (v2.26.0+)**: Preferred for new implementations
```javascript
// Login to get JWT
POST /api/login
{
  "username": "user",
  "password": "password"
}

// Use JWT token
headers: {
  'Authorization': `Bearer ${jwtToken}`
}
```

**Important**: Old authentication system will be removed no earlier than September 30, 2025.

### Key API Endpoints

```javascript
// Authentication
POST   /api/login                    // Get JWT token
POST   /api/logout                   // Invalidate session

// Library Operations
GET    /api/libraries                // Get all libraries
GET    /api/libraries/{id}/items     // Get library items
GET    /api/items/{id}               // Get specific item

// Playback
POST   /api/me/progress/{id}         // Update progress
GET    /api/me/listening-sessions    // Get listening history
GET    /api/me/items-in-progress     // Get current books

// Search
GET    /api/libraries/{id}/search?q={query}  // Search library
```

### AudioBookshelf Client Service

Create a dedicated service for API interactions:

```javascript
// services/audiobookshelf.js
class AudioBookshelfClient {
  constructor(baseUrl, apiToken) {
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
    this.axios = axios.create({
      baseURL: baseUrl,
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
  }

  async getLibraries() { /* ... */ }
  async searchBooks(query) { /* ... */ }
  async getInProgress() { /* ... */ }
  async updateProgress(itemId, progress) { /* ... */ }
}
```

## Session Management

### Account Linking

Users need to link their AudioBookshelf account to the Alexa skill.

**Setup**:
1. Configure Account Linking in skill console
2. Provide authorization URL (your AudioBookshelf instance)
3. Handle token exchange
4. Store access token in session attributes

### Session Attributes

Store user context between requests:

```javascript
const sessionAttributes = {
  userId: 'user-id',
  currentBook: {
    id: 'book-id',
    title: 'Book Title',
    progress: 0.35
  },
  apiBaseUrl: 'https://audiobookshelf.example.com',
  lastIntent: 'PlayBookIntent'
};
```

## Coding Conventions

### File Organization

- **One handler per file** in `handlers/` directory
- **Services** for external API calls in `services/`
- **Utils** for pure functions in `utils/`
- **Constants** in `constants.js`

### Naming Conventions

- **Files**: kebab-case (e.g., `play-book-handler.js`)
- **Classes**: PascalCase (e.g., `AudioBookshelfClient`)
- **Functions**: camelCase (e.g., `getInProgressBooks`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_SEARCH_RESULTS`)

### Error Handling

```javascript
// Always wrap external API calls in try-catch
try {
  const books = await audiobookshelfClient.searchBooks(query);
  // Handle success
} catch (error) {
  console.error('Failed to search books:', error);
  return handlerInput.responseBuilder
    .speak('Sorry, I had trouble connecting to your library.')
    .reprompt('Please try again.')
    .getResponse();
}
```

### Response Best Practices

1. **Keep responses conversational**: "I found 3 books by Stephen King. Which would you like to hear?"
2. **Provide context**: "You're 35% through The Stand. Would you like to continue?"
3. **Offer suggestions**: Use reprompts to guide users
4. **Handle errors gracefully**: Always provide helpful fallback messages

### Voice-First Design

- Use SSML for natural speech patterns
- Provide audio cues for long operations
- Keep responses under 8 seconds when possible
- Offer progressive disclosure (don't list everything at once)

```javascript
// Good: Progressive disclosure
const speakOutput = 'I found 12 books. The top 3 are: ' +
  'Ready Player One, The Martian, and Project Hail Mary. ' +
  'Which one would you like to play?';

// Bad: Information dump
const speakOutput = 'I found 12 books: Ready Player One, The Martian, ' +
  'Project Hail Mary, Ender\'s Game, ... [8 more books]';
```

## Testing Strategy

### Unit Tests

Test individual handlers and services:

```javascript
// tests/unit/play-book-handler.test.js
const { expect } = require('chai');
const PlayBookHandler = require('../../handlers/play-book-handler');

describe('PlayBookHandler', () => {
  it('should handle PlayBookIntent', () => {
    // Test implementation
  });
});
```

### Integration Tests

Use `ask dialog` for interactive testing:

```bash
ask dialog --locale en-US
```

### Automated Testing

```bash
npm test                    # Run all tests
npm run test:unit          # Run unit tests
npm run test:integration   # Run integration tests
npm run test:coverage      # Generate coverage report
```

## Deployment Process

### ASK CLI Deployment

```bash
# Deploy everything (Lambda + skill config)
ask deploy

# Deploy only Lambda function
ask deploy --target lambda

# Deploy only skill configuration
ask deploy --target skill
```

### Environment Variables

Store sensitive data in Lambda environment variables:

```javascript
// In Lambda console or serverless.yml
AUDIOBOOKSHELF_BASE_URL=https://abs.example.com
DEFAULT_LIBRARY_ID=library-id
```

Access in code:
```javascript
const baseUrl = process.env.AUDIOBOOKSHELF_BASE_URL;
```

### Skill Certification

Before submission:
1. Test all intents thoroughly
2. Ensure privacy policy is in place
3. Complete skill metadata (description, icons, examples)
4. Test on multiple devices
5. Review Amazon's certification requirements

## Common Patterns

### Progressive Response Pattern

For long operations, use progressive responses:

```javascript
// Send initial response
await handlerInput.responseBuilder
  .speak('Let me search your library.')
  .withShouldEndSession(false)
  .getResponse();

// Perform operation
const results = await searchBooks(query);

// Send final response
return handlerInput.responseBuilder
  .speak(`I found ${results.length} books...`)
  .getResponse();
```

### State Management Pattern

Use session and persistent attributes:

```javascript
// Session attributes (temporary)
const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
sessionAttributes.lastBook = bookId;
handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

// Persistent attributes (saved across sessions)
const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
persistentAttributes.favoriteGenre = 'science fiction';
handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
await handlerInput.attributesManager.savePersistentAttributes();
```

## Anti-Patterns to Avoid

### ❌ Don't: Hardcode user data
```javascript
// Bad
const SERVER_URL = 'https://my-server.com';
```

### ✅ Do: Use account linking and session attributes
```javascript
// Good
const serverUrl = sessionAttributes.serverUrl;
```

### ❌ Don't: Return empty responses
```javascript
// Bad
return handlerInput.responseBuilder.getResponse();
```

### ✅ Do: Always provide feedback
```javascript
// Good
return handlerInput.responseBuilder
  .speak('I didn\'t understand. Please try again.')
  .reprompt('What would you like to do?')
  .getResponse();
```

### ❌ Don't: Make synchronous API calls
```javascript
// Bad - blocks Lambda execution
const result = syncApiCall();
```

### ✅ Do: Use async/await
```javascript
// Good
const result = await asyncApiCall();
```

## Security Considerations

1. **Never log sensitive data**: Don't log API tokens, passwords, or user data
2. **Validate all inputs**: Check slot values before using them
3. **Use HTTPS only**: All AudioBookshelf API calls must use HTTPS
4. **Implement rate limiting**: Prevent abuse of API endpoints
5. **Secure account linking**: Use OAuth 2.0 for account linking
6. **Token rotation**: Implement refresh token logic for long-lived sessions

## Performance Optimization

1. **Cache frequently accessed data**: Library lists, user preferences
2. **Minimize cold starts**: Keep Lambda warm with CloudWatch Events
3. **Optimize dependencies**: Only include necessary npm packages
4. **Use connection pooling**: Reuse HTTP connections to AudioBookshelf
5. **Implement timeouts**: Set appropriate timeouts for API calls (5-10 seconds)

## Debugging

### CloudWatch Logs

View Lambda logs:
```bash
ask logs --skill-id <skill-id>
```

### Local Testing

```bash
# Interactive dialog
ask dialog --locale en-US

# Replay a conversation
ask dialog --replay conversation.json
```

### Common Issues

**Issue**: "There was a problem with the requested skill's response"
- Check CloudWatch logs for errors
- Verify response format matches Alexa requirements
- Ensure Lambda timeout is sufficient (8+ seconds recommended)

**Issue**: Account linking fails
- Verify OAuth URLs are correct
- Check token endpoint is accessible
- Ensure client ID/secret match

**Issue**: AudioBookshelf API returns 401
- Verify API token is valid
- Check if server requires JWT authentication
- Ensure Authorization header is properly formatted

## Resources and References

### Official Documentation

- [Alexa Skills Kit](https://developer.amazon.com/en-US/alexa/alexa-skills-kit)
- [ASK SDK for Node.js](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/overview.html)
- [AudioBookshelf API Docs](https://api.audiobookshelf.org/)
- [AudioBookshelf GitHub](https://github.com/advplyr/audiobookshelf)

### Tutorials and Guides

- [Steps to Build a Custom Skill](https://developer.amazon.com/en-US/docs/alexa/custom-skills/steps-to-build-a-custom-skill.html)
- [Best Practices for Creating Alexa Skills](https://www.storyblok.com/mp/best-practices-for-creating-alexa-skills)
- [Alexa Design Guide](https://developer.amazon.com/en-US/docs/alexa/alexa-design/get-started.html)

### Community Resources

- AudioBookshelf Subreddit: r/audiobookshelf
- Alexa Developer Forums
- Stack Overflow tags: `alexa-skills-kit`, `alexa`

## Version History

- **v0.1.0** (2025-11-28): Initial CLAUDE.md creation, project setup guidance

## Contributing Guidelines

When working on this project:

1. **Always read existing code** before making changes
2. **Test voice interactions** on actual Alexa devices when possible
3. **Update this document** when adding new patterns or conventions
4. **Write descriptive commit messages** following conventional commits format
5. **Add tests** for new handlers and services
6. **Document new intents** in the interaction model section

## AI Assistant Specific Notes

### When to Use Task Tool
- Exploring codebase structure (use `subagent_type=Explore`)
- Complex multi-file refactoring
- Researching Alexa or AudioBookshelf API patterns

### When to Use Direct Tools
- Reading specific files: Use `Read`
- Making targeted edits: Use `Edit`
- Creating new files: Use `Write`
- Running tests: Use `Bash`

### Key Considerations for AI Assistants

1. **Voice-first design**: Always consider how responses sound, not just how they read
2. **Error recovery**: Alexa skills should gracefully handle all error cases
3. **Session context**: Track user state across turns in a conversation
4. **Natural language**: Prioritize conversational responses over technical accuracy
5. **Testing importance**: Voice interactions are harder to test than traditional UIs

---

**Last Updated**: 2025-11-28
**Maintained By**: AI assistants working on alexa-audiobookshelf project
**Questions?**: Refer to official documentation links above or search the codebase
