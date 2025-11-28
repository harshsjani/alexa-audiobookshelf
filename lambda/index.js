const Alexa = require('ask-sdk-core');

// Import handlers
const LaunchRequestHandler = require('./handlers/launch-handler');
const ContinueBookHandler = require('./handlers/continue-book-handler');
const PlayBookHandler = require('./handlers/play-book-handler');
const {
  PauseIntentHandler,
  ResumeIntentHandler,
  StopAndCancelIntentHandler,
  HelpIntentHandler,
  FallbackIntentHandler
} = require('./handlers/playback-control-handlers');
const {
  PlaybackStartedHandler,
  PlaybackFinishedHandler,
  PlaybackStoppedHandler,
  PlaybackNearlyFinishedHandler,
  PlaybackFailedHandler
} = require('./handlers/audio-player-handlers');
const ErrorHandler = require('./handlers/error-handler');

/**
 * Request interceptor to log all incoming requests
 */
const RequestInterceptor = {
  process(handlerInput) {
    console.log('REQUEST ENVELOPE:', JSON.stringify(handlerInput.requestEnvelope, null, 2));
  }
};

/**
 * Response interceptor to log all outgoing responses
 */
const ResponseInterceptor = {
  process(handlerInput, response) {
    console.log('RESPONSE:', JSON.stringify(response, null, 2));
  }
};

/**
 * SessionEndedRequest Handler
 * Called when the session ends
 */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log('Session ended:', JSON.stringify(handlerInput.requestEnvelope.request.reason));
    return handlerInput.responseBuilder.getResponse();
  }
};

/**
 * IntentReflector Handler
 * Catch-all for any intents not handled by other handlers
 * Useful for debugging
 */
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

/**
 * Lambda handler - Main entry point for the skill
 */
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    // Core intent handlers
    LaunchRequestHandler,
    ContinueBookHandler,
    PlayBookHandler,

    // Built-in intent handlers
    HelpIntentHandler,
    PauseIntentHandler,
    ResumeIntentHandler,
    StopAndCancelIntentHandler,
    FallbackIntentHandler,

    // AudioPlayer event handlers
    PlaybackStartedHandler,
    PlaybackFinishedHandler,
    PlaybackStoppedHandler,
    PlaybackNearlyFinishedHandler,
    PlaybackFailedHandler,

    // Session and utility handlers
    SessionEndedRequestHandler,
    IntentReflectorHandler // Keep this last
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(RequestInterceptor)
  .addResponseInterceptors(ResponseInterceptor)
  .withCustomUserAgent('alexa-audiobookshelf/1.0')
  .lambda();
