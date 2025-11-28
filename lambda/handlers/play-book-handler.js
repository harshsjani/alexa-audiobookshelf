const Alexa = require('ask-sdk-core');
const { MESSAGES, SESSION_KEYS } = require('../utils/constants');
const {
  getAudioBookshelfClient,
  buildAudioDirective,
  getSlotValue,
  getItemTitle,
  getItemAuthor,
  getItemCoverUrl
} = require('../utils/helpers');

/**
 * Handler for PlayBookIntent
 * Searches for and plays a specific book
 */
const PlayBookHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayBookIntent';
  },

  async handle(handlerInput) {
    const client = getAudioBookshelfClient(handlerInput);

    if (!client) {
      return handlerInput.responseBuilder
        .speak(MESSAGES.NOT_CONFIGURED)
        .withLinkAccountCard()
        .getResponse();
    }

    // Get book name from slot
    const bookName = getSlotValue(handlerInput, 'bookName');

    if (!bookName) {
      return handlerInput.responseBuilder
        .speak('What book would you like to play?')
        .reprompt('Please tell me the name of a book.')
        .getResponse();
    }

    try {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      // Get libraries and search
      const libraries = await client.getLibraries();

      if (!libraries || libraries.length === 0) {
        return handlerInput.responseBuilder
          .speak('I couldn\'t find any libraries in your AudioBookshelf account.')
          .getResponse();
      }

      // Search in the first library (or use stored library ID)
      const libraryId = sessionAttributes[SESSION_KEYS.LIBRARY_ID] || libraries[0].id;
      const searchResults = await client.searchLibrary(libraryId, bookName);

      if (!searchResults.book || searchResults.book.length === 0) {
        return handlerInput.responseBuilder
          .speak(`I couldn't find any books matching ${bookName}. Try searching for something else.`)
          .reprompt('What would you like to do?')
          .getResponse();
      }

      // Get the first result
      const item = searchResults.book[0].libraryItem;
      const title = getItemTitle(item);
      const author = getItemAuthor(item);

      // Get stream URL
      const streamUrl = client.getStreamUrl(item.id);

      // Store session attributes
      sessionAttributes[SESSION_KEYS.CURRENT_ITEM] = item.id;
      sessionAttributes[SESSION_KEYS.OFFSET] = 0;
      sessionAttributes[SESSION_KEYS.LIBRARY_ID] = libraryId;
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
        0,
        metadata
      );

      const speakOutput = `Playing ${title} by ${author}.`;

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .addDirective(audioDirective)
        .getResponse();

    } catch (error) {
      console.error('Error playing book:', error);
      return handlerInput.responseBuilder
        .speak(MESSAGES.ERROR)
        .reprompt(MESSAGES.HELP)
        .getResponse();
    }
  }
};

module.exports = PlayBookHandler;
