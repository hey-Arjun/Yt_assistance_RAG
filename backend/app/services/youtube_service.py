import requests
import logging
from app.config import YOUTUBE_API_KEY
from app.llm.client import llm

logger = logging.getLogger(__name__)

YOUTUBE_VIDEO_API = "https://www.googleapis.com/youtube/v3/videos"

# Unified Prompt inside the service for easy maintenance
METADATA_PROMPT = """You are a YouTube video assistant.

Use ONLY the context below to answer.
If information is not explicitly stated, infer conservatively from chapters and description.
If truly unavailable, say "Not mentioned in the video".

Answer concisely, structured, and factual.

CONTEXT:
{context}

QUESTION:
{question}
"""

def get_video_metadata(video_id: str) -> dict:
    """Fetches title, description, and channel info from YouTube API."""
    params = {
        "part": "snippet,contentDetails", # Added contentDetails for potential duration info
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }
    try:
        r = requests.get(YOUTUBE_API_KEY, params=params)
        r.raise_for_status()
        items = r.json().get("items", [])

        if not items:
            return {}
        
        snippet = items[0]["snippet"]
        return{
            "title": snippet.get("title"),
            "description": snippet.get("description"),
            "channel": snippet.get("channelTitle"),
            "published_at": snippet.get("publishedAt"),
            "tags": snippet.get("tags", [])
        }
    except Exception as e:
        logger.error(f"[METADATA] API Fetch faild: {e}")
        return  {}

def answer_from_metadata(
    context: str,
    question: str,
    citations: list = None
)-> dict:
    """
    Takes the combined text corpus and a question to generate 
    a grounded response using metadata context.
    """
    cited_text = ""
    if citations:
        cited_text =  "\n\nRELEVANT TIMESTAMPS:\n" + "\n".join(
            f"- {c['title']} at {c['time']}" for c in citations
        )
    try:
        prompt = METADATA_PROMPT.format(
            context=context + cited_text,
            question=question
        )

        res = llm.invoke(prompt)
        answer = res.content if hasattr(res, "content") else res

        return {
            "answer": answer,
            "citations": citations or []
        }
    except Exception as e:
        logger.error(f"[METADATA LLM] Answer generation failed: {e}")
        return {"answer": "Error generating answer from metadata.", "citations": []}
    
def find_relevant_chapters(question: str, chapters: list, top_k: int = 3):
    """
    Fast keyword matching for chapters to find timestamps.
    """
    if not chapters: return []
    q = question.lower()
    scored = []
    for c in chapters:
        title = c.get("title", "").lower()
        score = sum(1 for w in q.split() if w in title)
        if score > 0:
            scored.append((score, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:top_k]]