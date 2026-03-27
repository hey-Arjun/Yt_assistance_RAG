import logging

# Standardize imports
from services.transcript_service import get_video_transcript
from services.audio_service import download_audio, cleanup_audio # Added cleanup
from services.asr_service import transcribe_audio
from services.cache_service import get_cached_data, set_cache_data
from services.comment_processor import process_comments
from services.youtube_service import get_video_metadata 

logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(self):
        pass

    async def process_video(self, video_id: str, video_url: str):
        # 1. Check Cache (Usually synchronous SQLite)
        cached = get_cached_data(video_id)
        if cached:
            logger.info(f"[CACHE HIT] {video_id}")
            return cached
        
        logger.info(f"[PROCESSING START] {video_id}")

        # 2. Get Metadata (Sync call)
        metadata = get_video_metadata(video_id)

        # 3. Try Transcript Pipeline (Async call)
        transcript_data = await self._get_transcript_pipeline(video_id, video_url)

        # 4. Process Comments (Sync call - passing video_id directly is better)
        # We modified comment_processor to take video_id, not a list
        processed_comments = process_comments(video_id)

        # 5. Combine all sources (Internal helper)
        combined_text = self._combine_sources(
            transcript_data,
            metadata,
            processed_comments
        )

        # 6. Final output structure
        result = {
            "video_id": video_id,
            "text": combined_text,
            "source": transcript_data["source"],
            "metadata": metadata
        }

        # 7. Cache Result
        set_cache_data(video_id, result)
        logger.info(f"[PROCESSING COMPLETE] {video_id}")
        
        return result
        
    async def _get_transcript_pipeline(self, video_id: str, video_url: str):
        # 1. Try YouTube API Transcript
        try:
            transcript = get_video_transcript(video_id)
            if transcript:
                return {"text": transcript, "source": "youtube_captions"}
        except Exception as e:
            logger.warning(f"[TRANSCRIPT API FAIL] {e}")

        # 2. Fallback: Audio + Whisper
        audio_path = None
        try:
            logger.info("[FALLBACK] Using Whisper ASR")
            audio_path = download_audio(video_url)
            asr_text = transcribe_audio(audio_path)

            return {"text": asr_text, "source": "whisper_asr"}
        except Exception as e:
            logger.error(f"[ASR FAIL] {e}")
        finally:
            # IMPORTANT: Clean up the file to save disk space/costs
            if audio_path:
                cleanup_audio(audio_path)

        return {"text": "", "source": "none"}

    def _combine_sources(self, transcript_data, metadata, comments_text):
        parts = []
    
        if transcript_data.get("text"):
            parts.append(f"[TRANSCRIPT]\n{transcript_data['text']}")

        if metadata.get("description"):
            parts.append(f"[DESCRIPTION]\n{metadata['description']}")
        
        # Note: Ensure your youtube_service actually returns a 'timestamps' list
        if metadata.get("timestamps"):
            ts_text = "\n".join(metadata["timestamps"])
            parts.append(f"[TIMESTAMPS]\n{ts_text}")

        if comments_text:
            parts.append(f"[COMMENTS INSIGHTS]\n{comments_text}")

        return "\n\n".join(parts)