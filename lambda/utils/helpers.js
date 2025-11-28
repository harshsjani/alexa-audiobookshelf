const AudioBookshelfClient = require('../services/audiobookshelf-client');
const { SESSION_KEYS } = require('./constants');

/**
 * Get AudioBookshelf client from session attributes
 * @param {Object} handlerInput - Alexa handler input
 * @returns {AudioBookshelfClient|null} Client instance or null if not configured
 */
function getAudioBookshelfClient(handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  const baseUrl = sessionAttributes[SESSION_KEYS.BASE_URL] || process.env.AUDIOBOOKSHELF_URL;
  const token = sessionAttributes[SESSION_KEYS.TOKEN] || process.env.AUDIOBOOKSHELF_TOKEN;

  if (!baseUrl || !token) {
    return null;
  }

  return new AudioBookshelfClient(baseUrl, token);
}

/**
 * Check if user is authenticated with AudioBookshelf
 * @param {Object} handlerInput - Alexa handler input
 * @returns {boolean} True if authenticated
 */
function isAuthenticated(handlerInput) {
  return getAudioBookshelfClient(handlerInput) !== null;
}

/**
 * Format duration in seconds to readable time
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "2 hours and 30 minutes")
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

/**
 * Get progress percentage
 * @param {number} current - Current position in seconds
 * @param {number} total - Total duration in seconds
 * @returns {number} Progress percentage (0-100)
 */
function getProgressPercent(current, total) {
  if (!total || total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Build audio directive for Alexa AudioPlayer
 * @param {string} url - Stream URL
 * @param {string} token - Playback token
 * @param {number} offsetInMilliseconds - Offset to start playback
 * @param {Object} metadata - Audio metadata
 * @returns {Object} Audio directive
 */
function buildAudioDirective(url, token, offsetInMilliseconds = 0, metadata = {}) {
  const directive = {
    type: 'AudioPlayer.Play',
    playBehavior: 'REPLACE_ALL',
    audioItem: {
      stream: {
        token: token,
        url: url,
        offsetInMilliseconds: offsetInMilliseconds
      }
    }
  };

  // Add metadata if available
  if (metadata.title || metadata.subtitle || metadata.art) {
    directive.audioItem.metadata = {
      title: metadata.title || 'Unknown Title',
      subtitle: metadata.subtitle || 'AudioBookshelf',
      art: metadata.art ? {
        sources: [{
          url: metadata.art
        }]
      } : undefined
    };
  }

  return directive;
}

/**
 * Build stop directive
 * @returns {Object} Stop directive
 */
function buildStopDirective() {
  return {
    type: 'AudioPlayer.Stop'
  };
}

/**
 * Get slot value from intent
 * @param {Object} handlerInput - Alexa handler input
 * @param {string} slotName - Name of the slot
 * @returns {string|null} Slot value or null
 */
function getSlotValue(handlerInput, slotName) {
  const request = handlerInput.requestEnvelope.request;
  if (request.intent && request.intent.slots && request.intent.slots[slotName]) {
    return request.intent.slots[slotName].value;
  }
  return null;
}

/**
 * Extract book/podcast title from library item
 * @param {Object} item - Library item from AudioBookshelf
 * @returns {string} Title
 */
function getItemTitle(item) {
  if (item.media && item.media.metadata && item.media.metadata.title) {
    return item.media.metadata.title;
  }
  return 'Unknown Title';
}

/**
 * Extract author from library item
 * @param {Object} item - Library item from AudioBookshelf
 * @returns {string} Author
 */
function getItemAuthor(item) {
  if (item.media && item.media.metadata && item.media.metadata.authorName) {
    return item.media.metadata.authorName;
  }
  return 'Unknown Author';
}

/**
 * Get cover art URL from library item
 * @param {Object} item - Library item from AudioBookshelf
 * @param {string} baseUrl - AudioBookshelf base URL
 * @returns {string|null} Cover art URL or null
 */
function getItemCoverUrl(item, baseUrl) {
  if (item.media && item.media.coverPath) {
    return `${baseUrl}${item.media.coverPath}`;
  }
  return null;
}

module.exports = {
  getAudioBookshelfClient,
  isAuthenticated,
  formatDuration,
  getProgressPercent,
  buildAudioDirective,
  buildStopDirective,
  getSlotValue,
  getItemTitle,
  getItemAuthor,
  getItemCoverUrl
};
