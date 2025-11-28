const Alexa = require('ask-sdk-core');
const { MESSAGES } = require('../utils/constants');
const { isAuthenticated } = require('../utils/helpers');

/**
 * Handler for LaunchRequest
 * Triggered when user opens the skill without a specific intent
 */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },

  async handle(handlerInput) {
    // Check if user is authenticated
    if (!isAuthenticated(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(MESSAGES.NOT_CONFIGURED)
        .withLinkAccountCard()
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(MESSAGES.WELCOME)
      .reprompt(MESSAGES.HELP)
      .getResponse();
  }
};

module.exports = LaunchRequestHandler;
