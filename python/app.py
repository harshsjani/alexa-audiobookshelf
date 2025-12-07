"""
Flask application for AudioBookshelf Alexa Skill
Self-hosted alternative to AWS Lambda
"""

import os
import logging
from flask import Flask, request, jsonify
from dotenv import load_dotenv

from ask_sdk_core.skill_builder import SkillBuilder
from ask_sdk_core.dispatch_components import AbstractRequestHandler, AbstractExceptionHandler
from ask_sdk_core.utils import is_request_type, is_intent_name
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model import Response
from ask_sdk_model.interfaces.audioplayer import (
    PlayDirective, PlayBehavior, AudioItem, Stream, AudioItemMetadata,
    StopDirective
)
from ask_sdk_model.ui import SimpleCard, LinkAccountCard

from audiobookshelf_client import AudioBookshelfClient
from helpers import (
    get_audiobookshelf_client, get_item_title, get_item_author,
    get_item_cover_url, get_progress_percent
)
from constants import MESSAGES, SESSION_KEYS

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)


# =============================================================================
# ALEXA INTENT HANDLERS
# =============================================================================

class LaunchRequestHandler(AbstractRequestHandler):
    """Handler for LaunchRequest"""

    def can_handle(self, handler_input):
        return is_request_type("LaunchRequest")(handler_input)

    def handle(self, handler_input):
        session_attr = handler_input.attributes_manager.session_attributes
        client = get_audiobookshelf_client(session_attr)

        if not client:
            speech_text = MESSAGES['NOT_CONFIGURED']
            return (handler_input.response_builder
                    .speak(speech_text)
                    .set_card(LinkAccountCard())
                    .response)

        speech_text = MESSAGES['WELCOME']
        reprompt_text = MESSAGES['HELP']

        return (handler_input.response_builder
                .speak(speech_text)
                .ask(reprompt_text)
                .response)


class ContinueBookIntentHandler(AbstractRequestHandler):
    """Handler for ContinueBookIntent"""

    def can_handle(self, handler_input):
        return is_intent_name("ContinueBookIntent")(handler_input)

    def handle(self, handler_input):
        session_attr = handler_input.attributes_manager.session_attributes
        client = get_audiobookshelf_client(session_attr)

        if not client:
            return (handler_input.response_builder
                    .speak(MESSAGES['NOT_CONFIGURED'])
                    .set_card(LinkAccountCard())
                    .response)

        try:
            # Get items in progress
            items_in_progress = client.get_items_in_progress()

            if not items_in_progress:
                return (handler_input.response_builder
                        .speak(MESSAGES['NO_ITEMS_IN_PROGRESS'])
                        .ask('Would you like to search for a book?')
                        .response)

            # Get the most recent item
            item = items_in_progress[0]
            title = get_item_title(item)
            author = get_item_author(item)

            # Get progress information
            progress = item.get('userMediaProgress', {})
            current_time = progress.get('currentTime', 0)
            duration = progress.get('duration', 0)
            progress_percent = get_progress_percent(current_time, duration)

            # Get stream URL
            stream_url = client.get_stream_url(item['id'])

            # Store session attributes
            session_attr[SESSION_KEYS['CURRENT_ITEM']] = item['id']
            session_attr[SESSION_KEYS['OFFSET']] = int(current_time * 1000)

            # Build metadata
            base_url = session_attr.get(SESSION_KEYS['BASE_URL']) or os.getenv('AUDIOBOOKSHELF_URL')
            cover_url = get_item_cover_url(item, base_url)

            # Build audio directive
            audio_item = AudioItem(
                stream=Stream(
                    token=item['id'],
                    url=stream_url,
                    offset_in_milliseconds=int(current_time * 1000)
                ),
                metadata=AudioItemMetadata(
                    title=title,
                    subtitle=f"by {author}",
                    art={"sources": [{"url": cover_url}]} if cover_url else None
                )
            )

            play_directive = PlayDirective(
                play_behavior=PlayBehavior.REPLACE_ALL,
                audio_item=audio_item
            )

            speech_text = (f"Continuing {title}. You're {progress_percent}% through."
                          if progress_percent > 0
                          else f"Playing {title} by {author}.")

            return (handler_input.response_builder
                    .speak(speech_text)
                    .add_directive(play_directive)
                    .response)

        except Exception as e:
            logger.error(f"Error continuing book: {e}")
            return (handler_input.response_builder
                    .speak(MESSAGES['ERROR'])
                    .ask(MESSAGES['HELP'])
                    .response)


