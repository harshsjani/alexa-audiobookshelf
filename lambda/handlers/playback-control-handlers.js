const Alexa = require('ask-sdk-core');
const { MESSAGES, SESSION_KEYS } = require('../utils/constants');
const { buildStopDirective, buildAudioDirective, getAudioBookshelfClient } = require('../utils/helpers');

/**
 * Handler for AMAZON.PauseIntent
 * Pauses the currently playing audio
 */
const PauseIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PauseIntent';
  },

  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addDirective(buildStopDirective())
      .getResponse();
  }
};

/**
 * Handler for AMAZON.ResumeIntent
 * Resumes playback from where it was paused
 */
const ResumeIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent';
  },

  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const client = getAudioBookshelfClient(handlerInput);

    if (!client) {
      return handlerInput.responseBuilder
        .speak(MESSAGES.NOT_CONFIGURED)
        .withLinkAccountCard()
        .getResponse();
    }

    const itemId = sessionAttributes[SESSION_KEYS.CURRENT_ITEM];
    const offset = sessionAttributes[SESSION_KEYS.OFFSET] || 0;

    if (!itemId) {
      return handlerInput.responseBuilder
        .speak('There\'s nothing to resume. You can ask me to play a book or continue your current book.')
        .reprompt(MESSAGES.HELP)
        .getResponse();
    }

    const streamUrl = client.getStreamUrl(itemId);
    const audioDirective = buildAudioDirective(streamUrl, itemId, offset);

    return handlerInput.responseBuilder
      .speak('Resuming')
      .addDirective(audioDirective)
      .getResponse();
  }
};

/**
 * Handler for AMAZON.StopIntent and AMAZON.CancelIntent
 * Stops playback and exits the skill
 */
const StopAndCancelIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent');
  },

  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(MESSAGES.GOODBYE)
      .addDirective(buildStopDirective())
      .withShouldEndSession(true)
      .getResponse();
  }
};

/**
 * Handler for AMAZON.HelpIntent
 * Provides help information to the user
 */
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },

  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(MESSAGES.HELP)
      .reprompt(MESSAGES.HELP)
      .getResponse();
  }
};

/**
 * Handler for AMAZON.FallbackIntent
 * Handles unrecognized intents
 */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },

  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(MESSAGES.FALLBACK)
      .reprompt(MESSAGES.HELP)
      .getResponse();
  }
};

module.exports = {
  PauseIntentHandler,
  ResumeIntentHandler,
  StopAndCancelIntentHandler,
  HelpIntentHandler,
  FallbackIntentHandler
};
