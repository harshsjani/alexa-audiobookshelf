const Alexa = require('ask-sdk-core');
const { SESSION_KEYS } = require('../utils/constants');
const { getAudioBookshelfClient } = require('../utils/helpers');

/**
 * Handler for AudioPlayer.PlaybackStarted
 * Triggered when audio playback starts
 */
const PlaybackStartedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackStarted';
  },

  async handle(handlerInput) {
    console.log('Playback started');

    const token = handlerInput.requestEnvelope.request.token;
    const offsetInMilliseconds = handlerInput.requestEnvelope.request.offsetInMilliseconds;

    // Update session attributes
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes[SESSION_KEYS.CURRENT_ITEM] = token;
    sessionAttributes[SESSION_KEYS.OFFSET] = offsetInMilliseconds;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder.getResponse();
  }
};

/**
 * Handler for AudioPlayer.PlaybackFinished
 * Triggered when audio playback finishes
 */
const PlaybackFinishedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackFinished';
  },

  async handle(handlerInput) {
    console.log('Playback finished');

    const token = handlerInput.requestEnvelope.request.token;
    const offsetInMilliseconds = handlerInput.requestEnvelope.request.offsetInMilliseconds;

    // Update progress in AudioBookshelf
    const client = getAudioBookshelfClient(handlerInput);
    if (client && token) {
      try {
        const offsetInSeconds = Math.floor(offsetInMilliseconds / 1000);
        await client.updateProgress(token, offsetInSeconds, offsetInSeconds);
        console.log('Progress updated successfully');
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }

    return handlerInput.responseBuilder.getResponse();
  }
};

/**
 * Handler for AudioPlayer.PlaybackStopped
 * Triggered when audio playback is stopped
 */
const PlaybackStoppedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackStopped';
  },

  async handle(handlerInput) {
    console.log('Playback stopped');

    const token = handlerInput.requestEnvelope.request.token;
    const offsetInMilliseconds = handlerInput.requestEnvelope.request.offsetInMilliseconds;

    // Save current position
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes[SESSION_KEYS.OFFSET] = offsetInMilliseconds;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    // Update progress in AudioBookshelf
    const client = getAudioBookshelfClient(handlerInput);
    if (client && token) {
      try {
        const offsetInSeconds = Math.floor(offsetInMilliseconds / 1000);
        await client.updateProgress(token, offsetInSeconds, offsetInSeconds);
        console.log('Progress saved');
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }

    return handlerInput.responseBuilder.getResponse();
  }
};

/**
 * Handler for AudioPlayer.PlaybackNearlyFinished
 * Triggered when audio is nearly finished (for enqueueing next track)
 */
const PlaybackNearlyFinishedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackNearlyFinished';
  },

  async handle(handlerInput) {
    console.log('Playback nearly finished');

    // In the future, could enqueue next chapter/episode here
    // For now, just let it finish

    return handlerInput.responseBuilder.getResponse();
  }
};

/**
 * Handler for AudioPlayer.PlaybackFailed
 * Triggered when audio playback fails
 */
const PlaybackFailedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackFailed';
  },

  handle(handlerInput) {
    console.error('Playback failed:', JSON.stringify(handlerInput.requestEnvelope.request.error));
    return handlerInput.responseBuilder.getResponse();
  }
};

module.exports = {
  PlaybackStartedHandler,
  PlaybackFinishedHandler,
  PlaybackStoppedHandler,
  PlaybackNearlyFinishedHandler,
  PlaybackFailedHandler
};
