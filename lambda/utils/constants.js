/**
 * Constants used throughout the skill
 */

module.exports = {
  // Intent names
  INTENTS: {
    LAUNCH: 'LaunchRequest',
    PLAY_BOOK: 'PlayBookIntent',
    CONTINUE_BOOK: 'ContinueBookIntent',
    SEARCH: 'SearchIntent',
    PAUSE: 'AMAZON.PauseIntent',
    RESUME: 'AMAZON.ResumeIntent',
    STOP: 'AMAZON.StopIntent',
    CANCEL: 'AMAZON.CancelIntent',
    HELP: 'AMAZON.HelpIntent',
    NEXT: 'AMAZON.NextIntent',
    PREVIOUS: 'AMAZON.PreviousIntent'
  },

  // Session attribute keys
  SESSION_KEYS: {
    STATE: 'state',
    CURRENT_ITEM: 'currentItem',
    PLAYBACK_SESSION: 'playbackSession',
    TOKEN: 'token',
    BASE_URL: 'baseUrl',
    LIBRARY_ID: 'libraryId',
    OFFSET: 'offsetInMilliseconds'
  },

  // Skill states
  STATES: {
    START: '_START',
    PLAYING: '_PLAYING',
    SEARCH: '_SEARCH',
    HELP: '_HELP'
  },

  // Audio player events
  AUDIO_PLAYER: {
    PLAYBACK_STARTED: 'AudioPlayer.PlaybackStarted',
    PLAYBACK_FINISHED: 'AudioPlayer.PlaybackFinished',
    PLAYBACK_STOPPED: 'AudioPlayer.PlaybackStopped',
    PLAYBACK_NEARLY_FINISHED: 'AudioPlayer.PlaybackNearlyFinished',
    PLAYBACK_FAILED: 'AudioPlayer.PlaybackFailed'
  },

  // Response messages
  MESSAGES: {
    WELCOME: 'Welcome to Audio Bookshelf. You can ask me to play an audiobook or continue where you left off. What would you like to do?',
    HELP: 'You can say things like: play a book, continue my book, or search for books. What would you like to do?',
    GOODBYE: 'Goodbye!',
    FALLBACK: 'Sorry, I didn\'t understand that. You can say play a book, continue my book, or ask for help.',
    ERROR: 'Sorry, something went wrong. Please try again.',
    NO_ITEMS_IN_PROGRESS: 'You don\'t have any books in progress. You can ask me to search for a book to play.',
    SEARCH_NO_RESULTS: 'I couldn\'t find any books matching that search.',
    NOT_CONFIGURED: 'Your AudioBookshelf account isn\'t linked yet. Please use the Alexa app to link your account.'
  }
};