class PlayBookIntentHandler(AbstractRequestHandler):
    """Handler for PlayBookIntent"""

    def can_handle(self, handler_input):
        return is_intent_name("PlayBookIntent")(handler_input)

    def handle(self, handler_input):
        session_attr = handler_input.attributes_manager.session_attributes
        client = get_audiobookshelf_client(session_attr)

        if not client:
            return (handler_input.response_builder
                    .speak(MESSAGES['NOT_CONFIGURED'])
                    .set_card(LinkAccountCard())
                    .response)

        # Get book name from slot
        slots = handler_input.request_envelope.request.intent.slots
        book_name = slots.get('bookName', {}).value if slots.get('bookName') else None

        if not book_name:
            return (handler_input.response_builder
                    .speak('What book would you like to play?')
                    .ask('Please tell me the name of a book.')
                    .response)

        try:
            # Get libraries and search
            libraries = client.get_libraries()

            if not libraries:
                return (handler_input.response_builder
                        .speak("I couldn't find any libraries in your AudioBookshelf account.")
                        .response)

            # Search in the first library (or use stored library ID)
            library_id = session_attr.get(SESSION_KEYS['LIBRARY_ID']) or libraries[0]['id']
            search_results = client.search_library(library_id, book_name)

            if not search_results.get('book') or not search_results['book']:
                return (handler_input.response_builder
                        .speak(f"I couldn't find any books matching {book_name}. Try searching for something else.")
                        .ask('What would you like to do?')
                        .response)

            # Get the first result
            item = search_results['book'][0]['libraryItem']
            title = get_item_title(item)
            author = get_item_author(item)

            # Get stream URL
            stream_url = client.get_stream_url(item['id'])

            # Store session attributes
            session_attr[SESSION_KEYS['CURRENT_ITEM']] = item['id']
            session_attr[SESSION_KEYS['OFFSET']] = 0
            session_attr[SESSION_KEYS['LIBRARY_ID']] = library_id

            # Build metadata
            base_url = session_attr.get(SESSION_KEYS['BASE_URL']) or os.getenv('AUDIOBOOKSHELF_URL')
            cover_url = get_item_cover_url(item, base_url)

            # Build audio directive
            audio_item = AudioItem(
                stream=Stream(
                    token=item['id'],
                    url=stream_url,
                    offset_in_milliseconds=0
                ),
                metadata=AudioItemMetadata(
                    title=title,
                    subtitle=f"by {author}",
                    art={"sources": [{"url": cover_url}]} if cover_url else None
                )
            )

            play_directive = PlayDirective(
                play_behavior=PlayBehavior.REPLACE_ALL,
                audio_item=audio_item
            )

            speech_text = f"Playing {title} by {author}."

            return (handler_input.response_builder
                    .speak(speech_text)
                    .add_directive(play_directive)
                    .response)

        except Exception as e:
            logger.error(f"Error playing book: {e}")
            return (handler_input.response_builder
                    .speak(MESSAGES['ERROR'])
                    .ask(MESSAGES['HELP'])
                    .response)


class PauseIntentHandler(AbstractRequestHandler):
    """Handler for AMAZON.PauseIntent"""

    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.PauseIntent")(handler_input)

    def handle(self, handler_input):
        return (handler_input.response_builder
                .add_directive(StopDirective())
                .response)


