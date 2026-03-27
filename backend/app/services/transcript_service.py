# app/services/transcript_service.py
import logging

from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound
)
from youtube_transcript_api.formatters import TextFormatter

logger = logging.getLogger(__name__)

def get_video_transcript(video_id: str) -> str:
    """
    Attempts to fetch English transcripts using the YouTube Transcript API.
    Returns None if no transcript is found to trigger the next fallback.
    """
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        try:
            # 1 priority - manually created English
            transcript = transcript_list.find_manually_created_transcript(['en'])
        except Exception:
            # 2 Auto generated English
            transcript = transcript_list.find_generated_transcript(['en'])
        
        formatter = TextFormatter()
        return formatter.format_transcript(transcript.fetch())
    except (TranscriptsDisabled, NoTranscriptFound):
        logger.info(f"No API transcript available for vidro {video_id}. Moving to fallback.")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in Transcript Service: {e}")
        return None