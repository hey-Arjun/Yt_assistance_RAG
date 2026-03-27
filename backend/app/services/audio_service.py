import os
import yt_dlp
import logging

logger = logging.getLogger(__name__)

# ensure a tempopary dir exists for audio files
TEMP_DIR = "temp_audio"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

def download_audio(video_url: str) -> str:
    """
    Downloads the audio from a YouTube video and returns the local file path.
    """
    # define oiutput templaten (temp_audio/ video_id.ext)
    output_template = os.path.join(TEMP_DIR, '%(id)s.%(ext)s')

    ydl_opts = {
        'format': 'm4a/bestaudio/best',  # m4a is lightweight and Whisper-friendly
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'm4a',
        }],
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            audio_path = ydl.prepare_filename(info)

            # yt-dlp might change the extension during post-processing
            # We ensure we return the actual path on disk
            base, _ = os.path.splitext(audio_path)
            final_path = f"{base}.m4a"

            if os.path.exists(final_path):
                logger.info(f"[AUDIO DOWNLOADED] {final_path}")
                return final_path
            return audio_path
    
    except Exception as e:
        logger.error(f"[AUDIO DOWNLOAD ERROR] {e}")
        return None

def cleanup_audio(file_path: str):
    """
    Deletes the audio file after transcription to save disk space.
    """
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"[CLEANUP] Deleted {file_path}")
    except Exception as e:
        logger.error(f"[CLEANUP ERROR] {e}")
