const Alexa = require('ask-sdk-core');
const { MESSAGES, SESSION_KEYS } = require('../utils/constants');
const {
  getAudioBookshelfClient,
  buildAudioDirective,
  getItemTitle,
  getItemAuthor,
  getItemCoverUrl,
  getProgressPercent
} = require('../utils/helpers');

/**
 * Handler for ContinueBookIntent
 * Continues playing the user's current audiobook
 */
const ContinueBookHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ContinueBookIntent';
  },

  async handle(handlerInput) {
    const client = getAudioBookshelfClient(handlerInput);

    if (!client) {
      return handlerInput.responseBuilder
        .speak(MESSAGES.NOT_CONFIGURED)
        .withLinkAccountCard()
        .getResponse();
    }

    try {
      // Get items in progress
      const itemsInProgress = await client.getItemsInProgress();

      if (!itemsInProgress || itemsInProgress.length === 0) {
        return handlerInput.responseBuilder
          .speak(MESSAGES.NO_ITEMS_IN_PROGRESS)
          .reprompt('Would you like to search for a book?')
          .getResponse();
      }

      // Get the most recent item
      const item = itemsInProgress[0];
      const title = getItemTitle(item);
      const author = getItemAuthor(item);

      // Get progress information
      const progress = item.userMediaProgress || {};
      const currentTime = progress.currentTime || 0;
      const duration = progress.duration || 0;
      const progressPercent = getProgressPercent(currentTime, duration);

      // Get stream URL
      const streamUrl = client.getStreamUrl(item.id);

      // Store session attributes
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes[SESSION_KEYS.CURRENT_ITEM] = item.id;
      sessionAttributes[SESSION_KEYS.OFFSET] = currentTime * 1000; // Convert to milliseconds
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      // Build metadata
      const baseUrl = sessionAttributes[SESSION_KEYS.BASE_URL] || process.env.AUDIOBOOKSHELF_URL;
      const metadata = {
        title: title,
        subtitle: `by ${author}`,
        art: getItemCoverUrl(item, baseUrl)
      };

      // Build audio directive
      const audioDirective = buildAudioDirective(
        streamUrl,
        item.id,
        currentTime * 1000, // Convert to milliseconds
        metadata
      );

      const speakOutput = progressPercent > 0
        ? `Continuing ${title}. You're ${progressPercent}% through.`
        : `Playing ${title} by ${author}.`;

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .addDirective(audioDirective)
        .getResponse();

    } catch (error) {
      console.error('Error continuing book:', error);
      return handlerInput.responseBuilder
        .speak(MESSAGES.ERROR)
        .reprompt(MESSAGES.HELP)
        .getResponse();
    }
  }
};

module.exports = ContinueBookHandler;
