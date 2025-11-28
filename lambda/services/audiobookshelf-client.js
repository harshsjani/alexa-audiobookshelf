const axios = require('axios');

/**
 * AudioBookshelf API Client
 * Handles all interactions with the AudioBookshelf server API
 */
class AudioBookshelfClient {
  /**
   * @param {string} baseUrl - The base URL of the AudioBookshelf server
   * @param {string} token - JWT token or API token for authentication
   */
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
  }

  /**
   * Login to AudioBookshelf and get JWT token
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object>} User object with token
   */
  async login(username, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/login`, {
        username,
        password
      });

      if (response.data && response.data.user) {
        this.token = response.data.user.token;
        // Update client headers with new token
        this.client.defaults.headers['Authorization'] = `Bearer ${this.token}`;
        return response.data;
      }

      throw new Error('Invalid login response');
    } catch (error) {
      console.error('Login failed:', error.message);
      throw new Error('Failed to authenticate with AudioBookshelf');
    }
  }

  /**
   * Get all libraries
   * @returns {Promise<Array>} Array of library objects
   */
  async getLibraries() {
    try {
      const response = await this.client.get('/api/libraries');
      return response.data.libraries || [];
    } catch (error) {
      console.error('Failed to get libraries:', error.message);
      throw new Error('Failed to retrieve libraries');
    }
  }

  /**
   * Search for items in a library
   * @param {string} libraryId - The library ID to search in
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results
   */
  async searchLibrary(libraryId, query) {
    try {
      const response = await this.client.get(`/api/libraries/${libraryId}/search`, {
        params: { q: query, limit: 10 }
      });
      return response.data;
    } catch (error) {
      console.error('Search failed:', error.message);
      throw new Error('Failed to search library');
    }
  }

  /**
   * Get items currently in progress
   * @returns {Promise<Array>} Array of items in progress
   */
  async getItemsInProgress() {
    try {
      const response = await this.client.get('/api/me/items-in-progress');
      return response.data.libraryItems || [];
    } catch (error) {
      console.error('Failed to get items in progress:', error.message);
      throw new Error('Failed to retrieve in-progress items');
    }
  }

  /**
   * Get a specific library item by ID
   * @param {string} itemId - The library item ID
   * @returns {Promise<Object>} Library item details
   */
  async getLibraryItem(itemId) {
    try {
      const response = await this.client.get(`/api/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get library item:', error.message);
      throw new Error('Failed to retrieve library item');
    }
  }

  /**
   * Get playback session/stream URL for an item
   * @param {string} itemId - The library item ID
   * @returns {Promise<Object>} Playback session with stream URL
   */
  async startPlaybackSession(itemId) {
    try {
      const response = await this.client.post(`/api/session/${itemId}/local`);
      return response.data;
    } catch (error) {
      console.error('Failed to start playback session:', error.message);
      throw new Error('Failed to start playback');
    }
  }

  /**
   * Update playback progress
   * @param {string} itemId - The library item ID
   * @param {number} currentTime - Current time in seconds
   * @param {number} duration - Total duration in seconds
   * @returns {Promise<Object>} Updated progress
   */
  async updateProgress(itemId, currentTime, duration) {
    try {
      const response = await this.client.patch(`/api/me/progress/${itemId}`, {
        currentTime,
        duration,
        progress: currentTime / duration
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update progress:', error.message);
      // Don't throw - progress updates are not critical
      return null;
    }
  }

  /**
   * Get streaming URL for an audiobook or podcast episode
   * @param {string} itemId - The library item ID
   * @returns {string} Stream URL with authentication
   */
  getStreamUrl(itemId) {
    return `${this.baseUrl}/api/items/${itemId}/play?token=${this.token}`;
  }

  /**
   * Close a playback session
   * @param {string} sessionId - The playback session ID
   * @returns {Promise<void>}
   */
  async closeSession(sessionId) {
    try {
      await this.client.post(`/api/session/${sessionId}/close`);
    } catch (error) {
      console.error('Failed to close session:', error.message);
      // Don't throw - session cleanup is not critical
    }
  }
}

module.exports = AudioBookshelfClient;
