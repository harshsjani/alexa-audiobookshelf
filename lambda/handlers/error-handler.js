const { MESSAGES } = require('../utils/constants');

/**
 * Generic error handler
 * Catches all errors and provides a friendly response
 */
const ErrorHandler = {
  canHandle() {
    return true;
  },

  handle(handlerInput, error) {
    console.error('Error handled:', error);
    console.error('Error stack:', error.stack);

    const speakOutput = MESSAGES.ERROR;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(MESSAGES.HELP)
      .getResponse();
  }
};

module.exports = ErrorHandler;