class ResumeIntentHandler(AbstractRequestHandler):
    """Handler for AMAZON.ResumeIntent"""

    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.ResumeIntent")(handler_input)

    def handle(self, handler_input):
        session_attr = handler_input.attributes_manager.session_attributes
        client = get_audiobookshelf_client(session_attr)

        if not client:
            return (handler_input.response_builder
                    .speak(MESSAGES['NOT_CONFIGURED'])
                    .set_card(LinkAccountCard())
                    .response)

        item_id = session_attr.get(SESSION_KEYS['CURRENT_ITEM'])
        offset = session_attr.get(SESSION_KEYS['OFFSET'], 0)

        if not item_id:
            return (handler_input.response_builder
                    .speak("There's nothing to resume. You can ask me to play a book or continue your current book.")
                    .ask(MESSAGES['HELP'])
                    .response)

        stream_url = client.get_stream_url(item_id)

        audio_item = AudioItem(
            stream=Stream(
                token=item_id,
                url=stream_url,
                offset_in_milliseconds=offset
            )
        )

        play_directive = PlayDirective(
            play_behavior=PlayBehavior.REPLACE_ALL,
            audio_item=audio_item
        )

        return (handler_input.response_builder
                .speak('Resuming')
                .add_directive(play_directive)
                .response)


class StopAndCancelIntentHandler(AbstractRequestHandler):
    """Handler for AMAZON.StopIntent and AMAZON.CancelIntent"""

    def can_handle(self, handler_input):
        return (is_intent_name("AMAZON.StopIntent")(handler_input) or
                is_intent_name("AMAZON.CancelIntent")(handler_input))

    def handle(self, handler_input):
        return (handler_input.response_builder
                .speak(MESSAGES['GOODBYE'])
                .add_directive(StopDirective())
                .set_should_end_session(True)
                .response)


class HelpIntentHandler(AbstractRequestHandler):
    """Handler for AMAZON.HelpIntent"""

    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.HelpIntent")(handler_input)

    def handle(self, handler_input):
        return (handler_input.response_builder
                .speak(MESSAGES['HELP'])
                .ask(MESSAGES['HELP'])
                .response)


class FallbackIntentHandler(AbstractRequestHandler):
    """Handler for AMAZON.FallbackIntent"""

    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.FallbackIntent")(handler_input)

    def handle(self, handler_input):
        return (handler_input.response_builder
                .speak(MESSAGES['FALLBACK'])
                .ask(MESSAGES['HELP'])
                .response)


class SessionEndedRequestHandler(AbstractRequestHandler):
    """Handler for SessionEndedRequest"""

    def can_handle(self, handler_input):
        return is_request_type("SessionEndedRequest")(handler_input)

    def handle(self, handler_input):
        logger.info(f"Session ended: {handler_input.request_envelope.request.reason}")
        return handler_input.response_builder.response


# =============================================================================
# AUDIOPLAYER EVENT HANDLERS
# =============================================================================

class PlaybackStartedHandler(AbstractRequestHandler):
    """Handler for AudioPlayer.PlaybackStarted"""

    def can_handle(self, handler_input):
        return is_request_type("AudioPlayer.PlaybackStarted")(handler_input)

    def handle(self, handler_input):
        logger.info("Playback started")
        token = handler_input.request_envelope.request.token
        offset = handler_input.request_envelope.request.offset_in_milliseconds

        session_attr = handler_input.attributes_manager.session_attributes
        session_attr[SESSION_KEYS['CURRENT_ITEM']] = token
        session_attr[SESSION_KEYS['OFFSET']] = offset

        return handler_input.response_builder.response


class PlaybackFinishedHandler(AbstractRequestHandler):
    """Handler for AudioPlayer.PlaybackFinished"""

    def can_handle(self, handler_input):
        return is_request_type("AudioPlayer.PlaybackFinished")(handler_input)

    def handle(self, handler_input):
        logger.info("Playback finished")
        token = handler_input.request_envelope.request.token
        offset = handler_input.request_envelope.request.offset_in_milliseconds

        # Update progress in AudioBookshelf
        session_attr = handler_input.attributes_manager.session_attributes
        client = get_audiobookshelf_client(session_attr)

        if client and token:
            try:
                offset_seconds = offset / 1000
                client.update_progress(token, offset_seconds, offset_seconds)
                logger.info("Progress updated successfully")
            except Exception as e:
                logger.error(f"Failed to update progress: {e}")

        return handler_input.response_builder.response


