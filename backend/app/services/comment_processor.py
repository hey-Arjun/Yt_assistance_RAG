import logging
import requests
from app.config import YOUTUBE_API_KEY
from app.llm.client import llm

logger = logging.getLogger(__name__)

COMMENTS_API = "https://www.googleapis.com/youtube/v3/commentThreads"

SUMMARY_PROMPT = """
You are given the top YouTube comments for a video. 
Your goal is to extract collective intelligence from the audience to enhance a RAG system.

Summarize into:
1. Overall Sentiment: (One word)
2. Audience Insights: (3-5 bullet points of common questions, corrections, or key takeaways mentioned by viewers)

Comments:
{comments}
"""

def _get_raw_comments(video_id: str, max_results: int = 30):
    """Internal helper to fetch from youtube API"""
    params = {
        "part": "snippet",
        "videoId": video_id,
        "maxResults": max_results,
        "order": "relevance",
        "textFormat": "plainText",
        "key": YOUTUBE_API_KEY,
    }
    try:
        r = requests.get(COMMENTS_API, params=params)
        r.raise_for_status()
        items = r.json().get("items", [])

        comments = []
        for item in items:
            top = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "text": top["textDisplay"],
                "likes": top["likeCount"],
            })
        return comments
    except Exception as e:
        logger.error(f"[COMMENTS] API Fetch failed: {e}")
        return []

def process_comments(video_id: str,top_n: int = 15 ) -> str:
    """
    The main entry point for the Orchestrator.
    Fetches, sorts, and summarizes comments into a single string.
    """
    # 1 fetch
    raw_comments = _get_raw_comments(video_id)
    if not raw_comments:
        return ""
    # 2 sort and select (high signal only )
    sorted_comments = sorted(raw_comments, key= lambda x: x["likes"], reverse=True)
    top_texts = [c["text"] for c in sorted_comments[:top_n]]

    # 2 summarize via LLm
    try:
        prompt = SUMMARY_PROMPT.format(
            comments = "\n".join(f"- {c}" for c in top_texts)
        )
        res = llm.invoke(prompt)
        summary = res.content if hasattr(res, "content") else res

        logger.info(f"[COMMENTS] Successfully processed insights for {video_id}")
        return summary
    except Exception as e:
        logger.error(f"[COMMENTS] LLM summary failed: {e}")
        # Fallback: just return the top 3 comments raw if LLM fails
        return "\n".join(top_texts[:3])
