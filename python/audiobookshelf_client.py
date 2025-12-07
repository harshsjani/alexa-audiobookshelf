"""
AudioBookshelf API Client
Handles all interactions with the AudioBookshelf server API
"""

import requests
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class AudioBookshelfClient:
    """Client for interacting with AudioBookshelf API"""

    def __init__(self, base_url: str, token: str):
        """
        Initialize the AudioBookshelf client

        Args:
            base_url: The base URL of the AudioBookshelf server
            token: JWT token or API token for authentication
        """
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })
        self.session.timeout = 10

    def login(self, username: str, password: str) -> Dict:
        """
        Login to AudioBookshelf and get JWT token

        Args:
            username: AudioBookshelf username
            password: AudioBookshelf password

        Returns:
            User object with token

        Raises:
            Exception: If login fails
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/login",
                json={'username': username, 'password': password},
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            if data and 'user' in data:
                self.token = data['user']['token']
                self.session.headers['Authorization'] = f'Bearer {self.token}'
                return data

            raise Exception('Invalid login response')

        except Exception as e:
            logger.error(f'Login failed: {e}')
            raise Exception('Failed to authenticate with AudioBookshelf')

    def get_libraries(self) -> List[Dict]:
        """
        Get all libraries

        Returns:
            List of library objects

        Raises:
            Exception: If request fails
        """
        try:
            response = self.session.get(f"{self.base_url}/api/libraries")
            response.raise_for_status()
            data = response.json()
            return data.get('libraries', [])

        except Exception as e:
            logger.error(f'Failed to get libraries: {e}')
            raise Exception('Failed to retrieve libraries')

    def search_library(self, library_id: str, query: str, limit: int = 10) -> Dict:
        """
        Search for items in a library

        Args:
            library_id: The library ID to search in
            query: Search query
            limit: Maximum number of results

        Returns:
            Search results

        Raises:
            Exception: If search fails
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/libraries/{library_id}/search",
                params={'q': query, 'limit': limit}
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f'Search failed: {e}')
            raise Exception('Failed to search library')

    def get_items_in_progress(self) -> List[Dict]:
        """
        Get items currently in progress

        Returns:
            List of items in progress

        Raises:
            Exception: If request fails
        """
        try:
            response = self.session.get(f"{self.base_url}/api/me/items-in-progress")
            response.raise_for_status()
            data = response.json()
            return data.get('libraryItems', [])

        except Exception as e:
            logger.error(f'Failed to get items in progress: {e}')
            raise Exception('Failed to retrieve in-progress items')

    def get_library_item(self, item_id: str) -> Dict:
        """
        Get a specific library item by ID

        Args:
            item_id: The library item ID

        Returns:
            Library item details

        Raises:
            Exception: If request fails
        """
        try:
            response = self.session.get(f"{self.base_url}/api/items/{item_id}")
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f'Failed to get library item: {e}')
            raise Exception('Failed to retrieve library item')

    def update_progress(self, item_id: str, current_time: float, duration: float) -> Optional[Dict]:
        """
        Update playback progress

        Args:
            item_id: The library item ID
            current_time: Current time in seconds
            duration: Total duration in seconds

        Returns:
            Updated progress or None if failed
        """
        try:
            progress = current_time / duration if duration > 0 else 0
            response = self.session.patch(
                f"{self.base_url}/api/me/progress/{item_id}",
                json={
                    'currentTime': current_time,
                    'duration': duration,
                    'progress': progress
                }
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f'Failed to update progress: {e}')
            # Don't raise - progress updates are not critical
            return None

    def get_stream_url(self, item_id: str) -> str:
        """
        Get streaming URL for an audiobook or podcast episode

        Args:
            item_id: The library item ID

        Returns:
            Stream URL with authentication
        """
        return f"{self.base_url}/api/items/{item_id}/play?token={self.token}"

    def close_session(self, session_id: str) -> None:
        """
        Close a playback session

        Args:
            session_id: The playback session ID
        """
        try:
            self.session.post(f"{self.base_url}/api/session/{session_id}/close")
        except Exception as e:
            logger.error(f'Failed to close session: {e}')
            # Don't raise - session cleanup is not critical