class PlaybackStoppedHandler(AbstractRequestHandler):
    """Handler for AudioPlayer.PlaybackStopped"""

    def can_handle(self, handler_input):
        return is_request_type("AudioPlayer.PlaybackStopped")(handler_input)

    def handle(self, handler_input):
        logger.info("Playback stopped")
        token = handler_input.request_envelope.request.token
        offset = handler_input.request_envelope.request.offset_in_milliseconds

        # Save current position
        session_attr = handler_input.attributes_manager.session_attributes
        session_attr[SESSION_KEYS['OFFSET']] = offset

        # Update progress in AudioBookshelf
        client = get_audiobookshelf_client(session_attr)

        if client and token:
            try:
                offset_seconds = offset / 1000
                client.update_progress(token, offset_seconds, offset_seconds)
                logger.info("Progress saved")
            except Exception as e:
                logger.error(f"Failed to save progress: {e}")

        return handler_input.response_builder.response


class PlaybackNearlyFinishedHandler(AbstractRequestHandler):
    """Handler for AudioPlayer.PlaybackNearlyFinished"""

    def can_handle(self, handler_input):
        return is_request_type("AudioPlayer.PlaybackNearlyFinished")(handler_input)

    def handle(self, handler_input):
        logger.info("Playback nearly finished")
        # Could enqueue next chapter/episode here
        return handler_input.response_builder.response


class PlaybackFailedHandler(AbstractRequestHandler):
    """Handler for AudioPlayer.PlaybackFailed"""

    def can_handle(self, handler_input):
        return is_request_type("AudioPlayer.PlaybackFailed")(handler_input)

    def handle(self, handler_input):
        logger.error(f"Playback failed: {handler_input.request_envelope.request.error}")
        return handler_input.response_builder.response


# =============================================================================
# ERROR HANDLER
# =============================================================================

class ErrorHandler(AbstractExceptionHandler):
    """Generic error handler"""

    def can_handle(self, handler_input, exception):
        return True

    def handle(self, handler_input, exception):
        logger.error(f"Error handled: {exception}", exc_info=True)

        return (handler_input.response_builder
                .speak(MESSAGES['ERROR'])
                .ask(MESSAGES['HELP'])
                .response)


# =============================================================================
# BUILD SKILL
# =============================================================================

sb = SkillBuilder()

# Add request handlers
sb.add_request_handler(LaunchRequestHandler())
sb.add_request_handler(ContinueBookIntentHandler())
sb.add_request_handler(PlayBookIntentHandler())
sb.add_request_handler(HelpIntentHandler())
sb.add_request_handler(PauseIntentHandler())
sb.add_request_handler(ResumeIntentHandler())
sb.add_request_handler(StopAndCancelIntentHandler())
sb.add_request_handler(FallbackIntentHandler())
sb.add_request_handler(PlaybackStartedHandler())
sb.add_request_handler(PlaybackFinishedHandler())
sb.add_request_handler(PlaybackStoppedHandler())
sb.add_request_handler(PlaybackNearlyFinishedHandler())
sb.add_request_handler(PlaybackFailedHandler())
sb.add_request_handler(SessionEndedRequestHandler())

# Add error handler
sb.add_exception_handler(ErrorHandler())

# Build the skill
skill = sb.create()


# =============================================================================
# FLASK ROUTES
# =============================================================================

@app.route('/alexa', methods=['POST'])
def alexa_endpoint():
    """
    Main Alexa skill endpoint
    Receives requests from Alexa and routes them to the skill
    """
    try:
        # Get request body
        request_body = request.get_json()

        logger.info(f"Request: {request_body.get('request', {}).get('type')}")

        # Invoke skill
        response_body = skill.invoke(request_body, None)

        logger.info(f"Response: {response_body}")

        return jsonify(response_body)

    except Exception as e:
        logger.error(f"Error processing request: {e}", exc_info=True)
        return jsonify({
            'version': '1.0',
            'response': {
                'outputSpeech': {
                    'type': 'PlainText',
                    'text': MESSAGES['ERROR']
                },
                'shouldEndSession': False
            }
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'audiobookshelf-alexa-skill'}), 200


@app.route('/', methods=['GET'])
def index():
    """Index route"""
    return jsonify({
        'service': 'AudioBookshelf Alexa Skill',
        'status': 'running',
        'endpoints': {
            '/alexa': 'POST - Alexa skill endpoint',
            '/health': 'GET - Health check'
        }
    }), 200


# =============================================================================
# RUN APPLICATION
# =============================================================================

if __name__ == '__main__':
    # Development server
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'False').lower() == 'true'
    )
