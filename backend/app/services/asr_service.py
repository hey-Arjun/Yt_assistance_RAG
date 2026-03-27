import os
import logging
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

def transcribe_audio(audio_path: str) -> str:
    """
    Transcribes audio using OpenAI's Whisper-1 API.
    Costs approximately $0.006 per minute.
    """
    if not audio_path or not os.path.exists(audio_path):
        logger.error(f"[ASR] Audio file not found: {audio_path}")
        return None
    
    try:
        logger.info(f"[ASR] Sending audio to OpenAI API: {audio_path}")
        # open the file ijn binary read mode
        with open(audio_path, "rb") as audio_file:
            # Call the transcription API
            # Note: Whisper-1 has a 25MB file limit. 
            # (m4a files are usually small enough for 30-60 min videos)
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

            if response:
                logger.info(f"[ASR] API Transcription succesful.")
                return  response.strip()
            
            return None
    except Exception as e:
        logger.error(f"[ASR API ERROR] {e}")
        return None