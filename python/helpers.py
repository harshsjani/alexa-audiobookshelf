"""
Helper functions for the Alexa skill
"""

import os
from typing import Optional, Dict
from audiobookshelf_client import AudioBookshelfClient
from constants import SESSION_KEYS


def get_audiobookshelf_client(session_attributes: Dict) -> Optional[AudioBookshelfClient]:
    """
    Get AudioBookshelf client from session attributes or environment

    Args:
        session_attributes: Session attributes dictionary

    Returns:
        AudioBookshelfClient instance or None if not configured
    """
    base_url = session_attributes.get(SESSION_KEYS['BASE_URL']) or os.getenv('AUDIOBOOKSHELF_URL')
    token = session_attributes.get(SESSION_KEYS['TOKEN']) or os.getenv('AUDIOBOOKSHELF_TOKEN')

    if not base_url or not token:
        return None

    return AudioBookshelfClient(base_url, token)


def format_duration(seconds: float) -> str:
    """
    Format duration in seconds to readable time

    Args:
        seconds: Duration in seconds

    Returns:
        Formatted duration (e.g., "2 hours and 30 minutes")
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)

    if hours > 0 and minutes > 0:
        return f"{hours} hour{'s' if hours > 1 else ''} and {minutes} minute{'s' if minutes > 1 else ''}"
    elif hours > 0:
        return f"{hours} hour{'s' if hours > 1 else ''}"
    else:
        return f"{minutes} minute{'s' if minutes > 1 else ''}"


def get_progress_percent(current: float, total: float) -> int:
    """
    Get progress percentage

    Args:
        current: Current position in seconds
        total: Total duration in seconds

    Returns:
        Progress percentage (0-100)
    """
    if not total or total == 0:
        return 0
    return round((current / total) * 100)


def get_item_title(item: Dict) -> str:
    """
    Extract book/podcast title from library item

    Args:
        item: Library item from AudioBookshelf

    Returns:
        Title
    """
    if item.get('media', {}).get('metadata', {}).get('title'):
        return item['media']['metadata']['title']
    return 'Unknown Title'


def get_item_author(item: Dict) -> str:
    """
    Extract author from library item

    Args:
        item: Library item from AudioBookshelf

    Returns:
        Author name
    """
    if item.get('media', {}).get('metadata', {}).get('authorName'):
        return item['media']['metadata']['authorName']
    return 'Unknown Author'


def get_item_cover_url(item: Dict, base_url: str) -> Optional[str]:
    """
    Get cover art URL from library item

    Args:
        item: Library item from AudioBookshelf
        base_url: AudioBookshelf base URL

    Returns:
        Cover art URL or None
    """
    cover_path = item.get('media', {}).get('coverPath')
    if cover_path:
        return f"{base_url}{cover_path}"
    return None
